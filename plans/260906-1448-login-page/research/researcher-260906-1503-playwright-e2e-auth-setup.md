# Playwright E2E setup + deterministic Supabase Google-OAuth login test

Date: 2026-09-06. Repo: agentic-coding-hands-on (Next 16.3.1, React 19.2.8, TS5 strict, pnpm 10.28.0, no test runner today).

## Summary

Install `@playwright/test` (latest `1.63.0`) as devDep, single `chromium` project, `testDir: "./e2e"` (new top-level dir — doesn't collide with `app/` router or existing `components/`/`lib/`). `webServer` boots `next dev` for iteration speed; recommend `next build && next start` only for the CI-final gate (see Q1). tsconfig needs no include change (glob already picks up `**/*.ts`) — add a dedicated `e2e/tsconfig.json` only if compiler options must differ; eslint needs one override block using `eslint-plugin-playwright`'s flat recommended config scoped to `e2e/**`. Keep `test:e2e` OUT of `pnpm validate` — validate is commit/pre-push-adjacent and has no running server; e2e needs one.

**Core answer (Q4):** rank OAuth-test strategies as complementary, not exclusive. #1 recommendation is a "setup" project that performs a REAL password-grant sign-in against a local Supabase instance to get a genuinely valid session, then reconstructs the exact `@supabase/ssr` cookie shape (JSON → `base64-` prefix → base64url, confirmed 3 independent sources) and injects via `context.addCookies()` + `storageState`. Route-interception of `/auth/v1/authorize` is a required complement (tests the click→redirect contract) not a substitute — it cannot produce an authenticated session by itself.

First RED test needs **none** of this — the unauthenticated-redirect assertion (`/about` → `/login`) fails today with zero auth machinery because no `proxy.ts` exists at all. That's the cleanest, lowest-risk RED to write first.

---

## 1. Install + config

```bash
pnpm add -D @playwright/test          # installs 1.63.0 (checked via `npm view @playwright/test version`)
pnpm exec playwright install --with-deps chromium
```

- `--with-deps` runs `apt-get install` for the browser's system libs (libnss3, libatk-bridge2.0-0, libx11-xcb1, libxcomposite1, libxdamage1, libgbm1, …) — **on native Linux/WSL2 this needs root/sudo**; if the shell isn't root, run `sudo pnpm exec playwright install --with-deps chromium` or pre-install via the project's Docker image. Confirmed via [Playwright issue #19100](https://github.com/microsoft/playwright/issues/19100) (WSL2 missing-deps bug thread) and community write-ups (bstefanski.com, testmuai.com 2026 guide) — `--with-deps` is documented as the standard fix, legacy `install-deps` subcommand is deprecated in favor of the flag.
- Only install `chromium` (not `--with-deps` for all 3 browsers) — single-project recommendation below means webkit/firefox binaries are dead weight (YAGNI).

`playwright.config.ts` (place at repo root, next to `next.config.ts`):

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

**`next build && next start` vs `next dev` for `webServer.command` — recommend build+start.** Reason: Next 16's proxy/middleware auth-redirect behavior (`NextResponse.redirect` in `proxy.ts`) and cookie-based session gating must be verified against the production request pipeline, not the dev server's HMR/dev-only code paths — a redirect bug that only manifests under `next start` (e.g. caching/streaming differences) is exactly the kind of thing an E2E suite exists to catch. Trade-off: slower local iteration loop (full build each run). Mitigation: keep `next dev` as a **separate, opt-in** local script (`test:e2e:dev`) for fast local iteration; CI and the canonical `test:e2e` always use build+start. `reuseExistingServer: !process.env.CI` (official Playwright default pattern) lets a dev already running `pnpm dev` be reused locally regardless of which webServer.command is configured, at the cost of possibly testing against stale dev output — acceptable for local loop, never for CI gate.

**Test file location — `e2e/` at repo root, not `tests/`.** Reasons:

- Doesn't collide with the App Router (`app/` is the only dir Next.js scans for routes — a sibling `e2e/` is invisible to it).
- Avoids ambiguity with a future unit-test dir if the team ever adds Vitest/Jest under `tests/` or `__tests__/`.
- Playwright's own TypeScript guide explicitly supports non-standard `testDir` naming (`e2e/`, `tests/`, `test/` all work — `testDir` in config is the only source of truth). Source: [playwright docs test-typescript-js.md via context7](https://github.com/microsoft/playwright/blob/main/docs/src/test-typescript-js.md).
- `eslint.config.mjs`'s `globalIgnores` only lists `.next/**, out/**, build/**, next-env.d.ts` — `e2e/**` is NOT ignored by default, so it will be linted (intentional — we want lint on test code too, see Q2).

## 2. tsconfig / eslint

**tsconfig: no include/exclude change needed.** Root `tsconfig.json`'s `include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ...]` already recursively covers `e2e/**/*.ts` — Next's `plugins: [{name:"next"}]` entry only affects editor tooling, not `tsc --noEmit` compilation. `@playwright/test` ships its own types (no `@types/*` package needed); `pnpm typecheck` will type-check `e2e/*.spec.ts` against the same `strict` compiler options as app code — that's desired (spec files get the same rigor). If test-specific compiler options are ever needed (e.g. different `types` array), Playwright's own recommended pattern is a **dedicated `e2e/tsconfig.json`** referencing the root one — but do not add this pre-emptively (YAGNI); only add it if a real conflict surfaces.

**eslint: add one override block.** `eslint-plugin-playwright` (current: `2.11.0`, verified via `npm view`) supplies a flat-config recommended export with Playwright-aware rules (`playwright/no-conditional-in-test`, `playwright/expect-expect`, etc.) and pre-declares the `test`/`expect` globals so `no-undef`-style issues don't appear. Insert it in `eslint.config.mjs` **after** `nextVitals`/`nextTs`/`airbnb-base` and **before** `prettierConfig` (prettier must stay last, per the existing file's own ordering convention):

