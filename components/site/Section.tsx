import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionMarker } from "./SectionMarker";

export function Section({ marker, className, children }: { marker: string; className?: string; children: ReactNode; snap?: boolean }) {
  return <section className={cn("public-section", className)}>
    <div className="container-content"><SectionMarker>{marker}</SectionMarker>{children}</div>
  </section>;
}
