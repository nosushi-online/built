import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Language } from "@/types";

const OPTIONS: { value: Language; labelKey: "language.fr" | "language.en" }[] =
  [
    { value: Language.fr, labelKey: "language.fr" },
    { value: Language.en, labelKey: "language.en" },
  ];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();
  return (
    <fieldset
      aria-label={t("language.label")}
      data-ocid="language.switcher"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = language === option.value;
        return (
          <button
            key={option.value}
            type="button"
            data-ocid={`language.${option.value}`}
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-smooth",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.value.toUpperCase()}
          </button>
        );
      })}
    </fieldset>
  );
}
