import { z } from "zod";

/** Magic-link sign-in. Lowercased: Supabase treats emails case-insensitively. */
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    .email("That doesn't look like a real email address."),
});

/** Indian mobile, E.164. Accepts "9876543210", "+91 98765 43210", "+919876543210". */
export const phoneSchema = z.preprocess(
  (value) => {
    let s = String(value ?? "").trim().replace(/[\s-]/g, "");
    if (/^0?[6-9]\d{9}$/.test(s)) s = `+91${s.replace(/^0/, "")}`;
    return s;
  },
  z.string().regex(/^\+91[6-9]\d{9}$/, "Enter a mobile number like +91 98765 43210."),
);

export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "That doesn't look like a real email address.",
  });

export const AGE_BANDS = ["under_12", "12_17", "18_39", "40_59", "60_plus"] as const;
export const REASONS = ["pain", "bleeding_gums", "cleaning", "checkup", "child", "other"] as const;

export const LOCALITIES = [
  "Seelampur",
  "Shahdara",
  "Trilokpuri",
  "Karol Bagh",
] as const;

/** Path A — /care/request. Email is optional: a booking must survive without one. */
export const requestBookingSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: phoneSchema,
  email: optionalEmailSchema,
  ageBand: z.enum(AGE_BANDS, { message: "Choose an age band." }),
  reason: z.enum(REASONS, { message: "Choose what's wrong." }),
  note: z.string().trim().max(500, "Keep it under 500 characters.").default(""),
  locality: z.enum(LOCALITIES, { message: "Choose your area." }),
  pincode: z
    .string()
    .trim()
    .regex(/^(\d{6})?$/, "A pincode is 6 digits.")
    .default(""),
  preferredDays: z
    .array(z.enum(["weekdays", "weekends"]))
    .min(1, "Pick at least one set of days."),
  preferredTimes: z
    .array(z.enum(["morning", "afternoon", "evening"]))
    .min(1, "Pick at least one time of day."),
  consentBooking: z.literal(true, { message: "You need to agree before we can store your details." }),
  consentUpdates: z.boolean().default(false),
  forMinor: z.boolean().default(false),
});

/** Path B — /care/book/[slotId]: minimal patient fields + consent. */
export const bookSlotSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: phoneSchema,
  email: optionalEmailSchema,
  ageBand: z.enum(AGE_BANDS, { message: "Choose an age band." }),
  reason: z.enum(REASONS, { message: "Choose what's wrong." }),
  note: z.string().trim().max(500, "Keep it under 500 characters.").default(""),
  pincode: z
    .string()
    .trim()
    .regex(/^(\d{6})?$/, "A pincode is 6 digits.")
    .default(""),
  consentBooking: z.literal(true, { message: "You need to agree before we can store your details." }),
  consentUpdates: z.boolean().default(false),
});

/** Phase 6 — contact submissions, one schema per tab (§6.1). */
const contactMessage = z
  .string()
  .trim()
  .min(10, "Tell us a bit more — a sentence is enough.")
  .max(1000, "Keep it under 1000 characters.");

export const contactPatientSchema = z.object({
  tab: z.literal("patient"),
  name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: phoneSchema,
  email: optionalEmailSchema,
  message: contactMessage,
  consentContact: z.literal(true, { message: "You need to agree before we can store your message." }),
});

export const contactDentistSchema = z.object({
  tab: z.literal("dentist"),
  name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email — we reply there.").max(200),
  dciRegNo: z.string().trim().max(40, "That DCI number looks too long.").default(""),
  clinicArea: z.string().trim().min(2, "Tell us the area of Delhi you can practise in.").max(120),
  availability: z.string().trim().max(200, "Keep it short — a few hours a month is plenty.").default(""),
  message: contactMessage,
  consentContact: z.literal(true, { message: "You need to agree before we can store your message." }),
});

export const contactOrganizationSchema = z.object({
  tab: z.literal("organization"),
  organizationName: z.string().trim().min(2, "Enter the organisation's name.").max(160),
  contactPerson: z.string().trim().min(2, "Enter a contact person's name.").max(120),
  email: z.string().trim().email("Enter a valid email — we reply there.").max(200),
  phone: phoneSchema.optional().or(z.literal("")),
  partnershipType: z.enum(["funding", "venue", "camp_host", "supplies", "other"], {
    message: "Choose a partnership type.",
  }),
  message: contactMessage,
  consentContact: z.literal(true, { message: "You need to agree before we can store your message." }),
});

/** Reference + phone lookup (§5.9). */
export const lookupSchema = z.object({
  ref: z.string().trim().min(6, "Enter the reference code.").max(30),
  phone: phoneSchema,
});

/** Patient edits own details. */
export const profileEditSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: phoneSchema,
  locality: z.enum(LOCALITIES, { message: "Choose your area." }),
  ageBand: z.enum(AGE_BANDS, { message: "Choose an age band." }),
});
