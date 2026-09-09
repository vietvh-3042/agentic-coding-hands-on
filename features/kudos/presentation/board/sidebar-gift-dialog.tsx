"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle } from "@/shared/ui/primitives/dialog";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";
import SecretBoxRevealPanel from "@/features/kudos/presentation/board/secret-box-reveal-panel";
import {
  getSecretBoxStatus,
  openSecretBox,
  type DrawnSecretBoxIcon,
} from "@/features/kudos/application/actions/open-secret-box";

interface SidebarGiftDialogProps {
  /** Number of not-yet-opened secret boxes (from the sidebar stats) — used
   *  only for the very first paint, before the authoritative server
   *  readback below resolves. */
  unopenedCount: number;
  onClose: () => void;
}

/**
 * Secret-box modal — two states in one shell, per Figma:
 * - "unopened" (node 6418, screen J3-4YFIpMM "chưa mở"): box-closed.svg,
 *   click-to-open instruction, footer count.
 * - "revealed" (screen J3-4YFIpMM "MỞ SECRET BOX THÀNH CÔNG", the half that
 *   was missing): the drawn badge inside the box frame, a "click to open
 *   again" instruction, footer count — both counts always the server's own
 *   answer (FN-2), never computed here.
 *
 * The draw itself is server-side (`openSecretBox()`, over the parameterless
 * `open_secret_box()` RPC) — nothing the client sends selects a badge or a
 * count. `getSecretBoxStatus()` re-reads the authoritative counters on every
 * mount, so reopening the dialog after any client-side tampering (devtools,
 * or a parent still passing a stale prop) always shows the real database
 * value (the two MoMorph security test cases this phase re-asserts).
 *
 * Uses `components/ui/dialog.tsx`'s Base UI primitives directly (not the
 * opinionated `DialogContent` wrapper, whose `sm:max-w-sm` would fight this
 * modal's fixed 652×823 Figma sizing) for the portal, Escape-to-close,
 * outside-click-to-close and scroll lock — no hand-rolled equivalents.
 */
export default function SidebarGiftDialog({ unopenedCount, onClose }: SidebarGiftDialogProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"unopened" | "revealed">("unopened");
  const [icon, setIcon] = useState<DrawnSecretBoxIcon | null>(null);
  const [count, setCount] = useState(unopenedCount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSecretBoxStatus().then((status) => {
      if (!cancelled && status) setCount(status.boxes_unopened);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasBoxes = count > 0;

  function handleOpenBox() {
    if (!hasBoxes || isPending) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await openSecretBox();
      if (result.ok) {
        setIcon(result.icon);
        setView("revealed");
        setCount(result.boxesUnopened);
        return;
      }
      if (result.error === "empty") setCount(0);
      setErrorMessage(t("kudosFeed:giftDialog.error"));
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/70" />
        {/* mm:1466:7676 — modal shell (bg #00101A, r=12.7px, gap 22px) */}
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-60 flex h-205.75 max-h-[calc(100%-3rem)] w-163 max-w-[calc(100%-3rem)] -translate-1/2 flex-col items-center gap-5.5 overflow-y-auto rounded-[13px] border border-[#998C5F] bg-[#00101A] px-3.25 py-6 font-(family-name:--font-montserrat) outline-none">
          {/* mm:1466:7677 Frame 551 — title + close */}
          <div className="relative flex w-full items-center justify-center">
            <DialogTitle className="text-center text-[26px] leading-8 font-bold text-[#FFEA9E]">
              {view === "unopened" ? t("kudosFeed:giftDialog.title") : t("kudosFeed:giftDialog.successTitle")}
            </DialogTitle>
            {/* mm:1466:7679 MM_MEDIA_Close */}
            <DialogClose
              aria-label={t("kudosFeed:giftDialog.closeAria")}
              className="absolute right-0 text-white transition-colors hover:text-[#FFEA9E]"
            >
              <CustomSvgIcon src="/kudos/secret-box/close.svg" className="size-5" />
            </DialogClose>
          </div>

          {/* mm:1466:7680 Rectangle 16 */}
          <div className="h-px w-full bg-[#2E3940]" />

          {/* mm:1466:7681 B_Group 396 — instruction (hidden when no boxes, BR-004) */}
          {hasBoxes && (
            <p className="text-center text-[13px] leading-5 font-bold tracking-[0.4px] text-white">
              {view === "unopened" ? t("kudosFeed:giftDialog.subtitle") : t("kudosFeed:giftDialog.continueSubtitle")}
            </p>
          )}

          {/* mm:1466:7684 C_Box image — a real button so it is keyboard reachable */}
          <button
            type="button"
            onClick={handleOpenBox}
            disabled={!hasBoxes || isPending}
            aria-label={t("kudosFeed:giftDialog.boxAlt")}
            data-testid="secret-box-button"
            className={`relative aspect-square w-full max-w-139.25 ${
              hasBoxes && !isPending ? "cursor-pointer" : "cursor-not-allowed"
            }`}
          >
            {view === "revealed" && icon ? (
              <SecretBoxRevealPanel icon={icon} badgeAlt={t("kudosFeed:giftDialog.badgeAlt", { name: icon.name })} />
            ) : (
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: "url(/kudos/secret-box/box-closed.svg)" }}
              />
            )}
          </button>

          {errorMessage && (
            <p role="alert" data-testid="secret-box-error" className="text-center text-[13px] font-bold text-[#FF6B6B]">
              {errorMessage}
            </p>
          )}

          {/* mm:1466:7688 Rectangle 18 */}
          <div className="h-px w-full bg-[#2E3940]" />

          {/* mm:1466:7689 D_Số box chưa mở (unopened box count) — label + zero-padded count */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] leading-5 font-bold tracking-[0.4px] text-white">
              {t("kudosFeed:giftDialog.footerLabel")}
            </span>
            <span className="text-[29px] leading-9 font-bold text-[#FFEA9E]" data-testid="secret-box-count">
              {String(count).padStart(2, "0")}
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
