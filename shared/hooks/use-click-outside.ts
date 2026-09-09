"use client";

import { useEffect, type RefObject } from "react";

/**
 * Closes a menu/dropdown when the user clicks/taps outside `ref` or presses
 * Escape. Listeners are only attached while `enabled` is true (i.e. while
 * the menu is open), so idle menus add no overhead.
 */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, onClose, enabled]);
}
