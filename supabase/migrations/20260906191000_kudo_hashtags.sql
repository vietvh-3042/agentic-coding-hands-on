-- Hashtag taxonomy (F005_HashtagTaxonomy). Replaces the two hardcoded,
-- mutually-inconsistent hashtag lists (board filter's SAA_HASHTAGS/
-- DEPARTMENTS and the write-form's own SAA_HASHTAGS copy) with one DB-backed
-- master list, plus a join table recording which hashtags a kudo carries.
--
-- Ids are `bigint generated always as identity`, not uuid: the whole UI
-- already types hashtags as `number` (IOption.value, KudoPost.hashtags:
-- number[], KudosHashtagInput.tags: number[]) — a uuid PK would ripple
-- through six components for nothing (see phase-03-schema-migrations.md
-- "Key Insights").
--
-- clarifications.md (2026-09-06, "Unresolved — BLOCKING the hashtag table
-- seed") settled the 13 Vietnamese names below over a competing 8-entry
-- English list; the English list is superseded and is not carried forward.

create table if not exists public.hashtags (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.hashtags (name, sort_order) values
  ('Toàn diện', 1),
  ('Giỏi chuyên môn', 2),
  ('Hiệu suất cao', 3),
  ('Truyền cảm hứng', 4),
  ('Cống hiến', 5),
  ('Aim High', 6),
  ('Be Agile', 7),
  ('Wasshoi', 8),
  ('Hướng mục tiêu', 9),
  ('Hướng khách hàng', 10),
  ('Chuẩn quy trình', 11),
  ('Giải pháp sáng tạo', 12),
  ('Quản lý xuất sắc', 13)
on conflict (name) do nothing;

create table if not exists public.kudo_hashtags (
  kudo_id uuid not null references public.kudos(id) on delete cascade,
  hashtag_id bigint not null references public.hashtags(id) on delete restrict,
  primary key (kudo_id, hashtag_id)
);

create index if not exists kudo_hashtags_hashtag_id_idx on public.kudo_hashtags (hashtag_id);

alter table public.hashtags enable row level security;
alter table public.kudo_hashtags enable row level security;

drop policy if exists "hashtags readable by all" on public.hashtags;
create policy "hashtags readable by all" on public.hashtags
  for select to anon, authenticated using (true);

drop policy if exists "kudo_hashtags readable by all" on public.kudo_hashtags;
create policy "kudo_hashtags readable by all" on public.kudo_hashtags
  for select to anon, authenticated using (true);

-- Write: only as part of the kudo's own sender (mirrors "kudos insert by
-- sender" in 20260716100000_write_kudos.sql) — exercised by F003's
-- submission Server Action.
drop policy if exists "kudo_hashtags insert by kudo sender" on public.kudo_hashtags;
create policy "kudo_hashtags insert by kudo sender" on public.kudo_hashtags
  for insert to authenticated
  with check (
    auth.uid() = (select sender_id from public.kudos where id = kudo_id)
  );

-- Security requirement (phase-03-schema-migrations.md): the postgres-owned
-- default ACL on schema public grants ALL to anon/authenticated on every
-- new table the instant it is created — phase 01 proved this live for
-- profiles, and it applies here too. REVOKE first, then GRANT exactly what
-- each role needs; do not rely on RLS alone (TRUNCATE bypasses it entirely).
revoke all on public.hashtags from anon, authenticated;
revoke all on public.kudo_hashtags from anon, authenticated;

grant select on public.hashtags to anon, authenticated;
grant select on public.kudo_hashtags to anon, authenticated;
grant insert on public.kudo_hashtags to authenticated;

-- Backfill: best-effort match of the existing free-text kudos.hashtags blob
-- against the 13 seeded names above. A token with no case-insensitive match
-- is dropped, not fabricated into a mapping (spec BR-005). The live seed
-- data ("#Dedicated #Inspring...") shares zero names with the canonical
-- list, so this is expected and honestly reported to inserted 0 rows via
-- the raise notice below, not silently swallowed.
do $$
declare
  v_token_count integer;
  v_matched_rows integer;
begin
  select count(*) into v_token_count
  from public.kudos k
  cross join lateral regexp_split_to_table(k.hashtags, '\s+') as raw_token
  where k.hashtags <> '' and raw_token <> '';

  insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select distinct k.id, h.id
  from public.kudos k
  cross join lateral regexp_split_to_table(k.hashtags, '\s+') as raw_token
  join public.hashtags h
    on lower(trim(leading '#' from raw_token)) = lower(h.name)
  where k.hashtags <> '' and raw_token <> ''
  on conflict do nothing;

  get diagnostics v_matched_rows = row_count;

  raise notice 'kudo_hashtags backfill: % free-text token(s) scanned across public.kudos, % row(s) inserted into kudo_hashtags (matched against the 13 seeded names)', v_token_count, v_matched_rows;
end $$;

-- kudos.hashtags (legacy free-text column) is KEPT this batch — settled in
-- clarifications.md ("Drop the legacy free-text kudos.hashtags column...
-- Keep it this batch"). Cleanup happens in a later batch once nothing
-- reads it.
