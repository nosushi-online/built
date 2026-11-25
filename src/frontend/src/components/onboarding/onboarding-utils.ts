import type { DayHours, ServiceWindow, VenueType } from "@/types";

/** The four wizard steps, in order. */
export const STEP_KEYS = ["venue", "hours", "defaults", "slug"] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export const TOTAL_STEPS = STEP_KEYS.length;

/** Timezones offered in the wizard; Europe/Paris is the default. */
export const TIMEZONES = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Brussels",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Lisbon",
  "Europe/Zurich",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
] as const;

export const DEFAULT_TIMEZONE = "Europe/Paris";

/** Minutes since midnight, rendered as `HH:MM`. */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.round(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** `HH:MM` to minutes since midnight; returns null for malformed input. */
export function timeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59) return null;
  return hours * 60 + mins;
}

/** A service window as editable strings, so inputs stay controlled. */
export interface ServiceDraft {
  open: string;
  close: string;
}

export interface DayDraft {
  weekday: number;
  open: boolean;
  services: ServiceDraft[];
}

const DEFAULT_SERVICES: ServiceDraft[] = [
  { open: "12:00", close: "14:30" },
  { open: "19:00", close: "22:30" },
];

/** Seven days, Monday first, with a sensible restaurant default. */
export function defaultWeek(): DayDraft[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    open: weekday !== 0,
    services: DEFAULT_SERVICES.map((service) => ({ ...service })),
  }));
}

/** Convert backend `DayHours[]` into editable drafts, filling missing days. */
export function weekFromBackend(hours: DayHours[]): DayDraft[] {
  const byDay = new Map<number, DayHours>();
  for (const day of hours) byDay.set(Number(day.weekday), day);
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = byDay.get(weekday);
    if (!found) {
      return { weekday, open: false, services: [] };
    }
    return {
      weekday,
      open: found.services.length > 0,
      services: found.services.map((service) => ({
        open: minutesToTime(Number(service.openMinute)),
        close: minutesToTime(Number(service.closeMinute)),
      })),
    };
  });
}

/** Validate one day's services; returns an error key or null. */
export function dayError(day: DayDraft): "range" | "empty" | null {
  if (!day.open) return null;
  if (day.services.length === 0) return "empty";
  for (const service of day.services) {
    const open = timeToMinutes(service.open);
    const close = timeToMinutes(service.close);
    if (open === null || close === null || open >= close) return "range";
  }
  return null;
}

/** Convert drafts into the backend `DayHours[]` contract. */
export function weekToBackend(week: DayDraft[]): DayHours[] {
  return week.map((day): DayHours => {
    const services: ServiceWindow[] = day.open
      ? day.services
          .map((service) => ({
            openMinute: BigInt(timeToMinutes(service.open) ?? 0),
            closeMinute: BigInt(timeToMinutes(service.close) ?? 0),
          }))
          .filter((service) => service.openMinute < service.closeMinute)
      : [];
    return { weekday: BigInt(day.weekday), services };
  });
}

/** Lowercase, dash-separated slug derived from a venue name. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Mirrors the backend rule: 1–60 chars of `[a-z0-9-]`. */
export function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]{1,60}$/.test(value);
}

/** Default booking values per venue type, matching the backend defaults. */
export function defaultBookingValues(venueType: VenueType): {
  duration: string;
  partySize: string;
  buffer: string;
} {
  return venueType === "spa"
    ? { duration: "60", partySize: "4", buffer: "15" }
    : { duration: "90", partySize: "8", buffer: "0" };
}

/** Parse a positive integer input, falling back to a default. */
export function parsePositive(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
