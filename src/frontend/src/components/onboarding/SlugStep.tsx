import { createActor } from "@/backend";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Globe, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { onboardingCopy } from "./copy";
import { isValidSlug, slugify } from "./onboarding-utils";

type SlugStatus = "idle" | "invalid" | "checking" | "available" | "taken";

/**
 * Live slug availability. The check is debounced and only runs for a
 * syntactically valid slug, so the message never flickers on partial input.
 */
export function SlugStep({
  slug,
  currentSlug,
  onChange,
}: {
  slug: string;
  currentSlug: string;
  onChange: (value: string) => void;
}) {
  const { language } = useI18n();
  const copy = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);
  const { actor, isFetching } = useActor(createActor);
  const [debounced, setDebounced] = useState(slug);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(slug), 350);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const valid = isValidSlug(debounced);
  const unchanged = debounced === currentSlug;

  const availability = useQuery({
    queryKey: ["slug-available", debounced],
    queryFn: async (): Promise<boolean> => {
      if (!actor) return false;
      return actor.isSlugAvailable(debounced);
    },
    enabled: !!actor && !isFetching && valid && !unchanged,
    staleTime: 10_000,
  });

  let status: SlugStatus = "idle";
  if (slug.length > 0 && !isValidSlug(slug)) status = "invalid";
  else if (unchanged && slug.length > 0) status = "available";
  else if (valid && availability.isFetching) status = "checking";
  else if (valid && availability.data === true) status = "available";
  else if (valid && availability.data === false) status = "taken";

  const message: Record<SlugStatus, string | null> = {
    idle: null,
    invalid: copy("onboarding.slug.invalid"),
    checking: copy("onboarding.slug.checking"),
    available: copy("onboarding.slug.available"),
    taken: copy("onboarding.slug.taken"),
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="venue-slug">{copy("onboarding.field.slug")}</Label>
        <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <span className="flex items-center gap-1.5 border-r border-input bg-secondary px-3 text-xs text-muted-foreground">
            <Globe className="size-3.5" aria-hidden="true" />
            maison.app/site/
          </span>
          <Input
            id="venue-slug"
            value={slug}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={status === "invalid" || status === "taken"}
            aria-describedby="venue-slug-status"
            data-ocid="onboarding.slug_input"
            className="rounded-none border-0 font-mono shadow-none focus-visible:ring-0"
            onChange={(event) => onChange(slugify(event.target.value))}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {copy("onboarding.field.slugHint")}
        </p>
      </div>

      <div
        id="venue-slug-status"
        aria-live="polite"
        data-ocid="onboarding.slug_status"
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          status === "available" && "bg-success/10 text-success",
          status === "taken" && "bg-destructive/10 text-destructive",
          status === "invalid" && "bg-destructive/10 text-destructive",
          (status === "checking" || status === "idle") &&
            "bg-muted text-muted-foreground",
        )}
      >
        {status === "checking" && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        {status === "available" && (
          <Check className="size-4" aria-hidden="true" />
        )}
        {(status === "taken" || status === "invalid") && (
          <AlertCircle className="size-4" aria-hidden="true" />
        )}
        <span>
          {message[status] ??
            (currentSlug
              ? `${copy("onboarding.slug.current")} : ${currentSlug}`
              : copy("onboarding.field.slugHint"))}
        </span>
      </div>
    </div>
  );
}
