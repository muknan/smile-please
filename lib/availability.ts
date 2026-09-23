import { delhiCalendarDate, isValidDelhiDate } from "@/lib/delhi-time";

export const SLOT_DURATIONS = new Set([30, 60]);
export const WEEKDAY_VALUES = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
export const MAX_WEEKLY_RANGE_DAYS = 90;

function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isAllowedSlotDuration(value: number): boolean {
  return Number.isInteger(value) && SLOT_DURATIONS.has(value);
}

/** Validates the server-action boundary, including limits the UI communicates. */
export function validateWeeklyAvailabilityInput(input: {
  days: string[];
  from: string;
  to: string;
  duration: number;
  today?: string;
}): string | null {
  if (!isAllowedSlotDuration(input.duration)) return "Choose a 30- or 60-minute duration.";
  if (input.days.length === 0 || input.days.some((day) => !WEEKDAY_VALUES.has(day))) {
    return "Choose at least one valid day.";
  }
  if (!isValidDelhiDate(input.from) || !isValidDelhiDate(input.to)) return "Pick a valid date range.";
  if (input.from > input.to) return "The range ends before it starts.";

  const today = input.today ?? delhiCalendarDate();
  if (input.from < today) return "Weekly availability can only start today or later.";
  if (input.to > addCalendarDays(input.from, MAX_WEEKLY_RANGE_DAYS - 1)) {
    return `Weekly availability is limited to ${MAX_WEEKLY_RANGE_DAYS} days at a time.`;
  }
  return null;
}
