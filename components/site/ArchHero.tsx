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
    <section className="flex snap-start min-h-[100svh] items-center justify-center bg-neem-900">
      {/* max-w on the wrapper, not the frame: % padding on the frame resolves
          against its containing block, and a stretched flex item would use the
          full-width wrapper. Frame %s must resolve against the frame's own width. */}
      <div className="mx-auto w-full max-w-[600px] px-4 py-8 sm:px-6 sm:py-6">
        <ArchFrame
          keyline
          keylineClass={played ? "hero-keyline hero-keyline-draw" : "hero-keyline"}
          className="w-full py-[34%] pb-[13%] sm:pt-[16%] sm:pb-[12%]"
        >
          {/* Content is visible by default (D-38): a slow or failed hydration
              never leaves the hero blank — only the keyline animates. */}
          <div className="flex flex-col items-center px-6 text-center sm:px-12">
            <h1 className="text-display-xl text-chalk-0">
              Free dental care for the people Delhi&apos;s clinics don&apos;t reach.
            </h1>
            <p className="mt-8 max-w-[60ch] text-body-l text-chalk-0/80">
              Real dentists, registered with the Dental Council of India, working in the
              communities that need them. A check-up is free. It takes about ten minutes to arrange.
            </p>
            <div className="mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
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
