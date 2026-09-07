-- profile_kudo_stats view: backs the sidebar stats, the star tier, and the
-- 10-row leaderboard with one shared aggregate instead of three
-- near-identical queries (phase-03-schema-migrations.md FN-7).
--
-- hearts_received is read off kudos.hearts_count (already the single
-- source of truth maintained by sync_kudo_hearts_count(), which itself
-- already accounts for the special-day multiplier via kudo_hearts.
-- hearts_value) rather than re-summing kudo_hearts, so this view never
-- duplicates that trigger's logic.
--
-- security_invoker = on: without it, a view runs with the OWNER's
-- privileges and RLS is bypassed for the view's own reads — since this
-- view is read by both anon and authenticated, and reads profiles/kudos
-- (both currently "readable by all", but not guaranteed to stay that way),
-- the view must keep respecting the calling role's own RLS, not the
-- definer's.
create or replace view public.profile_kudo_stats
with (security_invoker = on) as
select
  p.id,
  (select count(*) from public.kudos k where k.receiver_id = p.id) as kudos_received,
  (select count(*) from public.kudos k where k.sender_id = p.id) as kudos_sent,
  (select coalesce(sum(k.hearts_count), 0) from public.kudos k where k.receiver_id = p.id) as hearts_received
from public.profiles p;

-- Security requirement: the schema-level default ACL affects views too
-- (ALTER DEFAULT PRIVILEGES ... ON TABLES also covers views/materialized
-- views per Postgres docs) — REVOKE then GRANT explicitly rather than
-- assume a narrow inherited grant.
revoke all on public.profile_kudo_stats from anon, authenticated;
grant select on public.profile_kudo_stats to anon, authenticated;
