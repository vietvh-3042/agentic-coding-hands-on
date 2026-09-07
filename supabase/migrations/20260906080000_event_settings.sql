-- Countdown prelaunch page schema (MoMorph screen 8PJQswPZmU).
-- Single-row config table holding the launch instant the countdown page
-- counts down to. Singleton enforced via a fixed primary key (id = 1) rather
-- than a sequence, since there is only ever one active launch instant.
--
-- Timezone: launch_at is timestamptz (absolute instant, UTC-normalized on
-- write/read). The seeded value below is chosen as a UTC-equivalent of an
-- Asia/Ho_Chi_Minh (UTC+7) wall-clock time; countdown math is purely on the
-- absolute instant so client timezone never affects correctness.

create table public.event_settings (
  id integer primary key default 1 check (id = 1),
  launch_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- RLS: permissive read for all (page is public, no login required). Writes
-- stay blocked (no insert/update/delete policies) — same convention as
-- profile_schema.sql. Do NOT ship this to prod as-is.
alter table public.event_settings enable row level security;

create policy "event_settings readable by all" on public.event_settings
  for select to anon, authenticated using (true);

-- Seed the single row: a comfortably future instant so the countdown demo
-- shows a non-zero DAYS/HOURS/MINUTES value.
insert into public.event_settings (id, launch_at)
values (1, '2026-07-21 09:00:00+07');
