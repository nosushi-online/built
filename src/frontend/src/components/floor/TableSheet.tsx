import { type FloorTable, TableStatus } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFinishBooking, useSeatBooking } from "@/hooks/useFloor";
import { useI18n } from "@/i18n/I18nProvider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Users } from "lucide-react";
import { StatusChip } from "./FloorLegend";
import { STATUS_STYLES } from "./tableStyles";

/**
 * Detail sheet for one table on the live floor. Seating and finishing happen
 * here so staff never leave the room view during service.
 */
export function TableSheet({
  table,
  timezone,
  open,
  onOpenChange,
}: {
  table: FloorTable | null;
  timezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, language } = useI18n();
  const seat = useSeatBooking();
  const finish = useFinishBooking();

  const booking = table?.booking;
  const status = table?.status ?? TableStatus.free;
  const style = STATUS_STYLES[status];
  const pending = seat.isPending || finish.isPending;
  const failed = seat.isError || finish.isError;

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-ocid="floor.table.sheet"
        className="flex w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-md"
      >
        {table && (
          <>
            <SheetHeader className="gap-2 border-b border-border px-5 py-5">
              <div className="flex items-center gap-2">
                <span
                  className={cn("size-2.5 rounded-full", style.dot)}
                  aria-hidden="true"
                />
                <span className="label-caps">{t("floor.room")}</span>
              </div>
              <SheetTitle className="font-display text-2xl">
                {table.table.name}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <StatusChip status={status} />
                <span className="text-xs text-muted-foreground">
                  {t("floor.seatsRange", {
                    min: Number(table.table.minSeats),
                    max: Number(table.table.maxSeats),
                  })}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <p className="text-sm font-medium text-foreground">
                {t(`floor.table.${status}` as never)}
              </p>

              {booking ? (
                <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {formatTime(booking.startAt, timezone, language)}
                    </span>
                    <span className="text-muted-foreground">
                      {t("floor.table.time", {
                        time: formatTime(booking.endAt, timezone, language),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Users
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>
                      {t("floor.table.party", {
                        count: Number(booking.partySize),
                      })}
                    </span>
                  </div>
                  {booking.notes && (
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <p className="label-caps">{t("floor.table.notes")}</p>
                      <p className="mt-1 text-sm text-foreground">
                        {booking.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("floor.table.noBooking")}
                </p>
              )}

              {failed && (
                <p
                  data-ocid="floor.table.error_state"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {t("floor.table.error")}
                </p>
              )}
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border px-5 py-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                data-ocid="floor.table.close_button"
                onClick={close}
              >
                {t("floor.table.close")}
              </Button>
              {booking && status === TableStatus.booked && (
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  data-ocid="floor.table.seat_button"
                  disabled={pending}
                  onClick={() => seat.mutate(booking.id, { onSuccess: close })}
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {seat.isPending
                    ? t("floor.table.seating")
                    : t("floor.table.seat")}
                </Button>
              )}
              {booking && status === TableStatus.seated && (
                <Button
                  type="button"
                  className="flex-1 rounded-xl"
                  data-ocid="floor.table.finish_button"
                  disabled={pending}
                  onClick={() =>
                    finish.mutate(booking.id, { onSuccess: close })
                  }
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {finish.isPending
                    ? t("floor.table.finishing")
                    : t("floor.table.finish")}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
