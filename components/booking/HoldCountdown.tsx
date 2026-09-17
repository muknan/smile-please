"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const WARN_MS = 2 * 60 * 1000;

export function HoldCountdown({
  expiresAt,
  renderedAt,
  onExpire,
}: {
  expiresAt: number;
  renderedAt: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - renderedAt));

  useEffect(() => {
    const update = () => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemaining(next);
      if (next === 0) onExpire();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpire]);

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
    <>
      {warning && <span role="status" className="sr-only">Less than two minutes remain on this slot hold.</span>}
      <p className={warning ? "font-utility text-body-s font-medium text-clay-600" : "font-utility text-body-s text-ink-950/60"}>
        {warning ? "Hurry. This slot is held for " : "Your slot is held for "}
        <span className="tabular-nums">{minutes}:{seconds}</span>. Complete the form to book it.
      </p>
    </>
  );
}
