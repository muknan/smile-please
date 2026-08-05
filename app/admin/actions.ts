"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notifyAppointmentTransition } from "@/lib/notifications";
import type { Database } from "@/types/db";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

export type ActionResult = { ok: true } | { ok: false; error: string };

const OVERLAP_MSG = "That overlaps a slot already set for the dentist on that date.";

/**
 * Every booking action routes through admin_appointment_action (migration
 * 011): the state machine backstop + a required one-line reason written to
 * appointment_events in the same transaction. No direct status writes.
 */
export async function appointmentAction(
  appointmentId: string,
  to: AppointmentStatus,
  reason: string,
  opts?: { newDentistId?: string; newSlotId?: string; scheduledFor?: string },
): Promise<ActionResult> {
  const profile = await requireRole("admin");
  if (!reason?.trim()) return { ok: false, error: "A one-line reason is required for this action." };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  const { data: updated, error } = await supabase.rpc("admin_appointment_action", {
    p_appointment_id: appointmentId,
    p_to: to,
    p_reason: reason.trim(),
    p_new_dentist_id: opts?.newDentistId ?? null,
    p_new_slot_id: opts?.newSlotId ?? null,
    p_new_scheduled_for: opts?.scheduledFor ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("ILLEGAL_TRANSITION"))
      return { ok: false, error: "That move isn't possible from the appointment's current state." };
    if (msg.includes("SLOT_TAKEN")) return { ok: false, error: "That slot was just taken. Pick another." };
    if (msg.includes("REASON_REQUIRED"))
      return { ok: false, error: "A one-line reason is required for this action." };
    return { ok: false, error: "We couldn't update the appointment. Try again in a moment." };
  }

  await logAudit("booking.action", "appointment", appointmentId, {
    to,
    reason: reason.trim(),
    actor: profile.email ?? profile.full_name,
  });

  if (updated && typeof updated === "object" && before && typeof before === "object") {
    void notifyAppointmentTransition(supabase, updated, before.status ?? to, to);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Assign (or reassign) an appointment to a dentist. Reassign first steps the
 * appointment back to `requested` (assigned → requested is an admin-only
 * transition), then assigns it anew — both steps audit one event each.
 */
export async function assignAppointment(
  appointmentId: string,
  dentistId: string,
  reason: string,
  opts?: { newSlotId?: string; scheduledFor?: string },
): Promise<ActionResult> {
  await requireRole("admin");
  if (!reason?.trim()) return { ok: false, error: "A one-line reason is required for this action." };

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!before || typeof before !== "object") return { ok: false, error: "Appointment not found." };

  if (before.status === "assigned") {
    const un = await supabase.rpc("admin_appointment_action", {
      p_appointment_id: appointmentId,
      p_to: "requested",
      p_reason: `Reassigned: ${reason.trim()}`,
    });
    if (un.error) return { ok: false, error: "We couldn't reassign the appointment." };
  }

  const { data: updated, error } = await supabase.rpc("admin_appointment_action", {
    p_appointment_id: appointmentId,
    p_to: "assigned",
    p_reason: reason.trim(),
    p_new_dentist_id: dentistId,
    p_new_slot_id: opts?.newSlotId ?? null,
    p_new_scheduled_for: opts?.scheduledFor ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("SLOT_TAKEN")) return { ok: false, error: "That slot was just taken. Pick another." };
    return { ok: false, error: "We couldn't assign the dentist. Try again in a moment." };
  }

  await logAudit("booking.action", "appointment", appointmentId, {
    to: "assigned",
    dentistId,
    reason: reason.trim(),
  });

  if (updated && typeof updated === "object") {
    void notifyAppointmentTransition(supabase, updated, before.status ?? "requested", "assigned");
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateSubmission(
  submissionId: string,
  status: SubmissionStatus,
  internalNote?: string,
): Promise<ActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const patch: Database["public"]["Tables"]["contact_submissions"]["Update"] = {
    status,
    assigned_to: profile.id,
  };
  if (typeof internalNote === "string") patch.admin_notes = internalNote;
  const { error } = await supabase
    .from("contact_submissions")
    .update(patch)
    .eq("id", submissionId);
  if (error) return { ok: false, error: "We couldn't update the submission. Try again." };
  await logAudit("submission.update", "submission", submissionId, { status });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  return { ok: true };
}

/** Access-log-only: opening a detail drawer is itself an event (§7.8). */
export async function logBookingView(appointmentId: string): Promise<void> {
  const profile = await requireRole("admin");
  await logAudit("booking.view", "appointment", appointmentId, {
    actor: profile.email ?? profile.full_name,
  });
}

/** Access-log-only: opening a submission drawer is itself an event (§7.8). */
export async function logSubmissionView(submissionId: string): Promise<void> {
  const profile = await requireRole("admin");
  await logAudit("submission.view", "submission", submissionId, {
    actor: profile.email ?? profile.full_name,
  });
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/^dr[. ]+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "dentist"}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Convert a dentist enquiry into a working dentist profile. One of the two
 * permitted uses of the service-role client — creating an auth user requires
 * it. Creates the user (no email sent — SMTP may be down; they complete via a
 * magic link once the mailer is provisioned), pre-fills a `dentists` row with
 * status='pending', links converted_to_profile_id, and logs it.
 */
export async function convertToDentist(submissionId: string): Promise<ActionResult & { email?: string }> {
  await requireRole("admin");

  // Fetch the submission with the session client (admin RLS allows it).
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission || typeof submission !== "object") return { ok: false, error: "Submission not found." };
  if (submission.type !== "dentist") return { ok: false, error: "Only a dentist enquiry can be converted." };
  if (!submission.email) return { ok: false, error: "The dentist left no email address to convert with." };

  const email = submission.email as string;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: submission.name },
    app_metadata: { role: "dentist" },
  });
  if (error || !created.user) return { ok: false, error: "We couldn't create the dentist account." };
  const userId = created.user.id;

  // The signup trigger creates a patient profile; promote to dentist role.
  await admin.from("profiles").update({ role: "dentist" }).eq("id", userId).maybeSingle();

  const slug = slugify(submission.name);
  const { error: dentErr } = await admin.from("dentists").insert({
    profile_id: userId,
    slug,
    display_name: submission.name,
    dci_registration_no: submission.dci_registration_no || null,
    locality: submission.clinic_area || "Karol Bagh",
    city: "New Delhi",
    status: "pending",
    is_public: false,
  });
  if (dentErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "We couldn't create the dentist profile." };
  }

  await admin.from("contact_submissions").update({ converted_to_profile_id: userId, status: "contacted" }).eq("id", submissionId);

  await logAudit("submission.convert", "submission", submissionId, {
    toProfile: userId,
    action: "submission.convert",
  });
  await logAudit("role.change", "profile", userId, { from: "patient", to: "dentist", source: "convert" });

  revalidatePath("/admin/inbox");
  revalidatePath("/admin/dentists");
  return { ok: true, email };
}

