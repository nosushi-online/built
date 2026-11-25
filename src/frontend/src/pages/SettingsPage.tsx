import { AccountSection } from "@/components/settings/AccountSection";
import { AuditSection } from "@/components/settings/AuditSection";
import { EmbedSection } from "@/components/settings/EmbedSection";
import { HoursSection } from "@/components/settings/HoursSection";
import { useSettingsText } from "@/components/settings/SettingsPrimitives";
import { TablesSection } from "@/components/settings/TablesSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { TemplatesSection } from "@/components/settings/TemplatesSection";
import type { SettingsKey } from "@/components/settings/settingsCopy";
import { useVenueDetail } from "@/components/settings/useSettingsQueries";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { hasAtLeastRole } from "@/lib/vertical";
import { TeamRole } from "@/types";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useState } from "react";

type TabId =
  | "team"
  | "hours"
  | "tables"
  | "templates"
  | "embed"
  | "audit"
  | "account";

const TABS: { id: TabId; labelKey: SettingsKey }[] = [
  { id: "team", labelKey: "settings.tab.team" },
  { id: "hours", labelKey: "settings.tab.hours" },
  { id: "tables", labelKey: "settings.tab.tables" },
  { id: "templates", labelKey: "settings.tab.templates" },
  { id: "embed", labelKey: "settings.tab.embed" },
  { id: "audit", labelKey: "settings.tab.audit" },
  { id: "account", labelKey: "settings.tab.account" },
];

export function SettingsPage() {
  const { t } = useI18n();
  const s = useSettingsText();
  const { active } = useVenue();
  const venueId = active?.venue.id;
  const role = active?.role ?? TeamRole.staff;
  const [tab, setTab] = useState<TabId>("team");

  const detail = useVenueDetail(venueId);

  if (!hasAtLeastRole(role, TeamRole.manager)) {
    return (
      <div className="space-y-6 animate-fade-up">
        <PageHeader
          title={t("page.settings.title")}
          subtitle={t("page.settings.subtitle")}
        />
        <EmptyState
          ocid="settings.staff_denied_state"
          icon={<Lock className="size-5" aria-hidden="true" />}
          title={s("settings.staffDenied.title")}
          description={s("settings.staffDenied.body")}
          action={
            <Button asChild type="button" variant="outline">
              <Link to="/planning">{t("nav.planning")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (venueId === undefined) {
    return <LoadingState rows={3} />;
  }

  const venue = detail.data;
  const isOwner = role === TeamRole.owner;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={t("page.settings.title")}
        subtitle={venue ? venue.name : t("page.settings.subtitle")}
      />

      <div
        role="tablist"
        aria-label={t("page.settings.title")}
        data-ocid="settings.tabs"
        className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-subtle"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            data-ocid={`settings.tab.${item.id}`}
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
              tab === item.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {s(item.labelKey)}
          </button>
        ))}
      </div>

      {detail.isLoading ? (
        <LoadingState rows={4} />
      ) : detail.isError ? (
        <ErrorState onRetry={() => void detail.refetch()} />
      ) : !venue ? (
        <ErrorState message={t("common.error")} />
      ) : (
        <div role="tabpanel" data-ocid={`settings.panel.${tab}`}>
          {tab === "team" && (
            <TeamSection
              venueId={venueId}
              timezone={venue.timezone}
              isOwner={isOwner}
            />
          )}
          {tab === "hours" && (
            <HoursSection
              venueId={venueId}
              openingHours={venue.openingHours}
              closures={venue.closures}
            />
          )}
          {tab === "tables" && <TablesSection venueId={venueId} />}
          {tab === "templates" && <TemplatesSection venueId={venueId} />}
          {tab === "embed" && <EmbedSection slug={venue.publicSlug} />}
          {tab === "audit" && (
            <AuditSection venueId={venueId} timezone={venue.timezone} />
          )}
          {tab === "account" && <AccountSection role={role} />}
        </div>
      )}
    </div>
  );
}
