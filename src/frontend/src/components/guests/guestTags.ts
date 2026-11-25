import type { Guest, GuestFilters, Timestamp } from "@/types";

const DAY_MS = 86_400_000;
const NINETY_DAYS_NS = BigInt(90) * BigInt(DAY_MS) * 1_000_000n;

export type AutoTag = "regular" | "atRisk" | "noShowRisk";

export interface GuestTag {
  key: string;
  labelKey:
    | "guests.tag.regular"
    | "guests.tag.atRisk"
    | "guests.tag.noShowRisk"
    | "guests.tag.vip"
    | "guests.tag.allergy"
    | "guests.tag.manual";
  tone: "auto" | "warn" | "danger" | "vip" | "allergy";
  automatic: boolean;
}

/**
 * Automatic tags are derived from the guest's own history so the list and the
 * profile always agree: Regular after 3 visits, At risk after 90 days without a
 * visit, and No-show risk when absences reach a third of the visits.
 */
export function deriveAutoTags(guest: Guest, now: Timestamp): AutoTag[] {
  const tags: AutoTag[] = [];
  if (guest.visitCount >= 3n) tags.push("regular");
  if (
    guest.lastVisitAt !== undefined &&
    now - guest.lastVisitAt > NINETY_DAYS_NS
  ) {
    tags.push("atRisk");
  }
  if (guest.noShowCount > 0n && guest.noShowCount * 3n >= guest.visitCount) {
    tags.push("noShowRisk");
  }
  return tags;
}

const AUTO_LABEL: Record<AutoTag, GuestTag["labelKey"]> = {
  regular: "guests.tag.regular",
  atRisk: "guests.tag.atRisk",
  noShowRisk: "guests.tag.noShowRisk",
};

const AUTO_TONE: Record<AutoTag, GuestTag["tone"]> = {
  regular: "auto",
  atRisk: "warn",
  noShowRisk: "danger",
};

/** Automatic tags first, then VIP/allergy flags, then the manual tags. */
export function guestTags(guest: Guest, now: Timestamp): GuestTag[] {
  const tags: GuestTag[] = deriveAutoTags(guest, now).map((key) => ({
    key,
    labelKey: AUTO_LABEL[key],
    tone: AUTO_TONE[key],
    automatic: true,
  }));
  if (guest.vip) {
    tags.push({
      key: "vip",
      labelKey: "guests.tag.vip",
      tone: "vip",
      automatic: false,
    });
  }
  if (guest.allergies && guest.allergies.trim() !== "") {
    tags.push({
      key: "allergy",
      labelKey: "guests.tag.allergy",
      tone: "allergy",
      automatic: false,
    });
  }
  for (const tag of guest.tags) {
    tags.push({
      key: `manual-${tag}`,
      labelKey: "guests.tag.manual",
      tone: "auto",
      automatic: false,
    });
  }
  return tags;
}

/** Every distinct manual tag across the venue, for the filter chips. */
export function collectTags(guests: Guest[]): string[] {
  const set = new Set<string>();
  for (const guest of guests) {
    for (const tag of guest.tags) set.add(tag);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export const EMPTY_FILTERS: GuestFilters = {
  optInOnly: false,
  tags: [],
  hasAllergies: false,
  vipOnly: false,
};

export function countActiveFilters(filters: GuestFilters): number {
  let count = 0;
  if (filters.search && filters.search.trim() !== "") count += 1;
  if (filters.tags.length > 0) count += 1;
  if (filters.vipOnly) count += 1;
  if (filters.hasAllergies) count += 1;
  if (filters.optInOnly) count += 1;
  if (filters.minVisits !== undefined) count += 1;
  if (filters.lastVisitBefore !== undefined) count += 1;
  return count;
}

export type GuestSort = "recent" | "name" | "visits";

export function sortGuests(guests: Guest[], sort: GuestSort): Guest[] {
  const copy = [...guests];
  copy.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "visits") return Number(b.visitCount - a.visitCount);
    const aLast = a.lastVisitAt ?? 0n;
    const bLast = b.lastVisitAt ?? 0n;
    return aLast === bLast ? 0 : aLast > bLast ? -1 : 1;
  });
  return copy;
}
