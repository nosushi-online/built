import { createActor } from "@/backend";
import type { CreateInput, GuestInput } from "@/backend";
import type { BookingStatus, BookingView, Guest, RoomTable } from "@/types";
import { BookingSource } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Unwrap the backend's `{ ok } | { err }` result into a value or a thrown error. */
function unwrap<T, E>(
  result: { __kind__: "ok"; ok: T } | { __kind__: "err"; err: E },
): T {
  if (result.__kind__ === "ok") return result.ok;
  throw new Error(describeError(result.err));
}

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "__kind__" in err) {
    const kind = (err as { __kind__: string }).__kind__;
    const payload = (err as Record<string, unknown>)[kind];
    if (typeof payload === "string") return payload;
    return kind;
  }
  return "unknown";
}

function invalidatePlanning(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["bookings"] });
  void queryClient.invalidateQueries({ queryKey: ["guests"] });
  void queryClient.invalidateQueries({ queryKey: ["tables"] });
}

export function useCreateGuest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuestInput): Promise<Guest> => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createGuest(input));
    },
    onSuccess: () => {
      invalidatePlanning(queryClient);
    },
  });
}

export function useCreateBooking() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput): Promise<BookingView> => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(await actor.createBooking(input));
    },
    onSuccess: () => {
      invalidatePlanning(queryClient);
    },
  });
}

export function useChangeBookingStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      bookingId: bigint;
      status: BookingStatus;
    }): Promise<BookingView> => {
      if (!actor) throw new Error("Backend is not ready");
      return unwrap(
        await actor.changeBookingStatus(vars.bookingId, vars.status),
      );
    },
    onSuccess: () => {
      invalidatePlanning(queryClient);
    },
  });
}

export { BookingSource };
export type { BookingView, Guest, RoomTable };
