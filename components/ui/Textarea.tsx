import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, "aria-invalid": ariaInvalid, ...rest }: TextareaProps) {
  const invalid = ariaInvalid === true || ariaInvalid === "true";
  return (
    <textarea
      className={cn(
        "w-full rounded border border-[#7D8B7E] bg-chalk-0 px-4 py-3 text-body",
        "focus:border-neem-600",
        invalid && "border-clay-600 focus:border-clay-600",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
