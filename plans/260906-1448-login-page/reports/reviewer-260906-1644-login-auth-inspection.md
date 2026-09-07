## Review Summary

### Scope

- Files reviewed (new): `proxy.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`,
  `app/auth/callback/route.ts`, `playwright.config.ts`, `e2e/auth-guard.spec.ts`,
  `e2e/login-click-contract.spec.ts`, `e2e/login-error-state.spec.ts`
- Files reviewed (modified): `app/login/page.tsx`, `components/login/hero-section.tsx`,
  `components/login/google-login-button.tsx`, `lib/i18n/locales/{en,vi}/login.json`,
  `next.config.ts`, `package.json`, `supabase/config.toml`
- Also read for context: `supabase/migrations/20260722090000_create_profile_on_signup.sql`,
  `supabase/migrations/20260714070000_profile_schema.sql`, `lib/countdown-config.ts`,
  `app/layout.tsx`, `app/page.tsx`, `app/about/page.tsx`, `docs/system/architecture.md`,
  `.env.example`, `.gitignore`
- Lines: ~450 across the new/modified auth surface
- Depth: full read of every file in scope, plus `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
  `pnpm build`, and `pnpm test:e2e` executed live against this tree

### Assessment

This is a careful, security-conscious implementation. The open-redirect countermeasure (DEC-001),
the `getUser()`-only authorization standard, the "no code between `createServerClient()` and
`getUser()`" discipline, the cookie-preservation fix, and the host-relative-redirect fix are all
correctly and completely implemented — I verified each one directly in the code, not just in the
comments describing them. `pnpm build` and all 11 E2E specs pass live. No critical defect found.
Two real error-boundary gaps (both explicitly called out as focus areas) keep this from a clean
pass: the client-side login handler and the OAuth callback route can each leave the user in a
broken state on failure modes that don't return the SDK's normal `{error}` shape.

### Critical

None found.

### High

**H1 — `handleLogin` has no failure boundary around `createClient()`/`signInWithOAuth()`; the
button can get stuck in `loading` forever.**
`components/login/hero-section.tsx:33-47`

```
const handleLogin = async () => {
  setError(false);
  setLoading(true);
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithOAuth({ ... });
  if (signInError) { setError(true); setLoading(false); }
};
```

This only resets `loading` when the SDK resolves with `{ error }`. If `createClient()` throws
synchronously (e.g. `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` unset or malformed —
`createBrowserClient` throws in that case) or `signInWithOAuth` rejects instead of resolving with
an error object, the promise rejects unhandled: `setLoading(false)` never runs, the button stays
disabled with the spinner shown, `aria-busy="true"` never clears, and there is no error message and
no way to retry short of a full page reload. This is exactly the "does the button ever get stuck in
loading?" failure class this review was asked to hunt for, and it is real.
**Fix:** wrap the body in try/catch (or `.catch()`) and reset `loading`/set `error` in all failure
paths:

```ts
const handleLogin = async () => {
  setError(false);
  setLoading(true);
  try {
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signInError) throw signInError;
  } catch {
    setError(true);
    setLoading(false);
  }
};
```

**H2 — `exchangeCodeForSession` is not guarded against a thrown exception; a transient failure
returns a bare 500 instead of the promised localized error redirect.**
`app/auth/callback/route.ts:37-49`

```ts
if (code) {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) redirect(isBeforeLaunch() ? "/countdown" : "/about");
}
redirect("/login?error=oauth_failed");
```

DEC-003 and FR-203 promise that _any_ failed exchange lands the user back on
`/login?error=oauth_failed` with the localized message. That only holds for the SDK's normal
`{error}` return shape. If `exchangeCodeForSession` throws instead (transient network blip to the
local GoTrue instance, a DB-level exception during the `handle_new_user` trigger surfacing as a
raw exception rather than an `AuthApiError`, a timeout, etc.), the throw propagates out of the
Route Handler unhandled. Route Handlers are not wrapped by `error.tsx`/`global-error.tsx` (those
only cover the React render tree), so this is not a "the user sees an ugly page" problem — it's a
bare, unstyled 500 with no redirect back to `/login` at all, breaking the FR-203 guarantee for this
class of failure and leaving the member with no way to retry without manually navigating back.
**Fix:** wrap the exchange in try/catch and fall through to the same DEC-003 redirect on any
exception:

```ts
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) redirect(isBeforeLaunch() ? "/countdown" : "/about");
    } catch {
      // fall through to the DEC-003 redirect below
    }
  }
  redirect("/login?error=oauth_failed");
}
```

(Note: `redirect()` itself throws a `NEXT_REDIRECT` control-flow error — make sure any try/catch
added here does not accidentally swallow that; catching only around the `exchangeCodeForSession`
call, as above, avoids the issue since the successful `redirect()` call already exits the try block
before any catch could intercept it — actually re-check: the successful-path `redirect()` call is
_inside_ the try block above. Since `redirect()`'s thrown value is a special digest-tagged error
Next.js re-throws through, a plain `catch {}` here would swallow it too. Prefer isolating only the
`exchangeCodeForSession` call in the try, and call `redirect()` for the success case _outside_ the
try, e.g. `const { error } = await tryExchange(code); if (error === null) redirect(...); ...`.)

### Medium

**M1 — `docs/system/architecture.md`'s Trust Boundaries claim doesn't match the shipped code.**
`docs/system/architecture.md:96-99` states: _"Every Server Component / Route Handler on a
protected route independently calls `getUser()` (never `getSession()`) rather than trusting the
proxy alone."_ I checked all four protected pages — none call `getUser()`:

```
grep -n "getUser\|createClient\|supabase" app/about/page.tsx app/countdown/page.tsx \
  app/award-info/page.tsx app/sun-kudos/page.tsx   →  no matches
