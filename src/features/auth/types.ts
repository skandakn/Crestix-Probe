/**
 * Crestix Probe - Authentication Domain Types
 * Unified interface and type system for Authentication, Sessions, and User Workspace.
 */

export type ClearanceLevel =
  | "LEVEL_1" // Public Payload & Data Viewer
  | "LEVEL_2" // Telemetry Analyst
  | "LEVEL_3" // Subsystem Operations Specialist
  | "LEVEL_4" // Flight Dynamics & Deep Space Lead
  | "DIRECTORATE"; // High Command & Mission Directorate

export type UserRole =
  | "operator"
  | "researcher"
  | "payload_specialist"
  | "systems_engineer"
  | "lead_investigator"
  | "administrator";

export interface User {
  id: string;
  email: string;
  name: string;
  callsign: string;
  role: UserRole;
  clearanceLevel: ClearanceLevel;
  organization?: string;
  avatarUrl?: string;
  department?: string;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: number; // Unix epoch ms
  issuedAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  callsign?: string;
  clearanceLevel?: ClearanceLevel;
  organization?: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  session?: AuthSession;
  user?: User;
  error?: string;
  message?: string;
  details?: Record<string, string[]>;
}

export interface PasswordStrengthResult {
  score: number; // 0 (weak) to 4 (fortified)
  label: "Critical" | "Weak" | "Moderate" | "Strong" | "Fortified";
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  feedback: string[];
}

/**
 * Authentication Adapter Interface (Provider Abstraction)
 * Decouples the presentation layer from the concrete auth provider.
 * Allows zero-rewrite switching between MockAuthAdapter and ApiAuthAdapter (Member 9 backend).
 */
export interface AuthAdapter {
  readonly name: string;
  readonly isMock: boolean;

  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(data: RegisterData): Promise<AuthResponse>;
  forgotPassword(data: ForgotPasswordData): Promise<AuthResponse>;
  resetPassword(data: ResetPasswordData): Promise<AuthResponse>;
  getCurrentSession(): Promise<AuthSession | null>;
  refreshSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  updateProfile(updates: Partial<User>): Promise<User>;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  adapterName: string;
  isMockAdapter: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  forgotPassword: (data: ForgotPasswordData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}
