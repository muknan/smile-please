const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;
const DELHI_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Reject calendar values that match an input's shape but cannot exist. */
export function isValidDelhiDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function isValidDelhiTime(value: string): boolean {
  const match = TIME_RE.exec(value);
  if (!match) return false;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

/** Converts a validated Delhi-local date and time to an ISO timestamptz. */
export function delhiTimestamp(date: string, time: string): string {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

/** The following Delhi calendar midnight, expressed as an ISO timestamptz. */
export function nextDelhiMidnight(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return delhiTimestamp(next.toISOString().slice(0, 10), "00:00");
}

/** A Delhi-local calendar date, independent of the server's configured timezone. */
export function delhiCalendarDate(offsetDays = 0, now = new Date()): string {
  const delhi = new Date(now.getTime() + DELHI_OFFSET_MS);
  delhi.setUTCDate(delhi.getUTCDate() + offsetDays);
  return delhi.toISOString().slice(0, 10);
}

/** Start (inclusive) and end (exclusive) of a Delhi-local calendar day. */
export function delhiDayBounds(offsetDays = 0, now = new Date()) {
  const date = delhiCalendarDate(offsetDays, now);
  return { start: delhiTimestamp(date, "00:00"), end: nextDelhiMidnight(date) };
}
