export const TZ = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});

const dayShortFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDate(d: string | Date): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/** "12 August 2026" */
export function formatDate(d: string | Date): string {
  return dateFormatter.format(toDate(d));
}

/** "10:30 am" */
export function formatTime(d: string | Date): string {
  return timeFormatter.format(toDate(d));
}

/** "12 August 2026, 10:30 am" */
export function formatDateTime(d: string | Date): string {
  return `${formatDate(d)}, ${formatTime(d)}`;
}

/** "Wed 12 Aug" */
export function formatDayShort(d: string | Date): string {
  return dayShortFormatter.format(toDate(d)).replace(",", "");
}

/** Day of the month in Asia/Kolkata as a UTC day-number, for calendar-day diffs. */
function dayNumber(d: Date): number {
  const parts = dayKeyFormatter.formatToParts(d);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** "in 3 days" / "2 days ago" / "today" */
export function relativeDays(d: string | Date): string {
  const diff = dayNumber(toDate(d)) - dayNumber(new Date());
  if (diff === 0) return "today";
  if (diff > 0) return diff === 1 ? "in 1 day" : `in ${diff} days`;
  return diff === -1 ? "1 day ago" : `${-diff} days ago`;
}

/** "+919876543210" -> "+91 98765 43210" (input must be E.164, starting with +91) */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/^\+/, "");
  return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}
