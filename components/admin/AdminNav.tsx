"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AdminCounts = {
  bookings: number;
  inbox: number;
  dentists: number;
};

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/dentists", label: "Dentists" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/exports", label: "Exports" },
] as const;

function countFor(href: string, counts: AdminCounts): number {
  if (href === "/admin") return counts.bookings + counts.inbox + counts.dentists;
  if (href === "/admin/bookings") return counts.bookings;
  if (href === "/admin/inbox") return counts.inbox;
  if (href === "/admin/dentists") return counts.dentists;
  return 0;
}

function itemClass(active: boolean) {
  return cn(
    "flex items-center justify-between rounded px-3 py-2 font-utility text-body-s transition",
    active ? "bg-chalk-0/10 text-chalk-0" : "text-chalk-0/70 hover:bg-chalk-0/5 hover:text-chalk-0",
  );
}

export function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname();

  const badge = (n: number) =>
    n > 0 && (
      <span className="rounded-full bg-marigold-500 px-2 py-0.5 font-utility text-data font-bold text-ink-950">
        {n}
      </span>
    );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-neem-900 p-4 md:flex">
        <Link href="/admin" className="px-3 py-2 font-utility text-body font-bold text-chalk-0">
          Smile Please
        </Link>
        <p className="px-3 pb-4 font-utility text-label uppercase text-chalk-0/50">Admin</p>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {ITEMS.map((it) => {
            const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
            const n = countFor(it.href, counts);
            return (
              <Link key={it.href} href={it.href} className={itemClass(active)}>
                <span>{it.label}</span>
                {badge(n)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-neem-100 bg-neem-900 md:hidden">
        {ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href));
          const n = countFor(it.href, counts);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 px-1 py-3 font-utility text-data",
                active ? "text-chalk-0" : "text-chalk-0/60",
              )}
            >
              <span className="truncate">{it.label}</span>
              {n > 0 && (
                <span className="rounded-full bg-marigold-500 px-1.5 font-utility text-data font-bold text-ink-950">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
