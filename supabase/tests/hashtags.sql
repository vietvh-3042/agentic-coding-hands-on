-- Phase 03 gate: hashtag taxonomy (public.hashtags + public.kudo_hashtags).
-- See plans/260710-1511-sun-kudos-live-board/phase-03-schema-migrations.md
--   FN-1/FN-2/FN-3.
--
-- RED before supabase/migrations/20260906191000_kudo_hashtags.sql lands
-- (undefined_table, 42P01 — "relation public.hashtags does not exist").
-- GREEN after (exit 0).
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/hashtags.sql
--
-- Runs inside a transaction that is always rolled back: no seed data or
-- schema state is left mutated by running this file, before or after the fix.

begin;

-- ---------------------------------------------------------------------
-- Part 1 — the 13-row master list, in the clarified order.
-- ---------------------------------------------------------------------

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.hashtags;
  if v_count <> 13 then
    raise exception 'REGRESSION: expected 13 seeded hashtags, found %', v_count;
  end if;
end $$;

do $$
declare
  v_first text;
  v_last text;
begin
  select name into v_first from public.hashtags order by sort_order asc limit 1;
  select name into v_last from public.hashtags order by sort_order desc limit 1;
  if v_first is distinct from 'Toàn diện' then
    raise exception 'REGRESSION: expected first hashtag by sort_order to be "Toàn diện", found %', v_first;
  end if;
  if v_last is distinct from 'Quản lý xuất sắc' then
    raise exception 'REGRESSION: expected last hashtag by sort_order to be "Quản lý xuất sắc", found %', v_last;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 2 — taxonomy integrity of the join table.
--
-- This assertion originally read `count(*) = 0`, which was correct ONLY while
-- the 7-kudo pre-phase-04 seed existed: back then the sole source of
-- kudo_hashtags rows was the migration's free-text backfill, and that backfill
-- legitimately matched nothing (the blob "#Dedicated #Inspring..." shares zero
-- tokens with the 13 canonical Vietnamese names — an honestly-reported no-match,
-- never a fabricated mapping).
--
-- Phase 04 then seeded real join rows by name, so "stays empty forever" was
-- never the invariant — it was an artifact of the old fixture. Once seed.sql has
-- run, backfilled and seeded rows are indistinguishable, so the no-match outcome
-- is no longer observable here; the migration reports it via its own
-- `raise notice` at apply time.
--
-- What IS a real, durable invariant, and what this now asserts: every join row
-- points at a canonical hashtag, and no row references a name outside the 13.
-- ---------------------------------------------------------------------

do $$
declare
  v_kh_count integer;
  v_orphans  integer;
begin
  select count(*) into v_kh_count from public.kudo_hashtags;
  if v_kh_count = 0 then
    raise exception 'REGRESSION: kudo_hashtags is empty — the seed join rows are missing, so hashtag filtering cannot be exercised';
  end if;

  select count(*)
    into v_orphans
    from public.kudo_hashtags kh
    left join public.hashtags h on h.id = kh.hashtag_id
   where h.id is null;
  if v_orphans <> 0 then
    raise exception 'REGRESSION: % kudo_hashtags row(s) reference a hashtag outside the canonical 13', v_orphans;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 3 — live attempted INSERT as the `authenticated` role: a sender may
-- tag their own kudo, but not someone else's.
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  v_kudo_id uuid;
  v_hashtag_id bigint;
begin
  select id into v_kudo_id from public.kudos
    where sender_id = '00000000-0000-4000-8000-000000000001' limit 1;
  select id into v_hashtag_id from public.hashtags order by sort_order limit 1;

  if v_kudo_id is null then
    raise exception 'FIXTURE MISSING: no seeded kudo with sender 00000000-...-0001';
  end if;

  insert into public.kudo_hashtags (kudo_id, hashtag_id) values (v_kudo_id, v_hashtag_id);
end $$;

do $$
declare
  v_kudo_id uuid;
  v_hashtag_id bigint;
begin
  select id into v_kudo_id from public.kudos
    where sender_id <> '00000000-0000-4000-8000-000000000001' limit 1;
  select id into v_hashtag_id from public.hashtags order by sort_order limit 1;

  begin
    insert into public.kudo_hashtags (kudo_id, hashtag_id) values (v_kudo_id, v_hashtag_id);
    raise exception 'REGRESSION: authenticated user tagged a kudo they did not send';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Part 4 — grant baseline: the default ACL grants ALL to anon/authenticated
-- on every new table (phase 01 proved this live) — assert the explicit
-- REVOKE/GRANT this migration must issue actually narrowed it.
-- ---------------------------------------------------------------------

do $$
begin
  if has_table_privilege('anon', 'public.hashtags', 'INSERT') then
    raise exception 'REGRESSION: anon holds INSERT on hashtags';
  end if;
  if has_table_privilege('anon', 'public.hashtags', 'TRUNCATE') then
    raise exception 'REGRESSION: anon holds TRUNCATE on hashtags';
  end if;
  if has_table_privilege('authenticated', 'public.hashtags', 'INSERT') then
    raise exception 'REGRESSION: authenticated holds INSERT on hashtags';
  end if;
  if has_table_privilege('authenticated', 'public.hashtags', 'TRUNCATE') then
    raise exception 'REGRESSION: authenticated holds TRUNCATE on hashtags';
  end if;
  if not has_table_privilege('anon', 'public.hashtags', 'SELECT') then
    raise exception 'REGRESSION: anon lost SELECT on hashtags';
  end if;

  if has_table_privilege('anon', 'public.kudo_hashtags', 'INSERT') then
    raise exception 'REGRESSION: anon holds INSERT on kudo_hashtags';
  end if;
  if has_table_privilege('anon', 'public.kudo_hashtags', 'TRUNCATE') then
    raise exception 'REGRESSION: anon holds TRUNCATE on kudo_hashtags';
  end if;
  if has_table_privilege('authenticated', 'public.kudo_hashtags', 'TRUNCATE') then
    raise exception 'REGRESSION: authenticated holds TRUNCATE on kudo_hashtags';
  end if;
  if not has_table_privilege('authenticated', 'public.kudo_hashtags', 'INSERT') then
    raise exception 'REGRESSION: authenticated cannot insert kudo_hashtags';
  end if;
  if not has_table_privilege('anon', 'public.kudo_hashtags', 'SELECT') then
    raise exception 'REGRESSION: anon lost SELECT on kudo_hashtags';
  end if;
end $$;

rollback;

\echo 'hashtags.sql: all assertions passed'