```js
import playwright from "eslint-plugin-playwright";
// ...
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...compat.extends("airbnb-base"),
  tailwindcss.configs.recommended,
  { settings: { tailwindcss: { cssConfigPath: "./app/globals.css" } } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  { rules: {/* existing overrides unchanged */} },
  {
    files: ["e2e/**/*.ts"],
    ...playwright.configs["flat/recommended"],
  },
  prettierConfig,
]);
```

Without this, airbnb-base rules like `import/no-extraneous-dependencies` are already `off` project-wide (good — `@playwright/test` is a devDependency, fine either way), but Next's `core-web-vitals` config may flag JSX-less files oddly or complain about `no-unused-expressions` on `expect()` chains — the playwright plugin's recommended rules are tuned to silence exactly that class of false positive. UNVERIFIED: exact rule collisions can't be confirmed without running `pnpm lint` against a real `e2e/*.spec.ts` file — flag this as a task for the implementer to verify in the first PR, not a blocker for planning.

## 3. package.json scripts

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:dev": "PW_WEB_SERVER_CMD=dev playwright test"
```

(the `dev`-server variant is a nice-to-have, not required — cut it if the team doesn't want the extra script, KISS.)

**Do NOT add `test:e2e` into `pnpm validate`.** `validate` = `format:check && lint && typecheck && build` runs pre-push and in fast CI gates where no server is running and no network/DB dependency (local Supabase) is assumed available. E2E needs: (a) a running server (`webServer` handles that, but it's slow — full `next build`), (b) for the auth tests specifically, a running local Supabase stack (`supabase start`, needs Docker). Bundling these into `validate` would make every commit-adjacent check flaky and slow, violating "never wave through failing tests to make the build green" indirectly by incentivizing skipping validate under time pressure. Recommendation: `test:e2e` is a **separate CI job/stage** that runs after `validate` passes, gated on Docker + local Supabase being provisioned in that job.

## 4. Deterministic OAuth testing — ranked strategies

Google's real consent screen cannot be automated (confirmed prior research, 3 independent sources: Supabase CLI GitHub issues, official CLI config docs, community walkthroughs — no counter-evidence). Every viable strategy therefore tests the app's contract with Supabase/GoTrue, never the Google IdP hop itself.

| #     | Strategy                                                                                                          | Proves                                                                                                                                                                                                                                                     | Fakes                                                                                                                                                                                                                      | Brittleness                                                                                                                                                                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Real password-grant sign-in against local Supabase + reconstruct `@supabase/ssr` cookie via a "setup" project** | Genuine, correctly-shaped, GoTrue-issued session accepted by the app's real auth-guard code (proxy.ts / server components reading cookies)                                                                                                                 | Only the Google IdP screen itself (never touched even by strategy alone)                                                                                                                                                   | **Low-Medium.** Session is 100% real (no hand-guessed JWT claims); only the cookie _envelope_ (name, base64- prefix, chunking) must track `@supabase/ssr` version — a minor-version bump could change this, but it's documented (see below) and only 1 encode/decode surface to keep in sync                              |
| 2     | Hand-seed a synthetic session cookie (no local Supabase at all — fabricate JWT + user JSON)                       | Same as #1 for pure routing/guard logic                                                                                                                                                                                                                    | The entire session's _validity_ (fake JWT signature) — fine if the app's guard middleware only checks decoded shape/expiry client-side and never calls `getUser()`/`getClaims()` against GoTrue for verification           | **Medium-High.** Two things can drift: cookie envelope (same risk as #1) AND hand-rolled session JSON must match Supabase's exact `Session` type or a later `supabase.auth.getUser()` server round-trip will silently reject it. Fastest, zero-Docker fallback when local Supabase isn't provisioned in a given CI runner |
| 3     | `page.route()` interception of `.../auth/v1/authorize`                                                            | The button click correctly calls `signInWithOAuth({provider:'google', options:{redirectTo}})` and constructs a well-formed authorize URL (right provider param, right site-url-based redirectTo); the loading/disabled state while the redirect is pending | Everything downstream — GoTrue's own redirect, Google, the callback exchange. **Cannot** by itself produce an authenticated state, so it never satisfies the "redirected-away-from-/login" or "protected-route" assertions | **Low.** URL-pattern route matching is stable; this is the _required complement_ to #1/#2, not a substitute, for the click-behavior + loading-state + error-message specs                                                                                                                                                 |
| —     | Playwright `storageState` + setup-project dependency                                                              | (delivery mechanism, not a testing strategy) — wires #1 or #2's captured cookies into every dependent test file/project without repeating the sign-in per test                                                                                             | N/A                                                                                                                                                                                                                        | N/A — standard Playwright pattern (`projects: [{name:'setup'}, {name:'chromium', dependencies:['setup']}]`), confirmed via official docs                                                                                                                                                                                  |

**#1 recommendation with code.** Cookie envelope confirmed via 3 independent sources: [`supabase/ssr` design doc](https://github.com/supabase/ssr/blob/main/docs/design.md) ("value is prefixed with `base64-` … encoded using Base64-URL … appended to the prefix, without padding"), [GitHub Discussion #35553](https://github.com/orgs/supabase/discussions/35553) (confirms the format persists even with `cookieEncoding:'none'` misconfig — i.e. it's the durable default, not a legacy fluke), [Issue #107](https://github.com/supabase/ssr/issues/107) (confirms downstream code must expect the `base64-` prefix, not a bare JWT). Cookie name pattern `sb-<project-ref>-auth-token` (optionally chunked `.0`/`.1` if the encoded value exceeds `MAX_CHUNK_SIZE = 3180` chars — confirmed via [`@supabase/ssr` chunking docs](https://github.com/supabase/ssr/blob/main/_autodocs/chunking.md)) — for a minimal test-user session (short JWT + small user object), the encoded value typically stays **under** 3180 chars, so a single un-chunked cookie is usually sufficient; the setup script should assert-and-branch rather than assume:

```ts
// e2e/auth.setup.ts
import { test as setup, request as pwRequest } from "@playwright/test";
import path from "node:path";

