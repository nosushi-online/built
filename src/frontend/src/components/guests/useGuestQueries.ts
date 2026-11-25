import { createActor } from "@/backend";
import type {
  ColumnMapping,
  GuestError,
  GuestInput,
  GuestProfile,
  ImportResult,
  MergeResult,
  PrivacyExport,
} from "@/backend";
import type { Guest, GuestFilters, GuestId } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Query keys shared by the guest list and the guest profile. */
export const guestKeys = {
  all: ["guests"] as const,
  list: (venueId: bigint | undefined) =>
    ["guests", "list", venueId?.toString() ?? "none"] as const,
  profile: (guestId: bigint | undefined) =>
    ["guests", "profile", guestId?.toString() ?? "none"] as const,
};

/** Searchable guest list for the active venue, driven by the filter object. */
export function useGuestList(
  venueId: bigint | undefined,
  filters: GuestFilters,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: [...guestKeys.list(venueId), filters],
    queryFn: async (): Promise<Guest[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listGuests(filters);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

/** One guest with their booking history. */
export function useGuestProfile(guestId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: guestKeys.profile(guestId),
    queryFn: async (): Promise<GuestProfile | null> => {
      if (guestId === undefined || !actor) return null;
      return actor.getGuestProfile(guestId);
    },
    enabled: !!actor && !isFetching && guestId !== undefined,
  });
}

function useInvalidateGuests() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: guestKeys.all });
  };
}

export function useCreateGuest() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (input: GuestInput): Promise<Guest> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.createGuest(input);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateGuest() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (vars: {
      guestId: GuestId;
      input: GuestInput;
    }): Promise<Guest> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updateGuest(vars.guestId, vars.input);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useMergeGuests() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (vars: {
      keepId: GuestId;
      mergeId: GuestId;
    }): Promise<MergeResult> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.mergeGuests(vars.keepId, vars.mergeId);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useImportGuestsCsv() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (vars: {
      csv: string;
      mapping: ColumnMapping;
    }): Promise<ImportResult> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.importGuestsCsv(vars.csv, vars.mapping);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useExportGuestsCsv() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.exportGuestsCsv();
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
  });
}

export function useExportGuestData() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (guestId: GuestId): Promise<PrivacyExport> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.exportGuestData(guestId);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
  });
}

export function useAnonymizeGuest() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (guestId: GuestId): Promise<Guest> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.anonymizeGuest(guestId);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeleteGuest() {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateGuests();
  return useMutation({
    mutationFn: async (guestId: GuestId): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deleteGuest(guestId);
      if (result.__kind__ === "err") throw new GuestActionError(result.err);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

/** Carries the backend's typed guest error so screens can explain it. */
export class GuestActionError extends Error {
  readonly guestError: GuestError;
  constructor(guestError: GuestError) {
    super(guestError.__kind__);
    this.name = "GuestActionError";
    this.guestError = guestError;
  }
}
