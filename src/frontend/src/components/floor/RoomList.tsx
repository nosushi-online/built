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
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface RoomSummary {
  name: string;
  tableCount: number;
}

/**
 * Room list for the editor. Rooms are derived from the tables' `room` field,
 * so creating a room is a naming step and renaming moves its tables.
 */
export function RoomList({
  rooms,
  activeRoom,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  rooms: RoomSummary[];
  activeRoom: string | null;
  onSelect: (room: string) => void;
  onCreate: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (room: string) => void;
}) {
  const { t } = useI18n();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const exists = (value: string, ignore?: string) =>
    rooms.some(
      (room) =>
        room.name.toLowerCase() === value.trim().toLowerCase() &&
        room.name !== ignore,
    );

  const openCreate = () => {
    setName("");
    setError(null);
    setCreateOpen(true);
  };

  const openRename = (room: string) => {
    setName(room);
    setError(null);
    setRenameTarget(room);
  };

  const submitCreate = () => {
    const value = name.trim();
    if (value === "") {
      setError(t("editor.room.nameRequired"));
      return;
    }
    if (exists(value)) {
      setError(t("editor.room.exists"));
      return;
    }
    onCreate(value);
    setCreateOpen(false);
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const value = name.trim();
    if (value === "") {
      setError(t("editor.room.nameRequired"));
      return;
    }
    if (exists(value, renameTarget)) {
      setError(t("editor.room.exists"));
      return;
    }
    onRename(renameTarget, value);
    setRenameTarget(null);
  };

  return (
    <aside
      data-ocid="editor.rooms.panel"
      className="flex flex-col rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-foreground">
          {t("editor.rooms")}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full"
          data-ocid="editor.room.new_button"
          onClick={openCreate}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("editor.room.new")}
        </Button>
      </header>

      {rooms.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          {t("editor.rooms.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1 p-2">
          {rooms.map((room, index) => {
            const active = room.name === activeRoom;
            return (
              <li key={room.name}>
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2 transition-smooth",
                    active ? "bg-primary/10" : "hover:bg-secondary",
                  )}
                >
                  <button
                    type="button"
                    data-ocid={`editor.room.item.${index + 1}`}
                    aria-pressed={active}
                    onClick={() => onSelect(room.name)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <LayoutGrid
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          active ? "text-primary" : "text-foreground",
                        )}
                      >
                        {room.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t("editor.room.tables", { count: room.tableCount })}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-md text-muted-foreground"
                      aria-label={t("editor.room.rename")}
                      data-ocid={`editor.room.rename_button.${index + 1}`}
                      onClick={() => openRename(room.name)}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 rounded-md text-muted-foreground hover:text-destructive"
                      aria-label={t("editor.room.delete")}
                      data-ocid={`editor.room.delete_button.${index + 1}`}
                      onClick={() => setDeleteTarget(room.name)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          data-ocid="editor.room.create_dialog"
          className="rounded-xl border-border bg-card sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {t("editor.room.new")}
            </DialogTitle>
            <DialogDescription>
              {t("editor.room.namePlaceholder")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="room-name">{t("editor.room.name")}</Label>
            <Input
              id="room-name"
              data-ocid="editor.room.name_input"
              value={name}
              placeholder={t("editor.room.namePlaceholder")}
              aria-invalid={!!error}
              onChange={(event) => setName(event.target.value)}
            />
            {error && (
              <p
                className="text-xs text-destructive"
                data-ocid="editor.room.error"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              data-ocid="editor.room.cancel_button"
              onClick={() => setCreateOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              data-ocid="editor.room.create_button"
              onClick={submitCreate}
            >
              {t("editor.room.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent
          data-ocid="editor.room.rename_dialog"
          className="rounded-xl border-border bg-card sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {t("editor.room.renameTitle")}
            </DialogTitle>
            <DialogDescription>{t("editor.room.renameBody")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="room-rename">{t("editor.room.name")}</Label>
            <Input
              id="room-rename"
              data-ocid="editor.room.rename_input"
              value={name}
              aria-invalid={!!error}
              onChange={(event) => setName(event.target.value)}
            />
            {error && (
              <p
                className="text-xs text-destructive"
                data-ocid="editor.room.rename_error"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              data-ocid="editor.room.rename_cancel_button"
              onClick={() => setRenameTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              data-ocid="editor.room.rename_button"
              onClick={submitRename}
            >
              {t("editor.room.rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          data-ocid="editor.room.delete_dialog"
          className="rounded-xl border-border bg-card sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {t("editor.room.deleteTitle")}
            </DialogTitle>
            <DialogDescription>{t("editor.room.deleteBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              data-ocid="editor.room.delete_cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              data-ocid="editor.room.delete_confirm_button"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              {t("editor.room.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
