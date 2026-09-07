# Phase 03 — Schema migrations (hashtags, stats view, heart multiplier, box draw)

## Context Links

- [`plan.md`](./plan.md) · [phase-01](./phase-01-security-profiles-column-privileges.md)
- [`clarifications.md`](./clarifications.md) § "data model", § "gap resolution", § "Rest Point 1.5a"
- [`spec/hashtag-taxonomy/technical-spec.md`](./spec/hashtag-taxonomy/technical-spec.md) A4 (backfill)
- [`spec/kudo-hearts/technical-spec.md`](./spec/kudo-hearts/technical-spec.md) A1 BR-003
- [`spec/secret-box-reveal/functional-spec.md`](./spec/secret-box-reveal/functional-spec.md) BR-001..BR-004
- Live schema verified 2026-09-06 via `docker exec supabase_db_mock-aidd-kudo-app psql`

## Overview

- **Priority:** P0 — 04, 05, 06, 07, 08, 09 all read something this phase creates.
- **Status:** completed (RED→GREEN)
- All Batch A DDL in one phase, in one migration timestamp run, so ordering under
  `supabase db reset` is deterministic and no two agents race the migrations directory.
- **Policy: sql-assert-red-first.** Each object gets an assertion in `supabase/tests/` written
  and failing before the DDL — all passed.

## Key Insights

- **Hashtag ids must be integers.** The whole UI already types hashtags as `number`
  (`IOption.value`, `KudoPost.hashtags: number[]`, `KudosHashtagInput.tags: number[]`). Using
  `bigint generated always as identity` keeps every existing prop signature intact — a uuid PK
  would ripple through six components for nothing.
- **The 13 hashtags are reference data, not sample data** — they belong in the migration, so they
  exist in every environment, not in `seed.sql` which only carries demo content.
- **The heart multiplier must be enforced in the database, not in the Server Action.** The
  existing `kudo_hearts` INSERT policy lets a client with the anon key insert
  `hearts_value = 2` on any day. A `BEFORE INSERT` trigger that _overwrites_ `hearts_value` from
  `event_settings` makes the forgery impossible and makes the action simpler. This supersedes the
  spec's "the action reads `event_settings`" — the action may still read it, but only to render
  the `x2` badge.
- **`secret_box_icons` is seeded with placeholders** — `Icon 1..6` pointing at
  `/profile/icons/icon-N.png`, a directory that does not exist on disk. The six real names and
  their weights come from the MoMorph spec (`J3-4YFIpMM-specs.csv` row C). Rename and add a
  `weight` column here; artwork is a separate, non-blocking gap (see Risks).
- **Every new table re-inherits nothing** only because phase 01 revoked the default ACL. This
  phase must still `revoke`/`grant` explicitly per table and re-run phase 01's grant-baseline
  assertion — that is the standing rule from the security report.
- A `profile_kudo_stats` **view** serves three consumers at once (sidebar stats, star tier,
  leaderboard rows). One definition beats three near-identical aggregate queries. It needs
  `with (security_invoker = on)` or it would bypass the caller's RLS.

## Requirements

- **FN-1** `hashtags(id bigint pk, name text unique, sort_order int)` seeded with the 13 Vietnamese
  names in the clarified order.
- **FN-2** `kudo_hashtags(kudo_id uuid, hashtag_id bigint, pk(kudo_id, hashtag_id))` with the
  insert policy F003 needs (`exists(select 1 from kudos where id = kudo_id and sender_id = auth.uid())`).
- **FN-3** A one-time, idempotent backfill from the free-text `kudos.hashtags` blob.
- **FN-4** `event_settings.special_day_start/special_day_end timestamptz null`.
- **FN-5** `kudo_hearts` BEFORE INSERT trigger resolving `hearts_value` server-side.
- **FN-6** `secret_box_icons.weight integer not null default 0`, the six real names, and
  `public.open_secret_box()` as a `security definer` RPC.
