/**
 * Crestix Probe - Authentication Feature Index
 * Public API for Member 3 Authentication & User Workspace
 */

// Types
export * from "./types";

// Context & Hooks
export { AuthProvider, useAuth } from "./context/AuthContext";
export { useRequireAuth } from "./hooks/useRequireAuth";

// Adapters
export {
  getAuthAdapter,
  setActiveAdapter,
  MockAuthAdapter,
  ApiAuthAdapter,
} from "./adapters";

// Components
export { AuthLayout } from "./components/AuthLayout";
export { LoginForm } from "./components/LoginForm";
export { RegisterForm } from "./components/RegisterForm";
export { ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { PasswordInput } from "./components/PasswordInput";
export { UserProfileMenu } from "./components/UserProfileMenu";
export { ProtectedRoute } from "./components/ProtectedRoute";
export { TerrainBackground } from "./components/TerrainBackground";

// Validation & Utilities
export {
  validateEmail,
  evaluatePasswordStrength,
  validateLoginForm,
  validateRegisterForm,
  validateForgotPasswordForm,
} from "./utils/validation";
