"use client";

import { useTranslation } from "react-i18next";
import AwardCard, { type AwardCardData } from "./award-card";

const AWARD_BG = "/homepage-saa/Award_BG.png";

/** Static award metadata — `itemKey` resolves the title/description from
 * `home:awards.items.<itemKey>` at render time (see `AwardSection`). */
type AwardRowItem = Omit<AwardCardData, "title" | "description"> & {
  itemKey: string;
};

const AWARDS_ROW_1: AwardRowItem[] = [
  {
    nodeId: "2167:9075",
    itemKey: "top-talent",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Talent.png",
    nameImgWidth: 221,
    nameImgHeight: 35,
  },
  {
    nodeId: "2167:9076",
    itemKey: "top-project",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Project.png",
    nameImgWidth: 232,
    nameImgHeight: 35,
  },
  {
    nodeId: "2167:9077",
    itemKey: "top-project-leader",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Project_Leader.png",
    nameImgWidth: 232,
    nameImgHeight: 64,
  },
];

const AWARDS_ROW_2: AwardRowItem[] = [
  {
    nodeId: "2167:9079",
    itemKey: "best-manager",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Best_Manager.png",
    nameImgWidth: 232,
    nameImgHeight: 30,
  },
  {
    nodeId: "2167:9080",
    itemKey: "signature-2025",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Signature_2025_Creator.png",
    nameImgWidth: 232,
    nameImgHeight: 54,
  },
  {
    nodeId: "2167:9081",
    itemKey: "mvp",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_MVP.png",
    nameImgWidth: 116,
    nameImgHeight: 52,
  },
];

/**
 * Award system section — Figma "Hệ thống giải thưởng" (node 2167:9068), part
 * of the Homepage SAA screen. Header ("Sun* annual awards 2025" + divider +
 * big title) followed by two rows of 3 award cards (component 214:1032).
 *
 * Presentational only — content is mock data extracted verbatim from Figma.
 * Assumes the hosting page loads Montserrat via next/font/google and exposes
 * it as the `--font-montserrat` CSS variable (see app/login/page.tsx for the
 * established pattern in this codebase).
 */
export default function AwardSection() {
  const { t } = useTranslation();

  const resolveAward = (item: AwardRowItem): AwardCardData => ({
    ...item,
    title: t(`home:awards.items.${item.itemKey}.title`),
    description: t(`home:awards.items.${item.itemKey}.description`),
  });

  return (
    // mm:2167:9068
    <section className="mx-auto flex w-full max-w-306 flex-col items-start gap-20">
      {/* mm:2167:9069 mms_C1_Header Giải thưởng */}
      <div className="flex w-full flex-col items-start gap-4">
        {/* mm:2167:9070 */}
        <p className="font-(family-name:--font-montserrat) text-2xl leading-8 font-bold text-white">
          {t("home:awards.eyebrow")}
        </p>
        {/* mm:2167:9071 Rectangle 26 */}
        <div className="h-px w-full bg-[#2E3940]" />
        {/* mm:2167:9072 Frame 488 */}
        <div className="flex w-full flex-row items-center gap-8">
          {/* mm:2167:9073 */}
          <h2 className="font-(family-name:--font-montserrat) text-[57px] leading-16 font-bold tracking-[-0.25px] text-[#FFEA9E]">
            {t("home:awards.title")}
          </h2>
        </div>
      </div>

      {/* mm:5005:14974 mms_C2_Award list */}
      <div className="flex w-full flex-col gap-20">
        {/* mm:2167:9074 Frame 491 */}
        <div className="flex w-full flex-row justify-between gap-20">
          {AWARDS_ROW_1.map(resolveAward).map((award) => (
            <AwardCard key={award.nodeId} {...award} />
          ))}
        </div>
        {/* mm:2167:9078 Frame 493 */}
        <div className="flex w-full flex-row justify-between gap-20">
          {AWARDS_ROW_2.map(resolveAward).map((award) => (
            <AwardCard key={award.nodeId} {...award} />
          ))}
        </div>
      </div>
    </section>
  );
}
