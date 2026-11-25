import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookingSource, BookingStatus } from "@/types";
import type { PlanningKey } from "./planningCopy";

type Translate = (
  key: PlanningKey,
  vars?: Record<string, string | number>,
) => string;

const STATUS_STYLE: Record<BookingStatus, string> = {
  [BookingStatus.confirmed]: "border-transparent bg-primary/10 text-primary",
  [BookingStatus.pending]:
    "border-transparent bg-warning/20 text-warning-foreground",
  [BookingStatus.seated]:
    "border-transparent bg-accent/25 text-accent-foreground",
  [BookingStatus.finished]: "border-transparent bg-muted text-muted-foreground",
  [BookingStatus.cancelled]:
    "border-transparent bg-destructive/10 text-destructive",
  [BookingStatus.noShow]:
    "border-transparent bg-destructive/10 text-destructive",
};

const STATUS_KEY: Record<BookingStatus, PlanningKey> = {
  [BookingStatus.confirmed]: "planning.status.confirmed",
  [BookingStatus.pending]: "planning.status.pending",
  [BookingStatus.seated]: "planning.status.seated",
  [BookingStatus.finished]: "planning.status.finished",
  [BookingStatus.cancelled]: "planning.status.cancelled",
  [BookingStatus.noShow]: "planning.status.noShow",
};

const SOURCE_KEY: Record<BookingSource, PlanningKey> = {
  [BookingSource.staff]: "planning.source.staff",
  [BookingSource.phone]: "planning.source.phone",
  [BookingSource.online]: "planning.source.online",
  [BookingSource.walkIn]: "planning.source.walkIn",
};

export function statusLabel(t: Translate, status: BookingStatus): string {
  return t(STATUS_KEY[status]);
}

export function sourceLabel(t: Translate, source: BookingSource): string {
  return t(SOURCE_KEY[source]);
}

export function StatusBadge({
  status,
  t,
  className,
}: {
  status: BookingStatus;
  t: Translate;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[status],
        className,
      )}
    >
      {statusLabel(t, status)}
    </Badge>
  );
}

/** Statuses a booking can move to from its current one. */
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.pending]: [
    BookingStatus.confirmed,
    BookingStatus.cancelled,
    BookingStatus.noShow,
  ],
  [BookingStatus.confirmed]: [
    BookingStatus.seated,
    BookingStatus.cancelled,
    BookingStatus.noShow,
  ],
  [BookingStatus.seated]: [BookingStatus.finished],
  [BookingStatus.finished]: [],
  [BookingStatus.cancelled]: [],
  [BookingStatus.noShow]: [],
};
