-- Heart special-day multiplier (F004_KudoHearts BR-003), moved server-side.
--
-- CORRECTION to spec/kudo-hearts/technical-spec.md: the spec's original
-- design has the Server Action (heartKudo) resolve the multiplier and write
-- the resolved hearts_value. That is client-forgeable — the existing
-- kudo_hearts INSERT policy only checks `user_id = auth.uid()` and the
-- self-heart guard; it never constrains `hearts_value`, so a client calling
-- the anon-key PostgREST endpoint directly can insert hearts_value = 2 on
-- any day (clarifications.md, 2026-09-06 run 2 correction). This migration
-- makes that impossible at the database layer with a BEFORE INSERT trigger
-- that OVERWRITES whatever hearts_value the client sent, resolved solely
-- from event_settings. The Server Action may still read event_settings —
-- only to render the "x2" badge before the insert, never to decide the
-- stored value.
--
-- kudo_hearts.hearts_value CHECK (IN (1,2)) already exists
-- (20260722100000_kudo_hearts.sql) and is untouched here.
--
-- Un-hearting already revokes the exact granted amount, not a hardcoded 1:
-- sync_kudo_hearts_count()'s DELETE branch subtracts OLD.hearts_value (the
-- value actually stored on that row), not a constant — no change needed
-- there.

alter table public.event_settings
  add column if not exists special_day_start timestamptz,
  add column if not exists special_day_end timestamptz;

-- security definer + a pinned search_path: the same privilege-escalation
-- guard already used by sync_kudo_hearts_count() — a mutable search_path on
-- a security definer function is itself a privilege-escalation vector.
create or replace function public.resolve_heart_value()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.hearts_value := case
    when exists (
      select 1
      from public.event_settings
      where id = 1
        and special_day_start is not null
        and special_day_end is not null
        and now() between special_day_start and special_day_end
    ) then 2
    else 1
  end;
  return new;
end;
$$;

drop trigger if exists before_kudo_hearts_insert on public.kudo_hearts;
create trigger before_kudo_hearts_insert
  before insert on public.kudo_hearts
  for each row execute function public.resolve_heart_value();

-- Trigger order: BEFORE row triggers always run before AFTER row triggers
-- in Postgres, regardless of creation order, so before_kudo_hearts_insert
-- (BEFORE) always resolves NEW.hearts_value before on_kudo_hearts_change
-- (AFTER, 20260722100000_kudo_hearts.sql) reads it to update
-- kudos.hearts_count — asserted live by supabase/tests/hearts-multiplier.sql
-- (hearts_count moves by exactly the resolved value, never the forged one).
