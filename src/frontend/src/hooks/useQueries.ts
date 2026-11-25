import { createActor } from "@/backend";
import type {
  BookingView,
  Guest,
  RoomTable,
  TeamRole,
  Venue,
  VenueMembership,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

/**
 * The generated bindings are the source of truth. These hooks read the real
 * actor methods and adapt the contract shapes to the shell's view models.
 */

/** Polling interval that keeps planning and floor views in sync across devices. */
export const LIVE_POLL_MS = 15_000;

/**
 * `listMyVenues` returns the caller's venues; the role is resolved per venue
 * so the shell can gate navigation. A venue whose role cannot be read is
 * dropped rather than shown with an invented role.
 */
export function useMyVenues() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["venues", "mine"],
    queryFn: async (): Promise<VenueMembership[]> => {
      if (!actor) return [];
      const venues: Venue[] = await actor.listMyVenues();
      const withRoles = await Promise.all(
        venues.map(async (venue): Promise<VenueMembership | null> => {
          const role: TeamRole | null = await actor.getMyRole(venue.id);
          return role ? { venue, role } : null;
        }),
      );
      return withRoles.filter(
        (membership): membership is VenueMembership => membership !== null,
      );
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/** The venue the user is currently working in, plus their role there. */
export function useCurrentVenue() {
  const venues = useMyVenues();
  const memberships = venues.data ?? [];
  const current: VenueMembership | undefined = memberships[0];
  return {
    ...venues,
    memberships,
    venue: current?.venue,
    role: current?.role,
    hasVenue: memberships.length > 0,
  };
}

export function useMyRole(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["venues", "role", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<TeamRole | null> => {
      if (venueId === undefined || !actor) return null;
      return actor.getMyRole(venueId);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

/** Bookings for a single service date (`YYYY-MM-DD`). */
export function useBookingsForDate(date: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["bookings", "date", date ?? "none"],
    queryFn: async (): Promise<BookingView[]> => {
      if (date === undefined || !actor) return [];
      return actor.listBookingsForDate(date);
    },
    enabled: !!actor && !isFetching && date !== undefined,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useGuests(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["guests", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<Guest[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listGuests({
        optInOnly: false,
        tags: [],
        hasAllergies: false,
        vipOnly: false,
      });
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

export function useTables(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["tables", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<RoomTable[]> => {
      if (venueId === undefined || !actor) return [];
      const plan = await actor.getFloorPlan();
      return plan.tables;
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
    refetchInterval: LIVE_POLL_MS,
  });
}

export type { Venue };
