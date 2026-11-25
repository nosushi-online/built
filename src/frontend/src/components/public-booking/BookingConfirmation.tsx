import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check, Copy, PartyPopper } from "lucide-react";
import { useState } from "react";

/** Confirmation panel shown after a booking is created. */
export function BookingConfirmation({
  venueName,
  when,
  partySize,
  cancelToken,
  waitlisted,
  waitlistMessage,
}: {
  venueName: string;
  when: string;
  partySize: number;
  cancelToken?: string;
  waitlisted: boolean;
  waitlistMessage?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const manageUrl =
    cancelToken && typeof window !== "undefined"
      ? `${window.location.origin}/booking/${cancelToken}`
      : "";

  const copy = async () => {
    if (!manageUrl) return;
    try {
      await navigator.clipboard.writeText(manageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      data-ocid={
        waitlisted ? "booking.waitlisted_state" : "booking.success_state"
      }
      className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <div className="h-1.5 w-full bg-gradient-primary" aria-hidden="true" />
      <div className="p-6">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            waitlisted
              ? "bg-accent text-accent-foreground"
              : "bg-success text-success-foreground",
          )}
        >
          {waitlisted ? (
            <PartyPopper className="size-6" aria-hidden="true" />
          ) : (
            <Check className="size-6" aria-hidden="true" />
          )}
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          {waitlisted
            ? t("booking.waitlist.title")
            : t("booking.success.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {waitlisted
            ? (waitlistMessage ?? t("booking.waitlist.body"))
            : t("booking.success.body", { venue: venueName })}
        </p>

        <dl className="mt-5 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="label-caps">{t("booking.summary.when")}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{when}</dd>
          </div>
          <div>
            <dt className="label-caps">{t("booking.summary.party")}</dt>
            <dd className="mt-0.5 font-medium text-foreground tabular-nums">
              {t("booking.summary.guests", { count: partySize })}
            </dd>
          </div>
        </dl>

        {manageUrl && (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("booking.success.manageTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("booking.success.manageBody")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={manageUrl}
                data-ocid="booking.manage_link"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90"
              >
                {t("booking.success.manageCta")}
              </a>
              <button
                type="button"
                data-ocid="booking.copy_link_button"
                onClick={() => void copy()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-smooth hover:bg-secondary"
              >
                {copied ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
                {copied
                  ? t("booking.success.copied")
                  : t("booking.success.copy")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
