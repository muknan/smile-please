import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionMarker } from "./SectionMarker";

/**
 * Public-page section with the master layout: body text on columns 2–9,
 * the arch-gylph section marker in the columns 10–12 margin rail on desktop.
 * The rail appears only at lg (1280px) in this config; below that the marker
 * moves above the section (D-49 — comment brought in line with `lg:`).
 *
 * Sections snap into the global `scroll-snap-type: y proximity` by default so
 * stacked sections latch cleanly on scrolling pages (the homepage). Set
 * `snap={false}` for content/legal/booking pages where section snapping would
 * get in the way.
 */
export function Section({
  marker,
  className,
  children,
  snap = true,
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
