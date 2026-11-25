import type { GuestInput } from "@/backend";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Guest } from "@/types";
import { useEffect, useState } from "react";
import { useGuestText } from "./guestText";

interface Draft {
  name: string;
  phone: string;
  email: string;
  tags: string;
  allergies: string;
  preferences: string;
  notes: string;
  vip: boolean;
  marketingOptIn: boolean;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  phone: "",
  email: "",
  tags: "",
  allergies: "",
  preferences: "",
  notes: "",
  vip: false,
  marketingOptIn: false,
};

function draftFromGuest(guest: Guest): Draft {
  return {
    name: guest.name,
    phone: guest.phone,
    email: guest.email ?? "",
    tags: guest.tags.join(", "),
    allergies: guest.allergies ?? "",
    preferences: guest.preferences ?? "",
    notes: guest.notes ?? "",
    vip: guest.vip,
    marketingOptIn: guest.marketingOptIn,
  };
}

const E164 = /^\+[1-9]\d{6,14}$/;

function toInput(draft: Draft): GuestInput {
  const optional = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };
  return {
    name: draft.name.trim(),
    phone: draft.phone.replace(/[\s.-]/g, ""),
    email: optional(draft.email),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    allergies: optional(draft.allergies),
    preferences: optional(draft.preferences),
    notes: optional(draft.notes),
    vip: draft.vip,
    marketingOptIn: draft.marketingOptIn,
  };
}

/**
 * Create/edit dialog for a guest. The draft is owned locally; the parent owns
 * the mutation so the same form serves the list and the profile.
 */
export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: Guest;
  pending: boolean;
  onSubmit: (input: GuestInput) => void;
}) {
  const t = useGuestText();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(guest ? draftFromGuest(guest) : EMPTY_DRAFT);
    setError(null);
  }, [open, guest]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = toInput(draft);
    if (input.name === "" || input.phone === "") {
      setError(t("guests.form.required"));
      return;
    }
    if (!E164.test(input.phone)) {
      setError(t("guests.form.phoneInvalid"));
      return;
    }
    setError(null);
    onSubmit(input);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="guests.form.dialog"
        className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {guest ? t("guests.form.editTitle") : t("guests.form.newTitle")}
          </DialogTitle>
          <DialogDescription>{t("guests.form.optInHint")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="guest-name">{t("guests.form.name")}</Label>
              <Input
                id="guest-name"
                data-ocid="guests.form.name_input"
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-phone">{t("guests.form.phone")}</Label>
              <Input
                id="guest-phone"
                data-ocid="guests.form.phone_input"
                value={draft.phone}
                onChange={(event) => set("phone", event.target.value)}
                inputMode="tel"
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("guests.form.phoneHint")}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-email">{t("guests.form.email")}</Label>
            <Input
              id="guest-email"
              data-ocid="guests.form.email_input"
              type="email"
              value={draft.email}
              onChange={(event) => set("email", event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-tags">{t("guests.form.tags")}</Label>
            <Input
              id="guest-tags"
              data-ocid="guests.form.tags_input"
              value={draft.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="Terrasse, Anniversaire"
            />
            <p className="text-xs text-muted-foreground">
              {t("guests.form.tagsHint")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="guest-allergies">
                {t("guests.form.allergies")}
              </Label>
              <Textarea
                id="guest-allergies"
                data-ocid="guests.form.allergies_input"
                value={draft.allergies}
                onChange={(event) => set("allergies", event.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest-preferences">
                {t("guests.form.preferences")}
              </Label>
              <Textarea
                id="guest-preferences"
                data-ocid="guests.form.preferences_input"
                value={draft.preferences}
                onChange={(event) => set("preferences", event.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-notes">{t("guests.form.notes")}</Label>
            <Textarea
              id="guest-notes"
              data-ocid="guests.form.notes_input"
              value={draft.notes}
              onChange={(event) => set("notes", event.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
            <label
              htmlFor="guest-vip"
              className="flex cursor-pointer items-center gap-2.5 text-sm font-medium"
            >
              <Checkbox
                id="guest-vip"
                data-ocid="guests.form.vip_checkbox"
                checked={draft.vip}
                onCheckedChange={(checked) => set("vip", checked === true)}
              />
              {t("guests.form.vip")}
            </label>
            <label
              htmlFor="guest-optin"
              className="flex cursor-pointer items-start gap-2.5 text-sm"
            >
              <Checkbox
                id="guest-optin"
                data-ocid="guests.form.optin_checkbox"
                className="mt-0.5"
                checked={draft.marketingOptIn}
                onCheckedChange={(checked) =>
                  set("marketingOptIn", checked === true)
                }
              />
              <span>
                <span className="font-medium">{t("guests.form.optIn")}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("guests.form.optInHint")}
                </span>
              </span>
            </label>
          </div>

          {error && (
            <p
              data-ocid="guests.form.error"
              className="text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="guests.form.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              data-ocid="guests.form.submit_button"
              disabled={pending}
            >
              {guest ? t("guests.form.save") : t("guests.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
