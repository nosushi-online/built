import { useI18n } from "@/i18n/I18nProvider";
import { formatTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus, type BookingView } from "@/types";
import { Clock3 } from "lucide-react";
import { usePlanningCopy } from "./usePlanningCopy";

const UPCOMING = new Set<BookingStatus>([
  BookingStatus.pending,
  BookingStatus.confirmed,
]);

function relativeLabel(
  minutes: number,
  t: ReturnType<typeof usePlanningCopy>,
): { label: string; tone: "late" | "now" | "soon" | "past" } {
  if (minutes < -10)
    return { label: t("planning.arrivals.past"), tone: "past" };
  if (minutes < 0) return { label: t("planning.arrivals.late"), tone: "late" };
  if (minutes <= 10) return { label: t("planning.arrivals.now"), tone: "now" };
  return { label: t("planning.arrivals.soon", { minutes }), tone: "soon" };
}

const TONE_STYLE: Record<string, string> = {
  late: "bg-destructive/10 text-destructive",
  now: "bg-primary/10 text-primary",
  soon: "bg-accent/20 text-accent-foreground",
  past: "bg-muted text-muted-foreground",
};

export function ArrivalsPanel({
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

  const upcoming = bookings
    .filter((booking) => UPCOMING.has(booking.status))
    .map((booking) => ({
      booking,
      minutes: Math.round(
        (Number(booking.startAt / 1_000_000n) - Number(Date.now())) / 60_000,
      ),
    }))
    .sort((a, b) => a.minutes - b.minutes)
    .slice(0, 6);

  return (
    <section
      data-ocid="planning.arrivals.panel"
      className="rounded-xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Clock3 className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-display text-sm font-semibold text-foreground">
          {t("planning.arrivals.title")}
        </h2>
      </header>
      {upcoming.length === 0 ? (
        <div
          data-ocid="planning.arrivals.empty_state"
          className="px-4 py-8 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            {t("planning.arrivals.empty")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("planning.arrivals.emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map(({ booking, minutes }, index) => {
            const rel = relativeLabel(minutes, t);
            return (
              <li key={booking.id.toString()}>
                <button
                  type="button"
                  onClick={() => onSelect(booking)}
                  data-ocid={`planning.arrivals.item.${index + 1}`}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-smooth hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                    {initials(booking.guestName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {booking.guestName}
                    </p>
                    <p className="tabular-nums truncate text-[11px] text-muted-foreground">
                      {formatTime(booking.startAt, timezone, language)} ·{" "}
                      {booking.partySize.toString()} ·{" "}
                      {booking.tableName ?? t("planning.noTable")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      TONE_STYLE[rel.tone],
                    )}
                  >
                    {rel.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
