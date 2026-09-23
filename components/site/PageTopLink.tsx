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

type PendingSurfaceLabel = "Home" | "Learn" | "Dentists";

function PendingSurface({ label }: { label: PendingSurfaceLabel }) {
  const line = "block rounded bg-neem-100";
  return createPortal(
    <div className="route-pending-surface" data-surface={label.toLowerCase()} role="status" aria-label={`Loading ${label}`} aria-busy="true">
      {label === "Home" ? (
        <div className="container-content grid min-h-[540px] items-center gap-10 py-12 md:grid-cols-12 md:gap-12 md:py-24" aria-hidden="true">
          <div className="space-y-5 md:col-span-7 lg:col-span-6">
            <span className="block h-4 w-40 rounded bg-chalk-0/20" />
            <span className="block h-14 w-full max-w-xl rounded bg-chalk-0/20 sm:h-20" />
            <span className="block h-6 w-5/6 rounded bg-chalk-0/15" />
            <span className="block h-11 w-48 rounded bg-marigold-500/70" />
          </div>
          <span className="block min-h-64 rounded-panel bg-chalk-0/10 md:col-span-5 md:col-start-8" />
        </div>
      ) : (
        <div className="container-content py-14 sm:py-20" aria-hidden="true">
          <span className={`${line} h-4 w-20`} />
          <span className={`${line} mt-6 h-11 w-full max-w-2xl sm:h-14`} />
          <div className="mt-6 max-w-[65ch] space-y-3">
            <span className={`${line} h-5 w-full`} />
            <span className={`${line} h-5 w-4/5`} />
          </div>
          {label === "Learn" ? (
            <>
              <div className="mt-10 flex gap-6">
                {["w-9", "w-16", "w-20", "w-14", "w-12"].map((width) => <span key={width} className={`${line} h-8 ${width}`} />)}
              </div>
              <div className="mt-8 grid gap-8 border-b border-neem-100 py-8 md:grid-cols-5 md:border-t">
                <span className={`${line} aspect-[16/9] md:col-span-2 md:aspect-auto md:min-h-48`} />
                <div className="space-y-4 md:col-span-3">
                  <span className={`${line} h-4 w-24`} />
                  <span className={`${line} h-8 w-full`} />
                  <span className={`${line} h-8 w-3/4`} />
                  <span className={`${line} h-5 w-full`} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt-10 flex flex-wrap gap-3">
                {["w-36", "w-36", "w-64", "w-24"].map((width, index) => <span key={`${width}-${index}`} className={`${line} h-11 ${width}`} />)}
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <span key={item} className={`${line} h-44`} />)}
              </div>
            </>
          )}
        </div>
      )}
      <span className="sr-only">Loading {label}…</span>
    </div>,
    document.body,
  );
}

function PendingIndicator({ showLine, surfaceLabel }: { showLine: boolean; surfaceLabel?: PendingSurfaceLabel }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {showLine && <span aria-hidden="true" className={cn("link-pending-indicator", pending && "is-pending")} />}
      <span className="sr-only" aria-live="polite">{pending ? "Loading destination…" : ""}</span>
      {pending && surfaceLabel && <PendingSurface label={surfaceLabel} />}
    </>
  );
}

type PageTopLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "scroll"> & {
  href: string;
  pendingIndicator?: boolean;
  pendingSurfaceLabel?: PendingSurfaceLabel;
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
      {(pendingIndicator || pendingSurfaceLabel) && <PendingIndicator showLine={pendingIndicator} surfaceLabel={pendingSurfaceLabel} />}
    </Link>
  );
}
