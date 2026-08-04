import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The Arch — one shape, used everywhere: a Mughal arch (Delhi) and a dental arch.
 * Mount <ArchClipDefs /> once in the root layout, then clip with url(#arch-clip).
 */
export function ArchClipDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="arch-clip" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.458 C0,0.25 0.2,0.1 0.5,0 C0.8,0.1 1,0.25 1,0.458 L1,1 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Small filled arch used as a section marker glyph. Fill via `className` (currentColor). */
export function ArchGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M0,24 L0,11 C0,6 4.8,2.4 12,0 C19.2,2.4 24,6 24,11 L24,24 Z"
      />
    </svg>
  );
}

/**
 * A container clipped into the arch. With `keyline`, overlays a 1.5px marigold
 * outline of the arch (drawn in path space, so it tracks the clip exactly).
 */
export function ArchFrame({
  keyline = false,
  className,
  children,
}: {
  keyline?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)} style={{ clipPath: "url(#arch-clip)" }}>
      {children}
      {keyline && (
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
        >
          <path
            d="M0,1 L0,0.458 C0,0.25 0.2,0.1 0.5,0 C0.8,0.1 1,0.25 1,0.458"
            fill="none"
            stroke="#E9A227"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}
