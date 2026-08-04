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
