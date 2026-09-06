-- Batch B security hardening: close the default-ACL privilege-escalation
-- hole on the six tables phase 01/03 never explicitly hardened. See
-- supabase/tests/table-grants.sql for the executable assertion (the RED it
-- captures: `TRUNCATE public.kudo_hearts CASCADE` succeeds as
-- `authenticated`, wiping the table — RLS never governs TRUNCATE).
--
-- Root cause: the postgres-owned default ACL on schema public grants ALL
-- (arwdDxtm) to BOTH anon and authenticated the instant a table is created.
-- 20260906190000_profiles_column_privileges.sql, 20260906191000_kudo_hashtags.sql
-- and 20260906191500_profile_stats_view.sql each REVOKEd this on their own
-- table; event_settings (20260714080000), kudos
-- (20260714070000/20260716100000), kudo_hearts (20260722100000),
-- notifications (20260723090000), secret_box_icons and user_icon_unlocks
-- (20260714070000) never did — each of those migrations only ADDED a narrow
-- explicit grant (e.g. `grant insert, delete on kudo_hearts`) on top of the
-- still-present default-ACL ALL grant, so TRUNCATE, DELETE, UPDATE,
-- REFERENCES and TRIGGER stayed live for both roles regardless of RLS.
--
-- 20260906193500_default_privileges_baseline.sql only changed what FUTURE
-- tables inherit — ALTER DEFAULT PRIVILEGES never touches privileges
-- already granted on an existing table, as that migration's own comment
-- says — so it did not, and could not, retroactively fix these six. This
-- migration is that fix.
--
-- Fix: REVOKE ALL from anon/authenticated on each of the six tables below,
-- then GRANT back only what the app + each table's own RLS policies
-- actually use (verified against app/sun-kudos/actions/*.ts and
-- lib/kudos/*.ts, not guessed). TRUNCATE/REFERENCES/TRIGGER are granted to
-- neither role anywhere in this migration: TRUNCATE bypasses RLS entirely,
-- and REFERENCES/TRIGGER have no product use for a client role in this
-- schema.
--
-- Idempotent: REVOKE/GRANT are non-erroring no-ops when already applied, so
-- this survives repeated `npx supabase db reset`.

-- event_settings — singleton launch/event config. "event_settings readable
-- by all" (20260714080000) already covers anon+authenticated SELECT (the
-- board's special_day_* read in lib/kudos/board-aggregates.ts, and the
-- resolve_heart_value() trigger's own server-side read runs as owner,
-- unaffected by these grants). No insert/update/delete policy exists for
-- either role — the only writer is a manual seed/migration run as postgres.
revoke all on public.event_settings from anon, authenticated;
grant select on public.event_settings to anon, authenticated;

-- kudos — "kudos readable by all" (20260714070000) covers anon+authenticated
-- SELECT; "kudos insert by sender" (20260716100000) is the only write
-- policy, sender_id = auth.uid(), exercised by
-- app/sun-kudos/actions/submit-kudo.ts. hearts_count is maintained only by
-- sync_kudo_hearts_count() (security definer, runs as owner) — no
-- client-side UPDATE/DELETE path exists anywhere in the app or its RLS.
revoke all on public.kudos from anon, authenticated;
grant select on public.kudos to anon, authenticated;
grant insert on public.kudos to authenticated;

-- kudo_hearts — "kudo_hearts readable by all" (20260722100000) covers
-- anon+authenticated SELECT; "insert by self, not own kudo" and "delete by
-- self" are the only write policies, exercised by the heart-toggle Server
-- Action (app/sun-kudos/actions/heart-kudo.ts). No UPDATE policy or
-- app-code path exists — a heart is inserted or deleted, never modified in
-- place; hearts_value is resolved server-side by resolve_heart_value()
-- (security definer), not writable directly.
revoke all on public.kudo_hearts from anon, authenticated;
grant select on public.kudo_hearts to anon, authenticated;
grant insert, delete on public.kudo_hearts to authenticated;

-- notifications — both of its own RLS policies ("readable by self",
-- "update by self", 20260723090000) are scoped `to authenticated` only; no
-- anon policy exists at all, and components/common/notification-menu.tsx
-- only renders for a signed-in user. So anon gets NO grant here (not even
-- SELECT) — least privilege matching the app's actual access shape, not
-- just RLS row-filtering down to zero rows. authenticated keeps SELECT
-- (own rows) and UPDATE (mark-as-read). No INSERT/DELETE policy exists for
-- either role — rows are seed/service_role only, per this table's own
-- migration comment.
revoke all on public.notifications from anon, authenticated;
grant select, update on public.notifications to authenticated;

-- secret_box_icons — "secret_box_icons readable by all" (20260714070000)
-- covers anon+authenticated SELECT. Every write happens inside
-- open_secret_box() (20260906192500), a `security definer` RPC that runs as
-- the table owner and is unaffected by client grants — no client
-- INSERT/UPDATE/DELETE path exists or should exist.
revoke all on public.secret_box_icons from anon, authenticated;
grant select on public.secret_box_icons to anon, authenticated;

-- user_icon_unlocks — "user_icon_unlocks readable by all" (20260714070000)
-- covers anon+authenticated SELECT, by design SELECT-only for clients; the
-- same open_secret_box() RPC is the only writer.
revoke all on public.user_icon_unlocks from anon, authenticated;
grant select on public.user_icon_unlocks to anon, authenticated;
