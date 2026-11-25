import { createActor } from "@/backend";
import type { TableInput, TableUpdate } from "@/backend";
import type {
  AuditEntry,
  ClosureDate,
  DayHours,
  EmailTemplate,
  RoomTable,
  TeamInvite,
  TeamMember,
  TemplateId,
  Venue,
} from "@/types";
import { Language, type TeamRole, TemplateKind } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Settings data layer. Every call goes through the generated actor; the venue
 * id is passed explicitly because settings always act on the active house.
 */

const AUDIT_LIMIT = 50n;

export function useVenueDetail(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["venue", "detail", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<Venue | null> => {
      if (venueId === undefined || !actor) return null;
      return actor.getVenue(venueId);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

export function useTeamMembers(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["team", "members", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<TeamMember[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listTeamMembers(venueId);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

export function useTeamInvites(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["team", "invites", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<TeamInvite[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listTeamInvites(venueId);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

function useInvalidateTeam(venueId: bigint | undefined) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ["team", "members", venueId?.toString() ?? "none"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["team", "invites", venueId?.toString() ?? "none"],
    });
  };
}

export function useInviteMember(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTeam(venueId);
  return useMutation({
    mutationFn: async (input: { email: string; role: TeamRole }) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.inviteMember(venueId, input.email, input.role);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useChangeMemberRole(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTeam(venueId);
  return useMutation({
    mutationFn: async (input: {
      principal: TeamMember["principal"];
      role: TeamRole;
    }) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.changeMemberRole(venueId, input.principal, input.role);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useRemoveMember(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTeam(venueId);
  return useMutation({
    mutationFn: async (principal: TeamMember["principal"]) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.removeMember(venueId, principal);
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useSetOpeningHours(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hours: DayHours[]) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.setOpeningHours(venueId, hours);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["venue", "detail", venueId?.toString() ?? "none"],
      });
    },
  });
}

export function useAddClosure(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (closure: ClosureDate) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.addClosure(venueId, closure);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["venue", "detail", venueId?.toString() ?? "none"],
      });
    },
  });
}

export function useRemoveClosure(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      if (!actor || venueId === undefined) throw new Error("Backend not ready");
      return actor.removeClosure(venueId, date);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["venue", "detail", venueId?.toString() ?? "none"],
      });
    },
  });
}

export function useFloorTables(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["tables", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<RoomTable[]> => {
      if (venueId === undefined || !actor) return [];
      const plan = await actor.getFloorPlan();
      return plan.tables;
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

function useInvalidateTables(venueId: bigint | undefined) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: ["tables", venueId?.toString() ?? "none"],
    });
  };
}

export function useCreateTable(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTables(venueId);
  return useMutation({
    mutationFn: async (input: TableInput) => {
      if (!actor) throw new Error("Backend not ready");
      const result = await actor.createTable(input);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUpdateTable(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTables(venueId);
  return useMutation({
    mutationFn: async (input: { id: bigint; update: TableUpdate }) => {
      if (!actor) throw new Error("Backend not ready");
      const result = await actor.updateTable(input.id, input.update);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useDeactivateTable(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const invalidate = useInvalidateTables(venueId);
  return useMutation({
    mutationFn: async (tableId: bigint) => {
      if (!actor) throw new Error("Backend not ready");
      const result = await actor.deactivateTable(tableId);
      if (result.__kind__ === "err") throw new Error(result.err.__kind__);
      return result.ok;
    },
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useEmailTemplates(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["templates", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<EmailTemplate[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listEmailTemplates(venueId);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

export function useUpdateEmailTemplate(venueId: bigint | undefined) {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: TemplateId;
      subject: string;
      body: string;
    }) => {
      if (!actor) throw new Error("Backend not ready");
      return actor.updateEmailTemplate(input.id, input.subject, input.body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["templates", venueId?.toString() ?? "none"],
      });
    },
  });
}

export function usePreviewEmailTemplate() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (id: TemplateId) => {
      if (!actor) throw new Error("Backend not ready");
      return actor.previewEmailTemplate(id);
    },
  });
}

export function useSendTestEmail() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (input: { id: TemplateId; recipient: string }) => {
      if (!actor) throw new Error("Backend not ready");
      const result = await actor.sendTestEmail(input.id, input.recipient);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
  });
}

export function useRecentAudit(venueId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["audit", venueId?.toString() ?? "none"],
    queryFn: async (): Promise<AuditEntry[]> => {
      if (venueId === undefined || !actor) return [];
      return actor.listRecentAudit(venueId, AUDIT_LIMIT);
    },
    enabled: !!actor && !isFetching && venueId !== undefined,
  });
}

/** Template kinds in the order the settings screen presents them. */
export const TEMPLATE_KINDS: TemplateKind[] = [
  TemplateKind.confirmation,
  TemplateKind.modification,
  TemplateKind.cancellation,
  TemplateKind.reminder,
];

export const TEMPLATE_LANGUAGES: Language[] = [Language.fr, Language.en];
