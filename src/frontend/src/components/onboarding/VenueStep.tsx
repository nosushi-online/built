import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { VenueType } from "@/types";
import { Building2, Sparkles } from "lucide-react";
import { LogoUploader } from "./LogoUploader";
import { onboardingCopy } from "./copy";
import { TIMEZONES } from "./onboarding-utils";
import type { VenueDraft } from "./useOnboarding";

const TYPE_OPTIONS = [
  {
    value: VenueType.restaurant,
    labelKey: "venue.type.restaurant" as const,
    icon: Building2,
  },
  {
    value: VenueType.spa,
    labelKey: "venue.type.spa" as const,
    icon: Sparkles,
  },
];

export function VenueStep({
  draft,
  errors,
  onChange,
  onNameChange,
}: {
  draft: VenueDraft;
  errors: Record<string, string>;
  onChange: <K extends keyof VenueDraft>(key: K, value: VenueDraft[K]) => void;
  onNameChange: (name: string) => void;
}) {
  const { t, language } = useI18n();
  const copy = (key: Parameters<typeof onboardingCopy>[1]) =>
    onboardingCopy(language, key);

  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          {copy("onboarding.field.type")}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = draft.venueType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                data-ocid={`onboarding.type.${option.value}`}
                onClick={() => onChange("venueType", option.value)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-smooth",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {t(option.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="venue-name">{copy("onboarding.field.name")}</Label>
        <Input
          id="venue-name"
          value={draft.name}
          placeholder={copy("onboarding.field.namePlaceholder")}
          aria-invalid={!!errors.name}
          data-ocid="onboarding.name_input"
          onChange={(event) => onNameChange(event.target.value)}
        />
        {errors.name && (
          <p
            role="alert"
            data-ocid="onboarding.name_error"
            className="text-xs font-medium text-destructive"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue-address">
            {copy("onboarding.field.address")}
          </Label>
          <Input
            id="venue-address"
            value={draft.address}
            placeholder={copy("onboarding.field.addressPlaceholder")}
            aria-invalid={!!errors.address}
            data-ocid="onboarding.address_input"
            onChange={(event) => onChange("address", event.target.value)}
          />
          {errors.address && (
            <p
              role="alert"
              data-ocid="onboarding.address_error"
              className="text-xs font-medium text-destructive"
            >
              {errors.address}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue-phone">{copy("onboarding.field.phone")}</Label>
          <Input
            id="venue-phone"
            type="tel"
            value={draft.phone}
            placeholder={copy("onboarding.field.phonePlaceholder")}
            aria-invalid={!!errors.phone}
            data-ocid="onboarding.phone_input"
            onChange={(event) => onChange("phone", event.target.value)}
          />
          {errors.phone && (
            <p
              role="alert"
              data-ocid="onboarding.phone_error"
              className="text-xs font-medium text-destructive"
            >
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue-timezone">
          {copy("onboarding.field.timezone")}
        </Label>
        <Select
          value={draft.timezone}
          onValueChange={(value) => onChange("timezone", value)}
        >
          <SelectTrigger
            id="venue-timezone"
            className="w-full"
            data-ocid="onboarding.timezone_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <LogoUploader
        value={draft.logo}
        onChange={(url) => onChange("logo", url)}
      />
    </div>
  );
}
