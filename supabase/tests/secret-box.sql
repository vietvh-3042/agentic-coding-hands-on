-- Phase 03 gate: secret-box weighted draw (public.open_secret_box()).
-- See plans/260710-1511-sun-kudos-live-board/phase-03-schema-migrations.md
--   FN-6, spec/secret-box-reveal/technical-spec.md BR-001..BR-004.
--
-- RED before supabase/migrations/20260906192500_secret_box_draw.sql lands
-- (undefined_column on secret_box_icons.weight, 42703, or undefined_function
-- on open_secret_box(), 42883). GREEN after (exit 0).
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/secret-box.sql
--
-- Runs inside a transaction that is always rolled back — including the
-- synthetic auth.users/profiles row created for the 10,000-draw
-- distribution sample.

begin;

-- ---------------------------------------------------------------------
-- Part 0 — RED gate marker: weight column + RPC must exist.
-- ---------------------------------------------------------------------

do $$
begin
  perform weight from public.secret_box_icons limit 1;
end $$;

do $$
begin
  perform 1 from pg_proc where proname = 'open_secret_box' and pronamespace = 'public'::regnamespace;
  if not found then
    raise exception 'RED: public.open_secret_box() does not exist yet';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 1 — the six real names/weights, summing to 100.
-- ---------------------------------------------------------------------

do $$
declare
  v_count integer;
  v_total_weight integer;
begin
  select count(*), sum(weight) into v_count, v_total_weight from public.secret_box_icons;
  if v_count <> 6 then
    raise exception 'REGRESSION: expected 6 secret_box_icons rows, found %', v_count;
  end if;
  if v_total_weight <> 100 then
    raise exception 'REGRESSION: expected weights to sum to 100, found %', v_total_weight;
  end if;
end $$;

do $$
declare
  v_names text[];
begin
  select array_agg(name order by sort_order) into v_names from public.secret_box_icons;
  if v_names <> array[
    'Stay Gold', 'Flow to Horizon', 'Touch of Light',
    'Beyond the Boundary', 'Revival', 'Root Further'
  ] then
    raise exception 'REGRESSION: secret_box_icons names/order do not match the real catalog: %', v_names;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 2 — successful draw.
--
-- This part PROVISIONS its own unopened box rather than relying on the seed's
-- starting count for user 0001. The e2e suite draws real boxes for that same
-- identity, so after a full `pnpm test:e2e` run the seeded balance is spent and
-- this assertion used to fail with `no_unopened_boxes` — a false regression that
-- depended purely on whether the tests had been run in a particular order.
-- The whole file executes inside the transaction opened at the top and rolled
-- back at the bottom, so topping the balance up here changes no committed state.
-- ---------------------------------------------------------------------

-- Provision as owner, BEFORE dropping to the authenticated role: phase 01's
-- column grants deliberately deny `authenticated` any write to these columns.
update public.profiles
set boxes_unopened = boxes_unopened + 1
where id = '00000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000001';
  v_before_opened integer;
  v_before_unopened integer;
  v_after_opened integer;
  v_after_unopened integer;
  v_icon_id uuid;
  v_icon_name text;
  v_unlock_rows integer;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_actor), true);

  select boxes_opened, boxes_unopened into v_before_opened, v_before_unopened
  from public.profiles where id = v_actor;

  select r.icon_id, r.icon_name into v_icon_id, v_icon_name
  from public.open_secret_box() r;

  if v_icon_id is null then
    raise exception 'REGRESSION: open_secret_box() returned no icon';
  end if;

  select boxes_opened, boxes_unopened into v_after_opened, v_after_unopened
  from public.profiles where id = v_actor;

  if v_after_opened <> v_before_opened + 1 or v_after_unopened <> v_before_unopened - 1 then
    raise exception 'REGRESSION: boxes did not move atomically (opened % -> %, unopened % -> %)',
      v_before_opened, v_after_opened, v_before_unopened, v_after_unopened;
  end if;

  select count(*) into v_unlock_rows
  from public.user_icon_unlocks where user_id = v_actor and icon_id = v_icon_id;
  if v_unlock_rows <> 1 then
    raise exception 'REGRESSION: expected exactly 1 user_icon_unlocks row for (%,%), found %', v_actor, v_icon_id, v_unlock_rows;
  end if;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Part 3 — adversarial: a member at boxes_unopened = 0 (seeded user 0002)
-- must not be able to draw, and no row may change.
--
-- Forced to 0 as owner rather than trusted from the seed, for the same
-- order-independence reason as Part 2. Still inside the rolled-back transaction.
-- ---------------------------------------------------------------------

update public.profiles
set boxes_unopened = 0
where id = '00000000-0000-4000-8000-000000000002';

