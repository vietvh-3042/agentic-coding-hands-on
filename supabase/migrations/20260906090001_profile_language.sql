-- Adds the user's persisted language preference to profiles
-- (multilingual feature — see plans/260716-1051-multilingual-supabase).
-- Precedence at read time is cookie > profiles.language > default 'vi';
-- this column only backs the DB side of that precedence for logged-in users.

alter table public.profiles
  add column language text default 'vi'
    check (language in ('vi', 'en'));

-- profiles had SELECT-only RLS (see profile_schema.sql) — no UPDATE policy
-- existed, so a logged-in user could not persist their own language without
-- one. Scope strictly to the owner row.
create policy "profiles updatable by owner" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
