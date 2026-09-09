"use client";

import { useTranslation } from "react-i18next";
import { formatTimeOfDay } from "./format-time-of-day";

export type SpotlightNodeSize = "sm" | "md";

/**
 * One laid-out Spotlight word-cloud node. Re-homed here (was
 * the retired mock data module for this board) since this is its only consumer —
 * `spotlight-board.tsx` builds these from the server-fetched `SpotlightNode`
 * list (`lib/kudos/board-queries.ts`) plus client-computed decorative
 * position/size (no DB source for those, per task brief).
 */
export interface SpotlightNameNodeData {
  id: string;
  name: string;
  xPct: number;
  yPct: number;
  size: SpotlightNodeSize;
  /** ISO timestamp of this recipient's most recent kudos — the tooltip's
   *  "received at" time. */
  receivedAt: string;
}

// base `no-unused-vars` cannot see `id` below is a type-only parameter name,
// not a real declaration — see kudos-hashtag-input.tsx's own note on the
// same limitation.
/* eslint-disable no-unused-vars */
interface SpotlightNameNodeProps {
  data: SpotlightNameNodeData;
  isHovered: boolean;
  onHoverChange: (id: string | null) => void;
}
/* eslint-enable no-unused-vars */

/**
 * Single recipient name inside the Spotlight word cloud. Absolute-positioned
 * by percentage (matches the design's scattered layout). Hover reveals a
 * small tooltip with the name + this recipient's most recent kudos time.
 *
 * Click is intentionally a no-op — the recipient detail page doesn't exist
 * yet (see clarifications.md) — but the pointer cursor is kept so the node
 * still reads as interactive per the design.
 */
export default function SpotlightNameNode({ data, isHovered, onHoverChange }: SpotlightNameNodeProps) {
  const { t } = useTranslation();
  const name = data.name.trim();

  return (
    <div className="absolute -translate-1/2" style={{ left: `${data.xPct}%`, top: `${data.yPct}%` }}>
      <button
        type="button"
        aria-label={name}
        onMouseEnter={() => onHoverChange(data.id)}
        onMouseLeave={() => onHoverChange(null)}
        onFocus={() => onHoverChange(data.id)}
        onBlur={() => onHoverChange(null)}
        onClick={(event) => event.preventDefault()}
        className="cursor-pointer font-(family-name:--font-montserrat) font-bold whitespace-nowrap text-white transition-colors hover:text-[#FFEA9E]"
        style={{ fontSize: data.size === "md" ? "11px" : "7px" }}
      >
        {name}
      </button>

      {isHovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-40 -translate-x-1/2 rounded-lg border border-[#998C5F] bg-[#00101A] px-3 py-1.5 font-(family-name:--font-montserrat) text-[11px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]"
        >
          <p className="font-bold text-[#FFEA9E]">{name}</p>
          <p className="text-white">
            {t("kudosSpotlight:tooltip.receivedAt", { time: formatTimeOfDay(data.receivedAt) })}
          </p>
        </div>
      )}
    </div>
  );
}
