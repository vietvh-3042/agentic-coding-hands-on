import type { Hashtag } from "@/features/kudos/domain/types";

/**
 * Looks up a hashtag id's display label from the already-fetched hashtag
 * list. Deliberately does NOT import `lib/kudos/hashtags.ts` — that module
 * pulls in `lib/supabase/server.ts` (`next/headers`) at module scope, so
 * importing it from a client component (every card that renders a chip) would
 * break the server/client boundary. `hashtags` is small (13 rows), so a
 * linear scan per chip is simpler than threading a `Map` through props (a
 * `Map` also isn't serializable across the Server → Client Component
 * boundary, unlike this plain array).
 */
export function hashtagLabelFor(hashtagId: number, hashtags: readonly Hashtag[]): string {
  return hashtags.find((h) => h.id === hashtagId)?.name ?? "";
}
