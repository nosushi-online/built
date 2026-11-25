import type { GuestInput } from "@/backend";
import { CsvImportDialog } from "@/components/guests/CsvImportDialog";
import { GuestFilterBar } from "@/components/guests/GuestFilterBar";
import { GuestFormDialog } from "@/components/guests/GuestFormDialog";
import { GuestCardList, GuestTable } from "@/components/guests/GuestList";
import { MergeGuestsDialog } from "@/components/guests/MergeGuestsDialog";
import { downloadText } from "@/components/guests/csv";
import {
  EMPTY_FILTERS,
  type GuestSort,
  collectTags,
  countActiveFilters,
  sortGuests,
} from "@/components/guests/guestTags";
import { useGuestText } from "@/components/guests/guestText";
import {
  useCreateGuest,
  useExportGuestsCsv,
  useGuestList,
  useImportGuestsCsv,
  useMergeGuests,
} from "@/components/guests/useGuestQueries";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { hasAtLeastRole } from "@/lib/vertical";
import { type GuestFilters, TeamRole } from "@/types";
import { Download, Merge, Plus, Upload, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function GuestsPage() {
  const t = useGuestText();
  const { language, t: shellT } = useI18n();
  const { active } = useVenue();
  const venueId = active?.venue.id;
  const role = active?.role ?? TeamRole.staff;
  const canManage = hasAtLeastRole(role, TeamRole.manager);

  const [filters, setFilters] = useState<GuestFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<GuestSort>("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const guestsQuery = useGuestList(venueId, filters);
  const createGuest = useCreateGuest();
  const importCsv = useImportGuestsCsv();
  const exportCsv = useExportGuestsCsv();
  const mergeGuests = useMergeGuests();

  const now = BigInt(Date.now()) * 1_000_000n;
  const guests = guestsQuery.data ?? [];
  const sorted = useMemo(() => sortGuests(guests, sort), [guests, sort]);
  const tags = useMemo(() => collectTags(guests), [guests]);
  const activeCount = countActiveFilters(filters);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleSelect = (id: bigint) => {
    const key = id.toString();
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const handleCreate = (input: GuestInput) => {
    createGuest.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        toast.success(t("guests.form.created"));
      },
      onError: () => toast.error(t("guests.form.error")),
    });
  };

  const handleExport = () => {
    exportCsv.mutate(undefined, {
      onSuccess: (csv) => {
        downloadText("clients.csv", csv, "text/csv;charset=utf-8");
        toast.success(t("guests.exportDone", { count: guests.length }));
      },
      onError: () => toast.error(t("guests.exportError")),
    });
  };

  const handleMerge = (keepId: bigint, mergeId: bigint) => {
    mergeGuests.mutate(
      { keepId, mergeId },
      {
        onSuccess: (result) => {
          setMergeOpen(false);
          setSelected([]);
          toast.success(
            t("guests.merge.done", {
              count: Number(result.mergedBookings),
            }),
          );
        },
        onError: () => toast.error(t("guests.merge.error")),
      },
    );
  };

  const openMerge = () => {
    if (selected.length !== 2) {
      toast.error(t("guests.merge.needTwo"));
      return;
    }
    setMergeOpen(true);
  };

  const countLabel =
    guests.length === 1
      ? t("guests.countOne")
      : t("guests.count", { count: guests.length });

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title={shellT("page.guests.title")}
        subtitle={shellT("page.guests.subtitle")}
        actions={
          <>
            {canManage && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="guests.import_button"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="size-4" aria-hidden="true" />
                  {t("guests.import")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="guests.export_button"
                  onClick={handleExport}
                  disabled={exportCsv.isPending}
                >
                  <Download className="size-4" aria-hidden="true" />
                  {exportCsv.isPending
                    ? t("guests.exporting")
                    : t("guests.export")}
                </Button>
              </>
            )}
            <Button
              type="button"
              data-ocid="guests.add_button"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("guests.add")}
            </Button>
          </>
        }
      />

      <GuestFilterBar
        filters={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSort}
        tags={tags}
        activeCount={activeCount}
        onClear={() => setFilters(EMPTY_FILTERS)}
        now={now}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{countLabel}</p>
        {canManage && (
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid="guests.merge.clear_button"
                onClick={() => setSelected([])}
              >
                {t("guests.merge.clear")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="guests.merge.open_button"
              onClick={openMerge}
              disabled={selected.length !== 2}
              title={selected.length === 2 ? undefined : t("guests.merge.hint")}
            >
              <Merge className="size-4" aria-hidden="true" />
              {t("guests.merge")}
              {selected.length > 0 && ` (${selected.length})`}
            </Button>
          </div>
        )}
      </div>

      {guestsQuery.isLoading ? (
        <LoadingState rows={6} />
      ) : guestsQuery.isError ? (
        <ErrorState onRetry={() => void guestsQuery.refetch()} />
      ) : sorted.length === 0 ? (
        activeCount > 0 ? (
          <EmptyState
            ocid="guests.empty_state"
            icon={<Users className="size-5" aria-hidden="true" />}
            title={t("guests.empty.filtered.title")}
            description={t("guests.empty.filtered.body")}
            action={
              <Button
                type="button"
                variant="outline"
                data-ocid="guests.empty.clear_button"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                {t("guests.clearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            ocid="guests.empty_state"
            icon={<Users className="size-5" aria-hidden="true" />}
            title={t("guests.empty.title")}
            description={t("guests.empty.body")}
            action={
              <Button
                type="button"
                data-ocid="guests.empty.add_button"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("guests.add")}
              </Button>
            }
          />
        )
      ) : (
        <>
          <GuestTable
            guests={sorted}
            now={now}
            timezone={active?.venue.timezone ?? "Europe/Paris"}
            language={language}
            selectable={canManage}
            selectedIds={selectedSet}
            onToggleSelect={toggleSelect}
          />
          <GuestCardList
            guests={sorted}
            now={now}
            timezone={active?.venue.timezone ?? "Europe/Paris"}
            language={language}
            selectable={canManage}
            selectedIds={selectedSet}
            onToggleSelect={toggleSelect}
          />
        </>
      )}

      <GuestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pending={createGuest.isPending}
        onSubmit={handleCreate}
      />

      {canManage && (
        <>
          <CsvImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            pending={importCsv.isPending}
            onSubmit={(csv, mapping) =>
              importCsv.mutate(
                { csv, mapping },
                {
                  onSuccess: (result) => {
                    setImportOpen(false);
                    toast.success(
                      t("guests.import.done", {
                        imported: Number(result.imported),
                        skipped: Number(result.skipped),
                      }),
                    );
                  },
                  onError: () => toast.error(t("guests.import.error")),
                },
              )
            }
          />
          <MergeGuestsDialog
            open={mergeOpen}
            onOpenChange={setMergeOpen}
            guests={guests}
            keepId={selected[0] ? BigInt(selected[0]) : undefined}
            mergeId={selected[1] ? BigInt(selected[1]) : undefined}
            pending={mergeGuests.isPending}
            onSubmit={handleMerge}
          />
        </>
      )}
    </div>
  );
}
