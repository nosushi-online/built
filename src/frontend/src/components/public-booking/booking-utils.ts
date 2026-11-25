import type { DayHours, ServiceWindow, Timestamp } from "@/types";

const NS_PER_MINUTE = 60_000_000_000n;
const NS_PER_DAY = 86_400_000_000_000n;

/** Monday-first weekday index (0 = Monday … 6 = Sunday) for a `YYYY-MM-DD` date. */
export function weekdayOfIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return (((day + 3) % 7) + 7) % 7;
}

/** Add whole days to a `YYYY-MM-DD` string. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** The service windows open on a given date, from the venue's weekly hours. */
export function servicesForDate(
  openingHours: DayHours[],
  iso: string,
): ServiceWindow[] {
  const weekday = weekdayOfIso(iso);
  return (
    openingHours.find((h) => Number(h.weekday) === weekday)?.services ?? []
  );
}

/** True when the date has no service at all (closed day). */
export function isClosedDate(
  openingHours: DayHours[],
  closedDates: string[],
  iso: string,
): boolean {
  return (
    closedDates.includes(iso) || servicesForDate(openingHours, iso).length === 0
  );
}

/** The service window a slot start belongs to, or null when outside every window. */
export function serviceForSlot(
  services: ServiceWindow[],
  startAt: Timestamp,
): ServiceWindow | null {
  const minuteOfDay = Number((startAt % NS_PER_DAY) / NS_PER_MINUTE);
  return (
    services.find(
      (s) =>
        minuteOfDay >= Number(s.openMinute) &&
        minuteOfDay < Number(s.closeMinute),
    ) ?? null
  );
}

/** Build a UTC nanosecond timestamp from a `YYYY-MM-DD` date and a minute of day. */
export function slotTimestamp(iso: string, minuteOfDay: number): Timestamp {
  const [y, m, d] = iso.split("-").map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return BigInt(day) * NS_PER_DAY + BigInt(minuteOfDay) * NS_PER_MINUTE;
}

/** Format a minute-of-day as `HH:MM`. */
export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** A stable key for a service window. */
export function serviceKey(service: ServiceWindow): string {
  return `${service.openMinute}-${service.closeMinute}`;
}

/** Basic E.164 shape check: `+` then 8–15 digits. */
export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

/** Escape a text value for an iCalendar property. */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** `YYYYMMDDTHHMMSSZ` in UTC for an iCalendar DTSTART/DTEND. */
function icsStamp(timestamp: Timestamp): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Build a downloadable `.ics` calendar file for a booking. */
export function buildIcs({
  uid,
  startAt,
  endAt,
  summary,
  location,
  description,
}: {
  uid: string;
  startAt: Timestamp;
  endAt: Timestamp;
  summary: string;
  location: string;
  description: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Maison//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsEscape(uid)}@maison`,
    `DTSTAMP:${icsStamp(BigInt(Date.now()) * 1_000_000n)}`,
    `DTSTART:${icsStamp(startAt)}`,
    `DTEND:${icsStamp(endAt)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `LOCATION:${icsEscape(location)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
