-- Profile read layer (phase 02, MoMorph screen 3FoIx6ALVb) — the caller-
-- scoped Sent feed's security boundary.
--
-- `kudos` carries "kudos readable by all" (for select to anon, authenticated
-- using (true)) — verified live — so `sender_id` on an anonymous Kudo is
-- readable by anyone through the data API no matter what the UI renders.
-- Narrowing that base-table policy would break Batch A's live-board queries
-- mid-flight and is deliberately out of scope for this phase (Q6,
-- plans/260907-1402-three-screen-gap-closure/clarifications.md) — recorded
-- as a separate, standing security item.
--
-- This view closes the leak for ONE screen only: the profile page's own
-- Sent list. `security_invoker = off` (the default for a view) is what lets
-- it read rows the caller could otherwise only reach through the permissive
-- base policy, while the `where sender_id = auth.uid()` clause is the
-- boundary that actually confines it — a signed-out caller has
-- `auth.uid() = null`, so the WHERE clause alone already returns zero rows
-- for `anon`; the GRANT below is the boundary that is actually enforced.
--
-- `sender_id` is exposed unchanged (not renamed) so lib/profile/queries.ts
-- can still assert "this is always the caller's own row" without a second
-- lookup, and so the column keeps a normal FK-shaped name for anyone reading
-- the view later. No `select *` — SEC_004 (no email, no auth.users id) is a
-- literal column list here as everywhere else in this schema.
create view public.kudos_sent_for_caller
with (security_invoker = off) as
select
  id,
  sender_id,
  receiver_id,
  hashtag_title,
  message,
  image_urls,
  hearts_count,
  is_spam,
  is_anonymous,
  anonymous_name,
  created_at
from public.kudos
where sender_id = auth.uid();

-- The default ACL is not a boundary here: the postgres-owned default ACL on
-- schema public would otherwise hand `anon` (and `authenticated`, beyond
-- SELECT) full privileges on this view the instant it is created — the same
-- hole closed for `profiles`/`profile_kudo_stats` by prior migrations.
-- REVOKE before GRANT, both explicit and both required.
revoke all on public.kudos_sent_for_caller from anon, authenticated;
grant select on public.kudos_sent_for_caller to authenticated;
