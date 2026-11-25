import { createActor } from "@/backend";
import type { BookingDefaults, OnboardingState, Venue } from "@/types";
import { Language, VenueType } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TIMEZONE,
  type DayDraft,
  type StepKey,
  defaultBookingValues,
  defaultWeek,
  isValidSlug,
  parsePositive,
  slugify,
  weekFromBackend,
  weekToBackend,
} from "./onboarding-utils";

export interface VenueDraft {
  venueType: VenueType;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  logo: string | undefined;
}

export interface DefaultsDraft {
  duration: string;
  partySize: string;
  buffer: string;
}

export interface OnboardingDraft {
  venue: VenueDraft;
  week: DayDraft[];
  defaults: DefaultsDraft;
  slug: string;
}

const EMPTY_VENUE: VenueDraft = {
  venueType: VenueType.restaurant,
  name: "",
  address: "",
  phone: "",
  timezone: DEFAULT_TIMEZONE,
  logo: undefined,
};

function draftFromVenue(venue: Venue): OnboardingDraft {
  return {
    venue: {
      venueType: venue.venueType,
      name: venue.name,
      address: venue.address,
      phone: venue.phone,
      timezone: venue.timezone || DEFAULT_TIMEZONE,
      logo: venue.logo || undefined,
    },
    week:
      venue.openingHours.length > 0
        ? weekFromBackend(venue.openingHours)
        : defaultWeek(),
    defaults: {
      duration: String(venue.bookingDefaults.defaultTableDurationMinutes),
      partySize: String(venue.bookingDefaults.maxOnlinePartySize),
      buffer: String(venue.bookingDefaults.spaDefaultBufferMinutes),
    },
    slug: venue.publicSlug,
  };
}

function bookingDefaultsFrom(draft: DefaultsDraft): BookingDefaults {
  return {
    defaultTableDurationMinutes: BigInt(parsePositive(draft.duration, 90)),
    maxOnlinePartySize: BigInt(parsePositive(draft.partySize, 8)),
    spaDefaultBufferMinutes: BigInt(
      Math.max(0, Number.parseInt(draft.buffer, 10) || 0),
    ),
  };
}

/** Which step a saved venue should resume at, based on its onboarding flags. */
export function resumeStep(onboarding: OnboardingState): StepKey {
  if (!onboarding.venueTypeDone) return "venue";
  if (!onboarding.hoursDone) return "hours";
  if (!onboarding.bookingDefaultsDone) return "defaults";
  return "slug";
}

export function isOnboardingComplete(onboarding: OnboardingState): boolean {
  return (
    onboarding.venueTypeDone &&
    onboarding.hoursDone &&
    onboarding.bookingDefaultsDone &&
    onboarding.slugDone
  );
}

/**
 * Owns the wizard draft and every backend call. The draft is local UI state;
 * the backend is written step by step so a partially completed venue can be
 * resumed later.
 */
