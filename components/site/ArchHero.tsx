"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArchFrame } from "./Arch";

/**
 * Landing hero: full-bleed neem-900, the arch holding the headline and CTAs.
 * The keyline draws once per session — guarded by a module-level boolean, not
 * storage (Master §6 Motion). prefers-reduced-motion renders it complete.
 */
let heroPlayed = false;

export function ArchHero() {
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (heroPlayed) {
      setPlayed(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroPlayed = true;
      setPlayed(true);
      return;
    }
    const t = setTimeout(() => {
      heroPlayed = true;
      setPlayed(true);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-neem-900 sm:min-h-[78vh]">
      {/* max-w on the wrapper, not the frame: % padding on the frame resolves
          against its containing block, and a stretched flex item would use the
          full-width wrapper. Frame %s must resolve against the frame's own width. */}
      <div className="mx-auto w-full max-w-[620px] px-4 py-16 sm:px-6 sm:py-24">
        <ArchFrame
          keyline
          keylineClass={played ? "hero-keyline hero-keyline-draw" : "hero-keyline"}
          className="w-full py-[52%] pb-[16%] sm:pt-[28%] sm:pb-[20%]"
        >
          <noscript>
            <style>{`.hero-fade{opacity:1!important;transform:none!important}`}</style>
          </noscript>
          <div className="flex flex-col items-center px-6 text-center sm:px-12">
            <h1
              className={cn("text-display-xl text-chalk-0", played ? "hero-fade-in" : "hero-fade")}
              style={played ? { transitionDelay: "200ms" } : undefined}
            >
              Free dental care for the people Delhi&apos;s clinics don&apos;t reach.
            </h1>
            <p
              className={cn(
                "mt-8 max-w-[60ch] text-body-l text-chalk-0/80",
                played ? "hero-fade-in" : "hero-fade",
              )}
              style={played ? { transitionDelay: "200ms" } : undefined}
            >
              Real dentists, registered with the Dental Council of India, working in the
              communities that need them. A check-up is free. It takes about ten minutes to arrange.
            </p>
            <div
              className={cn(
                "mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center",
                played ? "hero-fade-in" : "hero-fade",
              )}
              style={played ? { transitionDelay: "900ms" } : undefined}
            >
              <Link
                href="/care"
                className="inline-flex items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
              >
                Book a check-up
              </Link>
              <Link
                href="/contact?tab=dentist"
                className="inline-flex items-center justify-center rounded border border-chalk-0/40 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:border-chalk-0/80 hover:bg-chalk-0/10"
              >
                I&apos;m a dentist
              </Link>
            </div>
          </div>
        </ArchFrame>
      </div>
    </section>
  );
}