- **FN-7** `profile_kudo_stats` view: `id, kudos_received, kudos_sent, hearts_received`.
- **NFR-1** Every statement idempotent (`if not exists` / `drop … if exists` + `create`).
- **NFR-2** RLS enabled with explicit policies on both new tables; grants asserted, not assumed.

## Architecture

```text
kudos ──< kudo_hashtags >── hashtags        (13 reference rows, read-only to users)
kudos ──< kudo_hearts    ── BEFORE INSERT trigger ← event_settings.special_day_*
profiles ── profile_kudo_stats (view, security_invoker)
profiles ──< user_icon_unlocks >── secret_box_icons (+ weight)
        ↑
        └── open_secret_box() : security definer, the ONLY writer of boxes_*
```

`open_secret_box()` in one transaction: lock the caller's profile row → reject at 0 →
weighted draw → `insert … on conflict do nothing` → decrement/increment → return the drawn icon.
Atomic by construction, which is BR-002, and the row lock is what makes the double-click case
(BR-004 / the "1 box, two clicks" scenario) a no-op rather than a double grant.

## Related Code Files

**Create**

- `supabase/migrations/20260906191000_kudo_hashtags.sql`
- `supabase/migrations/20260906191500_profile_stats_view.sql`
- `supabase/migrations/20260906192000_heart_multiplier.sql`
- `supabase/migrations/20260906192500_secret_box_draw.sql`
- `supabase/tests/{hashtags,hearts-multiplier,secret-box}.sql`

**Modify** — `supabase/tests/privileges.sql` (extend the allow-list with the new tables).

## Implementation Steps

1. **RED**: write the three assertion files first and run them; each must fail on a missing
   relation/function, not on a connection error. Record the output.
2. `20260906191000_kudo_hashtags.sql`
   - `create table if not exists public.hashtags (id bigint generated always as identity primary
key, name text not null unique, sort_order integer not null default 0);`
   - Insert the 13 names in order, `on conflict (name) do nothing`: Toàn diện, Giỏi chuyên môn,
     Hiệu suất cao, Truyền cảm hứng, Cống hiến, Aim High, Be Agile, Wasshoi, Hướng mục tiêu,
     Hướng khách hàng, Chuẩn quy trình, Giải pháp sáng tạo, Quản lý xuất sắc.
   - `create table if not exists public.kudo_hashtags (kudo_id uuid references kudos(id) on delete
cascade, hashtag_id bigint references hashtags(id) on delete restrict, primary key (kudo_id,
hashtag_id)); create index on kudo_hashtags (hashtag_id);`
   - RLS on both; `select` to `anon, authenticated`; `insert` on `kudo_hashtags` to
     `authenticated` with the sender-owns-the-kudo `with check`.
   - Grants: `revoke all … from anon, authenticated; grant select …; grant insert on
public.kudo_hashtags to authenticated;`
   - **Backfill**: split `kudos.hashtags` on whitespace, strip a leading `#`, join
     case-insensitively against `hashtags.name`, `insert … on conflict do nothing`. Tokens with no
     match are left unmapped — the existing seed blob (`#Dedicated #Inspring`) matches none of the
     13, and inventing a mapping would be fabrication. Log the unmatched-token count via
     `raise notice`.
   - `kudos.hashtags` is **kept** (not dropped) this batch — nothing reads it after phase 06 and
     dropping it is a separate, reversible decision.
3. `20260906191500_profile_stats_view.sql` — the view + `grant select to anon, authenticated`.
4. `20260906192000_heart_multiplier.sql`
   - `alter table public.event_settings add column if not exists special_day_start timestamptz,
add column if not exists special_day_end timestamptz;`
   - `create or replace function public.resolve_heart_value() returns trigger language plpgsql
security definer set search_path = public` → `new.hearts_value := case when exists (select 1
from event_settings where id = 1 and now() between special_day_start and special_day_end)
then 2 else 1 end; return new;`
   - `create trigger before_kudo_hearts_insert before insert on public.kudo_hearts for each row
execute function public.resolve_heart_value();`
   - Confirm it fires **before** `on_kudo_hearts_change` (AFTER) so the sync trigger sees the
     resolved value.
