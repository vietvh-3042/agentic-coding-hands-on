# Phase 01 — Authenticated storage-state fixture (shared prerequisite)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- The guard that makes this necessary: `lib/supabase/proxy.ts`
- Existing proof the guard bites: `e2e/auth-guard.spec.ts`
- Local credential source: `supabase/seed.sql` (lines 14–24)
- Consumed by: [`../260708-1519-countdown-prelaunch-page/plan.md`](../260708-1519-countdown-prelaunch-page/plan.md),
  [`../260709-1417-saa-rules-drawer/plan.md`](../260709-1417-saa-rules-drawer/plan.md), and phase 02 here

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 1.5h
**Depends on:** nothing
**Resolved `test_policy`:** `e2e-red-first` — this phase is the _enabler_ for RED, not a RED
itself. It ships no product behavior and asserts no screen contract.

Every route except `/login` and `/auth/*` redirects an unauthenticated request to `/login`
(`lib/supabase/proxy.ts:79-81`). Today's suite only ever asserts _that redirect_. No spec for
`/award-info`, `/countdown` or the rules drawer can be written until Playwright can arrive at a
page already signed in. This phase builds that one fixture, once, for all three folders.

## Key Insights

- **This is why it is not free.** `proxy.ts` calls `getUser()`, which round-trips to GoTrue. A
  hand-forged cookie yields `user = null` and the redirect fires anyway. The storage state must
  come from a **real sign-in against the running local Supabase stack** — there is no shortcut.
- **That reverses an existing project constraint.** The login-page plan deliberately kept the
  suite Docker-free and marked its SC-002 (authenticated bounce) _manual-only_ for exactly this
  reason — see [`../260702-1448-login-page/plan.md`](../260702-1448-login-page/plan.md) §
  "Known scope boundary". Introducing this fixture means the e2e suite now **requires the
  Supabase containers to be up**. That is a deliberate reversal and must be stated in the setup
  file's docblock, not slipped in.
- `supabase/seed.sql` already provisions `demo.user@sun-asterisk.com` / `TestLogin123!` with a
  real `encrypted_password` row in `auth.users`, plus a `profiles` row, kudos, notifications and
  icon unlocks. No new seed data is needed.
- **The fixture cannot drive the login UI.** `components/login/hero-section.tsx:43` calls
  `signInWithOAuth` and `app/login/page.tsx` offers _only_ the Google button — there is no
  password field to type into. The fixture therefore signs in programmatically with
  `signInWithPassword` against the seeded row, then persists the resulting cookies. That means
  the fixture deliberately bypasses the shipped login path; it proves nothing about `/login`
  itself, and `e2e/login-click-contract.spec.ts` remains the only coverage of that.
- `playwright.config.ts` currently declares one `chromium` project and
  `webServer: "pnpm build && pnpm start"`. A `setup` project with `dependencies: ["setup"]` on
  the test project is the standard shape; the `webServer` block is untouched.
- The storage state file is a **credential artifact**. It must be gitignored.

## Requirements

**Functional**

- A `setup` project signs in through the real Supabase client and writes `e2e/.auth/user.json`.
- The `chromium` project depends on `setup` and loads that storage state.
- `e2e/auth-guard.spec.ts` keeps running **unauthenticated** — it must not inherit the state.

**Non-functional**

- Skips cleanly with an actionable message when the Supabase stack is down, rather than failing
  every downstream spec with an opaque redirect.
- Every file under 200 lines (these are 20–50).

## Architecture

```text
playwright.config.ts
  projects:
    - name: "setup"    testMatch: /auth\.setup\.ts/
    - name: "chromium" dependencies: ["setup"]  use.storageState: "e2e/.auth/user.json"
    - name: "chromium-anon"  testMatch: /auth-guard\.spec\.ts/   (no storageState, no dependency)

e2e/auth.setup.ts
  → createBrowserClient(...).auth.signInWithPassword(demo.user@…, TestLogin123!)
      (the UI has no password field — Google-only — so this is a direct GoTrue grant)
  → write the returned session into the browser context's sb-* cookies
  → page.goto("/about"); expect(page).not.toHaveURL(/\/login/)  ← proves the session is real
  → page.context().storageState({ path: "e2e/.auth/user.json" })
```

**Data flow**

