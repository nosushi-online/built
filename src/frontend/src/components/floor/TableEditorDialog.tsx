import { type RoomTable, TableShape } from "@/backend";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { SHAPE_OPTIONS } from "./tableStyles";

export interface TableDraft {
  name: string;
  shape: TableShape;
  minSeats: number;
  maxSeats: number;
  combinable: boolean;
  active: boolean;
}

export function draftFromTable(table: RoomTable): TableDraft {
  return {
    name: table.name,
    shape: table.position.shape as TableShape,
    minSeats: Number(table.minSeats),
    maxSeats: Number(table.maxSeats),
    combinable: table.combinable,
    active: table.active,
  };
}

export const EMPTY_DRAFT: TableDraft = {
  name: "",
  shape: TableShape.round,
  minSeats: 2,
  maxSeats: 4,
  combinable: false,
  active: true,
};

/**
 * Create/edit form for a single table. The draft lives in local state and is
 * only handed to the parent on submit, so a refetch never wipes typing.
 */
export function TableEditorDialog({
  open,
  mode,
  initial,
  roomName,
  pending,
  error,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: TableDraft;
  roomName: string;
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TableDraft) => void;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<TableDraft>(initial);
  const [touched, setTouched] = useState(false);

  // Re-seed the draft only when the dialog opens for a different target.
  useEffect(() => {
    if (open) {
      setDraft(initial);
      setTouched(false);
    }
  }, [open, initial]);

  const nameError = touched && draft.name.trim() === "";
  const seatsError = touched && draft.maxSeats < draft.minSeats;

  const submit = () => {
    setTouched(true);
    if (draft.name.trim() === "" || draft.maxSeats < draft.minSeats) return;
    onSubmit({ ...draft, name: draft.name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="editor.table.dialog"
        className="max-h-[90dvh] overflow-y-auto rounded-xl border-border bg-card sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {mode === "create" ? t("editor.table.new") : t("editor.table.edit")}
          </DialogTitle>
          <DialogDescription>{roomName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="table-name">{t("editor.table.name")}</Label>
            <Input
              id="table-name"
              data-ocid="editor.table.name_input"
              value={draft.name}
              placeholder={t("editor.table.namePlaceholder")}
              aria-invalid={nameError}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            {nameError && (
              <p
                data-ocid="editor.table.name_error"
                className="text-xs text-destructive"
              >
                {t("editor.table.nameRequired")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("editor.table.shape")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {SHAPE_OPTIONS.map((option) => {
                const active = draft.shape === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-ocid={`editor.table.shape.${option.value}`}
                    aria-pressed={active}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        shape: option.value,
                      }))
                    }
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-xs font-medium transition-smooth",
                      active
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "border-2 border-current",
                        option.value === TableShape.round
                          ? "size-6 rounded-full"
                          : option.value === TableShape.square
                            ? "size-6 rounded-md"
                            : "h-4 w-8 rounded-sm",
                      )}
                      aria-hidden="true"
                    />
                    {t(option.labelKey as never)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="table-min">{t("editor.table.minSeats")}</Label>
              <Input
                id="table-min"
                type="number"
                min={1}
                data-ocid="editor.table.min_input"
                value={draft.minSeats}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    minSeats: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table-max">{t("editor.table.maxSeats")}</Label>
              <Input
                id="table-max"
                type="number"
                min={1}
                data-ocid="editor.table.max_input"
                value={draft.maxSeats}
                aria-invalid={seatsError}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxSeats: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
          {seatsError && (
            <p
              data-ocid="editor.table.seats_error"
              className="text-xs text-destructive"
            >
              {t("editor.table.invalidSeats")}
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="min-w-0 pr-3">
              <p className="text-sm font-medium text-foreground">
                {t("editor.table.combinable")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("editor.table.combinableHint")}
              </p>
            </div>
            <Switch
              data-ocid="editor.table.combinable_switch"
              checked={draft.combinable}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, combinable: checked }))
              }
            />
          </div>

          {mode === "edit" && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-foreground">
                  {t("editor.table.active")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("editor.table.activeHint")}
                </p>
              </div>
              <Switch
                data-ocid="editor.table.active_switch"
                checked={draft.active}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({ ...current, active: checked }))
                }
              />
            </div>
          )}

          {error && (
            <p
              data-ocid="editor.table.error_state"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {mode === "edit" && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-ocid="editor.table.delete_button"
              onClick={onDelete}
            >
              {t("editor.table.delete")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              data-ocid="editor.table.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              data-ocid="editor.table.save_button"
              disabled={pending}
              onClick={submit}
            >
              {mode === "create"
                ? t("editor.table.create")
                : t("editor.table.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
