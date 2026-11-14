"use client";

/**
 * Crestix Probe - ForgotPasswordForm Component
 * Secure telemetry recovery signal dispatch form with countdown timer,
 * accessible error handling, and return-to-terminal navigation.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Radio, ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { validateForgotPasswordForm } from "../utils/validation";
import { ForgotPasswordData } from "../types";

export function ForgotPasswordForm() {
  const { forgotPassword, error: contextError, clearError } = useAuth();

  const [formData, setFormData] = useState<ForgotPasswordData>({ email: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (formErrors.email) {
      setFormErrors({});
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

    const validationErrors = validateForgotPasswordForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPassword(formData);
      if (result.success) {
        setIsSent(true);
        setResendCooldown(30); // 30s rate limit
      } else {
        setSubmissionError(result.error || "Failed to transmit recovery signal.");
      }
    } catch (err: unknown) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected transmission error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await forgotPassword(formData);
      setResendCooldown(30);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = submissionError || contextError;

  if (isSent) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-lg font-bold font-sans text-slate-100">
            Recovery Signal Dispatched
          </h2>
          <p className="mt-2 text-xs font-mono text-slate-400 leading-relaxed">
            Encrypted recovery instructions have been transmitted to{" "}
            <span className="text-cyan-400 font-semibold">{formData.email}</span>.
            Check your secure comms channel to restore enclave access.
          </p>
        </div>

        <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 text-[11px] font-mono text-slate-400 text-left space-y-1">
          <div className="text-cyan-400 font-semibold">SIGNAL TELEMETRY:</div>
          <div>&bull; PROTOCOL: QUANTUM-DIFFIE-HELLMAN KEY-EXCHANGE</div>
          <div>&bull; EXPIRATION: 15 MINUTES FROM DISPATCH</div>
          <div>&bull; SINGLE-USE RECOVERY ENVELOPE</div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            {resendCooldown > 0 ? (
              <span>Resend Signal in {resendCooldown}s</span>
            ) : (
              <span>Retransmit Recovery Signal</span>
            )}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 py-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Enclave Login
          </Link>
        </div>
      </div>
    );
  }

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
              Transmission Error:
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

      <div>
        <label
          htmlFor="forgot-email"
          className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
        >
          Operator Telemetry Address
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            placeholder="operator@crestix.space"
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? "forgot-email-error" : undefined}
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
            id="forgot-email-error"
            role="alert"
            className="mt-1.5 text-xs font-mono text-rose-400 flex items-center gap-1"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {formErrors.email}
          </p>
        )}
      </div>

      <div className="p-3 rounded-lg border border-slate-900 bg-slate-900/30 text-[11px] font-mono text-slate-400">
        Enter the registered telemetry address for your mission account. If recognized in the enclave directory, a cryptographically signed recovery key will be dispatched.
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-mono font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Transmitting Recovery Signal...</span>
          </>
        ) : (
          <>
            <Radio className="w-4 h-4 text-slate-950" />
            <span>Transmit Recovery Signal</span>
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Enclave Login
        </Link>
      </div>
    </form>
  );
}
