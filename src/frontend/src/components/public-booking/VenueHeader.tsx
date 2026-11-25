import { cn } from "@/lib/utils";
import { MapPin, Phone } from "lucide-react";

/** Venue identity block: logo (or monogram), name, description and contact. */
export function VenueHeader({
  name,
  description,
  address,
  phone,
  logo,
}: {
  name: string;
  description: string;
  address: string;
  phone: string;
  logo?: string;
}) {
  const monogram = name.trim().charAt(0).toUpperCase() || "M";
  return (
    <header
      data-ocid="public.venue.header"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle"
    >
      <div className="h-1.5 w-full bg-gradient-primary" aria-hidden="true" />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="size-16 shrink-0 rounded-xl border border-border object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-2xl font-semibold text-primary-foreground"
          >
            {monogram}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {name}
          </h1>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {address}
              </span>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** A numbered step heading used across the booking flow. */
export function StepHeading({
  step,
  title,
  className,
}: {
  step: number;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums"
      >
        {step}
      </span>
      <h2 className="font-display text-base font-semibold text-foreground">
        {title}
      </h2>
    </div>
  );
}
