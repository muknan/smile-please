import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  // ink-950 on marigold: never white text on the accent
  primary: "bg-marigold-500 text-ink-950",
  secondary: "bg-neem-900 text-chalk-0",
  ghost: "border border-neem-100 text-ink-950 bg-transparent",
  danger: "bg-clay-600 text-chalk-0",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-body-s",
  md: "px-6 py-3 text-body-s",
};

export type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  /** When set, renders an <a> with the same styles instead of a <button>. */
  href?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded font-utility font-medium transition",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}
