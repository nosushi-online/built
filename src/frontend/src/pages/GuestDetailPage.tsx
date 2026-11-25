import type { GuestInput, GuestProfile } from "@/backend";
import { GuestAvatar } from "@/components/guests/GuestAvatar";
import { GuestFormDialog } from "@/components/guests/GuestFormDialog";
import { GuestTagList } from "@/components/guests/GuestTagList";
import { MergeGuestsDialog } from "@/components/guests/MergeGuestsDialog";
import { downloadText } from "@/components/guests/csv";
import { useGuestText } from "@/components/guests/guestText";
import {
  useAnonymizeGuest,
  useDeleteGuest,
  useExportGuestData,
  useGuestList,
  useGuestProfile,
  useMergeGuests,
  useUpdateGuest,
} from "@/components/guests/useGuestQueries";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDate, formatTime } from "@/lib/format";
import { hasAtLeastRole } from "@/lib/vertical";
import { BookingStatus, TeamRole } from "@/types";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Mail,
  Merge,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_TONE: Record<BookingStatus, string> = {
  [BookingStatus.confirmed]: "bg-success/15 text-success",
  [BookingStatus.seated]: "bg-primary/10 text-primary",
  [BookingStatus.finished]: "bg-secondary text-secondary-foreground",
  [BookingStatus.pending]: "bg-warning/20 text-warning-foreground",
  [BookingStatus.cancelled]: "bg-muted text-muted-foreground",
  [BookingStatus.noShow]: "bg-destructive/12 text-destructive",
};

const STATUS_LABEL = {
  [BookingStatus.confirmed]: "guests.detail.status.confirmed",
  [BookingStatus.seated]: "guests.detail.status.seated",
  [BookingStatus.finished]: "guests.detail.status.finished",
  [BookingStatus.pending]: "guests.detail.status.pending",
  [BookingStatus.cancelled]: "guests.detail.status.cancelled",
  [BookingStatus.noShow]: "guests.detail.status.noShow",
} as const;

