import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Guest, Timestamp } from "@/types";
import { guestTags } from "./guestTags";
import { useGuestText } from "./guestText";

const TONE_CLASS: Record<string, string> = {
  auto: "border-transparent bg-secondary text-secondary-foreground",
  warn: "border-transparent bg-warning/20 text-warning-foreground",
  danger: "border-transparent bg-destructive/12 text-destructive",
  vip: "border-transparent bg-accent text-accent-foreground",
  allergy: "border-transparent bg-destructive/10 text-destructive",
};

/** Renders the derived + manual tags for a guest as compact chips. */
export function GuestTagList({
  guest,
  now,
  max,
  className,
}: {
  guest: Guest;
  now: Timestamp;
  max?: number;
  className?: string;
}) {
  const t = useGuestText();
  const tags = guestTags(guest, now);
  const shown = max ? tags.slice(0, max) : tags;
  const overflow = max ? tags.length - shown.length : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {shown.map((tag) => (
        <Badge
          key={tag.key}
          variant="outline"
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px]",
            TONE_CLASS[tag.tone],
          )}
          title={tag.automatic ? t("guests.tag.auto") : t("guests.tag.manual")}
        >
          {tag.labelKey === "guests.tag.manual"
            ? tag.key.replace("manual-", "")
            : t(tag.labelKey)}
        </Badge>
      ))}
      {overflow > 0 && (
        <span className="text-[11px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
