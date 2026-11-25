import { AppLayout, PublicLayout } from "@/components/layout/AppLayout";
import { useCurrentVenue } from "@/hooks/useQueries";
import { VenueProvider } from "@/hooks/useVenue";
import { I18nProvider } from "@/i18n/I18nProvider";
import { NoVenuePage, OnboardingPage } from "@/pages/OnboardingPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ManageBookingPage, PublicBookingPage } from "@/pages/PublicPages";
import { SignInPage } from "@/pages/SignInPage";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <I18nProvider>
      <Outlet />
    </I18nProvider>
  ),
});

/**
 * Signed-out visitors always land on the sign-in screen. The identity context
 * is read through the provider's hook inside a component-level guard so the
 * redirect re-evaluates when the session changes.
 */
function SessionGate() {
  const { identity, isInitializing, isLoggingIn } = useInternetIdentity();
  const authenticated = !!identity && !identity.getPrincipal().isAnonymous();

  if (isInitializing || isLoggingIn) {
    return (
      <div
        data-ocid="auth.loading_state"
        className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground"
      >
        Ouverture de votre session…
      </div>
    );
  }

  if (!authenticated) {
    return <SignInPage />;
  }

  return <SignedInShell />;
}

/** Signed-in shell: resolves the venue, then routes onboarding vs back office. */
function SignedInShell() {
  const { memberships, isLoading, isError, refetch } = useCurrentVenue();

  if (isLoading) {
    return (
      <div
        data-ocid="shell.loading_state"
        className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground"
      >
        Chargement…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-sm text-foreground">Une erreur est survenue.</p>
        <button
          type="button"
          data-ocid="shell.retry_button"
          onClick={() => void refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (memberships.length === 0) {
    return <NoVenuePage />;
  }

  return (
    <VenueProvider memberships={memberships}>
      <AppLayout />
    </VenueProvider>
  );
}

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: SessionGate,
});

const indexRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/planning" });
  },
});

const onboardingRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const planningRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/planning",
  component: () => (
    <PlaceholderPage
      titleKey="page.planning.title"
      subtitleKey="page.planning.subtitle"
    />
  ),
});

const floorRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/floor",
  component: () => (
    <PlaceholderPage
      titleKey="page.floor.title"
      subtitleKey="page.floor.subtitle"
    />
  ),
});

const floorEditorRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/floor/editor",
  component: () => (
    <PlaceholderPage
      titleKey="page.floorEditor.title"
      subtitleKey="page.floorEditor.subtitle"
    />
  ),
});

const guestsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/guests",
  component: () => (
    <PlaceholderPage
      titleKey="page.guests.title"
      subtitleKey="page.guests.subtitle"
    />
  ),
});

const guestDetailRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/guests/$guestId",
  component: () => (
    <PlaceholderPage
      titleKey="page.guestDetail.title"
      subtitleKey="page.guestDetail.subtitle"
    />
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: () => (
    <PlaceholderPage
      titleKey="page.settings.title"
      subtitleKey="page.settings.subtitle"
    />
  ),
});

/** Public routes render outside the signed-in shell. */
const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicLayout,
});

const publicBookingRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/site/$slug/reserver",
  component: PublicBookingPageWrapper,
});

function PublicBookingPageWrapper() {
  const { slug } = publicBookingRoute.useParams();
  return <PublicBookingPage slug={slug} />;
}

const manageBookingRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/booking/$cancel_token",
  component: ManageBookingPageWrapper,
});

function ManageBookingPageWrapper() {
  const { cancel_token } = manageBookingRoute.useParams();
  return <ManageBookingPage cancelToken={cancel_token} />;
}

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    indexRoute,
    onboardingRoute,
    planningRoute,
    floorRoute,
    floorEditorRoute,
    guestsRoute,
    guestDetailRoute,
    settingsRoute,
  ]),
  publicRoute.addChildren([publicBookingRoute, manageBookingRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
