# Phase 01 — E2E identity fixtures + seed users

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q12)
- Prior art for the Docker-free constraint this phase breaks:
  [`../260702-1448-login-page/phase-02-playwright-red-gate.md`](../260702-1448-login-page/phase-02-playwright-red-gate.md)
- Existing suite: `e2e/auth-guard.spec.ts`, `e2e/login-click-contract.spec.ts`,
  `e2e/login-error-state.spec.ts`
- Runner config: `playwright.config.ts` · seed: `supabase/seed.sql`

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 2.5h · **Depends on:** —
**test_policy:** not applicable — this phase builds the harness that phases 03–05's
`e2e-red-first` policy runs on. It asserts no product behavior and claims no RED.

Every route except `/login` redirects to `/login` when signed out. Phases 03–05 assert on a
**signed-in** page, so they need a storage-state fixture. Two are needed: an ordinary user and an
admin. This phase is the **shared prerequisite** recorded once for the whole batch — no later phase
repeats it.

## Key Insights

- **This phase knowingly ends the "Docker-free suite" property, and confines the damage.** The
  login batch chose `getUser()` (a real GoTrue round-trip) over `getSession()`, which is precisely
  why a hand-seeded cookie yields `user = null` and why SC-002 could not be automated there. A real
  storage state therefore requires the local Supabase stack **up**. The countermeasure is
  segregation, not a weaker auth check: two Playwright projects, the existing specs stay in a
  project with no `dependencies`, the profile specs go in one that depends on a setup project.
  `pnpm test:e2e` run with the stack down must fail **loudly on the setup project**, never silently
  skip the profile assertions.
- **`supabase/seed.sql:127` already promotes the demo user to `role = 'admin'`** — verified live
  (`select role from public.profiles` returns `admin` for `…0001`). The gap is the reverse of what
  it looks like: there is no _ordinary_ password-login user. Adding one is a smaller, safer change
  than demoting the demo user, which other work may already assume.
- Only `demo.user@sun-asterisk.com` carries an `encrypted_password`; `sender.one` / `sender.two`
  were seeded with `''`. Giving `sender.one` a bcrypt password is a three-token edit to a row that
  already exists.
- **The empty-string token columns in `auth.users` are load-bearing** — `seed.sql`'s own comment
  records that a `NULL` there breaks every `/auth/v1/token` call with a 500. Any new or edited
  `auth.users` row must keep all eight `''` columns.
- **Batch A is proposing the same split**, under the project name `chromium-authed` with
  `dependsOn: setup`. **Adopt Batch A's names if its plan lands first** — two differently-named
  authed projects in one config is exactly the divergence this batch is trying to avoid. The names
  used below (`setup` / `public` / `profile`) are the fallback if Batch B goes first.
- **Never hand-encode the `sb-<ref>-auth-token` cookie.** Either drive the real `/login` form in the
  browser (preferred here — it exercises the same path a user does) or run `createServerClient` with
  a `setAll` capture adapter and `signInWithPassword`, then write whatever `@supabase/ssr` emits.
  A hand-built cookie is the failure mode this project already hit once.
- Storage-state JSON contains a live refresh token. It is a credential and must never be committed.

## Requirements

**Functional**

- FR-B101 — a Playwright setup project signs in as an ordinary user and as an admin via
  email/password against the local stack, writing two storage-state files.
- FR-B102 — a test in the `profile` project starts already authenticated; `page.goto("/profile")`
  does not redirect to `/login`.
- FR-B103 — the three existing specs continue to pass with the Supabase stack **down**.
- FR-B104 — `supabase/seed.sql` yields at least one `role = 'user'` and one `role = 'admin'`
  account, both able to sign in with a password.

**Non-functional**

- Storage-state files are git-ignored. No credential lands in the repository.
- The setup runs once per `pnpm test:e2e` invocation, not per test file.

## Architecture

```text
playwright.config.ts
  projects:
    ┌ "setup"          testMatch /auth\.setup\.ts/          ← signs in twice, writes 2 states
    ├ "public"         testMatch /^(auth-guard|login-.*)\.spec\.ts$/
    │                    (no dependencies, no storageState)  ← stays Docker-free
    └ "profile"        testMatch /^profile-.*\.spec\.ts$/
                         dependencies: ["setup"]
                         use.storageState: e2e/.auth/user.json

e2e/auth.setup.ts
  ├ goto /login → fill email+password → submit → expect URL not /login
  ├ context.storageState({ path: "e2e/.auth/user.json"  })   sender.one  (role user)
  └ context.storageState({ path: "e2e/.auth/admin.json" })   demo.user   (role admin)

e2e/fixtures/identities.ts   ← the two credential pairs + their profile ids, one source of truth
```

**Data flow**

| In                          | Transform                                                  | Out                                 |
| --------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| `identities.ts` credentials | `/login` form submit → GoTrue `/token?grant_type=password` | session cookies on the context      |
| context cookie jar          | `context.storageState({path})`                             | `e2e/.auth/{user,admin}.json`       |
| storage-state file          | `use.storageState` on the `profile` project                | every profile spec starts signed in |

The admin state is not consumed until phase 06; it is produced here so the prerequisite is recorded
in one place, per the batch's "shared prerequisites once, not per phase" rule.

## Related Code Files

**Create**

