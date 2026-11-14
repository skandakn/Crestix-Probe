/**
 * Crestix Probe - Authentication Form Validation & Password Strength Logic
 */

import {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  PasswordStrengthResult,
} from "../types";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const CALLSIGN_REGEX = /^[A-Z0-9-_]{2,15}$/i;

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: "Operator email identifier is required." };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, error: "Invalid telemetry address. Check formatting (e.g. user@domain.com)." };
  }
  return { isValid: true };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const feedback: string[] = [];
  if (!hasMinLength) feedback.push("Must be at least 8 characters long");
  if (!hasUppercase) feedback.push("Include at least one uppercase letter (A-Z)");
  if (!hasLowercase) feedback.push("Include at least one lowercase letter (a-z)");
  if (!hasNumber) feedback.push("Include at least one numeric digit (0-9)");
  if (!hasSpecialChar) feedback.push("Include at least one special symbol (!@#$%^&*)");

  let points = 0;
  if (hasMinLength) points += 1;
  if (hasUppercase && hasLowercase) points += 1;
  if (hasNumber) points += 1;
  if (hasSpecialChar) points += 1;

  // Bonus for length >= 12
  if (password.length >= 12 && points === 4) {
    points = 4;
  }

  const labels: PasswordStrengthResult["label"][] = [
    "Critical",
    "Weak",
    "Moderate",
    "Strong",
    "Fortified",
  ];

  return {
    score: Math.min(Math.max(points, 0), 4),
    label: labels[Math.min(Math.max(points, 0), 4)],
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    feedback,
  };
}

export function validateLoginForm(
  credentials: LoginCredentials
): Record<string, string> {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(credentials.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  if (!credentials.password) {
    errors.password = "Access key phrase is required.";
  } else if (credentials.password.length < 6) {
    errors.password = "Access key phrase must be at least 6 characters.";
  }

  return errors;
}

export function validateRegisterForm(
  data: RegisterData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Full operator name must be at least 2 characters.";
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  if (data.callsign && !CALLSIGN_REGEX.test(data.callsign.trim())) {
    errors.callsign = "Callsign must be 2-15 alphanumeric characters, dashes, or underscores.";
  }

  const strength = evaluatePasswordStrength(data.password || "");
  if (!data.password) {
    errors.password = "Security key phrase is required.";
  } else if (!strength.hasMinLength) {
    errors.password = "Security key phrase must be at least 8 characters.";
  } else if (strength.score < 2) {
    errors.password = `Security key too weak: ${strength.feedback.slice(0, 2).join(". ")}`;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirm your security key phrase.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Key phrase mismatch. Credentials must be identical.";
  }

  if (!data.acceptTerms) {
    errors.acceptTerms = "You must acknowledge the Crestix Mission Operation Protocol.";
  }

  return errors;
}

export function validateForgotPasswordForm(
  data: ForgotPasswordData
): Record<string, string> {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  return errors;
}
