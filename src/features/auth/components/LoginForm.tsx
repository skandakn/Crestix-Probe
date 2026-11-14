"use client";

/**
 * Crestix Probe - LoginForm Component
 * Handles operator authentication, credential validation,
 * error notification, loading states, and redirect handling.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Loader2, AlertTriangle, KeyRound, Sparkles } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { useAuth } from "../context/AuthContext";
import { validateLoginForm } from "../utils/validation";
import { LoginCredentials } from "../types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/dashboard";

  const { login, isAuthenticated, error: contextError, clearError, isMockAdapter } = useAuth();

  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, router, redirectTarget]);

  // Clean errors when user changes inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
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

  const handleDemoFill = (email: string, pass: string) => {
    setFormData({
      email,
      password: pass,
      rememberMe: true,
    });
    setFormErrors({});
    setSubmissionError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmissionError(null);

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(formData);
      if (result.success) {
        router.push(redirectTarget);
      } else {
        setSubmissionError(result.error || "Enclave credentials rejected.");
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected authentication error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = submissionError || contextError;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Error Alert Banner */}
      {activeError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold tracking-wide uppercase text-rose-200">
              Clearance Failure:
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

      {/* Operator Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
        >
          Telemetry Address / Email
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="operator@crestix.space"
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? "email-error" : undefined}
            disabled={isSubmitting}
            className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500
              transition-all duration-150 outline-none
              ${
                formErrors.email
                  ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              }
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
            `}
          />
        </div>
        {formErrors.email && (
          <p
            id="email-error"
            role="alert"
            className="mt-1.5 text-xs font-mono text-rose-400 flex items-center gap-1"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {formErrors.email}
          </p>
        )}
      </div>

      {/* Access Key Phrase (Password) Input */}
      <div>
        <PasswordInput
          id="password"
          name="password"
          label="Security Key Phrase"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleInputChange}
          placeholder="••••••••••••"
          error={formErrors.password}
          disabled={isSubmitting}
        />
      </div>

      {/* Remember me & Forgot Password Row */}
      <div className="flex items-center justify-between text-xs font-mono pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200 transition-colors">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer"
          />
          <span>Persist Enclave Session</span>
        </label>

        <Link
          href="/forgot-password"
          className="text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-4 hover:underline"
        >
          Recover Key Phrase
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-3 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:from-cyan-700 active:to-teal-600 text-slate-950 font-mono font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Verifying Enclave Clearance...</span>
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>Authenticate Operator</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </>
        )}
      </button>

      {/* Quick Demo Pre-fill helpers (Active in mock adapter mode) */}
      {isMockAdapter && (
        <div className="pt-3 border-t border-slate-900">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/80 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rapid Test Credentials (Mock Enclave):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill("probe.lead@crestix.space", "Crestix#2026")}
              className="p-2 rounded border border-slate-800 bg-slate-900/60 hover:bg-cyan-950/30 hover:border-cyan-500/40 text-left text-[11px] font-mono transition-colors text-slate-300"
            >
              <div className="text-cyan-400 font-semibold">Lead Operator</div>
              <div className="text-slate-400 text-[10px] truncate">probe.lead@crestix.space</div>
              <div className="text-slate-400 text-[10px]">Clearance Level 4</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("surveyor.analyst@crestix.space", "Crestix#2026")}
              className="p-2 rounded border border-slate-800 bg-slate-900/60 hover:bg-cyan-950/30 hover:border-cyan-500/40 text-left text-[11px] font-mono transition-colors text-slate-300"
            >
              <div className="text-teal-400 font-semibold">Payload Analyst</div>
              <div className="text-slate-400 text-[10px] truncate">surveyor.analyst@crestix.space</div>
              <div className="text-slate-400 text-[10px]">Clearance Level 3</div>
            </button>
          </div>
        </div>
      )}

      {/* Register Link */}
      <div className="text-center pt-2">
        <p className="text-xs font-mono text-slate-400">
          New mission operator?{" "}
          <Link
            href="/register"
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline-offset-4 hover:underline"
          >
            Provision Enclave Credentials
          </Link>
        </p>
      </div>
    </form>
  );
}
