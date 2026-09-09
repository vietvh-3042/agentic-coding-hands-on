"use client";

import { useTranslation } from "react-i18next";

/**
 * Sun* Kudos hero — Figma "A_KV Kudos" (2940:13437) inside the "Keyvisual"
 * background instance (2940:13432, full-bleed 1440x512 art). Read-only: a
 * title over a decorative background, holding the "KUDOS" logo lockup.
 * Renders behind the fixed `SiteHeader` (own `pt-46` = 80px header +
 * 104px gap, same pattern as the homepage `HeroSection`).
 */
export default function KvBanner() {
  const { t } = useTranslation();

  return (
    // mm:2940:13437
    <section className="relative h-128 w-full overflow-hidden bg-[#00101A]" aria-label={t("kudosBoard:kvBanner.title")}>
      {/* mm:I2940:13432;2167:5141 MM_MEDIA_KV Background — full-bleed art */}
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative multi-color art, plain img avoids next/image remote-domain config */}
      <img
        src="/kudos/kv/kv-background.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover object-top"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start gap-2.5 px-6 pt-46 lg:px-0">
        {/* mm:2940:13438 Group 424 */}
        <h1 className="font-(family-name:--font-montserrat) text-2xl leading-11 font-bold text-[#FFEA9E] sm:text-3xl lg:text-[36px]">
          {t("kudosBoard:kvBanner.title")}
        </h1>

        {/* mm:2940:13440 MM_MEDIA_Kudos logo — single lockup asset (icon mark + "KUDOS" wordmark), not recreated as text (SVN-Gotham font unavailable). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- multi-color logo lockup, kept as a single asset per code rule 2a */}
        <img
          src="/kudos/kv/kudos-logo.svg"
          alt={t("kudosBoard:kvBanner.logoAlt")}
          className="h-auto w-[70vw] max-w-148.25"
        />
      </div>
    </section>
  );
}
