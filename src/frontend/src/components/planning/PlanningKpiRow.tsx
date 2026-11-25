import { cn } from "@/lib/utils";
import { CalendarCheck, Clock3, Users, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import { usePlanningCopy } from "./usePlanningCopy";

export interface PlanningKpis {
  bookings: number;
  covers: number;
  seated: number;
  pending: number;
  arrivals: number;
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  ocid,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: boolean;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-subtle",
        accent && "border-primary/20 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground",
          accent && "bg-primary text-primary-foreground",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="tabular-nums font-display text-xl font-semibold leading-none text-foreground">
          {value}
        </p>
        <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

export function PlanningKpiRow({ kpis }: { kpis: PlanningKpis }) {
  const t = usePlanningCopy();
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
      <KpiCard
        ocid="planning.kpi.bookings"
        label={t("planning.kpi.bookings")}
        value={kpis.bookings}
        icon={<CalendarCheck className="size-4" aria-hidden="true" />}
      />
      <KpiCard
        ocid="planning.kpi.covers"
        label={t("planning.kpi.covers")}
        value={kpis.covers}
        icon={<UtensilsCrossed className="size-4" aria-hidden="true" />}
        accent
      />
      <KpiCard
        ocid="planning.kpi.seated"
        label={t("planning.kpi.seated")}
        value={kpis.seated}
        icon={<Users className="size-4" aria-hidden="true" />}
      />
      <KpiCard
        ocid="planning.kpi.pending"
        label={t("planning.kpi.pending")}
        value={kpis.pending}
        icon={<Clock3 className="size-4" aria-hidden="true" />}
      />
      <KpiCard
        ocid="planning.kpi.arrivals"
        label={t("planning.kpi.arrivals")}
        value={kpis.arrivals}
        icon={<Clock3 className="size-4" aria-hidden="true" />}
      />
    </div>
  );
}
