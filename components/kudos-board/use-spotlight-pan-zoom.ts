"use client";

import { useRef, useState, type PointerEvent } from "react";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

interface UseSpotlightPanZoomOptions {
  boardWidth: number;
  boardHeight: number;
}

/**
 * Drag-to-pan + zoom-in/out state for the Spotlight board (CSS transform
 * only — no canvas/physics engine, per clarifications.md). Extracted from
 * spotlight-board.tsx to keep that file under 200 lines.
 */
export function useSpotlightPanZoom({ boardWidth, boardHeight }: UseSpotlightPanZoomOptions) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const clampPan = (value: { x: number; y: number }, currentZoom: number) => {
    const maxOffsetX = ((currentZoom - 1) / 2) * boardWidth;
    const maxOffsetY = ((currentZoom - 1) / 2) * boardHeight;
    return {
      x: Math.min(Math.max(value.x, -maxOffsetX), maxOffsetX),
      y: Math.min(Math.max(value.y, -maxOffsetY), maxOffsetY),
    };
  };

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    dragState.current = { startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;
    setPan(clampPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy }, zoom));
  }

  function stopDragging() {
    dragState.current = null;
  }

  function applyZoom(next: number) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    setZoom(clamped);
    setPan((current) => clampPan(current, clamped));
  }

  return { zoom, pan, handlePointerDown, handlePointerMove, stopDragging, applyZoom, ZOOM_STEP };
}
