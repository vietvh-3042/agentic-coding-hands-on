"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/shared/infrastructure/supabase/server";

export type HeartKudoResult =
  | { ok: true; heartsCount: number; likedByMe: boolean }
  | { ok: false; error: "unauthenticated" | "forbidden" | "gone" | "unknown" };

/**
 * Maps a Postgres error surfaced through PostgREST to the action's typed
 * failure shape. `42501` is the RLS `with check` rejection (self-heart, or —
 * defensively — any row that somehow isn't the caller's own); `23503` is a
 * foreign-key violation (the kudo was deleted mid-click). Never re-thrown
 * to the client either way (FN-5).
 */
function mapWriteError(error: PostgrestError): "forbidden" | "gone" | "unknown" {
  if (error.code === "42501") return "forbidden";
  if (error.code === "23503") return "gone";
  return "unknown";
}

/**
 * Boundary check: a Server Action is a public HTTP endpoint regardless of
 * which component calls it, so `kudoId` is validated as a non-empty string
 * rather than trusted — an malformed id still round-trips safely to a
 * `{ error: "unknown" }` instead of a raw client/DB exception.
 */
function isValidKudoId(kudoId: unknown): kudoId is string {
  return typeof kudoId === "string" && kudoId.length > 0;
}

async function readHeartsCount(supabase: SupabaseClient, kudoId: string): Promise<number> {
  const { data, error } = await supabase.from("kudos").select("hearts_count").eq("id", kudoId).maybeSingle();
  if (error || !data || typeof data.hearts_count !== "number") return 0;
  return data.hearts_count;
}

/**
 * Inserts one `kudo_hearts` row for the signed-in caller (FN-1/A1).
 * `hearts_value` is never sent from here — `resolve_heart_value()` (BEFORE
 * INSERT trigger, `20260906192000_heart_multiplier.sql`) is the only thing
 * that decides 1 vs 2, reading `event_settings` server-side. A composite-PK
 * conflict (`23505`, a raced double-click re-sending the same like) is
 * treated as the no-op it is, not an error — the caller already has the
 * one row the constraint guarantees.
 */
export async function heartKudo(kudoId: unknown): Promise<HeartKudoResult> {
  if (!isValidKudoId(kudoId)) return { ok: false, error: "unknown" };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("kudo_hearts").insert({ kudo_id: kudoId, user_id: user.id });

  if (error && error.code !== "23505") {
    return { ok: false, error: mapWriteError(error) };
  }

  const heartsCount = await readHeartsCount(supabase, kudoId);
  revalidatePath("/sun-kudos");
  return { ok: true, heartsCount, likedByMe: true };
}

/**
 * Deletes the signed-in caller's own `kudo_hearts` row (FN-2/A2). A plain
 * delete — `sync_kudo_hearts_count()`'s DELETE branch subtracts whichever
 * `hearts_value` was actually stored on that row, so un-hearting a kudo
 * granted at 2 (special day) revokes exactly 2, even after the window has
 * closed (BR-004). Deleting an already-gone row matches zero rows and is
 * not an error — safe for a raced double-click.
 */
export async function unheartKudo(kudoId: unknown): Promise<HeartKudoResult> {
  if (!isValidKudoId(kudoId)) return { ok: false, error: "unknown" };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("kudo_hearts").delete().eq("kudo_id", kudoId).eq("user_id", user.id);

  if (error) return { ok: false, error: mapWriteError(error) };

  const heartsCount = await readHeartsCount(supabase, kudoId);
  revalidatePath("/sun-kudos");
  return { ok: true, heartsCount, likedByMe: false };
}
