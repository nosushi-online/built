import { useI18n } from "@/i18n/I18nProvider";
import { formatTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus, type BookingView, type RoomTable } from "@/types";
import { Armchair, ChevronRight } from "lucide-react";
import { StatusBadge } from "./status";
import { usePlanningCopy } from "./usePlanningCopy";

const MUTED = new Set<BookingStatus>([
  BookingStatus.cancelled,
  BookingStatus.noShow,
]);

function BookingChip({
  booking,
  timezone,
  onSelect,
  ocid,
}: {
  booking: BookingView;
  timezone: string;
  onSelect: (booking: BookingView) => void;
  ocid: string;
}) {
  const { language } = useI18n();
  const t = usePlanningCopy();
  const muted = MUTED.has(booking.status);
  return (
    <button
      type="button"
      onClick={() => onSelect(booking)}
      data-ocid={ocid}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left transition-smooth hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        muted && "opacity-55",
      )}
    >
      <span className="tabular-nums shrink-0 text-xs font-semibold text-foreground">
        {formatTime(booking.startAt, timezone, language)}
      </span>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
        {initials(booking.guestName)}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {booking.guestName}
      </span>
      <span className="tabular-nums shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
        {booking.partySize.toString()}
      </span>
      <StatusBadge
        status={booking.status}
        t={t}
        className="hidden sm:inline-flex"
      />
      <ChevronRight
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}

function TableColumn({
  table,
  bookings,
  timezone,
  onSelect,
  index,
}: {
  table: RoomTable;
  bookings: BookingView[];
  timezone: string;
  onSelect: (booking: BookingView) => void;
  index: number;
}) {
  const t = usePlanningCopy();
  const covers = bookings.reduce((sum, b) => sum + Number(b.partySize), 0);
  return (
    <div
      data-ocid={`planning.timeline.table.${index + 1}`}
      className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-card/70 shadow-subtle"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {table.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {table.room} ·{" "}
            {t("planning.timeline.seats", { count: Number(table.maxSeats) })}
          </p>
        </div>
        <span className="tabular-nums shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          {covers}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        {bookings.length === 0 ? (
          <p className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-4 text-[11px] text-muted-foreground">
            <Armchair className="size-3.5" aria-hidden="true" />
            {t("planning.timeline.free")}
          </p>
        ) : (
          bookings.map((booking, i) => (
            <BookingChip
              key={booking.id.toString()}
              booking={booking}
              timezone={timezone}
              onSelect={onSelect}
              ocid={`planning.timeline.booking.${index + 1}.${i + 1}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function BookingTimeline({
  tables,
  bookings,
  timezone,
  onSelect,
}: {
  tables: RoomTable[];
  bookings: BookingView[];
  timezone: string;
  onSelect: (booking: BookingView) => void;
}) {
  const t = usePlanningCopy();
  const activeTables = tables.filter((table) => table.active);
  const byTable = new Map<string, BookingView[]>();
  const unassigned: BookingView[] = [];
  for (const booking of bookings) {
    if (booking.tableId === undefined) {
      unassigned.push(booking);
      continue;
    }
    const key = booking.tableId.toString();
    const list = byTable.get(key) ?? [];
    list.push(booking);
    byTable.set(key, list);
  }

  return (
    <div className="space-y-3">
      <div
        data-ocid="planning.timeline"
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {activeTables.map((table, index) => (
          <TableColumn
            key={table.id.toString()}
            table={table}
            bookings={byTable.get(table.id.toString()) ?? []}
            timezone={timezone}
            onSelect={onSelect}
            index={index}
          />
        ))}
        {unassigned.length > 0 && (
          <div
            data-ocid="planning.timeline.unassigned"
            className="flex w-64 shrink-0 flex-col rounded-xl border border-dashed border-accent/60 bg-accent/5"
          >
            <div className="border-b border-accent/40 px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                {t("planning.timeline.unassigned")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {unassigned.length}
              </p>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-2">
              {unassigned.map((booking, i) => (
                <BookingChip
                  key={booking.id.toString()}
                  booking={booking}
                  timezone={timezone}
                  onSelect={onSelect}
                  ocid={`planning.timeline.unassigned.${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
