"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/db";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type DentistState = { ok: boolean; error?: string };

const OVERLAP_MSG = "That overlaps a slot you already have on that date.";

/** Converts a Delhi-local date+time into an ISO timestamptz. */
function istTimestamp(date: string, time: string): string {
  return new Date(`${date}T${time.length === 5 ? time : `${time}:00`}+05:30`).toISOString();
}

function slotConflictMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  return code === "23P01" ? OVERLAP_MSG : "We couldn't save that slot. Try again.";
}

/**
 * Every appointment status change goes through the transition RPC — never a
 * direct status write (Phase 5 §5.2).
 */
export async function transitionAsDentist(
  appointmentId: string,
  to: Extract<AppointmentStatus, "confirmed" | "completed" | "no_show" | "cancelled_by_dentist">,
  reason?: string,
): Promise<DentistState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_appointment", {
    p_appointment_id: appointmentId,
    p_to: to,
    p_reason: reason || null,
  });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("ILLEGAL_TRANSITION")) {
      return { ok: false, error: "That move isn't possible from the appointment's current state." };
    }
    return { ok: false, error: "We couldn't update it just now. Try again." };
  }
  revalidatePath("/dentist/appointments");
  return { ok: true };
}

/** Upsert a clinical note on the dentist's own completed appointment. */
export async function saveClinicalNote(
  appointmentId: string,
  note: string,
): Promise<DentistState> {
  if (note.trim().length === 0) {
    return { ok: false, error: "The note can't be empty." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  const { error } = await supabase.from("clinical_notes").upsert(
    {
      appointment_id: appointmentId,
      note: note.trim(),
      author_id: user.id,
    },
    { onConflict: "appointment_id" },
  );
  if (error) return { ok: false, error: "We couldn't save the note." };
  revalidatePath("/dentist/appointments");
  return { ok: true };
}

export type AddSlotState = { ok: boolean; message?: string };
export type SlotFormState = AddSlotState & { error?: string };

/** Add a single slot on a given Delhi-local date and time. */
export async function addSingleSlot(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const duration = Number(formData.get("duration") ?? 30);
  const isCamp = formData.get("locationType") === "camp";
  const campName = String(formData.get("campName") ?? "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { ok: false, error: "Choose a date and time." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  const starts = istTimestamp(date, time);
  const ends = new Date(new Date(starts).getTime() + duration * 60_000).toISOString();

  try {
    const { error } = await supabase.from("availability_slots").insert({
      dentist_id: user.id,
      starts_at: starts,
      ends_at: ends,
      created_by: user.id,
      location_type: isCamp ? "camp" : "clinic",
      camp_name: campName,
    });
    if (error) return { ok: false, error: slotConflictMessage(error) };
  } catch (err) {
    return { ok: false, error: slotConflictMessage(err) };
  }
  revalidatePath("/dentist/availability");
  return { ok: true, message: "Slot added." };
}

/** The Delhi-local weekday name ("mon".."sun") of a calendar day key. */
function istWeekday(dateKey: string): string {
  const iso = new Date(istTimestamp(dateKey, "12:00")).toISOString().slice(0, 10);
  const utcDay = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[utcDay];
}

/** Repeat a weekly slot across a date range. */
export async function addWeeklyPattern(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const time = String(formData.get("time") ?? "");
  const duration = Number(formData.get("duration") ?? 30);
  const days = formData.getAll("days").map(String);
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const isCamp = formData.get("locationType") === "camp";
  const campName = String(formData.get("campName") ?? "").trim() || null;

  if (days.length === 0 || !/^\d{2}:\d{2}$/.test(time) || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return { ok: false, error: "Pick the days, time, and a date range." };
  }
  if (from > to) return { ok: false, error: "The range ends before it starts." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  const daySet = new Set(days);
  const inserts: Database["public"]["Tables"]["availability_slots"]["Insert"][] = [];

  // Iterate by Delhi calendar day (one day at noon IST has the right date key).
  for (let d = new Date(from); d <= new Date(to); d.setUTCDate(d.getUTCDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);
    if (!daySet.has(istWeekday(dateKey))) continue;
    const starts = istTimestamp(dateKey, time);
    const ends = new Date(new Date(starts).getTime() + duration * 60_000).toISOString();
    inserts.push({
      dentist_id: user.id,
      starts_at: starts,
      ends_at: ends,
      created_by: user.id,
      location_type: isCamp ? "camp" : "clinic",
      camp_name: campName,
    });
  }

  if (inserts.length === 0) {
    return { ok: false, error: "No dates matched that range and pattern." };
  }

  try {
    const { error } = await supabase.from("availability_slots").insert(inserts);
    if (error) return { ok: false, error: slotConflictMessage(error) };
  } catch (err) {
    return { ok: false, error: slotConflictMessage(err) };
  }
  revalidatePath("/dentist/availability");
  return { ok: true, message: `${inserts.length} slots added.` };
}

/** Block an entire Delhi-local day. */
export async function blockDay(
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Choose a date." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  try {
    const { error } = await supabase.from("availability_slots").insert({
      dentist_id: user.id,
      starts_at: istTimestamp(date, "00:00"),
      ends_at: istTimestamp(date, "23:59"),
      created_by: user.id,
      status: "blocked",
    });
    if (error) return { ok: false, error: slotConflictMessage(error) };
  } catch (err) {
    return { ok: false, error: slotConflictMessage(err) };
  }
  revalidatePath("/dentist/availability");
  return { ok: true, message: `${date} is blocked.` };
}

export type ProfileState = { ok: boolean; error?: string; note?: string };

/** Edits the public profile; changing name or locality takes it back to
 * pending review (is_public=false) until an admin re-approves. */
export async function updateDentistProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  const { data: current } = await supabase
    .from("dentists")
    .select("display_name, locality")
    .eq("profile_id", user.id)
    .maybeSingle();

  const next = {
    bio: String(formData.get("bio") ?? "").trim() || null,
    specialties: splitList(formData.get("specialties")),
    languages: splitList(formData.get("languages")),
    display_name: String(formData.get("displayName") ?? "").trim(),
    locality: String(formData.get("locality") ?? "").trim(),
  };
  if (next.display_name.length < 2 || next.locality.length < 2) {
    return { ok: false, error: "Display name and locality are required." };
  }

  const profileChanged =
    current && (current.display_name !== next.display_name || current.locality !== next.locality);

  const { error } = await supabase
    .from("dentists")
    .update({
      bio: next.bio,
      specialties: next.specialties,
      languages: next.languages,
      display_name: next.display_name,
      locality: next.locality,
      ...(profileChanged ? { is_public: false } : {}),
    })
    .eq("profile_id", user.id);

  if (error) return { ok: false, error: "We couldn't save the profile." };
  revalidatePath("/dentist/profile");
  return {
    ok: true,
    note: profileChanged
      ? "Saved. Because your name or area changed, your public profile is now hidden pending a quick review by the team."
      : "Saved.",
  };
}

/** Uploads a profile photo to dentist-photos; returns the storage path. */
export async function uploadProfilePhoto(formData: FormData): Promise<ProfileState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image first." };
  }
  if (file.size > 1.5 * 1024 * 1024) {
    return { ok: false, error: "Keep the photo under 1.5 MB." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again." };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("dentist-photos")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (uploadError) return { ok: false, error: "The upload failed. Try again." };

  const { error: updateError } = await supabase
    .from("dentists")
    .update({ photo_path: path })
    .eq("profile_id", user.id);
  if (updateError) return { ok: false, error: "Photo uploaded but the profile didn't update." };

  revalidatePath("/dentist/profile");
  return { ok: true, note: "Photo updated." };
}

/** "Hindi, English" → ["Hindi", "English"] */
function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}
