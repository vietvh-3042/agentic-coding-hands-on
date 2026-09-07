---
title: "Google OAuth sign-in via local Supabase on /login"
description: "Wire the shipped /login screen to real Google OAuth through a local Supabase stack, with a Next.js 16 proxy route guard and an e2e-red-first gate."
status: complete
priority: P1
effort: 7.5h
branch: develop
tags: [auth, supabase, oauth, nextjs16, e2e, i18n]
created: 2026-09-06
work_type: feature
spec: docs/features/F001_GoogleSignIn/
system_doc_draft: plans/260702-1448-login-page/spec/system/
test_policy: e2e-red-first
spec_lang: en
---

# Google Sign-In — Implementation Plan

Feature `F001_GoogleSignIn` (promoted, `status: implemented`). Spec of record:
[`docs/features/F001_GoogleSignIn/technical-spec.md`](../../docs/features/F001_GoogleSignIn/technical-spec.md) ·
[`functional-spec.md`](../../docs/features/F001_GoogleSignIn/functional-spec.md) ·
screen [`SCR001_Login`](../../docs/screens/SCR001_Login/spec.md) · decisions: [`clarifications.md`](./clarifications.md).
The plan-local `spec/google-sign-in/` draft is retained as history.

**Goal.** Replace the no-auth `router.push` stand-in on `/login` with a real `signInWithOAuth`
call, add the `/auth/callback` exchange, and gate `/`, `/about`, `/countdown`, `/sun-kudos`,
`/award-info` behind a Next.js 16 **`proxy.ts`** session guard. Public: `/login`, `/auth/*`.

## Phases

| #   | Phase                                                                                      | Owns (files)                                                                                                    | Depends on | Effort | Status                 |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ---------------------- |
| 01  | [Baseline repair — make the toolchain green](./phase-01-baseline-repair.md)                | `package.json`, `pnpm-lock.yaml`, `next.config.ts`                                                              | —          | 1h     | **done**               |
| 02  | [Playwright harness + proven RED](./phase-02-playwright-red-gate.md)                       | `playwright.config.ts`, `eslint.config.mjs`, `e2e/**`, `.gitignore`                                             | 01         | 1.5h   | **done**               |
| 03  | [Local Supabase stack + env split](./phase-03-supabase-local-stack.md)                     | `supabase/**`, `.env`, `.env.local`, `.env.example`                                                             | 01         | 1h     | **done_with_concerns** |
| 04  | [Supabase clients + proxy route guard (A0)](./phase-04-auth-layer-proxy-guard.md)          | `lib/supabase/{client,server,proxy}.ts`, `proxy.ts`                                                             | 02, 03     | 1.5h   | **done**               |
| 05  | [Login wiring — callback, button, error copy (A1/A2)](./phase-05-login-wiring-callback.md) | `app/auth/callback/route.ts`, `app/login/page.tsx`, `components/login/*`, `lib/i18n/locales/{en,vi}/login.json` | 04         | 1.5h   | **done**               |
| 06  | [GREEN gate + manual credential verification](./phase-06-green-gate-verification.md)       | `e2e/**` (re-run), `reports/`                                                                                   | 05         | 1h     | **done**               |

**Parallel window:** 02 and 03 may run concurrently — disjoint file sets, neither imports the
other. Everything else is strictly sequential. 04 must not start until 02's RED is recorded.

## Dependency notes

- **01 is a hard gate.** `i18next` / `react-i18next` are imported by ~30 components and declared
  nowhere; `pnpm typecheck` exits 2. A RED caused by unresolvable modules does **not** satisfy
  `e2e-red-first`.
- **`next.config.ts` is a second, undocumented baseline blocker** — it wires
  `createNextIntlPlugin("./i18n/request.ts")` and that file does not exist. Phase 01 removes the
  plugin wiring (we are _not_ migrating to next-intl). Without this, `pnpm build` — and therefore
  Playwright's `webServer` — cannot boot.
- **03 before 04.** `createServerClient` reads `NEXT_PUBLIC_SUPABASE_URL` / anon key at request
  time; absent env means every guarded request 500s and no assertion is meaningful.
- **02 before 04.** The guard RED (`/about` → `/login`) must be recorded assertion-caused, with
  `redCommand` / `redExitCode` / `redFailure` captured, before a line of `proxy.ts` is written.

## Test matrix

| Level                    | Covers                                                                                       | Where              |
| ------------------------ | -------------------------------------------------------------------------------------------- | ------------------ |
| E2E (`@playwright/test`) | SC-001 ×5 routes, SC-003 loading/`aria-busy`, SC-005 error render, A1 authorize-URL contract | `e2e/*.spec.ts`    |
| Static gate              | `pnpm format:check && lint && typecheck && build`                                            | `pnpm validate`    |
| Manual                   | SC-002 authenticated bounce off `/login`, SC-004 post-login target, FR-401 locale survival   | Phase 06 checklist |

No unit-test runner exists and none is introduced (YAGNI). `test:e2e` stays **out** of
`pnpm validate` — validate is commit-adjacent and boots no server.

## Known scope boundary

SC-002 (authenticated bounce) cannot be automated under the agreed "no Docker in the suite"
constraint: `proxy.ts` calls `getUser()`, which round-trips to GoTrue, so a hand-seeded cookie
yields `user = null` and the bounce never fires. It is verified manually in Phase 06. See
[phase-02](./phase-02-playwright-red-gate.md#key-insights) for the full reasoning.

## Out of scope

Logout/sign-out UI · user profile storage · RLS policies · DB tables · role-based authorization ·
the `/todo` route · the ~80 pre-existing unrelated lint errors.

## Deviations from plan

**Phase 03 premise:** The plan assumed `supabase/` did not exist and required running `supabase init`.
In fact, a full tracked Supabase project (9 migrations, seed.sql) and running stack (11 containers)
already existed; session-start `git status` was truncated and hid it. No `supabase init` was run.
Outcome: same. Env var names corrected to existing convention; real-redirect-URI bug found and
fixed via `config.toml`.

**Phase 04 defect:** Guard returned bare `NextResponse.redirect()` that discarded Supabase-refreshed
cookies from both redirect branches. With `enable_refresh_token_rotation = true`, stale tokens
cause random sign-outs. Orchestrator review: fixed via `redirectPreservingCookies`.

**Phase 05 defects:** Callback built absolute redirects via `new URL(request.url).origin`, which
rewrites `http://127.0.0.1:3000` → `http://localhost:3000`. Users signing in from `127.0.0.1` got
session cookies for a different host, silently breaking sign-in. First fix attempt (`request.nextUrl
.clone()`) did NOT work. Working fix: `redirect()` from `next/navigation` emits host-relative Location.

**Phase 06 review findings:** Two High error-boundary gaps found and fixed: unguarded `handleLogin`
exception left button stuck loading; unguarded `exchangeCodeForSession` threw bare 500 instead of
redirect. Both fixed pre-merge.
