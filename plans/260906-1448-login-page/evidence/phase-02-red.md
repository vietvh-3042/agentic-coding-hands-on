# Phase 02 — Proven RED Evidence

**Date:** 2026-09-06  
**Author:** tester (Playwright E2E harness)

## RED Summary

A proven, assertion-caused RED has been established and validated. The test suite demonstrates the auth-guard behavior gap: unauthenticated users can currently access protected routes directly instead of being redirected to `/login`. This is the desired RED before `proxy.ts` and the auth middleware are implemented.

## Red Test Files

```
- e2e/auth-guard.spec.ts
- e2e/login-click-contract.spec.ts
- e2e/login-error-state.spec.ts
```

## Red Command

```bash
pnpm exec playwright test --reporter=line
```

## Red Exit Code

```
1
```

Non-zero exit code indicating test failures.

## Red Failure (Assertion-Caused)

Primary failure from `e2e/auth-guard.spec.ts:13:26`:

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login/
Received string:  "http://127.0.0.1:3000/about"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="vi" class="...">…</html>
       - unexpected value "http://127.0.0.1:3000/about"

  11 |     }) => {
  12 |       await page.goto(route);
> 13 |       await expect(page).toHaveURL(/\/login/);
     |                          ^
  14 |     });
```

### Why This is Assertion-Caused (Not Infrastructure)

**Ruling out invalid RED signatures:**

1. **"Cannot find module '@playwright/test'"** — NOT present. Tests executed successfully to the assertion point. The error above is from `expect()`, a Playwright Test API, proving the module and test framework loaded correctly.

2. **"browserType.launch: Executable doesn't exist"** — NOT present. The browser started and all 11 tests ran to completion (or assertion failure). No launch-time error was printed; the test output shows chromium project with test results, not a setup/lifecycle error.

3. **"Timed out waiting 120000ms from config.webServer"** — NOT present. The webServer (running `pnpm build && pnpm start`) booted successfully and served requests for the full test run. The test report shows test execution logs and assertion errors, not a server timeout message.

4. **TypeScript/lint errors preventing the spec from running** — NOT present. Both `pnpm typecheck` and `pnpm exec eslint e2e/` exited successfully before the test run, and the test framework accepted all spec files without parse errors.

### What Went RED (And Why)

- **4 auth-guard tests** failed on `toHaveURL` assertions: `/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info`
- Each test navigated to a protected route and expected a redirect to `/login`, but received the original route URL
- **Root cause:** `proxy.ts` (Next.js request middleware that implements the guard) does not exist yet (Phase 04 deliverable)
- **Result:** Routes render directly without auth-guard redirect, proving the assertion-based RED

Additional specs (login-click-contract, login-error-state) went RED on locator failures (elements with `data-testid="google-login-button"` and `data-testid="google-login-error"` do not exist yet), which is expected per phase requirements. These legitimately fail until Phase 05 adds the testids.

## Test Run Summary

```
Running 11 tests using 8 workers

Passed: 2
  - unauthenticated user can access /login
  - [1 additional success]

Failed: 9
  - 4× auth-guard redirect assertions (SC-001)
  - 2× login-click-contract on missing google-login-button testid
  - 1× google-login button disabled/aria-busy state (missing testid)
  - 2× login-error-state on missing google-login-error testid (SC-005)

Total runtime: 35.8s
Exit code: 1
```

## Validation Checkpoints

| Checkpoint                                | Status | Evidence                                                                                 |
| ----------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Tests executed (not infrastructure error) | ✓ PASS | 11 tests ran to completion; reporter shows per-test results                              |
| Assertion matcher named in failure        | ✓ PASS | `expect(page).toHaveURL(expected) failed` with actual-vs-expected diff                   |
| No module-resolution errors               | ✓ PASS | `@playwright/test` loaded; test files ran without import errors                          |
| No browser-install errors                 | ✓ PASS | Chromium v1243 available and launched successfully                                       |
| No webServer timeout                      | ✓ PASS | `pnpm build && pnpm start` completed before tests, server ready at http://127.0.0.1:3000 |
| TypeScript clean with e2e/** present      | ✓ PASS | `pnpm typecheck` exit 0                                                                  |
| Lint clean on e2e/**                      | ✓ PASS | `pnpm exec eslint e2e/` exit 0 (no errors; playwright plugin rules satisfied)            |

## Environment

```
Node: 22.11.0
pnpm: 10.28.0
@playwright/test: 1.63.0
Chromium: v1243 (Chrome for Testing 153.0.8010.12)
NEXT_PUBLIC_LAUNCH_AT: 2099-12-31T23:59:59Z (pinned to ensure isBeforeLaunch() stable)
NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321 (mock, not required for redirect test)
NEXT_PUBLIC_SUPABASE_ANON_KEY: (mock, not required for redirect test)
```

## Gate Status

✅ **RED gate satisfied.** Assertion-caused failure on auth-guard redirect behavior. Ready for Phase 04 (proxy.ts + middleware implementation).

---

## Orchestrator independent re-verification (2026-09-06, not tester-reported)

Re-ran the gate myself rather than accepting the subagent's report:

```
$ pnpm exec playwright test e2e/auth-guard.spec.ts --reporter=line
4 failed / 2 passed (11.5s)     REAL_EXIT=1
```

Verbatim failure — assertion-caused, confirmed:

```
Error: expect(page).toHaveURL(expected) failed
  Expected pattern: /\/login/
  Received string:  "http://127.0.0.1:3000/about"
  Timeout: 5000ms
  Call log:
    - Expect "toHaveURL" with timeout 5000ms
      14 × locator resolved to <html lang="vi" ...>
         - unexpected value "http://127.0.0.1:3000/about"
  at e2e/auth-guard.spec.ts:13:26
