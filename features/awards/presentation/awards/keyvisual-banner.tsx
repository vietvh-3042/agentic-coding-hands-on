"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

/**
 * Hero banner for the Awards page — Figma "mms_3_Keyvisual" (313:8437) +
 * "mms_A_Title hệ thống giải thưởng" (313:8453). Full-bleed background photo
 * (the same source photography as the homepage hero, cropped to this
 * shorter band per Figma's exact background-position/size) with the ROOT
 * FURTHER logo and the page title overlaid on top. Decorative only — no
 * click behavior.
 */
export default function KeyvisualBanner() {
  const { t } = useTranslation();

  return (
    // mm:313:8437 mms_3_Keyvisual
    <div className="relative w-full overflow-hidden">
      {/* mm:2167:5138 MM_MEDIA "image 20" — verbatim Figma crop of the
          shared keyvisual photograph (background-position/size from spec). */}
      <div
        role="img"
        aria-label="Keyvisual Sun* Annual Award 2025"
        className="aspect-1440/547 w-full"
        style={{
          background: "url(/homepage-saa/Keyvisual_BG.png) -0.163px -858.967px / 101.245% 367.889% no-repeat",
        }}
      />

      {/* mm:313:8439 Cover — Figma gradient rectangle overlaying the keyvisual,
          fading its bottom edge into the dark page background. Sits above the
          photo, below the logo/title (so the title stays readable). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, #00101A -4.23%, rgba(0, 19, 32, 0.00) 52.79%)",
        }}
      />

      {/* mm:313:8449 Bìa — logo + title overlaid on the banner. pt-44 = 80px
          header + 96px header→content gap; px-36 = 144px side padding. */}
      <div className="absolute inset-0 mx-auto flex w-full max-w-360 flex-col gap-30 px-36 pt-44 pb-11">
        {/* mm:313:8451 Frame 482 / mm:2789:12915 MM_MEDIA_Root Further Logo */}
        <Image
          src="/homepage-saa/Root_Further_Logo.png"
          alt="ROOT FURTHER"
          width={338}
          height={150}
          priority
          className="h-auto w-42.25 sm:w-55 lg:w-84.5"
        />

        {/* mm:313:8453 mms_A_Title hệ thống giải thưởng */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* mm:313:8454 */}
          <p className="font-(family-name:--font-montserrat) text-2xl leading-8 font-bold text-white">
            {t("awards:keyvisual.eyebrow")}
          </p>
          {/* mm:313:8455 Rectangle 26 */}
          <div className="h-px w-full bg-[#2E3940]" />
          {/* mm:313:8457 */}
          <h1 className="font-(family-name:--font-montserrat) text-[57px] leading-16 font-bold tracking-[-0.25px] text-[#FFEA9E]">
            {t("awards:keyvisual.title")}
          </h1>
        </div>
      </div>
    </div>
  );
}
