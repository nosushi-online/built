/**
 * Shared domain types for the Maison workspace.
 *
 * The generated bindings in `@/backend` are the single source of truth for
 * every backend contract type. This module re-exports them so pages have one
 * stable import surface, and declares only the UI-local types that the shell
 * needs on top of the contract.
 */

export type {
  AuditEntry,
  AuditId,
  Booking,
  BookingDefaults,
  BookingId,
  BookingView,
  ClosureDate,
  DayHours,
  EmailTemplate,
  FloorPosition,
  Guest,
  GuestFilters,
  GuestId,
  OnboardingState,
  ReminderLog,
  RoomTable,
  ServiceWindow,
  Slot,
  StatusHistoryEntry,
  TableId,
  TeamInvite,
  TeamMember,
  TemplateId,
  Timestamp,
  Timezone,
  Venue,
  VenueId,
  VenueTexts,
  Weekday,
} from "@/backend";

export {
  BookingSource,
  BookingStatus,
  Language,
  TableShape,
  TeamRole,
  TemplateKind,
  VenueType,
} from "@/backend";

/** Integer euro cents. */
export type Cents = bigint;

/** A venue the signed-in principal can access, with their role in it. */
export interface VenueMembership {
  venue: import("@/backend").Venue;
  role: import("@/backend").TeamRole;
}

/** Vertical navigation config: one entry per venue type. */
export interface NavItem {
  to: string;
  labelKey: string;
  icon: "planning" | "floor" | "guests" | "settings" | "agenda" | "clients";
  /** Minimum role required to see the link. */
  minRole: import("@/backend").TeamRole;
}