export function GuestDetailPage({ guestId }: { guestId: string }) {
  const t = useGuestText();
  const { language } = useI18n();
  const navigate = useNavigate();
  const { active } = useVenue();
  const venueId = active?.venue.id;
  const timezone = active?.venue.timezone ?? "Europe/Paris";
  const role = active?.role ?? TeamRole.staff;
  const canManage = hasAtLeastRole(role, TeamRole.manager);

  const id = /^\d+$/.test(guestId) ? BigInt(guestId) : undefined;
  const profileQuery = useGuestProfile(id);
  const guestsQuery = useGuestList(venueId, {
    optInOnly: false,
    tags: [],
    hasAllergies: false,
    vipOnly: false,
  });

  const updateGuest = useUpdateGuest();
  const mergeGuests = useMergeGuests();
  const exportData = useExportGuestData();
  const anonymize = useAnonymizeGuest();
  const remove = useDeleteGuest();

  const [editOpen, setEditOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [confirm, setConfirm] = useState<"anonymize" | "delete" | null>(null);

  const now = BigInt(Date.now()) * 1_000_000n;
  const profile: GuestProfile | null | undefined = profileQuery.data;

  if (profileQuery.isLoading) {
    return <LoadingState rows={5} />;
  }
  if (profileQuery.isError) {
    return <ErrorState onRetry={() => void profileQuery.refetch()} />;
  }
  if (!profile) {
    return (
      <div className="space-y-4">
        <BackLink label={t("guests.detail.back")} />
        <EmptyState
          ocid="guests.detail.empty_state"
          title={t("guests.detail.notFound")}
          description={t("guests.detail.notFound")}
        />
      </div>
    );
  }

  const guest = profile.guest;
  const bookings = [...profile.bookings].sort((a, b) =>
    a.startAt === b.startAt ? 0 : a.startAt > b.startAt ? -1 : 1,
  );

  const handleSave = (input: GuestInput) => {
    updateGuest.mutate(
      { guestId: guest.id, input },
      {
        onSuccess: () => {
          setEditOpen(false);
          toast.success(t("guests.form.saved"));
        },
        onError: () => toast.error(t("guests.form.error")),
      },
    );
  };

  const handleExportJson = () => {
    exportData.mutate(guest.id, {
      onSuccess: (data) => {
        downloadText(
          `client-${guest.id.toString()}.json`,
          data.json,
          "application/json",
        );
        toast.success(t("guests.detail.exportJsonDone"));
      },
      onError: () => toast.error(t("guests.detail.privacyError")),
    });
  };

  const handleAnonymize = () => {
    anonymize.mutate(guest.id, {
      onSuccess: () => {
        setConfirm(null);
        toast.success(t("guests.detail.anonymizeDone"));
      },
      onError: () => toast.error(t("guests.detail.privacyError")),
    });
  };

  const handleDelete = () => {
    remove.mutate(guest.id, {
      onSuccess: () => {
        setConfirm(null);
        toast.success(t("guests.detail.deleteDone"));
        void navigate({ to: "/guests" });
      },
      onError: () => toast.error(t("guests.detail.privacyError")),
    });
  };

  const handleMerge = (keepId: bigint, mergeId: bigint) => {
    mergeGuests.mutate(
      { keepId, mergeId },
      {
        onSuccess: () => {
          setMergeOpen(false);
          toast.success(t("guests.detail.mergeDone"));
          if (mergeId === guest.id) {
            void navigate({
              to: "/guests/$guestId",
              params: { guestId: keepId.toString() },
            });
          }
        },
        onError: () => toast.error(t("guests.detail.mergeError")),
      },
    );
  };

  const stats = [
    { label: t("guests.detail.visits"), value: Number(guest.visitCount) },
    { label: t("guests.detail.noShows"), value: Number(guest.noShowCount) },
    {
      label: t("guests.detail.lastVisit"),
      value:
        guest.lastVisitAt === undefined
          ? t("guests.never")
          : formatDate(guest.lastVisitAt, timezone, language, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
    },
    {
      label: t("guests.detail.memberSince"),
      value: formatDate(guest.createdAt, timezone, language, {
        month: "short",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <BackLink label={t("guests.detail.back")} />

      <div className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <GuestAvatar name={guest.name} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-foreground">
                {guest.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {guest.phone}
                </span>
                {guest.email && (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{guest.email}</span>
                  </span>
                )}
              </div>
              <GuestTagList guest={guest} now={now} className="mt-3" />
              {guest.marketingOptIn && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {guest.marketingOptInAt !== undefined
                    ? t("guests.optInAt", {
                        date: formatDate(
                          guest.marketingOptInAt,
                          timezone,
                          language,
                          { day: "numeric", month: "long", year: "numeric" },
                        ),
                      })
                    : t("guests.optIn")}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="guests.detail.edit_button"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" aria-hidden="true" />
              {t("guests.detail.edit")}
            </Button>
            {canManage && (
              <Button
                type="button"
                variant="outline"
                data-ocid="guests.detail.merge_button"
                onClick={() => setMergeOpen(true)}
              >
                <Merge className="size-4" aria-hidden="true" />
                {t("guests.detail.merge")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                {t("guests.detail.stats")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="label-caps">{stat.label}</dt>
                    <dd className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                {t("guests.detail.history")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("guests.detail.historyEmpty")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {bookings.map((booking, index) => (
                    <li
                      key={booking.id.toString()}
                      data-ocid={`guests.detail.booking.${index + 1}`}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <CalendarDays className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {formatDate(booking.startAt, timezone, language, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(booking.startAt, timezone, language)} ·{" "}
                            {t("guests.detail.party", {
                              count: Number(booking.partySize),
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 rounded-full border-transparent ${STATUS_TONE[booking.status]}`}
                      >
                        {t(STATUS_LABEL[booking.status])}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                {t("guests.detail.preferences")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <DetailBlock
                label={t("guests.detail.allergies")}
                value={guest.allergies}
                empty={t("guests.detail.none")}
                tone="danger"
              />
              <Separator />
              <DetailBlock
                label={t("guests.detail.preferences")}
                value={guest.preferences}
                empty={t("guests.detail.none")}
              />
              <Separator />
              <DetailBlock
                label={t("guests.detail.notes")}
                value={guest.notes}
                empty={t("guests.detail.none")}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <ShieldAlert
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("guests.detail.privacy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {canManage
                  ? t("guests.detail.privacyBody")
                  : t("guests.detail.ownerOnly")}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="guests.detail.export_json_button"
                  onClick={handleExportJson}
                  disabled={exportData.isPending}
                  className="justify-start"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t("guests.detail.exportJson")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="guests.detail.anonymize_button"
                  onClick={() => setConfirm("anonymize")}
                  disabled={!canManage}
                  className="justify-start"
                >
                  <UserX className="size-4" aria-hidden="true" />
                  {t("guests.detail.anonymize")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="guests.detail.delete_button"
                  onClick={() => setConfirm("delete")}
                  disabled={!canManage}
                  className="justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("guests.detail.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <GuestFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        guest={guest}
        pending={updateGuest.isPending}
        onSubmit={handleSave}
      />

      {canManage && (
        <MergeGuestsDialog
          open={mergeOpen}
          onOpenChange={setMergeOpen}
          guests={guestsQuery.data ?? []}
          keepId={guest.id}
          pending={mergeGuests.isPending}
          onSubmit={handleMerge}
        />
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent
          data-ocid="guests.detail.confirm_dialog"
          className="rounded-xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {confirm === "delete"
                ? t("guests.detail.deleteTitle")
                : t("guests.detail.anonymizeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? t("guests.detail.deleteBody")
                : t("guests.detail.anonymizeBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="guests.detail.confirm_cancel_button">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="guests.detail.confirm_button"
              className={
                confirm === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                if (confirm === "delete") handleDelete();
                else handleAnonymize();
              }}
              disabled={anonymize.isPending || remove.isPending}
            >
              {confirm === "delete"
                ? t("guests.detail.delete")
                : t("guests.detail.anonymize")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      to="/guests"
      data-ocid="guests.detail.back_link"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function DetailBlock({
  label,
  value,
  empty,
  tone,
}: {
  label: string;
  value?: string;
  empty: string;
  tone?: "danger";
}) {
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p
        className={
          value
            ? tone === "danger"
              ? "mt-1 whitespace-pre-line font-medium text-destructive"
              : "mt-1 whitespace-pre-line text-foreground"
            : "mt-1 text-muted-foreground"
        }
      >
        {value ?? empty}
      </p>
    </div>
  );
}
