import { useI18n } from "@/i18n/I18nProvider";
import { initials } from "@/lib/format";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus, type BookingView } from "@/types";
import { ChevronRight, StickyNote } from "lucide-react";
import { StatusBadge, sourceLabel } from "./status";
import { usePlanningCopy } from "./usePlanningCopy";

export function BookingList({
  bookings,
  timezone,
  onSelect,
}: {
  bookings: BookingView[];
  timezone: string;
  onSelect: (booking: BookingView) => void;
}) {
  const t = usePlanningCopy();
  const { language } = useI18n();

  return (
    <ul data-ocid="planning.booking_list" className="space-y-2">
      {bookings.map((booking, index) => {
        const muted =
          booking.status === BookingStatus.cancelled ||
          booking.status === BookingStatus.noShow;
        return (
          <li key={booking.id.toString()}>
            <button
              type="button"
              onClick={() => onSelect(booking)}
              data-ocid={`planning.booking.item.${index + 1}`}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left shadow-subtle transition-smooth hover:border-primary/30 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                muted && "opacity-60",
              )}
            >
              <span className="tabular-nums w-14 shrink-0 font-display text-base font-semibold text-foreground">
                {formatTime(booking.startAt, timezone, language)}
              </span>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(booking.guestName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {booking.guestName}
                </p>
                <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {booking.partySize.toString()}{" "}
                    {t("planning.party").toLowerCase()}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">
                    {booking.tableName ?? t("planning.noTable")}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">
                    {sourceLabel(t, booking.source)}
                  </span>
                </p>
              </div>
              {booking.notes && (
                <StickyNote
                  className="hidden size-3.5 shrink-0 text-accent-foreground sm:block"
                  aria-label={t("planning.notes")}
                />
              )}
              <StatusBadge status={booking.status} t={t} />
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
