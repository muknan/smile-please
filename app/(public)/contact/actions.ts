"use server";

import { createClient } from "@/lib/supabase/server";
import {
  contactDentistSchema,
  contactOrganizationSchema,
  contactPatientSchema,
} from "@/lib/schemas";
import { checkHuman, withinRateLimit, clientIp, hashedIpKey } from "@/lib/antispam";
import { notify } from "@/lib/email";
import { CONTACT_PHONE_DISPLAY, CONTACT_EMAIL } from "@/lib/contact-info";
import type { Database } from "@/types/db";

import { issuesFromZod, type FieldError } from "@/lib/form-errors";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; error: string; issues?: FieldError[] }
  | { status: "success"; ref: string };

type SubmissionType = Database["public"]["Enums"]["submission_type"];

const RATE_MSG = `You've sent several messages recently. Please wait about an hour, or call ${CONTACT_PHONE_DISPLAY} or write to ${CONTACT_EMAIL}.`;


/**
 * Phase 6 §6.1/§6.2: three audiences, one action. Runs the three anti-spam
 * layers (honeypot, 3s min fill, 5/hour/IP), saves to contact_submissions
 * with the correct `type`, writes a purpose='contact' consent row, and sends
 * best-effort emails (submitter acknowledgement; immediate admin alert for
 * dentist enquiries only — everything else waits for the daily digest).
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const human = checkHuman(formData);
  if (!human.ok) return { status: "error", error: human.error };

  const ip = await clientIp();
  if (!(await withinRateLimit("contact", ip))) {
    return { status: "error", error: RATE_MSG };
  }

  const tabRaw = formData.get("tab");
  const tab: SubmissionType =
    tabRaw === "dentist" ? "dentist" : tabRaw === "organization" ? "organization" : "patient";

  const raw: Record<string, unknown> = {
    tab,
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    contactPerson: String(formData.get("contactPerson") ?? ""),
    dciRegNo: String(formData.get("dciRegNo") ?? ""),
    clinicArea: String(formData.get("clinicArea") ?? ""),
    availability: String(formData.get("availability") ?? ""),
    partnershipType: String(formData.get("partnershipType") ?? ""),
    consentContact: formData.get("consentContact") === "on",
  };

  const schema =
    tab === "dentist"
      ? contactDentistSchema
      : tab === "organization"
        ? contactOrganizationSchema
        : contactPatientSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = issuesFromZod(parsed.error);
    return { status: "error", error: issues[0]?.message ?? "Check the form.", issues };
  }
  const d = parsed.data;

  const supabase = await createClient();

  let args: {
    p_type: "patient" | "dentist" | "organization";
    p_name: string;
    p_phone: string | null;
    p_email: string | null;
    p_organization_name: string | null;
    p_dci_registration_no: string | null;
    p_clinic_area: string | null;
    p_availability: string | null;
    p_partnership_type: Database["public"]["Enums"]["partnership_type"] | null;
    p_message: string;
    p_source_page: "/contact";
    p_ip_hash: string;
  };
  let submitterName: string;
  if (d.tab === "patient") {
    args = {
      p_type: "patient",
      p_name: d.name,
      p_phone: d.phone,
      p_email: d.email || null,
      p_organization_name: null,
      p_dci_registration_no: null,
      p_clinic_area: null,
      p_availability: null,
      p_partnership_type: null,
      p_message: d.message,
      p_source_page: "/contact",
      p_ip_hash: hashedIpKey("contact", ip),
    };
    submitterName = d.name;
  } else if (d.tab === "dentist") {
    args = {
      p_type: "dentist",
      p_name: d.name,
      p_phone: d.phone,
      p_email: d.email,
      p_organization_name: null,
      p_dci_registration_no: d.dciRegNo || null,
      p_clinic_area: d.clinicArea,
      p_availability: d.availability || null,
      p_partnership_type: null,
      p_message: d.message,
      p_source_page: "/contact",
      p_ip_hash: hashedIpKey("contact", ip),
    };
    submitterName = d.name;
  } else {
    args = {
      p_type: "organization",
      p_name: d.contactPerson,
      p_phone: d.phone || null,
      p_email: d.email,
      p_organization_name: d.organizationName,
      p_dci_registration_no: null,
      p_clinic_area: null,
      p_availability: null,
      p_partnership_type: d.partnershipType,
      p_message: d.message,
      p_source_page: "/contact",
      p_ip_hash: hashedIpKey("contact", ip),
    };
    submitterName = d.contactPerson;
  }

  // Save through the DEFINER RPC: anon has no SELECT on contact_submissions
  // (Phase 2 RLS), so a plain "insert ... returning" can't read the ref back.
  // The function also writes the purpose='contact' consent row in the same
  // call and hashes the IP itself — never the raw IP.
  const { data: row, error } = await supabase.rpc("submit_contact", args);
  if (error || !row || typeof row !== "object" || !("reference_code" in row)) {
    return {
      status: "error",
      error: "We couldn't save your message just now. Please try again in a moment.",
    };
  }

  // Task 6.4: dentist enquiries are time-sensitive — alert the admin now.
  // Patient and organisation submissions wait for the daily digest.
  if (tab === "dentist") {
    const dentist = parsed.data as Extract<typeof parsed.data, { tab: "dentist" }>;
    await notify("new_submission_admin", process.env.ADMIN_NOTIFY_EMAIL ?? "", {
      type: "dentist",
      name: dentist.name,
      phone: dentist.phone,
      ref: row.reference_code,
      message: dentist.message,
    });
  }

  const submitterEmail = d.email;
  if (submitterEmail) {
    await notify("contact_received", submitterEmail, {
      name: submitterName,
      ref: row.reference_code,
    });
  }

  return { status: "success", ref: row.reference_code };
}
