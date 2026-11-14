import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090e] disabled:opacity-50 disabled:pointer-events-none rounded-md select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-cyan-500 hover:bg-cyan-400 text-[#07090e] font-semibold shadow-md shadow-cyan-500/20 active:translate-y-[1px]",
      secondary:
        "bg-teal-500 hover:bg-teal-400 text-[#07090e] font-semibold shadow-md shadow-teal-500/20 active:translate-y-[1px]",
      outline:
        "border border-slate-700 bg-[#0b0f17] hover:bg-[#151d2c] text-slate-200 hover:text-white hover:border-cyan-500/50 shadow-sm",
      ghost:
        "text-slate-300 hover:text-white hover:bg-[#151d2c] border border-transparent",
      destructive:
        "bg-red-600/90 hover:bg-red-500 text-white font-medium shadow-md shadow-red-600/20 active:translate-y-[1px]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
