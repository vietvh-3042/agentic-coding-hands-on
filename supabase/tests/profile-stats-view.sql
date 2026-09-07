-- Phase 03 gate: public.profile_kudo_stats view.
-- See plans/260710-1511-sun-kudos-live-board/phase-03-schema-migrations.md
--   FN-7.
--
-- RED before supabase/migrations/20260906191500_profile_stats_view.sql lands
-- (undefined_table, 42P01 — "relation public.profile_kudo_stats does not
-- exist"). GREEN after (exit 0).
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/profile-stats-view.sql
--
-- Runs inside a transaction that is always rolled back.

begin;

-- ---------------------------------------------------------------------
-- Part 1 — the view exists, has one row per profile, and every row's
-- aggregates match the source tables directly (kudos, kudo_hearts via
-- kudos.hearts_count). This is checked against the live tables rather than
-- fixed numbers so it does not go stale as seed data changes.
-- ---------------------------------------------------------------------

do $$
declare
  v_view_rows integer;
  v_profile_rows integer;
begin
  select count(*) into v_view_rows from public.profile_kudo_stats;
  select count(*) into v_profile_rows from public.profiles;
  if v_view_rows <> v_profile_rows then
    raise exception 'REGRESSION: profile_kudo_stats has % rows, profiles has % — expected one row per profile', v_view_rows, v_profile_rows;
  end if;
end $$;

do $$
declare
  v_mismatch integer;
begin
  select count(*) into v_mismatch
  from public.profile_kudo_stats s
  where s.kudos_received <> (select count(*) from public.kudos k where k.receiver_id = s.id)
     or s.kudos_sent <> (select count(*) from public.kudos k where k.sender_id = s.id)
     or s.hearts_received <> (select coalesce(sum(k.hearts_count), 0) from public.kudos k where k.receiver_id = s.id);

  if v_mismatch <> 0 then
    raise exception 'REGRESSION: % profile_kudo_stats row(s) mismatch their source aggregates', v_mismatch;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 2 — security_invoker = on, so the view runs with the caller's own
-- RLS, not the view owner's.
-- ---------------------------------------------------------------------

do $$
declare
  v_opts text[];
begin
  select reloptions into v_opts
  from pg_class
  where relname = 'profile_kudo_stats' and relnamespace = 'public'::regnamespace;

  if v_opts is null or not (v_opts && array['security_invoker=on', 'security_invoker=true']) then
    raise exception 'REGRESSION: profile_kudo_stats is missing security_invoker=on (reloptions: %)', v_opts;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 3 — grant baseline: read-only to anon/authenticated.
-- ---------------------------------------------------------------------

do $$
begin
  if not has_table_privilege('anon', 'public.profile_kudo_stats', 'SELECT') then
    raise exception 'REGRESSION: anon lost SELECT on profile_kudo_stats';
  end if;
  if not has_table_privilege('authenticated', 'public.profile_kudo_stats', 'SELECT') then
    raise exception 'REGRESSION: authenticated lost SELECT on profile_kudo_stats';
  end if;
  if has_table_privilege('anon', 'public.profile_kudo_stats', 'INSERT') then
    raise exception 'REGRESSION: anon holds INSERT on profile_kudo_stats';
  end if;
  if has_table_privilege('authenticated', 'public.profile_kudo_stats', 'UPDATE') then
    raise exception 'REGRESSION: authenticated holds UPDATE on profile_kudo_stats';
  end if;
  if has_table_privilege('authenticated', 'public.profile_kudo_stats', 'DELETE') then
    raise exception 'REGRESSION: authenticated holds DELETE on profile_kudo_stats';
  end if;
end $$;

rollback;

\echo 'profile-stats-view.sql: all assertions passed'
