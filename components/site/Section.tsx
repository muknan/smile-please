import * as React from "react";
import { SectionMarker } from "./SectionMarker";

/**
 * Public-page section with the master layout: body text on columns 2–9,
 * the arch-gylph section marker in the columns 10–12 margin rail on desktop.
 * The rail collapses below 900px — the marker moves above the section.
 */
export function Section({
  marker,
  className,
  children,
}: {
  marker: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className ?? "py-16"}>
      <div className="container-content grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3 lg:col-start-10">
          <SectionMarker>{marker}</SectionMarker>
        </div>
        <div className="lg:col-span-8 lg:col-start-2">{children}</div>
      </div>
    </section>
  );
}
