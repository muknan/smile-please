"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Children", "Gum health", "Prevention", "Camps"] as const;
type Category = (typeof CATEGORIES)[number];

function ResultsSkeleton() {
  const line = "block rounded bg-neem-100/75";
  return (
    <div className="absolute inset-x-0 top-0" aria-hidden="true">
      <div className="grid gap-8 border-b border-neem-100 py-8 md:grid-cols-5 md:border-t">
        <span className={`${line} aspect-[16/9] md:col-span-2 md:aspect-auto md:min-h-48`} />
        <div className="space-y-4 md:col-span-3">
          <span className={`${line} h-4 w-24`} />
          <span className={`${line} h-8 w-full`} />
          <span className={`${line} h-8 w-3/4`} />
          <span className={`${line} h-5 w-full`} />
        </div>
      </div>
    </div>
  );
}

export function LearnCategoryResults({ active, children }: { active?: Category; children: ReactNode }) {
  const [requested, setRequested] = useState<Category | "All" | null>(null);
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    if (requested === null) return;
    const timer = window.setTimeout(() => setShowPending(true), 150);
    return () => window.clearTimeout(timer);
  }, [requested]);

  const selected = requested ?? active ?? "All";
  const options: { label: Category | "All"; href: string }[] = [
    { label: "All", href: "/learn" },
    ...CATEGORIES.map((label) => ({ label, href: `/learn?category=${encodeURIComponent(label)}` })),
  ];

  return (
    <>
      <nav className="mt-10 flex flex-wrap gap-2" aria-label="Filter by topic" aria-busy={requested !== null}>
        {options.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            aria-current={(active ?? "All") === label ? "page" : undefined}
            onNavigate={() => {
              if (label !== (active ?? "All")) setRequested(label);
            }}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg border border-transparent px-4 py-2 font-utility text-body-s font-medium text-ink-950 transition-colors hover:bg-neem-100/60 hover:text-neem-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 focus-visible:ring-offset-2 motion-reduce:transition-none",
              selected === label && "border-neem-200 bg-neem-100 font-semibold text-ink-950 hover:bg-neem-100 hover:text-ink-950",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="relative mt-6 md:mt-10" aria-busy={requested !== null}>
        <div className={showPending ? "invisible" : undefined}>{children}</div>
        {showPending && <ResultsSkeleton />}
        <span className="sr-only" role="status" aria-live="polite">
          {showPending ? `Loading ${requested === "All" ? "all" : requested} articles…` : ""}
        </span>
      </div>
    </>
  );
}
