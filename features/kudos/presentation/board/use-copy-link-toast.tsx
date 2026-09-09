"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shared "Copy Link" behavior for kudos cards — spec mms_B.4.4/mms_C.4.2:
 * copy the kudos URL to the clipboard, then show the confirmation toast
 * "Link copied — ready to share!" (exact text mandated by the spec, same in
 * both locales). Used by both the Highlight carousel and the All-Kudos feed;
 * render `toast` once near the consuming section's root.
 */
export function useCopyLinkToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    const id = window.setTimeout(() => setVisible(false), 2500);
    return () => window.clearTimeout(id);
  }, [visible]);

  const copyLink = useCallback((url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {
      // Clipboard may be unavailable (permissions/insecure context) — the
      // toast still confirms the action per spec; nothing else to do.
    });
    setVisible(true);
  }, []);

  const toast = visible ? (
    <div
      role="status"
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#FFEA9E] px-5 py-3 text-[14px] leading-5 font-bold text-[#00101A] shadow-lg"
    >
      Link copied — ready to share!
    </div>
  ) : null;

  return { copyLink, toast };
}