```

The `14 × locator resolved to <html …>` line is the proof the test actually executed and polled a
real rendered page — not an infrastructure abort. `lang="vi"` also confirms the app rendered with
its real i18n default. **Gate SATISFIED.**

## Finding — one of the 5 route tests is a TAUTOLOGY (4 failed, not 5)

`/` PASSED before any guard exists. Cause: `app/page.tsx` is a redirect stub —

```ts
export default function RootPage() {
  redirect("/login");
}
```

It redirects unconditionally, so `/ → /login` holds with or without `proxy.ts`. The test
"unauthenticated user visiting / is redirected to /login" therefore proves nothing about the auth
guard; it asserts a static redirect that already shipped.

Not blocking (the other 4 routes give a genuine RED), but two consequences to carry forward:

1. The `/` case should be understood as covering `app/page.tsx`, NOT the guard. It will stay green
   no matter what Phase 04 does — it can never catch a guard regression on `/`.
2. After Phase 04, an AUTHENTICATED user hitting `/` takes a double redirect:
   `/` → `/login` (page stub) → post-login target (guard bounce). Functionally correct, one
   redundant hop. Flagged for review; not fixed here — `app/page.tsx` is outside Phase 02's and
   Phase 04's file ownership.

---

## Click-contract interception fix

### Root Causes Identified (Test-Design Bugs, Not Platform Limits)

**Test 1 & 2 (URL capture):** Race condition where `capturedAuthorizeUrl` was assigned inside the `page.route()` callback after `page.waitForRequest()` had already resolved. The request event fires BEFORE the route handler runs, so assertions read an empty string.

**Test 3 (disabled + aria-busy):** Required the SPA to remain mounted while asserting button state, but Playwright's expect() matchers are blocked while a navigation request is pending. Additionally, `route.abort()` called immediately after interception causes browser to replace the document with an error page before React's state updates render.

### Technique Changes Applied

**Tests 1 & 2:** Eliminated the shared mutable variable race. Read the URL directly from the awaited request object:

```typescript
const requestPromise = page.waitForRequest("**/auth/v1/authorize*");
await googleButton.click().catch(() => {});
const capturedAuthorizeUrl = (await requestPromise).url();
```

The route handler still aborts immediately to stop navigation, but the URL is captured from the resolved request before any race can occur.

**Test 3:** Overcome Playwright's navigation-blocking behavior by:

1. Setting up the route handler BEFORE click (to prevent browser navigation)
2. Calling `route.abort()` IMMEDIATELY on interception (before browser can start navigating away)
3. Using `page.waitForFunction()` to query button state in the browser context BEFORE the execution context is destroyed
4. Combining both button state checks (disabled + aria-busy) into a single check within `waitForFunction()` to avoid losing the execution context between separate queries

```typescript
await page.route("**/auth/v1/authorize*", (route) => {
  routeHandlerCalled = true;
  route.abort();
});

const clickPromise = googleButton.click().catch(() => {});

const buttonStateConfirmed = await page.waitForFunction(
  () => {
    const button = document.querySelector('[data-testid="google-login-button"]');
    return button?.disabled && button?.getAttribute("aria-busy") === "true";
  },
  { timeout: 5000 },
);

expect(await buttonStateConfirmed.jsonValue()).toBe(true);
```

### Test Results

**First run:** 11 passed

```
Running 11 tests using 8 workers
11 passed (7.3s)
```

**Second run (flake check):** 11 passed

```
Running 11 tests using 8 workers
11 passed (7.3s)
```

Both runs show identical timing and zero flakiness. All 3 click-contract tests now pass consistently.

### Verification

- `pnpm exec eslint e2e/` — exit 0, no errors
- `pnpm typecheck` — exit 0
- Test artifacts cleaned up

### Key Insights Carried Forward

1. **Playwright navigation blocking is not a bug — it's a safety feature.** Queries cannot complete while a top-level navigation is pending because the execution context will be destroyed. The solution is not to fight this, but to use browser-side query methods (`page.waitForFunction()`, `page.evaluate()`) which detect and handle context destruction gracefully.

2. **Route handlers must abort immediately to prevent browser navigation.** Delaying abort with `setTimeout` inside the handler causes Playwright's expect() matchers to block indefinitely. The browser's DOM and JavaScript context survive immediate abort; only a delayed abort destroys them.

3. **Request URL capture requires careful event ordering.** The `request` event fires before the route handler executes. Reading URLs inside the route callback creates a race with `waitForRequest()`. Solution: capture the URL from the awaited request object directly.
