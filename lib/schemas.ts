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

/** Indian mobile, E.164. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+91[6-9]\d{9}$/, "Enter a mobile number like +91 98765 43210.");

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
