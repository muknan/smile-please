"use server";

import { createClient } from "@/lib/supabase/server";
import { lookupSchema } from "@/lib/schemas";
import { checkHuman, withinRateLimit, clientIp } from "@/lib/antispam";
import { CONTACT_PHONE_DISPLAY } from "@/lib/contact-info";

export type StatusState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "notfound" }
  | { status: "found"; result: LookupResult };

export type LookupResult = {
  status: string;
  scheduled_for: string | null;
  dentist: string;
  locality: string | null;
  cancelled_reason: string | null;
  events: { status: string; at: string; by: string | null; reason: string | null }[];
};

const NOT_FOUND_MSG = `We couldn't find an appointment with those details. Check the reference and phone number, or call ${CONTACT_PHONE_DISPLAY} and we'll look it up for you.`;

/**
 * Reference + phone lookup (§5.9). Wrong code and wrong phone produce the SAME
 * generic message — the RPC never reveals whether a code exists. Rate limited
 * to 5 attempts per IP per hour.
 */
export async function lookupAppointmentAction(
  _prev: StatusState,
  formData: FormData,
): Promise<StatusState> {
  const human = checkHuman(formData);
  if (!human.ok) {
    // Same public face for bot probes and genuinely unknown codes.
    return { status: "notfound" };
  }

  const ip = await clientIp();
  if (!(await withinRateLimit("care-status", ip))) {
    return {
      status: "error",
      error: `You've made several lookups recently. Please wait about an hour, or call ${CONTACT_PHONE_DISPLAY}.`,
    };
  }

  const parsed = lookupSchema.safeParse({
    ref: String(formData.get("ref") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return { status: "notfound" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_appointment", {
    p_ref: parsed.data.ref,
    p_phone: parsed.data.phone,
  });

  if (error || !data || typeof data !== "object" || !("found" in data)) {
    return { status: "error", error: NOT_FOUND_MSG };
  }
  if (data.found !== true) {
    return { status: "notfound" };
  }

  const events = Array.isArray(data.events) ? (data.events as LookupResult["events"]) : [];
  return {
    status: "found",
    result: {
      status: String(data.status ?? ""),
      scheduled_for: data.scheduled_for ? String(data.scheduled_for) : null,
      dentist: String(data.dentist ?? ""),
      locality: data.locality ? String(data.locality) : null,
      cancelled_reason: data.cancelled_reason ? String(data.cancelled_reason) : null,
      events,
    },
  };
}
