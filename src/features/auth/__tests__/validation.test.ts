import { describe, it, expect } from "vitest";
import {
  validateEmail,
  evaluatePasswordStrength,
  validateLoginForm,
  validateRegisterForm,
  validateForgotPasswordForm,
} from "../utils/validation";

describe("Authentication Validation Suite", () => {
  describe("validateEmail", () => {
    it("should accept valid telemetry email addresses", () => {
      expect(validateEmail("operator@crestix.space").isValid).toBe(true);
      expect(validateEmail("lead.scientist+probe@sub.agency.org").isValid).toBe(true);
      expect(validateEmail("user123@domain.co").isValid).toBe(true);
    });

    it("should reject empty or whitespace email", () => {
      const res1 = validateEmail("");
      expect(res1.isValid).toBe(false);
      expect(res1.error).toContain("required");

      const res2 = validateEmail("   ");
      expect(res2.isValid).toBe(false);
      expect(res2.error).toContain("required");
    });

    it("should reject malformed email addresses", () => {
      expect(validateEmail("not-an-email").isValid).toBe(false);
      expect(validateEmail("user@").isValid).toBe(false);
      expect(validateEmail("@crestix.space").isValid).toBe(false);
      expect(validateEmail("user@crestix").isValid).toBe(false);
    });
  });

  describe("evaluatePasswordStrength", () => {
    it("should flag short passwords as critical/weak", () => {
      const res = evaluatePasswordStrength("short");
      expect(res.hasMinLength).toBe(false);
      expect(res.score).toBeLessThanOrEqual(1);
      expect(res.feedback).toContain("Must be at least 8 characters long");
    });

    it("should detect missing character classes", () => {
      const res = evaluatePasswordStrength("lowercaseonly123");
      expect(res.hasUppercase).toBe(false);
      expect(res.hasSpecialChar).toBe(false);
      expect(res.score).toBeLessThan(4);
    });

    it("should grade strong passwords appropriately", () => {
      const res = evaluatePasswordStrength("Crestix#2026Secure!");
      expect(res.hasMinLength).toBe(true);
      expect(res.hasUppercase).toBe(true);
      expect(res.hasLowercase).toBe(true);
      expect(res.hasNumber).toBe(true);
      expect(res.hasSpecialChar).toBe(true);
      expect(res.score).toBe(4);
      expect(res.label).toBe("Fortified");
    });
  });

  describe("validateLoginForm", () => {
    it("should report errors when credentials are empty", () => {
      const errors = validateLoginForm({ email: "", password: "" });
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    });

    it("should report error for short passwords", () => {
      const errors = validateLoginForm({ email: "valid@crestix.space", password: "123" });
      expect(errors.password).toContain("at least 6 characters");
      expect(errors.email).toBeUndefined();
    });

    it("should pass when valid credentials are provided", () => {
      const errors = validateLoginForm({ email: "valid@crestix.space", password: "Password123!" });
      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe("validateRegisterForm", () => {
    it("should enforce all required registration fields", () => {
      const errors = validateRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });

      expect(errors.name).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.confirmPassword).toBeDefined();
      expect(errors.acceptTerms).toBeDefined();
    });

    it("should reject password confirmation mismatch", () => {
      const errors = validateRegisterForm({
        name: "Dr. Vance",
        email: "vance@crestix.space",
        password: "SuperSecret#2026",
        confirmPassword: "MismatchPassword123",
        acceptTerms: true,
      });

      expect(errors.confirmPassword).toContain("mismatch");
    });

    it("should reject invalid callsign format", () => {
      const errors = validateRegisterForm({
        name: "Dr. Vance",
        email: "vance@crestix.space",
        callsign: "INVALID CALLSIGN WITH SPACES!@#$",
        password: "SuperSecret#2026",
        confirmPassword: "SuperSecret#2026",
        acceptTerms: true,
      });

      expect(errors.callsign).toBeDefined();
    });

    it("should pass on fully compliant operator registration", () => {
      const errors = validateRegisterForm({
        name: "Dr. Elena Vance",
        callsign: "VANCE-01",
        email: "vance@crestix.space",
        password: "SuperSecret#2026",
        confirmPassword: "SuperSecret#2026",
        acceptTerms: true,
      });

      expect(Object.keys(errors).length).toBe(0);
    });
  });

  describe("validateForgotPasswordForm", () => {
    it("should enforce email requirement and format", () => {
      const emptyErr = validateForgotPasswordForm({ email: "" });
      expect(emptyErr.email).toBeDefined();

      const invalidErr = validateForgotPasswordForm({ email: "invalid-email" });
      expect(invalidErr.email).toBeDefined();

      const validErr = validateForgotPasswordForm({ email: "valid@crestix.space" });
      expect(Object.keys(validErr).length).toBe(0);
    });
  });
});
