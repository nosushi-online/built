import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { GuestFilters } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { GuestSort } from "./guestTags";
import { useGuestText } from "./guestText";

const DAY_NS = BigInt(86_400) * 1_000_000_000n;

const LAST_VISIT_OPTIONS = [
  { value: "90", days: 90n },
  { value: "180", days: 180n },
  { value: "365", days: 365n },
] as const;

const VISIT_OPTIONS = [3n, 5n, 10n] as const;

export function GuestFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
  tags,
  activeCount,
  onClear,
  now,
}: {
  filters: GuestFilters;
  onChange: (next: GuestFilters) => void;
  sort: GuestSort;
  onSortChange: (sort: GuestSort) => void;
  tags: string[];
  activeCount: number;
  onClear: () => void;
  now: bigint;
}) {
  const t = useGuestText();
  const { t: shellT } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const patch = (next: Partial<GuestFilters>) =>
    onChange({ ...filters, ...next });

  const toggleTag = (tag: string) => {
    const has = filters.tags.includes(tag);
    patch({
      tags: has
        ? filters.tags.filter((item) => item !== tag)
        : [...filters.tags, tag],
    });
  };

  const lastVisitValue =
    filters.lastVisitBefore === undefined
      ? "any"
      : String(
          LAST_VISIT_OPTIONS.find(
            (option) => now - option.days * DAY_NS === filters.lastVisitBefore,
          )?.value ?? "any",
        );

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 md:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            data-ocid="guests.search_input"
            value={filters.search ?? ""}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder={t("guests.searchPlaceholder")}
            className="h-10 pl-9"
            aria-label={shellT("common.search")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={expanded ? "secondary" : "outline"}
            data-ocid="guests.filters.toggle"
            className="h-10"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {t("guests.filters")}
            {activeCount > 0 && (
              <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as GuestSort)}
          >
            <SelectTrigger
              data-ocid="guests.sort.select"
              className="h-10 w-auto min-w-36"
              aria-label={t("guests.sort")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("guests.sort.recent")}</SelectItem>
              <SelectItem value="name">{t("guests.sort.name")}</SelectItem>
              <SelectItem value="visits">{t("guests.sort.visits")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border pt-3 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            <FilterToggle
              active={filters.vipOnly}
              onClick={() => patch({ vipOnly: !filters.vipOnly })}
              ocid="guests.filter.vip"
            >
              {t("guests.filter.vip")}
            </FilterToggle>
            <FilterToggle
              active={filters.hasAllergies}
              onClick={() => patch({ hasAllergies: !filters.hasAllergies })}
              ocid="guests.filter.allergies"
            >
              {t("guests.filter.allergies")}
            </FilterToggle>
            <FilterToggle
              active={filters.optInOnly}
              onClick={() => patch({ optInOnly: !filters.optInOnly })}
              ocid="guests.filter.optin"
            >
              {t("guests.filter.optIn")}
            </FilterToggle>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="label-caps">{t("guests.filter.minVisits")}</p>
              <div className="flex flex-wrap gap-2">
                <FilterToggle
                  active={filters.minVisits === undefined}
                  onClick={() => patch({ minVisits: undefined })}
                  ocid="guests.filter.visits.any"
                >
                  {t("guests.filter.any")}
                </FilterToggle>
                {VISIT_OPTIONS.map((count) => (
                  <FilterToggle
                    key={count.toString()}
                    active={filters.minVisits === count}
                    onClick={() => patch({ minVisits: count })}
                    ocid={`guests.filter.visits.${count}`}
                  >
                    {t(
                      `guests.filter.visits.${count}` as "guests.filter.visits.3",
                    )}
                  </FilterToggle>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="label-caps">{t("guests.filter.lastVisit")}</p>
              <Select
                value={lastVisitValue}
                onValueChange={(value) => {
                  if (value === "any") {
                    patch({ lastVisitBefore: undefined });
                    return;
                  }
                  const option = LAST_VISIT_OPTIONS.find(
                    (item) => item.value === value,
                  );
                  patch({
                    lastVisitBefore: option
                      ? now - option.days * DAY_NS
                      : undefined,
                  });
                }}
              >
                <SelectTrigger
                  data-ocid="guests.filter.lastVisit.select"
                  className="h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t("guests.filter.any")}</SelectItem>
                  <SelectItem value="90">
                    {t("guests.filter.lastVisit.90")}
                  </SelectItem>
                  <SelectItem value="180">
                    {t("guests.filter.lastVisit.180")}
                  </SelectItem>
                  <SelectItem value="365">
                    {t("guests.filter.lastVisit.year")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-1.5">
              <p className="label-caps">{t("guests.filter.tags")}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <FilterToggle
                    key={tag}
                    active={filters.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    ocid={`guests.filter.tag.${tag}`}
                  >
                    {tag}
                  </FilterToggle>
                ))}
              </div>
            </div>
          )}

          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-ocid="guests.filters.clear_button"
              onClick={onClear}
              className="text-muted-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
              {t("guests.clearFilters")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterToggle({
  active,
  onClick,
  children,
  ocid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ocid: string;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-smooth",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
