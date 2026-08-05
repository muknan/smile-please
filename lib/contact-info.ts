/**
 * Single source for the NGO's public contact details. Client-safe: no
 * server-only imports, so footer/error/contact pages and server actions can
 * import the same values. Values supplied by the NGO (2026-08-05).
 */

export const CONTACT_EMAIL = "smilepleasepkn@gmail.com";
export const CONTACT_PHONE_DISPLAY = "+91 80760 35045";
/** For tel: links — digits only, with country code. */
export const CONTACT_PHONE_TEL = "+918076035045";

/** DPO / grievance contact is the same mailbox and phone as above. */
export const GRIEVANCE_EMAIL = CONTACT_EMAIL;
export const GRIEVANCE_PHONE_DISPLAY = CONTACT_PHONE_DISPLAY;
