"use server";

import { getReceivedFeed, getSentFeed } from "@/lib/profile/feed-queries";
import { UUID_PATTERN } from "@/lib/profile/resolve-target";
import { getViewerId, type FeedCursor } from "@/lib/kudos/board-queries";
import type { ProfileFeedPage } from "@/lib/profile/types";
import type { ProfileFeedDirection } from "@/components/profile/profile-direction-dropdown";

/**
 * `ProfileKudosSection`'s IntersectionObserver sentinel and its direction
 * switch both call this Server Action — a client component can't import
 * `lib/profile/feed-queries.ts` directly (it pulls in `next/headers` via
 * `lib/supabase/server.ts`). Mirrors `app/sun-kudos/actions/load-feed-page.ts`'s
 * boundary-validation shape: a Server Action is a public HTTP endpoint
 * regardless of which component calls it, so every argument is validated
 * here rather than trusted as `ProfileFeedDirection`/`FeedCursor`/`string`.
 *
 * `direction === "sent"` NEVER forwards `targetId` to `getSentFeed` — that
 * function takes no target parameter by design (`kudos_sent_for_caller`'s
 * own `WHERE sender_id = auth.uid()` is the entire boundary, `SEC_003`, see
 * `feed-queries.ts`'s doc comment). `targetId` only feeds the "received"
 * branch, where it is public information (a Sunner's received Kudos are
 * visible on the board to begin with).
 */
function isValidDirection(value: unknown): value is ProfileFeedDirection {
  return value === "received" || value === "sent";
}

/** Both halves of the keyset cursor are checked by SHAPE, not just by type.
 *  `id` reaches a `uuid` column and `createdAt` a `timestamptz` one, so a
 *  well-typed but malformed value would raise Postgres `22P02` and surface as
 *  a 500 — the same failure mode `TC_FUN_004`'s `?id` gate exists to prevent.
 *  Guarding one boundary and not the other would be inconsistent. */
function isValidCursor(value: unknown): value is FeedCursor {
  if (typeof value !== "object" || value === null) return false;
  const cursor = value as Record<string, unknown>;
  if (typeof cursor.createdAt !== "string" || typeof cursor.id !== "string") return false;
  if (!UUID_PATTERN.test(cursor.id)) return false;
  return Number.isFinite(Date.parse(cursor.createdAt));
}

function isValidTargetId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function loadProfileFeedPage(
  direction: unknown,
  targetId: unknown,
  cursor: unknown,
): Promise<ProfileFeedPage> {
  const viewerId = await getViewerId();
  if (!viewerId || !isValidDirection(direction)) {
    // The screen sits behind proxy.ts's auth guard, so reaching here with no
    // session means it expired mid-scroll — fail safely with an empty page
    // rather than throwing into the client (same convention as
    // `loadFeedPage`).
    return { items: [], nextCursor: null };
  }

  const safeCursor = isValidCursor(cursor) ? cursor : null;

  if (direction === "sent") {
    return getSentFeed(safeCursor);
  }

  if (!isValidTargetId(targetId)) {
    return { items: [], nextCursor: null };
  }
  return getReceivedFeed(targetId, safeCursor);
}
