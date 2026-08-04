import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, "aria-invalid": ariaInvalid, children, ...rest }: SelectProps) {
  const invalid = ariaInvalid === true;
  return (
    <select
      className={cn(
        "w-full rounded border border-neem-100 bg-chalk-0 px-4 py-3 text-body",
        "focus:border-neem-600",
        invalid && "border-clay-600 focus:border-clay-600",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
