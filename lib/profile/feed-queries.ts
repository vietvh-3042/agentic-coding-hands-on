import { createClient } from "@/lib/supabase/server";
import { KUDO_SELECT, getViewerId, isTimestampLike, mapRowsToCards, numberOr } from "@/lib/kudos/board-query-helpers";
import { FEED_PAGE_SIZE, type FeedCursor } from "@/lib/kudos/board-queries";
import type { KudoPersonBlock } from "@/lib/kudos/types";
import { starTierFromTotalReceived } from "@/lib/profile/hero-tier";
import type { ProfileFeedCard, ProfileFeedPage } from "@/lib/profile/types";

/** FR-B205/206 — the two directional Kudo feeds. Split out from `queries.ts`
 *  to keep both files under the 200-line ceiling, per concern. Server-only
 *  via `createClient()` — see that file's header comment. */

function nextCursorFrom(rows: readonly Record<string, unknown>[]): FeedCursor | null {
  const last = rows.at(-1);
  return rows.length === FEED_PAGE_SIZE && last && isTimestampLike(last.created_at) && typeof last.id === "string"
    ? { createdAt: last.created_at, id: last.id }
    : null;
}

/** FR-B205 — Kudos received by `id`, newest-first, keyset-paginated. Reuses
 *  the board's exact select shape and mapper (`KUDO_SELECT`,
 *  `mapRowsToCards`), so an anonymous sender is masked here exactly as on
 *  the live board (`TC_GUI_006`). */
