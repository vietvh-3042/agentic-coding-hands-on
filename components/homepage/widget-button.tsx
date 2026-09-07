"use client";

import Image from "next/image";
import { Montserrat } from "next/font/google";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutside } from "@/hooks/use-click-outside";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import IconPen from "@/components/common/icon-pen";
import SaaRulesDrawer from "./saa-rules-drawer";
import KudosFormModal from "../kudos/kudos-form-modal";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
});

/**
 * Expanded-state action pill — gold, 64px tall, icon + label (mm frame 7052).
 * The shadow lives in the class list (not an inline `style`) so `hover:` can
 * override it — an inline `boxShadow` object would win over any Tailwind
 * hover class and make the hover state a silent no-op. Hover values match
 * "tăng nhẹ shadow" (A) / "tăng bóng nhẹ và đổi độ sáng" (B) from the spec:
 * a slightly larger shadow on both pills, plus a brightness lift on B only.
 */
const ACTION_PILL =
  "flex h-16 items-center gap-2 rounded-[4px] bg-[#FFEA9E] px-4 text-2xl font-bold leading-8 text-[#00101A] " +
  "shadow-[0px_4px_4px_rgba(0,0,0,0.25),0px_0px_6px_#FAE287] transition-shadow " +
  "hover:shadow-[0px_6px_10px_rgba(0,0,0,0.3),0px_0px_10px_#FAE287]";

const TRIGGER_CLASSES = "flex h-16 w-26.5 items-center gap-2 rounded-full bg-[#FFEA9E] p-4 order-2";
const TRIGGER_STYLE = {
  filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25)) drop-shadow(0px 0px 6px #FAE287)",
};
const CLOSE_CLASSES = "flex h-14 w-14 items-center justify-center rounded-full bg-[#D4271D] text-white order-2";
const CLOSE_STYLE = { boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" };

/**
 * Floating "widget" button (write-kudos / rules quick actions).
 *
 * Closed: a single gold pill trigger. Open (mm frame 7052 "Floating Action
 * Button - phim nổi chức năng 2"): two labelled gold action pills — Rules
 * (flash icon → rules drawer) and Write KUDOS (pen → kudos form) — above a
 * round red "×" close button that replaces the trigger while open.
 *
 * The trigger/close button is ONE persistent element across both states
 * (never unmounted), so `aria-haspopup="menu"` / `aria-expanded` stay on a
 * node that is actually present the whole time a screen reader might query
 * it — the previous version put those attributes on the closed-state button
 * and unmounted it the instant the menu opened, announcing an expanding menu
 * from an element that then vanished. The two pills carry `role="menuitem"`
 * inside a `role="menu"` group. DOM order is trigger → pill A → pill B (so
 * Tab reaches all three in sequence from the trigger); `order-*` utility
 * classes restore the original bottom-to-top visual stack. This intentionally
 * stops short of a full roving-focus menu (Home/End/arrow-key navigation) —
 * `components/ui/` now hosts shadcn/ui primitives and a future menu
 * primitive should supply that rather than a hand-built one here.
 *
 * NOTE: Figma anchors this at `top: 830px; right: 19px` on the full page frame,
 * which is how a static mockup represents a scroll-persistent element. Anchoring
 * literally would misplace it across viewports, so it stays viewport-fixed at
 * the bottom-right, keeping the exact horizontal offset (`right: 19px`).
 */
export default function WidgetButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [kudosOpen, setKudosOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Write-KUDOS from the rules drawer: close it, then open the Kudos form.
  const handleWriteKudos = () => {
    setRulesOpen(false);
    setKudosOpen(true);
  };

  // Clicking outside or Esc collapses the expanded FAB.
  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <>
      {/* mm:313:9140 — gap 20px, right-aligned, bottom-right */}
      <div ref={containerRef} className="fixed bottom-6 z-50 flex flex-col items-end gap-5" style={{ right: "19px" }}>
        {/* Trigger (closed) / close (open) — one persistent node, see docblock. */}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls="widget-fab-menu"
          aria-label={isOpen ? t("common:widget.close") : undefined}
          onClick={() => setIsOpen((open) => !open)}
          className={isOpen ? CLOSE_CLASSES : TRIGGER_CLASSES}
          style={isOpen ? CLOSE_STYLE : TRIGGER_STYLE}
        >
          {isOpen ? (
            /* mm:I313:9140;214:3827;186:1766 MM_MEDIA_Close */
            <CustomSvgIcon src="/icons/widget-close.svg" className="size-6" />
          ) : (
            /* Closed trigger pill — pill 106x64, gold drop-shadow follows the
               rounded shape (filter, not box-shadow, to avoid a rectangular glow). */
            <>
              <span className="flex items-center gap-2 text-[#00101A]">
                <IconPen className="size-6" />
                <span className={`${montserrat.className} text-2xl leading-8 font-bold`}>/</span>
              </span>
              <span className="relative size-6 shrink-0">
                <Image
                  src="/icons/kudos_logo_small.svg"
                  alt={t("common:widget.saaRules")}
                  fill
                  sizes="24px"
                  className="object-contain"
                />
              </span>
            </>
          )}
        </button>

        {isOpen && (
          <div
            id="widget-fab-menu"
            role="menu"
            aria-label={t("common:widget.menu")}
            className="order-1 flex flex-col items-end gap-5"
          >
            {/* mm:I313:9140;214:3799 A_Button thể lệ */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                setRulesOpen(true);
              }}
              className={`${montserrat.className} ${ACTION_PILL}`}
            >
              {/* mm:I313:9140;214:3799;186:1763 MM_MEDIA_LOGO (flash) */}
              <CustomSvgIcon src="/icons/widget-flash.svg" className="size-6" />
              {t("common:widget.saaRules")}
            </button>

            {/* mm:I313:9140;214:3732 B_Button viết kudos */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                setKudosOpen(true);
              }}
              className={`${montserrat.className} ${ACTION_PILL} hover:brightness-110`}
            >
              {/* mm:I313:9140;214:3732;186:1763 MM_MEDIA_Pen */}
              <IconPen className="size-6" />
              {t("common:widget.writeKudos")}
            </button>
          </div>
        )}
      </div>

      <SaaRulesDrawer open={rulesOpen} onClose={() => setRulesOpen(false)} onWriteKudos={handleWriteKudos} />

      <KudosFormModal open={kudosOpen} onClose={() => setKudosOpen(false)} />
    </>
  );
}
