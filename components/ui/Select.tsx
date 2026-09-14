import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, "aria-invalid": ariaInvalid, children, ...rest }: SelectProps) {
  const invalid = ariaInvalid === true || ariaInvalid === "true";
  return (
    <select
      className={cn(
        "form-control w-full",
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
