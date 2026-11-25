import { PageHeader } from "@/components/shared/PageHeader";
import { useI18n } from "@/i18n/I18nProvider";
import { CalendarClock, Ticket } from "lucide-react";

export function PublicBookingPage({ slug }: { slug: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={t("page.booking.title")}
        subtitle={t("page.booking.subtitle")}
      />
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-foreground">
              {t("page.booking.title")}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {slug}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("common.comingSoonBody")}
        </p>
      </div>
    </div>
  );
}

export function ManageBookingPage({ cancelToken }: { cancelToken: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={t("page.manage.title")}
        subtitle={t("page.manage.subtitle")}
      />
      <div className="rounded-xl border border-border bg-card p-6 shadow-subtle">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <Ticket className="size-5" aria-hidden="true" />
          </span>
          <p className="label-caps">{t("page.manage.title")}</p>
        </div>
        <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
          {cancelToken}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("common.comingSoonBody")}
        </p>
      </div>
    </div>
  );
}
