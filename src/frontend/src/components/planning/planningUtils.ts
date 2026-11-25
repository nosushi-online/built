import type { BookingView, RoomTable } from "@/types";
import { BookingStatus } from "@/types";

export type ServiceKey = "lunch" | "dinner";

export interface ServiceWindow {
  key: ServiceKey;
  /** Inclusive start minute of day, in the venue timezone. */
  startMinute: number;
  /** Exclusive end minute of day. */
  endMinute: number;
}

/** Lunch 11:30–15:00, dinner 18:00–23:30. */
export const SERVICES: ServiceWindow[] = [
  { key: "lunch", startMinute: 11 * 60 + 30, endMinute: 15 * 60 },
  { key: "dinner", startMinute: 18 * 60, endMinute: 23 * 60 + 30 },
];

const ACTIVE_STATUSES = new Set<BookingStatus>([
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.seated,
  BookingStatus.finished,
]);

/** Minutes since midnight for a timestamp, in the venue timezone. */
export function minuteOfDay(timestamp: bigint, timezone: string): number {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return 0;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function serviceForMinute(minute: number): ServiceKey | null {
  const found = SERVICES.find(
    (service) => minute >= service.startMinute && minute < service.endMinute,
  );
  return found?.key ?? null;
}

export function bookingsForService(
  bookings: BookingView[],
  service: ServiceKey,
  timezone: string,
): BookingView[] {
  return bookings
    .filter((booking) => {
      if (!ACTIVE_STATUSES.has(booking.status)) return false;
      return (
        serviceForMinute(minuteOfDay(booking.startAt, timezone)) === service
      );
    })
    .sort((a, b) => Number(a.startAt - b.startAt));
}

export function coversOf(bookings: BookingView[]): number {
  return bookings.reduce(
    (total, booking) => total + Number(booking.partySize),
    0,
  );
}

export function capacityOf(tables: RoomTable[]): number {
  return tables
    .filter((table) => table.active)
    .reduce((total, table) => total + Number(table.maxSeats), 0);
}

/** The smallest active table that fits the party, else the largest free one. */
export function suggestTable(
  tables: RoomTable[],
  partySize: number,
  takenTableIds: Set<string>,
): RoomTable | null {
  const free = tables.filter(
    (table) =>
      table.active &&
      !takenTableIds.has(table.id.toString()) &&
      Number(table.maxSeats) >= partySize,
  );
  if (free.length === 0) return null;
  return free.sort((a, b) => Number(a.maxSeats - b.maxSeats))[0];
}

export function takenTableIds(bookings: BookingView[]): Set<string> {
  return new Set(
    bookings
      .filter((booking) => booking.tableId !== undefined)
      .map((booking) => booking.tableId?.toString() ?? ""),
  );
}

/** `HH:MM` options across a service window, every 15 minutes. */
export function timeOptions(service: ServiceKey): string[] {
  const window = SERVICES.find((s) => s.key === service) ?? SERVICES[0];
  const options: string[] = [];
  for (let m = window.startMinute; m < window.endMinute; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    options.push(
      `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    );
  }
  return options;
}

/**
 * Convert a `YYYY-MM-DD` date and `HH:MM` wall-clock time in a venue timezone
 * into a nanosecond UTC timestamp. Uses the zone offset at that instant.
 */
export function zonedTimestamp(
  date: string,
  time: string,
  timezone: string,
): bigint {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = zoneOffsetMs(new Date(utcGuess), timezone);
  return BigInt(utcGuess - offset) * 1_000_000n;
}

function zoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

/** Shift an ISO date by a number of days, staying in calendar space. */
export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}
