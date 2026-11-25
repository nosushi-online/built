import type { PublicManageView } from "@/backend";
import { DateStrip } from "@/components/public-booking/DateStrip";
import { SlotPicker } from "@/components/public-booking/SlotPicker";
import { StepHeading } from "@/components/public-booking/VenueHeader";
import {
  buildIcs,
  downloadTextFile,
  isClosedDate,
  servicesForDate,
} from "@/components/public-booking/booking-utils";
import {
  useCancelPublicBooking,
  useModifyPublicBooking,
  usePublicAvailability,
  usePublicBooking,
  usePublicVenue,
} from "@/components/public-booking/usePublicBooking";
import { ErrorState, LoadingState } from "@/components/shared/States";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, formatTime, isoDateInZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus } from "@/types";
import {
  CalendarPlus,
  CalendarX2,
  Check,
  Clock,
  Minus,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const STATUS_TONE: Record<BookingStatus, string> = {
  [BookingStatus.confirmed]: "bg-success/15 text-success",
  [BookingStatus.pending]: "bg-warning/20 text-warning-foreground",
  [BookingStatus.seated]: "bg-primary/15 text-primary",
  [BookingStatus.finished]: "bg-muted text-muted-foreground",
  [BookingStatus.cancelled]: "bg-destructive/10 text-destructive",
  [BookingStatus.noShow]: "bg-destructive/10 text-destructive",
};

export function ManageBookingPage({ cancelToken }: { cancelToken: string }) {
  const { t, language } = useI18n();
  const bookingQuery = usePublicBooking(cancelToken);
  const booking = bookingQuery.data;

  const [editing, setEditing] = useState(false);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<bigint | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const modify = useModifyPublicBooking();
  const cancel = useCancelPublicBooking();

  const timezone = "Europe/Paris";
  const today = useMemo(() => isoDateInZone(new Date(), timezone), []);

  const startEditing = (current: PublicManageView) => {
    setPartySize(Number(current.partySize));
    setDate(
      isoDateInZone(new Date(Number(current.startAt / 1_000_000n)), timezone),
    );
    setSlot(current.startAt);
    setNotes(current.notes ?? "");
    setFeedback(null);
    setActionError(null);
    setEditing(true);
  };

  const saveChanges = () => {
    if (partySize === null) return;
    setActionError(null);
    modify.mutate(
      {
        token: cancelToken,
        partySize,
        startAt: slot,
        notes: notes.trim() ? notes.trim() : null,
      },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            setEditing(false);
            setFeedback(t("manage.updated"));
          } else {
            setActionError(t("manage.error.modify"));
          }
        },
        onError: () => setActionError(t("manage.error.generic")),
      },
    );
  };

  const confirmCancel = () => {
    setActionError(null);
    cancel.mutate(cancelToken, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          setFeedback(t("manage.cancelled"));
        } else {
          setActionError(t("manage.error.cancel"));
        }
      },
      onError: () => setActionError(t("manage.error.generic")),
    });
  };

  const addToCalendar = (current: PublicManageView) => {
    const ics = buildIcs({
      uid: cancelToken,
      startAt: current.startAt,
      endAt: current.endAt,
      summary: t("manage.ics.summary", { venue: current.venueName }),
      location: current.venueName,
      description: t("manage.ics.description", {
        count: Number(current.partySize),
        name: current.guestName,
      }),
    });
    downloadTextFile(`reservation-${cancelToken}.ics`, ics);
  };

  if (bookingQuery.isLoading) {
    return <LoadingState rows={3} />;
  }

  if (bookingQuery.isError) {
    return <ErrorState onRetry={() => void bookingQuery.refetch()} />;
  }

  if (!booking) {
    return (
      <div
        data-ocid="manage.not_found_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"
      >
        <CalendarX2
          className="size-7 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="font-display text-xl font-semibold text-foreground">
          {t("manage.notFound.title")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("manage.notFound.body")}
        </p>
      </div>
    );
  }

  const isCancelled = booking.status === BookingStatus.cancelled;
  const canChange = booking.canModify && booking.canCancel && !isCancelled;

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
        <div className="h-1.5 w-full bg-gradient-primary" aria-hidden="true" />
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="label-caps">{t("manage.eyebrow")}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                {booking.venueName}
              </h1>
            </div>
            <span
              data-ocid="manage.status_badge"
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                STATUS_TONE[booking.status],
              )}
            >
              {t(`manage.status.${booking.status}` as never)}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Clock
                className="mt-0.5 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <dt className="label-caps">{t("manage.when")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {formatDate(booking.startAt, timezone, language)}
                </dd>
                <dd className="text-sm text-muted-foreground tabular-nums">
                  {formatTime(booking.startAt, timezone, language)} –{" "}
                  {formatTime(booking.endAt, timezone, language)}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users
                className="mt-0.5 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <dt className="label-caps">{t("manage.party")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground tabular-nums">
                  {t("booking.summary.guests", {
                    count: Number(booking.partySize),
                  })}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <dt className="label-caps">{t("manage.guest")}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {booking.guestName}
                </dd>
              </div>
            </div>
          </dl>

          {booking.notes && (
            <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {booking.notes}
            </p>
          )}

          {feedback && (
            <p
              data-ocid="manage.success_state"
              className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              {feedback}
            </p>
          )}
          {actionError && (
            <p
              data-ocid="manage.error_state"
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {actionError}
            </p>
          )}

          {!canChange && !isCancelled && (
            <p
              data-ocid="manage.cutoff_notice"
              className="mt-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
            >
              {t("manage.cutoff")}
            </p>
          )}
          {isCancelled && (
            <p className="mt-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {t("manage.cancelledNotice")}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              data-ocid="manage.calendar_button"
              onClick={() => addToCalendar(booking)}
              className="rounded-full"
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              {t("manage.addToCalendar")}
            </Button>
            {canChange && (
              <Button
                type="button"
                variant="outline"
                data-ocid="manage.edit_button"
                onClick={() => startEditing(booking)}
                className="rounded-full"
              >
                <Pencil className="size-4" aria-hidden="true" />
                {t("manage.modify")}
              </Button>
            )}
            {canChange && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    data-ocid="manage.cancel_button"
                    className="rounded-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  >
                    <CalendarX2 className="size-4" aria-hidden="true" />
                    {t("manage.cancel")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-ocid="manage.cancel_dialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("manage.cancelConfirm.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("manage.cancelConfirm.body")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-ocid="manage.cancel_dialog_close_button">
                      {t("common.back")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="manage.cancel_confirm_button"
                      disabled={cancel.isPending}
                      onClick={confirmCancel}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("manage.cancelConfirm.action")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      {editing && canChange && (
        <EditPanel
          booking={booking}
          partySize={partySize ?? Number(booking.partySize)}
          date={date}
          slot={slot}
          notes={notes}
          today={today}
          isSaving={modify.isPending}
          onPartySize={setPartySize}
          onDate={(iso) => {
            setDate(iso);
            setSlot(null);
          }}
          onSlot={setSlot}
          onNotes={setNotes}
          onSave={saveChanges}
          onClose={() => setEditing(false)}
        />
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t("manage.keepLink")}
      </p>
    </div>
  );
}

/** Inline editor: party size, new date with closed days greyed out, new slot. */
function EditPanel({
  booking,
  partySize,
  date,
  slot,
  notes,
  today,
  isSaving,
  onPartySize,
  onDate,
  onSlot,
  onNotes,
  onSave,
  onClose,
}: {
  booking: PublicManageView;
  partySize: number;
  date: string;
  slot: bigint | null;
  notes: string;
  today: string;
  isSaving: boolean;
  onPartySize: (next: number) => void;
  onDate: (iso: string) => void;
  onSlot: (next: bigint | null) => void;
  onNotes: (next: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const venueQuery = usePublicVenue(booking.venueName ? "" : "");
  const venue = venueQuery.data;

  const openingHours = venue?.openingHours ?? [];
  const closedDates = venue?.closedDates ?? [];
  const closed = date ? isClosedDate(openingHours, closedDates, date) : false;
  const services = date ? servicesForDate(openingHours, date) : [];

  const availability = usePublicAvailability(venue ? "" : "", "", 1);

  return (
    <section
      data-ocid="manage.edit_panel"
      className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <StepHeading step={1} title={t("manage.edit.party")} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          data-ocid="manage.party_decrease_button"
          aria-label={t("booking.party.decrease")}
          disabled={partySize <= 1}
          onClick={() => onPartySize(Math.max(1, partySize - 1))}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-card transition-smooth hover:bg-secondary disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <p className="min-w-12 text-center font-display text-2xl font-semibold tabular-nums text-foreground">
          {partySize}
        </p>
        <button
          type="button"
          data-ocid="manage.party_increase_button"
          aria-label={t("booking.party.increase")}
          onClick={() => onPartySize(Math.min(20, partySize + 1))}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-card transition-smooth hover:bg-secondary"
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>

      <StepHeading step={2} title={t("manage.edit.date")} />
      <DateStrip
        today={today}
        selected={date}
        openingHours={openingHours}
        closedDates={closedDates}
        onSelect={onDate}
      />

      <StepHeading step={3} title={t("manage.edit.time")} />
      {closed ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-center text-sm text-muted-foreground">
          {t("booking.closedDay")}
        </p>
      ) : (
        <SlotPicker
          slots={availability.data?.slots ?? []}
          services={services}
          selected={slot}
          onSelect={onSlot}
          onWaitlist={() => onSlot(null)}
          isLoading={availability.isLoading}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="manage-notes">{t("booking.form.notes")}</Label>
        <Textarea
          id="manage-notes"
          data-ocid="manage.notes_input"
          rows={2}
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          data-ocid="manage.save_button"
          disabled={isSaving}
          onClick={onSave}
          className="rounded-full"
        >
          {isSaving ? t("common.loading") : t("common.save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          data-ocid="manage.edit_cancel_button"
          onClick={onClose}
          className="rounded-full"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </section>
  );
}
