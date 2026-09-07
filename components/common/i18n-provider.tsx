"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "@/lib/i18n/i18n";
import { resolveLocale } from "@/lib/i18n/settings";

/**
 * Client i18n boundary. Creates a per-mount i18next instance for the locale the
 * server resolved from the NEXT_LOCALE cookie (so SSR and first client render
 * match — no hydration flash — and no shared global instance across requests),
 * then keeps <html lang> in sync.
 */
export default function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: string;
  children: React.ReactNode;
}) {
  const [instance] = useState(() => createI18nInstance(resolveLocale(initialLocale)));

  useEffect(() => {
    document.documentElement.lang = instance.language;
  }, [instance]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
