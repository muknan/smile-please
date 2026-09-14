import { cn } from "@/lib/utils";

/** The compact Smile Please mark: a welcoming smile and a four-point spark. */
export function SmileMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("h-9 w-9 shrink-0", className)}>
      <path d="M9 24c3.1 8.2 9.3 12.3 15 12.3S35.9 32.2 39 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="m33 4 2.2 6.8L42 13l-6.8 2.2L33 22l-2.2-6.8L24 13l6.8-2.2L33 4Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-neem-900", className)}>
      <SmileMark />
      <span className="whitespace-nowrap font-display text-[22px] font-semibold leading-none tracking-[-.045em]">Smile Please</span>
    </span>
  );
}
