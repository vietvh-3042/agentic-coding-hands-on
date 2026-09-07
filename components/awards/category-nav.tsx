"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";

/**
 * Left-side category navigation — Figma "mms_C_Menu list" (313:8459).
 * Anchor ids must match the `<section>` ids rendered by AwardDetailSection.
 * Labels are resolved via i18n (`awards:categories.<id>`) at render time.
 */
const CATEGORIES = [
  { id: "top-talent" },
  { id: "top-project" },
  { id: "top-project-leader" },
  { id: "best-manager" },
  { id: "signature-2025" },
  { id: "mvp" },
] as const;

/** How long a programmatic (click) scroll suppresses the scrollspy observer. */
const CLICK_SCROLL_SUPPRESS_MS = 800;

/**
 * Sticky left navigation for the 6 award categories (Figma spec item "C").
 * Active state is driven by both an IntersectionObserver scrollspy (as each
 * award section enters the viewport) and direct clicks (smooth-scrolls to
 * the section and sets it active immediately, ignoring the observer for a
 * short window so the click target doesn't get overridden mid-scroll).
 */
export default function CategoryNav() {
  const { t } = useTranslation();
  const [active, setActive] = useState<string>(CATEGORIES[0].id);
  const suppressObserver = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActive(topMost.target.id);
      },
      { rootMargin: "-112px 0px -60% 0px", threshold: 0 },
    );

    const elements = CATEGORIES.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setActive(id);
    suppressObserver.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      suppressObserver.current = false;
    }, CLICK_SCROLL_SUPPRESS_MS);
  };

  return (
    // mm:313:8459 mms_C_Menu list
    <nav className="sticky top-24 flex w-fit shrink-0 flex-col items-start gap-4 self-start">
      {CATEGORIES.map(({ id }) => {
        const isActive = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={handleClick(id)}
            aria-current={isActive ? "true" : undefined}
            className={`flex max-w-44 items-center gap-1 p-4 font-(family-name:--font-montserrat) text-sm leading-5 font-bold tracking-[0.25px] transition-colors duration-200 ${
              isActive
                ? "border-b border-[#FFEA9E] text-[#FFEA9E] [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
                : "rounded text-white hover:bg-white/10"
            }`}
          >
            <CustomSvgIcon
              src="/icons/icon_target.svg"
              className={`size-6 ${isActive ? "text-[#FFEA9E]" : "text-white"}`}
            />
            <span>{t(`awards:categories.${id}`)}</span>
          </a>
        );
      })}
    </nav>
  );
}
