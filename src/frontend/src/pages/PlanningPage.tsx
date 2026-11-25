import { ArrivalsPanel } from "@/components/planning/ArrivalsPanel";
import { BookingDetailDrawer } from "@/components/planning/BookingDetailDrawer";
import { BookingList } from "@/components/planning/BookingList";
import { BookingTimeline } from "@/components/planning/BookingTimeline";
import { NewBookingDrawer } from "@/components/planning/NewBookingDrawer";
import {
  PlanningKpiRow,
  type PlanningKpis,
} from "@/components/planning/PlanningKpiRow";
import { PlanningToolbar } from "@/components/planning/PlanningToolbar";
import { ServiceTabs } from "@/components/planning/ServiceTabs";
import {
  SERVICES,
  type ServiceKey,
  bookingsForService,
  capacityOf,
  coversOf,
  minuteOfDay,
  shiftDate,
} from "@/components/planning/planningUtils";
import { usePlanningCopy } from "@/components/planning/usePlanningCopy";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookingsForDate, useGuests, useTables } from "@/hooks/useQueries";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, isoDateInZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus, type BookingView } from "@/types";
import { CalendarPlus, CheckCircle2, LayoutList, Rows3, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewMode = "list" | "timeline";

const ACTIVE = new Set<BookingStatus>([
  BookingStatus.pending,
  BookingStatus.confirmed,
  BookingStatus.seated,
  BookingStatus.finished,
]);

export function PlanningPage() {
  const t = usePlanningCopy();
  const { language } = useI18n();
  const { active } = useVenue();
  const venue = active?.venue;
  const timezone = venue?.timezone ?? "Europe/Paris";

  const [date, setDate] = useState(() => isoDateInZone(new Date(), timezone));
  const [service, setService] = useState<ServiceKey>("dinner");
  const [view, setView] = useState<ViewMode>("list");
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<BookingView | null>(null);

  const bookingsQuery = useBookingsForDate(date);
  const tablesQuery = useTables(venue?.id);
  const guestsQuery = useGuests(venue?.id);

  const bookings = bookingsQuery.data ?? [];
  const tables = tablesQuery.data ?? [];
  const guests = guestsQuery.data ?? [];

  const today = isoDateInZone(new Date(), timezone);
  const isToday = date === today;

  const goDay = useCallback(
    (delta: number) => setDate((current) => shiftDate(current, delta)),
    [],
  );

  // Keyboard shortcuts: N opens a new booking, arrows change the day.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setNewOpen(true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goDay(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goDay(1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goDay]);

  const serviceBookings = useMemo(
    () => bookingsForService(bookings, service, timezone),
    [bookings, service, timezone],
  );

  const coversByService = useMemo(() => {
    const result: Record<ServiceKey, number> = { lunch: 0, dinner: 0 };
    for (const window of SERVICES) {
      result[window.key] = coversOf(
        bookingsForService(bookings, window.key, timezone),
      );
    }
    return result;
  }, [bookings, timezone]);

  const capacity = capacityOf(tables);

  const kpis: PlanningKpis = useMemo(() => {
    const active = bookings.filter((b) => ACTIVE.has(b.status));
    const nowMinute = minuteOfDay(BigInt(Date.now()) * 1_000_000n, timezone);
    return {
      bookings: active.length,
      covers: coversOf(active),
      seated: active
        .filter((b) => b.status === BookingStatus.seated)
        .reduce((sum, b) => sum + Number(b.partySize), 0),
      pending: active.filter((b) => b.status === BookingStatus.pending).length,
      arrivals: active.filter(
        (b) =>
          (b.status === BookingStatus.confirmed ||
            b.status === BookingStatus.pending) &&
          minuteOfDay(b.startAt, timezone) >= nowMinute - 10,
      ).length,
    };
  }, [bookings, timezone]);

  const dateLabel = formatDate(
    BigInt(new Date(`${date}T12:00:00Z`).getTime()) * 1_000_000n,
    timezone,
    language,
    { weekday: "long", day: "numeric", month: "long" },
  );

  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setTimeout(() => setConfirmation(null), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation]);

  const handleCreated = (summary: {
    name: string;
    party: number;
    time: string;
  }) => {
    setConfirmation(
      t("booking.successBody", {
        name: summary.name,
        party: summary.party,
        time: summary.time,
      }),
    );
    void bookingsQuery.refetch();
  };

  const isLoading = bookingsQuery.isLoading || tablesQuery.isLoading;
  const isError = bookingsQuery.isError;

  return (
    <div data-ocid="planning.page" className="space-y-5 animate-fade-up">
      <PageHeader
        title={t("planning.title")}
        subtitle={t("planning.subtitle")}
        actions={
          <p className="hidden text-[11px] text-muted-foreground lg:block">
            {t("planning.shortcut.hint")}
          </p>
        }
      />

      <PlanningToolbar
        date={date}
        dateLabel={dateLabel}
        isToday={isToday}
        onPrev={() => goDay(-1)}
        onNext={() => goDay(1)}
        onToday={() => setDate(today)}
        onDateChange={(next) => next && setDate(next)}
        onNewBooking={() => setNewOpen(true)}
      />

      {confirmation && (
        <output
          data-ocid="planning.success_state"
          className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-foreground"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
            <span>
              <span className="font-semibold">{t("booking.success")}</span>{" "}
              {confirmation}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            aria-label={t("common.close")}
            data-ocid="planning.success.close_button"
            className="rounded-md p-1 text-muted-foreground transition-smooth hover:bg-success/15 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </output>
      )}

      <PlanningKpiRow kpis={kpis} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <ServiceTabs
            value={service}
            onChange={setService}
            coversByService={coversByService}
            capacity={capacity}
          />

          <div className="flex items-center justify-between gap-2">
            <Tabs
              value={view}
              onValueChange={(next) => setView(next as ViewMode)}
            >
              <TabsList className="h-9 rounded-lg">
                <TabsTrigger
                  value="list"
                  data-ocid="planning.view.tab.list"
                  className="gap-1.5 px-3"
                >
                  <LayoutList className="size-3.5" aria-hidden="true" />
                  {t("planning.view.list")}
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  data-ocid="planning.view.tab.timeline"
                  className="gap-1.5 px-3"
                >
                  <Rows3 className="size-3.5" aria-hidden="true" />
                  {t("planning.view.timeline")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="tabular-nums text-xs text-muted-foreground">
              {serviceBookings.length} ·{" "}
              {t("planning.coversOf", {
                booked: coversOf(serviceBookings),
                capacity,
              })}
            </span>
          </div>

          {isLoading ? (
            <LoadingState rows={5} />
          ) : isError ? (
            <ErrorState onRetry={() => void bookingsQuery.refetch()} />
          ) : serviceBookings.length === 0 ? (
            <EmptyState
              ocid="planning.empty_state"
              icon={<CalendarPlus className="size-5" aria-hidden="true" />}
              title={t("planning.list.empty")}
              description={t("planning.list.emptyBody")}
              action={
                <Button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  data-ocid="planning.empty.new_booking_button"
                  className="rounded-lg"
                >
                  {t("planning.newBooking")}
                </Button>
              }
            />
          ) : view === "list" ? (
            <BookingList
              bookings={serviceBookings}
              timezone={timezone}
              onSelect={setSelected}
            />
          ) : tables.length === 0 ? (
            <EmptyState
              ocid="planning.timeline.empty_state"
              title={t("planning.timeline.empty")}
              description={t("planning.timeline.emptyBody")}
            />
          ) : (
            <BookingTimeline
              tables={tables}
              bookings={serviceBookings}
              timezone={timezone}
              onSelect={setSelected}
            />
          )}
        </div>

        <aside className={cn("min-w-0 space-y-4")}>
          <ArrivalsPanel
            bookings={bookings}
            timezone={timezone}
            onSelect={setSelected}
          />
          <div className="rounded-xl border border-border bg-gradient-subtle p-4">
            <p className="label-caps">{t("planning.service.all")}</p>
            <div className="mt-2 space-y-1.5">
              {SERVICES.map((window) => {
                const covers = coversByService[window.key];
                const over = capacity > 0 && covers > capacity;
                return (
                  <div
                    key={window.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {t(`planning.service.${window.key}`)}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        over ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {t("planning.coversOf", { booked: covers, capacity })}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
              {capacity > 0
                ? t("planning.remaining", {
                    count: Math.max(0, capacity - coversByService[service]),
                  })
                : t("planning.timeline.emptyBody")}
            </p>
          </div>
        </aside>
      </div>

      <NewBookingDrawer
        open={newOpen}
        onOpenChange={setNewOpen}
        date={date}
        timezone={timezone}
        guests={guests}
        tables={tables}
        dayBookings={bookings}
        defaultService={service}
        onCreated={handleCreated}
      />

      <BookingDetailDrawer
        booking={selected}
        timezone={timezone}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
