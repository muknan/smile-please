"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./Button";

export function SubmitButton({ pendingLabel = "Saving…", children, ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShowSpinner(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSpinner(true), 400);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled} aria-busy={pending}>
      {pending ? (
        <>
          {showSpinner && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {pendingLabel}
        </>
      ) : children}
    </Button>
  );
}
