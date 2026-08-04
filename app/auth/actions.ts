"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/schemas";

const MIN_FILL_MS = 3000;
const HOURLY_LIMIT = 5;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; error: string };

/**
 * Sends a magic link. Runs the Master §9.6 public-form protections server-side:
 * honeypot `website`, 3-second minimum fill time, and the 5-per-hour per-IP
 * rate limit (stored in Postgres via migration 008) — a direct client call to
 * supabase.auth.signInWithOtp would let a bot bypass all three.
 */
export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const website = formData.get("website");
  if (website !== "") {
    // Honeypot filled — pretend-success path is unnecessary; the form is bad.
    return { status: "error", error: "The form wasn't filled in by a human. Try again." };
  }

  const startedAt = Number(formData.get("startedAt"));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || Date.now() - startedAt < MIN_FILL_MS) {
    return {
      status: "error",
      error: "That submitted too quickly to be a real person. Wait a moment and try again.",
    };
  }

  const parsed = signInSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }
  const email = parsed.data.email;

  const ip = await readClientIp();
  const supabase = await createClient();
  const { data: allowed, error: rateError } = await supabase.rpc("record_signin_attempt", {
    p_ip: ip,
  });
  if (rateError || allowed === false) {
    return {
      status: "error",
      error: `Too many sign-in requests from this network in the last hour (limit ${HOURLY_LIMIT}). Wait an hour and try again.`,
    };
  }

  const rawNext = formData.get("next");
  const next =
    typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/account";

  const { error: sendError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (sendError) {
    return {
      status: "error",
      error: "We couldn't send the link just now. Wait a few minutes and try again.",
    };
  }

  return { status: "sent", email };
}

async function readClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}
