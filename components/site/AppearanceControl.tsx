"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun, SunMoon } from "lucide-react";

type Appearance = "system" | "light" | "dark";

const STORAGE_KEY = "smile-please-appearance";
const OPTIONS: { value: Appearance; label: string; Icon: typeof Monitor }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

function readAppearance(): Appearance {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function applyAppearance(value: Appearance) {
  if (value === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", value);
}

export function AppearanceControl({
  variant = "header",
  className = "",
}: {
  variant?: "header" | "mobile";
  className?: string;
}) {
  const [appearance, setAppearance] = useState<Appearance>("system");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const sync = () => {
      const value = readAppearance();
      setAppearance(value);
      applyAppearance(value);
    };
    sync();
    const onLocalChange = (event: Event) => setAppearance((event as CustomEvent<Appearance>).detail);
    window.addEventListener("storage", sync);
    window.addEventListener("smile-please-appearance-change", onLocalChange);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("smile-please-appearance-change", onLocalChange);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[OPTIONS.findIndex((option) => option.value === appearance)]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, appearance]);

  const choose = (value: Appearance) => {
    try {
      if (value === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage can be unavailable; the selected appearance still works this visit.
    }
    setAppearance(value);
    applyAppearance(value);
    window.dispatchEvent(new CustomEvent("smile-please-appearance-change", { detail: value }));
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    const current = optionRefs.current.findIndex((option) => option === document.activeElement);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % OPTIONS.length;
    else if (event.key === "ArrowUp") next = (current + OPTIONS.length - 1) % OPTIONS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = OPTIONS.length - 1;
    else return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Appearance"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded border border-transparent px-2 font-utility text-body-s text-ink-950 transition-colors hover:border-neem-200 hover:bg-neem-100/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neem-700"
      >
        <SunMoon size={19} aria-hidden="true" />
        {variant === "mobile" && <span>Appearance</span>}
      </button>
      {open && (
        <div
          id={menuId}
          data-appearance-menu
          role="menu"
          aria-label="Appearance"
          onKeyDown={onMenuKeyDown}
          className={`appearance-menu absolute right-0 z-[70] w-44 max-w-[calc(100vw-2rem)] rounded-card border border-neem-200 bg-chalk-0 p-1.5 text-ink-950 shadow-xl ${variant === "mobile" ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {OPTIONS.map(({ value, label, Icon }, index) => (
            <button
              key={value}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="menuitemradio"
              aria-checked={appearance === value}
              tabIndex={appearance === value ? 0 : -1}
              onClick={() => choose(value)}
              className="flex min-h-11 w-full items-center gap-3 rounded px-3 text-left font-utility text-body-s transition-colors hover:bg-neem-100/60 focus-visible:bg-neem-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neem-700"
            >
              <Icon size={18} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {appearance === value && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
