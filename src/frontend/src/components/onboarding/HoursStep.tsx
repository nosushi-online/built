import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Copy, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { onboardingCopy } from "./copy";
import {
  type DayDraft,
  type ServiceDraft,
  dayError,
  minutesToTime,
  timeToMinutes,
} from "./onboarding-utils";

const WEEKDAY_KEYS = [
  "onboarding.weekday.0",
  "onboarding.weekday.1",
  "onboarding.weekday.2",
  "onboarding.weekday.3",
  "onboarding.weekday.4",
  "onboarding.weekday.5",
  "onboarding.weekday.6",
] as const;

function TimeField({
  label,
  value,
  onChange,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ocid: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <Input
        id={id}
        type="time"
        value={value}
        step={900}
        data-ocid={ocid}
        className="h-9 w-full tabular-nums"
        onChange={(event) => {
          const minutes = timeToMinutes(event.target.value);
          onChange(
            minutes === null ? event.target.value : minutesToTime(minutes),
          );
        }}
      />
    </div>
  );
}

export function HoursStep({
  week,
  onChange,
}: {
  week: DayDraft[];
  onChange: (week: DayDraft[]) => void;
}) {
  const { language } = useI18n();
  const copy = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);
  const [copied, setCopied] = useState<number | null>(null);

  const updateDay = (weekday: number, next: DayDraft) => {
    onChange(week.map((day) => (day.weekday === weekday ? next : day)));
  };

  const toggleOpen = (day: DayDraft, open: boolean) => {
    updateDay(day.weekday, {
      ...day,
      open,
      services:
        open && day.services.length === 0
          ? [{ open: "12:00", close: "14:30" }]
          : day.services,
    });
  };

  const updateService = (
    day: DayDraft,
    index: number,
    patch: Partial<ServiceDraft>,
  ) => {
    updateDay(day.weekday, {
      ...day,
      services: day.services.map((service, i) =>
        i === index ? { ...service, ...patch } : service,
      ),
    });
  };

  const addService = (day: DayDraft) => {
    if (day.services.length >= 2) return;
    updateDay(day.weekday, {
      ...day,
      services: [...day.services, { open: "19:00", close: "22:30" }],
    });
  };

  const removeService = (day: DayDraft, index: number) => {
    updateDay(day.weekday, {
      ...day,
      services: day.services.filter((_, i) => i !== index),
    });
  };

  const copyToAll = (source: DayDraft) => {
    onChange(
      week.map((day) =>
        day.weekday === source.weekday
          ? day
          : {
              ...day,
              open: source.open,
              services: source.services.map((service) => ({ ...service })),
            },
      ),
    );
    setCopied(source.weekday);
    window.setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-3">
      {week.map((day) => {
        const error = dayError(day);
        return (
          <div
            key={day.weekday}
            data-ocid={`onboarding.day.${day.weekday + 1}`}
            className={cn(
              "rounded-xl border p-3 transition-smooth sm:p-4",
              day.open
                ? "border-border bg-card"
                : "border-dashed border-border bg-muted/40",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={day.open}
                  aria-label={copy(WEEKDAY_KEYS[day.weekday])}
                  data-ocid={`onboarding.day_toggle.${day.weekday + 1}`}
                  onCheckedChange={(checked) => toggleOpen(day, checked)}
                />
                <span className="min-w-20 text-sm font-medium text-foreground">
                  {copy(WEEKDAY_KEYS[day.weekday])}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide",
                    day.open
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {day.open
                    ? copy("onboarding.hours.open")
                    : copy("onboarding.hours.closed")}
                </span>
              </div>
              {day.open && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  data-ocid={`onboarding.copy_hours.${day.weekday + 1}`}
                  onClick={() => copyToAll(day)}
                >
                  <Copy className="size-3.5" aria-hidden="true" />
                  {copied === day.weekday
                    ? copy("onboarding.hours.copied")
                    : copy("onboarding.hours.copy")}
                </Button>
              )}
            </div>

            {day.open && (
              <div className="mt-3 space-y-2">
                {day.services.map((service, index) => (
                  <div
                    key={`${day.weekday}-service-${index}`}
                    className="flex items-end gap-2"
                  >
                    <div className="grid flex-1 grid-cols-2 gap-2">
                      <TimeField
                        label={copy("onboarding.hours.from")}
                        value={service.open}
                        ocid={`onboarding.open.${day.weekday + 1}.${index + 1}`}
                        onChange={(value) =>
                          updateService(day, index, { open: value })
                        }
                      />
                      <TimeField
                        label={copy("onboarding.hours.to")}
                        value={service.close}
                        ocid={`onboarding.close.${day.weekday + 1}.${index + 1}`}
                        onChange={(value) =>
                          updateService(day, index, { close: value })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground"
                      aria-label={copy("onboarding.hours.removeService")}
                      data-ocid={`onboarding.remove_service.${day.weekday + 1}.${index + 1}`}
                      onClick={() => removeService(day, index)}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}

                {day.services.length < 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid={`onboarding.add_service.${day.weekday + 1}`}
                    onClick={() => addService(day)}
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    {copy("onboarding.hours.addService")}
                  </Button>
                )}

                {error && (
                  <p
                    role="alert"
                    data-ocid={`onboarding.hours_error.${day.weekday + 1}`}
                    className="text-xs font-medium text-destructive"
                  >
                    {copy("onboarding.hours.error")}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
