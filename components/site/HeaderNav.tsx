"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderProfile } from "./HeaderProfile";
import { BrandLockup } from "./Logo";
import { PageTopLink } from "./PageTopLink";

export const PRIMARY_NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/care", label: "Find care" },
  { href: "/learn", label: "Learn" },
] as const;

const SUPPORT_NAV_LINKS = [
  { href: "/partners", label: "Partner with us" },
  { href: "/contact", label: "Contact" },
] as const;

function useActiveLink() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const isActive = useActiveLink();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {PRIMARY_NAV_LINKS.map((link) => (
        <PageTopLink
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded px-3 font-utility text-[13px] font-medium text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600",
            isActive(link.href) && "text-neem-600",
          )}
        >
          {link.label}
        </PageTopLink>
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
  const restoreToggleFocusRef = useRef(true);
  const backgroundScrollRef = useRef<number | null>(null);

  const restoreBackgroundScroll = () => {
    if (backgroundScrollRef.current === null) return;
    window.scrollTo({ top: backgroundScrollRef.current, left: 0, behavior: "auto" });
    backgroundScrollRef.current = null;
  };

  const closeForNavigation = () => {
    restoreToggleFocusRef.current = false;
    restoreBackgroundScroll();
    setOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    const toggleButton = toggleRef.current;
    first?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreBackgroundScroll();
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
      if (restoreToggleFocusRef.current) toggleButton?.focus({ preventScroll: true });
      restoreToggleFocusRef.current = true;
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
            restoreToggleFocusRef.current = true;
            backgroundScrollRef.current = window.scrollY;
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
            <button type="button" aria-label="Close menu" onClick={() => { restoreBackgroundScroll(); setOpen(false); }} className="order-2 flex h-11 w-11 items-center justify-center rounded text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600">
              <X size={22} aria-hidden="true" />
            </button>
            <PageTopLink href="/" aria-label="Smile Please — Home" className="order-1" onClick={closeForNavigation}><BrandLockup /></PageTopLink>
          </div>
          <nav className="container-content flex min-h-[calc(100dvh-var(--header-h))] flex-col bg-mineral-50 py-7" aria-label="Mobile menu">
            <div className="space-y-1">
              {PRIMARY_NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <PageTopLink
                    key={link.href}
                    href={link.href}
                    onClick={closeForNavigation}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-lg px-3 py-2 font-display text-display-m text-ink-950 transition-colors hover:bg-neem-100/50 hover:text-neem-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 motion-reduce:transition-none",
                      active && "bg-neem-100/70 text-neem-700",
                    )}
                  >
                    {link.label}
                  </PageTopLink>
                );
              })}
            </div>
            <div className="px-1 pb-2 pt-8">
              <p className="mb-3 font-utility text-body-s text-ink-950/65">
                Need care? You can start without an account.
              </p>
              <HeaderProfile />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-neem-100 px-3 pt-4">
              {SUPPORT_NAV_LINKS.map((link) => (
                <PageTopLink
                  key={link.href}
                  href={link.href}
                  onClick={closeForNavigation}
                  aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                  className="inline-flex min-h-11 items-center rounded font-utility text-body-s font-medium text-ink-950/70 hover:text-neem-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600"
                >
                  {link.label}
                </PageTopLink>
              ))}
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
