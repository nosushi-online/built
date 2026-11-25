import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/I18nProvider";
import { VenueType } from "@/types";
import { Clock, Users } from "lucide-react";
import { onboardingCopy } from "./copy";
import type { DefaultsDraft } from "./useOnboarding";

function NumberField({
  id,
  label,
  value,
  min,
  icon,
  onChange,
  ocid,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  icon: React.ReactNode;
  onChange: (value: string) => void;
  ocid: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={value}
          data-ocid={ocid}
          className="pl-9 tabular-nums"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function DefaultsStep({
  venueType,
  defaults,
  onChange,
}: {
  venueType: VenueType;
  defaults: DefaultsDraft;
  onChange: <K extends keyof DefaultsDraft>(
    key: K,
    value: DefaultsDraft[K],
  ) => void;
}) {
  const { language } = useI18n();
  const copy = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);
  const isSpa = venueType === VenueType.spa;

  return (
    <div className="space-y-5">
      {isSpa ? (
        <NumberField
          id="default-buffer"
          label={copy("onboarding.field.buffer")}
          value={defaults.buffer}
          min={0}
          icon={<Clock className="size-4" aria-hidden="true" />}
          ocid="onboarding.buffer_input"
          onChange={(value) => onChange("buffer", value)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="default-duration"
            label={copy("onboarding.field.duration")}
            value={defaults.duration}
            min={15}
            icon={<Clock className="size-4" aria-hidden="true" />}
            ocid="onboarding.duration_input"
            onChange={(value) => onChange("duration", value)}
          />
          <NumberField
            id="default-party"
            label={copy("onboarding.field.partySize")}
            value={defaults.partySize}
            min={1}
            icon={<Users className="size-4" aria-hidden="true" />}
            ocid="onboarding.party_size_input"
            onChange={(value) => onChange("partySize", value)}
          />
        </div>
      )}

      <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
        {copy("onboarding.step3.body")}
      </div>
    </div>
  );
}