const SUPABASE_URL = process.env.E2E_SUPABASE_URL!; // e.g. http://127.0.0.1:54321 (`supabase start`)
const ANON_KEY = process.env.E2E_SUPABASE_ANON_KEY!;
const PROJECT_REF = process.env.E2E_SUPABASE_PROJECT_REF!; // local ref from `supabase status`
const TEST_EMAIL = process.env.E2E_TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.E2E_TEST_USER_PASSWORD!;

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate seeded test user", async ({ page }) => {
  const api = await pwRequest.newContext();
  const res = await api.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const session = await res.json(); // real GoTrue Session: access_token, refresh_token, expires_at, user, ...

  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`; // matches @supabase/ssr's documented encoding

  await page.context().addCookies([
    {
      name: `sb-${PROJECT_REF}-auth-token`,
      value: cookieValue,
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  await page.context().storageState({ path: authFile });
});
```

```ts
// playwright.config.ts (excerpt) — dependent project reuses the captured state
projects: [
  { name: "setup", testMatch: /.*\.setup\.ts/ },
  {
    name: "chromium-authenticated",
    use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
    dependencies: ["setup"],
    testMatch: /.*authenticated.*\.spec\.ts/,
  },
  { name: "chromium", use: { ...devices["Desktop Chrome"] } }, // unauthenticated specs, no dependency
],
```

