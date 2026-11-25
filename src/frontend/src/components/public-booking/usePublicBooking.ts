import { createActor } from "@/backend";
import type {
  Availability,
  PublicManageView,
  PublicVenuePage,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Public venue page (logo, colours, hours) keyed by the venue's public slug. */
export function usePublicVenue(slug: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["public", "venue", slug],
    queryFn: async (): Promise<PublicVenuePage | null> => {
      if (!actor) return null;
      return actor.getPublicVenuePage(slug);
    },
    enabled: !!actor && !isFetching && slug.length > 0,
    staleTime: 60_000,
  });
}

/** Free slots for a date and party size. */
export function usePublicAvailability(
  slug: string,
  date: string,
  partySize: number,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["public", "availability", slug, date, partySize],
    queryFn: async (): Promise<Availability | null> => {
      if (!actor) return null;
      return actor.getPublicAvailability(slug, date, BigInt(partySize));
    },
    enabled: !!actor && !isFetching && slug.length > 0 && date.length > 0,
    staleTime: 20_000,
  });
}

export interface PublicBookingInput {
  slug: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  partySize: number;
  startAt: bigint;
  notes: string | null;
  honeypot: string;
}

export function useCreatePublicBooking() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: PublicBookingInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createPublicBooking(
        input.slug,
        input.guestName,
        input.guestPhone,
        input.guestEmail,
        BigInt(input.partySize),
        input.startAt,
        input.notes,
        input.honeypot,
      );
    },
  });
}

/** A booking looked up by its cancel token. */
export function usePublicBooking(token: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["public", "booking", token],
    queryFn: async (): Promise<PublicManageView | null> => {
      if (!actor) return null;
      return actor.getPublicBooking(token);
    },
    enabled: !!actor && !isFetching && token.length > 0,
  });
}

export interface ModifyPublicBookingInput {
  token: string;
  partySize: number | null;
  startAt: bigint | null;
  notes: string | null;
}

export function useModifyPublicBooking() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ModifyPublicBookingInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.modifyPublicBooking(
        input.token,
        input.partySize === null ? null : BigInt(input.partySize),
        input.startAt,
        input.notes,
      );
    },
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({
        queryKey: ["public", "booking", input.token],
      });
    },
  });
}

export function useCancelPublicBooking() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.cancelPublicBooking(token);
    },
    onSuccess: (_result, token) => {
      void queryClient.invalidateQueries({
        queryKey: ["public", "booking", token],
      });
    },
  });
}
