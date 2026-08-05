import { Baby, HeartPulse, ShieldCheck, Users, type LucideIcon } from "lucide-react";

/**
 * A single, consistent icon system for the Learn cards — a meaningful icon per
 * category instead of a generic placeholder shape. Uses the same lucide family
 * the rest of the site already ships; unknown categories fall back to a
 * stylised tooth.
 */
const ICONS: Record<string, LucideIcon> = {
  Children: Baby,
  "Gum health": HeartPulse,
  Prevention: ShieldCheck,
  Camps: Users,
};

/** Stylised molar — a meaningful stand-in for "dental" (no icon library has a tooth). */
export function ToothIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3.4c-2.3 0-3.6 1.3-5 1.6-1.7.4-3 1.9-3.2 4.5-.3 3.3.7 7 1.6 10.1.3 1.2.9 1.8 1.8 1.7.9-.2 1.3-.9 1.6-1.8.2-.7.5-1.4.9-1.7.5-.4 1.2-.5 1.9-.5s1.4.1 1.9.5c.4.3.7 1 .9 1.7.3.9.7 1.6 1.6 1.8.9.1 1.5-.5 1.8-1.7.9-3.1 1.9-6.8 1.6-10.1-.2-2.6-1.5-4.1-3.2-4.5-1.4-.3-2.7-1.6-5-1.6z" />
    </svg>
  );
}

export function CategoryIcon({
  category,
  size = 28,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[category] ?? ToothIcon;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
