/**
 * Contact page shared constants (Phase 6 §6.1). Client-safe: imported by both
 * the server action and the client form component. No server-only imports.
 */

export const CONTACT_TABS = ["patient", "dentist", "organization"] as const;
export type ContactTab = (typeof CONTACT_TABS)[number];

export const TAB_LABELS: Record<ContactTab, string> = {
  patient: "I need help",
  dentist: "I'm a dentist",
  organization: "We're an organisation",
};

export const PARTNERSHIP_OPTIONS = ["funding", "venue", "camp_host", "supplies", "other"] as const;
export type PartnershipType = (typeof PARTNERSHIP_OPTIONS)[number];

export const PARTNERSHIP_LABELS: Record<PartnershipType, string> = {
  funding: "Funding",
  venue: "Venue / clinic space",
  camp_host: "Hosting a camp",
  supplies: "Supplies / equipment",
  other: "Other",
};

/**
 * WhatsApp deep links — free, no API, opens straight into the admin's
 * WhatsApp. Hidden entirely when NEXT_PUBLIC_WHATSAPP_NUMBER is unset.
 */
export const WHATSAPP_PREFILL: Record<ContactTab, string> = {
  patient: "Hello, I have a question about Smile Please dental care.",
  dentist:
    "Hello, I'm a dentist and I'd like to volunteer a few hours a month with Smile Please.",
  organization: "Hello, we'd like to partner with Smile Please.",
};

export function whatsappHref(tab: ContactTab, enabled: boolean): string | null {
  if (!enabled) return null;
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_PREFILL[tab])}`;
}
