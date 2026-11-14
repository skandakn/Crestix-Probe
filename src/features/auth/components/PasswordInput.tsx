"use client";

/**
 * Crestix Probe - PasswordInput Component
 * Accessible password input featuring toggleable visibility,
 * dark scientific input states, and keyboard navigation support.
 */

import React, { useState, forwardRef, useId } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      hint,
      id: providedId,
      className = "",
      containerClassName = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const toggleVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsVisible((prev) => !prev);
    };

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-xs font-mono font-medium tracking-wider text-slate-300 uppercase"
          >
            {label}
          </label>
        )}

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>

          <input
            {...props}
            ref={ref}
            id={inputId}
            type={isVisible ? "text" : "password"}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            className={`w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border rounded-lg text-sm font-sans text-slate-100 placeholder-slate-500
              transition-all duration-150 outline-none
              ${
                error
                  ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  : "border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              }
              ${disabled ? "opacity-50 cursor-not-allowed bg-slate-900/50" : ""}
              ${className}
            `}
          />

          <button
            type="button"
            onClick={toggleVisibility}
            disabled={disabled}
            aria-label={isVisible ? "Hide security key phrase" : "Show security key phrase"}
            aria-pressed={isVisible}
            tabIndex={0}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 focus:outline-none focus:text-cyan-400 transition-colors"
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-[11px] font-mono text-slate-400">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-mono text-rose-400 flex items-center gap-1"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
