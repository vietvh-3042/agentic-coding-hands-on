"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { useTranslation } from "react-i18next";
import HeroBadge, { type HeroBadgeType } from "@/components/common/hero-badge";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import IconPen from "@/components/common/icon-pen";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
});

/**
 * Hero-tier badges — rendered via the shared <HeroBadge> component, which draws
 * the authoritative exported artwork (109×19 gold-bordered pill) from
 * public/kudos/badges/. `key` drives the i18n count/desc lookups; `type` +
 * `label` are the badge props. Labels are brand English, shared across locales.
 */
const HERO_TIERS: { key: string; type: HeroBadgeType; label: string }[] = [
  { key: "newHero", type: "new", label: "New Hero" },
  { key: "risingHero", type: "rising", label: "Rising Hero" },
  { key: "superHero", type: "super", label: "Super Hero" },
  { key: "legendHero", type: "legend", label: "Legend Hero" },
];

/** The 6 collectible SAA icons — Figma "Thể lệ UPDATE" (MM_MEDIA_ Badge *).
 * Artwork exported from the design into public/rules/ (node media API is gated,
 * so these were cropped from the authoritative frame render). */
const COLLECTIBLES = [
  { label: "REVIVAL", src: "/rules/revival.png" },
  { label: "TOUCH OF LIGHT", src: "/rules/touch-of-light.png" },
  { label: "STAY GOLD", src: "/rules/stay-gold.png" },
  { label: "FLOW TO HORIZON", src: "/rules/flow-to-horizon.png" },
  { label: "BEYOND THE BOUNDARY", src: "/rules/beyond-the-boundary.png" },
  { label: "ROOT FURTHER", src: "/rules/root-further.png" },
] as const;

interface SaaRulesDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Write-KUDOS action — closes the drawer then jumps to the Kudos section. */
  onWriteKudos: () => void;
}

/** Section heading — gold, uppercase (Figma "Thể lệ" section titles). */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg leading-7 font-bold text-[#FFEA9E] sm:text-xl">{children}</h3>;
}

/**
 * SAA "Thể lệ" (Rules) right-side drawer — Figma "Thể lệ UPDATE" (b1Filzi9i6).
 * A slide-in panel over a dimmed backdrop, opened from the floating widget's
 * SAA rules action. Closes on backdrop click, Esc, or the close button.
 */
export default function SaaRulesDrawer({ open, onClose, onWriteKudos }: SaaRulesDrawerProps) {
  const { t } = useTranslation();

  // Esc closes; lock the body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-60 ${open ? "" : "pointer-events-none"}`}>
      {/* Dimmed backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("rules:title")}
        className={`${montserrat.className} absolute top-0 right-0 flex size-full max-w-140 flex-col bg-[#00101A] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
          <h2 className="text-4xl font-bold text-[#FFEA9E]">{t("rules:title")}</h2>

          {/* Receiver — Hero badges */}
          <section className="mt-8 flex flex-col gap-4">
            <SectionHeading>{t("rules:receiver.heading")}</SectionHeading>
            <p className="text-sm leading-6 text-white/90">{t("rules:receiver.intro")}</p>
            <ul className="flex flex-col gap-4">
              {HERO_TIERS.map(({ key, type, label }) => (
                <li key={key} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HeroBadge type={type} label={label} />
                    <span className="text-sm font-bold text-white">{t(`rules:tiers.${key}.count`)}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/80">{t(`rules:tiers.${key}.desc`)}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Sender — collectible icons */}
          <section className="mt-10 flex flex-col gap-4">
            <SectionHeading>{t("rules:sender.heading")}</SectionHeading>
            <p className="text-sm leading-6 text-white/90">{t("rules:sender.intro")}</p>
            <ul className="grid grid-cols-3 gap-x-4 gap-y-6 py-2">
              {COLLECTIBLES.map(({ label, src }) => (
                <li key={label} className="flex flex-col items-center gap-2">
                  <Image
                    src={src}
                    alt={label}
                    width={128}
                    height={128}
                    className="size-16 rounded-full object-contain"
                  />
                  <span className="text-center text-xs leading-tight font-bold text-white uppercase">{label}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-6 text-white/90">{t("rules:sender.note")}</p>
          </section>

          {/* National Kudos */}
          <section className="mt-10 flex flex-col gap-4">
            <SectionHeading>{t("rules:national.heading")}</SectionHeading>
            <p className="text-sm leading-6 text-white/90">{t("rules:national.body")}</p>
          </section>
        </div>

        {/* Sticky footer — close (secondary) + write KUDOS (primary) */}
        <div className="flex items-center gap-3 border-t border-white/10 px-6 py-4 sm:px-10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            {/* mm:3204:6093 B.1_Button đóng — real "X" icon (spec B), not a text glyph.
                widget-close.svg paints with currentColor, so it inherits the button's text-white. */}
            <CustomSvgIcon src="/icons/widget-close.svg" className="size-4" />
            {t("rules:close")}
          </button>
          <button
            type="button"
            onClick={onWriteKudos}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFEA9E] px-5 py-3 text-sm font-bold text-[#00101A] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,234,158,0.45)]"
          >
            {/* mm:3204:6094 B.2_Button viết kudos — real pen icon (spec B), shared with the
                FAB's "Viết KUDOS" pill so one path definition serves both call sites. */}
            <IconPen className="size-4" />
            {t("rules:writeKudos")}
          </button>
        </div>
      </aside>
    </div>
  );
}
