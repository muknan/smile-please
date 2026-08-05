import * as React from "react";
import { cn } from "@/lib/utils";

export type TableProps = React.TableHTMLAttributes<HTMLTableElement> & { caption?: string };

/** Token-styled table wrapper. Defined in Master Context §4; zebra rows via neem-100/50. */
export function Table({ className, children, caption, ...rest }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full border-collapse font-utility text-data", className)}
        {...rest}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function TableHead({ className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-label uppercase text-neem-600", className)} {...rest} />;
}

export function TableBody({ className, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:nth-child(even)]:bg-neem-100/50", className)} {...rest} />;
}

export function TableRow({ className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-neem-100", className)} {...rest} />;
}

export function TableCell({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...rest} />;
}

export function TableHeaderCell({
  className,
  scope = "col",
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope={scope} className={cn("px-4 py-3 text-left font-medium", className)} {...rest} />;
}