set local role authenticated;

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000002';
  v_before_opened integer;
  v_before_unopened integer;
  v_after_opened integer;
  v_after_unopened integer;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_actor), true);

  select boxes_opened, boxes_unopened into v_before_opened, v_before_unopened
  from public.profiles where id = v_actor;

  if v_before_unopened <> 0 then
    raise exception 'FIXTURE MISMATCH: expected seeded user 0002 to have boxes_unopened = 0, found %', v_before_unopened;
  end if;

  begin
    perform r.icon_id from public.open_secret_box() r;
    raise exception 'REGRESSION: open_secret_box() succeeded for a member with boxes_unopened = 0';
  exception when others then
    if sqlerrm not like '%no_unopened_boxes%' then
      raise;
    end if;
  end;

  select boxes_opened, boxes_unopened into v_after_opened, v_after_unopened
  from public.profiles where id = v_actor;
  if v_after_opened <> v_before_opened or v_after_unopened <> v_before_unopened then
    raise exception 'REGRESSION: a rejected draw still changed profiles counters (opened % -> %, unopened % -> %)',
      v_before_opened, v_after_opened, v_before_unopened, v_after_unopened;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 4 — adversarial: a client cannot write user_icon_unlocks directly
-- (only SELECT is policed; INSERT has no policy so RLS denies it), and
-- cannot set its own boxes_opened/boxes_unopened (column grant, already
-- covered by privileges.sql — re-asserted here as this feature's own proof).
-- ---------------------------------------------------------------------

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000002';
  v_any_icon_id uuid;
begin
  select id into v_any_icon_id from public.secret_box_icons order by sort_order limit 1;

  begin
    insert into public.user_icon_unlocks (user_id, icon_id) values (v_actor, v_any_icon_id);
    raise exception 'REGRESSION: authenticated client inserted a user_icon_unlocks row directly';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set boxes_opened = 999 where id = v_actor;
    raise exception 'REGRESSION: authenticated client set its own profiles.boxes_opened';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set boxes_unopened = 999 where id = v_actor;
    raise exception 'REGRESSION: authenticated client set its own profiles.boxes_unopened';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Part 5 — grant baseline for the RPC: only `authenticated` may execute it.
-- ---------------------------------------------------------------------

do $$
begin
  if has_function_privilege('anon', 'public.open_secret_box()', 'EXECUTE') then
    raise exception 'REGRESSION: anon can execute open_secret_box()';
  end if;
  if not has_function_privilege('authenticated', 'public.open_secret_box()', 'EXECUTE') then
    raise exception 'REGRESSION: authenticated cannot execute open_secret_box()';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Part 6 — empirical weighted-distribution sample (10,000 draws), against
-- a synthetic user seeded with 10,000 unopened boxes so no real seed data
-- is consumed. Rolled back with the rest of this file.
-- ---------------------------------------------------------------------

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('99999999-0000-4000-8000-000000000099', 'authenticated', 'authenticated',
  'phase03-distribution-test@example.com', '{}', '{}', now(), now());

update public.profiles set boxes_unopened = 10000 where id = '99999999-0000-4000-8000-000000000099';

create temporary table draw_tally (icon_name text primary key, hits integer not null default 0) on commit drop;
insert into draw_tally (icon_name, hits) select name, 0 from public.secret_box_icons;

-- Stays as the connecting (postgres) role here rather than switching to
-- authenticated: auth.uid() only reads the request.jwt.claims GUC (invoker-
-- security, role-independent — confirmed via \df+ auth.uid), and
-- open_secret_box() is security definer, so this exercises the exact same
-- server-side draw logic without needing table grants on the temp tally
-- table for a role this session does not otherwise touch. Grant-gated
-- caller access (`authenticated` only) is proven separately in Part 5.
select set_config(
  'request.jwt.claims',
  '{"sub":"99999999-0000-4000-8000-000000000099","role":"authenticated"}',
  true
);

do $$
declare
  i integer;
  v_icon_name text;
begin
  for i in 1..10000 loop
    select r.icon_name into v_icon_name from public.open_secret_box() r;
    update draw_tally set hits = hits + 1 where icon_name = v_icon_name;
  end loop;
end $$;

do $$
declare
  rec record;
  v_pct numeric;
  v_expected numeric;
  v_deviation numeric;
begin
  for rec in
    select t.icon_name, t.hits, s.weight
    from draw_tally t
    join public.secret_box_icons s on s.name = t.icon_name
    order by s.sort_order
  loop
    v_pct := rec.hits::numeric / 10000 * 100;
    v_expected := rec.weight;
    v_deviation := abs(v_pct - v_expected);
    -- plpgsql RAISE only supports bare `%` placeholders (no printf-style
    -- %.2f) — round() first, then substitute the rounded numeric.
    raise notice 'draw distribution: % -> % hits (% pct, weight % pct, deviation % pts)',
      rec.icon_name, rec.hits, round(v_pct, 2), rec.weight, round(v_deviation, 2);
    if v_deviation > 3 then
      raise exception 'REGRESSION: % observed % pct vs weight % pct (deviation % pts exceeds +/-3)',
        rec.icon_name, round(v_pct, 2), rec.weight, round(v_deviation, 2);
    end if;
  end loop;
end $$;

rollback;

\echo 'secret-box.sql: all assertions passed'
