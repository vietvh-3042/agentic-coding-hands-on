import type { BoardFilter, Hashtag, KudoCardData } from "@/features/kudos/domain/types";

export type { BoardFilter, Hashtag, KudoCardData };

export interface FeedCursor {
  createdAt: string;
  id: string;
}

export interface FeedPage {
  items: KudoCardData[];
  nextCursor: FeedCursor | null;
}
