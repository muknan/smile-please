import * as React from "react";

export type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

/**
 * Label + control wrapper. Renders a per-field error and wires
 * `aria-invalid` + `aria-describedby` onto the single child control so the
 * hint/error are programmatically associated with the field (D-15).
 */
export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const child =
    React.isValidElement(children) && React.Children.count(children) === 1
      ? React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })
      : children;

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
      {child}
      {hint && !error && (
        <p id={hintId} className="text-body-s text-ink-950/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-body-s text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
