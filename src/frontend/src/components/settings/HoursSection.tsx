import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { ClosureDate, DayHours, ServiceWindow } from "@/types";
import { CalendarOff, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Field,
  InlineError,
  SettingsSection,
  useSettingsText,
} from "./SettingsPrimitives";
import {
  useAddClosure,
  useRemoveClosure,
  useSetOpeningHours,
} from "./useSettingsQueries";

const WEEKDAYS = [1n, 2n, 3n, 4n, 5n, 6n, 0n];

const WEEKDAY_LABELS: Record<string, { fr: string; en: string }> = {
  "weekday.mon": { fr: "Lundi", en: "Monday" },
  "weekday.tue": { fr: "Mardi", en: "Tuesday" },
  "weekday.wed": { fr: "Mercredi", en: "Wednesday" },
  "weekday.thu": { fr: "Jeudi", en: "Thursday" },
  "weekday.fri": { fr: "Vendredi", en: "Friday" },
  "weekday.sat": { fr: "Samedi", en: "Saturday" },
  "weekday.sun": { fr: "Dimanche", en: "Sunday" },
};

const WEEKDAY_KEYS = [
  "weekday.mon",
  "weekday.tue",
  "weekday.wed",
  "weekday.thu",
  "weekday.fri",
  "weekday.sat",
  "weekday.sun",
] as const;

