import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ocid = "empty_state",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  ocid?: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </span>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div
      data-ocid="error_state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-sm text-foreground">{message ?? t("common.error")}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          data-ocid="retry_button"
          onClick={onRetry}
        >
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  const ids = Array.from({ length: rows }, (_, i) => `skeleton-${i}`);
  return (
    <div
      data-ocid="loading_state"
      aria-busy="true"
      className={cn("space-y-3", className)}
    >
      {ids.map((id) => (
        <Skeleton key={id} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
