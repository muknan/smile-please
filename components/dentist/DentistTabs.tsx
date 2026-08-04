"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dentist/appointments", label: "Appointments" },
  { href: "/dentist/availability", label: "Availability" },
  { href: "/dentist/profile", label: "Profile" },
];

export function DentistTabs() {
  const pathname = usePathname();
  return (
    <nav className="mt-10 flex flex-wrap gap-2" aria-label="Dentist sections">
      {TABS.map((tab) => {
        const isActive = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded border border-neem-100 bg-chalk-0 px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition hover:border-neem-600",
              isActive && "border-neem-600 bg-neem-600 text-chalk-0",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
