# Phase 02 — Toolchain foundation + authenticated E2E harness

## Context Links

- [`plan.md`](./plan.md) · [phase-01](./phase-01-security-profiles-column-privileges.md)
- `AGENTS.md` § "Code and UI Rules" (shadcn/`cn()` mandate) · `components.json`
- `proxy.ts` + `lib/supabase/proxy.ts` (the guard that makes this phase necessary)
- `plans/260702-1448-login-page/phase-02-playwright-red-gate.md` (the Docker-free constraint being amended)

## Overview

- **Priority:** P0 — every `e2e-red-first` phase is unreachable without it.
- **Status:** completed (with open gap: `<Database>` generic threading)
- Three gaps that blocked Batch A have been closed: `cn()` exists, Supabase types are generated,
  and `/sun-kudos` is reachable via authenticated E2E projects.
- **Policy: infrastructure.** This phase claims no RED/TDD. It manufactures the ability to produce one.

## Key Insights

- **`components/ui/` does not exist and `lib/utils.ts` does not exist.** `git status` shows
  `components/ui/button.tsx` as `D`; `grep` finds zero imports of `@/lib/utils` or
  `@/components/ui` anywhere in the tree. Every shipped component is hand-rolled Tailwind. The
  repo _does_ have `clsx`, `tailwind-merge`, `class-variance-authority`, `@base-ui/react` and the
  `shadcn` CLI installed, and `components.json` is configured (`style: base-nova`). So the
  mandate is satisfiable — it has simply never been exercised.
- **The E2E suite cannot stay Docker-free for Batch A.** Every board assertion needs seeded rows,
  and `/sun-kudos` needs a session that `getUser()` will accept — which means a live GoTrue.
  This _amends_ the standing decision recorded in the login plan; it does not silently ignore it.
  Containment: the Docker-dependent specs live in their own Playwright project so the existing
  auth specs still run without the stack.
- **Do not hand-encode the Supabase session cookie.** `@supabase/ssr` chunks and base64-prefixes
  `sb-<ref>-auth-token`, and the format has changed between releases. Instead run
  `createServerClient` inside the setup with a cookie adapter that _captures_ `setAll`, call
  `signInWithPassword`, and write whatever the library emits into `storageState`. Zero format
  guessing, zero new app route, no login bypass shipped in the product.
- Only `demo.user@sun-asterisk.com / TestLogin123!` has a real bcrypt password; the other two
  seeded identities are Google-only with an empty `encrypted_password` and cannot sign in locally.
  Phase 04 must therefore give **every** test identity a real password.

## Requirements

- **FN-1** `cn()` exists at `lib/utils.ts` and matches the `components.json` `utils` alias.
- **FN-2** The shadcn primitives phases 07 and 09 need (`dialog`, `input`, `button`, and a
  dropdown surface) exist under `components/ui/`.
- **FN-3** `lib/supabase/database.types.ts` is generated and both client factories are typed.
- **FN-4** `pnpm test:e2e` runs an authenticated project that loads `/sun-kudos` without redirect.
- **NFR-1** The existing three auth specs keep passing and keep needing no Supabase stack.
- **NFR-2** No credential is committed. The E2E password lives in `.env.local` / CI secrets, with
  a name added to `.env.example` only.

## Architecture

```text
playwright.config.ts
 ├─ project "setup"      → e2e/support/authenticate.setup.ts
 │      createServerClient(url, anonKey, {cookies:{getAll:()=>[], setAll:capture}})
 │        .auth.signInWithPassword({email, password})   → GoTrue (Docker)
 │        capture[] → e2e/.auth/user.json  (Playwright storageState)
 ├─ project "chromium"           (no storageState)  → auth-guard, login-*  [Docker-free]
 └─ project "chromium-authed"    (storageState, dependsOn: setup) → kudos-*, secret-box
```

## Related Code Files

**Create**

- `lib/utils.ts` — `cn()` (clsx + tailwind-merge), nothing else
- `components/ui/{button,dialog,input,label}.tsx` — via `pnpm dlx shadcn@latest add …`
- `lib/supabase/database.types.ts` — generated
- `e2e/support/authenticate.setup.ts`
- `e2e/support/test-identities.ts` — the seeded emails phase 04 guarantees
- `e2e/.auth/` (gitignored)

