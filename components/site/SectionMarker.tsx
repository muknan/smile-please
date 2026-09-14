import type { ReactNode } from "react";
export function SectionMarker({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-8 flex items-center gap-3 text-neem-900"><span aria-hidden="true" className="h-px w-8 bg-current" />{children}</p>;
}
