import * as React from "react";

export type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-label uppercase text-ink-950">
        {label}
        {/* Visible asterisk; the aria-required attribute lives on the input itself. */}
        {required && (
          <span aria-hidden="true" className="text-marigold-500">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-body-s text-ink-950/60">{hint}</p>}
      {error && (
        <p role="alert" className="text-body-s text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
