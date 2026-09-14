import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({ className, children }: { marker?: string; className?: string; children: ReactNode; snap?: boolean }) {
  return <section className={cn("public-section", className)}>
    <div className="container-content">{children}</div>
  </section>;
}
