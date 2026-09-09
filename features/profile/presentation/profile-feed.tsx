"use client";

import { useEffect, useRef } from "react";
import type { Hashtag } from "@/features/kudos/domain/types";
import type { ProfileFeedCard } from "@/features/profile/domain/types";
import KudoPostCard from "@/features/kudos/presentation/board/feed-kudo-post-card";

// base `no-unused-vars` cannot see `tag`/`url` below are type-only parameter
// names, not real declarations — see kudos-hashtag-input.tsx's own note on
// the same limitation.
/* eslint-disable no-unused-vars */
export interface ProfileFeedProps {
  items: readonly ProfileFeedCard[];
  hashtags: readonly Hashtag[];
  hasMore: boolean;
  /** True while a page fetch (initial-direction-load or scroll-triggered)
   *  is in flight — gates the sentinel from firing twice for the same
   *  page (`FUN_013`) and swaps its loading label for the end-of-feed one
   *  when it settles. Owned by the section, not this component. */
  isLoadingMore: boolean;
  emptyMessage: string;
  loadingMoreMessage: string;
  endOfFeedMessage: string;
  onLoadMore: () => void;
  onHashtagClick: (tag: number) => void;
  onCopyLink: (url: string) => void;
}
/* eslint-enable no-unused-vars */

/**
 * `ProfileFeed` — FR-B505/509 (`GUI_006`/`FUN_013`). Renders imported board
 * cards only (no card markup of its own — `GUI_006` forbids a second card
 * component) plus the IntersectionObserver sentinel and the two/three copy
 * states (empty, loading-more, end-of-feed). All list/cursor state
 * (`items`, `hasMore`) is owned by `profile-kudos-section.tsx`; this
 * component only renders what it's given and asks for more.
 *
 * The section mounts this component with `key={direction}`, so a direction
 * switch is a fresh mount, not a prop update — that restores
 * `components/kudos-board/feed-list.tsx`'s own invariant ("`hasMore` only
 * ever transitions true → false, never back") for THIS mount, which is why
 * the observer below can reuse that file's "create once, empty deps"
 * pattern unchanged. Without the remount, a direction switch could hand
 * this component a `hasMore` that goes false → true (the new list has more
 * pages even though the old one had none left), which the board's pattern
 * was never built to handle.
 */
export default function ProfileFeed({
  items,
  hashtags,
  hasMore,
  isLoadingMore,
  emptyMessage,
  loadingMoreMessage,
  endOfFeedMessage,
  onLoadMore,
  onHashtagClick,
  onCopyLink,
}: ProfileFeedProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(isLoadingMore);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    isLoadingRef.current = isLoadingMore;
  }, [isLoadingMore]);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    function handleIntersect(entries: IntersectionObserverEntry[]) {
      if (!entries[0]?.isIntersecting) return;
      if (isLoadingRef.current) return;
      onLoadMoreRef.current();
    }

    const observer = new IntersectionObserver(handleIntersect, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
    // Empty deps, deliberately — see the doc comment above: this mount's
    // `hasMore` only ever goes true -> false, so there is nothing later to
    // re-observe, and recreating this on every render would double-fetch a
    // still-intersecting sentinel (the exact bug `feed-list.tsx` documents).
  }, []);

  if (items.length === 0) {
    return (
      <p data-testid="profile-feed-empty" className="w-full py-16 text-center text-base text-[#999]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6" data-testid="profile-feed-list">
      {items.map((item) => (
        <KudoPostCard
          key={item.id}
          kudo={item}
          hashtags={hashtags}
          onHashtagClick={onHashtagClick}
          onCopyLink={onCopyLink}
        />
      ))}

      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex w-full flex-col items-center gap-1 py-2"
          data-testid="profile-feed-sentinel"
        >
          {isLoadingMore && <span className="text-sm text-[#999]">{loadingMoreMessage}</span>}
        </div>
      )}
      {!hasMore && (
        <p data-testid="profile-feed-end" className="w-full py-6 text-center text-sm text-[#999]">
          {endOfFeedMessage}
        </p>
      )}
    </div>
  );
}
