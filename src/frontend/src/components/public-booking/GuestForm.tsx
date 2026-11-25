import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { isE164 } from "./booking-utils";

export interface GuestDetails {
  name: string;
  phone: string;
  email: string;
  notes: string;
  marketingOptIn: boolean;
  honeypot: string;
}

export const EMPTY_DETAILS: GuestDetails = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  marketingOptIn: false,
  honeypot: "",
};

/** Guest detail fields, including the separate marketing opt-in and honeypot. */
export function GuestForm({
  value,
  onChange,
  errors,
}: {
  value: GuestDetails;
  onChange: (next: GuestDetails) => void;
  errors: Partial<Record<keyof GuestDetails, string>>;
}) {
  const { t } = useI18n();
  const set = <K extends keyof GuestDetails>(key: K, next: GuestDetails[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name">{t("booking.form.name")}</Label>
          <Input
            id="guest-name"
            data-ocid="booking.name_input"
            autoComplete="name"
            value={value.name}
            aria-invalid={!!errors.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={t("booking.form.namePlaceholder")}
          />
          {errors.name && (
            <p
              data-ocid="booking.name_error"
              className="text-xs text-destructive"
            >
              {errors.name}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-phone">{t("booking.form.phone")}</Label>
          <Input
            id="guest-phone"
            data-ocid="booking.phone_input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value.phone}
            aria-invalid={!!errors.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
          {errors.phone ? (
            <p
              data-ocid="booking.phone_error"
              className="text-xs text-destructive"
            >
              {errors.phone}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("booking.form.phoneHint")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-email">{t("booking.form.email")}</Label>
        <Input
          id="guest-email"
          data-ocid="booking.email_input"
          type="email"
          autoComplete="email"
          value={value.email}
          aria-invalid={!!errors.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="prenom@exemple.fr"
        />
        {errors.email && (
          <p
            data-ocid="booking.email_error"
            className="text-xs text-destructive"
          >
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-notes">{t("booking.form.notes")}</Label>
        <Textarea
          id="guest-notes"
          data-ocid="booking.notes_input"
          rows={2}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t("booking.form.notesPlaceholder")}
        />
      </div>

      <label
        htmlFor="guest-marketing"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5 transition-smooth hover:bg-muted/60",
        )}
      >
        <Checkbox
          id="guest-marketing"
          data-ocid="booking.marketing_checkbox"
          checked={value.marketingOptIn}
          onCheckedChange={(checked) => set("marketingOptIn", checked === true)}
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {t("booking.form.marketing")}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("booking.form.marketingHint")}
          </span>
        </span>
      </label>

      {/* Honeypot: hidden from people, filled by bots. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="guest-website">{t("booking.form.website")}</label>
        <input
          id="guest-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-ocid="booking.honeypot_input"
          value={value.honeypot}
          onChange={(e) => set("honeypot", e.target.value)}
        />
      </div>
    </div>
  );
}

/** Validate the guest details; returns field errors keyed by field. */
export function validateDetails(
  value: GuestDetails,
  t: (key: import("@/i18n/dictionaries").TranslationKey) => string,
): Partial<Record<keyof GuestDetails, string>> {
  const errors: Partial<Record<keyof GuestDetails, string>> = {};
  if (value.name.trim().length < 2) errors.name = t("booking.error.name");
  if (!isE164(value.phone)) errors.phone = t("booking.error.phone");
  if (
    value.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
  ) {
    errors.email = t("booking.error.email");
  }
  return errors;
}
