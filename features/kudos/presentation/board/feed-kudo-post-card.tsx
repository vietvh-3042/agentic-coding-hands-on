"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Hashtag, KudoCardData } from "@/features/kudos/domain/types";
import FeedImageLightbox from "@/features/kudos/presentation/board/feed-image-lightbox";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";
import HeartButton from "@/features/kudos/presentation/board/heart-button";
import FeedPostPersonBlock from "@/features/kudos/presentation/board/feed-post-person-block";
import { hashtagLabelFor } from "@/features/kudos/presentation/board/hashtag-label";
import { formatKudoTimestamp } from "@/features/kudos/presentation/board/format-kudo-timestamp";
import { renderKudoMessage } from "@/features/kudos/presentation/render-kudo-message";

const MAX_HASHTAGS = 5;

// base `no-unused-vars` cannot see `tag`/`url` below are type-only parameter
// names, not real declarations — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
interface KudoPostCardProps {
  kudo: KudoCardData;
  hashtags: readonly Hashtag[];
  onHashtagClick: (tag: number) => void;
  onCopyLink: (url: string) => void;
}
/* eslint-enable no-unused-vars */

/** `C.3_KUDO Post` instance (componentId 256:5231) — one card in the feed. */
export default function KudoPostCard({ kudo, hashtags, onHashtagClick, onCopyLink }: KudoPostCardProps) {
  const { t } = useTranslation();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  function handleCopyLink() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/sun-kudos#${kudo.id}` : `/sun-kudos#${kudo.id}`;
    onCopyLink(url);
  }

  const visibleHashtags = kudo.hashtagIds.slice(0, MAX_HASHTAGS);
  const hasMoreHashtags = kudo.hashtagIds.length > MAX_HASHTAGS;

  return (
    // mm:256:5231 C.3_KUDO Post
    <article
      data-kudo-id={kudo.id}
      className="flex w-full flex-col items-start gap-4 rounded-3xl bg-[#FFF8E1] px-10 pt-10 pb-4 font-(family-name:--font-montserrat)"
    >
      {/* mm:256:4857 Info user */}
      <div className="flex w-full items-start justify-between gap-6">
        <FeedPostPersonBlock person={kudo.sender} />
        <div className="flex h-30.75 w-8 items-start py-4">
          <CustomSvgIcon src="/kudos/icons/send.svg" className="size-8 text-[#00101A]" />
        </div>
        <FeedPostPersonBlock person={kudo.receiver} starTier={kudo.starTier} />
      </div>

      <div className="h-px w-full bg-[#FFEA9E]" />

      {/* mm:256:5645 Content */}
      <div className="flex w-full flex-col items-start gap-4">
        <p className="w-full text-base font-bold tracking-[0.5px] text-[#999]">{formatKudoTimestamp(kudo.createdAt)}</p>

        {/* mm:2234:33038 D.4_hashtag (category chip) — spec D.4 (specs.csv)
            marks this as a "filter by category" button, a free-text axis
            separate from the structured per-hashtag chips below. Not wired
            this phase (no test case/clarification backs it); rendered as
            an inert `<span>` (not `role="button"`, not focusable) so it
            isn't a dead control in the tab order while still matching the
            Figma visual. */}
        {kudo.category && (
          <div className="flex w-full items-center gap-2">
            <span className="text-base font-bold tracking-[0.5px] text-[#00101A]">{kudo.category}</span>
            <span className="flex items-center gap-1 rounded p-4 font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-[#00101A]">
              <CustomSvgIcon src="/kudos/icons/pen.svg" className="size-6" />
            </span>
          </div>
        )}

        {/* mm:662:11382 Frame 425 (message box) */}
        <div className="w-full self-stretch rounded-xl border border-[#FFEA9E] bg-[#FFEA9E]/40 px-6 py-4">
          <p data-testid="kudo-message" className="line-clamp-5 text-xl leading-8 font-bold text-[#00101A]">
            {renderKudoMessage(kudo.message)}
          </p>
        </div>

        {/* mm:256:5176 C.3.6_Image đính kèm */}
        <div className="flex w-full items-center gap-4">
          {kudo.imageUrls.map((src, index) => (
            <button
              key={`${kudo.id}-attachment-${index}`}
              type="button"
              onClick={() => setLightboxSrc(src)}
              className="relative aspect-square w-22 shrink-0 overflow-hidden rounded-[18px] border border-[#998C5F] bg-white"
            >
              <span className="absolute inset-0 m-px overflow-hidden rounded">
                <Image
                  src={src}
                  alt={t("kudosFeed:post.attachmentAlt")}
                  fill
                  className="rounded border border-[#FFEA9E] object-cover"
                  sizes="88px"
                />
              </span>
            </button>
          ))}
        </div>

        {/* mm:256:5158 C.3.7_Hash tag */}
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
          {visibleHashtags.map((tag, index) => (
            <button
              key={`${kudo.id}-hashtag-${index}`}
              type="button"
              onClick={() => onHashtagClick(tag)}
              className="text-base font-bold tracking-[0.5px] text-[#D4271D] hover:underline"
            >
              #{hashtagLabelFor(tag, hashtags)}
            </button>
          ))}
          {hasMoreHashtags && (
            <span className="text-base font-bold tracking-[0.5px] text-[#D4271D]">
              {t("kudosFeed:post.moreHashtags")}
            </span>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-[#FFEA9E]" />

      {/* mm:256:5194 C.4_Button */}
      <div className="flex w-full items-center justify-between gap-6">
        <HeartButton
          kudoId={kudo.id}
          heartsCount={kudo.heartsCount}
          likedByMe={kudo.likedByMe}
          disabled={kudo.isOwnKudo}
          ariaLabel={t("kudosFeed:post.likeAria")}
          buttonClassName="flex items-center gap-1"
          countClassName="text-2xl font-bold text-[#00101A]"
          iconClassName={(liked) => `h-8 w-8 ${liked ? "text-[#D4271D]" : "text-[#999]"}`}
        />

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1 rounded p-4 text-[#00101A] hover:bg-black/5"
        >
          <span className="text-base font-bold tracking-[0.15px]">{t("kudosFeed:post.copyLink")}</span>
          <CustomSvgIcon src="/kudos/icons/link.svg" className="size-6" />
        </button>
      </div>

      {lightboxSrc && (
        <FeedImageLightbox
          src={lightboxSrc}
          alt={t("kudosFeed:post.attachmentAlt")}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </article>
  );
}
