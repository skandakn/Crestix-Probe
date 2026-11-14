import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "teal" | "slate" | "warning" | "destructive" | "outline" | "default";
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#151d2c] text-slate-300 border-slate-700/80",
    cyan: "bg-cyan-950/60 text-cyan-300 border-cyan-500/30",
    teal: "bg-teal-950/60 text-teal-300 border-teal-500/30",
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    warning: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    destructive: "bg-red-950/60 text-red-300 border-red-500/30",
    outline: "bg-transparent text-slate-400 border-slate-700",
  };

  const dotColors = {
    default: "bg-slate-400",
    cyan: "bg-cyan-400",
    teal: "bg-teal-400",
    slate: "bg-slate-400",
    warning: "bg-amber-400",
    destructive: "bg-red-400",
    outline: "bg-slate-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded-full border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
