import { createClient } from "@/shared/infrastructure/supabase/server";
import {
  KUDO_SELECT,
  isTimestampLike,
  mapRowsToCards,
  resolveHashtagKudoIds,
} from "@/features/kudos/infrastructure/board-query-helpers";
import type { BoardFilter, KudoCardData } from "@/features/kudos/domain/types";
import type { FeedCursor, FeedPage } from "@/features/kudos/domain/feed";

export { getViewerId } from "@/features/kudos/infrastructure/board-query-helpers";
// A3/A4 live in board-aggregates.ts (split out to keep this file under 200
// lines) — re-exported here so every board-query import stays at one path.
export { getSpotlightBoard, getSidebarOverview } from "@/features/kudos/infrastructure/board-aggregates";
export type {
  SpotlightNode,
  SpotlightBoardData,
  SidebarOverview,
} from "@/features/kudos/infrastructure/board-aggregates";

/** A1 — page size for the All-Kudos feed (never stated in any spec; a
 *  plan-level decision, see plan.md "Decisions taken in this plan"). */
export const FEED_PAGE_SIZE = 10;
/** A2 — exactly 5 slides in the Highlight carousel, event-wide (FR-202). */
export const HIGHLIGHT_SIZE = 5;

/** Keyset pagination cursor for the feed — `(created_at, id)` of the last
 *  row on the previous page. Paging on `created_at DESC, id DESC` this way
 *  (not `.range()`) means a row inserted mid-scroll can't be double-served
 *  across a page boundary. */
export type { FeedCursor, FeedPage } from "@/features/kudos/domain/feed";

/** A1 — one page of the All-Kudos feed, newest-first, keyset-paginated,
 *  `is_spam` excluded, optionally narrowed to one hashtag (BR-002/BR-003). */
export async function getKudoFeedPage(params: {
  cursor: FeedCursor | null;
  filter: BoardFilter;
  viewerId: string;
}): Promise<FeedPage> {
  const supabase = await createClient();
  const matchingIds = await resolveHashtagKudoIds(supabase, params.filter.hashtagId);
  if (matchingIds !== null && matchingIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  let query = supabase
    .from("kudos")
    .select(KUDO_SELECT)
    .eq("is_spam", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (matchingIds !== null) {
    query = query.in("id", matchingIds);
  }
  if (params.cursor) {
    query = query.or(
      `created_at.lt.${params.cursor.createdAt},and(created_at.eq.${params.cursor.createdAt},id.lt.${params.cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`getKudoFeedPage: ${error.message}`);

  const rows = data ?? [];
  const items = await mapRowsToCards(supabase, rows, params.viewerId);

  const last = rows.at(-1) as Record<string, unknown> | undefined;
  const nextCursor =
    rows.length === FEED_PAGE_SIZE && last && isTimestampLike(last.created_at) && typeof last.id === "string"
      ? { createdAt: last.created_at, id: last.id }
      : null;

  return { items, nextCursor };
}

/** A2 — the top 5 kudos by heart count, event-wide, honoring the active
 *  hashtag filter (FR-202/BR-004). Tie-break is a plan-level decision
 *  (`hearts_count DESC, created_at DESC, id ASC`) for a deterministic top 5. */
export async function getHighlightKudos(filter: BoardFilter, viewerId: string): Promise<KudoCardData[]> {
  const supabase = await createClient();
  const matchingIds = await resolveHashtagKudoIds(supabase, filter.hashtagId);
  if (matchingIds !== null && matchingIds.length === 0) return [];

  let query = supabase
    .from("kudos")
    .select(KUDO_SELECT)
    .eq("is_spam", false)
    .order("hearts_count", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(HIGHLIGHT_SIZE);

  if (matchingIds !== null) {
    query = query.in("id", matchingIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getHighlightKudos: ${error.message}`);

  return mapRowsToCards(supabase, data ?? [], viewerId);
}
