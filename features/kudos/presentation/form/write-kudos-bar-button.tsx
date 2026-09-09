"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";
import type { Hashtag } from "@/features/kudos/domain/types";
import KudosFormModal from "./kudos-form-modal";

export interface WriteKudosBarButtonProps {
  /** The 13 canonical rows for the write-form hashtag picker, resolved by the
   *  server wrapper (`write-kudos-bar.tsx`) since `getHashtags()` is server-only. */
  hashtags: Hashtag[];
}

/**
 * Interactive half of the give-kudos pill — Figma "A.1_Button ghi nhận"
 * (2940:13449). Split out of `write-kudos-bar.tsx` so that file can stay an
 * async server component (it resolves the hashtag rows itself). Opens the
 * shared `KudosFormModal` on click. The sibling sunner-search pill
 * (2940:13450) is a separate, not-yet-assigned piece of this row and is
 * intentionally out of scope here.
 */
export default function WriteKudosBarButton({ hashtags }: WriteKudosBarButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  return (
    <>
      {/* mm:2940:13449 */}
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 lg:px-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full max-w-184.5 items-center gap-2 rounded-[68px] border border-[#998C5F] bg-[#FFEA9E]/10 px-4 py-6 text-left transition-colors hover:bg-[#FFEA9E]/20 sm:px-6"
        >
          {/* mm:I2940:13449;186:2758 Frame 483 */}

          <span className="flex items-center gap-4">
            {/* mm:I2940:13449;186:2759 MM_MEDIA_Pen */}
            <CustomSvgIcon src="/kudos/highlight/pen.svg" className="size-8 text-white" />
            {/* mm:I2940:13449;186:2760 */}
            <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-white">
              {t("kudosBoard:writeBar.placeholder")}
            </span>
          </span>
        </button>
        <div className="relative w-95.25">
          <CustomSvgIcon
            src="/icons/search.svg"
            className="pointer-events-none absolute top-1/2 left-4 size-8 -translate-y-1/2 text-white"
          />

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("kudosBoard:searchProfile.placeholder")}
            className="h-20 w-full rounded-[68px] border border-[#998C5F] bg-[#FFEA9E]/10 pr-6 pl-14 font-(family-name:--font-montserrat) text-base text-white transition-colors outline-none"
          />
        </div>
      </div>

      <KudosFormModal open={open} onClose={() => setOpen(false)} hashtags={hashtags} />
    </>
  );
}
