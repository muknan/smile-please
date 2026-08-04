"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-content flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <h1 className="max-w-3xl text-display-l">Something went wrong</h1>
      <p className="mt-4 max-w-[65ch] text-body-l text-ink-950/70">
        The page hit an error. Try again — if it keeps happening, write to care@example.com.
      </p>
      <div className="mt-10">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