| In                 | Transform                                          | Out                             |
| ------------------ | -------------------------------------------------- | ------------------------------- |
| seeded credentials | GoTrue password grant via the app's own login path | `sb-*-auth-token` cookies       |
| browser context    | `storageState()` serialization                     | `e2e/.auth/user.json`           |
| that file          | `use.storageState` on the chromium project         | every spec starts authenticated |

## Related Code Files

**Create** — `e2e/auth.setup.ts` (~40 lines), `e2e/.auth/` (gitignored directory)
**Modify** — `playwright.config.ts` (projects block only), `.gitignore` (add `e2e/.auth/`)
**Read only** — `supabase/seed.sql`, `app/login/page.tsx`, `lib/supabase/proxy.ts`

No `components/`, `app/` or `lib/` file is touched. Ownership does not collide with any other
phase in any of the six folders.

## Implementation Steps

1. Add `e2e/.auth/` to `.gitignore` **first**, before any run can write a token to disk.
2. Write `e2e/auth.setup.ts` using `signInWithPassword` (the login UI is Google-only — see Key
   Insights). Set the returned session cookies on the Playwright context under the same
   `sb-<ref>-auth-token` names `@supabase/ssr` writes, so `proxy.ts`'s `getAll()` finds them.
3. Prove the state before saving it: `goto("/about")` and assert the URL is **not** `/login`.
   Do not assert a specific landing route — `proxy.ts:84` picks `/about` vs `/countdown` from
   `isBeforeLaunch()`, which is exactly the value the countdown retro is about to change.
4. Restructure `playwright.config.ts` into the three projects above.
5. Move `auth-guard.spec.ts` onto the anonymous project so its assertions keep meaning.
6. `pnpm test:e2e` — the existing 6 auth-guard tests stay GREEN and the setup project passes.

## Todo List

- [ ] `e2e/.auth/` gitignored before first run
- [ ] `e2e/auth.setup.ts` signs in via `signInWithPassword` against the running local stack
- [ ] State proved by a non-`/login` landing, not by a specific route
- [ ] `chromium` project depends on `setup` and loads the state
- [ ] `auth-guard.spec.ts` runs anonymous and still passes ×6
- [ ] Docblock states the new Docker dependency and why it reverses the earlier constraint
- [ ] `pnpm lint && pnpm typecheck` exit 0

## Success Criteria

| ID    | Criterion                                                               | Method                                 |
| ----- | ----------------------------------------------------------------------- | -------------------------------------- |
| SC-01 | A throwaway spec doing `goto("/about")` lands on `/about`, not `/login` | one-off spec, deleted after            |
| SC-02 | `auth-guard.spec.ts` still GREEN ×6                                     | `pnpm test:e2e`                        |
| SC-03 | No token file is git-tracked                                            | `git status --porcelain e2e/` is empty |
| SC-04 | Stack down → clear skip/failure message naming Supabase                 | stop containers, re-run                |

## Risk Assessment

| Risk                                                                  | Likelihood | Impact       | Countermeasure                                                                                                                                             |
| --------------------------------------------------------------------- | ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suite now needs Docker; CI has none                                   | **High**   | High         | State it in the docblock and the plan; gate the authenticated projects on a reachable Supabase URL so CI degrades to the anon project instead of going red |
| `auth-guard.spec.ts` silently inherits the state and passes vacuously | Medium     | **Critical** | SC-02 plus an explicit `storageState: undefined` on the anon project; a vacuous pass here would mask a broken guard                                        |
| Session expires mid-run on a long suite                               | Low        | Medium       | Setup runs per invocation; token lifetime far exceeds a suite                                                                                              |
| Seeded password drifts from `seed.sql`                                | Low        | Medium       | Read the credentials from one constant in the setup file, commented with the seed line number                                                              |

## Security Considerations

- `e2e/.auth/user.json` holds a live access + refresh token pair. Gitignore is step 1, not a
  cleanup step.
- Credentials are local-only seed values for a throwaway stack. Do not port this fixture to any
  environment with real users without swapping to a per-run ephemeral account.
- Only `NEXT_PUBLIC_*` keys are involved. No service-role key enters the e2e path.

## Next Steps

Unblocks [phase-02](./phase-02-award-screen-e2e-red-gate.md), the countdown e2e phase, and the
rules-drawer e2e phase. Announce completion to all three folders.

## Rollback

`rm -rf e2e/.auth e2e/auth.setup.ts` and revert the `projects` block. The suite returns to its
current Docker-free, anonymous-only shape with no residue.
