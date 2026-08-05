import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-marigold-500 text-ink-950 hover:brightness-95",
  secondary: "bg-neem-900 text-chalk-0 hover:bg-neem-600",
  ghost: "border border-neem-100 text-ink-950 bg-transparent hover:border-neem-600 hover:bg-neem-100/40",
  danger: "bg-clay-600 text-chalk-0 hover:brightness-95",
  "danger-outline": "border border-clay-600 bg-transparent text-clay-600 hover:bg-clay-600 hover:text-chalk-0",
  link: "bg-transparent px-0 text-neem-600 underline-offset-4 hover:underline",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "min-h-11 px-4 py-2 text-body-s",
  md: "min-h-11 px-6 py-3 text-body-s",
};

export type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "link";
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
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}
