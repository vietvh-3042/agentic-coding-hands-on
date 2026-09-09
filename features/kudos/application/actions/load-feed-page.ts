"use server";

import { getKudoFeedPage, getViewerId } from "@/features/kudos/infrastructure/board-queries";
import type { FeedCursor, FeedPage } from "@/features/kudos/domain/feed";
import type { BoardFilter } from "@/features/kudos/domain/types";

function isValidCursor(value: unknown): value is FeedCursor {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.createdAt === "string" && typeof v.id === "string";
}

function isValidFilter(value: unknown): value is BoardFilter {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.hashtagId === null || typeof v.hashtagId === "number") &&
    (v.department === null || typeof v.department === "number")
  );
}

/**
 * `FeedList`'s IntersectionObserver sentinel calls this Server Action to
 * fetch the next keyset page (client components can't import
 * `lib/supabase/server.ts` directly). A Server Action is a public HTTP
 * endpoint regardless of who calls it from the UI, so both arguments are
 * validated at the boundary rather than trusted as `FeedCursor`/`BoardFilter`
 * — a malformed payload falls back to "no cursor" / "no filter" instead of
 * throwing into the client.
 */
export async function loadFeedPage(cursor: unknown, filter: unknown): Promise<FeedPage> {
  const viewerId = await getViewerId();
  if (!viewerId) {
    // The board sits behind proxy.ts's auth guard, so reaching here with no
    // session means it expired mid-scroll — fail safely with an empty page
    // rather than throwing into the client.
    return { items: [], nextCursor: null };
  }

  const safeCursor = isValidCursor(cursor) ? cursor : null;
  const safeFilter: BoardFilter = isValidFilter(filter) ? filter : { hashtagId: null, department: null };

  return getKudoFeedPage({ cursor: safeCursor, filter: safeFilter, viewerId });
}
