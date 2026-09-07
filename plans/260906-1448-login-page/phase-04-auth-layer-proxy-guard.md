# Phase 04 — Supabase clients + proxy route guard (A0)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- **Copy-ready code** (use verbatim, do not re-derive): [`research/researcher-260906-1503-supabase-google-oauth-next16.md`](./research/researcher-260906-1503-supabase-google-oauth-next16.md) §§ 1a, 1b, 1c, 4
- Action A0 contract: [`spec/google-sign-in/technical-spec.md`](./spec/google-sign-in/technical-spec.md) § 4.4
- Trust boundaries: [`spec/system/architecture.md`](./spec/system/architecture.md)
- Access model: [`spec/system/permissions.md`](./spec/system/permissions.md)
- RED evidence to satisfy: [`phase-02`](./phase-02-playwright-red-gate.md#success-criteria)

## Overview

**Priority:** P1
**Status:** done
**Effort:** 1.5h
**Depends on:** Phase 02 (recorded RED) **and** Phase 03 (env present)

Build the three Supabase client factories and the root `proxy.ts` guard. This phase alone turns
`e2e/auth-guard.spec.ts` (SC-001, ×5 routes) from RED to GREEN. It satisfies FR-001, FR-101,
FR-102, FR-401, FR-601, BR-002.

**Defect found and fixed by orchestrator on review:** Guard returned bare `NextResponse.redirect()`
that discarded Supabase-refreshed cookies from both branches. With `enable_refresh_token_rotation`
active, this causes random sign-outs. Fix: `redirectPreservingCookies` function copies cookies
onto the response before returning it.

## Key Insights

- **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** Root-level file, must export a function
  named `proxy` (or a default export). Runtime defaults to Node.js and **setting the `runtime`
  config option throws**. Do not write a `middleware.ts`, and do not add `runtime` to `config`.
- **`@supabase/ssr` ^0.12 supports `getAll`/`setAll` only.** `get`/`set`/`remove` was removed in
  v0.4.0 and is unsupported.
- **`cookies()` is async** — `await cookies()` in `lib/supabase/server.ts`.
- **The cookie-rebuild footgun is the highest-value detail in this phase.** `setAll` must write
  to _both_ the mutated `request` and a freshly rebuilt `NextResponse.next({ request })`, and the
  function must return **that exact `supabaseResponse` object**. Constructing a different
  response without copying `supabaseResponse.cookies.getAll()` onto it desyncs browser and server
  auth state and logs users out at random. It also silently drops `NEXT_LOCALE` (FR-401).
- **Do not copy the reference example's `pathname !== "/"` exemption.** The vercel
  `with-supabase` example leaves `/` public. Our spec requires `/` to be **protected**. Copying
  that clause verbatim is the single easiest way to fail SC-001.
- **`getUser()`, never `getSession()`.** `getSession()` is not re-verified against the Auth server
  and is banned for authorization decisions in this project. `getClaims()` is the reference
  example's newer call, but `clarifications.md` fixed `getUser()` as the standard — use it
  consistently and do not mix.
- **Nothing may run between `createServerClient()` and `getUser()`.** Interleaving code there is
  the documented cause of hard-to-debug random logouts.
- The `NEXT_LOCALE` cookie is written client-side by `components/common/language-selector.tsx`
  and read server-side by `app/layout.tsx:37-38`. The correct `setAll` implementation preserves it
  automatically _because_ the response is rebuilt from the mutated request — there is no separate
  copy step to write, and adding one would be duplicated logic (DRY).
- With the Supabase stack **down**, `getUser()` fails with a connection error and returns
  `user = null`. That is exactly the behavior the spec's edge case demands: an unrefreshable
  session is treated as unauthenticated. It is also what lets the E2E suite run Docker-free.

## Requirements

**Functional**

- FR-001 — browser and server client factories exist and are importable from `@/lib/supabase/*`.
- FR-101 — unauthenticated requests to `/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info`
  redirect to `/login` **before the route renders**.
- FR-102 — an authenticated request to `/login` redirects to the post-login target.
- FR-401 — `NEXT_LOCALE` survives the session-refresh response rebuild.
- FR-601 — every server-side authorization check re-verifies via `getUser()`.

**Non-functional**

- Every file stays well under the project's 200-line guidance; the four files here are 15–60
  lines each by design.
- Public paths are a single, explicit list — one source of truth, referenced once.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0.

## Architecture

```text
proxy.ts (root)                     export async function proxy(request: NextRequest)
  └─ lib/supabase/proxy.ts          updateSession(request)
       ├─ createServerClient(url, anonKey, { cookies: { getAll, setAll } })
       │     getAll  → request.cookies.getAll()
       │     setAll  → 1. request.cookies.set(...)          (this invocation sees fresh cookies)
       │               2. supabaseResponse = NextResponse.next({ request })
       │               3. supabaseResponse.cookies.set(...) (browser gets them)
       ├─ await supabase.auth.getUser()      ← nothing between create and this call
       ├─ if (!user && !isPublicPath)  → redirect /login
       ├─ if (user  && pathname === "/login") → redirect isBeforeLaunch() ? /countdown : /about
       └─ return supabaseResponse            ← this exact object

lib/supabase/client.ts   createBrowserClient(...)          → consumed by A1 (phase 05)
lib/supabase/server.ts   createServerClient(await cookies()) → consumed by A2 (phase 05)
```

**Public-path predicate.** `/login` and any path starting `/auth/` are public. Everything else
under the matcher is protected. Static assets are excluded by the matcher, not by the predicate.

**Matcher** (verbatim from the reference example):

```
"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
```

This correctly exempts `/login/*.png` (the hero and Google-icon assets). Note the documented
caveat: `_next/data` is invoked regardless of the negative matcher — intentional, so protected
data routes cannot be leaked by a matcher edit.

**Data flow — request lifecycle**

| In                          | Transform                                                              | Out                                           |
| --------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| `NextRequest` + cookie jar  | `getAll()` hands the jar to `@supabase/ssr`                            | GoTrue round-trip                             |
| GoTrue response             | refreshed tokens → `setAll` writes to request **and** rebuilt response | `supabaseResponse`                            |
| `user \| null` + `pathname` | public-path predicate + `isBeforeLaunch()`                             | `supabaseResponse` or `NextResponse.redirect` |

## Related Code Files

**Create**

- `lib/supabase/client.ts` — browser factory (~10 lines)
- `lib/supabase/server.ts` — server factory, `await cookies()` (~30 lines)
- `lib/supabase/proxy.ts` — `updateSession()` + guard logic (~60 lines)
- `proxy.ts` (repo root) — thin `export async function proxy()` + `export const config` (~12 lines)

**Read for context (do not modify)**

- `lib/countdown-config.ts` — `isBeforeLaunch()`, reused unchanged for FR-102's target
- `lib/i18n/settings.ts` — `cookieName` (`NEXT_LOCALE`) contract
- `app/layout.tsx:37-38` — the server-side `NEXT_LOCALE` read that must keep working

**Modify / Delete** — none. Phase 05 owns all `app/` and `components/` edits.

## Implementation Steps

1. `lib/supabase/client.ts` — copy research § 1a verbatim; use whichever anon-key var name
   Phase 03 resolved. Create a fresh client per call; no module-level singleton.
2. `lib/supabase/server.ts` — copy research § 1b verbatim, including the `try/catch` around
   `setAll` and its explanatory comment (the swallow is safe _only because_ `proxy.ts` refreshes).
3. `lib/supabase/proxy.ts` — copy research § 1c, then apply three deliberate deviations:
   - **remove** the `pathname !== "/"` clause — `/` is protected here;
   - redirect target is `/login`, not `/auth/login`;
   - swap `getClaims()` for `getUser()` per the project standard, keeping it immediately after
     `createServerClient` with nothing in between.
4. Add the FR-102 branch, before `return supabaseResponse`:
   authenticated **and** `pathname === "/login"` → redirect to
   `isBeforeLaunch() ? "/countdown" : "/about"`.
5. Extract the public-path check into one small local predicate so the two branches read off the
   same list (DRY).
6. Root `proxy.ts` — `export async function proxy(request: NextRequest)` delegating to
   `updateSession`, plus `export const config = { matcher: [...] }`. **No `runtime` key.**
7. `pnpm typecheck && pnpm lint && pnpm build`.
8. Run the Phase 02 RED command again. `e2e/auth-guard.spec.ts` must now be **GREEN for all five
   routes**. The click-contract and error-state specs may still be RED — Phase 05 owns those.

## Todo List

- [x] `lib/supabase/client.ts` created, per-call instantiation
- [x] `lib/supabase/server.ts` created, `await cookies()`, `getAll`/`setAll`
- [x] `lib/supabase/proxy.ts` created with the two-sided cookie write
- [x] `pathname !== "/"` exemption **not** present
- [x] `getUser()` used; `getSession()` appears nowhere in the diff
- [x] No statement between `createServerClient()` and `getUser()`
- [x] FR-102 authenticated-bounce branch added
- [x] Public-path list defined once
- [x] Root `proxy.ts` exports `proxy` + `config.matcher`; no `runtime` key
- [x] `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [x] `e2e/auth-guard.spec.ts` GREEN ×5 routes
- [x] Cookie-preservation defect fixed via `redirectPreservingCookies`

## Success Criteria

| ID                  | Criterion                                                                         | Method                          |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| SC-001              | Each of the 5 protected routes redirects to `/login` unauthenticated              | `e2e/auth-guard.spec.ts` GREEN  |
| FR-601              | `grep -rn "getSession" lib/ proxy.ts`                                             | zero hits                       |
| Next 16 conformance | `grep -n "runtime" proxy.ts`                                                      | zero hits; file exports `proxy` |
| FR-401              | Set `NEXT_LOCALE=en` manually, hit `/login`, inspect `Set-Cookie` + `<html lang>` | cookie survives, `lang="en"`    |
| Build               | `pnpm build; echo $?`                                                             | `0`                             |
| Size discipline     | `wc -l lib/supabase/*.ts proxy.ts`                                                | every file < 200                |

## Risk Assessment

| Risk                                                           | Likelihood | Impact       | Countermeasure                                                                                                                                                                                                                                     |
| -------------------------------------------------------------- | ---------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookie-rebuild footgun → random logouts                        | Medium     | **Critical** | Copy § 1c verbatim including comments; return `supabaseResponse` unmodified; reviewer checks this specific block first                                                                                                                             |
| `NEXT_LOCALE` dropped on refresh (FR-401 regression)           | Medium     | High         | Correct `setAll` preserves it structurally; verified by the manual cookie check in Success Criteria and again in Phase 06                                                                                                                          |
| `pathname !== "/"` copied from the example, leaving `/` public | **High**   | High         | Called out twice above and in the todo list; `e2e/auth-guard.spec.ts` includes `/` explicitly and will catch it                                                                                                                                    |
| `getUser()` round-trip on every request adds latency           | High       | Low          | Accepted — it is the FR-601 requirement. Local stack is on loopback. If GoTrue is down, ECONNREFUSED is immediate, not a hang                                                                                                                      |
| Matcher accidentally excludes a protected route                | Low        | High         | Matcher copied verbatim; all 5 routes asserted individually rather than by sampling                                                                                                                                                                |
| Guard treated as the only authorization boundary               | Medium     | Medium       | Documented in `architecture.md` § Trust Boundaries. Per-route `getUser()` in Server Components is deliberately **deferred** (BR-002 says _MAY_, and 5 duplicate checks would violate DRY today). Revisit if a route ever moves outside the matcher |
| `setAll` throws inside a Server Component                      | Low        | Medium       | The documented `try/catch` in `server.ts` swallows it; safe precisely because this phase's proxy does the refreshing                                                                                                                               |

## Security Considerations

- `getSession()` is banned. Any authorization branch reading it is a defect regardless of test
  status.
- The proxy never reads a client-supplied redirect hint — it computes the FR-102 target from
  `isBeforeLaunch()` locally. No open-redirect surface is introduced here.
- Only the public anon key is referenced. `GOOGLE_SECRET` must not appear anywhere in this
  phase's files.
- The proxy redirect is a UX convenience, not the sole boundary — recorded as an accepted risk
  above with a named trigger for revisiting it.

## Next Steps

Unblocks **Phase 05** (callback route + button wiring), which imports `lib/supabase/client.ts`
and `lib/supabase/server.ts`. Report the GREEN status of `auth-guard.spec.ts` and the still-RED
status of the other two specs.

## Rollback

`rm proxy.ts && rm -rf lib/supabase`. Deleting root `proxy.ts` restores fully-public routing
immediately — no data migration, no cookie cleanup, no user-visible residue beyond any session
cookie already set (harmless and ignored once the guard is gone).
