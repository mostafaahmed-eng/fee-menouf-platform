export type Locale = "en" | "ar";

export const i18nConfig = {
  defaultLocale: "en" as Locale,
  locales: ["en", "ar"] as Locale[],
  localeNames: {
    en: "English",
    ar: "العربية",
  },
  localeDirections: {
    en: "ltr" as const,
    ar: "rtl" as const,
  },
};

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return i18nConfig.localeDirections[locale];
}

export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}
