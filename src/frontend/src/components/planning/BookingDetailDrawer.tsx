import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, formatTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BookingStatus, type BookingView } from "@/types";
import { ArrowRight, Mail, Phone, StickyNote } from "lucide-react";
import { useState } from "react";
import { STATUS_TRANSITIONS, StatusBadge, statusLabel } from "./status";
import { usePlanningCopy } from "./usePlanningCopy";
import { useChangeBookingStatus } from "./usePlanningMutations";

export function BookingDetailDrawer({
  booking,
  timezone,
  onOpenChange,
}: {
  booking: BookingView | null;
  timezone: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = usePlanningCopy();
  const { language } = useI18n();
  const changeStatus = useChangeBookingStatus();
  const [error, setError] = useState<string | null>(null);

  const transitions = booking ? STATUS_TRANSITIONS[booking.status] : [];

  const handleChange = async (status: BookingStatus) => {
    if (!booking) return;
    setError(null);
    try {
      await changeStatus.mutateAsync({ bookingId: booking.id, status });
    } catch {
      setError(t("booking.detail.statusError"));
    }
  };

  return (
    <Drawer
      open={booking !== null}
      onOpenChange={onOpenChange}
      direction="right"
    >
      <DrawerContent
        data-ocid="booking.detail.sheet"
        className="w-full sm:max-w-md"
      >
        {booking && (
          <>
            <DrawerHeader className="border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials(booking.guestName)}
                </span>
                <div className="min-w-0 flex-1">
                  <DrawerTitle className="truncate font-display text-lg">
                    {booking.guestName}
                  </DrawerTitle>
                  <DrawerDescription className="tabular-nums">
                    {formatDate(booking.startAt, timezone, language)} ·{" "}
                    {formatTime(booking.startAt, timezone, language)}
                  </DrawerDescription>
                </div>
                <StatusBadge status={booking.status} t={t} />
              </div>
            </DrawerHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <dt className="label-caps">{t("planning.party")}</dt>
                  <dd className="tabular-nums mt-0.5 text-sm font-semibold text-foreground">
                    {booking.partySize.toString()}
                  </dd>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <dt className="label-caps">{t("planning.table")}</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {booking.tableName ?? t("planning.noTable")}
                  </dd>
                </div>
              </dl>

              <section className="space-y-1.5">
                <p className="label-caps">{t("booking.detail.contact")}</p>
                <a
                  href={`tel:${booking.guestPhone}`}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
                >
                  <Phone
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {booking.guestPhone}
                </a>
                {booking.guestEmail && (
                  <a
                    href={`mailto:${booking.guestEmail}`}
                    className="flex items-center gap-2 truncate text-sm text-foreground hover:text-primary"
                  >
                    <Mail
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {booking.guestEmail}
                  </a>
                )}
                {booking.notes && (
                  <p className="flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-foreground">
                    <StickyNote
                      className="mt-0.5 size-3.5 shrink-0 text-accent-foreground"
                      aria-hidden="true"
                    />
                    {booking.notes}
                  </p>
                )}
              </section>

              {transitions.length > 0 && (
                <section className="space-y-2">
                  <p className="label-caps">
                    {t("booking.detail.changeStatus")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {transitions.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={
                          status === BookingStatus.cancelled
                            ? "outline"
                            : "secondary"
                        }
                        size="sm"
                        disabled={changeStatus.isPending}
                        onClick={() => void handleChange(status)}
                        data-ocid={`booking.status.${status}`}
                        className={cn(
                          "h-9 rounded-lg",
                          status === BookingStatus.cancelled &&
                            "border-destructive/40 text-destructive hover:bg-destructive/10",
                        )}
                      >
                        {statusLabel(t, status)}
                      </Button>
                    ))}
                  </div>
                  {error && (
                    <p
                      role="alert"
                      data-ocid="booking.detail.error_state"
                      className="text-xs font-medium text-destructive"
                    >
                      {error}
                    </p>
                  )}
                </section>
              )}

              <section className="space-y-2">
                <p className="label-caps">{t("booking.detail.history")}</p>
                {booking.statusHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("booking.detail.noHistory")}
                  </p>
                ) : (
                  <ol className="relative space-y-3 border-l border-border pl-4">
                    {[...booking.statusHistory]
                      .sort((a, b) => Number(b.at - a.at))
                      .map((entry, index) => (
                        <li
                          key={`${entry.at.toString()}-${entry.status}-${index}`}
                          className="relative"
                        >
                          <span className="absolute -left-[1.32rem] top-1 size-2 rounded-full bg-primary ring-2 ring-card" />
                          <div className="flex items-center gap-2">
                            <StatusBadge status={entry.status} t={t} />
                            <span className="tabular-nums text-[11px] text-muted-foreground">
                              {formatDate(entry.at, timezone, language, {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {t("booking.detail.by")}{" "}
                            {entry.by
                              ? `${entry.by.toText().slice(0, 5)}…${entry.by.toText().slice(-4)}`
                              : t("booking.detail.system")}
                          </p>
                        </li>
                      ))}
                  </ol>
                )}
              </section>

              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ArrowRight className="size-3" aria-hidden="true" />
                {t("booking.detail.created")}{" "}
                {formatDate(booking.createdAt, timezone, language, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <DrawerFooter className="border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-ocid="booking.detail.close_button"
                className="h-10 rounded-lg"
              >
                {t("common.close")}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
