import { createClient } from "@supabase/supabase-js";
import { test, expect } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * F004 kudo hearts — DB-layer adversarial proofs (phase 08). Attempts the
 * forbidden/edge writes for real against local Supabase (no `service_role`
 * key, same convention as `secret-box-security.spec.ts`), via a fresh
 * `signInWithPassword` client rather than a browser page — none of these
 * properties are reachable through the UI, only a direct PostgREST write:
 * forged `hearts_value=2` on a normal day is overwritten to 1
 * (`resolve_heart_value()`, `20260906192000_heart_multiplier.sql`); a member
 * hearting their own kudo is rejected by the RLS `with check` guard
 * (`42501`), not merely hidden by the disabled UI control; a second insert
 * for the same `(kudo_id, user_id)` pair is rejected by the composite PK
 * (`23505`); un-hearting a kudo granted at the special-day 2x rate revokes
 * exactly 2, even after the window closes (BR-004) —
 * `sync_kudo_hearts_count()`'s DELETE branch reads the row's own stored
 * value, never a hardcoded 1. `serial` mode plus per-test cleanup avoids
 * racing onto the same target kudo, same reasoning as `hearts-toggle.spec.ts`.
 */

const SENDER_ONE = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "sender.one@sun-asterisk.com",
  password: "TestLogin123!",
};

function heartCountOf(kudoId: string): number {
  return Number(psql(`select hearts_count from public.kudos where id = '${kudoId}';`));
}

function heartRowCount(kudoId: string, userId: string): number {
  return Number(psql(`select count(*) from public.kudo_hearts where kudo_id = '${kudoId}' and user_id = '${userId}';`));
}

function cleanupHeart(kudoId: string, userId: string): void {
  psql(`delete from public.kudo_hearts where kudo_id = '${kudoId}' and user_id = '${userId}';`);
}

/** Reads the current special-day window as `start|end` (empty string per
 *  side means null) so tests that must force a window can restore whatever
 *  was really configured, rather than assuming it was empty. */
function readSpecialDayWindow(): { start: string; end: string } {
  const [start, end] = psql(`select special_day_start, special_day_end from public.event_settings where id = 1;`).split(
    "|",
  );
  return { start: start ?? "", end: end ?? "" };
}

/** Every value is a literal ISO timestamp (or empty for null) — callers that
 *  need "now" compute it in JS (`new Date().toISOString()`) rather than
 *  passing a raw SQL expression, so this never has to nest quotes. */
function writeSpecialDayWindow(window: { start: string; end: string }): void {
  const startSql = window.start ? `'${window.start}'` : "null";
  const endSql = window.end ? `'${window.end}'` : "null";
  psql(`update public.event_settings set special_day_start = ${startSql}, special_day_end = ${endSql} where id = 1;`);
}

/** A kudo not sent by `userId` and not already hearted by them, distinct
 *  per `offset` so parallel-unsafe tests in this file pick different rows. */
function pickHeartableKudoId(userId: string, offset: number): string {
  const id = psql(`
    select k.id from public.kudos k
    where k.sender_id <> '${userId}'
    and k.is_spam = false
    and not exists (select 1 from public.kudo_hearts h where h.kudo_id = k.id and h.user_id = '${userId}')
    order by k.id
    limit 1 offset ${offset};
  `);
  if (!id) throw new Error(`pickHeartableKudoId: no eligible kudo found at offset ${offset}`);
  return id;
}

/** Signs in as `SENDER_ONE` against local GoTrue and returns a `supabase-js`
 *  client bound to that session — real RLS applies (anon key, no
 *  service_role in `.env.local`), same as `secret-box-security.spec.ts`. */
async function senderOneClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const client = createClient(url, key);
  const { error } = await client.auth.signInWithPassword(SENDER_ONE);
  if (error) throw new Error(`senderOneClient: signInWithPassword failed: ${error.message}`);
  return client;
}

test.describe.configure({ mode: "serial" });

test.describe("F004 — kudo hearts (DB-layer security)", () => {
  test("a client-forged hearts_value=2 on a normal day is overwritten to 1 by the trigger", async () => {
    const originalWindow = readSpecialDayWindow();
    writeSpecialDayWindow({ start: "", end: "" }); // guarantee "a normal day" for this assertion

    const kudoId = pickHeartableKudoId(SENDER_ONE.id, 0);
    const before = heartCountOf(kudoId);
    const client = await senderOneClient();

    try {
      const { data, error } = await client
        .from("kudo_hearts")
        .insert({ kudo_id: kudoId, user_id: SENDER_ONE.id, hearts_value: 2 })
        .select("hearts_value")
        .single();

      expect(error).toBeNull();
      expect(data?.hearts_value).toBe(1);
      expect(heartCountOf(kudoId)).toBe(before + 1);
    } finally {
      cleanupHeart(kudoId, SENDER_ONE.id);
      writeSpecialDayWindow(originalWindow);
    }
  });

  test("a member cannot heart their own kudo — rejected by the DB guard, not just the disabled control", async () => {
    const ownKudoId = psql(
      `select id from public.kudos where sender_id = '${SENDER_ONE.id}' order by created_at desc limit 1;`,
    );
    expect(ownKudoId).not.toBe("");

    const client = await senderOneClient();
    const { error } = await client.from("kudo_hearts").insert({ kudo_id: ownKudoId, user_id: SENDER_ONE.id });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
    expect(heartRowCount(ownKudoId, SENDER_ONE.id)).toBe(0);
  });

  test("double-hearting the same kudo as the same user inserts exactly one row (composite PK)", async () => {
    const kudoId = pickHeartableKudoId(SENDER_ONE.id, 1);
    const before = heartCountOf(kudoId);
    const client = await senderOneClient();

    try {
      const first = await client.from("kudo_hearts").insert({ kudo_id: kudoId, user_id: SENDER_ONE.id });
      expect(first.error).toBeNull();

      const second = await client.from("kudo_hearts").insert({ kudo_id: kudoId, user_id: SENDER_ONE.id });
      expect(second.error).not.toBeNull();
      expect(second.error?.code).toBe("23505");

      expect(heartRowCount(kudoId, SENDER_ONE.id)).toBe(1);
      expect(heartCountOf(kudoId)).toBe(before + 1); // moved exactly once, not twice
    } finally {
      cleanupHeart(kudoId, SENDER_ONE.id);
    }
  });

  test("US002 — un-hearting a kudo granted at the special-day x2 rate revokes 2, even after the window ends", async () => {
    const originalWindow = readSpecialDayWindow();
    const kudoId = pickHeartableKudoId(SENDER_ONE.id, 2);
    const before = heartCountOf(kudoId);
    const client = await senderOneClient();

    try {
      writeSpecialDayWindow({
        start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

      const { data: inserted, error: insertError } = await client
        .from("kudo_hearts")
        .insert({ kudo_id: kudoId, user_id: SENDER_ONE.id })
        .select("hearts_value")
        .single();
      expect(insertError).toBeNull();
      expect(inserted?.hearts_value).toBe(2);
      expect(heartCountOf(kudoId)).toBe(before + 2);

      // The special day ends before the un-heart.
      writeSpecialDayWindow({ start: "", end: "" });

      const { error: deleteError } = await client
        .from("kudo_hearts")
        .delete()
        .eq("kudo_id", kudoId)
        .eq("user_id", SENDER_ONE.id);
      expect(deleteError).toBeNull();

      expect(heartCountOf(kudoId)).toBe(before); // dropped by 2, not 1
    } finally {
      cleanupHeart(kudoId, SENDER_ONE.id);
      writeSpecialDayWindow(originalWindow);
    }
  });
});
