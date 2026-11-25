import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { NavItem, TeamRole, VenueType } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  LayoutGrid,
  Settings,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const ICONS = {
  planning: CalendarDays,
  floor: LayoutGrid,
  guests: Users,
  settings: Settings,
  agenda: Sparkles,
  clients: Users,
} as const;

export function SidebarNav({
  items,
  venueType,
  role,
  onNavigate,
}: {
  items: NavItem[];
  venueType: VenueType;
  role: TeamRole;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const serviceItems = items.filter((item) => item.to !== "/settings");
  const houseItems = items.filter((item) => item.to === "/settings");

  const renderItem = (item: NavItem) => {
    const Icon = ICONS[item.icon];
    return (
      <li key={item.to}>
        <Link
          to={item.to}
          onClick={onNavigate}
          data-ocid={`nav.${item.to.replace("/", "")}`}
          activeProps={{
            className:
              "bg-sidebar-accent text-sidebar-accent-foreground before:opacity-100",
          }}
          className="group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 transition-smooth before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:opacity-0 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{t(item.labelKey as never)}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={t("app.name")} className="flex flex-col gap-6">
      <div>
        <p className="label-caps mb-2 px-3 text-sidebar-foreground/50">
          {t("nav.section.service")}
        </p>
        <ul className="space-y-1">{serviceItems.map(renderItem)}</ul>
      </div>
      {houseItems.length > 0 && (
        <div>
          <p className="label-caps mb-2 px-3 text-sidebar-foreground/50">
            {t("nav.section.house")}
          </p>
          <ul className="space-y-1">{houseItems.map(renderItem)}</ul>
        </div>
      )}
      <p className="mt-auto px-3 pt-4 text-[11px] uppercase tracking-[0.14em] text-sidebar-foreground/40">
        {venueType === "spa" ? t("venue.type.spa") : t("venue.type.restaurant")}{" "}
        · {t(`role.${role}` as never)}
      </p>
    </nav>
  );
}

export function SidebarBrand({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      to="/"
      data-ocid="nav.brand"
      className={cn("flex items-center gap-2.5", className)}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <UtensilsCrossed className="size-4" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
        {t("app.name")}
      </span>
    </Link>
  );
}
