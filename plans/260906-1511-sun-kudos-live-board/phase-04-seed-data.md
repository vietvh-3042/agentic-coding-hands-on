# Phase 04 — Seed data

## Context Links

- [`plan.md`](./plan.md) · [phase-03](./phase-03-schema-migrations.md)
- [`clarifications.md`](./clarifications.md) § "run 2" — seed-data depth
- Design content of record: `components/kudos-board/feed-mock-data.ts`,
  `highlight-mock-data.ts`, `spotlight-mock-data.ts` (all MoMorph-sourced) and
  `plans/260710-1511-sun-kudos-live-board/data/MaZUn5xHXZ-specs.csv`
- Current `supabase/seed.sql` (143 lines, 3 profiles, 7 kudos)

## Overview

- **Priority:** P0 — every board assertion in 06/08 is an assertion about seeded rows.
- **Status:** completed (with fix: migration ordering bug)
- Seed expanded to 15 profiles, 40 kudos, hearts, hashtag joins, notifications and secret-box
  unlocks. Real data for infinite scroll, top-5 highlight, leaderboard, and spotlight cloud.
- **Policy: fixture.** No test policy claim; this phase makes the other phases' tests possible.

## Key Insights

- **Seed data is a test contract.** Phase 06's "top 5 by hearts" assertion is only meaningful if
  the seed makes the top 5 unambiguous. Give the intended top 5 distinct, strictly descending
  `hearts_count` values, and keep every other kudo below the fifth — no ties at the boundary.
- **Every identity needs a real password.** Only `demo.user@` has a bcrypt hash today; the other
  two rows carry an empty `encrypted_password` and cannot sign in. Phase 02's harness signs in for
  real, so any identity a test uses must be seeded the same way `demo.user@` is — including the
  empty-string token columns, which GoTrue scans as Go strings and 500s on if NULL.
- **The demo user must be on both sides of the heart rule.** Seed at least one kudo _sent_ by the
  demo user (control disabled — TC `63645b03`) and several _received by others_ (control enabled),
  plus one kudo already hearted by the demo user (the un-heart path).
- **Content must mirror the design.** Names, messages, category chips and attachment paths come
  from the three mock modules and the MoMorph specs. Vary only what the design itself varies
  (sender badge tier, timestamps) — the design deliberately repeats one message across its four
  post cards, so repetition here is fidelity, not laziness.
- Hearts are inserted through `kudo_hearts`, never by writing `hearts_count` — the sync trigger
  owns that column, and seeding it directly would create a drift the app can never repair.
- `supabase/seed.sql` will pass 400 lines. That is fixture data, not code; the 200-line rule does
  not apply, but split by domain with clear banner comments so a reader can find one table fast.

## Requirements

- **FN-1** 15 `auth.users` + 15 `profiles`, each with a working local password, spread across the
  four `hero_badge` tiers and the four `CEVC*` `hero_code` values.
- **FN-2** ~40 `kudos` rows, `created_at` spread over ≥ 4 distinct days so `created_at DESC`
  paging is observable; ≥ 5 with attachments; ≥ 2 anonymous.
- **FN-3** `kudo_hashtags` rows referencing the 13 real hashtag ids, 1–5 per kudo, with at least
  one hashtag carrying feed matches but **no** top-5 match (F002 US005 "no shared match").
- **FN-4** `kudo_hearts` rows producing a strictly ordered top 5 and non-zero sidebar totals.
- **FN-5** Notifications for the demo user (read + unread) and 3 existing `user_icon_unlocks`.
- **FN-6** `profiles.boxes_unopened > 0` for the demo user and `= 0` for one other identity, so
  phase 09 can assert both the enabled and the inert state.
- **NFR-1** Fully idempotent under `supabase db reset`; deterministic UUIDs, no `random()`.

## Architecture

```text
auth.users (15, bcrypt) → profiles (trigger) → overwritten with design values
                                   │
      kudos (40) ─── kudo_hashtags (1-5 each, ids 1..13)
        │
        └── kudo_hearts (N per kudo) ──trigger──> kudos.hearts_count
```

Fixed id scheme, so tests can address rows by constant:
`00000000-0000-4000-8000-0000000000NN` for profiles (01..15),
`20000000-0000-4000-8000-0000000000NN` for kudos (01..40).

## Related Code Files

**Modify** — `supabase/seed.sql` (sole owner). **Create/Delete** — none.

## Implementation Steps

