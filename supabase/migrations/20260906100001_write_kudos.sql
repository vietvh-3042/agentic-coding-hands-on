-- Write Kudos modal (Viet Kudo — MoMorph screen ihQ26W78P2).
-- Adds anonymous-post + image-attachment support to public.kudos, opens an
-- insert policy for authenticated senders, and provisions the public
-- `kudos-images` storage bucket used by the upload flow.

alter table public.kudos
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists anonymous_name text,
  add column if not exists image_urls text[] not null default '{}';

-- Insert policy: a sender may only insert kudos as themselves. Read policy
-- ("kudos readable by all") already exists from the profile schema migration.
drop policy if exists "kudos insert by sender" on public.kudos;
create policy "kudos insert by sender" on public.kudos
  for insert to authenticated with check (sender_id = auth.uid());

-- Public-read storage bucket for kudos message attachments.
insert into storage.buckets (id, name, public)
values ('kudos-images', 'kudos-images', true)
on conflict (id) do nothing;

-- Scope inserts to the caller's own folder ({auth.uid()}/...) so a user
-- can't write into another user's prefix via a direct Storage API call —
-- the app itself already only ever writes under the sender's own id.
drop policy if exists "kudos-images insert by authenticated" on storage.objects;
create policy "kudos-images insert by authenticated" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kudos-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kudos-images readable by all" on storage.objects;
create policy "kudos-images readable by all" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'kudos-images');