export async function setDentistStatus(
  dentistId: string,
  status: Database["public"]["Enums"]["dentist_status"],
  reason?: string,
): Promise<ActionResult> {
  const profile = await requireRole("admin");
  if (status === "rejected" && !reason?.trim())
    return { ok: false, error: "A reason is required to reject a dentist." };
  const supabase = await createClient();
  const isActive = status === "active";
  const { error } = await supabase
    .from("dentists")
    .update({
      status,
      is_public: isActive,
      approved_by: isActive ? profile.id : null,
      approved_at: isActive ? new Date().toISOString() : null,
    })
    .eq("profile_id", dentistId);
  if (error) return { ok: false, error: "We couldn't update the dentist." };
  await logAudit(status === "active" ? "dentist.approve" : "dentist.update", "dentist", dentistId, {
    status,
    reason: reason?.trim() ?? null,
  });
  revalidatePath("/admin/dentists");
  revalidatePath("/care/dentists");
  revalidatePath("/care");
  return { ok: true };
}

/** Records that the admin checked a DCI registration against the register. */
export async function verifyDci(dentistId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("dentists")
    .update({ dci_verified_at: new Date().toISOString() })
    .eq("profile_id", dentistId);
  if (error) return { ok: false, error: "We couldn't record the verification." };
  await logAudit("dentist.verify_dci", "dentist", dentistId);
  revalidatePath("/admin/dentists");
  return { ok: true };
}

