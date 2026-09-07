import { createClient } from "@/lib/supabase/server";
import { isTimestampLike, numberOr, type SupabaseServerClient } from "@/lib/kudos/board-query-helpers";

export interface SpotlightNode {
  id: string;
  name: string;
  /** Most recent `kudos.created_at` this recipient received — sources the
   *  word-cloud tooltip's "received at" time. */
  receivedAt: string;
}

export interface SpotlightBoardData {
  nodes: SpotlightNode[];
  totalCount: number;
}

export interface SidebarOverview {
  kudosReceived: number;
  kudosSent: number;
  heartsReceived: number;
  /** `event_settings.special_day_*` window is active right now (the "x2"
   *  badge's real source — see phase-06 key insights). */
  heartsMultiplierActive: boolean;
  secretBoxOpened: number;
  secretBoxUnopened: number;
}

function parseSpotlightRow(raw: unknown): SpotlightNode | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const { receiver } = row;
  if (!receiver || typeof receiver !== "object") return null;
  const r = receiver as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.display_name !== "string" || !isTimestampLike(row.created_at)) return null;
  return { id: r.id, name: r.display_name, receivedAt: row.created_at };
}

/** A3 — the Spotlight name cloud (every distinct recipient, latest
 *  `created_at` each) plus a totally unfiltered `COUNT(*)` (BR-005). Node
 *  scatter position/size is decorative and computed client-side — no DB
 *  column backs it (see `spotlight-board.tsx`). */
export async function getSpotlightBoard(): Promise<SpotlightBoardData> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase.from("kudos").select("*", { count: "exact", head: true });
  if (countError) throw new Error(`getSpotlightBoard: count failed: ${countError.message}`);

  const { data, error } = await supabase
    .from("kudos")
    .select("created_at, receiver:profiles!kudos_receiver_id_fkey(id, display_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getSpotlightBoard: nodes failed: ${error.message}`);

  const seen = new Set<string>();
  const nodes: SpotlightNode[] = (data ?? []).map(parseSpotlightRow).filter((node): node is SpotlightNode => {
    if (!node || seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });

  return { nodes, totalCount: count ?? 0 };
}

/** A4 — the signed-in viewer's 5 sidebar counters (FR-204). Both
 *  leaderboards have no backing table this batch (BR-006) — callers pass
 *  empty arrays, not this function's concern. */
export async function getSidebarOverview(userId: string): Promise<SidebarOverview> {
  const supabase: SupabaseServerClient = await createClient();

  const [
    { data: statsRow, error: statsError },
    { data: profileRow, error: profileError },
    { data: eventRow, error: eventError },
  ] = await Promise.all([
    supabase
      .from("profile_kudo_stats")
      .select("kudos_received, kudos_sent, hearts_received")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("boxes_opened, boxes_unopened").eq("id", userId).maybeSingle(),
    supabase.from("event_settings").select("special_day_start, special_day_end").maybeSingle(),
  ]);

  if (statsError) throw new Error(`getSidebarOverview: profile_kudo_stats failed: ${statsError.message}`);
  if (profileError) throw new Error(`getSidebarOverview: profiles failed: ${profileError.message}`);
  if (eventError) throw new Error(`getSidebarOverview: event_settings failed: ${eventError.message}`);

  const specialStart =
    eventRow && isTimestampLike(eventRow.special_day_start) ? Date.parse(eventRow.special_day_start) : null;
  const specialEnd =
    eventRow && isTimestampLike(eventRow.special_day_end) ? Date.parse(eventRow.special_day_end) : null;
  const now = Date.now();
  const heartsMultiplierActive =
    specialStart !== null && specialEnd !== null && !Number.isNaN(specialStart) && !Number.isNaN(specialEnd)
      ? now >= specialStart && now <= specialEnd
      : false;

  return {
    kudosReceived: numberOr(statsRow?.kudos_received, 0),
    kudosSent: numberOr(statsRow?.kudos_sent, 0),
    heartsReceived: numberOr(statsRow?.hearts_received, 0),
    heartsMultiplierActive,
    secretBoxOpened: numberOr(profileRow?.boxes_opened, 0),
    secretBoxUnopened: numberOr(profileRow?.boxes_unopened, 0),
  };
}
