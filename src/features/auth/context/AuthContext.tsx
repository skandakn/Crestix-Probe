"use client";

/**
 * Crestix Probe - Authentication Context & Provider
 * Manages reactive session state, status lifecycle, and adapter communication.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  AuthContextValue,
  AuthResponse,
  AuthSession,
  AuthStatus,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  User,
} from "../types";
import { getAuthAdapter } from "../adapters";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const adapter = useMemo(() => getAuthAdapter(), []);

  // Initialize session from adapter storage on mount
  const hydrateSession = useCallback(async () => {
    try {
      setStatus("loading");
      const current = await adapter.getCurrentSession();
      if (current) {
        setSession(current);
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch (err) {
      console.error("Failed to hydrate auth session", err);
      setSession(null);
      setStatus("unauthenticated");
    }
  }, [adapter]);

  useEffect(() => {
    // Asynchronously hydrate session
    const timer = setTimeout(() => {
      hydrateSession();
    }, 0);

    // Listen for storage changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "crestix_auth_session") {
        hydrateSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [hydrateSession]);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setError(null);
      setStatus("loading");
      try {
        const res = await adapter.login(credentials);
        if (res.success && res.session) {
          setSession(res.session);
          setStatus("authenticated");
          return res;
        } else {
          setError(res.error || "Authentication failed.");
          setStatus("unauthenticated");
          return res;
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during login.";
        setError(errorMsg);
        setStatus("unauthenticated");
        return { success: false, error: errorMsg };
      }
    },
    [adapter]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<AuthResponse> => {
      setError(null);
      setStatus("loading");
      try {
        const res = await adapter.register(data);
        if (res.success && res.session) {
          setSession(res.session);
          setStatus("authenticated");
          return res;
        } else {
          setError(res.error || "Registration rejected.");
          setStatus("unauthenticated");
          return res;
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during registration.";
        setError(errorMsg);
        setStatus("unauthenticated");
        return { success: false, error: errorMsg };
      }
    },
    [adapter]
  );

  const forgotPassword = useCallback(
    async (data: ForgotPasswordData): Promise<AuthResponse> => {
      setError(null);
      try {
        const res = await adapter.forgotPassword(data);
        if (!res.success && res.error) {
          setError(res.error);
        }
        return res;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to dispatch recovery request.";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [adapter]
  );

  const logout = useCallback(async (): Promise<void> => {
    setStatus("loading");
    try {
      await adapter.logout();
    } finally {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, [adapter]);

  const updateProfile = useCallback(
    async (updates: Partial<User>): Promise<User> => {
      try {
        const updated = await adapter.updateProfile(updates);
        setSession((prev) => (prev ? { ...prev, user: updated } : null));
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update profile";
        setError(msg);
        throw err;
      }
    },
    [adapter]
  );

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const refreshed = await adapter.refreshSession();
      if (refreshed) {
        setSession(refreshed);
        setStatus("authenticated");
      } else {
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setSession(null);
      setStatus("unauthenticated");
    }
  }, [adapter]);

  const value: AuthContextValue = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      status,
      isLoading: status === "loading",
      isAuthenticated: status === "authenticated" && session !== null,
      error,
      adapterName: adapter.name,
      isMockAdapter: adapter.isMock,
      login,
      register,
      forgotPassword,
      logout,
      updateProfile,
      clearError,
      refreshSession,
    }),
    [
      session,
      status,
      error,
      adapter.name,
      adapter.isMock,
      login,
      register,
      forgotPassword,
      logout,
      updateProfile,
      clearError,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
