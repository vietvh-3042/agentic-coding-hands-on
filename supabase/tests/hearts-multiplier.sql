-- Phase 03 gate: heart special-day multiplier (server-resolved, not
-- client-forgeable). See plans/260710-1511-sun-kudos-live-board/
--   phase-03-schema-migrations.md FN-4/FN-5, spec/kudo-hearts/technical-spec.md
--   BR-003.
--
-- RED before supabase/migrations/20260906192000_heart_multiplier.sql lands
-- (undefined_column, 42703 — "column special_day_start does not exist").
-- GREEN after (exit 0).
--
-- Run:
--   docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f - < supabase/tests/hearts-multiplier.sql
--
-- Runs inside a transaction that is always rolled back — including the
-- event_settings special-day window it sets for the second scenario.

begin;

-- ---------------------------------------------------------------------
-- Part 0 — RED gate marker: the special-day columns must exist.
-- ---------------------------------------------------------------------

do $$
begin
  perform special_day_start, special_day_end from public.event_settings limit 1;
end $$;

-- ---------------------------------------------------------------------
-- Part 1 — adversarial: a client forges hearts_value = 2 on an ordinary
-- day. The BEFORE INSERT trigger must overwrite it back to 1, and the sync
-- trigger must move hearts_count by exactly 1 (not the forged 2).
-- ---------------------------------------------------------------------

set local role authenticated;

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000002';
  v_kudo_id uuid;
  v_stored_value integer;
  v_before_count integer;
  v_after_count integer;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_actor), true);

  select id, hearts_count into v_kudo_id, v_before_count
  from public.kudos
  where sender_id <> v_actor
    and id not in (select kudo_id from public.kudo_hearts where user_id = v_actor)
  order by created_at
  limit 1;

  if v_kudo_id is null then
    raise exception 'FIXTURE MISSING: no eligible kudo to heart for the non-special-day case';
  end if;

  insert into public.kudo_hearts (kudo_id, user_id, hearts_value)
  values (v_kudo_id, v_actor, 2);

  select hearts_value into v_stored_value
  from public.kudo_hearts where kudo_id = v_kudo_id and user_id = v_actor;

  if v_stored_value <> 1 then
    raise exception 'REGRESSION: forged hearts_value=2 stored as % on a non-special day', v_stored_value;
  end if;

  select hearts_count into v_after_count from public.kudos where id = v_kudo_id;
  if v_after_count <> v_before_count + 1 then
    raise exception 'REGRESSION: hearts_count moved by % instead of 1 on a non-special day', v_after_count - v_before_count;
  end if;

  -- Un-heart revokes exactly the stored amount (1).
  delete from public.kudo_hearts where kudo_id = v_kudo_id and user_id = v_actor;

  select hearts_count into v_after_count from public.kudos where id = v_kudo_id;
  if v_after_count <> v_before_count then
    raise exception 'REGRESSION: un-heart did not revoke exactly 1 (now %)', v_after_count;
  end if;
end $$;

reset role;

-- ---------------------------------------------------------------------
-- Part 2 — special day: bracket now() in event_settings and prove the
-- server resolves hearts_value = 2 even for a client that sent the honest
-- default (1), and that un-hearting revokes exactly 2.
-- ---------------------------------------------------------------------

update public.event_settings
set special_day_start = now() - interval '1 hour',
    special_day_end = now() + interval '1 hour'
where id = 1;

set local role authenticated;

do $$
declare
  v_actor uuid := '00000000-0000-4000-8000-000000000003';
  v_kudo_id uuid;
  v_stored_value integer;
  v_before_count integer;
  v_after_count integer;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_actor), true);

  select id, hearts_count into v_kudo_id, v_before_count
  from public.kudos
  where sender_id <> v_actor
    and id not in (select kudo_id from public.kudo_hearts where user_id = v_actor)
  order by created_at
  limit 1;

  if v_kudo_id is null then
    raise exception 'FIXTURE MISSING: no eligible kudo to heart for the special-day case';
  end if;

  insert into public.kudo_hearts (kudo_id, user_id, hearts_value)
  values (v_kudo_id, v_actor, 1);

  select hearts_value into v_stored_value
  from public.kudo_hearts where kudo_id = v_kudo_id and user_id = v_actor;

  if v_stored_value <> 2 then
    raise exception 'REGRESSION: special-day insert stored hearts_value=% (expected 2)', v_stored_value;
  end if;

  select hearts_count into v_after_count from public.kudos where id = v_kudo_id;
  if v_after_count <> v_before_count + 2 then
    raise exception 'REGRESSION: special-day hearts_count moved by % instead of 2', v_after_count - v_before_count;
  end if;

  delete from public.kudo_hearts where kudo_id = v_kudo_id and user_id = v_actor;

  select hearts_count into v_after_count from public.kudos where id = v_kudo_id;
  if v_after_count <> v_before_count then
    raise exception 'REGRESSION: special-day un-heart did not revoke exactly 2 (now %)', v_after_count;
  end if;
end $$;

reset role;

rollback;

\echo 'hearts-multiplier.sql: all assertions passed'
