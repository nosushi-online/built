import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { VenueMembership } from "@/types";
import { Check, ChevronsUpDown } from "lucide-react";

export function VenueSwitcher({
  memberships,
  activeVenueId,
  onSelect,
}: {
  memberships: VenueMembership[];
  activeVenueId: bigint | undefined;
  onSelect: (id: bigint) => void;
}) {
  const { t } = useI18n();
  const active = memberships.find((m) => m.venue.id === activeVenueId);

  if (!active) return null;

  // A single venue needs no switcher chrome.
  if (memberships.length === 1) {
    return (
      <div data-ocid="venue.current" className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-foreground">
          {active.venue.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {active.venue.venueType === "spa"
            ? t("venue.type.spa")
            : t("venue.type.restaurant")}
        </p>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-ocid="venue.switcher"
        className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 text-left transition-smooth hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {active.venue.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t(`role.${active.role}` as never)}
          </p>
        </div>
        <ChevronsUpDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("venue.switcher")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => {
          const isActive = membership.venue.id === activeVenueId;
          return (
            <DropdownMenuItem
              key={membership.venue.id.toString()}
              data-ocid={`venue.option.${membership.venue.publicSlug}`}
              onSelect={() => onSelect(membership.venue.id)}
              className={cn(
                "flex items-center justify-between gap-2",
                isActive && "bg-secondary",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {membership.venue.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t(`role.${membership.role}` as never)}
                </span>
              </span>
              {isActive && (
                <Check className="size-4 text-primary" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
