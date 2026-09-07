# Phase 02 — Playwright harness + proven RED

> **Owner: `tester`.** This phase authors and runs tests only. It writes **no** application code.
> The `e2e-red-first` gate is satisfied here or the plan stops.

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Config, RED-validity signatures, selector strategy: [`research/researcher-260906-1503-playwright-e2e-auth-setup.md`](./research/researcher-260906-1503-playwright-e2e-auth-setup.md) §§ 1, 2, 5, 6
- Test policy decision: [`clarifications.md`](./clarifications.md) § Pipeline gates, § Post-study technical decisions
- Acceptance codes SC-001…SC-005: [`spec/google-sign-in/technical-spec.md`](./spec/google-sign-in/technical-spec.md) § 5.1

## Overview

**Priority:** P1 — the gate itself
**Status:** done
**Effort:** 1.5h
**Depends on:** Phase 01 (green toolchain, Chromium installed)
**Parallel-safe with:** Phase 03 (disjoint files)

Stand up `@playwright/test` against `e2e/`, author the screen-level specs, and prove a **real,
assertion-caused, non-zero-exit RED** before any guard or auth code exists. Record
`redTestFiles`, `redCommand`, `redExitCode`, `redFailure` for hand-off to Phases 04 and 05.

## Key Insights

- The cleanest RED needs **zero** auth machinery: `/about` renders fine today because no
  `proxy.ts` exists, so `await expect(page).toHaveURL(/\/login/)` fails on a genuine behavior
  gap with an actual-vs-expected diff. That is the gate-satisfying assertion.
- **Invalid REDs must be ruled out by reading the reporter, not the exit code.** Exit 1 is also
  produced by `Cannot find module '@playwright/test'`, `browserType.launch: Executable doesn't
exist`, and `Timed out waiting 120000ms from config.webServer`. None of those satisfy the gate.
  Phase 01 exists precisely to remove the first two; the third is why Phase 01 must have `pnpm
build` exiting 0.
- **SC-002 (authenticated bounce off `/login`) is not automatable under the agreed constraints.**
  `proxy.ts` calls `getUser()`, which round-trips to GoTrue. With "no Docker required to run the
  suite", a hand-seeded cookie resolves to `user = null`, so the bounce never fires. Automating
  it would require either a running Supabase stack (violates the no-Docker constraint) or
  downgrading the guard to `getSession()` (banned). It moves to Phase 06's manual checklist.
  Do **not** author a test that would need a downgraded guard to pass.
- `isBeforeLaunch()` defaults `LAUNCH_AT` to _module-load + 8 seconds_ when
  `NEXT_PUBLIC_LAUNCH_AT` is unset (`lib/countdown-config.ts:15-17`). Any assertion on the
  post-login target is therefore time-dependent and flaky by construction. The E2E environment
  must pin `NEXT_PUBLIC_LAUNCH_AT` explicitly.
- `data-testid` selectors are mandatory, not stylistic: the failure copy is Vietnamese-only in
  both locale files today, so a text selector has no locale-neutral anchor. The testids land in
  Phase 05; specs written here reference them and legitimately fail on "locator resolved to no
  element" until then.
- `e2e/**` is not in `eslint.config.mjs`'s `globalIgnores`, so it gets linted — intentional. The
  `eslint-plugin-playwright` flat override must sit **after** `airbnb-base` and **before**
  `prettierConfig`, matching the file's existing ordering convention.

## Requirements

**Functional**

- `playwright.config.ts` at repo root, `testDir: "./e2e"`, single `chromium` project.
- `webServer.command = "pnpm build && pnpm start"`, `url: http://127.0.0.1:3000`,
  `reuseExistingServer: !process.env.CI`, `timeout: 120_000` — the production request pipeline is
  the one the proxy guard actually runs on.
- Specs authored for: SC-001 (×5 protected routes), SC-003 (loading + `aria-busy`),
  SC-005 (error region renders), A1 authorize-URL contract.
- `pnpm typecheck` and `pnpm lint` still exit 0 **with** `e2e/` present.

**Non-functional**

