import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, defaultNS, namespaces, type Locale } from "./settings";

// Namespace dictionaries. One JSON per (locale, namespace); screen namespaces
// (home/awards/login/countdown) are authored alongside their screen wiring.
import viCommon from "./locales/vi/common.json";
import viNav from "./locales/vi/nav.json";
import viHome from "./locales/vi/home.json";
import viAwards from "./locales/vi/awards.json";
import viLogin from "./locales/vi/login.json";
import viCountdown from "./locales/vi/countdown.json";
import viRules from "./locales/vi/rules.json";
import viKudos from "./locales/vi/kudos.json";
import viKudosBoard from "./locales/vi/kudos-board.json";
import viKudosFeed from "./locales/vi/kudos-feed.json";
import viKudosSpotlight from "./locales/vi/kudos-spotlight.json";
import viProfile from "./locales/vi/profile.json";
import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enHome from "./locales/en/home.json";
import enAwards from "./locales/en/awards.json";
import enLogin from "./locales/en/login.json";
import enCountdown from "./locales/en/countdown.json";
import enRules from "./locales/en/rules.json";
import enKudos from "./locales/en/kudos.json";
import enKudosBoard from "./locales/en/kudos-board.json";
import enKudosFeed from "./locales/en/kudos-feed.json";
import enKudosSpotlight from "./locales/en/kudos-spotlight.json";
import enProfile from "./locales/en/profile.json";

export const resources = {
  vi: {
    common: viCommon,
    nav: viNav,
    home: viHome,
    awards: viAwards,
    login: viLogin,
    countdown: viCountdown,
    rules: viRules,
    kudos: viKudos,
    kudosBoard: viKudosBoard,
    kudosFeed: viKudosFeed,
    kudosSpotlight: viKudosSpotlight,
    profile: viProfile,
  },
  en: {
    common: enCommon,
    nav: enNav,
    home: enHome,
    awards: enAwards,
    login: enLogin,
    countdown: enCountdown,
    rules: enRules,
    kudos: enKudos,
    kudosBoard: enKudosBoard,
    kudosFeed: enKudosFeed,
    kudosSpotlight: enKudosSpotlight,
    profile: enProfile,
  },
} as const;

/**
 * Create a fresh i18next instance for the given locale. A NEW instance is made
 * per provider mount — on the server that means per request, so concurrent
 * requests with different NEXT_LOCALE cookies never share/mutate one global
 * instance (no cross-request locale leakage). Missing keys fall back to `vi`.
 */
export function createI18nInstance(locale: Locale) {
  const instance = createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: defaultLocale,
    ns: [...namespaces],
    defaultNS,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
