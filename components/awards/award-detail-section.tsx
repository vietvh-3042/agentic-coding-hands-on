"use client";

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import AwardDetailCard, { type AwardDetailData } from "./award-detail-card";

const AWARD_BG = "/homepage-saa/Award_BG.png";

/** Shared, reusable prize-note strings — keys into `awards:prizeNotes.*`. */
type PrizeNoteKey = "perAward" | "perIndividual" | "perGroup";

interface AwardMeta {
  id: string;
  bgImg: string;
  nameImg: string;
  nameImgWidth: number;
  nameImgHeight: number;
  /** e.g. "10", "02", "01" */
  quantityValue: string;
  prizes: { amount: string; noteKey?: PrizeNoteKey }[];
  /** Swap image/content sides for the zigzag layout. */
  reverse?: boolean;
}

/**
 * Award non-text data — exact prize values, quantities and image refs pulled
 * verbatim from MoMorph design nodes for screen zFYDgyj_pD (frame 313:8436,
 * items D.1–D.6). `id` matches CategoryNav 1:1. Translatable text (title,
 * description, quantityUnit, prize notes) is resolved via i18n
 * (`awards:items.<id>.*` / `awards:prizeNotes.*`) at render time below.
 */
const AWARDS: AwardMeta[] = [
  {
    id: "top-talent",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Talent.png",
    nameImgWidth: 221,
    nameImgHeight: 35,
    quantityValue: "10",
    prizes: [{ amount: "7.000.000 VND", noteKey: "perAward" }],
  },
  {
    id: "top-project",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Project.png",
    nameImgWidth: 232,
    nameImgHeight: 35,
    quantityValue: "02",
    prizes: [{ amount: "15.000.000 VND", noteKey: "perAward" }],
    reverse: true,
  },
  {
    id: "top-project-leader",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Top_Project_Leader.png",
    nameImgWidth: 232,
    nameImgHeight: 64,
    quantityValue: "03",
    prizes: [{ amount: "7.000.000 VND", noteKey: "perAward" }],
  },
  {
    id: "best-manager",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Best_Manager.png",
    nameImgWidth: 232,
    nameImgHeight: 30,
    quantityValue: "01",
    prizes: [{ amount: "10.000.000 VND" }],
    reverse: true,
  },
  {
    id: "signature-2025",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_Signature_2025_Creator.png",
    nameImgWidth: 232,
    nameImgHeight: 54,
    quantityValue: "01",
    prizes: [
      { amount: "5.000.000 VND", noteKey: "perIndividual" },
      { amount: "8.000.000 VND", noteKey: "perGroup" },
    ],
  },
  {
    id: "mvp",
    bgImg: AWARD_BG,
    nameImg: "/homepage-saa/Award_Name_MVP.png",
    nameImgWidth: 116,
    nameImgHeight: 52,
    quantityValue: "01",
    prizes: [{ amount: "15.000.000 VND" }],
    reverse: true,
  },
];

/**
 * Award list — Figma "D.Danh sách giải thưởng" (313:8466). Renders the 6
 * award detail cards in a zigzag layout (image alternates sides), each
 * wrapped in an anchored `<section>` for CategoryNav's scrollspy + click
 * navigation. Read-only.
 */
export default function AwardDetailSection() {
  const { t } = useTranslation();

  return (
    // mm:313:8466 D.Danh sách giải thưởng
    <div className="flex w-full flex-1 flex-col gap-20">
      {AWARDS.map(({ id, prizes, ...meta }, index) => {
        const award: Omit<AwardDetailData, "id"> = {
          ...meta,
          title: t(`awards:items.${id}.title`),
          description: t(`awards:items.${id}.description`),
          quantityUnit: t(`awards:items.${id}.quantityUnit`),
          prizes: prizes.map(({ amount, noteKey }) => ({
            amount,
            note: noteKey ? t(`awards:prizeNotes.${noteKey}`) : undefined,
          })),
        };
        return (
          <Fragment key={id}>
            {/* mm:214:2647 (per-award anchor target for CategoryNav) */}
            <section id={id} className="scroll-mt-24">
              <AwardDetailCard {...award} />
            </section>
            {/* mm:214:2771 Rectangle 14 — divider between cards (absent after the last) */}
            {index < AWARDS.length - 1 && <div className="h-px w-full bg-[#2E3940]" />}
          </Fragment>
        );
      })}
    </div>
  );
}