**Modify**

- `playwright.config.ts` — three projects + `dependsOn`
- `package.json` — `db:types` script; `test:e2e` unchanged
- `lib/supabase/{client,server,proxy}.ts` — add the `<Database>` generic only
- `.gitignore` — `e2e/.auth/`
- `.env.example` — `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` names only

## Implementation Steps

1. `lib/utils.ts`:
   ```ts
   import { clsx, type ClassValue } from "clsx";
   import { twMerge } from "tailwind-merge";
   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```
2. `pnpm dlx shadcn@latest add button dialog input label`. **If the registry is unreachable**
   (offline sandbox), fall back to composing `@base-ui/react`'s `Dialog`/`Input` directly under
   `components/ui/` with the same export names — that is what the base-ui shadcn style wraps
   anyway. Record which route was taken; do not hand-build a bespoke modal.
3. `pnpm dlx supabase gen types typescript --local > lib/supabase/database.types.ts`; add
   `"db:types"` to `package.json`. Thread `<Database>` through the three client factories.
   Re-run this after phase 03.
4. `e2e/support/authenticate.setup.ts` — capture-adapter sign-in as described in Key Insights;
   write `{ cookies: […], origins: [] }` to `e2e/.auth/user.json`. Fail loudly (throw) if
   `signInWithPassword` errors, so a missing stack reads as a setup failure, never as a test RED.
5. `playwright.config.ts` — add the `setup` project (`testMatch: /.*\.setup\.ts/`), keep
   `chromium` with `testIgnore` for the authed specs, add `chromium-authed`
   (`dependencies: ["setup"]`, `use.storageState`).
6. Prove the harness: a throwaway `e2e/harness.spec.ts` asserting `/sun-kudos` renders without
   redirect under `chromium-authed`. Delete it once green — phase 06's first spec supersedes it.
7. `pnpm validate`.

## Todo List

- [x] `lib/utils.ts` + `cn()`
- [x] shadcn primitives added (or documented base-ui fallback)
- [x] `database.types.ts` generated, `db:types` script added
- [ ] `<Database>` generic threaded through client factories (OPEN: recorded as gap)
- [x] `authenticate.setup.ts` writes a usable `storageState`
- [x] Three Playwright projects; existing auth specs still pass with the stack **down**
- [x] `/sun-kudos` loads authenticated in a test (then harness spec deleted)
- [x] `e2e/.auth/` gitignored; no credential committed
- [x] `pnpm validate` green

## Success Criteria

- `pnpm test:e2e --project=chromium` passes with Supabase stopped (3 existing specs).
- `pnpm test:e2e --project=chromium-authed` reaches `/sun-kudos` with HTTP 200 and no `/login` in
  the final URL.
- `pnpm typecheck` passes with the generated `Database` generic applied.
- `git status` shows no `.env*` or `e2e/.auth/**` staged.

## Risk Assessment

| Risk                                                                           | L×I | Countermeasure                                                                                                                            |
| ------------------------------------------------------------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn registry unreachable in the sandbox                                     | M×M | Documented `@base-ui/react` fallback in step 2; same file paths and export names either way                                               |
| `@supabase/ssr` cookie capture yields cookies Playwright rejects (domain/path) | M×H | Map to `{domain:"127.0.0.1", path:"/", sameSite:"Lax"}` explicitly; step 6 proves it before any feature phase depends on it               |
| A dead Supabase stack makes a feature spec fail and it gets read as RED        | M×H | Setup throws on sign-in error → Playwright reports a _setup_ failure, which the policy explicitly does not accept as RED                  |
| Generated types drift after phase 03                                           | H×L | `db:types` is re-run as the last step of phase 03                                                                                         |
| Adding `<Database>` surfaces latent type errors across existing code           | M×M | Typegen and threading are the same step; if the blast radius exceeds this phase, keep the generic on new query modules only and record it |

## Security Considerations

- No test-login route is added to the app. The only new auth surface is a test-time Node script
  using a real password grant against local GoTrue.
- `e2e/.auth/user.json` holds a live refresh token — gitignored, never uploaded as a CI artifact.
- The E2E password is a local-dev fixture, not a real credential, and still must not be committed.

## Next Steps

Unblocks 06, 07, 09. Re-run `pnpm db:types` after phase 03 lands its migrations.
