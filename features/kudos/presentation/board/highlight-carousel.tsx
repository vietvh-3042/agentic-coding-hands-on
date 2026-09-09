"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Hashtag, KudoCardData } from "@/features/kudos/domain/types";
import HighlightKudoCard from "./highlight-kudo-card";
import { NavArrowButton } from "./highlight-nav-arrow";

// base `no-unused-vars` cannot see `tag`/`url` below are type-only parameter
// names, not real declarations — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
interface HighlightCarouselProps {
  kudos: KudoCardData[];
  hashtags: readonly Hashtag[];
  onHashtagClick: (tag: number) => void;
  onCopyLink: (url: string) => void;
}
/* eslint-enable no-unused-vars */

/**
 * The Highlight carousel body — B.2 (slides) + B.5 (pagination bar), split
 * out of `highlight-section.tsx` to keep both files under 200 lines. Owns
 * only slide-index state; filtering/data comes from the parent via props.
 * Liked state used to be lifted here as local `useState` — phase 08 (F004)
 * replaced it with `HeartButton`'s own server-backed state, keyed by
 * `kudo.id` inside each `HighlightKudoCard`, so a reload reflects the DB
 * rather than a client-only preview.
 */
export default function HighlightCarousel({ kudos, hashtags, onHashtagClick, onCopyLink }: HighlightCarouselProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const total = kudos.length;
  const atFirst = index <= 0;
  const atLast = total === 0 || index >= total - 1;
  const current = total > 0 ? kudos[index] : null;
  const prev = index > 0 ? kudos[index - 1] : null;
  const next = index < total - 1 ? kudos[index + 1] : null;

  if (total === 0 || !current) {
    return (
      <p
        data-testid="highlight-empty"
        className="mx-auto w-full max-w-6xl px-6 py-16 text-center text-lg font-bold text-[#999999] lg:px-0"
      >
        {t("kudosBoard:highlight.empty")}
      </p>
    );
  }

  return (
    <>
      {/* mm:2940:13461 B.2_HIGHLIGHT KUDOS */}
      <div className="relative flex w-full items-center justify-center gap-6 overflow-hidden py-4">
        {/* mm:2940:13469 Frame 528 — left fade + big prev arrow */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-1/3 max-w-100 items-center justify-start pl-8"
          style={{ background: "linear-gradient(90deg, #00101A 50%, rgba(255,255,255,0) 100%)" }}
        >
          <span className="pointer-events-auto">
            {/* mm:2940:13470 B.2.1_Button lùi */}
            <NavArrowButton
              direction="left"
              size="large"
              disabled={atFirst}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              label={t("kudosBoard:highlight.pagination.prev")}
            />
          </span>
        </div>

        {prev && (
          <HighlightKudoCard
            key={prev.id}
            kudo={prev}
            hashtags={hashtags}
            interactive={false}
            onHashtagClick={onHashtagClick}
            onCopyLink={onCopyLink}
          />
        )}
        <HighlightKudoCard
          key={current.id}
          kudo={current}
          hashtags={hashtags}
          interactive
          onHashtagClick={onHashtagClick}
          onCopyLink={onCopyLink}
        />
        {next && (
          <HighlightKudoCard
            key={next.id}
            kudo={next}
            hashtags={hashtags}
            interactive={false}
            onHashtagClick={onHashtagClick}
            onCopyLink={onCopyLink}
          />
        )}

        {/* mm:2940:13467 Frame 527 — right fade + big next arrow */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-1/3 max-w-100 items-center justify-end pr-8"
          style={{ background: "linear-gradient(270deg, #00101A 50%, rgba(255,255,255,0) 100%)" }}
        >
          <span className="pointer-events-auto">
            {/* mm:2940:13468 B.2.2_Button tiến */}
            <NavArrowButton
              direction="right"
              size="large"
              disabled={atLast}
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              label={t("kudosBoard:highlight.pagination.next")}
            />
          </span>
        </div>
      </div>

      {/* mm:2940:13471 B.5_slide */}
      <div className="flex w-full items-center justify-center gap-8">
        {/* mm:2940:13472 B.5.1_Button lùi */}
        <NavArrowButton
          direction="left"
          disabled={atFirst}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          label={t("kudosBoard:highlight.pagination.prev")}
        />
        {/* mm:2940:13473 B.5.2_số trang */}
        <p
          data-testid="highlight-indicator"
          className="font-(family-name:--font-montserrat) text-[28px] leading-9 font-bold text-[#999999]"
        >
          <span className="text-[#FFEA9E]">{index + 1}</span>/{total}
        </p>
        {/* mm:2940:13474 B.5.3_Button tiến */}
        <NavArrowButton
          direction="right"
          disabled={atLast}
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          label={t("kudosBoard:highlight.pagination.next")}
        />
      </div>
    </>
  );
}
