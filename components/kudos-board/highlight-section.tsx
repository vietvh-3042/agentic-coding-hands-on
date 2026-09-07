"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DEPARTMENTS, departmentLabel, type IOption } from "@/constants";
import type { Hashtag, KudoCardData } from "@/lib/kudos/types";
import HighlightFilterDropdown from "./highlight-filter-dropdown";
import HighlightCarousel from "./highlight-carousel";
import { useCopyLinkToast } from "./use-copy-link-toast";
import { useHashtagFilter } from "./use-hashtag-filter";

interface HighlightSectionProps {
  hashtags: readonly Hashtag[];
  kudos: KudoCardData[];
}

/**
 * HIGHLIGHT KUDOS carousel — Figma "B_Highlight" (2940:13451): header +
 * Hashtag/department filters (B.1) + 5-slide carousel (delegated to
 * `HighlightCarousel`) + pagination bar (B.5). `kudos` is server-fetched
 * (top 5 by hearts, already hashtag-filtered) by `app/sun-kudos/page.tsx`.
 *
 * The hashtag filter is lifted to the URL (BR-002/FN-5), shared with
 * `FeedList` via `useHashtagFilter`. The department filter has no confirmed
 * data source (D001 — `DEPARTMENTS` stays hardcoded) so it stays local,
 * client-only, and narrows only the already-fetched top 5 rather than
 * re-querying — this is the same decorative behavior the pre-migration mock
 * data had, now applied to real rows.
 */
export default function HighlightSection({ hashtags, kudos }: HighlightSectionProps) {
  const { t } = useTranslation();
  const { copyLink, toast } = useCopyLinkToast();
  const { activeHashtagId, setHashtag } = useHashtagFilter();
  const [department, setDepartment] = useState<number | null>(null);

  const hashtagOptions: IOption[] = hashtags.map((h) => ({ value: h.id, label: `#${h.name}` }));

  const filtered = kudos.filter((k) => {
    if (department === null) return true;
    const label = departmentLabel(department);
    return k.sender.hero_code === label || k.receiver.hero_code === label;
  });

  function handleSelectDepartment(value: number | null) {
    setDepartment(value);
  }

  return (
    // mm:2940:13451
    <section className="flex w-full flex-col gap-10">
      {/* mm:2940:13452 B.1_header */}
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-0">
        <div className="flex flex-col items-start gap-4">
          {/* mm:2940:13454 */}
          <p className="font-(family-name:--font-montserrat) text-2xl leading-8 font-bold text-white">
            {t("kudosBoard:highlight.eyebrow")}
          </p>
          {/* mm:2940:13455 Rectangle 26 */}
          <div className="h-px w-full bg-[#2E3940]" />
          {/* mm:2940:13456 Frame 488 */}
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            {/* mm:2940:13457 */}
            <h2 className="leading-1.1 font-(family-name:--font-montserrat) text-4xl font-bold tracking-[-0.25px] text-[#FFEA9E] lg:text-[57px] lg:leading-16">
              {t("kudosBoard:highlight.title")}
            </h2>
            {/* mm:2940:13458 Buttons */}
            <div className="flex items-center gap-2">
              <HighlightFilterDropdown
                label={t("kudosBoard:highlight.filters.hashtag")}
                options={hashtagOptions}
                selected={activeHashtagId}
                onSelect={setHashtag}
                testId="hashtag-filter"
              />
              <HighlightFilterDropdown
                label={t("kudosBoard:highlight.filters.department")}
                options={DEPARTMENTS}
                selected={department}
                onSelect={handleSelectDepartment}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remounts (and so resets its slide index) whenever either filter
          changes — the section keyed on the pair rather than a
          useEffect chasing it, per BR-002's "resets the carousel to slide 1". */}
      <HighlightCarousel
        key={`${activeHashtagId ?? "all"}-${department ?? "all"}`}
        kudos={filtered}
        hashtags={hashtags}
        onHashtagClick={(tag) => setHashtag(activeHashtagId === tag ? null : tag)}
        onCopyLink={copyLink}
      />

      {toast}
    </section>
  );
}