export function useOnboarding(venue: Venue | undefined) {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<OnboardingDraft>(() =>
    venue
      ? draftFromVenue(venue)
      : {
          venue: { ...EMPTY_VENUE },
          week: defaultWeek(),
          defaults: defaultBookingValues(VenueType.restaurant),
          slug: "",
        },
  );
  const [slugTouched, setSlugTouched] = useState(false);

  // Re-seed the draft once the venue arrives (new venue created elsewhere).
  useEffect(() => {
    if (venue) setDraft(draftFromVenue(venue));
  }, [venue]);

  const onboardingQuery = useQuery({
    queryKey: ["onboarding", venue?.id.toString() ?? "none"],
    queryFn: async (): Promise<OnboardingState | null> => {
      if (!actor || !venue) return null;
      return actor.getOnboarding(venue.id);
    },
    enabled: !!actor && !isFetching && !!venue,
  });

  const invalidateVenues = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["venues"] });
    void queryClient.invalidateQueries({ queryKey: ["onboarding"] });
  }, [queryClient]);

  const createVenue = useMutation({
    mutationFn: async (input: OnboardingDraft): Promise<Venue> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createVenue({
        venueType: input.venue.venueType,
        name: input.venue.name.trim(),
        address: input.venue.address.trim(),
        phone: input.venue.phone.trim(),
        timezone: input.venue.timezone,
        logo: input.venue.logo,
        publicSlug: input.slug,
        bookingDefaults: bookingDefaultsFrom(input.defaults),
        texts: [
          {
            name: input.venue.name.trim(),
            description: "",
            language: Language.fr,
          },
        ],
      });
    },
    onSuccess: () => invalidateVenues(),
  });

  const updateVenue = useMutation({
    mutationFn: async (input: OnboardingDraft): Promise<Venue> => {
      if (!actor || !venue) throw new Error("Backend is not ready");
      return actor.updateVenue(venue.id, {
        venueType: input.venue.venueType,
        name: input.venue.name.trim(),
        address: input.venue.address.trim(),
        phone: input.venue.phone.trim(),
        timezone: input.venue.timezone,
        logo: input.venue.logo ?? "",
        bookingDefaults: bookingDefaultsFrom(input.defaults),
      });
    },
    onSuccess: () => invalidateVenues(),
  });

  const setHours = useMutation({
    mutationFn: async (week: DayDraft[]) => {
      if (!actor || !venue) throw new Error("Backend is not ready");
      return actor.setOpeningHours(venue.id, weekToBackend(week));
    },
    onSuccess: () => invalidateVenues(),
  });

  const setSlug = useMutation({
    mutationFn: async (slug: string) => {
      if (!actor || !venue) throw new Error("Backend is not ready");
      return actor.setSlug(venue.id, slug);
    },
    onSuccess: () => invalidateVenues(),
  });

  const saveOnboarding = useMutation({
    mutationFn: async (patch: {
      venueTypeDone?: boolean;
      hoursDone?: boolean;
      bookingDefaultsDone?: boolean;
      slugDone?: boolean;
    }) => {
      if (!actor || !venue) throw new Error("Backend is not ready");
      return actor.saveOnboarding(venue.id, patch);
    },
    onSuccess: () => invalidateVenues(),
  });

  const update = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const updateVenueField = useCallback(
    <K extends keyof VenueDraft>(key: K, value: VenueDraft[K]) => {
      setDraft((current) => ({
        ...current,
        venue: { ...current.venue, [key]: value },
      }));
    },
    [],
  );

  const updateDefaults = useCallback(
    <K extends keyof DefaultsDraft>(key: K, value: DefaultsDraft[K]) => {
      setDraft((current) => ({
        ...current,
        defaults: { ...current.defaults, [key]: value },
      }));
    },
    [],
  );

  const setSlugValue = useCallback((value: string) => {
    setSlugTouched(true);
    setDraft((current) => ({ ...current, slug: value }));
  }, []);

  /** Keep the slug in sync with the name until the user edits it directly. */
  const syncSlugFromName = useCallback(
    (name: string) => {
      if (slugTouched) return;
      setDraft((current) => ({ ...current, slug: slugify(name) }));
    },
    [slugTouched],
  );

  const setWeek = useCallback((week: DayDraft[]) => {
    setDraft((current) => ({ ...current, week }));
  }, []);

  const isSaving =
    createVenue.isPending ||
    updateVenue.isPending ||
    setHours.isPending ||
    setSlug.isPending ||
    saveOnboarding.isPending;

  const onboarding = onboardingQuery.data ?? venue?.onboarding;

  return useMemo(
    () => ({
      draft,
      onboarding,
      isSaving,
      isLoading: onboardingQuery.isLoading,
      update,
      updateVenueField,
      updateDefaults,
      setSlugValue,
      syncSlugFromName,
      setWeek,
      createVenue,
      updateVenue,
      setHours,
      setSlug,
      saveOnboarding,
      slugIsValid: isValidSlug(draft.slug),
    }),
    [
      draft,
      onboarding,
      isSaving,
      onboardingQuery.isLoading,
      update,
      updateVenueField,
      updateDefaults,
      setSlugValue,
      syncSlugFromName,
      setWeek,
      createVenue,
      updateVenue,
      setHours,
      setSlug,
      saveOnboarding,
    ],
  );
}
