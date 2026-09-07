# Stage 5 — Inspection outcome + fixes applied

Reviewer report: `plans/260702-1448-login-page/reports/reviewer-260906-1644-login-auth-inspection.md`
Verdict: **no critical defects.** All security invariants verified in code (not from comments):
`getUser()`-only authorization with nothing between it and `createServerClient`, open-redirect
countermeasure, bare `redirectTo`, host-relative redirects, cookie propagation on both proxy branches.

## Two High findings — BOTH FIXED

### H1 — `handleLogin` could strand the button in a permanent loading state

`components/login/hero-section.tsx` — no try/catch. `createClient()` throws when the Supabase env
vars are missing, and `signInWithOAuth` can reject outright (offline, DNS failure, GoTrue
unreachable) instead of resolving `{ error }`. An escaping exception left `loading === true`, so the
button stayed disabled behind a spinner with no error message and no way to retry.

**Fix:** wrapped the body in try/catch; the catch sets `error` and clears `loading`. Success still
does NOT reset `loading` — the browser is navigating away and the spinner must persist until unload.

### H2 — callback could return a bare 500 instead of the promised error redirect

`app/auth/callback/route.ts` — `exchangeCodeForSession` was unguarded. Route Handlers are NOT covered
by `error.tsx` boundaries, so a thrown exception (network fault, malformed response, or the
`handle_new_user` trigger erroring on first sign-in) produced an unhandled 500 rather than the
`/login?error=oauth_failed` redirect DEC-003 promises.

**Fix:** extracted `exchangeCode(code): Promise<boolean>` collapsing both failure shapes
(`{ error }` and a thrown exception) into one boolean.

**Subtlety that shaped the fix:** `redirect()` from `next/navigation` signals by THROWING
`NEXT_REDIRECT`. A try/catch wrapped around the whole handler would have swallowed the redirect and
broken the route outright. The exchange therefore lives in its own function so no `redirect()` call
can ever fall inside the catch.

Verified live — a bogus code now degrades gracefully instead of 500-ing:

```
GET /auth/callback?code=totally-invalid-code  → 307  location: /login?error=oauth_failed
GET /auth/callback                            → 307  location: /login?error=oauth_failed
GET /auth/callback?code=x&next=https://evil.test → 307 location: /login?error=oauth_failed
```

## Also fixed — `pnpm format:check` blockers flagged by the reviewer

CRLF line endings in `lib/i18n/locales/{en,vi}/login.json`, missing trailing newline in
`next.config.ts`, plus `google-login-button.tsx` and the three `e2e/*.spec.ts` files. Every file this
work touched now passes `prettier --check`. Files this work did NOT touch were deliberately left
alone (`components/login/site-{header,footer}.tsx` and ~140 others are pre-existing format failures —
reformatting them would churn the diff for no benefit).

## Post-fix verification (orchestrator-run)

| Gate                                                                  | Result                                                |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| `pnpm typecheck`                                                      | exit 0                                                |
| `pnpm exec prettier --check <all touched files>`                      | exit 0 — "All matched files use Prettier code style!" |
| `pnpm exec eslint app/ components/login/ lib/supabase/ proxy.ts e2e/` | exit 0 (0 errors, 14 tailwind-order warnings)         |
| `pnpm build`                                                          | exit 0                                                |
| `pnpm exec playwright test --reporter=line`                           | **`11 passed (7.4s)` — REAL_EXIT=0**                  |

## Secret hygiene — verified

- `git ls-files | grep ^\.env` → empty. `.env` / `.env.local` neither tracked nor staged.
- No JWT literal anywhere outside `.env*` (an incidental 12-char JWT header prefix quoted in
  `phase-03-supabase-env.md` was redacted).
- `SUPABASE_AUTH_GOOGLE_SECRET` is referenced by ZERO `.ts`/`.tsx` files — GoTrue holds it; the app
  never sees it, exactly as designed.

## Accepted, NOT fixed (non-blocking, recorded for follow-up)

- `docs/system/architecture.md` overstates a defense-in-depth `getUser()` check on protected pages
  that does not exist in code. The Next docs warn Proxy alone is not an authorization boundary, so
  the doc describes the RIGHT target — the code just has not implemented it. Left as a documented
  gap rather than silently rewriting the doc to match weaker code. **Recommend adding the per-page
  check as follow-up work.**
- `skip_nonce_check = true` in `supabase/config.toml` — fine for local, wants a guardrail note before
  any production project.
- Unused `next-intl` dependency still in `package.json` (its build wiring was removed in Phase 01).
- The `/` tautology in `auth-guard.spec.ts` (see `phase-02-red.md`).
