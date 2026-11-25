import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Guest, GuestId } from "@/types";
import { useMemo, useState } from "react";
import { GuestAvatar } from "./GuestAvatar";
import { useGuestText } from "./guestText";

function GuestOption({ guest }: { guest: Guest }) {
  return (
    <span className="flex items-center gap-2">
      <GuestAvatar name={guest.name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-medium">{guest.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {guest.phone}
        </span>
      </span>
    </span>
  );
}

/**
 * Merge two duplicate guests. The list screen passes both ids; the profile
 * screen passes only `keepId` and lets staff search for the duplicate.
 */
export function MergeGuestsDialog({
  open,
  onOpenChange,
  guests,
  keepId,
  mergeId,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  keepId?: GuestId;
  mergeId?: GuestId;
  pending: boolean;
  onSubmit: (keepId: GuestId, mergeId: GuestId) => void;
}) {
  const t = useGuestText();
  const [keep, setKeep] = useState<string>(keepId?.toString() ?? "");
  const [merge, setMerge] = useState<string>(mergeId?.toString() ?? "");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lockedKeep = keepId !== undefined;

  const candidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guests.filter((guest) => {
      if (guest.id.toString() === keep) return false;
      if (query === "") return true;
      return (
        guest.name.toLowerCase().includes(query) || guest.phone.includes(query)
      );
    });
  }, [guests, keep, search]);

  const handleSubmit = () => {
    if (keep === "" || merge === "") {
      setError(t("guests.merge.needTwo"));
      return;
    }
    if (keep === merge) {
      setError(t("guests.merge.same"));
      return;
    }
    setError(null);
    onSubmit(BigInt(keep), BigInt(merge));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="guests.merge.dialog"
        className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t("guests.merge.title")}
          </DialogTitle>
          <DialogDescription>{t("guests.merge.body")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("guests.merge.keep")}</Label>
            {lockedKeep ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <GuestOption
                  guest={
                    guests.find((g) => g.id.toString() === keep) ?? guests[0]
                  }
                />
              </div>
            ) : (
              <Select value={keep} onValueChange={setKeep}>
                <SelectTrigger data-ocid="guests.merge.keep_select">
                  <SelectValue placeholder={t("guests.merge.keep")} />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((guest) => (
                    <SelectItem
                      key={guest.id.toString()}
                      value={guest.id.toString()}
                    >
                      {guest.name} · {guest.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("guests.merge.merge")}</Label>
            {mergeId !== undefined ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <GuestOption
                  guest={
                    guests.find((g) => g.id.toString() === merge) ?? guests[0]
                  }
                />
              </div>
            ) : (
              <>
                <Input
                  data-ocid="guests.merge.search_input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("guests.detail.mergeSearch")}
                />
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {candidates.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      {t("guests.detail.mergeNoMatch")}
                    </p>
                  ) : (
                    candidates.map((guest) => {
                      const active = merge === guest.id.toString();
                      return (
                        <button
                          key={guest.id.toString()}
                          type="button"
                          data-ocid="guests.merge.candidate"
                          onClick={() => setMerge(guest.id.toString())}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition-smooth hover:bg-secondary",
                            active && "bg-secondary",
                          )}
                        >
                          <GuestOption guest={guest} />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              active ? "text-primary" : "text-muted-foreground",
                            )}
                          >
                            {active
                              ? t("guests.merge.selected")
                              : t("guests.merge.select")}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {error && (
            <p
              data-ocid="guests.merge.error"
              className="text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="guests.merge.cancel_button"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            data-ocid="guests.merge.confirm_button"
            disabled={pending}
            onClick={handleSubmit}
          >
            {t("guests.merge.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
