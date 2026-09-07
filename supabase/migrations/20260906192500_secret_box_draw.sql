-- Secret-box weighted draw (F006_SecretBoxReveal BR-001..BR-004).
--
-- secret_box_icons currently holds six placeholder rows ("Icon 1".."Icon 6",
-- pointing at a non-existent /profile/icons/ directory) inserted by
-- supabase/seed.sql, which this phase does not own. This migration adds the
-- `weight` column and renames/re-weights those SAME rows by `sort_order`
-- (clarifications.md, 2026-09-06 run 2: "seed the six real names and
-- weights ... Update the existing rows rather than duplicating them") —
-- artwork stays a separate, non-blocking gap (image_url is untouched; the
-- UI renders a name-text fallback).
--
-- KNOWN GAP (see this phase's report): under `supabase db reset`, migrations
-- run BEFORE seed.sql, so on a from-scratch reset this UPDATE runs against
-- an empty table (a correct no-op) and seed.sql's unconditional INSERT
-- lands afterward with the placeholder names and weight = 0 (the column
-- default). This UPDATE is still the correct, idempotent statement to own
-- here — it is exactly what re-applies the real catalog once seed.sql (out
-- of this phase's ownership) also seeds/updates these rows without
-- reintroducing the placeholders. Flagged for phase 04, which owns
-- seed.sql, to reconcile.
alter table public.secret_box_icons
  add column if not exists weight integer not null default 0;

update public.secret_box_icons set name = 'Stay Gold', weight = 30 where sort_order = 1;
update public.secret_box_icons set name = 'Flow to Horizon', weight = 25 where sort_order = 2;
update public.secret_box_icons set name = 'Touch of Light', weight = 20 where sort_order = 3;
update public.secret_box_icons set name = 'Beyond the Boundary', weight = 10 where sort_order = 4;
update public.secret_box_icons set name = 'Revival', weight = 10 where sort_order = 5;
update public.secret_box_icons set name = 'Root Further', weight = 5 where sort_order = 6;

-- open_secret_box(): the only writer of user_icon_unlocks and of
-- profiles.boxes_opened/boxes_unopened. `security definer` so it can write
-- both tables regardless of the caller's own grants/RLS; takes NO
-- parameters so nothing the client sends can select a badge or a victim —
-- the acted-on user is always auth.uid(), read server-side. `search_path`
-- is pinned to prevent search-path hijacking of a security definer
-- function (same guard as resolve_heart_value()/sync_kudo_hearts_count()).
--
-- Atomic by construction: lock the caller's own profiles row with
-- `for update` first, so two overlapping calls against a single remaining
-- box serialize — the first succeeds and consumes it, the second observes
-- boxes_unopened = 0 under the same lock and raises before drawing or
-- writing anything (BR-002, BR-004).
create or replace function public.open_secret_box()
returns table (
  icon_id uuid,
  icon_name text,
  icon_image_url text,
  boxes_opened integer,
  boxes_unopened integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unopened integer;
  v_total_weight integer;
  v_roll integer;
  v_cumulative integer := 0;
  v_icon record;
  v_boxes_opened integer;
  v_boxes_unopened integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select p.boxes_unopened into v_unopened
  from public.profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if v_unopened <= 0 then
    raise exception 'no_unopened_boxes' using errcode = 'P0001';
  end if;

  select coalesce(sum(s.weight), 0) into v_total_weight from public.secret_box_icons s;
  if v_total_weight <= 0 then
    raise exception 'no_icons_configured' using errcode = 'P0001';
  end if;

  -- Weighted draw (ALG-001): uniform roll over [1, total_weight], walked
  -- cumulatively in sort_order until the roll falls inside an icon's band.
  v_roll := floor(random() * v_total_weight)::integer + 1;

  for v_icon in
    select s.id, s.name, s.image_url, s.weight
    from public.secret_box_icons s
    order by s.sort_order
  loop
    v_cumulative := v_cumulative + v_icon.weight;
    exit when v_roll <= v_cumulative;
  end loop;

  -- BR-003: a draw landing on an already-owned icon still consumes the box
  -- and returns that badge again; no second unlock row is written.
  -- ON CONFLICT ON CONSTRAINT (not a column list) — this function's OUT
  -- parameters are named icon_id/icon_name/... and a bare `(user_id,
  -- icon_id)` column list is ambiguous against the OUT parameter of the
  -- same name; the constraint name side-steps that ambiguity entirely.
  insert into public.user_icon_unlocks (user_id, icon_id)
  values (v_user_id, v_icon.id)
  on conflict on constraint user_icon_unlocks_pkey do nothing;

  update public.profiles p
  set boxes_opened = p.boxes_opened + 1,
      boxes_unopened = p.boxes_unopened - 1
  where p.id = v_user_id
  returning p.boxes_opened, p.boxes_unopened into v_boxes_opened, v_boxes_unopened;

  icon_id := v_icon.id;
  icon_name := v_icon.name;
  icon_image_url := v_icon.image_url;
  boxes_opened := v_boxes_opened;
  boxes_unopened := v_boxes_unopened;
  return next;
end;
$$;

-- user_icon_unlocks keeps its SELECT-only policy — this RPC is the only
-- write path (no broad client INSERT policy is added). Function-level
-- grants gate who may even call it: revoke first (functions are PUBLIC-
-- executable by default in Postgres), then grant only to authenticated.
revoke all on function public.open_secret_box() from public, anon;
grant execute on function public.open_secret_box() to authenticated;
