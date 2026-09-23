"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderProfile } from "./HeaderProfile";
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
          pendingSurfaceLabel={link.href === "/learn" ? "Learn" : undefined}
          aria-label={link.label}
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
  };

  const closeCurrentPage = () => {
    restoreToggleFocusRef.current = true;
    setOpen(false);
  };

  useEffect(() => {
    if (!open || openPath === pathname) return;
    backgroundScrollRef.current = null;
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [open, openPath, pathname]);

  useEffect(() => {
    // Match the configured md breakpoint where desktop navigation replaces us.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (!desktop.matches) return;
      restoreToggleFocusRef.current = false;
      backgroundScrollRef.current = null;
      setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    const toggleButton = toggleRef.current;
    toggleButton?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreBackgroundScroll();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !first || !last || !toggleButton) return;
      if (!event.shiftKey && document.activeElement === toggleButton) {
        // Safari can skip links in its native tab order. Keep the menu's
        // keyboard path consistent across browsers.
        event.preventDefault();
        first.focus({ preventScroll: true });
        return;
      }
      if (event.shiftKey && document.activeElement === toggleButton) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggleButton.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggleButton.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (restoreToggleFocusRef.current) toggleButton?.focus({ preventScroll: true });
      restoreToggleFocusRef.current = true;
    };
  }, [menuOpen]);

  // Lock body scroll while the menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <div
      className="md:hidden"
      role={menuOpen ? "dialog" : undefined}
      aria-modal={menuOpen ? "true" : undefined}
      aria-label={menuOpen ? "Site menu" : undefined}
    >
      <button
        ref={toggleRef}
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded text-ink-950 transition-colors hover:text-neem-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600 motion-reduce:transition-none"
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
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
        {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>

      <div
        ref={panelRef}
        id="mobile-menu"
        data-open={menuOpen}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className="mobile-menu-surface fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-mineral-50 md:hidden"
      >
          <nav className="container-content flex min-h-full flex-col bg-mineral-50 py-7" aria-label="Mobile menu">
            <div className="space-y-1">
              {PRIMARY_NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <PageTopLink
                    key={link.href}
                    href={link.href}
                    pendingIndicator
                    pendingSurfaceLabel={link.href === "/learn" ? "Learn" : undefined}
                    aria-label={link.label}
                    onClick={closeForNavigation}
                    onCurrentNavigate={closeCurrentPage}
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
              {SUPPORT_NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <PageTopLink
                    key={link.href}
                    href={link.href}
                    pendingIndicator
                    onClick={closeForNavigation}
                    onCurrentNavigate={closeCurrentPage}
                    aria-current={active ? "page" : undefined}
                    className="inline-flex min-h-11 items-center rounded font-utility text-body-s font-medium text-ink-950/70 hover:text-neem-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neem-600"
                  >
                    {link.label}
                  </PageTopLink>
                );
              })}
            </div>
          </nav>
      </div>
    </div>
  );
}
