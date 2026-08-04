"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/care", label: "Care" },
  { href: "/learn", label: "Learn" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu on route change.
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
    <header className="sticky top-0 z-50 border-b border-neem-100 bg-mineral-50">
      <div className="container-content flex h-[60px] items-center justify-between sm:h-[72px]">
        <Link href="/" className="flex items-center" aria-label="Smile Please — home">
          <Image
            src="/logo.svg"
            alt="Smile Please"
            width={140}
            height={36}
            className="h-[28px] w-auto sm:h-[36px]"
          />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "font-utility text-body-s font-medium text-ink-950 transition hover:text-neem-600",
                pathname === link.href && "text-neem-600",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:block">
          <Button href="/care">Book a check-up</Button>
        </div>

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
      </div>

      {open && (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[60px] z-40 overflow-y-auto bg-mineral-50 sm:hidden"
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
            <div className="mt-6">
              <Button href="/care" className="w-full">
                Book a check-up
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
