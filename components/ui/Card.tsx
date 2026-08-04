import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Token-styled surface (12px radius, chalk on mineral). Defined in Master Context §4. */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn("rounded-card border border-neem-100 bg-chalk-0 p-6", className)} {...rest}>
      {children}
    </div>
  );
}