export async function getReceivedFeed(id: string, cursor: FeedCursor | null): Promise<ProfileFeedPage> {
  const supabase = await createClient();
  const viewerId = await getViewerId();

  let query = supabase
    .from("kudos")
    .select(KUDO_SELECT)
    .eq("receiver_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getReceivedFeed: ${error.message}`);

  const rows = (data ?? []) as Record<string, unknown>[];
  const cards = await mapRowsToCards(supabase, rows, viewerId ?? "");
  const items: ProfileFeedCard[] = cards.map((card, index) => ({
    ...card,
    status: rows[index]?.is_spam === true ? "spam" : "none",
    sentAnonymously: rows[index]?.is_anonymous === true,
  }));

  return { items, nextCursor: nextCursorFrom(rows) };
}

/** Validates one `profiles` row into `KudoPersonBlock` at the boundary —
 *  used for both the caller's own profile and a sent row's receiver. */
function parsePersonBlock(raw: unknown): (KudoPersonBlock & { id: string }) | null {
  const r = raw as Record<string, unknown> | null;
  const ok =
    r &&
    typeof r.id === "string" &&
    typeof r.display_name === "string" &&
    typeof r.hero_code === "string" &&
    typeof r.hero_badge === "string";
  if (!ok) return null;
  return {
    id: r.id as string,
    display_name: r.display_name as string,
    hero_code: r.hero_code as string,
    hero_badge: r.hero_badge as string,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
  };
}

const SENT_SELECT =
  "id, receiver_id, hashtag_title, message, image_urls, hearts_count, is_spam, is_anonymous, anonymous_name, created_at";

/** Fetches the side-tables a page of sent rows needs (receivers, hashtags,
 *  hearts, star-tier denominators) in one batch each, never per-row. */
async function fetchSentFeedSideTables(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: readonly Record<string, unknown>[],
) {
  const kudoIds = rows.map((row) => row.id).filter((v): v is string => typeof v === "string");
  const receiverIds = [
    ...new Set(rows.map((row) => row.receiver_id).filter((v): v is string => typeof v === "string")),
  ];

  const [receiversResult, hashtagsResult, heartsResult, statsResult] = await Promise.all([
    receiverIds.length
      ? supabase.from("profiles").select("id, display_name, hero_code, hero_badge, avatar_url").in("id", receiverIds)
      : Promise.resolve({ data: [], error: null }),
    kudoIds.length
      ? supabase.from("kudo_hashtags").select("kudo_id, hashtag_id").in("kudo_id", kudoIds)
      : Promise.resolve({ data: [], error: null }),
    kudoIds.length
      ? supabase.from("kudo_hearts").select("kudo_id, user_id").in("kudo_id", kudoIds)
      : Promise.resolve({ data: [], error: null }),
    receiverIds.length
      ? supabase.from("profile_kudo_stats").select("id, kudos_received").in("id", receiverIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (receiversResult.error) throw new Error(`getSentFeed: ${receiversResult.error.message}`);
  if (hashtagsResult.error) throw new Error(`getSentFeed: ${hashtagsResult.error.message}`);
  if (heartsResult.error) throw new Error(`getSentFeed: ${heartsResult.error.message}`);
  if (statsResult.error) throw new Error(`getSentFeed: ${statsResult.error.message}`);

  const receiversById = new Map(
    (receiversResult.data ?? []).map((row) => [(row as { id: string }).id, parsePersonBlock(row)] as const),
  );
  const starTiersByReceiver = new Map(
    (statsResult.data ?? []).map((row) => [
      (row as Record<string, unknown>).id as string,
      numberOr((row as Record<string, unknown>).kudos_received, 0),
    ]),
  );
  return {
    receiversById,
    hashtagRows: hashtagsResult.data ?? [],
    heartRows: heartsResult.data ?? [],
    starTiersByReceiver,
  };
}

/** FR-B205/206, `SEC_002`/`SEC_003` — the caller's OWN Kudos sent, newest-
 *  first, keyset-paginated. Takes NO target parameter — `sender_id =
 *  auth.uid()` on `kudos_sent_for_caller` is the entire boundary (`SEC_003`).
 *  Never add one "for symmetry": that would defeat the view's WHERE clause
 *  as the security guarantee. The sender shown on every card is the
 *  caller's own (real, unmasked) profile, even for a row sent anonymously
 *  (`SEC_002`) — `sentAnonymously` still carries that fact for the UI. */
export async function getSentFeed(cursor: FeedCursor | null): Promise<ProfileFeedPage> {
  const supabase = await createClient();
  const callerId = await getViewerId();
  if (!callerId) return { items: [], nextCursor: null };

  const { data: callerProfileRow, error: callerProfileError } = await supabase
    .from("profiles")
    .select("id, display_name, hero_code, hero_badge, avatar_url")
    .eq("id", callerId)
    .maybeSingle();
  if (callerProfileError) throw new Error(`getSentFeed: ${callerProfileError.message}`);
  const callerBlock = parsePersonBlock(callerProfileRow);
  if (!callerBlock) return { items: [], nextCursor: null };

  let query = supabase
    .from("kudos_sent_for_caller")
    .select(SENT_SELECT)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getSentFeed: ${error.message}`);
  const rows = (data ?? []) as Record<string, unknown>[];

  const { receiversById, hashtagRows, heartRows, starTiersByReceiver } = await fetchSentFeedSideTables(supabase, rows);

  const items: ProfileFeedCard[] = rows
    .map((row): ProfileFeedCard | null => {
      const receiver = receiversById.get(row.receiver_id as string);
      const rowOk = typeof row.id === "string" && typeof row.created_at === "string" && typeof row.message === "string";
      if (!receiver || !rowOk) return null;

      const hashtagIds = hashtagRows
        .filter((h) => (h as Record<string, unknown>).kudo_id === row.id)
        .map((h) => (h as Record<string, unknown>).hashtag_id)
        .filter((hid): hid is number => typeof hid === "number");
      const likedByMe = heartRows.some(
        (h) => (h as Record<string, unknown>).kudo_id === row.id && (h as Record<string, unknown>).user_id === callerId,
      );

      return {
        id: row.id as string,
        sender: callerBlock,
        receiver,
        createdAt: row.created_at as string,
        category: typeof row.hashtag_title === "string" ? row.hashtag_title : "",
        message: row.message as string,
        imageUrls: Array.isArray(row.image_urls)
          ? row.image_urls.filter((u): u is string => typeof u === "string")
          : [],
        hashtagIds,
        heartsCount: typeof row.hearts_count === "number" ? row.hearts_count : 0,
        likedByMe,
        isOwnKudo: true,
        starTier: starTierFromTotalReceived(starTiersByReceiver.get(receiver.id) ?? 0),
        status: row.is_spam === true ? "spam" : "none",
        sentAnonymously: row.is_anonymous === true,
      };
    })
    .filter((card): card is ProfileFeedCard => card !== null);

  return { items, nextCursor: nextCursorFrom(rows) };
}
