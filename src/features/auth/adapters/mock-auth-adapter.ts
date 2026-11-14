/**
 * Crestix Probe - Mock Authentication Adapter
 *
 * NOTE: For local development and demonstration only.
 * This adapter simulates network latency, session persistence, and credential validation.
 * DO NOT represent or use this mock authentication adapter for production security.
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

const MOCK_STORAGE_SESSION_KEY = "crestix_auth_session";
const MOCK_STORAGE_USERS_KEY = "crestix_mock_users";
const MOCK_BANNER_LOGGED_KEY = "crestix_mock_adapter_logged";

const SEED_USERS: Array<User & { passwordHash: string }> = [
  {
    id: "usr_crestix_lead_01",
    email: "probe.lead@crestix.space",
    passwordHash: "Crestix#2026",
    name: "Dr. Elena Vance",
    callsign: "PROBE-LEAD",
    role: "lead_investigator",
    clearanceLevel: "LEVEL_4",
    organization: "Crestix Planetary Instrumentation Group",
    department: "Deep Space Signal Intelligence",
    avatarUrl: "",
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "usr_crestix_surveyor_02",
    email: "surveyor.analyst@crestix.space",
    passwordHash: "Crestix#2026",
    name: "Marcus Sterling",
    callsign: "SURVEYOR-9",
    role: "payload_specialist",
    clearanceLevel: "LEVEL_3",
    organization: "Lunar & Asteroid Reconnaissance",
    department: "Spectrometry & Terrain Mapping",
    avatarUrl: "",
    mfaEnabled: false,
    lastLoginAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: "2026-02-01T12:00:00.000Z",
  },
];

export class MockAuthAdapter implements AuthAdapter {
  public readonly name = "MockAuthAdapter";
  public readonly isMock = true;
  private latencyMs: number;

  constructor(options?: { latencyMs?: number }) {
    this.latencyMs = options?.latencyMs ?? 250;
    this.warnMockUsage();
  }

  private warnMockUsage(): void {
    if (typeof window !== "undefined") {
      if (!sessionStorage.getItem(MOCK_BANNER_LOGGED_KEY)) {
        console.warn(
          "%c[CRESTIX PROBE DEV NOTICE]%c MockAuthAdapter is active. Using isolated mock security for development. NOT intended for production deployment.",
          "background: #0d1e38; color: #38bdf8; font-weight: bold; padding: 2px 6px; border-radius: 4px;",
          "color: #94a3b8;"
        );
        sessionStorage.setItem(MOCK_BANNER_LOGGED_KEY, "true");
      }
    }
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((res) => setTimeout(res, this.latencyMs));
    }
  }

  private getStoredUsers(): Array<User & { passwordHash: string }> {
    if (typeof window === "undefined") {
      return [...SEED_USERS];
    }
    try {
      const raw = localStorage.getItem(MOCK_STORAGE_USERS_KEY);
      if (!raw) {
        localStorage.setItem(MOCK_STORAGE_USERS_KEY, JSON.stringify(SEED_USERS));
        return [...SEED_USERS];
      }
      return JSON.parse(raw);
    } catch {
      return [...SEED_USERS];
    }
  }

  private saveStoredUsers(users: Array<User & { passwordHash: string }>): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MOCK_STORAGE_USERS_KEY, JSON.stringify(users));
      } catch (err) {
        console.error("Failed to save mock users to localStorage", err);
      }
    }
  }

  private sanitizeUser(userWithPassword: User & { passwordHash?: string }): User {
    const user = { ...userWithPassword };
    delete user.passwordHash;
    return user;
  }

  private generateMockToken(userId: string): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: userId,
        iss: "crestix-probe-mock",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    );
    const signature = btoa(`sig_${userId}_${Date.now()}`);
    return `${header}.${payload}.${signature}`;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.delay();

    const normalizedEmail = credentials.email.trim().toLowerCase();
    const users = this.getStoredUsers();

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!matchedUser) {
      return {
        success: false,
        error: "Operator telemetry address not found in Enclave directory.",
      };
    }

    if (matchedUser.passwordHash !== credentials.password) {
      return {
        success: false,
        error: "Access key phrase verification failed. Check security credentials.",
      };
    }

    // Update lastLogin
    const updatedUser: User = {
      ...this.sanitizeUser(matchedUser),
      lastLoginAt: new Date().toISOString(),
    };

    const sessionDurationMs = credentials.rememberMe
      ? 7 * 24 * 60 * 60 * 1000 // 7 days
      : 24 * 60 * 60 * 1000; // 24 hours

    const session: AuthSession = {
      user: updatedUser,
      token: this.generateMockToken(updatedUser.id),
      refreshToken: `mock_refresh_${updatedUser.id}`,
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionDurationMs,
    };

    this.persistSession(session);

    return {
      success: true,
      session,
      user: updatedUser,
      message: `Enclave access granted. Welcome, ${updatedUser.callsign || updatedUser.name}.`,
    };
  }

  public async register(data: RegisterData): Promise<AuthResponse> {
    await this.delay();

    const normalizedEmail = data.email.trim().toLowerCase();
    const users = this.getStoredUsers();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return {
        success: false,
        error: "An operator account is already registered with this telemetry address.",
      };
    }

    const newUser: User & { passwordHash: string } = {
      id: `usr_crestix_${Date.now()}`,
      email: normalizedEmail,
      name: data.name.trim(),
      callsign: data.callsign?.trim().toUpperCase() || `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      role: "operator",
      clearanceLevel: data.clearanceLevel || "LEVEL_2",
      organization: data.organization?.trim() || "Crestix Science Laboratory",
      department: "Subsystem Telemetry",
      avatarUrl: "",
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      passwordHash: data.password,
    };

    users.push(newUser);
    this.saveStoredUsers(users);

    const session: AuthSession = {
      user: this.sanitizeUser(newUser),
      token: this.generateMockToken(newUser.id),
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    this.persistSession(session);

    return {
      success: true,
      session,
      user: this.sanitizeUser(newUser),
      message: "Operator profile provisioned successfully. Enclave active.",
    };
  }

  public async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    await this.delay();

    const normalizedEmail = data.email.trim().toLowerCase();
    const users = this.getStoredUsers();
    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);

    // For security protocols, always indicate success message even if not found
    if (!exists) {
      return {
        success: true,
        message: "If the telemetry address exists in our enclave, an encrypted recovery dispatch was transmitted.",
      };
    }

    return {
      success: true,
      message: `Recovery signal transmitted to ${normalizedEmail}. Check your secure terminal.`,
    };
  }

  public async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    await this.delay();

    if (!data.token || data.token.length < 4) {
      return {
        success: false,
        error: "Security reset token is expired or corrupted.",
      };
    }

    return {
      success: true,
      message: "Security key phrase updated. You may now access the enclave.",
    };
  }

  public async getCurrentSession(): Promise<AuthSession | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = localStorage.getItem(MOCK_STORAGE_SESSION_KEY);
      if (!raw) return null;

      const session: AuthSession = JSON.parse(raw);

      // Verify expiration
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(MOCK_STORAGE_SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  public async refreshSession(): Promise<AuthSession | null> {
    const current = await this.getCurrentSession();
    if (!current) return null;

    const refreshed: AuthSession = {
      ...current,
      token: this.generateMockToken(current.user.id),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    this.persistSession(refreshed);
    return refreshed;
  }

  public async logout(): Promise<void> {
    await this.delay();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(MOCK_STORAGE_SESSION_KEY);
      } catch (err) {
        console.error("Failed to clear mock session", err);
      }
    }
  }

  public async updateProfile(updates: Partial<User>): Promise<User> {
    await this.delay();
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error("No active session to update profile.");
    }

    const updatedUser: User = {
      ...current.user,
      ...updates,
      id: current.user.id,
      email: current.user.email,
    };

    const users = this.getStoredUsers();
    const idx = users.findIndex((u) => u.id === current.user.id);
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        ...updates,
      };
      this.saveStoredUsers(users);
    }

    const updatedSession: AuthSession = {
      ...current,
      user: updatedUser,
    };

    this.persistSession(updatedSession);
    return updatedUser;
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MOCK_STORAGE_SESSION_KEY, JSON.stringify(session));
      } catch (err) {
        console.error("Failed to store mock auth session", err);
      }
    }
  }

  /**
   * Helper method for testing: allows clearing mock users
   */
  public resetMockDatabase(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(MOCK_STORAGE_USERS_KEY);
      localStorage.removeItem(MOCK_STORAGE_SESSION_KEY);
    }
  }
}
