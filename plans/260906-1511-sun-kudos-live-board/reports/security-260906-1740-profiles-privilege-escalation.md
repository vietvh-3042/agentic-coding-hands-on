# SECURITY — Any authenticated user can promote themselves to admin

Found 2026-09-06 during Batch A study. **Proven against the running local DB**, not inferred.

## The defect

`public.profiles` has exactly one UPDATE policy, added in
`supabase/migrations/20260716090000_profile_language.sql:13-16`:

```sql
create policy "profiles updatable by owner" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

It restricts WHICH ROW you may update. It does not restrict WHICH COLUMNS.
`20260723091000_profiles_role.sql:5-7` later added `role text not null default 'user'
check (role in ('user','admin'))` to that same table — inheriting the unrestricted policy.

Live grants confirm the row is reachable:

```
information_schema.role_table_grants → profiles/UPDATE: anon, authenticated
pg_policies → "profiles updatable by owner" | UPDATE | (auth.uid() = id) | (auth.uid() = id)
```

## Proof (executed in a transaction, rolled back — DB unchanged, admin count still 1)

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
UPDATE public.profiles SET role='admin' WHERE id='00000000-0000-4000-8000-000000000002';
-- UPDATE 1
SELECT display_name, role FROM public.profiles WHERE id='...002';
--  Huỳnh Dương Xuân Nhật | admin
ROLLBACK;
```

From the browser this is one line against the anon-key client:

```ts
await supabase.from("profiles").update({ role: "admin" }).eq("id", myUserId);
```

`boxes_opened`, `boxes_unopened`, `hero_badge` and `hero_code` are writable the same way —
a user can award themselves unopened secret boxes or a 'legend' badge.

## Why it matters NOW

Batch B implements **Dropdown-profile Admin** (screenId 54rekaCHG1), a menu gated on
`profiles.role`. Building an admin surface on a self-assignable column means the gate is
decorative. This must be fixed BEFORE that screen is wired, not after.

## Compounding finding — table GRANTs are not a boundary here

`20260722070000_grant_table_privileges.sql:10-14` intends narrow grants. Live reality: every
public table grants ALL privileges (`arwdDxtm`) to BOTH `anon` and `authenticated`, from a
pre-existing postgres-owned default ACL on schema `public`. **RLS is therefore the only access
control on this project.** Every policy must be assumed to be the whole defence — no GRANT will
catch a mistake.

## Recommended fix (needs a decision — see Unresolved)

A column-restricted policy. Postgres has no per-column WITH CHECK, so the standard shapes are:

1. **Trigger guard (simplest, recommended)** — a `BEFORE UPDATE` trigger that raises if a
   non-privileged caller changes `role`, `hero_badge`, `boxes_opened`, or `boxes_unopened`:
   ```sql
   create or replace function public.guard_profile_privileged_columns()
   returns trigger language plpgsql as $$
   begin
     if (new.role, new.hero_badge, new.boxes_opened, new.boxes_unopened)
        is distinct from (old.role, old.hero_badge, old.boxes_opened, old.boxes_unopened) then
       raise exception 'privileged profile columns are not user-writable';
     end if;
     return new;
   end $$;
   ```
   Self-service columns (`display_name`, `avatar_url`, `language`) stay editable.
2. **Revoke + narrow grant** — `revoke update on profiles from authenticated, anon;`
   then `grant update (display_name, avatar_url, language) on profiles to authenticated;`
   Column-level GRANTs DO exist and are the most precise tool. Caveat: the pre-existing default
   ACL means this must be re-asserted for future tables too.
3. **Route all privileged mutation through `security definer` RPCs** and block direct UPDATE
   entirely. Most work, most control.

Option 2 is the tightest for exactly this problem; option 1 survives the default-ACL drift better.
Both are a new migration.

## Also blocked (separate, expected)

`public.user_icon_unlocks` has ONLY a SELECT policy — zero write policies. Opening a secret box
(screen J3-4YFIpMM, Batch A) cannot insert an unlock as an authenticated user; it needs a
`security definer` RPC or a service-role Server Action. Today's `sidebar-gift-dialog.tsx` is a
static "chưa mở" view with no click handler, so nothing is broken yet — but the feature cannot be
completed without this.

## Correction to an earlier assumption

I predicted RLS would block creating a kudo and hearting. That was WRONG:

- `kudos` INSERT by sender — policy EXISTS (`20260716100000_write_kudos.sql:14-15`)
- `kudo_hearts` INSERT/DELETE by self — policies EXIST (`20260722100000_kudo_hearts.sql:41-52`),
  including a neat `auth.uid() <> kudos.sender_id` guard preventing self-hearting.
  Those two write paths are ready. Only the secret-box unlock is genuinely missing.

## Unresolved

- Which fix shape (trigger guard / column grants / RPC-only) the team wants.
- Whether this is fixed as a prerequisite of Batch A, or pulled forward as its own hotfix ahead of
  Batch B's admin menu.
- The seeded demo user (`demo.user@sun-asterisk.com`) is already `role='admin'`; confirm that is
  intentional for local dev.