1. Extend the `auth.users` block to 15 rows, copying the existing bcrypt pattern
   (`extensions.crypt('TestLogin123!', extensions.gen_salt('bf'))`) and the empty-string token
   columns verbatim. Keep the existing three ids stable — `lib/profile/current-user.ts` mirrors
   `…001`.
2. Extend the `profiles` upsert to 15 rows with design-sourced display names, `hero_code` across
   CEVC1–CEVC4, badges across `new`/`rising`/`super`/`legend`, and box counts: demo user 25/25,
   one identity 0 unopened, the rest small non-zero values.
3. Insert 40 `kudos` with fixed ids. Distribute:
   - senders/receivers spread so every profile appears as a receiver at least once (spotlight
     cloud) and the demo user is a sender on ≥ 2 and a receiver on ≥ 8;
   - `created_at` = `now() - interval 'N hours'` across ≥ 4 days, strictly distinct;
   - `hashtag_title` only where the design shows a category chip (`IDOL GIỚI TRẺ`), `''` elsewhere;
   - `image_urls` from `/kudos/feed/attachment-sample.png` on ≥ 5 rows with matching
     `attachment_count`;
   - `is_anonymous = true` + `anonymous_name` on 2 rows;
   - `is_spam = true` on 1 row, so phase 06's "spam excluded" assumption is testable.
4. Insert `kudo_hashtags` by joining `hashtags` on name — never on a hardcoded id, since the
   identity sequence is not guaranteed across resets.
5. Insert `kudo_hearts` so the top five land on 5 distinct counts (e.g. 12/10/8/7/6) and the sixth
   is ≤ 5. Include one row `(kudo hearted by the demo user)` and ensure no row hearts a kudo the
   same user sent — the RLS policy would reject it and the seed would fail loudly.
6. Insert notifications (2 unread, 2 read) and keep the 3 existing `user_icon_unlocks`.
7. `supabase db reset`; verify with the queries in Success Criteria.
8. Record the identity table (email → id → role) in `e2e/support/test-identities.ts` (phase 02's
   file — coordinate; this phase supplies the values, phase 02 owns the file).

## Todo List

- [x] 15 auth.users with working passwords
- [x] 15 profiles across all badge tiers and CEVC codes
- [x] 40 kudos, ≥ 4 distinct days, attachments/anonymous/spam variants
- [x] kudo_hashtags joined by name, 1–5 per kudo, incl. the "feed-only" tag
- [x] kudo_hearts giving a strict top 5, incl. a demo-user heart
- [x] Notifications + unlocks + box counts (one identity at 0)
- [x] `supabase db reset` clean, no RLS/trigger rejections
- [x] Identity constants handed to `e2e/support/test-identities.ts`

## Success Criteria

```sql
select count(*) from profiles;                                  -- 15
select count(*) from kudos;                                     -- 40
select count(distinct date_trunc('day', created_at)) from kudos;-- >= 4
select hearts_count from kudos order by hearts_count desc limit 6; -- 5 strict, then a gap
select count(*) from kudo_hashtags;                             -- > 40
select count(distinct receiver_id) from kudos;                  -- >= 12
select boxes_unopened from profiles where id = '…0001';         -- > 0
```

Plus: `/sun-kudos` under the authenticated harness renders ≥ 10 post cards on first paint.

## Risk Assessment

| Risk                                                                       | L×I | Countermeasure                                                                                                                                                                            |
| -------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A seeded heart violates the self-heart RLS policy and `db reset` fails     | M×M | Seed runs as `postgres` (RLS not forced), so it will _succeed_ and hide the violation — add an explicit `select` assertion that no `kudo_hearts` row shares a user with its kudo's sender |
| Hardcoded hashtag ids drift after a reset                                  | M×M | Join on `hashtags.name`, never on a literal id                                                                                                                                            |
| Ties at the top-5 boundary make phase 06's assertion flaky                 | M×H | Strictly descending distinct counts with a gap below the fifth; asserted in Success Criteria                                                                                              |
| `now()`-relative timestamps make a "newest first" assertion time-dependent | L×M | Relative offsets are fine for ordering; tests assert _relative_ order, never absolute strings                                                                                             |
| Seed grows unreadable                                                      | M×L | Banner comments per table; no logic, only data                                                                                                                                            |

## Security Considerations

`TestLogin123!` is a local-dev fixture. It is already in the tree and stays local-only; the seed
file must never be pointed at a non-local database. The demo user remains `role='admin'`
deliberately — phase 01's assertions must therefore use a non-admin identity.

## Next Steps

Unblocks 06, 07, 08, 09.
