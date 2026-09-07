"use client";

import Image from "next/image";
import { Montserrat } from "next/font/google";
import { useTranslation } from "react-i18next";
import HeroInfoBlock from "./hero-info-block";
import HeroCta from "./hero-cta";
import HeroContent from "./hero-content";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
  variable: "--font-montserrat",
});

/**
 * Homepage SAA hero — Figma "mms_3.5_Keyvisual" (2167:9027) + "Cover"
 * (2167:9029) + "Bìa" (2167:9030, Frame 487 / Frame 486). Full-bleed
 * key-visual background with a top-fading navy scrim, holding the ROOT
 * FURTHER logo, event countdown + info, CTA buttons, and the theme
 * introduction copy. Content column is centered `max-w-[1224px]` inside the
 * full-bleed background (Figma's 1512px artboard = 144px side padding +
 * 1224px content).
 */
export default function HeroSection() {
  const { t } = useTranslation();

  return (
    // mm:2167:9030
    <section className={`${montserrat.variable} relative w-full overflow-hidden bg-[#00101A]`}>
      {/* mm:2167:9028 MM_MEDIA_Keyvisual BG (1512x1392) — full-bleed key
          visual covering the entire hero height (object-cover), no transform.
          The Cover gradient below sits on top as a navy scrim. */}
      <Image
        src="/homepage-saa/Keyvisual_BG.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-top"
      />

      {/* mm:2167:9029 Cover — navy scrim fading out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(12.34deg, #00101A 23.7%, rgba(0, 18, 29, 0.461538) 38.34%, rgba(0, 19, 32, 0) 48.92%)",
        }}
      />

      {/* pt = 80px fixed header + 104px header→content gap (Figma "Bìa" y=184). */}
      <div className="relative z-10 mx-auto flex w-full max-w-306 flex-col items-center gap-16 px-6 pt-46 pb-12 sm:px-10 lg:gap-30 lg:px-0 lg:pb-24">
        {/* mm:2167:9031 Frame 487 */}
        <div className="flex w-full flex-col items-start gap-6 lg:gap-10">
          {/* mm:2167:9032 mm:2788:12911 MM_MEDIA_Root Further Logo */}
          <Image
            src="/homepage-saa/Root_Further_Logo.png"
            alt={t("home:hero.logoAlt")}
            width={451}
            height={200}
            priority
            className="h-auto w-56 sm:w-72 lg:w-[451px]"
          />
          <HeroInfoBlock />
          <HeroCta />
        </div>

        {/* mm:3204:10152 Frame 486 */}
        <HeroContent />
      </div>
    </section>
  );
}