5. `20260906192500_secret_box_draw.sql`
   - `alter table public.secret_box_icons add column if not exists weight integer not null default 0;`
   - `update`/`upsert` the six rows by `sort_order`: Stay Gold 30, Flow to Horizon 25,
     Touch of Light 20, Beyond the Boundary 10, Revival 10, Root Further 5.
   - `open_secret_box()` per Architecture; `revoke all on function public.open_secret_box() from
public, anon; grant execute on function public.open_secret_box() to authenticated;`
   - Raise a named exception `no_unopened_boxes` at 0 so the UI can map it to the disabled state.
6. Re-run all assertions + phase 01's grant baseline; all exit 0.
7. `supabase db reset` end to end; then `pnpm db:types` (phase 02's script) to refresh
   `database.types.ts`.

## Todo List

- [x] Assertions written and RED recorded
- [x] `hashtags` + 13 rows + `kudo_hashtags` + policies + grants
- [x] Backfill idempotent; unmatched-token count reported
- [x] `profile_kudo_stats` view with `security_invoker = on`
- [x] `event_settings` special-day columns
- [x] `resolve_heart_value()` BEFORE INSERT trigger; forged `hearts_value = 2` proven impossible
- [x] `secret_box_icons.weight` + six real names
- [x] `open_secret_box()` atomic, execute granted to `authenticated` only
- [x] Grant baseline re-asserted with the new tables
- [x] `supabase db reset` clean; `pnpm db:types` re-run

## Success Criteria

- `select count(*) from public.hashtags` = 13, in the clarified order by `sort_order`.
- As `authenticated`: `insert into kudo_hearts(kudo_id, user_id, hearts_value) values (…, 2)` on a
  non-special day stores `hearts_value = 1`, and `kudos.hearts_count` moves by 1.
- With `special_day_start/end` bracketing `now()`, the same insert stores 2 and the count moves by 2.
- `select * from open_secret_box()` as a user with `boxes_unopened = 0` raises `no_unopened_boxes`
  and changes no row; with `> 0` it returns exactly one icon, decrements by exactly 1, and two
  concurrent calls against a single remaining box grant exactly one badge.
- Over 10 000 sampled draws each icon's share is within ±3 points of its weight.
- `supabase/tests/privileges.sql` still exits 0.

## Risk Assessment

| Risk                                                                               | L×I | Countermeasure                                                                                                          |
| ---------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------- |
| Trigger order puts `resolve_heart_value` after the sync trigger                    | L×H | BEFORE always precedes AFTER in Postgres; asserted anyway by the count-moves-by-2 check                                 |
| The backfill matches nothing and looks like a silent failure                       | H×L | Expected — the seed blob shares no token with the 13. `raise notice` makes it visible; phase 04 supplies real join rows |
| `security definer` RPC with a mutable `search_path` (privilege escalation vector)  | L×H | `set search_path = public` pinned on every definer function                                                             |
| Weighted draw skews on ties                                                        | L×L | Cumulative-window pick over `sort_order` is deterministic given the roll; verified by the distribution check            |
| Badge artwork for the six icons does not exist on disk (`/profile/icons/` missing) | H×M | Not blocking: `image_url` stays a column, phase 09 renders name + fallback art and records the missing-asset gap        |
| The two new tables silently inherit ALL from a default ACL                         | M×H | Phase 01 revoked the default privilege; this phase re-runs the baseline assertion as its last step                      |

## Security Considerations

- `hashtags` and `secret_box_icons` are user-readable, never user-writable — BR-001's
  "not admin- or user-configurable" is a grant, not a UI convention.
- `open_secret_box()` runs as owner; it must derive the user solely from `auth.uid()` and accept
  **no parameters**, so nothing the client sends can select a badge or a victim.
- `kudo_hashtags` INSERT is gated on owning the parent kudo, not merely on being authenticated —
  otherwise any user could tag anyone's kudo.

## Next Steps

Unblocks 04 (seed), 05 (`getHashtags`), 08 (multiplier), 09 (RPC). Re-run `pnpm db:types`.
