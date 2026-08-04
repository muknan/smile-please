import type { Database } from "@/types/db";

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type Actor = "patient" | "dentist" | "admin";

/**
 * The appointment state machine (Phase 5 §5.2). Encode the table once and
 * export a guard — every status change in the app goes through assertTransition
 * BEFORE the SQL transition_appointment RPC; the SQL side mirrors this table
 * as its own backstop so a client cannot RPC around it.
 */
export const TRANSITIONS: Record<
  AppointmentStatus,
  Partial<Record<AppointmentStatus, Actor[]>>
> = {
  requested: {
    assigned: ["admin"],
    cancelled_by_patient: ["patient", "admin"],
    cancelled_by_admin: ["admin"],
  },
  assigned: {
    confirmed: ["dentist", "admin"],
    requested: ["admin"],
    cancelled_by_patient: ["patient", "admin"],
    cancelled_by_dentist: ["dentist", "admin"],
    cancelled_by_admin: ["admin"],
  },
  confirmed: {
    confirmed: ["patient", "dentist", "admin"], // reschedule stays confirmed
    completed: ["dentist", "admin"],
    no_show: ["dentist", "admin"],
    cancelled_by_patient: ["patient", "admin"],
    cancelled_by_dentist: ["dentist", "admin"],
    cancelled_by_admin: ["admin"],
  },
  completed: {}, // terminal
  no_show: { confirmed: ["admin"] }, // correction only
  cancelled_by_patient: { requested: ["admin"] },
  cancelled_by_dentist: { requested: ["admin"] },
  cancelled_by_admin: { requested: ["admin"] },
};

export class TransitionError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

/** The 24-hour window message from Master §5.2, verbatim. */
export const CHANGE_WINDOW_MSG =
  "Appointments can only be changed up to 24 hours before. Call our team to reschedule.";

export function canTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
  actor: Actor,
): boolean {
  return (TRANSITIONS[from][to] ?? []).includes(actor);
}

/** Throws TransitionError unless the move is legal in the table. */
export function assertTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
  actor: Actor,
): void {
  if (!canTransition(from, to, actor)) {
    throw new TransitionError(
      `That change isn't possible from the current state (${from} → ${to}).`,
      "ILLEGAL_TRANSITION",
    );
  }
}

/**
 * The extra rule not expressible in the table: a PATIENT may only change
 * (reschedule or cancel) a confirmed appointment at least 24 hours before it
 * starts. Dentists and admins are never bound by it.
 */
export function assertPatientChangeWindow(
  actor: Actor,
  status: AppointmentStatus,
  scheduledFor: string | null,
  now: Date = new Date(),
): void {
  if (
    actor === "patient" &&
    status === "confirmed" &&
    scheduledFor !== null &&
    new Date(scheduledFor).getTime() - now.getTime() < 24 * 60 * 60 * 1000
  ) {
    throw new TransitionError(CHANGE_WINDOW_MSG, "RESCHEDULE_TOO_LATE");
  }
}

/** Human labels for statuses (badges always carry text). */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  requested: "Requested",
  assigned: "Assigned",
  confirmed: "Confirmed",
  completed: "Completed",
  no_show: "No-show",
  cancelled_by_patient: "Cancelled by patient",
  cancelled_by_dentist: "Cancelled by clinic",
  cancelled_by_admin: "Cancelled",
};

export const REASON_CATEGORY_LABELS: Record<
  Database["public"]["Enums"]["reason_category"],
  string
> = {
  pain: "Pain",
  bleeding_gums: "Bleeding gums",
  cleaning: "Cleaning",
  checkup: "Check-up",
  child: "Child's teeth",
  other: "Something else",
};

export const AGE_BAND_LABELS: Record<Database["public"]["Enums"]["age_band"], string> = {
  under_12: "Under 12",
  "12_17": "12–17",
  "18_39": "18–39",
  "40_59": "40–59",
  "60_plus": "60+",
};
