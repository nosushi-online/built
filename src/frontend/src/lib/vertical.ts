import { TeamRole, VenueType } from "@/types";
import type { NavItem } from "@/types";

const ROLE_RANK: Record<TeamRole, number> = {
  [TeamRole.staff]: 1,
  [TeamRole.manager]: 2,
  [TeamRole.owner]: 3,
};

export function hasAtLeastRole(role: TeamRole, minRole: TeamRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/**
 * One vertical config drives the whole sidebar. Restaurant venues get the
 * service planning surface, spa venues get the agenda surface.
 */
export const VERTICAL_NAV: Record<VenueType, NavItem[]> = {
  restaurant: [
    {
      to: "/planning",
      labelKey: "nav.planning",
      icon: "planning",
      minRole: TeamRole.staff,
    },
    {
      to: "/floor",
      labelKey: "nav.floor",
      icon: "floor",
      minRole: TeamRole.staff,
    },
    {
      to: "/guests",
      labelKey: "nav.guests",
      icon: "guests",
      minRole: TeamRole.staff,
    },
    {
      to: "/settings",
      labelKey: "nav.settings",
      icon: "settings",
      minRole: TeamRole.manager,
    },
  ],
  spa: [
    {
      to: "/planning",
      labelKey: "nav.agenda",
      icon: "agenda",
      minRole: TeamRole.staff,
    },
    {
      to: "/guests",
      labelKey: "nav.clients",
      icon: "clients",
      minRole: TeamRole.staff,
    },
    {
      to: "/settings",
      labelKey: "nav.settings",
      icon: "settings",
      minRole: TeamRole.manager,
    },
  ],
};

export function navForVenue(type: VenueType, role: TeamRole): NavItem[] {
  return VERTICAL_NAV[type].filter((item) =>
    hasAtLeastRole(role, item.minRole),
  );
}

/** The landing route after sign-in for a venue type. */
export function homeRouteFor(type: VenueType): string {
  return type === VenueType.spa ? "/planning" : "/planning";
}
