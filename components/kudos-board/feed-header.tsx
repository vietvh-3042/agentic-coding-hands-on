"use client";

import { useTranslation } from "react-i18next";

/**
 * `C.1_Header Giải thưởng` (node 2940:14221) — full-bleed section header sitting
 * above both the feed column and the sidebar, same pattern as the awards-page
 * section headers: eyebrow subtitle, divider, then the big gold title.
 */
export default function FeedHeader() {
  const { t } = useTranslation();

  return (
    // mm:2940:14221
    <div className="mx-auto flex w-full max-w-306 flex-col gap-4 px-6">
      {/* mm:2940:14222 */}
      <p className="text-2xl leading-8 font-bold text-white">{t("kudosFeed:section.subtitle")}</p>
      {/* mm:2940:14223 Rectangle 26 */}
      <div className="h-px w-full bg-[#2E3940]" />
      {/* mm:2940:14225 */}
      <h2 className="text-[57px] leading-16 font-bold tracking-[-0.25px] text-[#FFEA9E]">
        {t("kudosFeed:section.title")}
      </h2>
    </div>
  );
}
