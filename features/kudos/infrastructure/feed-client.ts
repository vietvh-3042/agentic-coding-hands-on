import { httpClient } from "@/shared/api/http-client";
import type { BoardFilter } from "@/features/kudos/domain/types";
import type { FeedCursor, FeedPage } from "@/features/kudos/domain/feed";

interface FeedResponse extends FeedPage {
  nextCursor: FeedCursor | null;
}

export async function fetchKudosFeedPage(cursor: FeedCursor | null, filter: BoardFilter): Promise<FeedResponse> {
  const response = await httpClient.get<FeedResponse>("/api/kudos/feed", {
    params: {
      cursor: cursor ? JSON.stringify(cursor) : undefined,
      hashtagId: filter.hashtagId ?? undefined,
      department: filter.department ?? undefined,
    },
  });

  return response.data;
}