/** Minutes since midnight → `HH:MM` for `<input type="time">`. */
function minutesToTime(minutes: bigint): string {
  const total = Number(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(value: string): bigint {
  const [h, m] = value.split(":");
  return BigInt(Number(h) * 60 + Number(m));
}

interface DayDraft {
  weekday: bigint;
  services: ServiceWindow[];
}

function toDraft(hours: DayHours[]): DayDraft[] {
  return WEEKDAYS.map((weekday) => {
    const found = hours.find((day) => day.weekday === weekday);
    return { weekday, services: found ? [...found.services] : [] };
  });
}

export function HoursSection({
  venueId,
  openingHours,
  closures,
}: {
  venueId: bigint;
  openingHours: DayHours[];
  closures: ClosureDate[];
}) {
  const s = useSettingsText();
  const { language } = useI18n();
  const setHours = useSetOpeningHours(venueId);
  const addClosure = useAddClosure(venueId);
  const removeClosure = useRemoveClosure(venueId);

  const [days, setDays] = useState<DayDraft[]>(() => toDraft(openingHours));
  const [invalid, setInvalid] = useState(false);
  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");

  useEffect(() => {
    setDays(toDraft(openingHours));
  }, [openingHours]);

  const updateService = (
    weekday: bigint,
    index: number,
    patch: Partial<ServiceWindow>,
  ) => {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              services: day.services.map((service, i) =>
                i === index ? { ...service, ...patch } : service,
              ),
            }
          : day,
      ),
    );
    setInvalid(false);
  };

  const addService = (weekday: bigint) => {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday && day.services.length < 2
          ? {
              ...day,
              services: [
                ...day.services,
                { openMinute: 1140n, closeMinute: 1380n },
              ],
            }
          : day,
      ),
    );
  };

  const removeService = (weekday: bigint, index: number) => {
    setDays((current) =>
      current.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              services: day.services.filter((_, i) => i !== index),
            }
          : day,
      ),
    );
  };

  const saveHours = () => {
    const hasInvalid = days.some((day) =>
      day.services.some((service) => service.closeMinute <= service.openMinute),
    );
    if (hasInvalid) {
      setInvalid(true);
      return;
    }
    setHours.mutate(
      days.map((day) => ({ weekday: day.weekday, services: day.services })),
    );
  };

  const submitClosure = (event: React.FormEvent) => {
    event.preventDefault();
    if (!closureDate) return;
    const reason = closureReason.trim();
    const date = closureDate;
    setClosureDate("");
    setClosureReason("");
    addClosure.mutate(reason ? { date, reason } : { date }, {
      onError: () => {
        setClosureDate(date);
        setClosureReason(reason);
      },
    });
  };

  const sortedClosures = [...closures].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <div className="space-y-6">
      <SettingsSection
        ocid="settings.hours.section"
        title={s("hours.title")}
        description={s("hours.subtitle")}
        actions={
          <Button
            type="button"
            data-ocid="settings.hours.save_button"
            onClick={saveHours}
            disabled={setHours.isPending}
          >
            {setHours.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {s("hours.save")}
          </Button>
        }
      >
        <div className="space-y-2">
          {days.map((day, dayIndex) => {
            const labelKey = WEEKDAY_KEYS[dayIndex];
            const label = WEEKDAY_LABELS[labelKey][language];
            return (
              <div
                key={day.weekday.toString()}
                data-ocid={`settings.hours.day.${dayIndex + 1}`}
                className="rounded-lg border border-border bg-background/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  {day.services.length === 0 ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      {s("hours.closed")}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {day.services.map((service, index) => (
                        <div
                          key={`${day.weekday}-${index}`}
                          className="flex items-center gap-1.5"
                        >
                          <Input
                            type="time"
                            aria-label={`${label} — ${s("hours.service", {
                              index: index + 1,
                            })} ${s("hours.open")}`}
                            data-ocid={`settings.hours.open_input.${dayIndex + 1}.${index + 1}`}
                            value={minutesToTime(service.openMinute)}
                            onChange={(event) =>
                              updateService(day.weekday, index, {
                                openMinute: timeToMinutes(event.target.value),
                              })
                            }
                            className="h-8 w-[6.5rem] tabular-nums"
                          />
                          <span className="text-xs text-muted-foreground">
                            –
                          </span>
                          <Input
                            type="time"
                            aria-label={`${label} — ${s("hours.service", {
                              index: index + 1,
                            })} ${s("hours.close")}`}
                            data-ocid={`settings.hours.close_input.${dayIndex + 1}.${index + 1}`}
                            value={minutesToTime(service.closeMinute)}
                            onChange={(event) =>
                              updateService(day.weekday, index, {
                                closeMinute: timeToMinutes(event.target.value),
                              })
                            }
                            className="h-8 w-[6.5rem] tabular-nums"
                          />
                          <button
                            type="button"
                            aria-label={s("hours.removeService", {
                              index: index + 1,
                            })}
                            data-ocid={`settings.hours.remove_service_button.${dayIndex + 1}.${index + 1}`}
                            onClick={() => removeService(day.weekday, index)}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {day.services.length < 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-ocid={`settings.hours.add_service_button.${dayIndex + 1}`}
                      onClick={() => addService(day.weekday)}
                      className="h-7 text-xs"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      {s("hours.addService")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {invalid && (
          <div className="mt-3">
            <InlineError message={s("hours.invalid")} />
          </div>
        )}
        {setHours.isSuccess && (
          <p
            data-ocid="settings.hours.success_state"
            className="mt-3 text-sm font-medium text-success"
          >
            {s("hours.saved")}
          </p>
        )}
        {setHours.isError && (
          <div className="mt-3">
            <InlineError message={s("hours.saveError")} />
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        ocid="settings.closures.section"
        title={s("hours.closures.title")}
      >
        <form
          onSubmit={submitClosure}
          data-ocid="settings.closures.form"
          className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
        >
          <Field label={s("hours.closures.date")} htmlFor="closure-date">
            <Input
              id="closure-date"
              type="date"
              data-ocid="settings.closures.date_input"
              value={closureDate}
              onChange={(event) => setClosureDate(event.target.value)}
              className="w-full sm:w-44"
            />
          </Field>
          <Field label={s("hours.closures.reason")} htmlFor="closure-reason">
            <Input
              id="closure-reason"
              data-ocid="settings.closures.reason_input"
              placeholder={s("hours.closures.reasonPlaceholder")}
              value={closureReason}
              onChange={(event) => setClosureReason(event.target.value)}
            />
          </Field>
          <Button
            type="submit"
            variant="outline"
            data-ocid="settings.closures.add_button"
            disabled={addClosure.isPending || closureDate === ""}
          >
            {addClosure.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {s("hours.closures.add")}
          </Button>
        </form>

        {sortedClosures.length === 0 ? (
          <p
            data-ocid="settings.closures.empty_state"
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CalendarOff className="size-4" aria-hidden="true" />
            {s("hours.closures.empty")}
          </p>
        ) : (
          <ul
            data-ocid="settings.closures.list"
            className="mt-4 divide-y divide-border"
          >
            {sortedClosures.map((closure, index) => (
              <li
                key={closure.date}
                data-ocid={`settings.closures.item.${index + 1}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-md bg-secondary px-2 py-1 font-mono text-xs tabular-nums text-secondary-foreground">
                    {closure.date}
                  </span>
                  <span className="truncate text-sm text-foreground">
                    {closure.reason ?? s("audit.none")}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={s("hours.closures.remove", {
                    date: closure.date,
                  })}
                  data-ocid={`settings.closures.remove_button.${index + 1}`}
                  onClick={() => removeClosure.mutate(closure.date)}
                  className={cn(
                    "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                  )}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {addClosure.isError && (
          <div className="mt-3">
            <InlineError message={s("hours.closures.error")} />
          </div>
        )}
        {removeClosure.isError && (
          <div className="mt-3">
            <InlineError message={s("hours.closures.removeError")} />
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
