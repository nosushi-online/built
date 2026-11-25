import {
  type FloorTable,
  type TableShape,
  TableStatus,
  TeamRole,
} from "@/backend";
import { ArrivalsPanel } from "@/components/floor/ArrivalsPanel";
import { FloorLegend } from "@/components/floor/FloorLegend";
import { TableShapeView } from "@/components/floor/TableShapeView";
import { TableSheet } from "@/components/floor/TableSheet";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  STATUS_STYLES,
} from "@/components/floor/tableStyles";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFloorView } from "@/hooks/useFloor";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { formatTime, isoDateInZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { hasAtLeastRole } from "@/lib/vertical";
import { Link } from "@tanstack/react-router";
import { CalendarDays, LayoutGrid, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ServiceKey = "lunch" | "dinner";

export function FloorViewPage() {
  const { t, language } = useI18n();
  const { active } = useVenue();
  const venue = active?.venue;
  const role = active?.role ?? TeamRole.staff;
  const timezone = venue?.timezone ?? "Europe/Paris";
  const canEdit = hasAtLeastRole(role, TeamRole.manager);

  const [date] = useState(() => isoDateInZone(new Date(), timezone));
  const [service, setService] = useState<ServiceKey>("dinner");
  const [room, setRoom] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const viewQuery = useFloorView(venue?.id, date, service);
  const tables = useMemo(() => viewQuery.data?.tables ?? [], [viewQuery.data]);

  const rooms = useMemo(() => {
    const set = new Set<string>();
    for (const entry of tables) set.add(entry.table.room);
    return Array.from(set);
  }, [tables]);

  const currentRoom = room ?? rooms[0] ?? null;
  const roomTables = useMemo(
    () => tables.filter((entry) => entry.table.room === currentRoom),
    [tables, currentRoom],
  );

  // Fit the fixed coordinate canvas to the available width on tablets.
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? CANVAS_WIDTH;
      setScale(Math.min(1, width / CANVAS_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const selected =
    tables.find((entry) => entry.table.id === selectedId) ?? null;

  const summary = useMemo(() => {
    const counts: Record<TableStatus, number> = {
      [TableStatus.free]: 0,
      [TableStatus.booked]: 0,
      [TableStatus.seated]: 0,
      [TableStatus.finished]: 0,
    };
    let covers = 0;
    for (const entry of tables) {
      counts[entry.status] += 1;
      if (entry.booking && entry.status !== TableStatus.finished) {
        covers += Number(entry.booking.partySize);
      }
    }
    return { counts, covers };
  }, [tables]);

  const updatedAt = viewQuery.dataUpdatedAt
    ? formatTime(
        BigInt(viewQuery.dataUpdatedAt) * 1_000_000n,
        timezone,
        language,
      )
    : "—";

  const renderTable = (entry: FloorTable) => {
    const style = STATUS_STYLES[entry.status];
    const width = Math.max(
      60,
      Math.min(260, Number(entry.table.position.width)),
    );
    const height = Math.max(
      60,
      Math.min(260, Number(entry.table.position.height)),
    );
    return (
      <button
        key={entry.table.id.toString()}
        type="button"
        data-ocid={`floor.table.${entry.table.name}`}
        aria-label={`${entry.table.name} — ${t(style.labelKey)}`}
        onClick={() => setSelectedId(entry.table.id)}
        className="absolute rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          left: Number(entry.table.position.x),
          top: Number(entry.table.position.y),
        }}
      >
        <TableShapeView
          name={entry.table.name}
          seats={Number(entry.table.maxSeats)}
          shape={entry.table.position.shape as TableShape}
          width={width}
          height={height}
          rotation={Number(entry.table.position.rotation)}
          className={cn(style.fill, style.border, style.text)}
        >
          {entry.booking && (
            <span className="text-[10px] font-semibold opacity-90">
              {formatTime(entry.booking.startAt, timezone, language)}
            </span>
          )}
        </TableShapeView>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.floor.title")}
        subtitle={t("page.floor.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <span
                className="size-1.5 animate-pulse rounded-full bg-primary"
                aria-hidden="true"
              />
              {t("floor.live")}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              data-ocid="floor.refresh_button"
              disabled={viewQuery.isFetching}
              onClick={() => void viewQuery.refetch()}
            >
              <RefreshCw
                className={cn("size-4", viewQuery.isFetching && "animate-spin")}
                aria-hidden="true"
              />
              {t("floor.refresh")}
            </Button>
            {canEdit && (
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/floor/editor" data-ocid="floor.editor_link">
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  {t("editor.title")}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-subtle">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
          <span className="font-medium text-foreground">{date}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            {t("floor.updated", { time: updatedAt })}
          </span>
        </div>
        <Tabs
          value={service}
          onValueChange={(value) => setService(value as ServiceKey)}
        >
          <TabsList data-ocid="floor.service.tabs">
            <TabsTrigger value="lunch" data-ocid="floor.service.lunch_tab">
              {t("floor.service.lunch")}
            </TabsTrigger>
            <TabsTrigger value="dinner" data-ocid="floor.service.dinner_tab">
              {t("floor.service.dinner")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewQuery.isLoading ? (
        <LoadingState rows={3} />
      ) : viewQuery.isError ? (
        <ErrorState onRetry={() => void viewQuery.refetch()} />
      ) : tables.length === 0 ? (
        <EmptyState
          ocid="floor.empty_state"
          icon={<LayoutGrid className="size-5" aria-hidden="true" />}
          title={t("floor.empty.title")}
          description={canEdit ? t("floor.empty.body") : t("floor.empty.staff")}
          action={
            canEdit ? (
              <Button asChild className="rounded-xl">
                <Link to="/floor/editor" data-ocid="floor.empty.editor_link">
                  {t("floor.empty.action")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["free", summary.counts[TableStatus.free]],
                ["booked", summary.counts[TableStatus.booked]],
                ["seated", summary.counts[TableStatus.seated]],
                ["covers", summary.covers],
              ] as const
            ).map(([key, value]) => (
              <div
                key={key}
                data-ocid={`floor.summary.${key}`}
                className="rounded-xl border border-border bg-card px-4 py-3 shadow-subtle"
              >
                <p className="label-caps">
                  {t(`floor.summary.${key}` as never)}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {rooms.map((name) => (
                    <button
                      key={name}
                      type="button"
                      data-ocid={`floor.room.${name}`}
                      aria-pressed={name === currentRoom}
                      onClick={() => setRoom(name)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth",
                        name === currentRoom
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <FloorLegend />
              </div>

              {roomTables.length === 0 ? (
                <EmptyState
                  ocid="floor.no_room_state"
                  title={t("floor.noRoom.title")}
                  description={t("floor.noRoom.body")}
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-background p-2">
                  <div
                    ref={canvasRef}
                    className="relative mx-auto"
                    style={{
                      width: CANVAS_WIDTH * scale,
                      height: CANVAS_HEIGHT * scale,
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 origin-top-left"
                      style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        transform: `scale(${scale})`,
                      }}
                    >
                      {roomTables.map(renderTable)}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <ArrivalsPanel
              tables={tables}
              timezone={timezone}
              onSelectTable={setSelectedId}
            />
          </div>
        </>
      )}

      <TableSheet
        table={selected}
        timezone={timezone}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
