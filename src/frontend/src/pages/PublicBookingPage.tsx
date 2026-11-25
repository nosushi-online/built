import type { PublicBookingResult } from "@/backend";
import { BookingConfirmation } from "@/components/public-booking/BookingConfirmation";
import { DateStrip } from "@/components/public-booking/DateStrip";
import {
  EMPTY_DETAILS,
  type GuestDetails,
  GuestForm,
  validateDetails,
} from "@/components/public-booking/GuestForm";
import { SlotPicker } from "@/components/public-booking/SlotPicker";
import {
  StepHeading,
  VenueHeader,
} from "@/components/public-booking/VenueHeader";
import {
  formatMinute,
  isClosedDate,
  servicesForDate,
  slotTimestamp,
} from "@/components/public-booking/booking-utils";
import {
  useCreatePublicBooking,
  usePublicAvailability,
  usePublicVenue,
} from "@/components/public-booking/usePublicBooking";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, isoDateInZone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CalendarX2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type Outcome =
  | { kind: "confirmed"; cancelToken: string; startAt: bigint }
  | { kind: "waitlisted"; message: string };

export function PublicBookingPage({ slug }: { slug: string }) {
  const { t, language } = useI18n();
  const venueQuery = usePublicVenue(slug);
  const venue = venueQuery.data;

  const today = useMemo(
    () => isoDateInZone(new Date(), venue?.timezone ?? "Europe/Paris"),
    [venue?.timezone],
  );

  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState<string>("");
  const [slot, setSlot] = useState<bigint | null>(null);
  const [details, setDetails] = useState<GuestDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GuestDetails, string>>
  >({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const effectiveDate = date || today;
  const closed = venue
    ? isClosedDate(venue.openingHours, venue.closedDates, effectiveDate)
    : false;

  const availability = usePublicAvailability(
    slug,
    closed ? "" : effectiveDate,
    partySize,
  );
  const createBooking = useCreatePublicBooking();

  const maxParty = venue ? Number(venue.maxOnlinePartySize) : 8;
  const services = venue
    ? servicesForDate(venue.openingHours, effectiveDate)
    : [];

  const changeParty = (delta: number) => {
    setPartySize((current) => Math.min(maxParty, Math.max(1, current + delta)));
    setSlot(null);
  };

  const changeDate = (iso: string) => {
    setDate(iso);
    setSlot(null);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateDetails(details, t);
    if (slot === null) nextErrors.notes = t("booking.error.slot");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || slot === null) return;

    createBooking.mutate(
      {
        slug,
        guestName: details.name.trim(),
        guestPhone: details.phone.trim(),
        guestEmail: details.email.trim() ? details.email.trim() : null,
        partySize,
        startAt: slot,
        notes: details.notes.trim() ? details.notes.trim() : null,
        honeypot: details.honeypot,
      },
      {
        onSuccess: (result: PublicBookingResult) => {
          if (result.__kind__ === "confirmed") {
            setOutcome({
              kind: "confirmed",
              cancelToken: result.confirmed.cancelToken,
              startAt: result.confirmed.startAt,
            });
          } else if (result.__kind__ === "waitlisted") {
            setOutcome({
              kind: "waitlisted",
              message: result.waitlisted.message,
            });
          } else {
            setSubmitError(t("booking.error.unavailable"));
          }
        },
        onError: () => setSubmitError(t("booking.error.generic")),
      },
    );
  };

  if (venueQuery.isLoading) {
    return <LoadingState rows={3} />;
  }

  if (venueQuery.isError) {
    return <ErrorState onRetry={() => void venueQuery.refetch()} />;
  }

  if (!venue) {
    return (
      <div
        data-ocid="booking.not_found_state"
        className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"
      >
        <CalendarX2
          className="size-7 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="font-display text-xl font-semibold text-foreground">
          {t("booking.notFound.title")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("booking.notFound.body")}
        </p>
      </div>
    );
  }

  if (outcome) {
    const when =
      outcome.kind === "confirmed"
        ? `${formatDate(outcome.startAt, venue.timezone, language, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })} · ${formatMinute(
            Number((outcome.startAt % 86_400_000_000_000n) / 60_000_000_000n),
          )}`
        : `${formatDate(
            slotTimestamp(effectiveDate, 0),
            venue.timezone,
            language,
            {
              weekday: "long",
              day: "numeric",
              month: "long",
            },
          )}`;
    return (
      <div className="space-y-5">
        <VenueHeader
          name={venue.name}
          description={venue.description}
          address={venue.address}
          phone={venue.phone}
          logo={venue.logo}
        />
        <BookingConfirmation
          venueName={venue.name}
          when={when}
          partySize={partySize}
          cancelToken={
            outcome.kind === "confirmed" ? outcome.cancelToken : undefined
          }
          waitlisted={outcome.kind === "waitlisted"}
          waitlistMessage={
            outcome.kind === "waitlisted" ? outcome.message : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <VenueHeader
        name={venue.name}
        description={venue.description}
        address={venue.address}
        phone={venue.phone}
        logo={venue.logo}
      />

      <form
        onSubmit={submit}
        noValidate
        data-ocid="booking.form"
        className="space-y-5"
      >
        {/* Party size */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
          <StepHeading step={1} title={t("booking.step.party")} />
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              data-ocid="booking.party_decrease_button"
              aria-label={t("booking.party.decrease")}
              disabled={partySize <= 1}
              onClick={() => changeParty(-1)}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-smooth hover:bg-secondary disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <div className="min-w-16 text-center">
              <p
                data-ocid="booking.party_value"
                className="font-display text-2xl font-semibold tabular-nums text-foreground"
              >
                {partySize}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("booking.party.label")}
              </p>
            </div>
            <button
              type="button"
              data-ocid="booking.party_increase_button"
              aria-label={t("booking.party.increase")}
              disabled={partySize >= maxParty}
              onClick={() => changeParty(1)}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-smooth hover:bg-secondary disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <p className="ml-auto max-w-[10rem] text-right text-xs text-muted-foreground">
              {t("booking.party.max", { count: maxParty })}
            </p>
          </div>
        </section>

        {/* Date */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
          <StepHeading step={2} title={t("booking.step.date")} />
          <div className="mt-4">
            <DateStrip
              today={today}
              selected={effectiveDate}
              openingHours={venue.openingHours}
              closedDates={venue.closedDates}
              onSelect={changeDate}
            />
          </div>
        </section>

        {/* Time slot */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
          <StepHeading step={3} title={t("booking.step.time")} />
          <div className="mt-4">
            {closed ? (
              <div
                data-ocid="booking.closed_state"
                className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-6 text-center text-sm text-muted-foreground"
              >
                {t("booking.closedDay")}
              </div>
            ) : (
              <SlotPicker
                slots={availability.data?.slots ?? []}
                services={services}
                selected={slot}
                onSelect={setSlot}
                onWaitlist={() => {
                  document
                    .getElementById("guest-details")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                isLoading={availability.isLoading}
              />
            )}
            {errors.notes && slot === null && !closed && (
              <p
                data-ocid="booking.slot_error"
                className="mt-3 text-xs text-destructive"
              >
                {errors.notes}
              </p>
            )}
          </div>
        </section>

        {/* Guest details */}
        <section
          id="guest-details"
          className="scroll-mt-6 rounded-xl border border-border bg-card p-5 shadow-subtle"
        >
          <StepHeading step={4} title={t("booking.step.details")} />
          <div className="mt-4">
            <GuestForm value={details} onChange={setDetails} errors={errors} />
          </div>
        </section>

        {submitError && (
          <p
            data-ocid="booking.submit_error"
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {submitError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("booking.footerNote")}
          </p>
          <button
            type="submit"
            data-ocid="booking.submit_button"
            disabled={createBooking.isPending || closed}
            className={cn(
              "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-subtle transition-smooth hover:bg-primary/90 disabled:opacity-50",
            )}
          >
            {createBooking.isPending
              ? t("booking.submitting")
              : t("booking.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
