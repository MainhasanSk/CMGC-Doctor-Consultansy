import { Timestamp } from "firebase/firestore";

export const CMGC_TIMEZONE = "Asia/Kolkata";
export const CONSULTATION_DURATION_MINUTES = 30;
export const JOIN_WINDOW_MINUTES = 10;

/**
 * Converts a Timestamp, Date, string, number, or serialized Firestore object to a valid JS Date.
 */
export function toDate(time: unknown): Date {
  if (!time) return new Date();
  if (time instanceof Date) {
    return isNaN(time.getTime()) ? new Date() : time;
  }
  if (time instanceof Timestamp) {
    try {
      return time.toDate();
    } catch {
      return new Date();
    }
  }
  // Handle serialized Firestore Timestamp object: { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof time === "object" && time !== null) {
    const record = time as Record<string, unknown>;
    if (typeof record.toDate === "function") {
      try {
        return (record.toDate as () => Date)();
      } catch {
        // continue
      }
    }
    const secs = (record.seconds ?? record._seconds) as number | undefined;
    if (typeof secs === "number") {
      const nanos = ((record.nanoseconds ?? record._nanoseconds) as number | undefined) || 0;
      return new Date(secs * 1000 + Math.floor(nanos / 1000000));
    }
  }
  if (typeof time === "number") {
    const d = new Date(time);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  if (typeof time === "string") {
    const d = new Date(time);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

/**
 * Format a Date or Timestamp in Asia/Kolkata timezone.
 * Example: "10 Sep 2026"
 */
export function formatISTDate(time: unknown): string {
  if (!time) return "N/A";
  try {
    const d = toDate(time);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: CMGC_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "N/A";
  }
}

/**
 * Format a Date or Timestamp in Asia/Kolkata time format.
 * Example: "05:00 PM"
 */
export function formatISTTime(time: unknown): string {
  if (!time) return "N/A";
  try {
    const d = toDate(time);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: CMGC_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "N/A";
  }
}

/**
 * Format a Date or Timestamp in full IST date and time.
 * Example: "10 Sep 2026, 05:00 PM"
 */
export function formatISTDateTime(time: unknown): string {
  if (!time) return "N/A";
  try {
    const d = toDate(time);
    if (isNaN(d.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: CMGC_TIMEZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "N/A";
  }
}

/**
 * Parses YYYY-MM-DD and HH:mm strings into a Timestamp representing Asia/Kolkata time.
 */
export function createISTTimestamp(dateStr: string, timeStr: string): Timestamp {
  // dateStr: "2026-09-10", timeStr: "17:00"
  // IST is UTC+05:30
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Construct ISO string with +05:30 offset
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
  const date = new Date(isoString);
  return Timestamp.fromDate(date);
}

/**
 * Adds duration in minutes to a Timestamp.
 */
export function addMinutesToTimestamp(ts: Timestamp | unknown, minutes: number): Timestamp {
  const d = toDate(ts);
  const ms = d.getTime() + minutes * 60 * 1000;
  return Timestamp.fromMillis(ms);
}

/**
 * Ten-minute join rule:
 * joinStart = startDateTime - 10 minutes
 * joinEnd = endDateTime
 * Returns true if current time is within [joinStart, joinEnd].
 */
export function isWithinJoinWindow(
  startDateTime: Timestamp | Date,
  endDateTime: Timestamp | Date,
  currentTime: Date = new Date()
): boolean {
  const startMs = toDate(startDateTime).getTime();
  const endMs = toDate(endDateTime).getTime();
  const nowMs = currentTime.getTime();

  const joinStartMs = startMs - JOIN_WINDOW_MINUTES * 60 * 1000;
  return nowMs >= joinStartMs && nowMs <= endMs;
}

/**
 * Returns the number of minutes until the join window opens (startDateTime - 10 minutes).
 * If 0 or negative, the join window is open or has already passed.
 */
export function getMinutesUntilJoinWindow(
  startDateTime: Timestamp | Date,
  currentTime: Date = new Date()
): number {
  const startMs = toDate(startDateTime).getTime();
  const nowMs = currentTime.getTime();
  const joinStartMs = startMs - JOIN_WINDOW_MINUTES * 60 * 1000;
  const diffMs = joinStartMs - nowMs;
  return Math.ceil(diffMs / (60 * 1000));
}

/**
 * Returns true if current time is after endDateTime.
 */
export function hasConsultationEnded(
  endDateTime: Timestamp | Date,
  currentTime: Date = new Date()
): boolean {
  return currentTime.getTime() > toDate(endDateTime).getTime();
}

/**
 * Interval overlap logic:
 * newStart < existingEnd AND newEnd > existingStart
 */
export function isIntervalOverlapping(
  startA: Timestamp | Date,
  endA: Timestamp | Date,
  startB: Timestamp | Date,
  endB: Timestamp | Date
): boolean {
  const sA = toDate(startA).getTime();
  const eA = toDate(endA).getTime();
  const sB = toDate(startB).getTime();
  const eB = toDate(endB).getTime();

  return sA < eB && eA > sB;
}

/**
 * Gets day of week string in lower case ("monday", "tuesday", etc.) for a given date in IST.
 */
export function getISTDayOfWeek(time: Timestamp | Date): string {
  const d = toDate(time);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CMGC_TIMEZONE,
    weekday: "long",
  }).format(d);
  return weekday.toLowerCase();
}
