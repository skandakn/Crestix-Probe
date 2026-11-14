import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg";
  variant?: "cyan" | "teal" | "slate";
}

export function LoadingSpinner({
  size = "md",
  variant = "cyan",
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  const variantStyles = {
    cyan: "text-cyan-400",
    teal: "text-teal-400",
    slate: "text-slate-400",
  };

  return (
    <Loader2
      className={cn("animate-spin", sizeStyles[size], variantStyles[variant], className)}
      {...props}
    />
  );
}

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-800/70 border border-slate-700/40", className)}
      {...props}
    />
  );
}

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  subMessage?: string;
}

export function LoadingState({
  message = "Acquiring probe telemetry stream...",
  subMessage = "Synchronizing packet downlink with orbital relay",
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-xl bg-[#0b0f17] border border-slate-800",
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center w-14 h-14 mb-4">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-60" />
        <div className="relative p-3 rounded-full bg-cyan-950/40 border border-cyan-500/40">
          <LoadingSpinner size="md" variant="cyan" />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-slate-200 font-mono tracking-wide">{message}</h4>
      {subMessage && <p className="text-xs text-slate-400 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
}
