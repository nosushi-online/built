import type { Language } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  DICTIONARIES,
  LANGUAGES,
  type TranslationKey,
} from "./dictionaries";

const STORAGE_KEY = "maison.language";

interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGES.includes(stored as Language)
    ? (stored as Language)
    : DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template =
        DICTIONARIES[language][key] ?? DICTIONARIES.fr[key] ?? key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match,
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
