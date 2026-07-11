"use client";

import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./config";
import { getDirection } from "./config";
import en from "./en.json";
import ar from "./ar.json";

type TranslationValue = string | Record<string, unknown>;

type NestedTranslation = {
  [key: string]: TranslationValue | NestedTranslation;
};

const translations: Record<Locale, NestedTranslation> = { en, ar } as Record<
  Locale,
  NestedTranslation
>;

function getNestedValue(
  obj: NestedTranslation,
  path: string
): string | undefined {
  return path.split(".").reduce<string | undefined>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as NestedTranslation)[part] as string | undefined;
    }
    return undefined;
  }, obj as unknown as string | undefined);
}

interface LocaleStore {
  locale: Locale;
  direction: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "en",
      direction: "ltr",
      setLocale: (locale: Locale) => {
        const direction = getDirection(locale);
        document.documentElement.dir = direction;
        document.documentElement.lang = locale;
        set({ locale, direction });
      },
    }),
    { name: "locale-storage" }
  )
);

export function useTranslation() {
  const { locale, setLocale } = useLocaleStore();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translation = translations[locale];
      let value = getNestedValue(translation, key);

      if (!value) {
        const fallback = getNestedValue(translations["en"], key);
        value = fallback || key;
      }

      if (params && value) {
        return Object.entries(params).reduce((acc, [k, v]) => {
          return acc.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        }, value);
      }

      return value || key;
    },
    [locale]
  );

  const isRTL = locale === "ar";
  const direction = getDirection(locale);

  return { t, locale, setLocale, isRTL, direction };
}

export function useInitializeLocale() {
  const setLocale = useLocaleStore((state) => state.setLocale);

  useEffect(() => {
    const stored = useLocaleStore.getState().locale;
    const dir = getDirection(stored);
    document.documentElement.dir = dir;
    document.documentElement.lang = stored;
  }, [setLocale]);
}
