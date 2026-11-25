import {
  type PlanningKey,
  planningCopy,
} from "@/components/planning/planningCopy";
import { useI18n } from "@/i18n/I18nProvider";

/** Planning copy bound to the active language from the shared i18n layer. */
export function usePlanningCopy() {
  const { language } = useI18n();
  return (key: PlanningKey, vars?: Record<string, string | number>) =>
    planningCopy(language, key, vars);
}
