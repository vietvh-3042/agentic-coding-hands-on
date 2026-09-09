import { createClient } from "@/shared/infrastructure/supabase/server";
import { starTierFromTotalReceived } from "@/features/profile/domain/hero-tier";
import type { KudoCardData, KudoPersonBlock } from "@/features/kudos/domain/types";

/** Fallback display name for an anonymous sender with no `anonymous_name`
 *  recorded (matches the pre-existing anonymous-row convention noted in
 *  `supabase/seed.sql`). Not i18n'd — a name substitute, not UI copy, same
 *  spirit as `HeroBadge`'s hardcoded "New Hero" text fallback. */
const ANONYMOUS_FALLBACK_NAME = "Ẩn danh";

/** The shape returned by `await createClient()` — not re-exported by
 *  `lib/supabase/server.ts`, so every query module derives it the same way
 *  rather than importing `@supabase/supabase-js`'s generic `SupabaseClient`
 *  (which this project's client factories aren't parameterized with — see
 *  `hashtags.ts`). */
export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Narrows an unknown DB field to a non-empty ISO timestamp string. Shared
 *  by every board-query module that reads `created_at`/`special_day_*`. */
export function isTimestampLike(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Narrows an unknown numeric DB field, falling back when it's missing or
 *  the wrong shape (e.g. a `.maybeSingle()` miss). */
export function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

/** Shared select shape for both the feed (A1) and the Highlight carousel
 *  (A2) — same joins, different ordering. Two-table double-join to
 *  `profiles` (sender/receiver) plus the hashtag and heart join tables. */
export const KUDO_SELECT = `
  id, hashtag_title, message, image_urls, hearts_count, created_at, is_anonymous, anonymous_name,
  sender:profiles!kudos_sender_id_fkey(id, display_name, hero_code, avatar_url, hero_badge),
  receiver:profiles!kudos_receiver_id_fkey(id, display_name, hero_code, avatar_url, hero_badge),
  kudo_hashtags(hashtag_id),
  kudo_hearts(user_id)
`;

/** Resolves the current signed-in viewer's id, or `null` when there is no
 *  session. `/sun-kudos` sits behind `proxy.ts`'s auth guard, so callers
 *  reached from the page itself always have a session — this still returns
 *  `null` defensively (e.g. a Server Action invoked after the session
 *  expired mid-scroll) instead of throwing. */
export async function getViewerId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
}

/** Resolves an active hashtag filter to the set of matching kudo ids via a
 *  first-pass query on the join table, rather than an embedded `!inner`
 *  filter on `kudo_hashtags` — the latter also truncates the embedded
 *  hashtag array used to render a card's OTHER chips (see phase-06 risk
 *  register). Returns `null` when no filter is active ("don't filter"),
 *  distinct from an empty array ("filter active, zero matches"). */
export async function resolveHashtagKudoIds(
  supabase: SupabaseServerClient,
  hashtagId: number | null,
): Promise<string[] | null> {
  if (hashtagId === null) return null;

  const { data, error } = await supabase.from("kudo_hashtags").select("kudo_id").eq("hashtag_id", hashtagId);
  if (error) throw new Error(`resolveHashtagKudoIds: ${error.message}`);

  return (data ?? [])
    .map((row) => (row && typeof row === "object" ? (row as Record<string, unknown>).kudo_id : null))
    .filter((id): id is string => typeof id === "string");
}

function parsePerson(raw: unknown): (KudoPersonBlock & { id: string }) | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== "string" ||
    typeof r.display_name !== "string" ||
    typeof r.hero_code !== "string" ||
    typeof r.hero_badge !== "string"
  ) {
    return null;
  }
  return {
    id: r.id,
    display_name: r.display_name,
    hero_code: r.hero_code,
    hero_badge: r.hero_badge,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
  };
}

/** Validates + normalizes one raw `kudos` row (untyped — this project's
 *  supabase-js factories aren't generic over `Database`, see `hashtags.ts`)
 *  into `KudoCardData`. Returns `null` for a structurally malformed row
 *  instead of throwing, so one bad row can't take down the whole page. */
function mapKudoRow(
  raw: unknown,
  viewerId: string,
  starTiersByReceiver: ReadonlyMap<string, number>,
): KudoCardData | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const sender = parsePerson(row.sender);
  const receiver = parsePerson(row.receiver);
  if (!sender || !receiver) return null;
  if (typeof row.id !== "string" || typeof row.created_at !== "string" || typeof row.message !== "string") {
    return null;
  }

  const hashtagRows = Array.isArray(row.kudo_hashtags) ? row.kudo_hashtags : [];
  const hashtagIds = hashtagRows
    .map((h) => (h && typeof h === "object" ? (h as Record<string, unknown>).hashtag_id : null))
    .filter((id): id is number => typeof id === "number");

  const heartRows = Array.isArray(row.kudo_hearts) ? row.kudo_hearts : [];
  const likedByMe = heartRows.some(
    (h) => h && typeof h === "object" && (h as Record<string, unknown>).user_id === viewerId,
  );

  const isAnonymous = row.is_anonymous === true;
  const anonymousName = typeof row.anonymous_name === "string" ? row.anonymous_name : null;
  const senderForDisplay = isAnonymous ? { ...sender, display_name: anonymousName ?? ANONYMOUS_FALLBACK_NAME } : sender;

  return {
    id: row.id,
    sender: senderForDisplay,
    receiver,
    createdAt: row.created_at,
    category: typeof row.hashtag_title === "string" ? row.hashtag_title : "",
    message: row.message,
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls.filter((u): u is string => typeof u === "string") : [],
    hashtagIds,
    heartsCount: typeof row.hearts_count === "number" ? row.hearts_count : 0,
    likedByMe,
    isOwnKudo: sender.id === viewerId,
    starTier: starTierFromTotalReceived(starTiersByReceiver.get(receiver.id) ?? 0),
  };
}

/** Batches ONE `profile_kudo_stats` lookup for every distinct receiver in a
 *  result page (not a per-row join) — BR-001's star tier needs
 *  `kudos_received`, which the shared `KUDO_SELECT` embed doesn't carry. */
async function fetchStarTiers(supabase: SupabaseServerClient, ids: readonly string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.from("profile_kudo_stats").select("id, kudos_received").in("id", ids);
  if (error) throw new Error(`fetchStarTiers: ${error.message}`);

  const entries = (data ?? [])
    .map((raw): [string, number] | null => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      if (typeof row.id !== "string") return null;
      return [row.id, typeof row.kudos_received === "number" ? row.kudos_received : 0];
    })
    .filter((entry): entry is [string, number] => entry !== null);

  return new Map(entries);
}

/** Maps a page of raw `kudos` rows (as returned by a `KUDO_SELECT` query)
 *  into `KudoCardData[]`, batching the star-tier lookup and dropping any
 *  structurally malformed row. */
export async function mapRowsToCards(
  supabase: SupabaseServerClient,
  rows: readonly unknown[],
  viewerId: string,
): Promise<KudoCardData[]> {
  const receiverIds = new Set<string>();
  rows.forEach((raw) => {
    if (!raw || typeof raw !== "object") return;
    const { receiver } = raw as Record<string, unknown>;
    if (receiver && typeof receiver === "object" && typeof (receiver as Record<string, unknown>).id === "string") {
      receiverIds.add((receiver as Record<string, unknown>).id as string);
    }
  });

  const starTiersByReceiver = await fetchStarTiers(supabase, [...receiverIds]);
  return rows
    .map((raw) => mapKudoRow(raw, viewerId, starTiersByReceiver))
    .filter((row): row is KudoCardData => row !== null);
}
