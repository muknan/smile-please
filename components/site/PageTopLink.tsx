"use client";

import type { ComponentProps } from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

let pendingTopDestination: string | null = null;

function locationKey(pathname: string, search: string | URLSearchParams) {
  const normalized = new URLSearchParams(search).toString();
  return normalized ? `${pathname}?${normalized}` : pathname;
}

function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/**
 * Completes only top-of-page navigations explicitly requested by PageTopLink.
 * Back/Forward, hash navigation and in-page router updates never set the
 * pending destination, so their native restoration/anchor behavior is kept.
 */
export function PageTopNavigationManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDestination = locationKey(pathname, searchParams);

  useLayoutEffect(() => {
    if (!pendingTopDestination) return;

    if (pendingTopDestination !== currentDestination) {
      pendingTopDestination = null;
      return;
    }

    pendingTopDestination = null;
    scrollToPageTop();
  }, [currentDestination]);

  return null;
}

function PendingIndicator({ surfaceLabel }: { surfaceLabel?: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span aria-hidden="true" className={cn("link-pending-indicator", pending && "is-pending")} />
      <span className="sr-only" aria-live="polite">{pending ? "Loading destination…" : ""}</span>
      {pending && surfaceLabel && createPortal(
        <div className="route-pending-surface" role="status" aria-label={`Loading ${surfaceLabel}`} aria-busy="true">
          <div className="container-content py-14 sm:py-20" aria-hidden="true">
            <span className="block h-4 w-16 rounded bg-neem-100" />
            <span className="mt-6 block h-11 w-full max-w-2xl rounded bg-neem-100 sm:h-14" />
            <div className="mt-6 max-w-[65ch] space-y-3">
              <span className="block h-5 w-full rounded bg-neem-100" />
              <span className="block h-5 w-4/5 rounded bg-neem-100" />
            </div>
            <div className="mt-10 flex gap-6">
              {["w-9", "w-16", "w-20", "w-14", "w-12"].map((width) => (
                <span key={width} className={`block h-8 rounded bg-neem-100 ${width}`} />
              ))}
            </div>
            <div className="mt-8 grid gap-8 border-y border-neem-100 py-8 md:grid-cols-5">
              <span className="block aspect-[16/9] rounded bg-neem-100 md:col-span-2 md:aspect-auto md:min-h-48" />
              <div className="space-y-4 md:col-span-3">
                <span className="block h-4 w-24 rounded bg-neem-100" />
                <span className="block h-8 w-full rounded bg-neem-100" />
                <span className="block h-8 w-3/4 rounded bg-neem-100" />
                <span className="block h-5 w-full rounded bg-neem-100" />
              </div>
            </div>
          </div>
          <span className="sr-only">Loading {surfaceLabel}…</span>
        </div>,
        document.body,
      )}
    </>
  );
}

type PageTopLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "scroll"> & {
  href: string;
  pendingIndicator?: boolean;
  pendingSurfaceLabel?: string;
  onCurrentNavigate?: () => void;
};

/** A Next.js link for ordinary full-page navigation that must enter at top. */
export function PageTopLink({ href, pendingIndicator = false, pendingSurfaceLabel, onCurrentNavigate, onClick, children, className, ...props }: PageTopLinkProps) {
  const isInternal = href.startsWith("/");
  const hasHash = href.includes("#");

  if (!isInternal || hasHash) return <Link href={href} className={className} {...props}>{children}</Link>;

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(pendingIndicator && "relative", className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        const target = new URL(href, window.location.href);
        if (locationKey(target.pathname, target.searchParams) === locationKey(window.location.pathname, window.location.search)) {
          onCurrentNavigate?.();
        }
      }}
      onNavigate={(event) => {
        const target = new URL(href, window.location.href);
        const targetDestination = locationKey(target.pathname, target.searchParams);
        const currentDestination = locationKey(window.location.pathname, window.location.search);

        if (targetDestination === currentDestination) {
          event.preventDefault();
          pendingTopDestination = null;
          scrollToPageTop();
          return;
        }

        pendingTopDestination = targetDestination;
      }}
      {...props}
    >
      {children}
      {pendingIndicator && <PendingIndicator surfaceLabel={pendingSurfaceLabel} />}
    </Link>
  );
}
