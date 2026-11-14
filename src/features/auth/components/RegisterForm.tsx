"use client";

/**
 * Crestix Probe - RegisterForm Component
 * Operator provisioning form with real-time password strength telemetry,
 * credential matching, clearance-level selection, and accessible validation feedback.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Shield,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Compass,
} from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { useAuth } from "../context/AuthContext";
import {
  validateRegisterForm,
  evaluatePasswordStrength,
} from "../utils/validation";
import { ClearanceLevel, RegisterData } from "../types";

const CLEARANCE_OPTIONS: Array<{
  value: ClearanceLevel;
  label: string;
  desc: string;
}> = [
  {
    value: "LEVEL_1",
    label: "Level 1 — Public Payload",
    desc: "Read-only access to open celestial telemetry.",
  },
  {
    value: "LEVEL_2",
    label: "Level 2 — Telemetry Analyst",
    desc: "Standard instrument analytics and orbital scans.",
  },
  {
    value: "LEVEL_3",
    label: "Level 3 — Subsystem Operations",
    desc: "Payload control and probe trajectory planning.",
  },
  {
    value: "LEVEL_4",
    label: "Level 4 — Flight Dynamics Lead",
    desc: "Restricted command overrides and deep space steering.",
  },
];

export function RegisterForm() {
  const router = useRouter();
  const { register, error: contextError, clearError } = useAuth();

  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    callsign: "",
    email: "",
    organization: "",
    clearanceLevel: "LEVEL_2",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const passwordStrength = evaluatePasswordStrength(formData.password);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (submissionError) {
      setSubmissionError(null);
    }
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmissionError(null);

    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(formData);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setSubmissionError(result.error || "Provisioning rejected by Enclave.");
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected registration error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = submissionError || contextError;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Alert banner */}
      {activeError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold tracking-wide uppercase text-rose-200">
              Provisioning Error:
            </span>{" "}
            {activeError}
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmissionError(null);
              clearError();
            }}
            aria-label="Dismiss error notification"
            className="text-rose-400 hover:text-rose-200 focus:outline-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Name and Callsign Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="name"
            className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
          >
            Operator Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <UserIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Dr. Jordan Hayes"
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500
                transition-all duration-150 outline-none
                ${
                  formErrors.name
                    ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                }
              `}
            />
          </div>
          {formErrors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs font-mono text-rose-400">
              {formErrors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="callsign"
            className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
          >
            Operator Callsign
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="callsign"
              name="callsign"
              type="text"
              value={formData.callsign}
              onChange={handleInputChange}
              placeholder="AETHON-4"
              aria-invalid={!!formErrors.callsign}
              aria-describedby={formErrors.callsign ? "callsign-error" : undefined}
              disabled={isSubmitting}
              className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500
                transition-all duration-150 outline-none
                ${
                  formErrors.callsign
                    ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                }
              `}
            />
          </div>
          {formErrors.callsign && (
            <p id="callsign-error" role="alert" className="mt-1 text-xs font-mono text-rose-400">
              {formErrors.callsign}
            </p>
          )}
        </div>
      </div>

      {/* Telemetry Address (Email) */}
      <div>
        <label
          htmlFor="reg-email"
          className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
        >
          Telemetry Address / Email
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="j.hayes@crestix.space"
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? "reg-email-error" : undefined}
            disabled={isSubmitting}
            className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500
              transition-all duration-150 outline-none
              ${
                formErrors.email
                  ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              }
            `}
          />
        </div>
        {formErrors.email && (
          <p id="reg-email-error" role="alert" className="mt-1 text-xs font-mono text-rose-400">
            {formErrors.email}
          </p>
        )}
      </div>

      {/* Security Clearance Selection & Organization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="clearanceLevel"
            className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
          >
            Security Clearance
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
            <select
              id="clearanceLevel"
              name="clearanceLevel"
              value={formData.clearanceLevel}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg text-xs font-mono text-slate-200 outline-none cursor-pointer"
            >
              {CLEARANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="organization"
            className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
          >
            Mission Division / Org
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Building className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="organization"
              name="organization"
              type="text"
              value={formData.organization}
              onChange={handleInputChange}
              placeholder="Astrobiology Lab"
              disabled={isSubmitting}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Password Field */}
      <div>
        <PasswordInput
          id="reg-password"
          name="password"
          label="Security Key Phrase"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Min 8 chars with symbols & numbers"
          error={formErrors.password}
          disabled={isSubmitting}
        />

        {/* Real-time Password Strength Meter */}
        {formData.password && (
          <div className="mt-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <span className="text-slate-400">Key Phrase Entropy:</span>
              <span
                className={`font-semibold tracking-wide uppercase ${
                  passwordStrength.score <= 1
                    ? "text-rose-400"
                    : passwordStrength.score === 2
                    ? "text-amber-400"
                    : passwordStrength.score === 3
                    ? "text-cyan-400"
                    : "text-emerald-400"
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>

            {/* 4-segment Strength Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5 mb-2">
              {[0, 1, 2, 3].map((lvl) => (
                <div
                  key={lvl}
                  className={`h-full rounded-full transition-all duration-300 ${
                    passwordStrength.score > lvl
                      ? lvl === 0
                        ? "bg-rose-500"
                        : lvl === 1
                        ? "bg-amber-500"
                        : lvl === 2
                        ? "bg-cyan-500"
                        : "bg-emerald-400"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>

            {/* Criteria checklist */}
            <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
              <span className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? "text-emerald-400" : ""}`}>
                {passwordStrength.hasMinLength ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                8+ Characters
              </span>
              <span className={`flex items-center gap-1 ${passwordStrength.hasUppercase && passwordStrength.hasLowercase ? "text-emerald-400" : ""}`}>
                {passwordStrength.hasUppercase && passwordStrength.hasLowercase ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                Upper & Lowercase
              </span>
              <span className={`flex items-center gap-1 ${passwordStrength.hasNumber ? "text-emerald-400" : ""}`}>
                {passwordStrength.hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                Numeric Digit
              </span>
              <span className={`flex items-center gap-1 ${passwordStrength.hasSpecialChar ? "text-emerald-400" : ""}`}>
                {passwordStrength.hasSpecialChar ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                Special Symbol
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Security Key Phrase"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleInputChange}
          placeholder="Re-enter key phrase"
          error={formErrors.confirmPassword}
          disabled={isSubmitting}
        />
      </div>

      {/* Protocol Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-mono text-slate-400 hover:text-slate-300 transition-colors">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer"
          />
          <span>
            I acknowledge adherence to the{" "}
            <span className="text-cyan-400 hover:underline">
              Crestix Probe Mission Security Protocols
            </span>{" "}
            and authorization directives.
          </span>
        </label>
        {formErrors.acceptTerms && (
          <p role="alert" className="mt-1 text-xs font-mono text-rose-400">
            {formErrors.acceptTerms}
          </p>
        )}
      </div>

      {/* Submit Provisioning Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-4 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:from-cyan-700 text-slate-950 font-mono font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Provisioning Enclave Credentials...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Provision Operator Enclave</span>
          </>
        )}
      </button>

      {/* Back to Login Link */}
      <div className="text-center pt-2">
        <p className="text-xs font-mono text-slate-400">
          Already have verified credentials?{" "}
          <Link
            href="/login"
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline-offset-4 hover:underline"
          >
            Authenticate at Terminal
          </Link>
        </p>
      </div>
    </form>
  );
}
