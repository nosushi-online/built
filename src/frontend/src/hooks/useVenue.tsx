import type { VenueMembership } from "@/types";
import {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

interface VenueContextValue {
  memberships: VenueMembership[];
  activeVenueId: bigint | undefined;
  setActiveVenueId: (id: bigint) => void;
  active: VenueMembership | undefined;
}

const VenueContext = createContext<VenueContextValue | null>(null);

/**
 * Holds which of the user's venues is active. The list itself comes from the
 * backend query; this only tracks the selection so the switcher and the
 * sidebar stay in agreement.
 */
export function VenueProvider({
  memberships,
  children,
}: {
  memberships: VenueMembership[];
  children: ReactNode;
}) {
  const [selectedId, setSelectedId] = useState<bigint | undefined>(undefined);

  const value = useMemo<VenueContextValue>(() => {
    const active =
      memberships.find((m) => m.venue.id === selectedId) ?? memberships[0];
    return {
      memberships,
      activeVenueId: active?.venue.id,
      setActiveVenueId: setSelectedId,
      active,
    };
  }, [memberships, selectedId]);

  return (
    <VenueContext.Provider value={value}>{children}</VenueContext.Provider>
  );
}

export function useVenue(): VenueContextValue {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenue must be used inside VenueProvider");
  }
  return context;
}
