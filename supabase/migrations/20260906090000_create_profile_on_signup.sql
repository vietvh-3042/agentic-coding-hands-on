-- Auto-create a public.profiles row for every new auth user.
-- Until now only seed.sql inserted profiles, so any real sign-in (e.g. the
-- email login flow) had no profile row and kudos inserts failed on the
-- kudos_sender_id_fkey foreign key (23503).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, hero_code, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    -- Placeholder hero code until a real assignment flow exists.
    upper(left(md5(new.id::text), 6)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: profiles for auth users that signed up before this trigger.
insert into public.profiles (id, display_name, hero_code, avatar_url)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(u.email, '@', 1)
  ),
  upper(left(md5(u.id::text), 6)),
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
