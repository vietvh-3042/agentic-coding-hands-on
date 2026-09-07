---
name: supabase-rls-is-the-only-boundary
description: A postgres-owned default ACL on schema public grants ALL to anon+authenticated on every table, so RLS policies are the only real access control — every new table needs explicit policies and grants
metadata:
  type: project
---

Proven against the running local DB 2026-09-06 (see
`plans/260710-1511-sun-kudos-live-board/reports/security-260906-1740-profiles-privilege-escalation.md`).

- `20260722070000_grant_table_privileges.sql` _intends_ narrow grants. Live reality: every table in
  schema `public` grants `arwdDxtm` to **both** `anon` and `authenticated`, inherited from a
  pre-existing postgres-owned `ALTER DEFAULT PRIVILEGES`. A new table created by a migration
  re-inherits it automatically.
- Consequence: an RLS policy is the whole defence. A `GRANT` will never catch a policy mistake.
- Concrete hole it produced: `"profiles updatable by owner"` restricts the **row**, not the
  **columns**, so any authenticated user could `update({role:'admin'})` — or award themselves
  `boxes_unopened`, or a `legend` badge. Column-level GRANTs are the agreed fix, but a
  `GRANT UPDATE (col…)` does **not** shrink an existing table-wide UPDATE: the `REVOKE` must come
  first, and the default privilege itself must be revoked or the next table re-opens it.
- Also: `user_icon_unlocks` has a SELECT policy only. Any feature that unlocks an icon needs a
  `security definer` RPC (parameterless, `auth.uid()` only, `set search_path = public`) — there is
  no `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, so a service-role Server Action would mean adding
  a new secret.
- `kudos` INSERT and `kudo_hearts` INSERT/DELETE policies **already exist** and work, including an
  `auth.uid() <> kudos.sender_id` self-heart guard. Do not plan work to add them.

**Why:** planning against the migration files' stated intent rather than the live ACL produces a
plan that believes a table privilege is protecting something it is not.

**How to apply:** any plan adding a table, a column with privilege meaning, or a write path must
(a) write the explicit `revoke`/`grant`, (b) write the RLS policy, and (c) re-run a grant-baseline
assertion afterwards. Verify with `docker exec supabase_db_mock-aidd-kudo-app psql -U postgres -d
postgres` — there is no `psql` on PATH. See [[project-auth-and-testing-standards]].
