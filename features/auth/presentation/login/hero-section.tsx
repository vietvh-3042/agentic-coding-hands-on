"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { createClient } from "@/shared/infrastructure/supabase/client";
import GoogleLoginButton from "./google-login-button";

export interface HeroSectionProps {
  /** True when the page loaded with `?error=oauth_failed` (server-derived). */
  initialError?: boolean;
}

/**
 * Hero — Figma "Cover" (mms_B_Bìa). The "root-further-bg" wave-art is a
 * full-bleed background (spans the full viewport width, even beyond 1440px),
 * anchored top per the bg node's y≈2px. A left-to-right scrim gradient
 * (Figma "Overlay": 90deg, navy → transparent) darkens the left for text
 * legibility. Content sits in a centered 1440px column with the Figma
 * auto-layout: padding 96px 144px, gap 120px — the "ROOT FURTHER" key visual,
 * then the subtitle + Google login button.
 */
export default function HeroSection({ initialError = false }: HeroSectionProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  // Starts the real Google OAuth flow. `redirectTo` is deliberately a bare
  // `${origin}/auth/callback` with no query string — the callback recomputes
  // the post-login destination itself (open-redirect countermeasure, DEC-001).
  //
  // The try/catch is not belt-and-braces: `createClient()` throws when the
  // Supabase env vars are missing, and `signInWithOAuth` can reject outright
  // (offline, DNS failure, GoTrue unreachable) rather than resolving `{ error }`.
  // Without it an exception escapes the handler with `loading` still true, and
  // the button stays disabled behind a spinner forever — no retry, no message.
  const handleLogin = async () => {
    setError(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (signInError) {
        setError(true);
        setLoading(false);
      }
      // No reset on success: the browser is navigating away to Google, so the
      // button must stay in its loading state until the page unloads.
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-6 py-26 sm:px-10 lg:px-36">
      {/* Full-bleed wave-art background — covers the full viewport (behind the
          fixed header/footer), matching the Figma "Cover" full-bleed frame. */}
      <Image
        src="/login/root-further-bg.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-top"
      />

      {/* Left scrim gradient (Figma "Overlay") — navy left → transparent right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0, 16, 26, 0) 100%)",
        }}
      />

      {/* Cover scrim (Figma "Cover") — bottom navy fade; top & height auto-calc'd from Figma's ratio (top 138, height 1093 in a 1024 frame) so it scales with the viewport */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[calc(100svh*138/1024)] h-[calc(100svh*1093/1024)]"
        style={{
          background: "linear-gradient(0deg, #00101A 22.48%, rgba(0, 19, 32, 0) 51.74%)",
        }}
      />

      {/* Content column — centered 1440px, gap 120px (padding & vertical
          centering handled by the parent <main>). */}
      <div className="relative z-10 flex w-full max-w-360 flex-col items-start gap-16 lg:gap-30">
        {/* Key Visual — Figma "mms_B.1_Key Visual" (451×200) */}
        <Image
          src="/login/root-further-logo.png"
          alt={t("login:hero.logoAlt")}
          width={451}
          height={200}
          priority
          className="h-auto w-64 sm:w-80 lg:w-112.75"
        />

        <div className="flex w-full max-w-124 flex-col items-start gap-6">
          <p className="font-(family-name:--font-montserrat) text-base leading-8 font-bold tracking-[0.5px] text-white sm:text-xl sm:leading-10">
            {t("login:hero.subtitleLine1")}
            <br />
            {t("login:hero.subtitleLine2")}
          </p>

          <GoogleLoginButton onClick={handleLogin} loading={loading} />

          {error && (
            <p role="alert" data-testid="google-login-error" className="text-sm text-red-400">
              {t("login:googleButton.error")}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
