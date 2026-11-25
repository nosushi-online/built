import { SignInButton } from "@/components/InternetIdentity";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Sparkles, UtensilsCrossed } from "lucide-react";

const HIGHLIGHTS = [
  { icon: CalendarCheck, key: "nav.planning" },
  { icon: UtensilsCrossed, key: "nav.floor" },
  { icon: Sparkles, key: "nav.guests" },
] as const;

export function SignInPage() {
  const { t } = useI18n();
  const { login, isLoggingIn, isInitializing, isLoginError } =
    useInternetIdentity();
  const queryClient = useQueryClient();

  const busy = isInitializing || isLoggingIn;

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <UtensilsCrossed className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </div>

        <div className="max-w-md">
          <p className="label-caps text-sidebar-foreground/50">
            {t("app.tagline")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight">
            {t("auth.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/70">
            {t("auth.description")}
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} {t("app.name")}
        </p>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground lg:hidden">
            {t("app.name")}
          </span>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div
            data-ocid="auth.panel"
            className="w-full max-w-sm animate-fade-up"
          >
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t("auth.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.description")}
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                data-ocid="auth.google_button"
                disabled={busy}
                onClick={() => {
                  void queryClient.cancelQueries();
                  login({ provider: "google" });
                }}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-medium text-foreground transition-smooth hover:bg-secondary disabled:opacity-60"
              >
                <GoogleMark />
                {t("auth.google")}
              </button>

              <SignInButton className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 disabled:opacity-60" />

              {isLoginError && (
                <p
                  role="alert"
                  data-ocid="auth.error_state"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {t("auth.error")}
                </p>
              )}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              {t("app.tagline")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
