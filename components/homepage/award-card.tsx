"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";

export interface AwardCardData {
  nodeId: string;
  itemKey: string;
  title: string;
  description: string;
  bgImg: string;
  nameImg: string;
  nameImgWidth: number;
  nameImgHeight: number;
}

/**
 * Single award card — Figma component "mms_C2.x_* Award" (componentId 214:1032).
 * Picture (Award_BG.png photo + centered award-name badge image) + title +
 * description + a "See details" link with an up-arrow icon.
 *
 * `nodeId` is intentionally not a render prop here: this component is the
 * reusable Figma component (id 214:1032), rendered once per award instance
 * by the caller (which keeps `nodeId` for the React `key`). The `mm:` markers
 * below reference the master-component node ids, which are identical across
 * all 6 award instances.
 */
export default function AwardCard({
  title,
  description,
  itemKey,
  bgImg,
  nameImg,
  nameImgWidth,
  nameImgHeight,
}: Omit<AwardCardData, "nodeId">) {
  const { t } = useTranslation();

  return (
    // mm:214:1032
    // On-page scope only — no award detail pages exist, so the whole card
    // and its "See details" link scroll to the awards section (#awards).
    // Hover lift + brighter glow per spec ("lifts slightly, with a standout
    // border/glow").
    <a
      href={`/award-info#${itemKey}`}
      className="group flex w-84 flex-col items-start gap-6 transition-transform duration-200 ease-out hover:-translate-y-1.5"
    >
      {/* mm:81:2443 Picture-Award */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[#FFEA9E] shadow-[0_4px_4px_0_rgba(0,0,0,0.25),0_0_6px_0_#FAE287] transition-shadow duration-200 ease-out group-hover:shadow-[0_4px_4px_0_rgba(0,0,0,0.25),0_0_14px_2px_#FAE287]"
        style={{ mixBlendMode: "screen" }}
      >
        {/* mm:81:2442 MM_MEDIA_Award BG */}
        <Image src={bgImg} alt="" fill className="object-cover" />
        {/* mm:214:666 Awards-Name badge, centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image src={nameImg} alt={title} width={nameImgWidth} height={nameImgHeight} />
        </div>
      </div>

      {/* mm:214:1020 Frame 490 */}
      <div className="flex w-full flex-col items-start gap-1">
        {/* mm:214:1021 */}
        <h3 className="font-(family-name:--font-montserrat) text-2xl leading-8 font-normal text-[#FFEA9E]">{title}</h3>
        {/* mm:214:1022 */}
        <p className="w-full font-(family-name:--font-montserrat) text-base leading-6 font-normal tracking-[0.5px] text-white">
          {description}
        </p>
        {/* mm:214:1023 Button-IC */}
        <span className="flex items-center gap-1 py-4 text-white">
          <span className="text-center font-(family-name:--font-montserrat) text-base leading-6 font-medium tracking-[0.15px] whitespace-nowrap">
            {t("home:awards.detailLink")}
          </span>
          {/* mm:186:1441 MM_MEDIA_Up */}
          <CustomSvgIcon src="/icons/icon_up.svg" className="size-6" />
        </span>
      </div>
    </a>
  );
}
