---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->

# Permissions

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-06
**Analysis Scope**: `lib/supabase/proxy.ts`/`proxy.ts` (route guard, read in full), `app/sun-kudos/page.tsx` (defense-in-depth self-check), all 9 tables + 1 view's RLS policies and GRANTs, `open_secret_box()` RPC's access-control shape, `profiles.role` (schema-declared, code-unconsumed), and `supabase/migrations/*.sql` (permission-dominant files: `20260722070000`, `20260906190000`, `20260906193500`, `20260906195000`).

> **Verification method**: every grant/policy claim below was re-read from the LIVE local Supabase
> instance (`docker exec supabase_db_agentic-coding-hands-on psql`), not inferred from migration files
> alone — `information_schema.role_table_grants`, `information_schema.role_column_grants`,
> `pg_policies`, `pg_default_acl`, and `pg_proc`/`pg_class` were queried directly on 2026-09-06.
> Every fact in the brief's stated matrix was checked against this live output; **no difference was
> found** — the exact commands and their output are recorded in [permissions-matrix.md](../generated/permissions-matrix.md).

> **Scope note:** this is the curated, plain-language view, written for a PM/BA/client audience.
> The raw per-gate matrix — PERM### codes, per-role rule tables, enforcement points, and the live
> verification output — lives in [permissions-matrix.md](../generated/permissions-matrix.md) and is the source this prose derives from.

## Authorization System Type

**System Type**: `hybrid`

Two independent mechanisms, not one:

1. **A binary session gate at the route layer** (`lib/supabase/proxy.ts`) — authenticated vs. anonymous, no role differentiation. Closer to a coarse "logged in or not" check than RBAC.
2. **Ownership-scoped Row Level Security at the data layer** — nearly every write policy is literally `column = auth.uid()` (own profile, own kudo, own heart, own notification). This is the `ownership` pattern.

There is no working role differentiation today — the `profiles.role` column is declared in the schema but read by no code.

**Identified Roles**:

- **Anonymous** (`anon` key, no session) — can read most tables directly via a raw PostgREST/API call (RLS `USING (true)` on `profiles`/`kudos`/`kudo_hearts`/`hashtags`/`kudo_hashtags`/`event_settings`/`secret_box_icons`/`user_icon_unlocks`/`profile_kudo_stats`), but the web app itself redirects every non-public page to `/login` before an anonymous visitor ever renders one.
- **Authenticated** (any signed-in user, undifferentiated) — everything Anonymous can read, plus: update own profile's `display_name`/`avatar_url`/`language`; insert a kudo as themselves; insert/delete their own heart (never on their own kudo); insert `kudo_hashtags` rows for their own kudo; read/mark-read their own notifications; call `open_secret_box()` for themselves only.
- **Admin** (`profiles.role = 'admin'`) — declared in the schema, **not implemented** anywhere in code.

## Curated View

- **Anonymous visitors** can read almost the entire dataset directly through a raw Supabase/PostgREST call (profiles, kudos, hearts, hashtags, icons, unlocks, event settings, the stats view) — but cannot write anything, and the web app's own route guard sends them to `/login` before they ever see a rendered page other than Login.
- **Signed-in users** can do everything Anonymous can, plus: give a kudo, heart/un-heart a kudo (never their own), tag their own kudo with hashtags, edit their own display name/avatar/language, read and mark-read their own notifications, and draw one secret-box badge for themselves at a time — but cannot edit or delete anyone else's data, cannot see anyone else's notifications, and cannot choose which badge a secret-box draw gives them.
- **The `admin` role exists in the database but grants nothing today** — no screen, button, or query in this codebase branches on it. The "Admin Dashboard" menu item every user sees is inert (no click handler).

## Access Boundaries

- **Read boundary is almost entirely open.** Only `notifications` is read-scoped to the owner (`user_id = auth.uid()`) — every other table/view is `USING (true)`, readable by `anon` and `authenticated` alike. This is a deliberate design (a public kudos board), not an oversight, but it means the boundary between "logged in" and "not" is enforced by the **web app's route guard**, not by the database, for every screen except the notification bell's contents.
- **Write boundary is ownership-scoped everywhere it exists.** A user can only ever write rows that name themselves: their own profile update, their own kudo (as sender), their own heart (as liker, never on their own kudo), their own kudo's hashtag tags, their own notification's read-state. No table grants a signed-in user write access to another user's row.
- **The one write path that bypasses ownership scoping entirely is `open_secret_box()`** — a `security definer` RPC that writes `user_icon_unlocks` and `profiles.boxes_opened/boxes_unopened` on the caller's behalf, deliberately taking zero parameters so the acted-on row is always resolved server-side from the session, never client-selectable.
- **Admin vs. regular user is not yet a real boundary** — nothing in the code reads the role column.

