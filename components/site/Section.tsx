import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionMarker } from "./SectionMarker";

/**
 * Public-page section with the master layout: body text on columns 2–9,
 * the arch-gylph section marker in the columns 10–12 margin rail on desktop.
 * The rail appears only at lg (1280px) in this config; below that the marker
 * moves above the section (D-49 — comment brought in line with `lg:`).
 *
 * Sections can opt into the global `scroll-snap-type: y proximity` — used only
 * on pages deliberately divided into section-like blocks (homepage, about,
 * care). It defaults OFF; pass `snap` where section snapping is wanted.
 * Forms, listings, article and reading pages must stay on free scrolling.
 */
export function Section({
  marker,
  className,
  children,
  snap = false,
}: {
  marker: string;
  className?: string;
  children: React.ReactNode;
  snap?: boolean;
}) {
  return (
    <section className={cn(snap && "snap-start", className ?? "py-16")}>
      <div className="container-content grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3 lg:col-start-10">
          <SectionMarker>{marker}</SectionMarker>
        </div>
        <div className="lg:col-span-8 lg:col-start-2">{children}</div>
      </div>
    </section>
  );
}
