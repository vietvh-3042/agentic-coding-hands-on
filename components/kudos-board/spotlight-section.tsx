"use client";

import { useTranslation } from "react-i18next";
import type { SpotlightNode } from "@/lib/kudos/board-queries";
import SpotlightBoard from "./spotlight-board";

interface SpotlightSectionProps {
  nodes: readonly SpotlightNode[];
  totalCount: number;
}

/**
 * Spotlight board section — Figma "B.6_Header Giải thưởng" (node 2940:13476)
 * + "B.7_Spotlight" (node 2940:14174), part of the "Sun* Kudos - Live board"
 * screen (MaZUn5xHXZ). Header mirrors the shared eyebrow+divider+title
 * pattern used by `AwardSection` on the homepage; the board itself is a
 * client-interactive word cloud (see `SpotlightBoard`). `nodes`/`totalCount`
 * are server-fetched by `app/sun-kudos/page.tsx` (BR-005 — total is a single
 * unfiltered count, invariant under the hashtag filter).
 */
export default function SpotlightSection({ nodes, totalCount }: SpotlightSectionProps) {
  const { t } = useTranslation();

  return (
    // mm:2940:14170 Frame 552 (header + board wrapper)
    <section className="mx-auto flex w-full max-w-306 flex-col items-start gap-8">
      {/* mm:2940:13476 B.6_Header Giải thưởng */}
      <div className="flex w-full flex-col items-start gap-4">
        {/* mm:2940:13477 */}
        <p className="font-(family-name:--font-montserrat) text-2xl leading-8 font-bold text-white">
          {t("kudosSpotlight:header.eyebrow")}
        </p>
        {/* mm:2940:13478 Rectangle 26 */}
        <div className="h-px w-full bg-[#2E3940]" />
        {/* mm:2940:13479 Frame 488 */}
        <h2 className="font-(family-name:--font-montserrat) text-[57px] leading-16 font-bold tracking-[-0.25px] text-[#FFEA9E]">
          {t("kudosSpotlight:header.title")}
        </h2>
      </div>

      {/* mm:2940:14174 B.7_Spotlight */}
      <SpotlightBoard nodes={nodes} totalCount={totalCount} />
    </section>
  );
}
