import * as React from "react";
import { cn } from "@/lib/utils";

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-neem-100 text-ink-950",
  active: "bg-neem-600 text-chalk-0",
  success: "border border-neem-600 bg-chalk-0 text-neem-600",
  warning: "bg-marigold-500 text-ink-950",
  danger: "bg-clay-600 text-chalk-0",
};

export type BadgeProps = {
  tone?: "neutral" | "active" | "success" | "warning" | "danger";
} & React.HTMLAttributes<HTMLSpanElement>;

/** Status badge. Always renders its `children` as text — colour is never the only signal. */
export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 font-utility text-label uppercase tracking-[0.06em]",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
