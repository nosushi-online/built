import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { onboardingCopy } from "@/components/onboarding/copy";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { useCurrentVenue } from "@/hooks/useQueries";
import { useI18n } from "@/i18n/I18nProvider";
import { Building2 } from "lucide-react";

/**
 * The onboarding route hosts the four-step venue setup wizard. A venue that
 * already exists resumes at its first unfinished step; a user with no venue
 * starts from step one and the venue is created when step one is saved.
 */
export function OnboardingPage() {
  const { language } = useI18n();
  const copy = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);
  const { venue, isLoading, isError, refetch } = useCurrentVenue();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-4">
        <ErrorState
          message={copy("onboarding.error.load")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return <OnboardingWizard venue={venue} />;
}

export function NoVenuePage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg py-16 text-center animate-fade-up">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Building2 className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground">
        {t("empty.venue.title")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("empty.venue.body")}
      </p>
      <a
        href="/onboarding"
        data-ocid="venue.onboard_button"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90"
      >
        {t("empty.venue.action")}
      </a>
    </div>
  );
}
