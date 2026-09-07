/** Supported locales. Vietnamese is the default/initial and fallback language. */
export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

/** Cookie the locale is persisted in; read server-side in the root layout. */
export const cookieName = "NEXT_LOCALE";

/** i18next namespaces — one per screen/domain, plus shared chrome. */
export const namespaces = [
  "common",
  "nav",
  "home",
  "awards",
  "login",
  "countdown",
  "rules",
  "kudos",
  "kudosBoard",
  "kudosFeed",
  "kudosSpotlight",
  "profile",
] as const;
export const defaultNS = "common";

/** Narrow an arbitrary string to a supported Locale, else the default. */
export function resolveLocale(value: string | undefined | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