/** Admin adds a slot on a dentist's behalf (many volunteers never log in). */
export async function adminAddSlot(
  dentistId: string,
  date: string,
  time: string,
  locationType: "clinic" | "camp" = "clinic",
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const starts = new Date(`${date}T${time.length === 5 ? time : `${time}:00`}+05:30`).toISOString();
  const ends = new Date(new Date(starts).getTime() + 30 * 60 * 1000).toISOString();
  const { error } = await supabase.from("availability_slots").insert({
    dentist_id: dentistId,
    created_by: dentistId,
    starts_at: starts,
    ends_at: ends,
    location_type: locationType,
    capacity: 1,
  });
  if (error) {
    if ((error as { code?: string }).code === "23P01") return { ok: false, error: OVERLAP_MSG };
    return { ok: false, error: "We couldn't add the slot." };
  }
  revalidatePath("/admin/dentists");
  revalidatePath("/care/dentists");
  return { ok: true };
}

/** Admin blocks every slot for a dentist on a given Delhi-local day. */
export async function adminBlockDay(
  dentistId: string,
  date: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const dayStart = new Date(`${date}T00:00:00+05:30`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from("availability_slots")
    .update({ status: "blocked" })
    .eq("dentist_id", dentistId)
    .gte("starts_at", dayStart.toISOString())
    .lt("starts_at", dayEnd.toISOString());
  if (error) return { ok: false, error: "We couldn't block the day." };
  revalidatePath("/admin/dentists");
  revalidatePath("/care/dentists");
  return { ok: true };
}

export type ArticleInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  body_md: string;
  cover_path?: string | null;
  status: "draft" | "published";
};

export async function saveArticle(input: ArticleInput): Promise<ActionResult & { id?: string }> {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  if (!input.title.trim()) return { ok: false, error: "A title is required." };
  if (!input.slug.trim()) return { ok: false, error: "A slug is required." };
  if (!input.body_md.trim()) return { ok: false, error: "The article body can't be empty." };

  const base = {
    slug: input.slug.trim(),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    category: input.category,
    body_md: input.body_md,
    cover_path: input.cover_path ?? null,
  };

  if (input.id) {
    const patch: Database["public"]["Tables"]["articles"]["Update"] = { ...base };
    if (input.status === "published") {
      patch.status = "published";
      patch.published_at = new Date().toISOString();
    } else {
      patch.status = "draft";
    }
    const { error, data } = await supabase
      .from("articles")
      .update(patch)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.code === "23505" ? "That slug is already in use." : "We couldn't save the article." };
    await logAudit("article.save", "article", input.id, { status: input.status });
    revalidatePath("/admin/articles");
    revalidatePath("/learn");
    revalidatePath(`/learn/${input.slug}`);
    return { ok: true, id: data?.id };
  }

  const { error, data } = await supabase
    .from("articles")
    .insert({
      ...base,
      status: input.status === "published" ? "published" : "draft",
      published_at: input.status === "published" ? new Date().toISOString() : null,
      author_id: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.code === "23505" ? "That slug is already in use." : "We couldn't save the article." };
  await logAudit("article.save", "article", data?.id, { status: input.status });
  revalidatePath("/admin/articles");
  revalidatePath("/learn");
  revalidatePath(`/learn/${input.slug}`);
  return { ok: true, id: data?.id };
}

export async function setArticleStatus(id: string, status: "draft" | "published"): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("articles")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: "We couldn't update the article." };
  await logAudit(status === "published" ? "article.publish" : "article.unpublish", "article", id);
  const slug = data?.slug ? String(data.slug) : undefined;
  revalidatePath("/admin/articles");
  revalidatePath("/learn");
  if (slug) revalidatePath(`/learn/${slug}`);
  return { ok: true };
}