## Special Conditions

- **A live privilege-escalation hole was closed roughly an hour before this artifact was written** (migration `20260906195000_table_grants_hardening.sql`). Before that migration, six tables — `event_settings`, `kudos`, `kudo_hearts`, `notifications`, `secret_box_icons`, `user_icon_unlocks` — still held table-level `TRUNCATE`/`DELETE`/`UPDATE`/`REFERENCES`/`TRIGGER` grants for **both** `anon` and `authenticated`, inherited from the schema's original default ACL (`postgres=arwdDxtm,anon=arwdDxtm,authenticated=arwdDxtm` on every new table — verified in `pg_default_acl` history via the migration's own comment). **RLS does not cover `TRUNCATE`** — a signed-in (or even anonymous) client could have issued `TRUNCATE kudos` and wiped the board regardless of any RLS policy. This was proven exploitable, then fixed. Live re-verification (this pass) confirms the fix holds: `information_schema.role_table_grants` today shows only `SELECT`/`INSERT`/`UPDATE`/`DELETE` rows for `anon`/`authenticated` — no `TRUNCATE`, `REFERENCES`, or `TRIGGER` grant remains on any of the 9 public tables for either role. The per-table grant detail and the raw query output are in [permissions-matrix.md](../generated/permissions-matrix.md).
- **The default-privilege fix is forward-only.** `20260906193500_default_privileges_baseline.sql`'s `ALTER DEFAULT PRIVILEGES ... GRANT SELECT ON TABLES TO anon, authenticated` narrows the schema's default ACL for **tables created after this migration runs** — verified live: `pg_default_acl` for relation objects in `public` now reads `postgres=arwdDxtm/postgres, anon=r/postgres, authenticated=r/postgres, service_role=arwdDxtm/postgres` (SELECT-only for anon/authenticated by default). It did **not** retroactively touch any of the 9 existing tables — those needed, and got, the separate explicit-grant hardening above. A future new table with no explicit grants gets read-only by default now; a table created before this migration was hardened individually, not by this default.
- **A recorded, unresolved tension**: `/sun-kudos` (SCR006) is guarded twice at the web-app layer (the global route guard, plus the page’s own defense-in-depth session check) — an unauthenticated browser request always bounces to `/login` — yet `profiles`, `kudos`, `kudo_hearts`, `hashtags`, `kudo_hashtags`, `secret_box_icons`, `user_icon_unlocks`, and `event_settings` all carry `anon`-readable RLS. A direct PostgREST call with only the public `anon` key (no session, bypassing the web app entirely) can read the same board data the guarded `/sun-kudos` page shows. This is deliberate and already recorded (`route-list.md` Discrepancy #1 / `screen-list.md` SCR006 description) — not a bug found in this pass — but it means "the page is gated" and "the data is gated" are two different, independently-true statements about this system.
- **`open_secret_box()` is EXECUTE-revoked from `anon`/`public`, granted only to `authenticated`** (verified live: `pg_proc`'s access-privileges show `authenticated=X/postgres`, `service_role=X/postgres`, no `anon` entry) — an anonymous caller cannot even attempt the RPC, independent of the session check inside the function body itself (defense-in-depth: the function also raises `not_authenticated` if `auth.uid()` is null, which is unreachable for `anon` today only because EXECUTE is already revoked, not because it's dead code — `service_role` calls, e.g. from a future admin tool, would still hit that internal check).
- **A new `security definer`-shaped view closed the anonymous-sender leak for one screen only (2026-09-07).** `kudos_sent_for_caller` (`security_invoker = off`, the opposite setting from `profile_kudo_stats`) backs the new `/profile` screen's own "Sent Kudos" list, including kudos the caller sent anonymously. It runs with the view owner's privileges specifically so it can surface `sender_id`/`is_anonymous`/`anonymous_name` for the caller's own rows, and is confined by two things together: its own `WHERE sender_id = auth.uid()` predicate, and an explicit `REVOKE ALL` + `GRANT SELECT` to `authenticated` only (no `anon` grant at all) — the same "the GRANT is the boundary that's actually enforced" discipline as every other hardened object in this schema. **This does not touch the base `kudos` table** — `kudos` still carries `"kudos readable by all"` for both `anon` and `authenticated` (the tension already recorded above for `/sun-kudos`), so a direct PostgREST call with only the `anon` key can still read any row's `sender_id` off the base table, anonymous or not. Narrowing `kudos` itself was explicitly out of scope this batch (it would break the live board's own queries); the base-table exposure remains a standing, recorded item, not one this view resolves project-wide. Full per-gate detail: `permissions-matrix.md` PERM016.

---

_Raw per-gate detail (all 15 gates with per-role rule tables, enforcement points and
live verification output): [permissions-matrix.md](../generated/permissions-matrix.md)._
