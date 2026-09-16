import { cn } from "@/lib/utils";

export const BRAND_TAGLINE = "Healthier smiles, within reach.";

type BrandVariant = "default" | "reversed" | "monochrome";

/** An original raised-hand mark with a smile set into the palm. */
export function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: BrandVariant;
}) {
  const faceColor = variant === "reversed" ? "#183C34" : "#F8F5ED";
  const sparkColor = variant === "monochrome" ? "currentColor" : "#E0B54B";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn(
        "h-9 w-9 shrink-0",
        variant === "reversed" ? "text-chalk-0" : "text-neem-900",
        className,
      )}
    >
      <g fill="currentColor">
        <rect x="14" y="13" width="8" height="25" rx="4" />
        <rect x="23" y="6" width="8" height="33" rx="4" />
        <rect x="32" y="4" width="8" height="35" rx="4" />
        <rect x="41" y="10" width="8" height="29" rx="4" />
        <rect x="9" y="24" width="9" height="24" rx="4.5" transform="rotate(-35 9 24)" />
        <rect x="14" y="27" width="36" height="29" rx="15" />
      </g>
      <path d="M23 39c2.2 5 5.7 7.5 9.8 7.5s7.6-2.5 9.8-7.5" stroke={faceColor} strokeLinecap="round" strokeWidth="3" />
      <path d="m54 6 1.6 4.4L60 12l-4.4 1.6L54 18l-1.6-4.4L48 12l4.4-1.6L54 6Z" fill={sparkColor} />
    </svg>
  );
}

export function BrandLockup({
  className,
  markClassName,
  showTagline = false,
  variant = "default",
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  variant?: BrandVariant;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", variant === "reversed" ? "text-chalk-0" : "text-neem-900", className)}>
      <BrandMark variant={variant} className={markClassName} />
      <span className="flex min-w-0 flex-col">
        <span className="whitespace-nowrap font-display text-[22px] font-semibold leading-none tracking-[-.045em]">Smile Please</span>
        {showTagline && (
          <span className={cn("mt-1 whitespace-nowrap font-utility text-[13px] leading-tight", variant === "reversed" ? "text-chalk-0/70" : "text-ink-950/70")}>
            {BRAND_TAGLINE}
          </span>
        )}
      </span>
    </span>
  );
}