Caveats to flag to the implementer:

- If the encoded value exceeds 3180 chars, split into `sb-<ref>-auth-token.0` / `.1` following `createChunks` semantics — check length before deciding, don't chunk unconditionally (extra complexity YAGNI until proven necessary).
- Requires `supabase start` (Docker) in the CI job that runs auth-dependent e2e specs; the unauthenticated-redirect tests need none of this and should run in a lighter job/project with no Docker dependency.
- `PROJECT_REF` for local Supabase is a fixed local dev value, obtainable via `supabase status`, not the production project ref — keep it in `.env.test`, never commit.

**#2 (hand-seed, no Docker)** is the pragmatic fallback if local Supabase in CI is judged too heavy — same code above minus the `pwRequest.post` real sign-in, replaced with a hand-built `session` object matching Supabase's `Session` TypeScript shape. Recommend against it as the _primary_ strategy only because it duplicates the format-tracking risk without buying anything (no Docker savings if #1's job is already isolated) — but it's a legitimate downgrade path if Docker-in-CI turns out infeasible for this team's CI runners (`docker available` per env facts, so currently not a blocker).

## 5. Producing a valid RED

Write the assertion so it fails on a **behavior gap**, not an infra gap:

```ts
// e2e/auth-guard.spec.ts — write this FIRST, needs no OAuth machinery at all
import { test, expect } from "@playwright/test";

test("unauthenticated user visiting a protected route is redirected to /login", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveURL(/\/login/); // fails today: no proxy.ts exists, /about renders directly
});
```

Verify the RED is assertion-caused, not infra-caused, by reading the reporter output + exit code:

```bash
pnpm exec playwright test e2e/auth-guard.spec.ts; echo "exit=$?"
```

- **Assertion-caused RED** (valid): reporter prints `Error: expect(page).toHaveURL(...) failed` with an actual-vs-expected diff (e.g. `Expected pattern: /\/login/`, `Received string: "http://127.0.0.1:3000/about"`), test marked `✘ failed`, exit code `1`. This is the only acceptable RED.
- **Invalid REDs to rule out** (all present as different failure signatures, do not accept these as "RED"):
  - Missing dependency: `Cannot find module '@playwright/test'` — exit 1 but with a `require`/module-resolution stack trace, no test even attempted, reporter never prints a pass/fail summary.
  - Browser-not-installed: `browserType.launch: Executable doesn't exist ... Looks like Playwright Test or Playwright was just installed... Please run the following command to download new browsers` — printed before any test runs.
  - Dev-server boot failure: `webServer` block times out → `Error: Timed out waiting 120000ms from config.webServer` — printed instead of a test result; no assertion ever executes.
- Confirm by checking that the reporter's JSON/HTML output (or `--reporter=line` stdout) shows the test as having _run_ (a `test.step`/expect line count > 0) with a specific `expect` matcher name in the failure message, not a setup/lifecycle error. `playwright test --reporter=line` is the fastest way to eyeball this without opening the HTML report.

## 6. Selectors

Current markup: `<button type="button" onClick disabled aria-busy>` wrapping a `<span>{t(...)}</span>` whose text is `"LOGIN With Google"` — **verified identical in both `en/login.json` and `vi/login.json`** (the login button label was never translated, only `hero.subtitle*` differs by locale). So `getByRole("button", { name: "LOGIN With Google" })` is NOT locale-brittle for this specific string today — but that's an accident of the current translation file, not a guarantee, and the future OAuth error message (`"Đăng nhập không thành công. Vui lòng thử lại."`, per spec, Vietnamese-only text with no English key present yet) WILL be locale-specific once added.

**Recommendation: add `data-testid` regardless**, for two reasons independent of the current lucky match:

1. Decouples selectors from copy changes — a marketing/copy edit to the button label shouldn't break the test suite (this is exactly the kind of coupling `getByRole(name:...)` creates).
2. The error-message assertion has no locale-neutral anchor otherwise — `aria-live` region + `data-testid="login-error-message"` lets the test assert _presence_ without hardcoding the Vietnamese string, or assert the string only when explicitly testing i18n content (separate concern from behavior).

