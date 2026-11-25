import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";
import { SERVICES, type ServiceKey } from "./planningUtils";
import { usePlanningCopy } from "./usePlanningCopy";

export function ServiceTabs({
  value,
  onChange,
  coversByService,
  capacity,
}: {
  value: ServiceKey;
  onChange: (service: ServiceKey) => void;
  coversByService: Record<ServiceKey, number>;
  capacity: number;
}) {
  const t = usePlanningCopy();

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as ServiceKey)}
      className="w-full"
    >
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {SERVICES.map((service) => {
          const covers = coversByService[service.key];
          const ratio = capacity > 0 ? covers / capacity : 0;
          const over = capacity > 0 && covers > capacity;
          return (
            <TabsTrigger
              key={service.key}
              value={service.key}
              data-ocid={`planning.service.tab.${service.key}`}
              className="flex h-auto flex-col items-stretch gap-1.5 rounded-lg px-3 py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-subtle"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <UtensilsCrossed className="size-3.5" aria-hidden="true" />
                  {t(`planning.service.${service.key}`)}
                </span>
                <span
                  className={cn(
                    "tabular-nums text-xs font-medium",
                    over ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {t("planning.coversOf", { booked: covers, capacity })}
                </span>
              </span>
              <Progress
                value={Math.min(100, Math.round(ratio * 100))}
                className={cn(
                  "h-1.5",
                  over && "[&>[data-slot=progress-indicator]]:bg-destructive",
                )}
              />
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
