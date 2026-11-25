import { useI18n } from "@/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import type { AuditEntry } from "@/types";
import { History } from "lucide-react";
import { SettingsSection, useSettingsText } from "./SettingsPrimitives";
import { useRecentAudit } from "./useSettingsQueries";

function ValueCell({ value }: { value?: string }) {
  const s = useSettingsText();
  if (!value) {
    return <span className="text-muted-foreground">{s("audit.none")}</span>;
  }
  return (
    <span className="break-words font-mono text-xs text-foreground">
      {value}
    </span>
  );
}

export function AuditSection({
  venueId,
  timezone,
}: {
  venueId: bigint;
  timezone: string;
}) {
  const s = useSettingsText();
  const { language } = useI18n();
  const audit = useRecentAudit(venueId);
  const entries = audit.data ?? [];

  return (
    <SettingsSection
      ocid="settings.audit.section"
      title={s("audit.title")}
      description={s("audit.subtitle")}
    >
      {audit.isLoading ? (
        <p className="text-sm text-muted-foreground">{s("audit.empty")}</p>
      ) : entries.length === 0 ? (
        <p
          data-ocid="settings.audit.empty_state"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <History className="size-4" aria-hidden="true" />
          {s("audit.empty")}
        </p>
      ) : (
        <ol
          data-ocid="settings.audit.list"
          className="relative space-y-4 border-l border-border pl-5"
        >
          {entries.map((entry: AuditEntry, index) => (
            <li
              key={entry.id.toString()}
              data-ocid={`settings.audit.item.${index + 1}`}
              className="relative"
            >
              <span
                className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {entry.action}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {entry.entity}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.at, timezone, language, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                {s("audit.actor")} · {entry.actorPrincipal.toText()}
              </p>
              {(entry.before || entry.after) && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    <p className="label-caps">{s("audit.before")}</p>
                    <div className="mt-1">
                      <ValueCell value={entry.before} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                    <p className="label-caps">{s("audit.after")}</p>
                    <div className="mt-1">
                      <ValueCell value={entry.after} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </SettingsSection>
  );
}
