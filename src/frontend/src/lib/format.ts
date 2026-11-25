import type { Cents, Language, Timestamp } from "@/types";

/** Motoko `Time.now()` is nanoseconds; convert before any Date operation. */
export function timestampToDate(timestamp: Timestamp): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

const LOCALES: Record<Language, string> = { fr: "fr-FR", en: "en-GB" };

export function formatMoney(cents: Cents, language: Language): string {
  return new Intl.NumberFormat(LOCALES[language], {
    style: "currency",
    currency: "EUR",
  }).format(Number(cents) / 100);
}

export function formatTime(
  timestamp: Timestamp,
  timezone: string,
  language: Language,
): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALES[language], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatDate(
  timestamp: Timestamp,
  timezone: string,
  language: Language,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  },
): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat(LOCALES[language], {
    ...options,
    timeZone: timezone,
  }).format(date);
}

/** ISO `YYYY-MM-DD` for a Date in a given IANA timezone. */
export function isoDateInZone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
