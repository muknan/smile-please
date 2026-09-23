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
  if (!reversed) {
    return (
      <span className="inline-grid shrink-0">
        <Image
          src={LOGO_ASSETS.default}
          alt=""
          aria-hidden="true"
          width={300}
          height={72}
          className={cn("theme-logo-light col-start-1 row-start-1 h-10 w-auto", className)}
        />
        <Image
          src={LOGO_ASSETS.reversed}
          alt=""
          aria-hidden="true"
          width={300}
          height={72}
          className={cn("theme-logo-dark col-start-1 row-start-1 h-10 w-auto", className)}
        />
      </span>
    );
  }
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
