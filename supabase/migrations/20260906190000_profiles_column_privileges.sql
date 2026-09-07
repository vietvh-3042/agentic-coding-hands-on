-- Phase 01 security hardening (Batch A) — close the profiles privilege-
-- escalation hole. See plans/260710-1511-sun-kudos-live-board/reports/
--   security-260906-1740-profiles-privilege-escalation.md for the live proof
-- and supabase/tests/privileges.sql for the executable assertion.
--
-- The only UPDATE policy on public.profiles ("profiles updatable by owner",
-- 20260716090000_profile_language.sql) restricts WHICH ROW may be updated
-- (auth.uid() = id) — Postgres RLS has no per-column WITH CHECK, so it never
-- restricted WHICH COLUMN. A pre-existing postgres-owned default ACL on
-- schema public grants ALL (arwdDxtm) to BOTH anon and authenticated on
-- every table the instant it is created — profiles included, never asserted
-- narrower by any prior migration. Combined, any signed-in user could run
-- `profiles.update({ role: 'admin' })` on their own row and self-promote to
-- admin (also true of hero_badge/hero_code/boxes_opened/boxes_unopened).
--
-- Fix: REVOKE the inherited table-wide grant, then GRANT back only what
-- each role legitimately needs. RLS keeps doing row-scoping; the GRANT now
-- does column-scoping for authenticated's UPDATE.
--
-- IMPORTANT — the default ACL is not a safety net anywhere in this schema.
-- It is schema-level (ALTER DEFAULT PRIVILEGES ... IN SCHEMA public), so
-- every table this project creates — including every table phase 03 adds —
-- inherits the same wide-open ALL grant to anon/authenticated the moment it
-- is created. Privileges are NOT safely inherited here: each new table's own
-- migration must assert its own GRANTs explicitly, the same way
-- 20260722100000_kudo_hearts.sql and 20260723090000_notifications.sql
-- already do, and the same way this migration now does for profiles.
--
-- Scope decision (goes beyond the literal "REVOKE UPDATE" request): this
-- REVOKEs ALL privileges, not just UPDATE, from anon and authenticated on
-- profiles, then re-grants exactly what is needed. Reasons:
--   - TRUNCATE bypasses row-level security entirely (RLS never governs
--     TRUNCATE), so an unrestricted TRUNCATE grant is a live denial-of-
--     service regardless of any UPDATE fix — neither role needs it.
--   - profiles rows are created only by the security-definer
--     handle_new_user() trigger (20260722090000_create_profile_on_signup.sql,
--     runs as postgres, unaffected by these grants) and deleted only via the
--     auth.users foreign-key cascade — no direct-client INSERT/DELETE path
--     on profiles is legitimate for anon or authenticated.
--   - REFERENCES/TRIGGER are unused default-ACL leftovers with no product
--     use for a client role here.
-- Net result: anon keeps SELECT only (satisfies FN-2 — anon cannot update
-- profiles at all); authenticated keeps SELECT plus UPDATE narrowed to
-- display_name/avatar_url/language only (satisfies FN-1/FN-3).
--
-- NFR-2 unaffected: service_role (20260722070000_grant_table_privileges.sql)
-- and the security-definer trigger both run outside anon/authenticated and
-- are untouched by this REVOKE.
--
-- Idempotent: REVOKE/GRANT are non-erroring no-ops when already applied, so
-- this survives `supabase db reset` re-runs.

revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to anon, authenticated;

grant update (display_name, avatar_url, language) on public.profiles to authenticated;
