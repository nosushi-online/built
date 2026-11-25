import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Guest, Timestamp } from "@/types";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { GuestAvatar } from "./GuestAvatar";
import { GuestTagList } from "./GuestTagList";
import { useGuestText } from "./guestText";

function lastVisitLabel(
  guest: Guest,
  timezone: string,
  language: Parameters<typeof formatDate>[2],
  t: ReturnType<typeof useGuestText>,
): string {
  if (guest.lastVisitAt === undefined) return t("guests.never");
  return formatDate(guest.lastVisitAt, timezone, language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GuestTable({
  guests,
  now,
  timezone,
  language,
  selectable,
  selectedIds,
  onToggleSelect,
}: {
  guests: Guest[];
  now: Timestamp;
  timezone: string;
  language: Parameters<typeof formatDate>[2];
  selectable: boolean;
  selectedIds: GuestIdSet;
  onToggleSelect: (id: bigint) => void;
}) {
  const t = useGuestText();

  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {selectable && <TableHead className="w-10" />}
            <TableHead>{t("guests.col.guest")}</TableHead>
            <TableHead>{t("guests.col.contact")}</TableHead>
            <TableHead className="text-right">
              {t("guests.col.visits")}
            </TableHead>
            <TableHead>{t("guests.col.lastVisit")}</TableHead>
            <TableHead>{t("guests.col.tags")}</TableHead>
            <TableHead className="w-12 text-right">
              <span className="sr-only">{t("guests.col.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest, index) => {
            const selected = selectedIds.has(guest.id.toString());
            return (
              <TableRow
                key={guest.id.toString()}
                data-ocid={`guests.item.${index + 1}`}
                className={cn(
                  "group transition-colors",
                  selected && "bg-accent/10",
                )}
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={t("guests.merge.select")}
                      data-ocid={`guests.select.${index + 1}`}
                      checked={selected}
                      onChange={() => onToggleSelect(guest.id)}
                      className="size-4 cursor-pointer rounded border-input accent-primary"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link
                    to="/guests/$guestId"
                    params={{ guestId: guest.id.toString() }}
                    data-ocid={`guests.link.${index + 1}`}
                    className="flex items-center gap-3"
                  >
                    <GuestAvatar name={guest.name} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground group-hover:text-primary">
                        {guest.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {guest.visitCount === 1n
                          ? t("guests.visitsOne")
                          : t("guests.visits", {
                              count: Number(guest.visitCount),
                            })}
                        {guest.noShowCount > 0n &&
                          ` · ${t("guests.noShows", {
                            count: Number(guest.noShowCount),
                          })}`}
                      </span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="block text-sm text-foreground">
                    {guest.phone}
                  </span>
                  {guest.email && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {guest.email}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {Number(guest.visitCount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {lastVisitLabel(guest, timezone, language, t)}
                </TableCell>
                <TableCell>
                  <GuestTagList guest={guest} now={now} max={3} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="size-8"
                  >
                    <Link
                      to="/guests/$guestId"
                      params={{ guestId: guest.id.toString() }}
                      aria-label={t("guests.open")}
                    >
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function GuestCardList({
  guests,
  now,
  timezone,
  language,
  selectable,
  selectedIds,
  onToggleSelect,
}: {
  guests: Guest[];
  now: Timestamp;
  timezone: string;
  language: Parameters<typeof formatDate>[2];
  selectable: boolean;
  selectedIds: GuestIdSet;
  onToggleSelect: (id: bigint) => void;
}) {
  const t = useGuestText();
  return (
    <ul className="space-y-2 md:hidden">
      {guests.map((guest, index) => {
        const selected = selectedIds.has(guest.id.toString());
        return (
          <li
            key={guest.id.toString()}
            data-ocid={`guests.card.${index + 1}`}
            className={cn(
              "rounded-xl border border-border bg-card p-3",
              selected && "border-primary/40 bg-accent/10",
            )}
          >
            <div className="flex items-start gap-3">
              {selectable && (
                <input
                  type="checkbox"
                  aria-label={t("guests.merge.select")}
                  data-ocid={`guests.select.${index + 1}`}
                  checked={selected}
                  onChange={() => onToggleSelect(guest.id)}
                  className="mt-1 size-4 cursor-pointer rounded border-input accent-primary"
                />
              )}
              <GuestAvatar name={guest.name} />
              <Link
                to="/guests/$guestId"
                params={{ guestId: guest.id.toString() }}
                data-ocid={`guests.link.${index + 1}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate font-medium text-foreground">
                  {guest.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {guest.phone}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {guest.visitCount === 1n
                      ? t("guests.visitsOne")
                      : t("guests.visits", { count: Number(guest.visitCount) })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{lastVisitLabel(guest, timezone, language, t)}</span>
                </div>
              </Link>
              <ChevronRight
                className="mt-1 size-4 shrink-0 text-muted-foreground/50"
                aria-hidden="true"
              />
            </div>
            <GuestTagList guest={guest} now={now} max={3} className="mt-2" />
          </li>
        );
      })}
    </ul>
  );
}

export type GuestIdSet = Set<string>;
