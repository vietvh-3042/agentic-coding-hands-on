"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { loadFeedPage } from "@/app/sun-kudos/actions/load-feed-page";
import type { FeedCursor, FeedPage } from "@/lib/kudos/board-queries";
import type { Hashtag, KudoCardData } from "@/lib/kudos/types";
import KudoPostCard from "@/components/kudos-board/feed-kudo-post-card";
import { hashtagLabelFor } from "@/components/kudos-board/hashtag-label";
import { useHashtagFilter } from "@/components/kudos-board/use-hashtag-filter";

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
 * sentinel below calls the `loadFeedPage` Server Action for every
 * subsequent page (a client component can't import `lib/supabase/server.ts`
 * directly). The hashtag filter is lifted to the URL (`?tag=`, FN-5/BR-002)
 * — `useHashtagFilter` reads/writes it, shared with `HighlightSection`.
 *
 * `app/sun-kudos/page.tsx` keys this component's ancestor on the active
 * filter, so a filter change fully remounts it with a fresh `initialPage` —
 * `items`/`cursor` only ever need to be initialized once per mount, never
 * re-synced from a changed prop.
 */
export default function FeedList({ initialPage, hashtags, onCopyLink }: FeedListProps) {
  const { t } = useTranslation();
  const { activeHashtagId, setHashtag } = useHashtagFilter();
  const [items, setItems] = useState<KudoCardData[]>(initialPage.items);
  const [cursor, setCursor] = useState<FeedCursor | null>(initialPage.nextCursor);
  const [, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Read inside the observer callback instead of as effect dependencies —
  // see the effect below for why: recreating the IntersectionObserver on
  // every `cursor` change fires it immediately for a still-visible sentinel,
  // double-fetching the same page (found by SC-001's dedup assertion).
  const cursorRef = useRef(cursor);
  const activeHashtagIdRef = useRef(activeHashtagId);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  useEffect(() => {
    activeHashtagIdRef.current = activeHashtagId;
  }, [activeHashtagId]);

  const hasMore = cursor !== null;

  // Deliberately an empty dependency array: the observer is created ONCE
  // per mount (the sentinel `<div>` itself only exists while `hasMore`, and
  // `hasMore` only ever transitions true → false, never back — so there is
  // nothing to re-observe later). Re-creating this observer whenever
  // `cursor` changed used to cause a spurious extra fetch: `.observe()` on
  // an element that is STILL intersecting fires the callback again right
  // away, appending the same page twice.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    function handleIntersect(entries: IntersectionObserverEntry[]) {
      if (!entries[0]?.isIntersecting) return;
      if (isFetchingRef.current || cursorRef.current === null) return;
      isFetchingRef.current = true;

      startTransition(() => {
        loadFeedPage(cursorRef.current, { hashtagId: activeHashtagIdRef.current, department: null })
          .then((page) => {
            setItems((current) => [...current, ...page.items]);
            setCursor(page.nextCursor);
          })
          .catch(() => {
            // Best-effort infinite scroll: a failed page fetch just stops
            // appending. The sentinel stays mounted, so scrolling further
            // retries on the next intersection instead of wedging the feed.
          })
          .finally(() => {
            isFetchingRef.current = false;
          });
      });
    }

    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

      {items.length === 0 ? (
        <p className="w-full py-16 text-center text-base text-[#999]">{t("kudosFeed:feed.empty")}</p>
      ) : (
        items.map((item) => (
          <KudoPostCard
            key={item.id}
            kudo={item}
            hashtags={hashtags}
            onHashtagClick={handleHashtagClick}
            onCopyLink={onCopyLink}
          />
        ))
      )}

      {hasMore && <div ref={sentinelRef} className="h-4 w-full" aria-hidden data-testid="feed-sentinel" />}
    </div>
  );
}
