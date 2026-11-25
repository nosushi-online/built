import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { Slot, Timestamp } from "@/types";
import type { ServiceWindow } from "@/types";
import { formatMinute, serviceForSlot, serviceKey } from "./booking-utils";

/** Time slots grouped by service window, with a waitlist fallback when empty. */
export function SlotPicker({
  slots,
  services,
  selected,
  onSelect,
  onWaitlist,
  isLoading,
}: {
  slots: Slot[];
  services: ServiceWindow[];
  selected: Timestamp | null;
  onSelect: (startAt: Timestamp) => void;
  onWaitlist: () => void;
  isLoading: boolean;
}) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div
        data-ocid="booking.slots.loading_state"
        aria-busy="true"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {Array.from({ length: 8 }, (_, i) => `slot-skeleton-${i}`).map((id) => (
          <div
            key={id}
            className="h-10 animate-pulse rounded-lg bg-muted"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        data-ocid="booking.slots.empty_state"
        className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-6 text-center"
      >
        <p className="font-display text-sm font-semibold text-foreground">
          {t("booking.noSlots.title")}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {t("booking.noSlots.body")}
        </p>
        <button
          type="button"
          data-ocid="booking.waitlist_button"
          onClick={onWaitlist}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-smooth hover:bg-accent/90"
        >
          {t("booking.waitlist.cta")}
        </button>
      </div>
    );
  }

  const groups = services
    .map((service) => ({
      service,
      items: slots.filter(
        (slot) => serviceForSlot([service], slot.startAt) !== null,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={serviceKey(group.service)} data-ocid="booking.service.panel">
          <p className="label-caps mb-2">
            {t("booking.service.label", {
              from: formatMinute(Number(group.service.openMinute)),
              to: formatMinute(Number(group.service.closeMinute)),
            })}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {group.items.map((slot) => {
              const active = selected === slot.startAt;
              return (
                <button
                  key={slot.startAt.toString()}
                  type="button"
                  aria-pressed={active}
                  data-ocid="booking.slot_button"
                  onClick={() => onSelect(slot.startAt)}
                  className={cn(
                    "min-h-11 rounded-lg border px-2 text-sm font-medium tabular-nums transition-smooth",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
                  )}
                >
                  {formatMinute(
                    Number(
                      (slot.startAt % 86_400_000_000_000n) / 60_000_000_000n,
                    ),
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
