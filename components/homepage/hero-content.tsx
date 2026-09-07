"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

/**
 * Introduction copy — Figma "Frame 486" (3204:10152): the stacked
 * "ROOT" / "FURTHER" wordmark (Group 434, two overlapping raster crops)
 * followed by the theme introduction paragraphs and pull-quote
 * (mms_B4_content).
 */
export default function HeroContent() {
  const { t } = useTranslation();

  return (
    // mm:3204:10152
    <div className="flex w-full max-w-6xl flex-col items-center gap-8 rounded-lg px-4 py-16 font-(family-name:--font-montserrat) text-white sm:px-10 lg:py-30">
      {/* mm:3204:10153 Group 434 — stacked ROOT / FURTHER wordmark */}
      <div className="relative h-25.5 w-55 sm:h-33.5 sm:w-72.5">
        {/* mm:3204:10155 MM_MEDIA_Root Text */}
        <div className="absolute top-0 left-[17.6%] h-1/2 w-[65.2%]">
          <Image
            src="/homepage-saa/Root_Text.png"
            alt={t("home:hero.content.rootAlt")}
            fill
            className="object-contain"
          />
        </div>
        {/* mm:3204:10154 MM_MEDIA_Further Text */}
        <div className="absolute inset-x-0 top-1/2 h-1/2">
          <Image
            src="/homepage-saa/Further_Text.png"
            alt={t("home:hero.content.furtherAlt")}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* mm:3204:10156 */}
      <p className="w-full text-justify text-[24px] leading-8 font-bold whitespace-pre-line">
        {t("home:hero.content.intro")}
      </p>

      {/* mm:3204:10161 */}
      <p className="w-full text-center text-[20px] leading-8 font-bold whitespace-pre-line">
        {t("home:hero.content.quote")}
      </p>

      {/* mm:3204:10162 */}
      <p className="w-full text-justify text-[24px] leading-8 font-bold whitespace-pre-line">
        {t("home:hero.content.closing")}
      </p>
    </div>
  );
}
