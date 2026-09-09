"use client";

import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";

interface SpotlightZoomControlsProps {
  zoom: number;
  isOpen: boolean;
  onToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/**
 * Pan/zoom toggle button (Figma "B.7.2_Pan zoom", node 3007:17479) + the zoom
 * in/out/reset popover it reveals. The design only shows a single icon, so
 * the popover is an additive control surface to satisfy the "buttons for
 * zoom in/out" requirement from clarifications.md without cluttering the
 * default board view.
 */
export default function SpotlightZoomControls({
  zoom,
  isOpen,
  onToggle,
  onZoomIn,
  onZoomOut,
  onReset,
}: SpotlightZoomControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute right-7 bottom-8 z-20">
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 flex items-center gap-1 rounded-full border border-[#998C5F]/70 bg-[#00101A] px-2 py-1.5 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
          <button
            type="button"
            aria-label={t("kudosSpotlight:panZoom.zoomOut")}
            onClick={onZoomOut}
            className="size-6 rounded-full text-sm font-bold text-white hover:text-[#FFEA9E]"
          >
            −
          </button>
          <span className="w-9 text-center text-xs text-white/80">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label={t("kudosSpotlight:panZoom.zoomIn")}
            onClick={onZoomIn}
            className="size-6 rounded-full text-sm font-bold text-white hover:text-[#FFEA9E]"
          >
            +
          </button>
          <button
            type="button"
            aria-label={t("kudosSpotlight:panZoom.reset")}
            onClick={onReset}
            className="ml-1 text-[10px] font-bold text-white/70 hover:text-[#FFEA9E]"
          >
            {t("kudosSpotlight:panZoom.reset")}
          </button>
        </div>
      )}
      <button
        type="button"
        title={t("kudosSpotlight:panZoom.tooltip")}
        aria-label={t("kudosSpotlight:panZoom.tooltip")}
        onClick={onToggle}
        className="flex size-7.5 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
      >
        <CustomSvgIcon src="/kudos/icons/pan-zoom.svg" className="size-4 text-white" />
      </button>
    </div>
  );
}
