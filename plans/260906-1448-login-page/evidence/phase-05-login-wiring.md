# Phase 05 evidence — login wiring, callback route, error copy

Implemented by `implementer` subagent (reported DONE_WITH_CONCERNS, 8/11 E2E). **Final state: 11/11 GREEN.**
Orchestrator review found **one further defect** (below) and disputed the subagent's
"unfixable test" conclusion.

## Files touched

`app/auth/callback/route.ts` (new) · `app/login/page.tsx` · `components/login/hero-section.tsx` ·
`components/login/google-login-button.tsx` · `lib/i18n/locales/{en,vi}/login.json`

## Verified correct

- `redirectTo` is a bare `${origin}/auth/callback`, no query string — confirmed by live network
  trace: `redirect_to=http%3A%2F%2F127.0.0.1%3A3000%2Fauth%2Fcallback`.
- Callback reads ONLY `code`; no `next` param is read or honored anywhere.
- Error copy lives in i18n (`googleButton.error`, en + vi); `grep -rn "Đăng nhập không thành công" components/ app/` → 0 hits.
- `app/login/page.tsx` awaits `searchParams` server-side and passes `initialError` down — avoids the
  `useSearchParams()` missing-suspense-boundary build error. `/login` renders dynamic (`ƒ`).
- Lint errors 34 → 32: the two `focus-visible:outline` / `outline-2` contradictions in
  `google-login-button.tsx` are resolved.
- Size discipline: all touched files < 200 lines (max 114).

## Open-redirect countermeasure — INDEPENDENTLY VERIFIED by orchestrator (not subagent-reported)

Live probes against `pnpm start`:

```
GET /auth/callback                                        → 307  /login?error=oauth_failed
GET /auth/callback?next=https://evil.test                  → 307  /login?error=oauth_failed
GET /auth/callback?code=bogus&next=https://evil.test&redirect_to=https://evil.test
                                                           → 307  /login?error=oauth_failed
grep -ci "evil.test" <response headers>                    → 0
```

DEC-001 holds: no attacker-supplied value reaches a redirect target.

## DEFECT FOUND ON REVIEW — callback redirects cross-host, silently breaking sign-in

`app/auth/callback/route.ts` built its redirect from `new URL(request.url).origin`. Under
`next start`, that resolves to the server's OWN configured hostname (`localhost:3000`) and
**ignores the inbound Host header entirely** — proven:

```
$ curl -H "Host: 127.0.0.1:3000" http://127.0.0.1:3000/auth/callback
location: http://localhost:3000/login?error=oauth_failed      ← host rewritten
```

Contrast the proxy guard, which uses `request.nextUrl.clone()`:

```
$ curl http://127.0.0.1:3000/about
location: /login                                              ← host-relative, correct
```

**Impact.** A user signing in from `http://127.0.0.1:3000` (what Playwright uses, and what we added
to `additional_redirect_urls` in Phase 03) gets their session cookie written for host `127.0.0.1`,
then gets redirected to `localhost:3000`. Cookies are host-scoped, so the cookie is never sent, the
proxy guard sees no user, and the browser bounces back to `/login`. **Sign-in silently never sticks
— for one of the two ways you can reach the app.** No automated test covers it: the suite never
traverses the cross-host hop, and the OAuth happy path needs credentials we do not yet have.

**Attempted fix #1 (insufficient).** Rewrote the route to use `request.nextUrl.clone()` + explicit
`url.search`, mirroring the proxy. Typecheck 0, lint 0, build 0 — but re-probing showed the Location
STILL reads `localhost:3000`. `request.nextUrl` normalizes the host the same way in a Route Handler.
The rewrite is kept (it is strictly better: `url.search = ""` makes the no-inbound-query guarantee
structural rather than incidental), but it does NOT resolve the host issue.

**Attempted fix #2 — APPLIED AND VERIFIED.** Switched every exit to `redirect()` from
`next/navigation`, which emits a HOST-RELATIVE Location (`NextResponse.redirect()` cannot — it
requires an absolute URL). Sourced from the Supabase research report § 2, which noted the official
vercel/next.js canary example uses `redirect()` inside a Route Handler.

Re-probed after rebuild:

```
via 127.0.0.1 : location: /login?error=oauth_failed     (was http://localhost:3000/login?...)
via localhost : location: /login?error=oauth_failed
open-redirect : location: /login?error=oauth_failed     evil.test occurrences: 0
```

Identical on both hosts, no absolute host emitted, countermeasure intact. The browser now stays on
whichever host it was already using, so the session cookie is sent back and sign-in sticks.

`pnpm typecheck` 0 · `pnpm exec eslint app/auth/callback/route.ts` 0 · `pnpm build` 0 ·
**full suite `11 passed (7.4s)` REAL_EXIT=0**.

## Disputed: the subagent's "3 tests are an unfixable platform limitation"

The subagent concluded the 3 `login-click-contract.spec.ts` failures could not be fixed without a
behavior change. Half-right, wrong conclusion:

- It IS true that `route.abort()` on a top-level cross-origin navigation makes Chromium replace the
  document, unloading the SPA.
- But tests 1 & 2 never touch the page after the click — they assert on a captured URL string. Their
  real bug is an event-ordering race (`waitForRequest` resolves before the `route()` callback assigns
  the shared variable). Reading `(await requestPromise).url()` fixes them outright.
- Test 3 does need the SPA alive — and a browser keeps the OLD document rendered while a navigation
  is still PENDING. Delaying inside the route handler before aborting holds the page up long enough
  for the disabled/`aria-busy` assertions to run unchanged.

Returned to `tester` (sole owner of `e2e/**`) with both techniques specified. No assertion weakened,
no `skip`/`fixme`, no app change.
