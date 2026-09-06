-- Batch B security gate: default-ACL privilege escalation on the six
-- tables phase 01/03 never explicitly hardened (event_settings, kudos,
-- kudo_hearts, notifications, secret_box_icons, user_icon_unlocks).
--
-- Live proof (reproduced, then rolled back, ahead of this file): the
-- postgres-owned default ACL on schema public grants ALL (arwdDxtm) to BOTH
-- anon and authenticated the instant a table is created. Only profiles,
-- hashtags, kudo_hashtags and profile_kudo_stats ever REVOKEd it
-- (20260906190000/20260906191000/20260906191500). The six tables above
-- never did — each only ADDED a narrow explicit grant on top of the
-- still-present ALL grant — so any signed-in user (and anon too) can run
-- `TRUNCATE public.kudo_hearts CASCADE` and wipe the table. RLS never
-- governs TRUNCATE, so no RLS policy stops this.
--
-- RED before supabase/migrations/20260906195000_table_grants_hardening.sql
-- lands (non-zero exit, "REGRESSION: ..." message). GREEN after.
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/table-grants.sql
--
-- Runs inside a transaction that is always rolled back: no seed data or
-- schema state is left mutated by running this file, before or after the
-- fix — even a *successful* (i.e. regression) TRUNCATE below is undone by
-- the final ROLLBACK.

begin;

-- ---------------------------------------------------------------------
-- Part 1 — blanket TRUNCATE/REFERENCES/TRIGGER check across EVERY table in
-- schema public, enumerated dynamically via pg_tables. None of these three
-- privileges has any legitimate client use anywhere in this schema — every
-- write goes through either an explicit RLS-checked policy (plain
-- INSERT/UPDATE/DELETE) or a `security definer` RPC that runs as the table
-- owner. Enumerating dynamically (not a hand-listed set) means a table
-- added later is covered automatically, which is exactly the gap that let
-- this hole survive two prior hardening passes.
-- ---------------------------------------------------------------------

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    if has_table_privilege('anon', format('public.%I', t.tablename), 'TRUNCATE') then
      raise exception 'REGRESSION: anon holds TRUNCATE on public.% (bypasses RLS entirely)', t.tablename;
    end if;
    if has_table_privilege('authenticated', format('public.%I', t.tablename), 'TRUNCATE') then
      raise exception 'REGRESSION: authenticated holds TRUNCATE on public.% (bypasses RLS entirely)', t.tablename;
    end if;
    if has_table_privilege('anon', format('public.%I', t.tablename), 'REFERENCES') then
      raise exception 'REGRESSION: anon holds REFERENCES on public.%', t.tablename;
    end if;
    if has_table_privilege('authenticated', format('public.%I', t.tablename), 'REFERENCES') then
      raise exception 'REGRESSION: authenticated holds REFERENCES on public.%', t.tablename;
    end if;
    if has_table_privilege('anon', format('public.%I', t.tablename), 'TRIGGER') then
      raise exception 'REGRESSION: anon holds TRIGGER on public.%', t.tablename;
    end if;
    if has_table_privilege('authenticated', format('public.%I', t.tablename), 'TRIGGER') then
      raise exception 'REGRESSION: authenticated holds TRIGGER on public.%', t.tablename;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Part 2 — live exploit reproduction: attempt a REAL TRUNCATE as the
-- `authenticated` role, for every table in schema public, dynamically.
-- has_table_privilege() (Part 1) only proves the catalog entry; this proves
-- the actual statement a real PostgREST/psql session would run is refused —
-- matching the live proof that motivated this migration (kudo_hearts
-- truncated to 0 rows as `authenticated` before the fix).
-- ---------------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    begin
      execute format('truncate table public.%I cascade', t.tablename);
      raise exception 'REGRESSION: TRUNCATE succeeded as authenticated on public.% (bypasses RLS entirely)', t.tablename;
    exception
      when insufficient_privilege then null; -- expected: permission denied
    end;
  end loop;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Part 3 — exact grant matrix for the six tables this migration hardens.
