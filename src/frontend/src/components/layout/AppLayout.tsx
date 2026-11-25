import { SignInButton } from "@/components/InternetIdentity";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useVenue } from "@/hooks/useVenue";
import { useI18n } from "@/i18n/I18nProvider";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { navForVenue } from "@/lib/vertical";
import { TeamRole } from "@/types";
import { Link, Outlet } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { SidebarBrand, SidebarNav } from "./SidebarNav";
import { VenueSwitcher } from "./VenueSwitcher";

function Attribution() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p>
          © {year} {t("app.name")}. {t("footer.rights")}
        </p>
        <p>
          {t("footer.builtWith")}{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}

export function AppLayout() {
  const { t } = useI18n();
  const { memberships, activeVenueId, setActiveVenueId, active } = useVenue();
  const [mobileOpen, setMobileOpen] = useState(false);

  const venue = active?.venue;
  const role = active?.role ?? TeamRole.staff;
  const items = venue ? navForVenue(venue.venueType, role) : [];

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
        <SidebarBrand className="px-2" />
        <div className="mt-8 flex-1">
          {venue && (
            <SidebarNav items={items} venueType={venue.venueType} role={role} />
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3 py-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {initials(active?.venue.name ?? "M")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {active?.venue.name}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">
              {t(`role.${role}` as never)}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("nav.openMenu")}
                data-ocid="nav.menu_button"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-sidebar-border bg-sidebar p-4"
            >
              <SheetTitle className="sr-only">{t("app.name")}</SheetTitle>
              <SidebarBrand />
              <div className="mt-8">
                {venue && (
                  <SidebarNav
                    items={items}
                    venueType={venue.venueType}
                    role={role}
                    onNavigate={() => setMobileOpen(false)}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <VenueSwitcher
              memberships={memberships}
              activeVenueId={activeVenueId}
              onSelect={setActiveVenueId}
            />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <SignInButton
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-smooth hover:bg-secondary",
              )}
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>

        <Attribution />
      </div>
    </div>
  );
}

export function PublicLayout() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Link
            to="/"
            data-ocid="nav.brand"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            {t("app.name")}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
      <Attribution />
    </div>
  );
}