- No Docker, no `supabase start`, no network egress required to run the suite.
- `test:e2e` stays out of `pnpm validate`.
- Specs must be deterministic: no `waitForTimeout`, no conditional branching inside a test
  (`playwright/no-conditional-in-test` enforces this).

## Architecture

```text
pnpm test:e2e
  └─ playwright.config.ts
       ├─ webServer: pnpm build && pnpm start  ──▶ http://127.0.0.1:3000
       └─ project "chromium" (unauthenticated context, no storageState)
            ├─ e2e/auth-guard.spec.ts        SC-001  page.goto(route) → expect URL /login
            ├─ e2e/login-click-contract.spec.ts
            │     SC-003 + A1: page.route("**/auth/v1/authorize*") → abort,
            │                  assert URL shape, then assert aria-busy="true" + disabled
            └─ e2e/login-error-state.spec.ts SC-005  goto /login?error=oauth_failed
                                                     → expect [data-testid=google-login-error] visible
```

Route interception (`page.route`) is the only fake in the suite. It proves the click builds a
well-formed `/auth/v1/authorize` URL with the right `provider` and a `redirect_to` equal to
`${origin}/auth/callback` **with no query string** — which is exactly the open-redirect
countermeasure DEC-001 depends on. It intentionally proves nothing downstream of GoTrue.

**Env for the suite.** `NEXT_PUBLIC_LAUNCH_AT` pinned to a far-future ISO datetime so
`isBeforeLaunch()` is stably `true`; `NEXT_PUBLIC_SUPABASE_URL` / anon key present (Phase 03
supplies real local values — until then the specs above never need them to resolve to a live
server, only to be non-empty strings once Phase 04 lands).

## Related Code Files

**Create**

- `playwright.config.ts`
- `e2e/auth-guard.spec.ts`
- `e2e/login-click-contract.spec.ts`
- `e2e/login-error-state.spec.ts`

**Modify**

- `eslint.config.mjs` — one `{ files: ["e2e/**/*.ts"], ...playwright.configs["flat/recommended"] }`
  block, inserted after `airbnb-base` / before `prettierConfig`
- `.gitignore` — add `test-results/`, `playwright-report/`, `blob-report/`, `e2e/.auth/`

**Delete** — none.

## Implementation Steps

1. Write `playwright.config.ts` per the research report § 1. Single `chromium` project — do **not**
   add the `setup` project or `storageState` wiring; seeded-session tests are out of scope
   (YAGNI, and it would create a dead `dependencies: ["setup"]` edge).
2. Add the `eslint-plugin-playwright` flat override to `eslint.config.mjs`.
3. Extend `.gitignore` with the Playwright output dirs.
4. Author `e2e/auth-guard.spec.ts`: a table-driven test over
   `["/", "/about", "/countdown", "/sun-kudos", "/award-info"]`, each asserting
   `await expect(page).toHaveURL(/\/login/)`.
5. Author `e2e/login-click-contract.spec.ts`: intercept `**/auth/v1/authorize*`, capture the
   request URL, assert `provider=google` and `redirect_to` decodes to `${baseURL}/auth/callback`
   exactly (no `?next=`, no query string); then assert the button is `disabled` and carries
   `aria-busy="true"`.
6. Author `e2e/login-error-state.spec.ts`: `goto("/login?error=oauth_failed")`, assert
   `getByTestId("google-login-error")` is visible and its container has `role="alert"`.
7. Run `pnpm exec playwright test --reporter=line; echo "exit=$?"`.
8. **Validate the RED.** Confirm in the reporter output that `e2e/auth-guard.spec.ts` shows
   `✘ failed` with an `expect(page).toHaveURL` matcher error containing
   `Received string: "http://127.0.0.1:3000/about"` — a test that _ran_. Reject and fix the
   harness if you instead see a module-resolution stack, an `Executable doesn't exist` message,
   or a `webServer` timeout.
9. Record the evidence block (below) into `reports/tester-260906-red-evidence.md`.
10. Re-run `pnpm typecheck` and `pnpm lint` — both must still exit 0 with `e2e/` present.

## Todo List

