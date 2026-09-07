-- Phase 01 security gate: public.profiles column-privilege escalation.
-- See plans/260710-1511-sun-kudos-live-board/reports/
--   security-260906-1740-profiles-privilege-escalation.md for the proof this
-- codifies, and plans/260710-1511-sun-kudos-live-board/
--   phase-01-security-profiles-column-privileges.md for the requirements
-- (FN-1/FN-2/FN-3).
--
-- RED before supabase/migrations/20260906190000_profiles_column_privileges.sql
-- lands (non-zero exit, "REGRESSION: ..." message). GREEN after (exit 0).
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/privileges.sql
--
-- Uses the seeded NON-admin user 00000000-0000-4000-8000-000000000002. The
-- other seeded user (...0001) is role='admin' by design (seed.sql) — using
-- it here would let every assertion below pass vacuously.
--
-- Runs inside a transaction that is always rolled back: no seed data or
-- schema state is left mutated by running this file, before or after the fix.

begin;

-- ---------------------------------------------------------------------
-- Part 1 — live attempted UPDATE as the `authenticated` role (not just an
-- information_schema read). This is the actual escalation path: a real
-- PostgREST request runs as this role with this JWT claim shape.
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

-- Forbidden: privileged columns must raise insufficient_privilege (42501)
-- before any row is touched — WHICH ROW (RLS) is a separate, unrelated gate
-- from WHICH COLUMN (GRANT), and this suite only proves the latter.
do $$
begin
  begin
    update public.profiles set role = 'admin'
      where id = '00000000-0000-4000-8000-000000000002';
    raise exception 'REGRESSION: profiles.role is user-writable by authenticated';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles set hero_badge = 'legend'
      where id = '00000000-0000-4000-8000-000000000002';
    raise exception 'REGRESSION: profiles.hero_badge is user-writable by authenticated';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles set hero_code = 'HACKED'
      where id = '00000000-0000-4000-8000-000000000002';
    raise exception 'REGRESSION: profiles.hero_code is user-writable by authenticated';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles set boxes_opened = 999
      where id = '00000000-0000-4000-8000-000000000002';
    raise exception 'REGRESSION: profiles.boxes_opened is user-writable by authenticated';
  exception when insufficient_privilege then null;
  end;
end $$;

do $$
begin
  begin
    update public.profiles set boxes_unopened = 999
      where id = '00000000-0000-4000-8000-000000000002';
    raise exception 'REGRESSION: profiles.boxes_unopened is user-writable by authenticated';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Positive case: the three self-service columns stay writable by the row
-- owner (no-op values so this is safe to run against real seed data inside
-- the rolled-back transaction). A failure here would mean the fix broke the
-- language switcher / profile edit path, not just the escalation.
update public.profiles set display_name = display_name
  where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set avatar_url = avatar_url
  where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set language = language
  where id = '00000000-0000-4000-8000-000000000002';

reset role;

-- ---------------------------------------------------------------------
-- Part 2 — grant baseline (information_schema / privilege functions).
-- Not used for anon: an anon-role UPDATE never raises insufficient_privilege
-- either way here — the "profiles updatable by owner" policy is scoped
-- `to authenticated` only, so an anon UPDATE is silently 0-rows-affected via
-- RLS row-filtering even while anon still held the full table-wide grant.
-- That is a real defense-in-depth gap (anon should not hold the grant at
-- all), but it cannot be proven via a live UPDATE attempt — has_table_
-- privilege() is the only way to observe it, so it is checked here instead.
-- ---------------------------------------------------------------------

do $$
begin
  if has_table_privilege('anon', 'public.profiles', 'UPDATE') then
    raise exception 'REGRESSION: anon holds table-wide UPDATE on profiles';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'INSERT') then
    raise exception 'REGRESSION: anon holds INSERT on profiles';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'DELETE') then
    raise exception 'REGRESSION: anon holds DELETE on profiles';
  end if;
  if has_table_privilege('anon', 'public.profiles', 'TRUNCATE') then
    raise exception 'REGRESSION: anon holds TRUNCATE on profiles (bypasses RLS entirely)';
  end if;
  if not has_table_privilege('anon', 'public.profiles', 'SELECT') then
    raise exception 'REGRESSION: anon lost SELECT on profiles';
  end if;
end $$;

do $$
begin
  if has_table_privilege('authenticated', 'public.profiles', 'UPDATE') then
    raise exception 'REGRESSION: authenticated holds table-wide UPDATE on profiles (expected column-scoped only)';
  end if;
  if has_table_privilege('authenticated', 'public.profiles', 'INSERT') then
    raise exception 'REGRESSION: authenticated holds INSERT on profiles';
  end if;
  if has_table_privilege('authenticated', 'public.profiles', 'DELETE') then
    raise exception 'REGRESSION: authenticated holds DELETE on profiles';
  end if;
  if has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE') then
    raise exception 'REGRESSION: authenticated holds TRUNCATE on profiles (bypasses RLS entirely)';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE') then
    raise exception 'REGRESSION: authenticated can update profiles.role (column grant)';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE') then
    raise exception 'REGRESSION: authenticated cannot update profiles.display_name';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'UPDATE') then
    raise exception 'REGRESSION: authenticated cannot update profiles.avatar_url';
  end if;
  if not has_column_privilege('authenticated', 'public.profiles', 'language', 'UPDATE') then
    raise exception 'REGRESSION: authenticated cannot update profiles.language';
  end if;
end $$;

rollback;

\echo 'privileges.sql: all assertions passed'