-- One row per (table, role, privilege, expected) triple, looped rather than
-- hand-written per assertion, so the matrix stays readable as the single
-- source of truth for "what does each role actually need on this table".
-- Derived from app/sun-kudos/actions/*.ts, lib/kudos/*.ts and each table's
-- own RLS policies — not guessed.
-- ---------------------------------------------------------------------

do $$
declare
  m record;
  v_actual boolean;
begin
  for m in
    select * from (values
      -- event_settings — singleton launch/event config, read-only to
      -- clients. Only writer is a manual seed/migration run as postgres.
      ('event_settings',    'anon',          'SELECT', true),
      ('event_settings',    'anon',          'INSERT', false),
      ('event_settings',    'anon',          'UPDATE', false),
      ('event_settings',    'anon',          'DELETE', false),
      ('event_settings',    'authenticated', 'SELECT', true),
      ('event_settings',    'authenticated', 'INSERT', false),
      ('event_settings',    'authenticated', 'UPDATE', false),
      ('event_settings',    'authenticated', 'DELETE', false),

      -- kudos — board reads for both roles; insert only as sender
      -- (authenticated). hearts_count is trigger-maintained only.
      ('kudos',             'anon',          'SELECT', true),
      ('kudos',             'anon',          'INSERT', false),
      ('kudos',             'anon',          'UPDATE', false),
      ('kudos',             'anon',          'DELETE', false),
      ('kudos',             'authenticated', 'SELECT', true),
      ('kudos',             'authenticated', 'INSERT', true),
      ('kudos',             'authenticated', 'UPDATE', false),
      ('kudos',             'authenticated', 'DELETE', false),

      -- kudo_hearts — board reads for both roles; insert/delete as self
      -- (the heart-toggle Server Action). No UPDATE path (a heart is
      -- inserted or deleted, never modified in place).
      ('kudo_hearts',       'anon',          'SELECT', true),
      ('kudo_hearts',       'anon',          'INSERT', false),
      ('kudo_hearts',       'anon',          'UPDATE', false),
      ('kudo_hearts',       'anon',          'DELETE', false),
      ('kudo_hearts',       'authenticated', 'SELECT', true),
      ('kudo_hearts',       'authenticated', 'INSERT', true),
      ('kudo_hearts',       'authenticated', 'UPDATE', false),
      ('kudo_hearts',       'authenticated', 'DELETE', true),

      -- notifications — self-scoped bell, `to authenticated` RLS only; anon
      -- gets no grant at all (the bell never renders for a signed-out
      -- visitor). authenticated reads its own rows and marks them read.
      ('notifications',     'anon',          'SELECT', false),
      ('notifications',     'anon',          'INSERT', false),
      ('notifications',     'anon',          'UPDATE', false),
      ('notifications',     'anon',          'DELETE', false),
      ('notifications',     'authenticated', 'SELECT', true),
      ('notifications',     'authenticated', 'INSERT', false),
      ('notifications',     'authenticated', 'UPDATE', true),
      ('notifications',     'authenticated', 'DELETE', false),

      -- secret_box_icons — reference catalog, read-only to both roles.
      -- open_secret_box() (security definer) is the only writer.
      ('secret_box_icons',  'anon',          'SELECT', true),
      ('secret_box_icons',  'anon',          'INSERT', false),
      ('secret_box_icons',  'anon',          'UPDATE', false),
      ('secret_box_icons',  'anon',          'DELETE', false),
      ('secret_box_icons',  'authenticated', 'SELECT', true),
      ('secret_box_icons',  'authenticated', 'INSERT', false),
      ('secret_box_icons',  'authenticated', 'UPDATE', false),
      ('secret_box_icons',  'authenticated', 'DELETE', false),

      -- user_icon_unlocks — read-only to both roles by design; same RPC is
      -- the only writer.
      ('user_icon_unlocks', 'anon',          'SELECT', true),
      ('user_icon_unlocks', 'anon',          'INSERT', false),
      ('user_icon_unlocks', 'anon',          'UPDATE', false),
      ('user_icon_unlocks', 'anon',          'DELETE', false),
      ('user_icon_unlocks', 'authenticated', 'SELECT', true),
      ('user_icon_unlocks', 'authenticated', 'INSERT', false),
      ('user_icon_unlocks', 'authenticated', 'UPDATE', false),
      ('user_icon_unlocks', 'authenticated', 'DELETE', false)
    ) as x(tbl, grantee, priv, expected)
  loop
    v_actual := has_table_privilege(m.grantee, format('public.%I', m.tbl), m.priv);
    if v_actual is distinct from m.expected then
      raise exception 'REGRESSION: has_table_privilege(%, public.%, %) = % (expected %)',
        m.grantee, m.tbl, m.priv, v_actual, m.expected;
    end if;
  end loop;
end $$;

rollback;

\echo 'table-grants.sql: all assertions passed'
