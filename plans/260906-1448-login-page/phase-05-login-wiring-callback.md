# Phase 05 — Login wiring: callback route, button, error copy (A1 / A2)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Actions A1 / A2 and DEC-001…DEC-003: [`spec/google-sign-in/technical-spec.md`](./spec/google-sign-in/technical-spec.md) § 3.1
- Screen elements E05 / E06 / E07, UI states: [`spec/google-sign-in/screens/SCR-login/spec.md`](./spec/google-sign-in/screens/SCR-login/spec.md) §§ 3, 5, 9
- Callback route shape: [`research/researcher-260906-1503-supabase-google-oauth-next16.md`](./research/researcher-260906-1503-supabase-google-oauth-next16.md) § 2
- Selector strategy: [`research/researcher-260906-1503-playwright-e2e-auth-setup.md`](./research/researcher-260906-1503-playwright-e2e-auth-setup.md) § 6
- Redirect/error decisions: [`clarifications.md`](./clarifications.md) § Spec-stage gap resolution

## Overview

**Priority:** P1
**Status:** done
**Effort:** 1.5h
**Depends on:** Phase 04 (imports `lib/supabase/{client,server}.ts`)

Replace the no-auth `router.push` stand-in with a real `signInWithOAuth` call, add the
`/auth/callback` code-exchange Route Handler, and render the localized failure message inline.
Satisfies FR-201, FR-202, FR-203, DEC-001, DEC-002, DEC-003, SM-001.

**Defect found and fixed by orchestrator on review:** Callback built absolute redirects via
`new URL(request.url).origin`, which rewrote `http://127.0.0.1:3000` → `http://localhost:3000`.
Users from `127.0.0.1` got cookies for a different host, silently breaking sign-in. Fix: use
`redirect()` from `next/navigation` which emits host-relative Location.

## Key Insights

- **`redirectTo` is a bare `${location.origin}/auth/callback` with no query string.** A1 makes
  **no** routing decision. The destination is recomputed by A2 from `isBeforeLaunch()`. This is
  not a stylistic choice — it is the open-redirect countermeasure, and `e2e/login-click-contract.spec.ts`
  asserts it.
- **The callback route accepts no `next` param, and reflects none.** Do not copy the reference
  example's `const next = searchParams.get("next") ?? "/"` line; it is exactly the surface this
  design removes.
- **Rendering the error needs a rendering-mode decision, and the obvious one breaks the build.**
  `useSearchParams()` in a client component under the statically-rendered `/login` route triggers
  Next's "should be wrapped in a suspense boundary" build error. **Chosen approach:** make
  `app/login/page.tsx` read `await searchParams` server-side and pass a plain `initialError:
boolean` prop down to `HeroSection`. This forces `/login` dynamic, needs no `<Suspense>`,
  produces no hydration mismatch, and puts the `role="alert"` region in the first server-rendered
  paint so a screen reader announces it without a client round-trip.
- **`searchParams` is a Promise in Next 15/16** — `await` it in the page component.
- `HeroSection` keeps the error in local state seeded from `initialError`, and clears it on click.
  That is what makes SM-001's `Error → Loading` retry edge real rather than decorative.
- The button never leaves `loading` on the happy path — the browser navigates away to Google. It
  must return to `idle` only via the error path (a fresh page load of `/login?error=oauth_failed`),
  which the server-prop design gives for free.
- **The failure copy must be added to both locale files.** Vietnamese copy is fixed by the spec;
  English currently has no key. Both are required — `login` is a closed namespace in
  `lib/i18n/settings.ts` and a missing key falls back to `vi`, which would silently ship
  Vietnamese to English users.
- `data-testid` is required on both the button and the error region: the button label happens to
  be identical across locales today, but that is an accident of the current translation files,
  and the error copy is Vietnamese-only.

## Requirements

**Functional**

- FR-201 — click starts the OAuth flow and shows the loading state until the browser leaves.
- FR-202 — a successful exchange lands on `/countdown` (before launch) or `/about` (after).
- FR-203 — a failed/cancelled/expired sign-in shows the localized message and returns the button
  to idle.
- DEC-003 — missing `code`, or an exchange error, redirects to `/login?error=oauth_failed`.

**Non-functional**

- No hard-coded user-facing copy anywhere; everything through the `login` i18n namespace.
- The raw Supabase error is never surfaced to the user or the URL.
- Every touched file stays under 200 lines (`hero-section.tsx` is ~88 today; the delta is small).
- No visual rework of the button — only additive props/attributes.

