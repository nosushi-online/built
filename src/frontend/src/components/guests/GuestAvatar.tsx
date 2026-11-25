import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-primary/10 text-primary",
  "bg-accent/25 text-accent-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-success/15 text-success",
];

/** Deterministic monogram avatar so the same guest keeps the same colour. */
export function GuestAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const seed = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tone = PALETTE[seed % PALETTE.length];
  const sizes = {
    sm: "size-8 text-[11px]",
    md: "size-10 text-xs",
    lg: "size-14 text-base",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
        sizes[size],
        tone,
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
