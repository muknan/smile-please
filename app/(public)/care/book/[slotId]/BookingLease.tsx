"use client";

import { useCallback, useState } from "react";
import { HoldCountdown } from "@/components/booking/HoldCountdown";
import { BookForm } from "./BookForm";
import type { BookDetails } from "../actions";

export function BookingLease({
  details,
  expiresAt,
  renderedAt,
}: {
  details: BookDetails;
  expiresAt: number;
  renderedAt: number;
}) {
  const [expired, setExpired] = useState(expiresAt <= renderedAt);
  const markExpired = useCallback(() => setExpired(true), []);

  return (
    <>
      <div className="mt-10 max-w-[65ch]">
        <HoldCountdown
          expiresAt={expiresAt}
          renderedAt={renderedAt}
          onExpire={markExpired}
        />
      </div>

      {!expired && (
        <div className="mt-6 max-w-[65ch]">
          <BookForm details={details} />
        </div>
      )}
    </>
  );
}
