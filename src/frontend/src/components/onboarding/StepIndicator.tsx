import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { onboardingCopy } from "./copy";
import { STEP_KEYS, type StepKey } from "./onboarding-utils";

const STEP_LABEL: Record<StepKey, Parameters<typeof onboardingCopy>[1]> = {
  venue: "onboarding.step1.title",
  hours: "onboarding.step2.title",
  defaults: "onboarding.step3.title",
  slug: "onboarding.step4.title",
};

export function StepIndicator({
  current,
  completed,
  onSelect,
}: {
  current: StepKey;
  completed: Record<StepKey, boolean>;
  onSelect: (step: StepKey) => void;
}) {
  const { language } = useI18n();
  const t = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);
  const currentIndex = STEP_KEYS.indexOf(current);

  return (
    <ol
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label={t("onboarding.title")}
    >
      {STEP_KEYS.map((step, index) => {
        const isCurrent = step === current;
        const isDone = completed[step] && !isCurrent;
        const reachable = index <= currentIndex || completed[step];
        return (
          <li key={step}>
            <button
              type="button"
              disabled={!reachable}
              aria-current={isCurrent ? "step" : undefined}
              data-ocid={`onboarding.step.${index + 1}`}
              onClick={() => reachable && onSelect(step)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-smooth",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                  : isDone
                    ? "border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10"
                    : "border-border bg-card text-muted-foreground",
                reachable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : isDone
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-secondary text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 truncate text-xs font-medium sm:text-sm">
                {t(STEP_LABEL[step])}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
