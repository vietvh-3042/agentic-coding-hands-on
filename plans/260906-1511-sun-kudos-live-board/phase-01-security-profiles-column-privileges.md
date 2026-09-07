# Phase 01 — Profiles column privileges (security gate)

## Context Links

- [`plan.md`](./plan.md) · [`clarifications.md`](./clarifications.md) § "security (BLOCKING)"
- [`reports/security-260906-1740-profiles-privilege-escalation.md`](./reports/security-260906-1740-profiles-privilege-escalation.md) — the proof, executed and rolled back against the live DB
- Existing: `supabase/migrations/20260716090000_profile_language.sql:13-16` (the offending policy),
  `supabase/migrations/20260723091000_profiles_role.sql:5-7`,
  `supabase/migrations/20260722070000_grant_table_privileges.sql`

## Overview

- **Priority:** P0 — blocks every other phase.
- **Status:** completed (RED→GREEN)
- Any authenticated user can `update({ role: 'admin' })`, `{ boxes_unopened: 999 }`,
  `{ hero_badge: 'legend' }` on their own `profiles` row. Closed with column-level GRANTs and
  default-ACL leak revoked via `ALTER DEFAULT PRIVILEGES`.

## Key Insights

- `"profiles updatable by owner"` restricts **which row**, never **which columns**. Postgres has no
  per-column `WITH CHECK`, so the row policy can stay; the column list moves into the GRANT.
- **The default ACL is the real trap.** A postgres-owned `ALTER DEFAULT PRIVILEGES` on schema
  `public` grants ALL (`arwdDxtm`) to both `anon` and `authenticated` on every table. A `GRANT
UPDATE (col…)` does **not** shrink an existing table-wide UPDATE — the REVOKE must come first,
  and the default privilege itself must be revoked or every table phase 03 creates re-inherits the
  hole.
- `service_role` keeps `ALL` (it bypasses RLS but not table privileges) and the phase-03
  `security definer` functions run as `postgres`, so neither is affected by this narrowing.
- `boxes_opened` / `boxes_unopened` becoming non-user-writable is precisely what makes F006's RPC
  the single write path (F006 § 12 Dependencies).

## Requirements

- **FN-1** `authenticated` may update only `display_name`, `avatar_url`, `language` on `profiles`.
- **FN-2** `anon` may not update `profiles` at all.
- **FN-3** `role`, `hero_badge`, `hero_code`, `boxes_opened`, `boxes_unopened`, `id`, `created_at`
  are unwritable by `authenticated` and `anon`.
- **NFR-1** Idempotent — safe to re-run under `supabase db reset`.
- **NFR-2** No behavior change for `service_role` or for the `handle_new_user()` trigger.

## Architecture

```text
browser (anon key, authenticated role)
  └─ UPDATE public.profiles SET role='admin'
       ├─ table privilege check  ← NEW gate: UPDATE granted only on 3 columns  ⇒ 42501
       └─ RLS "profiles updatable by owner"   (unchanged, still row-scoped)
```

Nothing above the database changes. The app never writes those columns today.

## Related Code Files

**Create**

- `supabase/migrations/20260906190000_profiles_column_privileges.sql`
- `supabase/tests/privileges.sql` — the executable assertion (new directory)

**Modify** — none. **Delete** — none.

## Implementation Steps

1. **RED first.** Write `supabase/tests/privileges.sql` before the migration. It opens a
   transaction, `set local role authenticated`, `set_config('request.jwt.claims', …)` for a
   non-admin seeded user, then asserts each forbidden UPDATE raises `insufficient_privilege`:

   ```sql
   do $$ begin
     begin
       update public.profiles set role = 'admin' where id = current_setting('request.jwt.claims')::json->>'sub';
       raise exception 'REGRESSION: role is user-writable';
     exception when insufficient_privilege then null; end;
   end $$;
   ```

   Repeat for `hero_badge`, `hero_code`, `boxes_opened`, `boxes_unopened`; then assert
   `display_name` **succeeds**; `rollback` at the end.

2. Run it: `docker exec -i supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f -` < the file. Record the non-zero exit and the
   `REGRESSION: role is user-writable` message. **This is the RED evidence for this phase.**
3. Write the migration:
   ```sql
   revoke update on public.profiles from anon, authenticated;
   grant  update (display_name, avatar_url, language) on public.profiles to authenticated;
   -- Kill the inherited default ACL so future tables do not re-open this.
   alter default privileges for role postgres in schema public
     revoke all on tables from anon, authenticated;
   alter default privileges for role postgres in schema public
     grant select on tables to anon, authenticated;
   -- Re-assert the intended baseline on the tables that already exist.
   revoke all on all tables in schema public from anon, authenticated;
   grant  select on all tables in schema public to anon, authenticated;
   grant  insert on public.kudos to authenticated;
   grant  insert, delete on public.kudo_hearts to authenticated;
   grant  update (read_at) on public.notifications to authenticated;
   grant  update (display_name, avatar_url, language) on public.profiles to authenticated;
   grant  usage on schema public to anon, authenticated;
   grant  all on all tables in schema public to service_role;
   ```
4. `docker exec supabase_db_mock-aidd-kudo-app psql … -f` the migration (or `supabase db reset`),
   then re-run step 2 and record exit 0.
5. Extend `supabase/tests/privileges.sql` with a _grant-baseline_ assertion — a query over
   `information_schema.role_table_grants` proving no `anon`/`authenticated` row holds
   `INSERT|UPDATE|DELETE` on a table not in the allow-list above. This is the check phase 03
   re-runs after adding tables.

## Todo List

- [x] `supabase/tests/privileges.sql` written and failing (RED recorded)
- [x] Migration authored, idempotent, comment explains the default-ACL trap
- [x] `supabase db reset` clean
- [x] Assertions pass (exit 0)
- [x] Grant-baseline assertion added and passing
- [x] Existing app paths unaffected: language switcher still writes `profiles.language`

## Success Criteria

- Running `privileges.sql` exits 0 after the migration and non-zero before it — both recorded.
- `UPDATE profiles SET role='admin'` as `authenticated` raises SQLSTATE `42501`.
- `UPDATE profiles SET display_name='x'` as the row owner still succeeds.
- `supabase db reset` completes without error.
- `pnpm build` unaffected (no app code changes).

## Risk Assessment

| Risk                                                                               | L×I | Countermeasure                                                                                                                     |
| ---------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `revoke all … from anon, authenticated` also kills SELECT and the whole board 500s | M×H | The same statement block re-grants `select` immediately; step 4 re-runs the board page load before the phase closes                |
| The language switcher (`profiles.language`) breaks                                 | L×M | `language` is explicitly in the granted column list; add it to the assertion as a positive case                                    |
| `handle_new_user()` trigger insert breaks                                          | L×H | It is `security definer`, owned by postgres — unaffected by role grants. Verified by `supabase db reset` re-running signup seeding |
| A later migration re-inherits ALL from the default ACL                             | M×H | Step 3 revokes the default privilege itself; phase 03 re-runs the grant-baseline assertion                                         |

## Security Considerations

This phase _is_ the security work. Note what it does **not** fix: RLS remains the only row-level
control on this project, so every new table in phase 03 needs explicit policies from creation.
The seeded demo user is `role='admin'` — intentional for local dev, but it means the assertion
script must use a **non-admin** seeded user (`…-000000000002`) or it proves nothing.

## Next Steps

Unblocks phase 02 and phase 03. Phase 09 depends on this having landed before its RPC becomes the
sole writer of `boxes_*`.
