-- Notification bell (spec A1.6, clarifications.md 2026-07-23 session).
-- Minimal real system: a notification is a row for one user; the bell panel
-- lists rows for the current user, unread badge shows when any read_at is
-- null. No insert/delete policy — rows are seed/service_role only for now.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Reads: self-scoped, matches kudo_hearts' self-scoped pattern for
-- per-user data (as opposed to profiles/kudos' "readable by all").
drop policy if exists "notifications readable by self" on public.notifications;
create policy "notifications readable by self" on public.notifications
  for select to authenticated using (user_id = auth.uid());

-- Mark-read: self-scoped update, no column restriction (defense-in-depth
-- only — the mock-auth write path runs on service_role, which bypasses RLS).
drop policy if exists "notifications update by self" on public.notifications;
create policy "notifications update by self" on public.notifications
  for update to authenticated using (user_id = auth.uid());

-- Default privileges (20260722070000) already grant SELECT (anon,
-- authenticated) and ALL (service_role) on new tables — only UPDATE for
-- authenticated needs an explicit grant here (mark-as-read).
grant update on public.notifications to authenticated;
