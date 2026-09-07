-- Account menu admin option (spec A1.8, ID-5/37, clarifications.md
-- 2026-07-23 session). No role column existed; admins see an extra
-- "Admin Dashboard" item in the account menu linking to a placeholder route.

alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));
