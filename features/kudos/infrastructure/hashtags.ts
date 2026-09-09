import { createClient } from "@/shared/infrastructure/supabase/server";
import type { Hashtag } from "@/features/kudos/domain/types";

/**
 * Reads the full hashtag master list, ordered for stable dropdown rendering.
 *
 * Server-only (imports `createClient` from `lib/supabase/server.ts`, which
 * pulls in `next/headers`) and deliberately uncached: the 13 rows change
 * roughly never, so a query on every page render is correct and a cache
 * layer would be YAGNI. Both the board filter (server component) and the
 * write-form picker (client component, inside a modal) consume this same
 * list — the board calls it directly, the picker receives the resolved
 * array as a prop instead of re-fetching client-side.
 */
export async function getHashtags(): Promise<Hashtag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("hashtags").select("id, name").order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`getHashtags: failed to read public.hashtags: ${error.message}`);
  }

  // Validate at the boundary: `data` comes back untyped because the
  // supabase-js client factories in this project are not generic over
  // `Database` (a known gap — see phase-05 report). Filter out any row that
  // doesn't match the expected shape instead of trusting the network response.
  return (data ?? []).filter((row): row is Hashtag => typeof row?.id === "number" && typeof row?.name === "string");
}

/** Builds a hashtag id → name lookup so chips can render a label without re-querying. */
export function hashtagLabelMap(rows: Hashtag[]): Map<number, string> {
  return new Map(rows.map((row) => [row.id, row.name]));
}
