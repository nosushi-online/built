import { createActor } from "@/backend";
import type {
  BookingId,
  FloorPlan,
  FloorView,
  RoomTable,
  TableId,
  TableInput,
  TableUpdate,
} from "@/backend";
import { LIVE_POLL_MS } from "@/hooks/useQueries";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Floor plan reads and writes. The plan is polled so the editor and the live
 * floor converge, and every write invalidates both surfaces.
 */

export const FLOOR_PLAN_KEY = ["floor", "plan"] as const;
export const FLOOR_VIEW_KEY = ["floor", "view"] as const;

export function useFloorPlan(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: [...FLOOR_PLAN_KEY, venueId?.toString() ?? "none"],
    queryFn: async (): Promise<FloorPlan> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getFloorPlan();
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
    refetchInterval: LIVE_POLL_MS,
  });
}

export function useFloorView(
  venueId: bigint | undefined,
  date: string,
  service: string,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: [...FLOOR_VIEW_KEY, venueId?.toString() ?? "none", date, service],
    queryFn: async (): Promise<FloorView> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getFloorView(date, service);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
    refetchInterval: LIVE_POLL_MS,
  });
}

function useInvalidateFloor() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: FLOOR_PLAN_KEY });
    void queryClient.invalidateQueries({ queryKey: FLOOR_VIEW_KEY });
    void queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };
}

export function useCreateTable() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async (input: TableInput): Promise<RoomTable> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.createTable(input);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateTable() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async ({
      tableId,
      update,
    }: {
      tableId: TableId;
      update: TableUpdate;
    }): Promise<RoomTable> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updateTable(tableId, update);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeactivateTable() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async (tableId: TableId): Promise<RoomTable> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deactivateTable(tableId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteTable() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async (tableId: TableId): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deleteTable(tableId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSeatBooking() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async (bookingId: BookingId) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.seatBooking(bookingId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useFinishBooking() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateFloor();
  return useMutation({
    mutationFn: async (bookingId: BookingId) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.finishBooking(bookingId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}