## Architecture

```text
A1  components/login/hero-section.tsx  (client)
      onClick → setError(false); setLoading(true)
              → createClient().auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${location.origin}/auth/callback` }   ← no query string
                })
              → browser leaves for GoTrue /auth/v1/authorize

A2  app/auth/callback/route.ts  (server, GET)
      const { searchParams, origin } = new URL(request.url)
      code = searchParams.get("code")                    ← the ONLY param read
      ├─ no code                       → redirect ${origin}/login?error=oauth_failed   (DEC-003)
      ├─ exchangeCodeForSession(code) errors → same                                    (DEC-003)
      └─ success → session cookie written by the server client's setAll               (DEC-002)
                 → redirect ${origin}${isBeforeLaunch() ? "/countdown" : "/about"}     (DEC-001)

E07 app/login/page.tsx (server) → await searchParams → initialError = error === "oauth_failed"
                                → <HeroSection initialError={initialError} />
    hero-section.tsx renders, when error:
      <p role="alert" data-testid="google-login-error">{t("login:googleButton.error")}</p>
```

**State machine (SM-001)** — `idle → loading` on click; `loading → error` only via a fresh page
load carrying `?error=oauth_failed`; `error → loading` on retry (click clears the error first).

## Related Code Files

**Create**

- `app/auth/callback/route.ts` (~30 lines)

**Modify**

- `app/login/page.tsx` — accept and await `searchParams`, derive `initialError`, pass it down
- `components/login/hero-section.tsx` — replace `handleLogin` body (lines 25-27); add
  `initialError` prop, `loading`/`error` state, and the `role="alert"` region
- `components/login/google-login-button.tsx` — add `data-testid="google-login-button"`
  (additive only; `onClick`/`loading`/`aria-busy` already exist)
- `lib/i18n/locales/en/login.json` — add `googleButton.error`
- `lib/i18n/locales/vi/login.json` — add `googleButton.error` =
  `"Đăng nhập không thành công. Vui lòng thử lại."`

**Read for context (do not modify)**

- `lib/countdown-config.ts` — `isBeforeLaunch()`, called server-side inside the callback
- `lib/supabase/client.ts`, `lib/supabase/server.ts` — from Phase 04

**Delete** — the `useRouter` import and `router.push` stand-in in `hero-section.tsx` (both become
dead once the real call lands; leaving them would keep an unauthenticated bypass in the file).

## Implementation Steps

1. Add `googleButton.error` to both locale JSONs. English copy: a faithful equivalent of the
   Vietnamese, e.g. `"Sign-in failed. Please try again."` — confirm with the copy owner if the
   team wants different wording; the key name is what the code binds to.
2. `components/login/google-login-button.tsx` — add `data-testid="google-login-button"` to the
   `<button>`. Change nothing else.
3. `app/auth/callback/route.ts` — `export async function GET(request: NextRequest)`, read only
   `code`, call `(await createClient()).auth.exchangeCodeForSession(code)`, branch per DEC-002 /
   DEC-003. Use `NextResponse.redirect` with absolute URLs built from `origin`.
   **Do not** read or forward `next`, `error`, or `error_description` into any redirect target.
4. `app/login/page.tsx` — make the component `async`, accept
   `{ searchParams }: { searchParams: Promise<{ error?: string }> }`, `await` it, compute
   `initialError`, pass it to `<HeroSection />`.
5. `components/login/hero-section.tsx` —
   - accept `initialError?: boolean`;
   - `const [loading, setLoading] = useState(false)` and `const [error, setError] = useState(initialError ?? false)`;
   - `handleLogin`: clear error, set loading, `await createClient().auth.signInWithOAuth({...})`;
     on a returned error, set error and clear loading (the browser has not navigated in that case);
   - render the `role="alert"` region with `data-testid="google-login-error"` directly beneath
     `<GoogleLoginButton />`, inside the existing `max-w-124` column;
   - remove `useRouter` and the `router.push` stand-in.
6. `pnpm typecheck && pnpm lint && pnpm build`.
7. Run the full E2E suite. All three specs must now be GREEN.

## Todo List

- [x] `googleButton.error` present in `en/login.json` **and** `vi/login.json`
- [x] `data-testid="google-login-button"` added
- [x] `app/auth/callback/route.ts` created; reads only `code`
- [x] Callback recomputes `isBeforeLaunch()` locally; no inbound hint honored
- [x] No `next` param read, accepted, or reflected anywhere
- [x] `app/login/page.tsx` awaits `searchParams`, derives `initialError`
- [x] `hero-section.tsx` calls `signInWithOAuth` with a query-string-free `redirectTo`
- [x] `useRouter` / `router.push` stand-in removed
- [x] `role="alert"` + `data-testid="google-login-error"` region renders when `initialError`
- [x] Retry clears the error before starting a new attempt
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm build` exit 0
- [x] All three E2E specs GREEN
- [x] Host-relative redirects fixed via `redirect()` from `next/navigation`

