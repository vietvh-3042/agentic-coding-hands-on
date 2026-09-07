# Permissions Matrix

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-07
**Analysis Scope**: Split out of `permissions.md`'s Dev Appendix (W3, gate-passed) per this run's
explicit instruction — same PERM001–PERM015 codes, same facts, reshaped into the standalone raw-matrix
form. No new permission item was added or removed; no code was renumbered.

> **Raw PERM### matrix.** Machine-generated inventory of every permission item with full
> per-permission detail. The plain-language curated view lives at
> [permissions.md](./permissions.md). This file was derived FROM that document's Dev Appendix — it
> does not supersede it; see Split Note below.

**Code Format**: All codes follow `PERM###_NameSlug` format (e.g., PERM001_GlobalSessionGate).

**Permission Types observed this run**: `route-guard`, `data-permission`, `field-permission`,
`action-permission`, `role-based`. The remaining 7 canonical types (`screen-permission`,
`resource-ownership`, `api-scope`, `feature-flag`, `experiment`, `env-gate`, `locale-gate`) have zero
qualifying entries in this codebase — see Client-Side Gate Types section below for the explicit
zero-hit confirmation on the 4 client-side gate types.

**Split note**: `permissions.md`'s Dev Appendix (§ "Dev Appendix — Raw PERM### Matrix") folded this
exact matrix into the curated document because that run commissioned only one permissions file. This
run splits it into its own file per the canonical W3 shape. Whether to now trim the Dev Appendix out of
`permissions.md` to remove the duplication is a promote-time judgment call — see this artifact's
completion report; `permissions.md` itself is left untouched per this run's instruction.

## Live Re-Verification (this pass, 2026-09-07)

Re-ran against the running local Supabase instance
(`docker exec supabase_db_agentic-coding-hands-on psql -U postgres -d postgres`) rather than copying
`permissions.md` on trust:

```sql
-- table-level grants
select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated') order by 1,2,3;
-- 24 rows. No TRUNCATE / REFERENCES / TRIGGER grant remains for either role.

-- column-level grants
select table_name, column_name, grantee, privilege_type from information_schema.role_column_grants
where table_schema='public' and grantee in ('anon','authenticated') order by 1,3,4,2;
-- 134 rows: confirms profiles' UPDATE grant is column-scoped to exactly
-- display_name / avatar_url / language, and to no other column on either table.

-- RLS policies
select schemaname, tablename, policyname, cmd, roles, qual, with_check from pg_policies
where schemaname='public' order by tablename, cmd;
-- 15 rows: every USING / WITH CHECK clause quoted below is copied verbatim from this output.

-- RLS enablement
select relname, relrowsecurity, relforcerowsecurity from pg_class c
join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind in ('r','v') order by relname;
-- relrowsecurity = t on all 9 tables. profile_kudo_stats (a view) shows f — RLS does not apply to
-- views; its access control is security_invoker + an explicit grant instead.

-- default ACL for future tables
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype,
       array_to_string(defaclacl,',') from pg_default_acl;
-- public-schema relation ('r') default ACL is now
-- postgres=arwdDxtm/postgres, anon=r/postgres, authenticated=r/postgres, service_role=arwdDxtm/postgres
-- i.e. SELECT-only for anon/authenticated on tables created after 20260906193500.

-- RPC access control
\df+ public.open_secret_box
-- zero arguments, security=definer, access privileges
-- postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres (no anon).

-- view options
select relname, reloptions from pg_class where relname='profile_kudo_stats';
-- {security_invoker=on}.
```