- [x] `playwright.config.ts` created, `testDir: "./e2e"`, `webServer: pnpm build && pnpm start`
- [x] `eslint.config.mjs` override added in the correct position (after airbnb-base, before prettier)
- [x] `.gitignore` covers `test-results/`, `playwright-report/`, `blob-report/`, `e2e/.auth/`
- [x] `e2e/auth-guard.spec.ts` covers all 5 protected routes
- [x] `e2e/login-click-contract.spec.ts` asserts a query-string-free `redirect_to`
- [x] `e2e/login-error-state.spec.ts` asserts the `role="alert"` region
- [x] RED run executed; exit code and reporter output captured
- [x] RED confirmed **assertion-caused**, not infra-caused
- [x] `pnpm typecheck` + `pnpm lint` exit 0 with `e2e/` present
- [x] Evidence block written to `reports/`
- [x] Click-contract race condition fixed; 11/11 tests green

## Success Criteria

The gate is satisfied only when **all** of these hold:

| Field             | Required value                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `redTestFiles`    | `["e2e/auth-guard.spec.ts", "e2e/login-click-contract.spec.ts", "e2e/login-error-state.spec.ts"]`               |
| `redCommand`      | `pnpm exec playwright test --reporter=line`                                                                     |
| `redExitCode`     | non-zero (`1`)                                                                                                  |
| `redFailure`      | quotes a Playwright **matcher** name (`expect(page).toHaveURL` / `toBeVisible`) with an actual-vs-expected diff |
| Reporter evidence | at least one test reported as _run and failed_, not a lifecycle error                                           |

Invalid, must be fixed and re-run: `Cannot find module`, `Executable doesn't exist`,
`Timed out waiting … from config.webServer`.

## Risk Assessment

| Risk                                                                              | Likelihood | Impact                                     | Countermeasure                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RED is infra-caused and silently accepted                                         | Medium     | **Critical** — voids the whole test policy | Step 8's explicit reporter check; the three invalid signatures are enumerated verbatim so there is nothing to interpret                                                            |
| `webServer` times out because `pnpm build` fails                                  | Medium     | High                                       | Phase 01's `pnpm build` exit-0 criterion is the precondition; if it regresses, stop and return to Phase 01 rather than raising the timeout                                         |
| `eslint-plugin-playwright` collides with `airbnb-base` / `core-web-vitals`        | Medium     | Low                                        | Flagged UNVERIFIED in research § 2 — step 10 is the smoke check; resolve by narrowing the override's `files` glob, never by disabling lint on `e2e/`                               |
| `pnpm build` prerenders `/login` and freezes the error state                      | Medium     | Medium                                     | Phase 05 makes `/login` read `searchParams` server-side, forcing dynamic rendering; if the SC-005 spec still fails after Phase 05, that is the cause — do not weaken the assertion |
| Test asserts a post-login target and flakes on the 8-second `LAUNCH_AT` default   | Medium     | Medium                                     | No spec in this phase asserts a post-login target. Pin `NEXT_PUBLIC_LAUNCH_AT` anyway so Phase 06's manual run is reproducible                                                     |
| Interception pattern misses because `signInWithOAuth` uses a full-page navigation | Low        | Medium                                     | `page.route` intercepts top-level navigations in Chromium; if it does not fire, assert on `page.waitForRequest` instead — both prove the same URL contract                         |

## Security Considerations

- The suite must never contain a real Google credential, a service-role key, or a captured
  session. Only the local anon key (public by design) may appear, and it comes from an env var.
- The `redirect_to` assertion is a **security test**, not a cosmetic one: it is the automated
  proof that no client-supplied `next` param can be reflected into a redirect (DEC-001).
- `e2e/.auth/` is gitignored pre-emptively so no future session artifact can be committed by
  accident.

## Next Steps

Hand `redTestFiles` / `redCommand` / `redExitCode` / `redFailure` read-only to **Phase 04**.
Phase 04 must not begin until this evidence exists. Phase 03 may proceed in parallel now.

## Rollback

`git checkout -- eslint.config.mjs .gitignore && rm -rf e2e playwright.config.ts`. No
application code is touched, so rollback cannot affect the running app.
