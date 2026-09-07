"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";

/** One prize-value line (some awards, e.g. Signature 2025, have two, separated by an "or"). */
export interface AwardPrize {
  /** e.g. "7.000.000 VND" */
  amount: string;
  /** Optional qualifier below the amount, e.g. "per award". */
  note?: string;
}

export interface AwardDetailData {
  /** Anchor id — must match the corresponding CategoryNav item. */
  id: string;
  title: string;
  description: string;
  bgImg: string;
  nameImg: string;
  nameImgWidth: number;
  nameImgHeight: number;
  /** e.g. "10", "02", "01" */
  quantityValue: string;
  /** e.g. "Individual", "Team", "Individual or team" */
  quantityUnit: string;
  prizes: AwardPrize[];
  /** Swap image/content sides for the zigzag layout. */
  reverse?: boolean;
}

/**
 * Single award detail card — Figma "mms_D.x_*" instances (componentSet
 * 214:2647). Award image (336x336, reusing the homepage AwardCard glow
 * treatment) on one side, content block (title, description, quantity,
 * prize value) on the other. Read-only.
 */
export default function AwardDetailCard({
  title,
  description,
  bgImg,
  nameImg,
  nameImgWidth,
  nameImgHeight,
  quantityValue,
  quantityUnit,
  prizes,
  reverse = false,
}: Omit<AwardDetailData, "id">) {
  const { t } = useTranslation();

  return (
    // mm:214:2647 Frame 506
    <div className={`flex w-full items-start gap-10 ${reverse ? "flex-row-reverse" : "flex-row"}`}>
      {/* mm:81:2443 Picture-Award */}
      <div
        className="relative aspect-square w-84 shrink-0 overflow-hidden rounded-3xl border border-[#FFEA9E] shadow-[0_4px_4px_0_rgba(0,0,0,0.25),0_0_6px_0_#FAE287]"
        style={{ mixBlendMode: "screen" }}
      >
        {/* mm:81:2442 MM_MEDIA_Award BG */}
        <Image src={bgImg} alt="" fill sizes="336px" className="object-cover" />
        {/* mm:214:666 Awards-Name badge, centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image src={nameImg} alt={title} width={nameImgWidth} height={nameImgHeight} />
        </div>
      </div>

      {/* mm:214:2526 mms_D.x.2_Content */}
      <div className="flex w-120 flex-col gap-8 rounded-2xl font-(family-name:--font-montserrat) backdrop-blur-3xl">
        {/* mm:214:2527 content */}
        <div className="flex flex-col gap-6">
          {/* mm:214:2528 Frame 442 */}
          <div className="flex items-center gap-4">
            <CustomSvgIcon src="/icons/icon_target.svg" className="size-6 text-[#FFEA9E]" />
            <h3 className="text-2xl leading-8 font-bold text-[#FFEA9E]">{title}</h3>
          </div>
          {/* mm:214:2531 description */}
          <p className="text-justify text-base leading-6 font-bold tracking-[0.5px] text-white">{description}</p>
        </div>

        {/* mm:214:2532 Rectangle 8 */}
        <div className="h-px w-full bg-[#2E3940]" />

        {/* mm:214:2533 content — quantity row */}
        <div className="flex items-center gap-4">
          <CustomSvgIcon src="/icons/icon_diamond.svg" className="size-6 text-white" />
          <span className="text-2xl leading-8 font-bold text-[#FFEA9E]">{t("awards:labels.quantity")}</span>
          <span className="flex items-center gap-2">
            <span className="text-4xl leading-11 font-bold text-white">{quantityValue}</span>
            <span className="max-w-15 text-sm leading-5 font-bold tracking-[0.1px] text-white">{quantityUnit}</span>
          </span>
        </div>

        {/* mm:214:2539 content divider */}
        <div className="h-px w-full bg-[#2E3940]" />

        {/* mm:214:2540 Frame 444 — prize value block(s) */}
        <div className="flex flex-col gap-6">
          {prizes.map((prize, index) => (
            <div key={prize.amount} className="flex flex-col gap-4">
              {index > 0 && (
                // mm:313:8498 Frame 524 — "or" separator (Signature 2025 only)
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-[0.1px] text-white">{t("awards:labels.or")}</span>
                  <div className="h-px flex-1 bg-[#2E3940]" />
                </div>
              )}
              {/* mm:214:2542 Frame 497 */}
              <div className="flex items-center gap-4">
                <CustomSvgIcon src="/icons/icon_license.svg" className="size-6 text-white" />
                <span className="text-2xl leading-8 font-bold text-[#FFEA9E]">{t("awards:labels.prizeValue")}</span>
              </div>
              {/* mm:214:2546 */}
              <span className="text-4xl leading-11 font-bold text-white">{prize.amount}</span>
              {/* mm:214:2547 */}
              {prize.note && (
                <span className="text-sm leading-5 font-bold tracking-[0.1px] text-white">{prize.note}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
