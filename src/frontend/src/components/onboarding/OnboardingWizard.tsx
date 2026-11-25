import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DefaultsStep } from "./DefaultsStep";
import { HoursStep } from "./HoursStep";
import { SlugStep } from "./SlugStep";
import { StepIndicator } from "./StepIndicator";
import { VenueStep } from "./VenueStep";
import { onboardingCopy } from "./copy";
import {
  STEP_KEYS,
  type StepKey,
  dayError,
  isValidSlug,
} from "./onboarding-utils";
import {
  type OnboardingDraft,
  isOnboardingComplete,
  resumeStep,
  useOnboarding,
} from "./useOnboarding";

const STEP_TITLE: Record<StepKey, Parameters<typeof onboardingCopy>[1]> = {
  venue: "onboarding.step1.title",
  hours: "onboarding.step2.title",
  defaults: "onboarding.step3.title",
  slug: "onboarding.step4.title",
};

const STEP_BODY: Record<StepKey, Parameters<typeof onboardingCopy>[1]> = {
  venue: "onboarding.step1.body",
  hours: "onboarding.step2.body",
  defaults: "onboarding.step3.body",
  slug: "onboarding.step4.body",
};

export function OnboardingWizard({
  venue,
}: {
  venue: import("@/types").Venue | undefined;
}) {
  const { language } = useI18n();
  const copy = useCallback(
    (
      key: Parameters<typeof onboardingCopy>[1],
      vars?: Record<string, string | number>,
    ) => onboardingCopy(language, key, vars),
    [language],
  );
  const navigate = useNavigate();
  const wizard = useOnboarding(venue);
  const { draft, onboarding } = wizard;

  const [step, setStep] = useState<StepKey>(() =>
    onboarding ? resumeStep(onboarding) : "venue",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const completed = useMemo<Record<StepKey, boolean>>(
    () => ({
      venue: onboarding?.venueTypeDone ?? false,
      hours: onboarding?.hoursDone ?? false,
      defaults: onboarding?.bookingDefaultsDone ?? false,
      slug: onboarding?.slugDone ?? false,
    }),
    [onboarding],
  );

  const doneCount = STEP_KEYS.filter((key) => completed[key]).length;
  const isComplete = onboarding ? isOnboardingComplete(onboarding) : false;
  const stepIndex = STEP_KEYS.indexOf(step);

  const validateVenue = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!draft.venue.name.trim()) next.name = copy("onboarding.required");
    if (!draft.venue.address.trim()) next.address = copy("onboarding.required");
    if (!draft.venue.phone.trim()) next.phone = copy("onboarding.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [draft.venue, copy]);

  const validateHours = useCallback((): boolean => {
    const invalid = draft.week.some((day) => dayError(day) !== null);
    setFormError(invalid ? copy("onboarding.hours.error") : null);
    return !invalid;
  }, [draft.week, copy]);

  const validateSlug = useCallback((): boolean => {
    if (!isValidSlug(draft.slug)) {
      setFormError(copy("onboarding.slug.invalid"));
      return false;
    }
    setFormError(null);
    return true;
  }, [draft.slug, copy]);

  /** Persist the current step, creating the venue on the first step. */
  const persistStep = useCallback(
    async (target: StepKey): Promise<boolean> => {
      setFormError(null);
      try {
        if (target === "venue") {
          if (!validateVenue()) return false;
          if (venue) {
            await wizard.updateVenue.mutateAsync(draft);
            await wizard.saveOnboarding.mutateAsync({ venueTypeDone: true });
          } else {
            await wizard.createVenue.mutateAsync(draft);
          }
          return true;
        }
        if (target === "hours") {
          if (!validateHours()) return false;
          await wizard.setHours.mutateAsync(draft.week);
          await wizard.saveOnboarding.mutateAsync({ hoursDone: true });
          return true;
        }
        if (target === "defaults") {
          await wizard.updateVenue.mutateAsync(draft);
          await wizard.saveOnboarding.mutateAsync({
            bookingDefaultsDone: true,
          });
          return true;
        }
        if (!validateSlug()) return false;
        await wizard.setSlug.mutateAsync(draft.slug);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setFormError(
          message.toLowerCase().includes("slug")
            ? copy("onboarding.error.slugTaken")
            : copy("onboarding.error.save"),
        );
        return false;
      }
    },
    [draft, venue, validateVenue, validateHours, validateSlug, wizard, copy],
  );

  const goNext = async () => {
    const ok = await persistStep(step);
    if (!ok) return;
    if (stepIndex < STEP_KEYS.length - 1) {
      setStep(STEP_KEYS[stepIndex + 1]);
    } else {
      await navigate({ to: "/planning" });
    }
  };

  const saveDraft = async () => {
    const ok = await persistStep(step);
    if (!ok) return;
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 4000);
  };

  const goBack = () => {
    setFormError(null);
    if (stepIndex > 0) setStep(STEP_KEYS[stepIndex - 1]);
  };

  const handleNameChange = (name: string) => {
    wizard.updateVenueField("name", name);
    wizard.syncSlugFromName(name);
  };

  const handleVenueField = <K extends keyof OnboardingDraft["venue"]>(
    key: K,
    value: OnboardingDraft["venue"][K],
  ) => {
    wizard.updateVenueField(key, value);
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  if (isComplete) {
    return (
      <div
        data-ocid="onboarding.success_state"
        className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-subtle animate-fade-up"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
          {copy("onboarding.done")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy("onboarding.doneBody")}
        </p>
        <Button
          type="button"
          className="mt-6"
          data-ocid="onboarding.open_back_office_button"
          onClick={() => void navigate({ to: "/planning" })}
        >
          {copy("onboarding.openBackOffice")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <header className="space-y-2">
        <p className="label-caps">
          {copy("onboarding.step", {
            step: stepIndex + 1,
            total: STEP_KEYS.length,
          })}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {copy("onboarding.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {venue ? copy("onboarding.resumeBody") : copy("onboarding.subtitle")}
        </p>
        {venue && (
          <p
            data-ocid="onboarding.progress"
            className="text-xs font-medium text-primary"
          >
            {copy("onboarding.progress", {
              done: doneCount,
              total: STEP_KEYS.length,
            })}
          </p>
        )}
      </header>

      <StepIndicator
        current={step}
        completed={completed}
        onSelect={(next) => {
          setFormError(null);
          setStep(next);
        }}
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle sm:p-6">
        <div className="mb-5 border-b border-border pb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {copy(STEP_TITLE[step])}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy(STEP_BODY[step])}
          </p>
        </div>

        {step === "venue" && (
          <VenueStep
            draft={draft.venue}
            errors={errors}
            onChange={handleVenueField}
            onNameChange={handleNameChange}
          />
        )}
        {step === "hours" && (
          <HoursStep week={draft.week} onChange={wizard.setWeek} />
        )}
        {step === "defaults" && (
          <DefaultsStep
            venueType={draft.venue.venueType}
            defaults={draft.defaults}
            onChange={wizard.updateDefaults}
          />
        )}
        {step === "slug" && (
          <SlugStep
            slug={draft.slug}
            currentSlug={venue?.publicSlug ?? ""}
            onChange={wizard.setSlugValue}
          />
        )}

        {formError && (
          <p
            role="alert"
            data-ocid="onboarding.form_error"
            className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            {formError}
          </p>
        )}

        {savedNotice && (
          <output
            data-ocid="onboarding.saved_notice"
            className="mt-4 block rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success"
          >
            {copy("onboarding.saved")} — {copy("onboarding.savedBody")}
          </output>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex === 0 || wizard.isSaving}
            data-ocid="onboarding.back_button"
            onClick={goBack}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {copy("onboarding.back")}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              disabled={wizard.isSaving}
              data-ocid="onboarding.save_draft_button"
              onClick={() => void saveDraft()}
            >
              <Save className="size-4" aria-hidden="true" />
              {wizard.isSaving
                ? copy("onboarding.savingDraft")
                : copy("onboarding.saveDraft")}
            </Button>
            <Button
              type="button"
              disabled={wizard.isSaving}
              data-ocid="onboarding.continue_button"
              onClick={() => void goNext()}
              className={cn(wizard.isSaving && "opacity-90")}
            >
              {wizard.isSaving && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {stepIndex === STEP_KEYS.length - 1
                ? copy("onboarding.finish")
                : copy("onboarding.continue")}
              {stepIndex < STEP_KEYS.length - 1 && (
                <ArrowRight className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
