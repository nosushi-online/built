import { type Booking, BookingStatus, type FloorTable } from "@/backend";
import { Button } from "@/components/ui/button";
import { useSeatBooking } from "@/hooks/useFloor";
import { useI18n } from "@/i18n/I18nProvider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRight, Users } from "lucide-react";

/**
 * Upcoming arrivals for the current service. Each row can seat its booking
 * directly, which keeps the tablet flow to a single tap.
 */
export function ArrivalsPanel({
  tables,
  timezone,
  onSelectTable,
}: {
  tables: FloorTable[];
  timezone: string;
  onSelectTable: (tableId: bigint) => void;
}) {
  const { t, language } = useI18n();
  const seat = useSeatBooking();

  const tableName = new Map<bigint, string>(
    tables.map((entry) => [entry.table.id, entry.table.name]),
  );

  const arrivals = tables
    .filter(
      (entry) =>
        entry.booking !== undefined &&
        (entry.status === "booked" || entry.status === "seated"),
    )
    .map((entry) => entry.booking as Booking)
    .filter(
      (booking) =>
        booking.status === BookingStatus.confirmed ||
        booking.status === BookingStatus.pending ||
        booking.status === BookingStatus.seated,
    )
    .sort((a, b) => Number(a.startAt - b.startAt));

  return (
    <section
      data-ocid="floor.arrivals.panel"
      className="flex flex-col rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-foreground">
          {t("floor.table.arrivals")}
        </h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
          {arrivals.length}
        </span>
      </header>

      {arrivals.length === 0 ? (
        <p
          data-ocid="floor.arrivals.empty_state"
          className="px-4 py-8 text-center text-sm text-muted-foreground"
        >
          {t("floor.table.arrivalsEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {arrivals.map((booking, index) => {
            const seated = booking.status === BookingStatus.seated;
            const name = booking.tableId
              ? tableName.get(booking.tableId)
              : undefined;
            return (
              <li
                key={booking.id.toString()}
                data-ocid={`floor.arrivals.item.${index + 1}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-12 shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {formatTime(booking.startAt, timezone, language)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {name
                      ? t("floor.table.assigned", { name })
                      : t("floor.table.noTable")}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" aria-hidden="true" />
                    {t("floor.table.party", {
                      count: Number(booking.partySize),
                    })}
                  </p>
                </div>
                {seated ? (
                  <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {t("floor.status.seated")}
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn("rounded-full")}
                    data-ocid={`floor.arrivals.seat_button.${index + 1}`}
                    disabled={seat.isPending}
                    onClick={() => {
                      if (booking.tableId) onSelectTable(booking.tableId);
                      else seat.mutate(booking.id);
                    }}
                  >
                    {booking.tableId ? (
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    ) : null}
                    {t("floor.table.seatUnassigned")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