```tsx
<button type="button" data-testid="google-login-button" ...>
<span data-testid="google-login-error" role="alert">{t("login:googleButton.error")}</span>
```

```ts
await page.getByTestId("google-login-button").click();
await expect(page.getByTestId("google-login-button")).toBeDisabled();
await expect(page.getByTestId("google-login-button")).toHaveAttribute("aria-busy", "true");
await expect(page.getByTestId("google-login-error")).toBeVisible();
```

For the loading-spinner assertion, prefer `toHaveAttribute("aria-busy", "true")` (already present in the component, semantic, and doubles as an a11y check) over asserting on the spinner `<span>`'s presence — DRY, one selector serves both the visual and accessibility assertion.

---

## Sources

- [Playwright docs (context7 mirror of microsoft/playwright)](https://github.com/microsoft/playwright) — webServer, storageState, addCookies, project dependencies, retries/CI, TypeScript testDir conventions. Official, current.
- [Playwright issue #19100](https://github.com/microsoft/playwright/issues/19100) — WSL2 missing-deps, confirms `--with-deps` fix.
- [`@playwright/test` npm](https://www.npmjs.com/package/@playwright/test) — version `1.63.0` via `npm view`.
- [`eslint-plugin-playwright` npm](https://www.npmjs.com/package/eslint-plugin-playwright) — version `2.11.0` via `npm view`.
- [`@supabase/ssr` docs (context7 mirror)](https://github.com/supabase/ssr) — cookie chunking (`MAX_CHUNK_SIZE=3180`, `createChunks`/`combineChunks`/`deleteChunks`), `cookieOptions.name` override, base64url encoding utilities.
- [`@supabase/ssr` design.md](https://github.com/supabase/ssr/blob/main/docs/design.md) — the `base64-` prefix encoding scheme (primary source).
- [supabase/ssr Discussion #35553](https://github.com/orgs/supabase/discussions/35553), [Issue #107](https://github.com/supabase/ssr/issues/107) — corroborate the `base64-` prefix is the durable default, not a bug/fluke (2 independent community reports, cross-checked against the design doc).
- [Next.js docs — version-16 upgrade guide (context7 mirror)](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx) — confirms `middleware.ts` → `proxy.ts` rename, Node.js-runtime-only, `mv middleware.ts proxy.ts`.
- Repo files read directly: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `app/login/page.tsx`, `components/login/google-login-button.tsx`, `components/login/hero-section.tsx`, `lib/i18n/locales/{en,vi}/login.json`. No `supabase/`, `middleware.ts`/`proxy.ts`, or auth code exists yet in this repo (confirmed via `git ls-files`).
- Prior session memory (`nextjs16-supabase-research-notes.md`) — proxy.ts rename, Google OAuth always needs real registered creds, GoTrue is the actual OAuth redirect target not the app's own callback route.

## Unresolved questions

1. Exact `eslint-plugin-playwright` rule interactions with the existing `airbnb-base` + `core-web-vitals` stack are UNVERIFIED without running `pnpm lint` against a real spec file — first implementation PR should treat this as a smoke check, not assume zero friction.
2. Whether CI provisions Docker-backed local Supabase for the auth-dependent e2e job, or whether team opts for the Docker-free fallback (#2 in the ranking) — this is a CI-infrastructure decision outside this research's scope; flagged for the planner/implementer to confirm with whoever owns CI config.
3. The precise field list Supabase's `/auth/v1/token?grant_type=password` response returns (exact key names for `expires_at` vs `expires_in`) wasn't pulled from a live local Supabase instance — the setup script sketch should be validated against a real `supabase start` response body before being treated as final, not hand-typed.

**Status:** DONE
**Summary:** Confirmed Playwright 1.63.0 + eslint-plugin-playwright 2.11.0 install path, WSL2 `--with-deps` root requirement, and a ranked OAuth-testing strategy (#1: real local-Supabase password-grant session reconstructed into the exact `@supabase/ssr` `base64-`-prefixed cookie via a setup-project, backed by 3+ independent sources) with concrete code and a locale-safe `data-testid` selector plan; RED-validity criteria spelled out with reporter-output signatures to distinguish assertion failures from infra failures.
**Concerns/Blockers:** none blocking — three items left open for the implementer/planner to confirm at build time (eslint rule friction, CI Docker provisioning decision, exact GoTrue password-grant response shape), listed above.
