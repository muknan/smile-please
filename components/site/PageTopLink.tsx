"use client";

import type { ComponentProps } from "react";
import { useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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

type PageTopLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate" | "scroll"> & {
  href: string;
};

/** A Next.js link for ordinary full-page navigation that must enter at top. */
export function PageTopLink({ href, ...props }: PageTopLinkProps) {
  const isInternal = href.startsWith("/");
  const hasHash = href.includes("#");

  if (!isInternal || hasHash) return <Link href={href} {...props} />;

  return (
    <Link
      href={href}
      scroll={false}
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
    />
  );
}
