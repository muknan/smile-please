import "server-only";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { admin } from "@/lib/supabase/admin";

/**
 * Transactional email (Phase 6 §6.3). One shared HTML layout (tables, not
 * flexbox — email clients don't do flexbox), always with a plaintext
 * alternative. Every send is wrapped in try/catch and never blocks the
 * caller: a failed email must not fail a booking. Transport failures are
 * written to audit_log with the message kind and a SHA-256 of the recipient —
 * never the address itself.
 *
 * Email content rule (master): reference code, date, time, dentist display
 * name and locality only. No clinical notes, patient notes, or full
 * addresses — anything more goes behind a sign-in link.
 */

export type EmailKind =
  | "care_request_received"
  | "appointment_confirmed"
  | "appointment_assigned"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "reminder_24h"
  | "new_assignment_dentist"
  | "contact_received"
  | "new_submission_admin"
  | "unassigned_digest";

type Vars = Record<string, unknown>;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Brevo (and several other relays) reject a raw `"Name <addr>"` string as the
 * envelope From with 451 Invalid from, but accept a structured
 * { name, address }. MAIL_FROM may be either form, possibly with a quoted
 * display name — normalise it here so the SMTP envelope is always clean.
 */
function parseFrom(raw: string): { name: string; address: string } {
  // Strip any surrounding quotes first (dotenv may keep them).
  const s = raw.replace(/^["']|["']$/g, "");
  const angled = s.match(/<([^>]+)>/);
  if (angled) {
    const name = s.slice(0, s.indexOf("<")).replace(/^["']|["']$/g, "").trim();
    return { name: name || "Smile Please", address: angled[1] };
  }
  return { name: "Smile Please", address: s.trim() };
}

const FROM = parseFrom(process.env.MAIL_FROM ?? "Smile Please <noreply@example.com>");

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * SMTP is enabled only when SMTP_ENABLED is truthy AND host/user/pass are set
 * (D-42). A real credential that happens to start with "your" no longer
 * disables mail. SMTP_ENABLED is an explicit opt-in so a partially-configured
 * local/dev environment stays a silent no-op rather than throwing.
 */
function smtpConfigured(): boolean {
  const enabled = process.env.SMTP_ENABLED === "1" || process.env.SMTP_ENABLED === "true";
  if (!enabled) return false;
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim() ?? "";
  return !!host && !!user && !!pass;
}

let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
  }
  return transport;
}

async function auditEmailFailure(kind: EmailKind, to: string, error: unknown): Promise<void> {
  try {
    await admin.from("audit_log").insert({
      action: "email_failed",
      entity: "email",
      metadata: {
        kind,
        to_hash: createHash("sha256").update(to).digest("hex"),
        error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      },
    });
  } catch {
    // Audit failure must never take the send path down with it.
  }
}

const LAYOUT_BODY_PX = 560;

function renderLayout(opts: {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  referenceCode?: string;
}): { html: string; text: string } {
  const { heading, paragraphs, cta, referenceCode } = opts;

  const rows = paragraphs
    .map(
      (p) =>
        `<tr><td style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#17130C;">${esc(p)}</td></tr>`,
    )
    .join("\n      ");

  const ctaRow = cta
    ? `<tr><td style="padding:8px 0 20px;">
          <a href="${esc(cta.href)}" style="display:inline-block;background:#E9A227;color:#17130C;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:9999px;">${esc(cta.label)}</a>
        </td></tr>`
    : "";

  const refRow = referenceCode
    ? `<tr><td style="padding:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B5F4E;">Your reference: <strong style="color:#12302A;">${esc(referenceCode)}</strong></td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#F4F1EA;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:${LAYOUT_BODY_PX}px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#12302A;padding:20px 28px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:0.01em;">Smile Please</p>
              <p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.7);">Free dental care for Delhi</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;line-height:1.3;color:#17130C;">${esc(heading)}</h1>
              ${rows}
              ${ctaRow}
              ${refRow}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #EFE9DE;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B5F4E;line-height:1.5;">
                Smile Please · New Delhi, India · A registered charity.
                <br/>If you did not expect this email, ignore it — no action needed.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    "",
    ...paragraphs,
    cta ? `${cta.label}: ${cta.href}` : "",
    referenceCode ? `Your reference: ${referenceCode}` : "",
    "",
    "Smile Please · New Delhi, India",
    "If you did not expect this email, ignore it — no action needed.",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { html, text };
}

type Template = {
  subject: (v: Vars) => string;
  heading: (v: Vars) => string;
  body: (v: Vars) => string[];
  cta?: (v: Vars) => { label: string; href: string };
  ref?: (v: Vars) => string | undefined;
};

export const TEMPLATES: Record<EmailKind, Template> = {
  care_request_received: {
    subject: (v) => `Your request — ${v.ref}`,
    heading: () => "Your care request is in",
    body: (v) => [
      `Thanks, ${v.name}. We've saved your request and will match you with a dentist near ${v.locality ?? "you"}.`,
      "We'll call or message to confirm, usually within two working days. Keep your reference code — you can use it with your phone number to track the request without an account.",
    ],
    cta: () => ({ label: "Track your request", href: `${SITE}/care/status` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  appointment_confirmed: {
    subject: (v) => `Confirmed: ${v.date} with Dr ${v.dentist}`,
    heading: () => "Your appointment is confirmed",
    body: (v) => [
      `You're booked with Dr ${v.dentist}${v.locality ? ` at ${v.locality}` : ""} on ${v.date} at ${v.time}.`,
      "Check-ups, cleanings and treatment at Smile Please are free — no payment, ever. Need to move it? You can change the time up to 24 hours before, from your account.",
    ],
    cta: () => ({ label: "View in your account", href: `${SITE}/account` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  appointment_assigned: {
    subject: () => "We've found you a dentist",
    heading: () => "A dentist has been assigned to you",
    body: (v) => [
      `Dr ${v.dentist} will see you${v.locality ? ` near ${v.locality}` : ""} on ${v.date} at ${v.time}.`,
      "That time is not yet confirmed — please check your account and confirm the appointment, or move it to a time that suits you (up to 24 hours before).",
    ],
    cta: () => ({ label: "Confirm in your account", href: `${SITE}/account` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  appointment_rescheduled: {
    subject: (v) => `Your appointment moved to ${v.toDate}`,
    heading: () => "Your appointment has moved",
    body: (v) => [
      `Your appointment with Dr ${v.dentist} is now on ${v.toDate} at ${v.toTime}${v.locality ? ` at ${v.locality}` : ""}.`,
      `It was previously on ${v.fromDate} at ${v.fromTime}. Your reference code is unchanged.`,
    ],
    cta: () => ({ label: "View in your account", href: `${SITE}/account` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  appointment_cancelled: {
    subject: (v) => `Your appointment on ${v.date} was cancelled`,
    heading: () => "Your appointment was cancelled",
    body: (v) => [
      `Your appointment with Dr ${v.dentist} on ${v.date} at ${v.time} has been cancelled.`,
      "You're welcome to book another time, or tell us what you need and we'll find someone for you.",
    ],
    cta: () => ({ label: "Book another time", href: `${SITE}/care/dentists` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  reminder_24h: {
    subject: (v) => `Tomorrow: your appointment at ${v.time}`,
    heading: () => "Your appointment is tomorrow",
    body: (v) => [
      `A reminder that Dr ${v.dentist} will see you tomorrow${v.locality ? ` at ${v.locality}` : ""} at ${v.time}.`,
      "Most visits take about 30 minutes. If you can't make it, please let us know as early as possible.",
    ],
    cta: () => ({ label: "Manage appointment", href: `${SITE}/account` }),
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  new_assignment_dentist: {
    subject: (v) => `New patient assigned — ${v.date}`,
    heading: () => "A new patient has been assigned to you",
    body: (v) => [
      `${v.patientName} has an appointment with you on ${v.date} at ${v.time}${v.locality ? `, ${v.locality}` : ""} (${v.locationType ?? "clinic"} visit).`,
      "You can see the full details and the patient's history in your dentist portal.",
    ],
    cta: () => ({ label: "Open dentist portal", href: `${SITE}/dentist` }),
  },
  contact_received: {
    subject: (v) => `We got your message — ${v.ref}`,
    heading: () => "Thanks for reaching out",
    body: () => [
      "Someone from the Smile Please team has your message and will come back to you within two working days.",
      "Keep your reference code — quote it if you need to follow up by phone.",
    ],
    ref: (v) => (v.ref ? String(v.ref) : undefined),
  },
  new_submission_admin: {
    subject: (v) => `New ${v.type} enquiry from ${v.name}`,
    heading: (v) => `New ${v.type} enquiry`,
    body: (v) => [
      `${v.name} (${v.phone ?? "no phone"}) sent a ${v.type} enquiry — reference ${v.ref}.`,
      v.message ? `Message: ${String(v.message).slice(0, 400)}` : "No message text.",
    ],
    cta: () => ({ label: "Open the inbox", href: `${SITE}/admin` }),
  },
  unassigned_digest: {
    subject: (v) => `${v.careCount} care requests are waiting`,
    heading: (v) => `Daily summary — ${v.date}`,
    body: (v) => [
      `${v.careCount} care requests and ${v.enquiryCount} contact form messages are waiting for a decision.`,
      ...((v.lines as string[] | undefined) ?? []),
      "Decisions older than 24 hours show here until they are actioned.",
    ],
    cta: () => ({ label: "Open the triage queue", href: `${SITE}/admin` }),
  },
};

export type SendResult = { ok: true } | { ok: false; reason: string };

/** Low-level send. Callers use sendTemplate; this is the try/catch boundary. */
export async function sendMail(
  kind: EmailKind,
  to: string,
  opts: { subject: string; heading: string; paragraphs: string[]; cta?: { label: string; href: string }; referenceCode?: string },
): Promise<SendResult> {
  if (!to) return { ok: false, reason: "no-recipient" };
  if (!smtpConfigured()) return { ok: false, reason: "smtp-not-configured" };
  try {
    const { html, text } = renderLayout(opts);
    await getTransport().sendMail({
      from: FROM,
      to,
      subject: opts.subject,
      html,
      text,
    });
    return { ok: true };
  } catch (error) {
    await auditEmailFailure(kind, to, error);
    return { ok: false, reason: "transport-failed" };
  }
}

/**
 * Render a named template and send. Never throws — in development (no SMTP
 * credentials) it is a silent no-op so booking flows keep working.
 */
export async function sendTemplate(kind: EmailKind, to: string, vars: Vars = {}): Promise<SendResult> {
  const t = TEMPLATES[kind];
  return sendMail(kind, to, {
    subject: t.subject(vars),
    heading: t.heading(vars),
    paragraphs: t.body(vars),
    cta: t.cta?.(vars),
    referenceCode: t.ref?.(vars),
  });
}

/**
 * Best-effort email send. Never throws; resolves once the send attempt has
 * finished so serverless actions do not terminate before the mail is sent
 * (D-50). Callers may await it freely.
 */
export function notify(kind: EmailKind, to: string, vars: Vars = {}): Promise<SendResult> {
  return sendTemplate(kind, to, vars);
}
