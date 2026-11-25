import type { TableStatus } from "@/backend";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { STATUS_ORDER, STATUS_STYLES } from "./tableStyles";

/** Colour key for the live floor, so staff read the room at a glance. */
export function FloorLegend({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div
      data-ocid="floor.legend"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
    >
      <span className="label-caps">{t("floor.legend")}</span>
      {STATUS_ORDER.map((status) => {
        const style = STATUS_STYLES[status];
        return (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
          >
            <span
              className={cn("size-2.5 rounded-full", style.dot)}
              aria-hidden="true"
            />
            {t(style.labelKey)}
          </span>
        );
      })}
    </div>
  );
}

/** Small status chip reused in the arrivals list and the table sheet. */
export function StatusChip({
  status,
  className,
}: {
  status: TableStatus;
  className?: string;
}) {
  const { t } = useI18n();
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        style.chip,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {t(style.labelKey)}
    </span>
  );
}
