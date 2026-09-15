"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderProfile } from "./HeaderProfile";
import { Logo } from "./Logo";

export const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/care", label: "Find care" },
  { href: "/learn", label: "Learn" },
  { href: "/partners", label: "Partner with us" },
  { href: "/contact", label: "Contact" },
];

function useActiveLink() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const isActive = useActiveLink();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded px-3 font-utility text-[13px] font-medium text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600",
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const menuOpen = open && openPath === pathname;
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    const toggleButton = toggleRef.current;
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggleButton?.focus();
    };
  }, [menuOpen]);

  // Lock body scroll while the full-screen menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={cn("h-11 w-11 items-center justify-center rounded text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 md:hidden motion-reduce:transition-none", menuOpen ? "hidden" : "flex")}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        onClick={() => {
          if (menuOpen) setOpen(false);
          else {
            setOpenPath(pathname);
            setOpen(true);
          }
        }}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      {menuOpen && (
        <div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 h-dvh overflow-y-auto bg-mineral-50 md:hidden motion-safe:animate-[mobile-menu-in_150ms_ease-out]"
        >
          <div className="container-content flex h-[var(--header-h)] items-center justify-between border-b border-neem-100">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="order-2 flex h-11 w-11 items-center justify-center rounded text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600">
              <X size={22} aria-hidden="true" />
            </button>
            <Link href="/" aria-label="Smile Please — home" className="order-1"><Logo /></Link>
          </div>
          <nav className="container-content flex min-h-[calc(100dvh-var(--header-h))] flex-col bg-mineral-50 py-7" aria-label="Mobile menu">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-lg px-3 py-2 font-display text-display-m text-ink-950 transition-colors hover:bg-neem-100/50 hover:text-neem-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 motion-reduce:transition-none",
                      active && "bg-neem-100/70 text-neem-700",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto pb-4 pt-10">
              <p className="mb-3 max-w-xs px-1 font-utility text-body-s text-ink-950/65">
                Need care? You can start without an account.
              </p>
              <HeaderProfile />
            </div>
          </nav>
        </div>
      )}
      <style jsx global>{`
        @keyframes mobile-menu-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
