"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * The board-wide hashtag filter, lifted to the URL (`?tag=<id>`) per FN-5 —
 * selecting a hashtag from either dropdown or a chip on either card type
 * re-filters the Highlight carousel and the All-Kudos feed together, and
 * survives a reload. `HighlightSection` and `FeedList` each call this hook
 * independently; both read/write the same underlying router search params,
 * so a change from either side is immediately visible to the other on the
 * next server render.
 */
export function useHashtagFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTag = searchParams.get("tag");
  const parsedTag = rawTag ? Number.parseInt(rawTag, 10) : NaN;
  const activeHashtagId = Number.isInteger(parsedTag) ? parsedTag : null;

  const setHashtag = useCallback(
    (hashtagId: number | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (hashtagId === null) {
        next.delete("tag");
      } else {
        next.set("tag", String(hashtagId));
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return { activeHashtagId, setHashtag };
}
