-- Profile screen schema (Profile bản thân — MoMorph screen 3FoIx6ALVb).
-- Tables: profiles, kudos, secret_box_icons, user_icon_unlocks.
-- Stats (kudos received/sent, hearts received) are derived at query time;
-- box counts live on profiles. Hearts are shown only as counts on the screen,
-- so hearts_count is a column on kudos — no hearts table.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  hero_code text not null,
  avatar_url text,
  -- Matches the UI HeroBadgeVariant union.
  hero_badge text not null default 'new'
    check (hero_badge in ('new', 'rising', 'legend', 'super')),
  boxes_opened integer not null default 0,
  boxes_unopened integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.kudos (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  hashtag_title text not null default '',
  message text not null,
  attachment_count integer not null default 0,
  hashtags text not null default '',
  hearts_count integer not null default 0,
  -- Post status badge on the profile screen (mms_D.3.1_Status "Spam").
  is_spam boolean not null default false,
  created_at timestamptz not null default now()
);

create index kudos_receiver_id_created_at_idx on public.kudos (receiver_id, created_at desc);
create index kudos_sender_id_idx on public.kudos (sender_id);

create table public.secret_box_icons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  sort_order integer not null default 0
);

create table public.user_icon_unlocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  icon_id uuid not null references public.secret_box_icons (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, icon_id)
);

-- RLS: permissive read for local dev (anon + authenticated). Writes stay
-- blocked (no insert/update/delete policies). Do NOT ship these to prod as-is.
alter table public.profiles enable row level security;
alter table public.kudos enable row level security;
alter table public.secret_box_icons enable row level security;
alter table public.user_icon_unlocks enable row level security;

create policy "profiles readable by all" on public.profiles
  for select to anon, authenticated using (true);
create policy "kudos readable by all" on public.kudos
  for select to anon, authenticated using (true);
create policy "secret_box_icons readable by all" on public.secret_box_icons
  for select to anon, authenticated using (true);
create policy "user_icon_unlocks readable by all" on public.user_icon_unlocks
  for select to anon, authenticated using (true);
