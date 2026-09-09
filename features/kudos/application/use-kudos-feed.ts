"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { BoardFilter } from "@/features/kudos/domain/types";
import type { FeedCursor, FeedPage } from "@/features/kudos/domain/feed";
import { fetchKudosFeedPage } from "@/features/kudos/infrastructure/feed-client";

export function useKudosFeed(initialPage: FeedPage, filter: BoardFilter) {
  return useInfiniteQuery({
    queryKey: ["kudos", "feed", filter],
    initialPageParam: null as FeedCursor | null,
    initialData: {
      pages: [initialPage],
      pageParams: [null],
    },
    queryFn: ({ pageParam }) => fetchKudosFeedPage(pageParam, filter),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
