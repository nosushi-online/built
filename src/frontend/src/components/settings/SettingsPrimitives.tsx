import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { TeamRole } from "@/types";
import type { ReactNode } from "react";
import { type SettingsKey, settingsText } from "./settingsCopy";

/** Resolves settings copy against the active interface language. */
export function useSettingsText() {
  const { language } = useI18n();
  return (key: SettingsKey, vars?: Record<string, string | number>) =>
    settingsText(language, key, vars);
}

export function SettingsSection({
  title,
  description,
  actions,
  children,
  ocid,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  ocid: string;
  className?: string;
}) {
  return (
    <section
      data-ocid={ocid}
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-subtle md:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const ROLE_KEYS: Record<
  TeamRole,
  "role.owner" | "role.manager" | "role.staff"
> = {
  [TeamRole.owner]: "role.owner",
  [TeamRole.manager]: "role.manager",
  [TeamRole.staff]: "role.staff",
};

/** Role labels come from the shared shell dictionary via `t`. */
export function useRoleLabel() {
  const { t } = useI18n();
  return (role: TeamRole) => t(ROLE_KEYS[role]);
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      data-ocid="settings.error_state"
      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
