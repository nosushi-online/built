import { type RoomTable, TableShape, TeamRole } from "@/backend";
import {
  type CanvasPosition,
  FloorCanvas,
} from "@/components/floor/FloorCanvas";
import { RoomList, type RoomSummary } from "@/components/floor/RoomList";
import {
  EMPTY_DRAFT,
  type TableDraft,
  TableEditorDialog,
  draftFromTable,
} from "@/components/floor/TableEditorDialog";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_TABLE_SIZE,
  MIN_TABLE_SIZE,
} from "@/components/floor/tableStyles";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  useCreateTable,
  useDeleteTable,
  useFloorPlan,
  useUpdateTable,
} from "@/hooks/useFloor";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { hasAtLeastRole } from "@/lib/vertical";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  LayoutGrid,
  Minus,
  Plus,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type EditorTarget =
  | { mode: "create" }
  | { mode: "edit"; table: RoomTable }
  | null;

export function FloorPlanPage() {
  const { t } = useI18n();
  const { active } = useVenue();
  const role = active?.role ?? TeamRole.staff;
  const canEdit = hasAtLeastRole(role, TeamRole.manager);

  const planQuery = useFloorPlan(active?.venue.id);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [target, setTarget] = useState<EditorTarget>(null);
  const [zoom, setZoom] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<RoomTable | null>(null);

  const tables = useMemo(() => planQuery.data?.tables ?? [], [planQuery.data]);

  const rooms = useMemo<RoomSummary[]>(() => {
    const map = new Map<string, number>();
    for (const table of tables) {
      map.set(table.room, (map.get(table.room) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, tableCount]) => ({
      name,
      tableCount,
    }));
  }, [tables]);

  const currentRoom = activeRoom ?? rooms[0]?.name ?? null;
  const roomTables = useMemo(
    () => tables.filter((table) => table.room === currentRoom),
    [tables, currentRoom],
  );

  const selectedTable = roomTables.find((table) => table.id === selectedId);

  const handleMove = useCallback(
    (id: bigint, position: CanvasPosition) => {
      const table = tables.find((entry) => entry.id === id);
      if (!table) return;
      updateTable.mutate({
        tableId: id,
        update: {
          position: {
            ...table.position,
            x: BigInt(Math.round(position.x)),
            y: BigInt(Math.round(position.y)),
          },
        },
      });
    },
    [tables, updateTable],
  );

  const handleMoveEnd = useCallback(
    (id: bigint, position: CanvasPosition) => {
      const table = tables.find((entry) => entry.id === id);
      if (!table) return;
      updateTable.mutate({
        tableId: id,
        update: {
          position: {
            ...table.position,
            x: BigInt(Math.round(position.x)),
            y: BigInt(Math.round(position.y)),
          },
        },
      });
    },
    [tables, updateTable],
  );

  const openCreate = () => {
    setTarget({ mode: "create" });
  };

  const submitTable = (draft: TableDraft) => {
    if (!currentRoom) return;
    const basePosition = {
      x: BigInt(Math.round(CANVAS_WIDTH / 2 - 60)),
      y: BigInt(Math.round(CANVAS_HEIGHT / 2 - 60)),
      width: BigInt(draft.shape === TableShape.rectangle ? 140 : 110),
      height: BigInt(110),
      rotation: 0n,
      shape: draft.shape,
    };

    if (target?.mode === "edit") {
      updateTable.mutate(
        {
          tableId: target.table.id,
          update: {
            name: draft.name,
            minSeats: BigInt(draft.minSeats),
            maxSeats: BigInt(draft.maxSeats),
            combinable: draft.combinable,
            active: draft.active,
            position: { ...target.table.position, shape: draft.shape },
          },
        },
        { onSuccess: () => setTarget(null) },
      );
      return;
    }

    createTable.mutate(
      {
        name: draft.name,
        room: currentRoom,
        minSeats: BigInt(draft.minSeats),
        maxSeats: BigInt(draft.maxSeats),
        combinable: draft.combinable,
        position: basePosition,
      },
      { onSuccess: () => setTarget(null) },
    );
  };

  const createRoom = (name: string) => {
    setActiveRoom(name);
    setTarget({ mode: "create" });
  };

  const renameRoom = (from: string, to: string) => {
    for (const table of tables.filter((entry) => entry.room === from)) {
      updateTable.mutate({ tableId: table.id, update: { room: to } });
    }
    setActiveRoom(to);
  };

  const removeRoom = (room: string) => {
    for (const table of tables.filter((entry) => entry.room === room)) {
      deleteTable.mutate(table.id);
    }
    setActiveRoom(null);
  };

  const confirmDeleteTable = () => {
    if (!deleteTarget) return;
    deleteTable.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setTarget(null);
        setSelectedId(null);
      },
    });
  };

  const mutationError =
    createTable.isError || updateTable.isError || deleteTable.isError
      ? t("editor.table.error")
      : null;

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("editor.title")} subtitle={t("editor.subtitle")} />
        <EmptyState
          ocid="editor.restricted_state"
          icon={<ShieldAlert className="size-5" aria-hidden="true" />}
          title={t("editor.restricted.title")}
          description={t("editor.restricted.body")}
          action={
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/floor" data-ocid="editor.view_live_link">
                {t("editor.viewLive")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("editor.title")}
        subtitle={t("editor.subtitle")}
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/floor" data-ocid="editor.view_live_link">
              {t("editor.viewLive")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {planQuery.isLoading ? (
        <LoadingState rows={3} />
      ) : planQuery.isError ? (
        <ErrorState onRetry={() => void planQuery.refetch()} />
      ) : rooms.length === 0 ? (
        <EmptyState
          ocid="editor.empty_state"
          icon={<LayoutGrid className="size-5" aria-hidden="true" />}
          title={t("editor.empty.title")}
          description={t("editor.empty.body")}
          action={
            <Button
              type="button"
              className="rounded-xl"
              data-ocid="editor.empty.create_button"
              onClick={() => setTarget({ mode: "create" })}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("editor.empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <RoomList
            rooms={rooms}
            activeRoom={currentRoom}
            onSelect={(room) => {
              setActiveRoom(room);
              setSelectedId(null);
            }}
            onCreate={createRoom}
            onRename={renameRoom}
            onDelete={removeRoom}
          />

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-subtle">
              <div className="flex items-center gap-2">
                <span className="label-caps">{t("editor.room.select")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {currentRoom}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-md"
                  aria-label={t("editor.canvas.zoomOut")}
                  data-ocid="editor.canvas.zoom_out_button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-md"
                  aria-label={t("editor.canvas.zoomIn")}
                  data-ocid="editor.canvas.zoom_in_button"
                  onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-md"
                  aria-label={t("editor.canvas.reset")}
                  data-ocid="editor.canvas.reset_button"
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="ml-1 rounded-xl"
                  data-ocid="editor.room.add_table_button"
                  onClick={openCreate}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("editor.room.addTable")}
                </Button>
              </div>
            </div>

            {roomTables.length === 0 ? (
              <EmptyState
                ocid="editor.room.empty_state"
                icon={<LayoutGrid className="size-5" aria-hidden="true" />}
                title={t("editor.room.empty")}
                description={t("editor.room.emptyBody")}
                action={
                  <Button
                    type="button"
                    className="rounded-xl"
                    data-ocid="editor.room.empty_add_button"
                    onClick={openCreate}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t("editor.room.addTable")}
                  </Button>
                }
              />
            ) : (
              <>
                <FloorCanvas
                  tables={roomTables}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onMove={handleMove}
                  onMoveEnd={handleMoveEnd}
                  zoom={zoom}
                />
                <p className="text-xs text-muted-foreground">
                  {t("editor.canvas.hint")}
                </p>
              </>
            )}

            {selectedTable && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-subtle">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {selectedTable.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("floor.seatsRange", {
                      min: Number(selectedTable.minSeats),
                      max: Number(selectedTable.maxSeats),
                    })}
                    {!selectedTable.active &&
                      ` · ${t("editor.table.inactive")}`}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  data-ocid="editor.table.edit_button"
                  onClick={() =>
                    setTarget({ mode: "edit", table: selectedTable })
                  }
                >
                  {t("editor.table.edit")}
                </Button>
              </div>
            )}

            {mutationError && (
              <p
                data-ocid="editor.error_state"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {mutationError}
              </p>
            )}
          </section>
        </div>
      )}

      <TableEditorDialog
        open={target !== null}
        mode={target?.mode ?? "create"}
        initial={
          target?.mode === "edit" ? draftFromTable(target.table) : EMPTY_DRAFT
        }
        roomName={currentRoom ?? ""}
        pending={createTable.isPending || updateTable.isPending}
        error={mutationError}
        onOpenChange={(open) => !open && setTarget(null)}
        onSubmit={submitTable}
        onDelete={
          target?.mode === "edit"
            ? () => setDeleteTarget(target.table)
            : undefined
        }
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          data-ocid="editor.table.delete_dialog"
          className="rounded-xl border-border bg-card"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg">
              {t("editor.table.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("editor.table.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="editor.table.delete_cancel_button"
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="editor.table.delete_confirm_button"
              disabled={deleteTable.isPending}
              onClick={confirmDeleteTable}
            >
              {t("editor.table.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
