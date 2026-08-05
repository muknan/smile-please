"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderProfile } from "./HeaderProfile";

export const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/care", label: "Care" },
  { href: "/learn", label: "Learn" },
  { href: "/contact", label: "Contact" },
];

function useActiveLink() {
  const pathname = usePathname();
  return (href: string) => pathname === href;
}

export function DesktopNav() {
  const isActive = useActiveLink();
  return (
    <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={cn(
            "font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600",
            isActive(link.href) && "text-neem-600",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the menu; focus returns to the toggle when it closes.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const toggleButton = toggleRef.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggleButton?.focus();
    };
  }, [open]);

  // Lock body scroll while the full-screen menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded text-ink-950 transition hover:text-neem-600 sm:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto bg-mineral-50 sm:hidden"
        >
          <nav className="container-content flex flex-col gap-2 py-6" aria-label="Mobile menu">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded px-4 py-3 font-display text-display-m text-ink-950 transition hover:text-neem-600",
                  pathname === link.href && "text-neem-600",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 rounded border border-neem-100 bg-chalk-0 px-4 py-3">
              <HeaderProfile />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
