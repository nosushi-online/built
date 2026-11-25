import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import type { TeamRole } from "@/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import {
  SettingsSection,
  useRoleLabel,
  useSettingsText,
} from "./SettingsPrimitives";

export function AccountSection({ role }: { role: TeamRole }) {
  const s = useSettingsText();
  const roleLabel = useRoleLabel();
  const { t } = useI18n();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toText() ?? "";

  return (
    <div className="space-y-6">
      <SettingsSection
        ocid="settings.account.section"
        title={s("account.title")}
        description={s("account.subtitle")}
      >
        <div className="space-y-4">
          <h3 className="label-caps">{s("account.methods")}</h3>
          <div
            data-ocid="settings.account.method.1"
            className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Fingerprint className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {s("account.internetIdentity")}
                  <Badge
                    variant="secondary"
                    className="bg-success/15 text-success"
                  >
                    {s("account.connected")}
                  </Badge>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {principal}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              aria-describedby="account-last-method"
              data-ocid="settings.account.remove_button.1"
              className="shrink-0"
            >
              <Lock className="size-3.5" aria-hidden="true" />
              {s("account.remove")}
            </Button>
          </div>
          <p
            id="account-last-method"
            data-ocid="settings.account.last_method_note"
            className="flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground"
          >
            <ShieldCheck
              className="mt-0.5 size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            {s("account.lastMethod")}
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        ocid="settings.account.preferences.section"
        title={s("account.role")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            {roleLabel(role)}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {s("account.language")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("app.tagline")}</p>
      </SettingsSection>
    </div>
  );
}
