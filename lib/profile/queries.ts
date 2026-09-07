import { createClient } from "@/lib/supabase/server";
import { numberOr, type SupabaseServerClient } from "@/lib/kudos/board-query-helpers";
import { heroTierFromDistinctSenders, starTierFromTotalReceived } from "@/lib/profile/hero-tier";
import type { ProfileHeader, ProfileIconSlot, ProfileStats } from "@/lib/profile/types";

/**
 * Server-only: every export here goes through `createClient()`
 * (`@/lib/supabase/server`), which pulls in `next/headers` — the same
 * convention `lib/kudos/hashtags.ts` and `lib/kudos/board-queries.ts` use
 * instead of the `server-only` package (not a project dependency). This
 * module must never be imported from a client component.
 *
 * Feed pagination (`getReceivedFeed`/`getSentFeed`) lives in
 * `feed-queries.ts` — split out to keep this file under the 200-line
 * ceiling, per concern (single-row lookups here, keyset-paginated lists
 * there), not by arbitrary size.
 */

/** Number of distinct `kudos.sender_id` values for a receiver — the Hero
 *  tier's denominator (Q3, clarifications.md). No aggregate view exposes
 *  this today, so it is counted here from the raw ids rather than adding a
 *  migration for a single derived number. Only the resulting COUNT is ever
 *  returned to a caller; the raw sender ids themselves never leave this
 *  function (SEC_004 stays intact even though `sender_id` is read). */
async function countDistinctSenders(supabase: SupabaseServerClient, receiverId: string): Promise<number> {
  const { data, error } = await supabase.from("kudos").select("sender_id").eq("receiver_id", receiverId);
  if (error) throw new Error(`countDistinctSenders: ${error.message}`);

  const ids = new Set(
    (data ?? [])
      .map((row) => (row && typeof row === "object" ? (row as Record<string, unknown>).sender_id : null))
      .filter((id): id is string => typeof id === "string"),
  );
  return ids.size;
}

/** FR-B202 — the keyvisual hero. `null` for an unknown well-formed uuid
 *  (`FUN_003`). `department` reads `profiles.hero_code` (there is no
 *  `departments` table — Q1/Q2) and is `null` for an empty value
 *  (`TC_GUI_009`). */
export async function getProfileHeader(id: string): Promise<ProfileHeader | null> {
  const supabase = await createClient();

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, hero_code")
    .eq("id", id)
    .maybeSingle();
  if (profileError) throw new Error(`getProfileHeader: ${profileError.message}`);
  if (!profileRow) return null;

  const { data: statsRow, error: statsError } = await supabase
    .from("profile_kudo_stats")
    .select("kudos_received")
    .eq("id", id)
    .maybeSingle();
  if (statsError) throw new Error(`getProfileHeader: ${statsError.message}`);

  const totalReceived = numberOr((statsRow as { kudos_received?: unknown } | null)?.kudos_received, 0);
  const distinctSenders = await countDistinctSenders(supabase, id);
  const heroCode = profileRow.hero_code;
  const department = typeof heroCode === "string" && heroCode.trim().length > 0 ? heroCode : null;

  return {
    id: profileRow.id as string,
    displayName: profileRow.display_name as string,
    avatarUrl: typeof profileRow.avatar_url === "string" ? profileRow.avatar_url : null,
    department,
    heroTier: heroTierFromDistinctSenders(distinctSenders),
    totalReceived,
    starTier: starTierFromTotalReceived(totalReceived),
  };
}

/** FR-B203, `SEC_001` — the five statistics-card counters, returned ONLY
 *  when `id === callerId`. One data-level branch decides self/other exactly
 *  once; every caller downstream inherits it. */
export async function getProfileStats(id: string, callerId: string): Promise<ProfileStats | null> {
  if (id !== callerId) return null;

  const supabase = await createClient();
  const [{ data: statsRow, error: statsError }, { data: boxesRow, error: boxesError }] = await Promise.all([
    supabase
      .from("profile_kudo_stats")
      .select("kudos_received, kudos_sent, hearts_received")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("profiles").select("boxes_opened, boxes_unopened").eq("id", id).maybeSingle(),
  ]);
  if (statsError) throw new Error(`getProfileStats: ${statsError.message}`);
  if (boxesError) throw new Error(`getProfileStats: ${boxesError.message}`);
  if (!statsRow || !boxesRow) return null;

  const stats = statsRow as Record<string, unknown>;
  const boxes = boxesRow as Record<string, unknown>;
  return {
    kudosReceived: numberOr(stats.kudos_received, 0),
    kudosSent: numberOr(stats.kudos_sent, 0),
    heartsReceived: numberOr(stats.hearts_received, 0),
    boxesOpened: numberOr(boxes.boxes_opened, 0),
    boxesUnopened: numberOr(boxes.boxes_unopened, 0),
  };
}

/** FR-B204, `TC_GUI_002` — all 6 `secret_box_icons` rows, in `sort_order`,
 *  each flagged `unlocked` against `user_icon_unlocks`. Always 6 slots, so
 *  the UI never has to guess which are missing. */
export async function getUnlockedIcons(id: string): Promise<ProfileIconSlot[]> {
  const supabase = await createClient();

  const [{ data: icons, error: iconsError }, { data: unlocks, error: unlocksError }] = await Promise.all([
    supabase
      .from("secret_box_icons")
      .select("id, name, image_url, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("user_icon_unlocks").select("icon_id").eq("user_id", id),
  ]);
  if (iconsError) throw new Error(`getUnlockedIcons: ${iconsError.message}`);
  if (unlocksError) throw new Error(`getUnlockedIcons: ${unlocksError.message}`);

  const unlockedIds = new Set(
    (unlocks ?? [])
      .map((row) => (row && typeof row === "object" ? (row as Record<string, unknown>).icon_id : null))
      .filter((iconId): iconId is string => typeof iconId === "string"),
  );

  return (icons ?? [])
    .filter((row): row is { id: string; name: string; image_url: string; sort_order: number } => {
      const r = row as Record<string, unknown>;
      return typeof r?.id === "string" && typeof r?.name === "string" && typeof r?.image_url === "string";
    })
    .map((row) => ({ id: row.id, name: row.name, imageUrl: row.image_url, unlocked: unlockedIds.has(row.id) }));
}
