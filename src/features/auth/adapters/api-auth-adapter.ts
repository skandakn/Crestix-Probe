/**
 * Crestix Probe - API Authentication Adapter
 * Production REST client interfacing with Member 9's Backend Authentication Service.
 *
 * All network requests use standard fetch with Bearer token authentication.
 * Configured via NEXT_PUBLIC_AUTH_API_URL environment variable.
 */

import {
  AuthAdapter,
  AuthResponse,
  AuthSession,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  User,
} from "../types";

const STORAGE_SESSION_KEY = "crestix_auth_session";

export interface ApiAuthAdapterConfig {
  baseUrl?: string;
  timeoutMs?: number;
}

export class ApiAuthAdapter implements AuthAdapter {
  public readonly name = "ApiAuthAdapter";
  public readonly isMock = false;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config?: ApiAuthAdapterConfig) {
    const serverBackendUrl =
      typeof window === "undefined" && process.env.BACKEND_URL
        ? `${process.env.BACKEND_URL.replace(/\/$/, "")}/api/v1/auth`
        : undefined;

    this.baseUrl =
      config?.baseUrl ||
      serverBackendUrl ||
      process.env.NEXT_PUBLIC_AUTH_API_URL ||
      "/api/v1/auth";
    this.timeoutMs = config?.timeoutMs || 10000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const session = await this.getCurrentSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          data.error ||
          data.message ||
          `Backend request failed with status code ${response.status}.`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Authentication request timed out. Check network connection.");
        }
        throw err;
      }
      throw new Error("An unexpected error occurred during authentication.");
    }
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const data = await this.request<{
        success: boolean;
        session: AuthSession;
        user: User;
        message?: string;
      }>("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      if (data.session) {
        this.persistSession(data.session);
      }

      return {
        success: true,
        session: data.session,
        user: data.user,
        message: data.message || "Enclave session authorized.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to authenticate.",
      };
    }
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.request<{
        success: boolean;
        session: AuthSession;
        user: User;
        message?: string;
      }>("/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.session) {
        this.persistSession(response.session);
      }

      return {
        success: true,
        session: response.session,
        user: response.user,
        message: response.message || "Operator provisioned successfully.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Registration request failed.",
      };
    }
  }

  public async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    try {
      const response = await this.request<{
        success: boolean;
        message?: string;
      }>("/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      return {
        success: true,
        message:
          response.message ||
          "Password recovery telemetry transmitted if the address is registered.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to dispatch recovery request.",
      };
    }
  }

  public async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const response = await this.request<{
        success: boolean;
        message?: string;
      }>("/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      return {
        success: true,
        message: response.message || "Credentials successfully reset.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to reset security key phrase.",
      };
    }
  }

  public async getCurrentSession(): Promise<AuthSession | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public async refreshSession(): Promise<AuthSession | null> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return null;

      const data = await this.request<{
        session: AuthSession;
      }>("/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (data.session) {
        this.persistSession(data.session);
        return data.session;
      }
      return null;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.request<void>("/logout", {
        method: "POST",
      }).catch(() => {
        // Ignore server error on logout to always clean local storage
      });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    }
  }

  public async updateProfile(updates: Partial<User>): Promise<User> {
    const data = await this.request<{ user: User }>("/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    const currentSession = await this.getCurrentSession();
    if (currentSession && data.user) {
      const updatedSession: AuthSession = {
        ...currentSession,
        user: data.user,
      };
      this.persistSession(updatedSession);
    }

    return data.user;
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      } catch (err) {
        console.error("Failed to persist auth session", err);
      }
    }
  }
}
