import * as React from "react";
import { ArchGlyph } from "@/components/site/Arch";

/**
 * Arch glyph + label-style eyebrow. Sits in the margin rail on desktop
 * (rail collapses below 900px — see layout), above the section on mobile.
 */
export function SectionMarker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <ArchGlyph size={24} className="text-marigold-500" />
      <span className="font-utility text-label uppercase text-neem-600">{children}</span>
    </div>
  );
}