## Success Criteria

| ID                 | Criterion                                                                                        | Method                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| SC-003             | Click disables the button and sets `aria-busy="true"`                                            | `e2e/login-click-contract.spec.ts` GREEN                                           |
| A1 contract        | Authorize URL carries `provider=google` and a `redirect_to` of exactly `${origin}/auth/callback` | same spec, URL assertion GREEN                                                     |
| SC-005             | `/login?error=oauth_failed` renders the localized message in a `role="alert"` region             | `e2e/login-error-state.spec.ts` GREEN                                              |
| DEC-003            | `curl -i "http://127.0.0.1:3000/auth/callback"` (no `code`)                                      | `302` → `/login?error=oauth_failed`                                                |
| No open redirect   | `curl -i "http://127.0.0.1:3000/auth/callback?next=https://evil.test"`                           | `302` → `/login?error=oauth_failed`; `evil.test` absent from every response header |
| No hard-coded copy | `grep -rn "Đăng nhập không thành công" components/ app/`                                         | zero hits (copy lives in JSON only)                                                |
| Size discipline    | `wc -l` on every touched file                                                                    | all < 200                                                                          |

## Risk Assessment

| Risk                                                                                 | Likelihood                             | Impact       | Countermeasure                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSearchParams()` used instead of the server prop → build fails on static `/login` | **High** if the obvious route is taken | High         | The server-prop design is mandated in Key Insights and step 4; `pnpm build` in step 6 is the detector                                                                     |
| `next` param copied from the reference example → open redirect                       | Medium                                 | **Critical** | Explicit todo item + the `evil.test` curl check in Success Criteria                                                                                                       |
| Raw Supabase error leaked into the URL or the UI                                     | Medium                                 | Medium       | DEC-003 collapses every failure to one opaque flag; the grep check confirms no copy is inlined                                                                            |
| English error copy invented without sign-off                                         | High                                   | Low          | Key added with a placeholder-quality English string and flagged to the copy owner; the _key_ is the contract, the string is editable without code change                  |
| Button stuck in `loading` after a client-side `signInWithOAuth` error                | Medium                                 | Medium       | Clear `loading` on the returned-error path; the happy path navigates away, so no cleanup is possible or needed there                                                      |
| GoTrue forwards unexpected error param names on user-cancel                          | Medium                                 | Low          | MEDIUM-confidence unknown (technical-spec § 5.3.1). The design degrades safely: "no usable `code`" is the general failure case, so the exact names never need to be known |
| `/login` becoming dynamic hurts performance                                          | Low                                    | Low          | It is a single unauthenticated page behind a proxy that already runs per request; no caching benefit is lost in practice                                                  |

## Security Considerations

- **Open-redirect elimination is the headline control here.** The callback accepts exactly one
  query parameter (`code`) and reflects none. The `evil.test` curl check is a required gate, not
  a nicety.
- `GOOGLE_SECRET` is never referenced — GoTrue holds it; the app only exchanges GoTrue's
  second-hop code.
- The session cookie is written solely by `@supabase/ssr`'s `setAll` adapter. Do not hand-set,
  hand-read, or log any `sb-*` cookie.
- The error message is deliberately identical for cancel, deny, expired code, and missing code —
  no oracle is offered about which failure occurred.
- `role="alert"` announces the failure without stealing focus, keeping the retry path reachable
  by keyboard.

## Next Steps

Unblocks **Phase 06** (GREEN gate + manual credential verification). Report the full suite result
and flag the English copy string for the copy owner's review.

## Rollback

`git checkout -- app/login/page.tsx components/login/ lib/i18n/locales/*/login.json && rm -rf app/auth`.
Reverts `/login` to the pre-auth stand-in. Note the Phase 04 guard would then send every
authenticated-only route to `/login` with no way to sign in — so roll back Phase 05 and Phase 04
together, or not at all.
