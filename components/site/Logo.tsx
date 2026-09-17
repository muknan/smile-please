import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASSETS = {
  default: "/brand/soft-embrace-header.svg",
  reversed: "/brand/soft-embrace-reversed.svg",
} as const;

/** The approved Soft Embrace compact mark. */
export function SmileMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/soft-embrace-compact.svg"
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      className={cn("h-9 w-9 shrink-0", className)}
    />
  );
}

export function Logo({
  className,
  reversed = false,
}: {
  className?: string;
  reversed?: boolean;
}) {
  return (
    <Image
      src={LOGO_ASSETS[reversed ? "reversed" : "default"]}
      alt=""
      aria-hidden="true"
      width={300}
      height={72}
      className={cn("h-10 w-auto shrink-0", className)}
    />
  );
}