**Result: zero differences** from the grant/policy shape already recorded in `permissions.md`
(itself verified live one hour earlier, before the `20260906195000_table_grants_hardening.sql`
grant-hardening migration's effects were double-checked). Every table/role/privilege pair and every
`USING`/`WITH CHECK` clause below is re-derived from this run's own query output, not carried
forward unchecked.

## Permissions Index

| Code    | Name                           | Type              | Enforced At                                                                                                            |
| ------- | ------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| PERM001 | GlobalSessionGate              | route-guard       | `lib/supabase/proxy.ts` (`updateSession`/`isPublicPath`)                                                               |
| PERM002 | SunKudosDefenseInDepthGate     | route-guard       | `app/sun-kudos/page.tsx` (`getViewerId()` + `redirect`)                                                                |
| PERM003 | ProfilesReadAll                | data-permission   | Postgres RLS `"profiles readable by all"` + table GRANT                                                                |
| PERM004 | ProfilesOwnerColumnUpdate      | field-permission  | Postgres RLS `"profiles updatable by owner"` + column GRANT (`display_name`,`avatar_url`,`language`)                   |
| PERM005 | KudosReadAllInsertOwn          | data-permission   | Postgres RLS `"kudos readable by all"` / `"kudos insert by sender"` + table GRANT                                      |
| PERM006 | KudoHeartsOwnershipCrud        | data-permission   | Postgres RLS (3 policies: select-all, insert-self-not-own-kudo, delete-self) + table GRANT                             |
| PERM007 | HashtagsReadOnly               | data-permission   | Postgres RLS `"hashtags readable by all"` + table GRANT (no write policy)                                              |
| PERM008 | KudoHashtagsReadInsertBySender | data-permission   | Postgres RLS (select-all, insert scoped to the kudo's own sender) + table GRANT                                        |
| PERM009 | SecretBoxIconsReadOnly         | data-permission   | Postgres RLS `"secret_box_icons readable by all"` + table GRANT (no write policy)                                      |
| PERM010 | UserIconUnlocksReadOnly        | data-permission   | Postgres RLS `"user_icon_unlocks readable by all"` + table GRANT (sole writer = PERM014 RPC)                           |
| PERM011 | NotificationsOwnerOnly         | data-permission   | Postgres RLS (select-self, update-self) + table GRANT — **no `anon` access at all**                                    |
| PERM012 | EventSettingsReadOnly          | data-permission   | Postgres RLS `"event_settings readable by all"` + table GRANT (no write policy)                                        |
| PERM013 | ProfileKudoStatsViewReadAll    | data-permission   | Explicit `revoke all` + `grant select`; `security_invoker=on`                                                          |
| PERM014 | OpenSecretBoxRpcBoundary       | action-permission | Function-level `REVOKE`/`GRANT EXECUTE` + `security definer` + zero-parameter signature                                |
| PERM015 | AdminRoleGate                  | role-based        | **Not implemented** — `components/homepage/user-menu.tsx:90-99` renders unconditionally                                |
| PERM016 | KudosSentForCallerView         | data-permission   | View `security_invoker=off` + explicit `REVOKE`/`GRANT SELECT` (`authenticated` only) + `WHERE sender_id = auth.uid()` |

---

## PERM001_GlobalSessionGate

**Type**: route-guard
**Enforced At**: `lib/supabase/proxy.ts` → `updateSession()`, wired from the project-root `proxy.ts` (Next.js 16's renamed middleware entry point)

### Description

Runs on every request. Refreshes the Supabase session cookie (`supabase.auth.getUser()`, re-verified against the Auth server) then enforces: unauthenticated + not `isPublicPath` → redirect to `/login`; authenticated + on `/login` → redirect to `/countdown` (before launch) or `/about` (after launch), per `isBeforeLaunch()`. `isPublicPath(pathname)` is exactly `pathname === "/login" || pathname.startsWith("/auth")`. Single source of truth — no per-page duplicate list.

### Related Routes

- (GET) `/auth/callback` — ROUTE001 (public, excluded)

### Related Screens

- SCR002_LoginScreen — public, excluded
- SCR003_CountdownScreen — guarded
- SCR004_AboutHomepage — guarded
- SCR005_AwardInfoScreen — guarded
- SCR006_SunKudosBoard — guarded (also see PERM002 — defense-in-depth, separate PERM item since it is a distinct enforcement point)
- SCR001_RootRedirect — guarded, though moot (page itself unconditionally redirects to `/login`)

### Permission Rules

| Role          | Allow | Conditions                                                                         |
| ------------- | ----- | ---------------------------------------------------------------------------------- |
| anonymous     | ✗     | Redirected to `/login` on any path except `/login` and `/auth/*`                   |
| authenticated | ✓     | Hitting `/login` while authenticated redirects to `/countdown` or `/about` instead |

### Related Modules

- `lib/countdown-config.ts` (`isBeforeLaunch()`)

---

## PERM002_SunKudosDefenseInDepthGate

**Type**: route-guard
**Enforced At**: `app/sun-kudos/page.tsx` (`getViewerId()` + `redirect("/login")`)

### Description

A second, page-level auth check on top of PERM001, explicitly commented in source as "defense in depth, not the primary gate." `getViewerId()` resolves the session; a null result triggers `redirect("/login")` before any of the page's 5 data queries run. This is a distinct enforcement point from PERM001 (different file, different mechanism), documented as its own PERM item rather than folded into PERM001, per the "defense-in-depth = separate PERM, same type" convention.

### Related Routes

- N/A (page-level, not a Server Action)

### Related Screens

- SCR006_SunKudosBoard

### Permission Rules

| Role          | Allow | Conditions                                                                 |
| ------------- | ----- | -------------------------------------------------------------------------- |
| anonymous     | ✗     | Redirected to `/login` even in the hypothetical case PERM001 were bypassed |
| authenticated | ✓     | —                                                                          |

### Related Modules

- `lib/kudos/board-queries.ts` (`getViewerId()`)

---

## PERM003_ProfilesReadAll

**Type**: data-permission
**Enforced At**: Postgres RLS policy `"profiles readable by all"` (`USING (true)`) + table GRANT `SELECT` to `anon, authenticated` (live-verified)

### Description

Every profile's full row (display name, hero code, badge tier, box counters, language, role) is readable by anyone, signed in or not — required for the public leaderboard/board display. Write access is separate — see PERM004.

### Related Routes

- N/A (read via direct table select in Server Components / Server Actions)

### Related Screens

- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard

### Permission Rules

| Role          | Allow           | Conditions                                        |
| ------------- | --------------- | ------------------------------------------------- |
| anon          | ✓ (SELECT only) | —                                                 |
| authenticated | ✓ (SELECT only) | UPDATE is a separate, narrower rule — see PERM004 |

---

## PERM004_ProfilesOwnerColumnUpdate

**Type**: field-permission
**Enforced At**: Postgres RLS policy `"profiles updatable by owner"` (`auth.uid() = id`, both `USING` and `WITH CHECK`) + column-level GRANT `UPDATE(display_name, avatar_url, language)` to `authenticated` (live-verified — no other column is UPDATE-granted)

### Description

A signed-in user may update exactly three columns on exactly their own row: `display_name`, `avatar_url`, `language`. Every other column — including `role`, the box counters, and `hero_badge` — has no client-writable path at all. No INSERT/DELETE policy exists on `profiles`.

### Related Routes

- N/A (no dedicated profile-edit Server Action; language write happens via `LanguageSelector` through a direct Supabase client call)

### Related Screens

- N/A — no profile-edit screen exists yet

### Permission Rules

| Role          | Allow              | Conditions                                                                 |
| ------------- | ------------------ | -------------------------------------------------------------------------- |
| anon          | ✗                  | No UPDATE grant at all                                                     |
| authenticated | ✓ (3 columns only) | `auth.uid() = id`; any other column or row is rejected by RLS `WITH CHECK` |

---

## PERM005_KudosReadAllInsertOwn

**Type**: data-permission
**Enforced At**: Postgres RLS (`"kudos readable by all"` `USING (true)`; `"kudos insert by sender"` `WITH CHECK (sender_id = auth.uid())`) + table GRANT `SELECT, INSERT` to `authenticated`, `SELECT` only to `anon` (live-verified)

### Description

Anyone can read every kudo. Only a signed-in user can insert, and only with themselves as `sender_id` — `submitKudoAction` never trusts a client-supplied sender. Hardened one hour before the prior `permissions.md` pass (previously also held `TRUNCATE`/`DELETE`/`UPDATE`/`REFERENCES`/`TRIGGER` for both roles — now revoked, re-confirmed live this pass). No UPDATE/DELETE policy exists for any role.

### Related Routes

- `submitKudoAction(formData)` — ROUTE002

### Related Screens

- SCR004_AboutHomepage, SCR006_SunKudosBoard

### Permission Rules

| Role          | Allow               | Conditions                                                               |
| ------------- | ------------------- | ------------------------------------------------------------------------ |
| anon          | ✓ (SELECT only)     | —                                                                        |
| authenticated | ✓ (SELECT + INSERT) | INSERT only with `sender_id = auth.uid()`; no UPDATE/DELETE for any role |

---

## PERM006_KudoHeartsOwnershipCrud

**Type**: data-permission
**Enforced At**: Postgres RLS — 3 policies: `"kudo_hearts readable by all"` (`USING (true)`), `"kudo_hearts insert by self, not own kudo"` (`WITH CHECK (user_id = auth.uid() AND auth.uid() <> kudo's sender_id)`), `"kudo_hearts delete by self"` (`USING (user_id = auth.uid())`) + table GRANT `SELECT, INSERT, DELETE` to `authenticated`, `SELECT` only to `anon` (live-verified)

### Description

Anyone can read hearts. A signed-in user may heart any kudo except their own, and may only delete their own heart row. `hearts_value` itself is never client-controlled — RLS checks only `user_id`/self-heart, never the value; the 1-vs-2 resolution is a trigger (BL004), not this policy.

### Related Routes

- `heartKudo(kudoId)` — ROUTE003
- `unheartKudo(kudoId)` — ROUTE004

### Related Screens

- SCR006_SunKudosBoard (REG001, REG003)

### Permission Rules

| Role          | Allow                        | Conditions                                                                                                              |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| anon          | ✓ (SELECT only)              | —                                                                                                                       |
| authenticated | ✓ (SELECT + INSERT + DELETE) | INSERT blocked on own kudo (self-heart); DELETE only own heart row; `hearts_value` server-resolved regardless of policy |

---

## PERM007_HashtagsReadOnly

**Type**: data-permission
**Enforced At**: Postgres RLS `"hashtags readable by all"` (`USING (true)`) + table GRANT `SELECT` to `anon, authenticated` (live-verified)

### Description

The 13-row canonical hashtag catalog is read-only for every client role — no INSERT/UPDATE/DELETE policy; writes are seed/migration only.

### Related Routes

- N/A (read via direct table select, e.g. `getHashtags()`)

### Related Screens

- SCR006_SunKudosBoard (filter dropdown, `KudosFormModal`'s hashtag picker)

### Permission Rules

| Role          | Allow           | Conditions |
| ------------- | --------------- | ---------- |
| anon          | ✓ (SELECT only) | —          |
| authenticated | ✓ (SELECT only) | —          |

---

## PERM008_KudoHashtagsReadInsertBySender

**Type**: data-permission
**Enforced At**: Postgres RLS (`"kudo_hashtags readable by all"` `USING (true)`; `"kudo_hashtags insert by kudo sender"` `WITH CHECK (auth.uid() = (SELECT sender_id FROM kudos WHERE id = kudo_hashtags.kudo_id))`) + table GRANT `SELECT, INSERT` to `authenticated`, `SELECT` only to `anon` (live-verified)

### Description

Anyone can read which hashtags tag which kudo. A signed-in user may only insert a row for a kudo they themselves sent (subquery-scoped). No UPDATE/DELETE policy.

### Related Routes

- `submitKudoAction(formData)` — ROUTE002

### Related Screens

- SCR006_SunKudosBoard (`KudosFormModal` hashtag picker; hashtag filter)

### Permission Rules

| Role          | Allow               | Conditions                                                                            |
| ------------- | ------------------- | ------------------------------------------------------------------------------------- |
| anon          | ✓ (SELECT only)     | —                                                                                     |
| authenticated | ✓ (SELECT + INSERT) | INSERT only for a kudo whose `sender_id` is the caller; no UPDATE/DELETE for any role |

---

## PERM009_SecretBoxIconsReadOnly

**Type**: data-permission
**Enforced At**: Postgres RLS `"secret_box_icons readable by all"` (`USING (true)`) + table GRANT `SELECT` to `anon, authenticated` (live-verified)

### Description

The 6-row icon catalog (name, image, weight) is read-only for every client role. Hardened alongside the other 5 tables (see PERM005 note). Only `open_secret_box()` (PERM014) has any write-relevant path (reads `weight`; writes land in `user_icon_unlocks`/`profiles`, not here).

### Related Routes

- N/A (read inside `open_secret_box()`, server-side only)

### Related Screens

- SCR006_SunKudosBoard (REG004)

### Permission Rules

| Role          | Allow           | Conditions |
| ------------- | --------------- | ---------- |
| anon          | ✓ (SELECT only) | —          |
| authenticated | ✓ (SELECT only) | —          |

---

## PERM010_UserIconUnlocksReadOnly

**Type**: data-permission
**Enforced At**: Postgres RLS `"user_icon_unlocks readable by all"` (`USING (true)`) + table GRANT `SELECT` to `anon, authenticated`, **no client INSERT/UPDATE/DELETE policy at all** (live-verified)

### Description

Read-only for every client role by RLS design — the sole writer is `open_secret_box()` (PERM014), a `security definer` RPC that bypasses RLS entirely by design.

### Related Routes

- N/A (write path is exclusively the RPC — see PERM014)

### Related Screens

- SCR006_SunKudosBoard (REG004)

### Permission Rules

| Role          | Allow           | Conditions                               |
| ------------- | --------------- | ---------------------------------------- |
| anon          | ✓ (SELECT only) | —                                        |
| authenticated | ✓ (SELECT only) | All writes happen only via PERM014's RPC |

---

## PERM011_NotificationsOwnerOnly

**Type**: data-permission
**Enforced At**: Postgres RLS (`"notifications readable by self"` `USING (user_id = auth.uid())`; `"notifications update by self"` `USING (user_id = auth.uid())`) + table GRANT `SELECT, UPDATE` to `authenticated` **only — no `anon` grant at all** (live-verified — the one table with zero anonymous access)

### Description

The only table with no `anon` row in `information_schema.role_table_grants`. No INSERT/DELETE policy for any role — rows are seed/`service_role` only.

### Related Routes

- N/A (`NotificationMenu` is presentational-only per its own source comment — no route reads/writes this table despite the RLS/grant being fully live)

### Related Screens

- N/A this pass — `components/common/notification-menu.tsx` always renders an empty state

### Permission Rules

| Role          | Allow                              | Conditions                                                    |
| ------------- | ---------------------------------- | ------------------------------------------------------------- |
| anon          | ✗                                  | No grant of any kind                                          |
| authenticated | ✓ (SELECT + UPDATE, own rows only) | `user_id = auth.uid()` on both; no INSERT/DELETE for any role |

---

## PERM012_EventSettingsReadOnly

**Type**: data-permission
**Enforced At**: Postgres RLS `"event_settings readable by all"` (`USING (true)`) + table GRANT `SELECT` to `anon, authenticated` (live-verified)

### Description

Singleton config row (`launch_at`, `special_day_start`/`special_day_end`) is read-only for every client role. In practice the only reader of `special_day_*` is the BL004 trigger function server-side; `launch_at` is `[UNVERIFIED]` whether ever read at all by app code (the app reads `NEXT_PUBLIC_LAUNCH_AT` instead, per `data-model.md` MODEL009).

### Related Routes

- N/A (read only from inside the BL004 trigger body)

### Related Screens

- N/A directly — no screen queries this table

### Permission Rules

| Role          | Allow           | Conditions                         |
| ------------- | --------------- | ---------------------------------- |
| anon          | ✓ (SELECT only) | —                                  |
| authenticated | ✓ (SELECT only) | No client write path exists at all |

---

## PERM013_ProfileKudoStatsViewReadAll

**Type**: data-permission
**Enforced At**: Explicit `REVOKE ALL` then `GRANT SELECT` to `anon, authenticated` on the view + `security_invoker=on` view option (live-verified: `pg_class.reloptions = {security_invoker=on}`)

### Description

`profile_kudo_stats` is a `security_invoker=on` view — load-bearing: without it, the view would run with its owner's privileges and silently bypass the underlying `profiles`/`kudos` RLS for both `anon` and `authenticated` callers.

### Related Routes

- N/A (read via direct view select, e.g. `getSidebarOverview()`)

### Related Screens

- SCR006_SunKudosBoard (REG004 — sidebar stats, star tier, leaderboard)

### Permission Rules

| Role          | Allow           | Conditions                                                                                  |
| ------------- | --------------- | ------------------------------------------------------------------------------------------- |
| anon          | ✓ (SELECT only) | Runs with the CALLER's privileges — cannot see more than a direct query would already allow |
| authenticated | ✓ (SELECT only) | Same invoker-rights guarantee                                                               |

---

## PERM014_OpenSecretBoxRpcBoundary

**Type**: action-permission
**Enforced At**: Function-level `REVOKE ALL ... FROM public, anon` + `GRANT EXECUTE ... TO authenticated` (live-verified) + `security definer` + zero-parameter signature (live-verified: `pg_proc.prosecdef = true`, empty argument list)

### Description

`open_secret_box()` fits no canonical Background Logic type (checked against all 10 in `code-formats.md` — not `observer` (invoked on-demand, not a lifecycle hook), not `queue-worker`/`scheduled-job` (synchronous, no queue/cron)); `behavior-logic.md` records this same judgment and assigns no `BL###`. Its access-control shape is the load-bearing fact: zero parameters (acted-on user is always `auth.uid()`, never client-selectable) + `security definer` (bypasses the caller's own RLS/grants to write `user_icon_unlocks` and the `profiles` box counters, both otherwise unwritable by any client) + `EXECUTE` revoked from `anon`/`public`. The row-locking (`FOR UPDATE`) atomicity guarantee is also part of this boundary — it prevents a double-click/replay from over-drawing.

### Related Routes

- `openSecretBox()` — ROUTE005
- `getSecretBoxStatus()` — ROUTE006 (read-only status check, same authenticated-only boundary via a direct `profiles` SELECT — see PERM003)

### Related Screens

- SCR006_SunKudosBoard (REG004)

### Permission Rules

| Role          | Allow             | Conditions                                                                                                            |
| ------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| anon          | ✗                 | `EXECUTE` revoked; cannot even attempt the call                                                                       |
| authenticated | ✓ (for self only) | Zero-parameter signature means "self" is the only possible target; raises `no_unopened_boxes` at `boxes_unopened = 0` |

### Related Modules

- `supabase/migrations/20260906192500_secret_box_draw.sql` (function definition)
- `app/sun-kudos/actions/open-secret-box.ts` (sole caller)

---

## PERM015_AdminRoleGate

**Type**: role-based
**Enforced At**: **Nowhere — not implemented.** `profiles.role` (CHECK IN `user`,`admin`) exists in the schema; exhaustive grep of `app/`, `components/`, `lib/`, `hooks/`, `constants/` finds it consumed only in generated `lib/supabase/database.types.ts`.

### Description

**Verified this pass, unchanged from `permissions.md`:** `components/homepage/user-menu.tsx:90-99` renders the "Admin Dashboard" `<li>`/`<button>` unconditionally for every signed-in user, with no `role` check and no `onClick` handler wired. No RLS policy, no table grant, no route, and no screen branches on `profiles.role` today. **This is a planned gate, not an implemented one** — tracked in `plans/260906-1903-profile-and-menus` phase 06 (Batch B). Do not describe this as a working gate in any downstream artifact.

### Related Routes

- N/A — no admin-scoped route exists

### Related Screens

- N/A — no admin screen exists; the inert menu item is chrome on `SiteHeader`'s `UserMenu`, shared across SCR004/SCR005/SCR006

### Permission Rules

| Role  | Allow | Conditions                                                                |
| ----- | ----- | ------------------------------------------------------------------------- |
| user  | —     | Menu item renders identically to admin — no differentiation exists        |
| admin | —     | `role = 'admin'` currently changes nothing observable anywhere in the app |

---

## PERM016_KudosSentForCallerView

**Type**: data-permission
**Enforced At**: View definition `public.kudos_sent_for_caller` with `security_invoker = off` (runs
with the view owner's privileges, not the caller's) + explicit `REVOKE ALL` then `GRANT SELECT` to
`authenticated` only (no `anon` grant at all) + the view's own `WHERE sender_id = auth.uid()`
predicate — all per `supabase/migrations/20260907010000_profile_read_layer.sql`, added this batch
(2026-09-07) for the new `/profile` screen's "Sent" feed. Not re-verified against a fresh live
`psql` session by this pass — read directly from the migration file, which is the authoritative
source for a view created in the same migration that defines it.

### Description

A caller-scoped read model over `kudos`, built for `/profile`'s own-sent-Kudos feed. This is the
**inverse** load-bearing shape from `PERM013_ProfileKudoStatsViewReadAll`: that view is
`security_invoker=on` specifically so it never bypasses RLS; this one is `security_invoker=off`
specifically so it CAN read past the base `kudos` table's permissive `"kudos readable by all"`
policy (PERM005) — the view needs to surface a caller's own anonymously-sent Kudos (`sender_id`,
`is_anonymous`, `anonymous_name`), which the board's own reads would otherwise mask for anyone but
the sender. The boundary is layered: the `WHERE sender_id = auth.uid()` predicate already returns
zero rows for `anon` (whose `auth.uid()` is null), but the migration's own comment is explicit that
the **GRANT**, not the WHERE clause, is the boundary actually being relied on — the same "default
ACL is not a boundary, revoke before grant" discipline already applied to `profiles`/
`profile_kudo_stats` (PERM003/PERM013) and the six tables hardened in
`20260906195000_table_grants_hardening.sql`.

### Related Routes

- N/A directly (read via `lib/profile/feed-queries.ts` → `getSentFeed()`, which takes **no** target
  parameter — called from the new `loadProfileFeedPage()` Server Action, ROUTE008 in `route-list.md`)

### Related Screens

- `/profile` (new this batch; not yet cataloged with its own SCR### code — see this pass's
  advisory on the new Profile feature, `feature-list.md`/`screen-list.md`)

### Permission Rules

| Role          | Allow                          | Conditions                                                                                                                                               |
| ------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| anon          | ✗                              | No grant of any kind; the WHERE clause alone would also already return zero rows                                                                         |
| authenticated | ✓ (SELECT, own sent rows only) | `sender_id = auth.uid()`; `getSentFeed()` has no id/target argument anywhere in its call chain, so there is no path to widen this to another user's rows |

### Related Modules

- `supabase/migrations/20260907010000_profile_read_layer.sql` (view + REVOKE/GRANT)
- `lib/profile/feed-queries.ts` (`getSentFeed`, sole reader)

### Standing item this permission does NOT close

The base `kudos` table itself is unchanged and still carries `"kudos readable by all"` (`USING
(true)`) for both `anon` and `authenticated` (PERM005) — a direct PostgREST/API call with only the
public `anon` key can still read any row's `sender_id` directly off `kudos`, including on an
anonymous send, independent of this view. This is the same standing tension already recorded for
`/sun-kudos` in `permissions.md`'s Special Conditions. `PERM016` closes the leak for the
`/profile` "Sent" surface only, by an explicit scope decision this batch (narrowing `kudos`' own
SELECT policy would break the live board's queries mid-flight) — it is not a project-wide fix, and
should not be described as one in any downstream artifact.

---

## Summary

- **Total Permission Items**: 16
- **By Type**: route-guard: 2, screen-permission: 0, action-permission: 1, data-permission: 11, role-based: 1, resource-ownership: 0, field-permission: 1, api-scope: 0, feature-flag: 0, experiment: 0, env-gate: 0, locale-gate: 0

_(Note: this tally is recomputed directly from the 16 Index rows above — 15 from the original
2026-09-07 pass plus PERM016, added the same day once the `/profile` screen's read layer shipped.
`permissions.md` previously carried its own copy of the 15-item tally with `data-permission: 11`,
summing to 16 against a stated total of 15; that duplicate Summary has since been removed — this
artifact is now the single tally, and `permissions.md` is not updated with PERM016's count to avoid
reintroducing that same duplication.)_

_(Several `data-permission` items are themselves ownership-scoped in their `WITH CHECK`/`USING`
clause — e.g. PERM005's `sender_id = auth.uid()`, PERM006's `user_id = auth.uid()` — but are typed
`data-permission` rather than `resource-ownership` because they gate an entire table's CRUD surface
rather than a single ownership relationship layered onto an otherwise-open resource; carried forward
from `permissions.md` as a judgment call, flagged for reviewer cross-check.)_

---

## Cross-Reference Validation

- [x] All PERM### codes are unique (PERM001–PERM016, contiguous)
- [ ] All PERM### codes are referenced in FeatureList.md — N/A this wave, FeatureList.md does not exist until W5/W5.6
- [x] All related route references are valid (ROUTE001–ROUTE006 all exist in route-list.md, gate-passed)
- [x] All related screen references are valid (SCR002, SCR003, SCR004, SCR005, SCR006 all exist in screen-list.md, gate-passed; REG001/REG003/REG004 references validated against SCR006's Regions table)
- [x] All related module references are valid
- [x] No orphaned permission references

---

## Client-Side Gate Types

The four types below (`feature-flag`, `experiment`, `env-gate`, `locale-gate`) are client-side gates.
**Zero qualifying entries found this run** — exhaustive grep across `app/`, `components/`, `lib/`,
`hooks/`, `constants/` for each type's extraction signature returned no hits:

- `feature-flag`: no `useFlag|useFeature|isEnabled|featureFlag\(|checkFlag` call sites.
- `experiment`: no `useExperiment|getVariant|abTest\(|experiment\.variant|useAbTest` call sites.
- `env-gate`: no `process\.env\.`/`import\.meta\.env\.` comparison driving a UI branch (env vars
  present, e.g. `NEXT_PUBLIC_LAUNCH_AT`, are read as configuration values, not compared for a
  gate/branch).
- `locale-gate`: `i18n.language`/locale reads exist (`lib/i18n/*`, `LanguageSelector`) but drive which
  translation bundle renders, not a conditional branch hiding/showing a distinct UI path per locale —
  does not qualify as a locale-gate per the extraction signature ("UI branch conditioned on the active
  locale"), it is the i18n system itself.

No `PERM###` entries of these 4 types exist in the Index above; this is a confirmed absence, not an
omission.
