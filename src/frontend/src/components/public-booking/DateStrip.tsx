import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { addDaysIso, isClosedDate, weekdayOfIso } from "./booking-utils";

const DAYS_AHEAD = 14;

/** A two-week strip of dates; closed days are greyed out and not selectable. */
export function DateStrip({
  today,
  selected,
  openingHours,
  closedDates,
  onSelect,
}: {
  today: string;
  selected: string;
  openingHours: import("@/types").DayHours[];
  closedDates: string[];
  onSelect: (iso: string) => void;
}) {
  const { t, language } = useI18n();
  const locale = language === "fr" ? "fr-FR" : "en-GB";
  const dates = Array.from({ length: DAYS_AHEAD }, (_, i) =>
    addDaysIso(today, i),
  );

  return (
    <div
      data-ocid="booking.date_strip"
      className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
    >
      {dates.map((iso) => {
        const closed = isClosedDate(openingHours, closedDates, iso);
        const active = iso === selected;
        const [y, m, d] = iso.split("-").map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        const weekday = new Intl.DateTimeFormat(locale, {
          weekday: "short",
          timeZone: "UTC",
        }).format(date);
        const dayNumber = new Intl.DateTimeFormat(locale, {
          day: "numeric",
          timeZone: "UTC",
        }).format(date);
        const month = new Intl.DateTimeFormat(locale, {
          month: "short",
          timeZone: "UTC",
        }).format(date);
        const weekdayIndex = weekdayOfIso(iso);

        return (
          <button
            key={iso}
            type="button"
            disabled={closed}
            aria-pressed={active}
            aria-label={`${weekday} ${dayNumber} ${month}`}
            data-ocid={`booking.date.${weekdayIndex}`}
            onClick={() => onSelect(iso)}
            className={cn(
              "flex min-w-[4.25rem] snap-start flex-col items-center gap-0.5 rounded-xl border px-3 py-2.5 transition-smooth",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
              closed &&
                "cursor-not-allowed border-dashed border-border bg-muted/50 text-muted-foreground/60 hover:border-border hover:bg-muted/50",
            )}
          >
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wide">
              {weekday}
            </span>
            <span className="font-display text-lg font-semibold leading-none tabular-nums">
              {dayNumber}
            </span>
            <span className="text-[0.6875rem] uppercase tracking-wide opacity-80">
              {closed ? t("booking.closed") : month}
            </span>
          </button>
        );
      })}
    </div>
  );
}