```

This is allowed by the spec (`technical-spec.md` BR-002 says defense-in-depth "MAY" be added, not
must), so the code isn't wrong — but the architecture doc overstates an already-implemented
security property that doesn't exist yet. `proxy.ts`'s matcher is a genuine single point of
failure for all 5 protected routes today, exactly the risk the doc's own next sentence warns
about ("a matcher change ... could silently drop the guard"). Fix the doc to describe reality, or
add the defense-in-depth `getUser()` calls it claims exist.

**M2 — `skip_nonce_check = true` under `[auth.external.google]` has no guardrail against reaching
production.** `supabase/config.toml:344`. This is a known, documented local-dev workaround for
Google OAuth against `127.0.0.1` and is scoped to this repo's local `config.toml`, not a hosted
project's dashboard settings — I'm not flagging the local behavior itself. But there is no comment
or architecture note anywhere warning that a hosted Supabase project's Auth settings must _not_
carry this over (nonce checking is real replay protection for the OIDC id_token GoTrue receives
from Google). Add a one-line comment/doc note so this isn't silently copy-pasted into a production
Supabase project config later.

**M3 — Env var naming drift between the specs and the actual implementation.**
`clarifications.md:15`, `technical-spec.md` §4.6, and `docs/system/architecture.md:93` all refer to
`GOOGLE_CLIENT_ID`/`GOOGLE_SECRET`/`GOOGLE_CLIENT_SECRET`. The actual, correct, working
implementation (`supabase/config.toml:341-342` and the authoritative `.env.example`) uses
`SUPABASE_AUTH_GOOGLE_CLIENT_ID`/`SUPABASE_AUTH_GOOGLE_SECRET`. `.env.example` is right and the code
works; this is pure documentation drift in the earlier planning docs, but worth a fix pass so a
future reader doesn't set the wrong env var name based on the spec's prose.

### Low

**L1 — `lib/i18n/locales/en/login.json` and `lib/i18n/locales/vi/login.json` use CRLF line
endings and fail `pnpm format:check`.** Verified directly:

```
$ npx prettier --check lib/i18n/locales/vi/login.json lib/i18n/locales/en/login.json next.config.ts
[warn] lib/i18n/locales/vi/login.json
[warn] lib/i18n/locales/en/login.json
[warn] next.config.ts
```

`xxd` confirms `\r\n` line endings in both JSON files (every other locale file in the repo is LF).
Fix: `sed -i 's/\r$//' lib/i18n/locales/{en,vi}/login.json` or re-save with LF endings.

**L2 — `next.config.ts` is missing a trailing newline** (also flagged by `format:check` above,
confirmed via `git diff` — the file ends `export default withNextIntl(nextConfig);` with `\ No
newline at end of file` in the previous version and the current file has the same issue). Run
`pnpm format` to fix both L1 and L2 in one pass.

**L3 — Tailwind class-order warnings in the reviewed components** (from `pnpm lint`, warnings
only, zero errors in the login/auth file set):
`components/login/google-login-button.tsx:35,40`, `components/login/hero-section.tsx:50,85,97`.
Auto-fixable with `pnpm lint:fix`.

**L4 — `next-intl` (`^4.14.2`) is still a `package.json` dependency with no remaining usage.**
`next.config.ts`'s `withNextIntl(...)` plugin wrapper was correctly removed (confirmed via `git
diff --cached -- next.config.ts` — the plugin import and wiring are gone in the working tree), and
`grep -rl "next-intl" app components lib hooks` returns nothing. The actual i18n stack is
`react-i18next` (`components/common/i18n-provider.tsx`, `useTranslation()` throughout). Dead
dependency — YAGNI says drop it unless there's a concrete near-term plan to use it.

**L5 — No env-var validation at startup.** `lib/supabase/client.ts:9` and
`lib/supabase/server.ts:11` use `process.env.NEXT_PUBLIC_SUPABASE_URL!` (non-null assertion). If
unset, the failure surfaces as whatever cryptic error `@supabase/ssr` throws deep inside
`createBrowserClient`/`createServerClient`, not a clear "missing env var" message. Not a security
issue (`.env.example` documents the right names), just a debuggability nit. Consider a small
assertion helper if this bites someone during setup.

### Edge Cases Turned Up

- **Empty `code=` query param**: `request.nextUrl.searchParams.get("code")` returns `""`, which is
  falsy, so the `if (code)` guard correctly treats it the same as a missing `code` (DEC-003). No
  bug.
- **`isBeforeLaunch()` consistency**: both the callback route and the proxy call the _same_
  `lib/countdown-config.ts:isBeforeLaunch()` function — no drift between where "before/after
  launch" is decided.
- **NEXT_LOCALE survival**: verified `NextResponse.next({ request })` in `updateSession` does not
  need to re-copy `NEXT_LOCALE` onto the response — it was never removed from the browser's jar in
  the first place (the proxy only needs to _set_ new cookies, not resend ones the browser already
  holds). The code comment's reasoning is correct.
- **Reflected `?error=` param**: `app/login/page.tsx:29-30` only does a strict `=== "oauth_failed"`
  check and never renders the raw query value into the DOM — no reflected-value XSS surface, good
  practice worth calling out.
- **Public asset paths bypass the proxy matcher** (`/login/*.png` etc., excluded by the `.svg|.png|
...$` negative lookahead) — intentional and fine, these are non-sensitive static assets, not a
  guard bypass of anything that matters.
- **`hero_code` collision in `handle_new_user`**: checked `supabase/migrations/20260714070000_
profile_schema.sql` — `hero_code` has no `unique` constraint, so an `md5(id)[:6]` collision
  can't fail the trigger/rollback the sign-up. Ruled out as a risk.
- **`app/page.tsx` "/" tautology** (already known, per task brief): confirmed `app/page.tsx` is an
  unconditional `redirect("/login")` — the `auth-guard.spec.ts` case for `/` passes with or
  without the guard. No other vacuous assertion found after reading all three E2E spec files
  line-by-line and running the suite live (`pnpm test:e2e` → 11/11 passed).

### Done Well

- The two previously-fixed defects (cookie-dropping redirects in `proxy.ts`, absolute-URL host
  rewrite in the callback route) are both correctly and completely fixed — I traced every `return`
  in `updateSession` (3 total, all covered) and confirmed no other absolute-URL construction
  remains in `app/auth/callback/route.ts`.
- `getUser()` is called with zero statements between it and `createServerClient()` in `proxy.ts`,
  exactly per the invariant, and `getSession()` does not appear anywhere in the auth path.
- The open-redirect countermeasure is real, not cosmetic: the callback route reads only `code`,
  never `next`/`redirect_to`, and `redirectTo` passed to `signInWithOAuth` is verified (by a live
  E2E test, not just a comment) to be the bare `http://127.0.0.1:3000/auth/callback` with no query
  string.
- `handle_new_user`'s trigger function correctly uses `security definer set search_path = public`
  — closes the classic search-path-hijack hole on `SECURITY DEFINER` functions.
- Good empty-catch discipline in `lib/supabase/server.ts:17-25` — the swallowed exception there is
  the officially-documented Supabase pattern (Server Components can't write cookies during render;
  the proxy's own refresh is what actually keeps the session alive) and is explained inline rather
  than silently present.
- E2E suite genuinely exercises real app code (verified this myself by running it) rather than
  asserting against mocks — `page.route()` interception of `**/auth/v1/authorize*` still requires
  the app to construct and attempt that exact request via the real `createBrowserClient` +
  `signInWithOAuth` call path.

### Actions In Order

1. Fix H2 — wrap `exchangeCodeForSession` in try/catch in `app/auth/callback/route.ts` (heaviest:
   this is the auth completion path; a bare 500 here is the worst user-facing outcome in this diff).
2. Fix H1 — wrap `handleLogin` in `components/login/hero-section.tsx` so the button can never get
   permanently stuck loading.
3. Fix L1/L2 — normalize line endings in the two `login.json` files and add the trailing newline
   to `next.config.ts` (`pnpm format` handles both).
4. Correct M1 (architecture.md) and M3 (env var names) doc drift.
5. Decide on M2 (add a guardrail note against `skip_nonce_check` reaching production) and L4 (drop
   unused `next-intl` dependency) — both low-urgency, take when convenient.

### Numbers

- `pnpm typecheck`: clean, 0 errors.
- `pnpm build` (Turbopack, production): succeeds — all 8 routes compiled, `Proxy (Middleware)`
  correctly recognized.
- `pnpm lint`: 32 errors / 364 warnings **repo-wide**, but **0 errors** in the reviewed login/auth
  file set (only Tailwind-order/shorthand warnings — see L3). The 32 errors live in unrelated,
  out-of-scope files (`components/kudos/*`, `hooks/use-click-outside.ts`, `lib/i18n/i18n.ts`) and
  will fail `pnpm validate` / CI if left as-is, but are not part of this feature's diff.
- `pnpm format:check`: fails repo-wide (148 files, mostly pre-existing/out-of-scope); within scope,
  fails on `lib/i18n/locales/{en,vi}/login.json` and `next.config.ts` (L1/L2 above).
- `pnpm test:e2e`: 11/11 passed, ~7.2s, against the real `pnpm build && pnpm start` production
  server (no Docker/Supabase stack required, matching the settled test-policy scope).
- Test coverage: E2E covers guard/redirect (5 protected routes + `/login` itself), click-contract
  (authorize URL shape, `redirect_to` exactness, loading/aria-busy state), and error-state
  rendering. Real Google-consent happy path is explicitly out of scope per clarifications.md
  (manual verification, pending real Google credentials).

### Still Unresolved

- Whether `exchangeCodeForSession` can genuinely throw (vs. always resolving `{error}`) under
  `@supabase/ssr` ^0.12/`@supabase/supabase-js` ^2.115 wasn't verified against the library source
  (blocked from reading `node_modules`) — H2 is written defensively regardless, since even a
  low-probability unhandled-throw path in the auth completion route is worth closing given the
  bare-500 blast radius.
- Real end-to-end Google consent flow is still unexercised (per clarifications.md, blocked on real
  Google Cloud credentials) — this review could not and did not attempt to validate that path.

**Status:** DONE_WITH_CONCERNS
**Summary:** No critical/security-breaking defect found; the open-redirect, cookie-preservation,
and host-relative-redirect invariants all hold and are E2E-verified live. Two High findings are
real error-boundary gaps in the login button and the OAuth callback route that can strand a user
(stuck-loading button / bare 500) on failure modes outside the SDK's normal `{error}` return shape
— both should be fixed before this ships.
**Concerns/Blockers:** H1 and H2 above should be fixed pre-merge. Everything else (M1-M3, L1-L5) is
non-blocking cleanup.
