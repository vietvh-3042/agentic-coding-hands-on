"use client";

import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import HeartButton from "@/components/kudos-board/heart-button";
import HighlightPersonInfo from "@/components/kudos-board/highlight-person-info";
import { hashtagLabelFor } from "@/components/kudos-board/hashtag-label";
import { formatKudoTimestamp } from "@/components/kudos-board/format-kudo-timestamp";
import { renderKudoMessage } from "@/lib/kudos/render-kudo-message";
import type { Hashtag, KudoCardData } from "@/lib/kudos/types";

const MAX_HASHTAGS = 5;

// base `no-unused-vars` cannot see `tag`/`url` below are type-only parameter
// names, not real declarations — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
export interface HighlightKudoCardProps {
  kudo: KudoCardData;
  hashtags: readonly Hashtag[];
  /** Center slide is prominent + interactive; side slides are faded/read-only per spec. */
  interactive: boolean;
  /** FN-5 — the hashtag chips on this card drive the same board-wide filter
   *  as the dropdown (previously missing on this card type). */
  onHashtagClick: (tag: number) => void;
  onCopyLink: (url: string) => void;
}
/* eslint-enable no-unused-vars */

export default function HighlightKudoCard({
  kudo,
  hashtags,
  interactive,
  onHashtagClick,
  onCopyLink,
}: HighlightKudoCardProps) {
  const { t } = useTranslation();

  const visibleHashtags = kudo.hashtagIds.slice(0, MAX_HASHTAGS);
  const hasMoreHashtags = kudo.hashtagIds.length > MAX_HASHTAGS;

  return (
    // mm:2940:13465 B.3_KUDO - Highlight
    <div
      data-kudo-id={kudo.id}
      className={`flex w-132 max-w-[85vw] shrink-0 flex-col items-start gap-4 rounded-2xl border-4 border-[#FFEA9E] bg-[#FFF8E1] px-6 pt-6 pb-4 transition-all duration-300 ${
        interactive ? "opacity-100" : "pointer-events-none opacity-40"
      }`}
    >
      {/* mm:I2940:13465;335:9442 Frame 482 — two 235px person blocks fill the
          480px inner width (justify-between); the arrow overlaps the centered
          gap between them, matching the design's absolute layout. The blocks
          must not flex-shrink or the receiver overflows the card. */}
      <div className="relative flex w-full items-start justify-between">
        <HighlightPersonInfo person={kudo.sender} />
        {/* mm:I2940:13465;335:9444 B.3.4_Icon mũi tên */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center py-4 text-[#00101A]">
          <CustomSvgIcon src="/kudos/icons/send.svg" className="size-8" />
        </div>
        <HighlightPersonInfo person={kudo.receiver} starTier={kudo.starTier} />
      </div>

      {/* mm:I2940:13465;335:9447 Rectangle 14 */}
      <div className="h-px w-full bg-[#FFEA9E]" />

      {/* mm:I2940:13465;335:9448 B.4_Nội dung lời cảm ơn */}
      <div className="flex w-full flex-col items-end gap-4">
        {/* mm:I2940:13465;335:9449 B.4.1_Thời gian đăng */}
        <p className="w-full font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.5px] text-[#999999]">
          {formatKudoTimestamp(kudo.createdAt)}
        </p>
        {/* mm:I2940:13465;1810:19718 */}
        {kudo.category && (
          <p className="w-full text-center font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.5px] text-[#00101A]">
            {kudo.category}
          </p>
        )}
        {/* mm:I2940:13465;335:9450 B.4.2_Nội dung */}
        <div className="w-full rounded-xl border border-[#FFEA9E] bg-[#FFEA9E]/40 px-6 py-4">
          {/* mm:I2940:13465;662:12223 */}
          <p
            data-testid="kudo-message"
            className="line-clamp-3 text-justify font-(family-name:--font-montserrat) text-xl leading-8 font-bold text-[#00101A]"
          >
            {renderKudoMessage(kudo.message)}
          </p>
        </div>
        {/* mm:I2940:13465;335:9458 B.4.3_Hashtag — individual clickable chips
            (previously a single truncated string with no click handler). */}
        <div className="flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-1">
          {visibleHashtags.map((tag, index) => (
            <button
              key={`${kudo.id}-hashtag-${index}`}
              type="button"
              onClick={() => interactive && onHashtagClick(tag)}
              className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.5px] text-[#D4271D] hover:underline"
            >
              #{hashtagLabelFor(tag, hashtags)}
            </button>
          ))}
          {hasMoreHashtags && (
            <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.5px] text-[#D4271D]">
              ...
            </span>
          )}
        </div>
      </div>

      {/* mm:I2940:13465;335:9460 Rectangle 15 */}
      <div className="h-px w-full bg-[#FFEA9E]" />

      {/* mm:I2940:13465;335:9461 B.4.4_Action */}
      <div className="flex w-full items-center justify-between gap-6">
        {/* mm:I2940:13465;335:9672 Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              interactive &&
              onCopyLink(
                typeof window !== "undefined"
                  ? `${window.location.origin}/sun-kudos#${kudo.id}`
                  : `/sun-kudos#${kudo.id}`,
              )
            }
            className="flex cursor-pointer items-center gap-1 rounded p-4 font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-[#00101A] hover:bg-[#00101A]/5"
          >
            {t("kudosBoard:highlight.card.copyLink")}
            <CustomSvgIcon src="/kudos/icons/link.svg" className="size-6" />
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 rounded p-4 font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-[#00101A] hover:bg-[#00101A]/5"
          >
            {t("kudosBoard:highlight.card.viewDetail")}
            <CustomSvgIcon src="/icons/icon_up.svg" className="size-6" />
          </button>
        </div>
        {/* mm:I2940:13465;335:9462 Hearts */}
        <HeartButton
          kudoId={kudo.id}
          heartsCount={kudo.heartsCount}
          likedByMe={kudo.likedByMe}
          disabled={!interactive || kudo.isOwnKudo}
          ariaLabel={t("kudosBoard:highlight.card.like")}
          buttonClassName="flex cursor-pointer items-center gap-1"
          countClassName="font-(family-name:--font-montserrat) text-2xl leading-8 font-bold text-[#00101A]"
          iconClassName={(liked) => (liked ? "h-8 w-8 text-[#D4271D]" : "h-8 w-8 text-[#999999]")}
        />
      </div>
    </div>
  );
}
