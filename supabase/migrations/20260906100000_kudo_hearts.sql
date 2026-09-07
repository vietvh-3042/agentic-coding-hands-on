-- Hearts/like system for the ALL KUDOS feed (spec C.4.1, screen MaZUn5xHXZ).
-- One row per user x kudo like. A trigger keeps kudos.hearts_count (the
-- existing display counter, also surfaced on the profile "Hearts received"
-- stat) in sync so direct API writes can never drift it from kudo_hearts.
-- `hearts_value` is stored per row (default 1) so a future special-day x2
-- can land without remigrating existing rows.

create table if not exists public.kudo_hearts (
  kudo_id uuid not null references public.kudos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hearts_value int not null default 1,
  created_at timestamptz not null default now(),
  primary key (kudo_id, user_id)
);

-- Trust-boundary guard: hearts_value is otherwise reachable and unbounded via
-- the auto-generated PostgREST insert endpoint (RLS below only constrains
-- user_id/self-like, never the value). 1 = normal like, 2 = reserved for a
-- future special-day x2 — matches the column's stated intent, blocks any
-- other value (including negative) at the DB layer.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'kudo_hearts_value_check'
  ) then
    alter table public.kudo_hearts
      add constraint kudo_hearts_value_check check (hearts_value in (1, 2));
  end if;
end $$;

alter table public.kudo_hearts enable row level security;

-- Reads: same "readable by all" shape as kudos/profiles.
drop policy if exists "kudo_hearts readable by all" on public.kudo_hearts;
create policy "kudo_hearts readable by all" on public.kudo_hearts
  for select to anon, authenticated using (true);

-- Insert: only as yourself, and never on your own kudo (defense-in-depth —
-- the server action also rejects self-like in code since the mock-auth
-- write path runs on the service-role client, which bypasses RLS).
drop policy if exists "kudo_hearts insert by self, not own kudo" on public.kudo_hearts;
create policy "kudo_hearts insert by self, not own kudo" on public.kudo_hearts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and auth.uid() <> (select sender_id from public.kudos where id = kudo_id)
  );

-- Delete (unlike): only your own like row.
drop policy if exists "kudo_hearts delete by self" on public.kudo_hearts;
create policy "kudo_hearts delete by self" on public.kudo_hearts
  for delete to authenticated using (user_id = auth.uid());

-- Default privileges (20260722070000) already grant SELECT (anon,
-- authenticated) and ALL (service_role) on new tables — only insert/delete
-- for authenticated need an explicit grant here. Composite PK → no
-- sequence grant needed.
grant insert, delete on public.kudo_hearts to authenticated;

-- Trigger: kudo_hearts is the single source of truth for hearts_count.
-- The server action (toggleKudoHeart) never writes hearts_count directly,
-- so there is no path for the two to drift.
create or replace function public.sync_kudo_hearts_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    -- Defense-in-depth: floor even though the CHECK constraint above already
    -- blocks negative/arbitrary hearts_value on this table.
    update public.kudos set hearts_count = greatest(hearts_count + NEW.hearts_value, 0) where id = NEW.kudo_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.kudos set hearts_count = greatest(hearts_count - OLD.hearts_value, 0) where id = OLD.kudo_id;
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists on_kudo_hearts_change on public.kudo_hearts;
create trigger on_kudo_hearts_change
  after insert or delete on public.kudo_hearts
  for each row execute function public.sync_kudo_hearts_count();
