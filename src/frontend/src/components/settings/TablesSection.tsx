import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { RoomTable, TableShape } from "@/types";
import { TableShape as Shape } from "@/types";
import { Armchair, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import {
  Field,
  InlineError,
  SettingsSection,
  useSettingsText,
} from "./SettingsPrimitives";
import {
  useCreateTable,
  useDeactivateTable,
  useFloorTables,
  useUpdateTable,
} from "./useSettingsQueries";

interface TableDraft {
  name: string;
  room: string;
  minSeats: string;
  maxSeats: string;
  combinable: boolean;
  active: boolean;
}

const EMPTY_DRAFT: TableDraft = {
  name: "",
  room: "",
  minSeats: "2",
  maxSeats: "4",
  combinable: false,
  active: true,
};

function draftFrom(table: RoomTable): TableDraft {
  return {
    name: table.name,
    room: table.room,
    minSeats: table.minSeats.toString(),
    maxSeats: table.maxSeats.toString(),
    combinable: table.combinable,
    active: table.active,
  };
}

/** New tables get a neutral default position; the floor editor refines it. */
const DEFAULT_POSITION = {
  x: 40n,
  y: 40n,
  width: 120n,
  height: 80n,
  rotation: 0n,
  shape: Shape.rectangle as TableShape,
};

export function TablesSection({ venueId }: { venueId: bigint }) {
  const s = useSettingsText();
  const { t } = useI18n();
  const tables = useFloorTables(venueId);
  const createTable = useCreateTable(venueId);
  const updateTable = useUpdateTable(venueId);
  const deactivateTable = useDeactivateTable(venueId);

  const [editing, setEditing] = useState<RoomTable | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TableDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setOpen(true);
  };

  const openEdit = (table: RoomTable) => {
    setEditing(table);
    setDraft(draftFrom(table));
    setError(null);
    setOpen(true);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const min = Number(draft.minSeats);
    const max = Number(draft.maxSeats);
    if (!draft.name.trim() || !draft.room.trim()) {
      setError(s("tables.saveError"));
      return;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      setError(s("tables.invalidSeats"));
      return;
    }
    setError(null);
    const payload = {
      name: draft.name.trim(),
      room: draft.room.trim(),
      minSeats: BigInt(min),
      maxSeats: BigInt(max),
      combinable: draft.combinable,
    };
    if (editing) {
      updateTable.mutate(
        {
          id: editing.id,
          update: { ...payload, active: draft.active },
        },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createTable.mutate(
        { ...payload, position: DEFAULT_POSITION },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const list = tables.data ?? [];
  const saving = createTable.isPending || updateTable.isPending;

  return (
    <SettingsSection
      ocid="settings.tables.section"
      title={s("tables.title")}
      description={s("tables.subtitle")}
      actions={
        <Button
          type="button"
          data-ocid="settings.tables.add_button"
          onClick={openCreate}
        >
          <Plus className="size-4" aria-hidden="true" />
          {s("tables.add")}
        </Button>
      }
    >
      {tables.isLoading ? (
        <p className="text-sm text-muted-foreground">{s("tables.empty")}</p>
      ) : list.length === 0 ? (
        <div
          data-ocid="settings.tables.empty_state"
          className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Armchair className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground">{s("tables.empty")}</p>
          <Button type="button" variant="outline" onClick={openCreate}>
            {s("tables.add")}
          </Button>
        </div>
      ) : (
        <ul
          data-ocid="settings.tables.list"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {list.map((table, index) => (
            <li
              key={table.id.toString()}
              data-ocid={`settings.tables.item.${index + 1}`}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 transition-smooth",
                !table.active && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-foreground">
                    {table.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {table.room}
                  </p>
                </div>
                <Badge
                  variant={table.active ? "default" : "secondary"}
                  className={cn(
                    "shrink-0",
                    table.active && "bg-success text-success-foreground",
                  )}
                >
                  {table.active ? s("tables.active") : s("tables.inactive")}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground tabular-nums">
                  {s("tables.seats", {
                    min: table.minSeats.toString(),
                    max: table.maxSeats.toString(),
                  })}
                </span>
                {table.combinable && (
                  <span className="rounded-md border border-border px-2 py-0.5">
                    {s("tables.combinable")}
                  </span>
                )}
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid={`settings.tables.edit_button.${index + 1}`}
                  onClick={() => openEdit(table)}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  {s("tables.edit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-ocid={`settings.tables.toggle_button.${index + 1}`}
                  disabled={deactivateTable.isPending}
                  onClick={() => {
                    if (table.active) {
                      deactivateTable.mutate(table.id);
                    } else {
                      updateTable.mutate({
                        id: table.id,
                        update: { active: true },
                      });
                    }
                  }}
                >
                  {table.active ? s("tables.deactivate") : s("tables.activate")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deactivateTable.isError && (
        <div className="mt-3">
          <InlineError message={s("tables.toggleError")} />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="settings.tables.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? s("tables.editTitle") : s("tables.createTitle")}
            </DialogTitle>
            <DialogDescription>{s("tables.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={s("tables.name")} htmlFor="table-name">
                <Input
                  id="table-name"
                  data-ocid="settings.tables.name_input"
                  placeholder={s("tables.namePlaceholder")}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((d) => ({ ...d, name: event.target.value }))
                  }
                />
              </Field>
              <Field label={s("tables.room")} htmlFor="table-room">
                <Input
                  id="table-room"
                  data-ocid="settings.tables.room_input"
                  placeholder={s("tables.roomPlaceholder")}
                  value={draft.room}
                  onChange={(event) =>
                    setDraft((d) => ({ ...d, room: event.target.value }))
                  }
                />
              </Field>
              <Field label={s("tables.minSeats")} htmlFor="table-min">
                <Input
                  id="table-min"
                  type="number"
                  min={1}
                  data-ocid="settings.tables.min_input"
                  value={draft.minSeats}
                  onChange={(event) =>
                    setDraft((d) => ({ ...d, minSeats: event.target.value }))
                  }
                />
              </Field>
              <Field label={s("tables.maxSeats")} htmlFor="table-max">
                <Input
                  id="table-max"
                  type="number"
                  min={1}
                  data-ocid="settings.tables.max_input"
                  value={draft.maxSeats}
                  onChange={(event) =>
                    setDraft((d) => ({ ...d, maxSeats: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Switch
                  id="table-combinable"
                  checked={draft.combinable}
                  data-ocid="settings.tables.combinable_switch"
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, combinable: checked }))
                  }
                />
                <label htmlFor="table-combinable">
                  {s("tables.combinable")}
                </label>
              </div>
              {editing && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Switch
                    id="table-active"
                    checked={draft.active}
                    data-ocid="settings.tables.active_switch"
                    onCheckedChange={(checked) =>
                      setDraft((d) => ({ ...d, active: checked }))
                    }
                  />
                  <label htmlFor="table-active">{s("tables.active")}</label>
                </div>
              )}
            </div>
            {error && <InlineError message={error} />}
            {updateTable.isError && (
              <InlineError message={s("tables.saveError")} />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                data-ocid="settings.tables.cancel_button"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                data-ocid="settings.tables.submit_button"
                disabled={saving}
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {s("tables.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
