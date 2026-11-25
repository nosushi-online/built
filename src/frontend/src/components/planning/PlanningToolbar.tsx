import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Radio } from "lucide-react";
import { usePlanningCopy } from "./usePlanningCopy";

export function PlanningToolbar({
  date,
  dateLabel,
  isToday,
  onPrev,
  onNext,
  onToday,
  onDateChange,
  onNewBooking,
}: {
  date: string;
  dateLabel: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange: (date: string) => void;
  onNewBooking: () => void;
}) {
  const t = usePlanningCopy();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onPrev}
          aria-label={t("planning.date.prev")}
          data-ocid="planning.date_prev_button"
          className="size-10 rounded-lg"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <div className="min-w-0 flex-1 text-center sm:min-w-[13rem]">
          <p className="truncate font-display text-base font-semibold capitalize text-foreground">
            {dateLabel}
          </p>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Radio className="size-3 text-success" aria-hidden="true" />
            {t("planning.live")}
            <span className="hidden sm:inline">
              · {t("planning.live.hint")}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onNext}
          aria-label={t("planning.date.next")}
          data-ocid="planning.date_next_button"
          className="size-10 rounded-lg"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={isToday ? "secondary" : "outline"}
          onClick={onToday}
          data-ocid="planning.today_button"
          className="h-10 rounded-lg"
        >
          {t("planning.today")}
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          aria-label={t("planning.date.pick")}
          data-ocid="planning.date_input"
          className="h-10 w-[9.5rem] rounded-lg"
        />
        <Button
          type="button"
          onClick={onNewBooking}
          data-ocid="planning.new_booking_button"
          className={cn("h-10 rounded-lg px-4")}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("planning.newBooking")}
        </Button>
      </div>
    </div>
  );
}