- `e2e/auth.setup.ts` — the two sign-ins (~40 lines)
- `e2e/fixtures/identities.ts` — credentials + profile uuids (~20 lines)

**Modify**

- `playwright.config.ts` — replace the single `chromium` project with the three above
- `supabase/seed.sql` — bcrypt password on `sender.one@sun-asterisk.com`
- `.gitignore` — add `e2e/.auth/`

**Read for context (do not modify)**

- `app/login/page.tsx`, `components/login/google-login-button.tsx` — the form the setup drives
- `lib/supabase/proxy.ts` — why an unauthenticated context bounces

## Implementation Steps

1. `.gitignore` first — `e2e/.auth/` before any state file can exist. Order matters.
2. `supabase/seed.sql`: give `sender.one@sun-asterisk.com` an
   `extensions.crypt('TestLogin123!', extensions.gen_salt('bf'))` password. Keep all eight
   empty-string token columns exactly as they are.
3. Apply: `supabase db reset` (or the project's equivalent), then verify with
   `docker exec … psql -c "select email, role from auth.users join public.profiles on …"`.
4. `e2e/fixtures/identities.ts` — export `ORDINARY` and `ADMIN`, each `{ email, password, profileId }`.
   No credential literal appears anywhere else in `e2e/`.
5. `e2e/auth.setup.ts` — `test("authenticate as user")` / `test("authenticate as admin")`. Drive the
   real `/login` form; do **not** call the Supabase JS client directly, so the fixture exercises the
   same path a user does. Assert the post-login URL is not `/login` **before** writing the state —
   a state file written from a failed sign-in is worse than none.
6. `playwright.config.ts` — three projects as drawn above. The `public` project keeps
   `use: { ...devices["Desktop Chrome"] }` and gains nothing else.
7. Confirm FR-B103 by stopping the stack and running `pnpm test:e2e --project=public`.

## Todo List

- [ ] `.gitignore` ignores `e2e/.auth/` (committed before any state file is generated)
- [ ] `sender.one` has a password; `select role` confirms `user`
- [ ] `demo.user` still confirms `admin`
- [ ] `identities.ts` is the only place credentials appear
- [ ] `auth.setup.ts` asserts sign-in success before `storageState()`
- [ ] Three projects; `public` has no `dependencies` and no `storageState`
- [ ] `pnpm test:e2e --project=public` green with Supabase **down**
- [ ] `pnpm test:e2e --project=setup` green with Supabase **up**
- [ ] `git status` shows no `*.json` under `e2e/.auth/`

## Success Criteria

| ID      | Criterion                                        | Method                                                                                         |
| ------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| SC-B101 | Two state files produced                         | `ls e2e/.auth/user.json e2e/.auth/admin.json`                                                  |
| SC-B102 | Authenticated context reaches a guarded route    | throwaway spec: `goto("/about")` stays on `/about`                                             |
| SC-B103 | Docker-free property preserved for the old specs | stack down → `--project=public` exits 0                                                        |
| SC-B104 | Stack down fails loudly, not silently            | stack down → `pnpm test:e2e` exits **non-zero** on `setup`                                     |
| FR-B104 | Two roles present                                | `psql -c "select role, count(*) from public.profiles group by role"` → both `user` and `admin` |
| Secrets | Nothing credential-shaped committed              | `git status --porcelain e2e/.auth` empty                                                       |

## Risk Assessment

| Risk                                                                       | Likelihood | Impact       | Countermeasure                                                                          |
| -------------------------------------------------------------------------- | ---------- | ------------ | --------------------------------------------------------------------------------------- |
| Storage state committed                                                    | Medium     | **Critical** | `.gitignore` is step 1, and a `git status` check is a todo item and a success criterion |
| Stack-down run silently skips profile specs, hiding a regression           | **High**   | High         | The `setup` project fails hard; SC-B104 asserts the non-zero exit explicitly            |
| Refresh-token rotation expires the stored state mid-run                    | Medium     | Medium       | State is regenerated by `setup` every invocation, never reused across runs              |
| `supabase db reset` wipes locally-created data                             | Medium     | Low          | Seed is the source of truth; note it in the phase report before resetting               |
| Setup drives the Google button instead of the password form                | Low        | High         | Step 5 pins the real `/login` form; OAuth cannot be automated locally                   |
| Adding a password to `sender.one` changes board fixtures Batch A relies on | Low        | Medium       | The edit touches `encrypted_password` only — no profile, kudo or count changes          |

## Security Considerations

- `TestLogin123!` is a local-dev credential already present in `seed.sql`; it must never appear in
  `.env*`, in CI variables, or in any deployed environment.
- The storage state is a bearer credential with the same power as the account. Git-ignored, and
  never uploaded as a CI artifact.
- Nothing here weakens RLS or the route guard. The fixture signs in the way a user signs in.

## Next Steps

Unblocks **phase 03**, which records its RED against the `profile` project. Phase 06 consumes
`admin.json`. Report both state paths and the two `role` values in the phase evidence.

## Rollback

`git checkout playwright.config.ts supabase/seed.sql .gitignore && rm -rf e2e/auth.setup.ts
e2e/fixtures e2e/.auth`, then `supabase db reset`. Restores the single-project, Docker-free suite
exactly. No product code is touched by this phase, so nothing downstream regresses.
