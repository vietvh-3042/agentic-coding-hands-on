"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { FeedPage } from "@/features/kudos/domain/feed";
import type { Hashtag, KudoCardData } from "@/features/kudos/domain/types";
import { useKudosFeed } from "@/features/kudos/application/use-kudos-feed";
import KudoPostCard from "@/features/kudos/presentation/board/feed-kudo-post-card";
import { hashtagLabelFor } from "@/features/kudos/presentation/board/hashtag-label";
import { useHashtagFilter } from "@/features/kudos/presentation/board/use-hashtag-filter";

// base `no-unused-vars` cannot see `url` below is a type-only parameter
// name, not a real declaration — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
interface FeedListProps {
  initialPage: FeedPage;
  hashtags: readonly Hashtag[];
  onCopyLink: (url: string) => void;
}
/* eslint-enable no-unused-vars */

/**
 * `C.2_Danh sách lời cảm ơn` — the vertical KUDO Post column. The first page
 * is server-fetched (`app/sun-kudos/page.tsx`); the IntersectionObserver
 * sentinel below uses the feature's Axios adapter and API route for every
 * subsequent page. The hashtag filter is lifted to the URL (`?tag=`, FN-5/BR-002)
 * — `useHashtagFilter` reads/writes it, shared with `HighlightSection`.
 *
 * `app/sun-kudos/page.tsx` keys this component's ancestor on the active
 * filter, so a filter change fully remounts it with a fresh `initialPage` —
 * the query is initialized from the server page and then owns subsequent
 * pages, so no client-side Supabase access is needed.
 */
export default function FeedList({ initialPage, hashtags, onCopyLink }: FeedListProps) {
  const { t } = useTranslation();
  const { activeHashtagId, setHashtag } = useHashtagFilter();
  const filter = { hashtagId: activeHashtagId, department: null };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useKudosFeed(initialPage, filter);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    function handleIntersect(entries: IntersectionObserverEntry[]) {
      if (!entries[0]?.isIntersecting) return;
      if (!hasNextPageRef.current || isFetchingNextPageRef.current) return;
      isFetchingNextPageRef.current = true;
      fetchNextPage()
        .catch(() => undefined)
        .finally(() => {
          isFetchingNextPageRef.current = false;
        });
    }

    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  function handleHashtagClick(tag: number) {
    setHashtag(activeHashtagId === tag ? null : tag);
  }

  return (
    <div className="flex w-full flex-col items-start gap-6" data-testid="feed-list">
      {activeHashtagId !== null && (
        <button
          type="button"
          onClick={() => setHashtag(null)}
          className="rounded-full border border-[#FFEA9E] px-4 py-1 text-sm font-bold text-[#FFEA9E] hover:bg-[#FFEA9E]/10"
        >
          #{hashtagLabelFor(activeHashtagId, hashtags)} ×
        </button>
      )}

      {data.pages.every((page) => page.items.length === 0) ? (
        <p className="w-full py-16 text-center text-base text-[#999]">{t("kudosFeed:feed.empty")}</p>
      ) : (
        data.pages
          .flatMap((page) => page.items)
          .map((item: KudoCardData) => (
            <KudoPostCard
              key={item.id}
              kudo={item}
              hashtags={hashtags}
              onHashtagClick={handleHashtagClick}
              onCopyLink={onCopyLink}
            />
          ))
      )}

      {hasNextPage && <div ref={sentinelRef} className="h-4 w-full" aria-hidden data-testid="feed-sentinel" />}
    </div>
  );
}
