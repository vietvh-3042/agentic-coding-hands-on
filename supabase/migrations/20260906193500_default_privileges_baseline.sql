-- Reviewer inspection Medium #4 (batch-a-inspection.md) / phase-01 plan step 3
-- (phase-01-security-profiles-column-privileges.md:86-90): the schema-level
-- default ACL that Supabase's own bootstrap sets up grants ALL (arwdDxtm) to
-- anon/authenticated on every table the moment it is created by role
-- postgres. `20260722070000_grant_table_privileges.sql` already ADDS a
-- default-privilege entry granting SELECT to anon/authenticated for future
-- tables, but it never REVOKEs the pre-existing ALL entry — default
-- privilege entries are additive per (grantor, privilege), so the wide-open
-- ALL entry has kept sitting alongside the narrower SELECT one ever since.
--
-- Every table this project has added so far (kudos, kudo_hearts,
-- notifications, profiles, hashtags, kudo_hashtags, profile_kudo_stats) has
-- its own migration explicitly REVOKE/GRANT-ing on itself, so there is no
-- live hole today (verified by supabase/tests/privileges.sql, hashtags.sql,
-- profile-stats-view.sql). This migration closes the DEFAULT so the next
-- table someone adds is safe even if its own migration forgets to.
--
-- Scope: this only changes what FUTURE objects created by role postgres in
-- schema public inherit. `ALTER DEFAULT PRIVILEGES` never touches privileges
-- already granted on existing tables — running this does not revoke
-- anything from `profiles`, `kudos`, or any other table that already exists,
-- and every existing table's own explicit GRANTs are untouched. Verified: all
-- five supabase/tests/*.sql suites still pass after this migration.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  grant select on tables to anon, authenticated;
