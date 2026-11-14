import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "cyan-glow" | "teal-glow";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[#0b0f17] border-slate-800 text-slate-100",
      elevated: "bg-[#101520] border-slate-700/80 shadow-lg shadow-black/40 text-slate-100",
      bordered: "bg-[#0b0f17] border-cyan-500/30 text-slate-100",
      "cyan-glow":
        "bg-[#0b0f17] border-cyan-500/40 shadow-lg shadow-cyan-950/30 text-slate-100",
      "teal-glow":
        "bg-[#0b0f17] border-teal-500/40 shadow-lg shadow-teal-950/30 text-slate-100",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border transition-all duration-150",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 pb-3 border-b border-slate-800/60", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight text-white", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-xs text-slate-400 mt-1", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-4 text-sm text-slate-300", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-5 pt-3 border-t border-slate-800/60 text-xs text-slate-400",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
