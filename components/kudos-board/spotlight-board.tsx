"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import type { SpotlightNode } from "@/lib/kudos/board-queries";
import SpotlightNameNode from "./spotlight-name-node";
import SpotlightZoomControls from "./spotlight-zoom-controls";
import { layoutSpotlightNodes } from "./spotlight-layout";
import { useSpotlightPanZoom } from "./use-spotlight-pan-zoom";

const BOARD_WIDTH = 1157;
const BOARD_HEIGHT = 548;

// Decorative "recent activity" ticker (node 2940:14230 + 3004:15995-15999),
// 6 identical rows at decreasing opacity — no DB source, moved here verbatim
// from the retired mock data module for this board.
const TICKER_MESSAGE = "08:30PM Charles Barnes just received a new Kudos";
const TICKER_OPACITIES = [0.1, 0.3, 0.5, 0.7, 1, 1];

interface SpotlightBoardProps {
  nodes: readonly SpotlightNode[];
  totalCount: number;
}

/**
 * Spotlight board — Figma "B.7_Spotlight" (node 2940:14174), 1157x548 rounded
 * frame with a scattered name cloud. Search filters names, the pan/zoom
 * button toggles a small zoom control popover (`useSpotlightPanZoom` owns
 * the drag/zoom state). `nodes`/`totalCount` are server-fetched (every
 * distinct recipient + an unfiltered `COUNT(*)`, BR-005); scatter
 * position/size is client-computed and decorative (`layoutSpotlightNodes`).
 */
export default function SpotlightBoard({ nodes, totalCount }: SpotlightBoardProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoomControlsOpen, setZoomControlsOpen] = useState(false);
  const { zoom, pan, handlePointerDown, handlePointerMove, stopDragging, applyZoom, ZOOM_STEP } = useSpotlightPanZoom({
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
  });

  const laidOutNodes = useMemo(() => layoutSpotlightNodes(nodes), [nodes]);

  const filteredNames = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return laidOutNodes;
    return laidOutNodes.filter((item) => item.name.toLowerCase().includes(query));
  }, [laidOutNodes, searchTerm]);

  return (
    <div
      data-testid="spotlight-board"
      className="relative mx-auto h-137 w-full max-w-289.25 overflow-hidden rounded-[47px] border border-[#998C5F] bg-[#0A1119] font-(family-name:--font-montserrat)"
    >
      {/* Decorative background — the design uses bespoke artwork here (Figma
          "Root further mo rong 1" / "image 24" / "image 25") that isn't an
          exported MM_MEDIA asset; approximated with a dark gradient + soft
          color bloom to keep the same mood without inventing an asset. */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#0A1119] via-[#050C12] to-black" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-80 rounded-full bg-linear-to-tr from-orange-500/25 via-red-500/15 to-blue-500/20 blur-3xl" />

      {/* mm:2940:14833 B.7.3_Tìm kiếm sunner */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full border border-[#998C5F]/70 bg-[#FFEA9E]/10 px-3 py-2">
        <CustomSvgIcon src="/icons/search.svg" className="size-3 text-white" />
        <input
          type="text"
          value={searchTerm}
          maxLength={100}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("kudosSpotlight:search.placeholder")}
          aria-label={t("kudosSpotlight:search.placeholder")}
          className="w-32 bg-transparent text-[11px] font-medium text-white placeholder-white/70 outline-none"
        />
      </div>

      {/* mm:3007:17482 B.7.1_388 KUDOS */}
      <p
        data-testid="spotlight-total"
        className="absolute top-4 left-1/2 z-10 -translate-x-1/2 text-[28px] font-bold text-white sm:text-[36px]"
      >
        {t("kudosSpotlight:board.kudosCount", { count: totalCount })}
      </p>

      {/* Name cloud — draggable when zoomed in */}
      <div
        className={`absolute inset-0 touch-none ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
      >
        {filteredNames.length === 0 ? (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-base font-bold text-white">{t("kudosSpotlight:emptyState.title")}</p>
            <p className="text-xs text-white/60">{t("kudosSpotlight:emptyState.description")}</p>
          </div>
        ) : (
          filteredNames.map((item) => (
            <SpotlightNameNode
              key={item.id}
              data={item}
              isHovered={hoveredId === item.id}
              onHoverChange={setHoveredId}
            />
          ))
        )}
      </div>

      {/* Decorative "recent activity" ticker — node 2940:14230 + 3004:15995-15999 */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-0 flex max-w-[70%] flex-col gap-0.75 overflow-hidden">
        {TICKER_OPACITIES.map((opacity, index) => (
          <p key={index} style={{ opacity }} className="truncate text-sm font-bold tracking-[0.1px] text-white">
            {TICKER_MESSAGE}
          </p>
        ))}
      </div>

      {/* mm:3007:17479 B.7.2_Pan zoom */}
      <SpotlightZoomControls
        zoom={zoom}
        isOpen={zoomControlsOpen}
        onToggle={() => setZoomControlsOpen((open) => !open)}
        onZoomIn={() => applyZoom(zoom + ZOOM_STEP)}
        onZoomOut={() => applyZoom(zoom - ZOOM_STEP)}
        onReset={() => applyZoom(1)}
      />
    </div>
  );
}
