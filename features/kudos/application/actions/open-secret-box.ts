"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/infrastructure/supabase/server";
import type { Database } from "@/shared/infrastructure/supabase/database.types";

type OpenSecretBoxRow = Database["public"]["Functions"]["open_secret_box"]["Returns"][number];
type ProfileCounters = Pick<Database["public"]["Tables"]["profiles"]["Row"], "boxes_opened" | "boxes_unopened">;

export interface DrawnSecretBoxIcon {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface OpenSecretBoxSuccess {
  ok: true;
  icon: DrawnSecretBoxIcon;
  boxesOpened: number;
  boxesUnopened: number;
}

export interface OpenSecretBoxFailure {
  ok: false;
  /** "empty" is the expected, user-facing rejection (BR-004); "unauthenticated"
   *  and "unknown" are defensive paths the UI still must not crash on. */
  error: "unauthenticated" | "empty" | "unknown";
}

export type OpenSecretBoxResult = OpenSecretBoxSuccess | OpenSecretBoxFailure;

/**
 * Draws one secret-box badge for the signed-in user over the parameterless,
 * `security definer` `open_secret_box()` RPC (supabase/migrations/
 * 20260906192500_secret_box_draw.sql). That RPC is the only writer of
 * `profiles.boxes_*` and `user_icon_unlocks` — this action relays exactly
 * what the database returned and never computes a badge or a count itself
 * (FN-2). The RPC raises `no_unopened_boxes` at 0 remaining (FN-3) and is
 * atomic against a double-click via its own row lock (BR-002).
 *
 * `createClient()` (lib/supabase/server.ts) is not parameterized with the
 * generated `Database` type — an existing project pattern outside this
 * task's scope — so `supabase.rpc(...)`'s result resolves to `any`. The
 * assertion below binds it to the RPC's real generated return shape instead
 * of letting `any` leak into the action's typed public result.
 */
export async function openSecretBox(): Promise<OpenSecretBoxResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "unauthenticated" };
  }

  const { data, error } = await supabase.rpc("open_secret_box");

  if (error) {
    if (error.message.includes("no_unopened_boxes")) {
      return { ok: false, error: "empty" };
    }
    return { ok: false, error: "unknown" };
  }

  const rows = data as OpenSecretBoxRow[] | null;
  const row = rows?.[0];

  if (!row) {
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/sun-kudos");

  return {
    ok: true,
    icon: { id: row.icon_id, name: row.icon_name, imageUrl: row.icon_image_url },
    boxesOpened: row.boxes_opened,
    boxesUnopened: row.boxes_unopened,
  };
}

/**
 * Reads the signed-in user's own `boxes_unopened`/`boxes_opened` straight off
 * `profiles` (SELECT is granted to every authenticated user on all rows —
 * supabase/migrations/20260906190000_profiles_column_privileges.sql — RLS
 * still scopes writes, not this read). Used to seed the dialog with the
 * authoritative count on every mount, so a devtools edit to the rendered
 * counter — or a parent still passing a stale/mock prop — cannot survive a
 * close-and-reopen (the security requirement this phase re-asserts).
 */
export async function getSecretBoxStatus(): Promise<ProfileCounters | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("boxes_unopened, boxes_opened")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as ProfileCounters;
}
