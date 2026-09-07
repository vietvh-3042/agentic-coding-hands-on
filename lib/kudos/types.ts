import type { Database } from "@/lib/supabase/database.types";

/**
 * One row of the DB-backed hashtag master list (`public.hashtags`). Shared by
 * the board filter dropdown and the write-form picker so both read the same
 * 13 rows — see `hashtags.ts`.
 */
export interface Hashtag {
  id: number;
  name: string;
}

/** Star tier thresholds for a receiver's hearts-received count (ALG-001). */
export type StarTier = 0 | 1 | 2 | 3;

/** Page-level filter state lifted above the highlight carousel and the feed list. */
export interface BoardFilter {
  hashtagId: number | null;
  department: number | null;
}

/**
 * The subset of `profiles` a card needs to render a sender or receiver block.
 * Field names match the DB columns directly so callers can spread a query
 * result in without a mapping layer.
 */
export type KudoPersonBlock = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "display_name" | "avatar_url" | "hero_badge" | "hero_code"
>;

/** One kudo as rendered by a board card (feed or highlight). */
export interface KudoCardData {
  id: string;
  sender: KudoPersonBlock;
  receiver: KudoPersonBlock;
  createdAt: string;
  /** `kudos.hashtag_title` — the free-text category chip, e.g. "YOUTH IDOL". */
  category: string;
  message: string;
  imageUrls: string[];
  hashtagIds: number[];
  heartsCount: number;
  likedByMe: boolean;
  isOwnKudo: boolean;
  starTier: StarTier;
}
