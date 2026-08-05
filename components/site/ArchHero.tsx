"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <section className="flex snap-start snap-always min-h-[100svh] items-center justify-center bg-neem-900">
      {/* max-w on the wrapper, not the frame: % padding on the frame resolves
          against its containing block, and a stretched flex item would use the
          full-width wrapper. Frame %s must resolve against the frame's own width. */}
      <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:px-6">
        <ArchFrame
          keyline
          keylineClass={played ? "hero-keyline hero-keyline-draw" : "hero-keyline"}
          className="w-full py-16 sm:py-24 sm:pb-16"
        >
          {/* Content is visible by default (D-38). The arch is narrowest at its
              apex, so the text is kept below-and-inside the opening: narrow
              measure + generous horizontal + top inset so the marigold keyline
              never crosses the text. */}
          <div className="flex flex-col items-center px-10 pt-4 text-center sm:px-14 sm:pt-12">
            <h1 className="max-w-[22ch] text-display-xl text-chalk-0">
              Free dental care for the people Delhi&apos;s clinics don&apos;t reach.
            </h1>
            <p className="mt-5 max-w-[44ch] text-body-l text-chalk-0/80 sm:mt-6">
              Real dentists, registered with the Dental Council of India, working in the
              communities that need them. A check-up is free. It takes about ten minutes to arrange.
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-4 sm:mt-12 sm:flex-row sm:items-center">
              <Link
                href="/care"
                className="inline-flex min-h-11 items-center justify-center rounded bg-marigold-500 px-6 py-3 font-utility text-body-s font-medium text-ink-950 transition hover:brightness-95"
              >
                Book a check-up
              </Link>
              <Link
                href="/contact?tab=dentist"
                className="inline-flex min-h-11 items-center justify-center rounded border border-chalk-0/70 px-6 py-3 font-utility text-body-s font-medium text-chalk-0 transition hover:border-chalk-0 hover:bg-chalk-0/10"
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
