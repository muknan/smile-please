"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const HOLD_MS = 10 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;

export function HoldCountdown() {
  const [remaining, setRemaining] = useState(HOLD_MS);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const left = HOLD_MS - (Date.now() - started);
      setRemaining(Math.max(0, left));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (remaining <= 0) {
    return (
      <p role="status" className="rounded-card border border-clay-600 bg-chalk-0 px-4 py-3 text-body-s text-clay-600">
        This slot&apos;s hold has expired, so it may no longer be available. Go back and pick
        another time.
        <Link href="/care" className="ml-2 font-utility font-medium underline underline-offset-2">
          Back to times
        </Link>
      </p>
    );
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  const warning = remaining <= WARN_MS;
  return (
    <p
      role="status"
      aria-live="polite"
      className={warning ? "font-utility text-body-s font-medium text-clay-600" : "font-utility text-body-s text-ink-950/60"}
    >
      {warning ? "Hurry — this slot is held for " : "Your slot is held for "}
      <span className="tabular-nums">{minutes}:{seconds}</span>. Complete the form to book it.
    </p>
  );
}
