-- Table-level privileges for API roles.
-- RLS policies existed since 20260714070000 but no GRANTs were ever issued,
-- so every anon/authenticated read failed with 42501 before policies even
-- applied (RLS filters rows; GRANT gates the table). Found during live
-- verification of the kudos feed.

grant usage on schema public to anon, authenticated;

-- Reads: RLS "readable by all" policies do the row filtering.
grant select on all tables in schema public to anon, authenticated;

-- Writes: only kudos has an insert policy ("kudos insert by sender",
-- sender_id = auth.uid()); grant the matching table privilege.
grant insert on public.kudos to authenticated;

-- service_role bypasses RLS but NOT table privileges — the mock-auth write
-- path (kudos insert + receiver lookup) runs on it and needs full access.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Future tables created by migrations (run as postgres) get the same grants.
alter default privileges for role postgres in schema public
  grant select on tables to anon, authenticated;
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
