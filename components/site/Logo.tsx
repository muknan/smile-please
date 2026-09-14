import { cn } from "@/lib/utils";

export function SmileMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("h-10 w-10 shrink-0", className)}>
    <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2" />
    <path d="M12 25c2 8 8 12 12 12s10-4 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 16h1m14 0h1" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

export function Logo({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center gap-3", className)}>
    <SmileMark />
    <span className="whitespace-nowrap font-display text-[23px] font-semibold leading-none tracking-[-.035em]">Smile Please<span className="mt-1.5 block font-utility text-[9px] font-medium uppercase tracking-[.2em]">A little care. A lot of possibility.</span></span>
  </span>;
}
