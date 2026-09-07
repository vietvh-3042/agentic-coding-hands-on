# Phase 04 evidence — Supabase clients + proxy route guard

Implemented by `implementer` subagent; **one correctness defect found and fixed by the orchestrator on review.**

## Files created

| File                     | Lines | Role                                                                              |
| ------------------------ | ----- | --------------------------------------------------------------------------------- |
| `lib/supabase/client.ts` | 10    | `createBrowserClient` factory, fresh per call, no singleton                       |
| `lib/supabase/server.ts` | 29    | `createServerClient` + `await cookies()`, `getAll`/`setAll`, documented try/catch |
| `lib/supabase/proxy.ts`  | ~95   | session refresh + route guard + FR-102 bounce                                     |
| `proxy.ts` (root)        | 14    | Next 16 Proxy entrypoint, exports `proxy` + `config.matcher`                      |

Build output confirms `ƒ Proxy (Middleware)` registered — the Next 16 `proxy.ts` convention resolved.

## DEFECT FOUND ON REVIEW — dropped refreshed cookies on redirect (FIXED)

The implementer's guard returned a bare `NextResponse.redirect(url)` from BOTH branches:

```ts
if (!user && !isPublicPath(pathname)) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url); // <-- discards supabaseResponse's cookies
}
```

This is exactly the footgun the module's own header comment warns about, and the file's `setAll`
adapter carefully guards against — bypassed at the two exit points that matter.

**Impact.** `getUser()` can rotate the access/refresh token pair; when it does, `setAll` has already
written the new pair onto `supabaseResponse`. Returning a fresh redirect response discards them, so
the browser keeps the PRE-rotation refresh token. `supabase/config.toml` has
`enable_refresh_token_rotation = true` and `refresh_token_reuse_interval = 10`, so that stale token
becomes invalid once the reuse interval lapses → the next refresh fails → silent sign-out. The
`user && pathname === "/login"` branch is the most exposed: the user is authenticated, a refresh is
plausible, and the response is always a redirect.

Not caught by the E2E suite: with no real session, `getUser()` returns null and `setAll` never fires
a rotation, so every automated assertion passes either way. Found by reading the code, not by a test.

**Fix.** Added `redirectPreservingCookies(request, pathname, source)`, which copies
`source.cookies.getAll()` onto the redirect before returning it. Both branches now route through it.

## Verification (post-fix, orchestrator-run)

| Gate                                                               | Result                              |
| ------------------------------------------------------------------ | ----------------------------------- |
| `pnpm typecheck`                                                   | exit 0                              |
| `pnpm exec eslint lib/supabase/ proxy.ts`                          | exit 0 — zero new errors            |
| `pnpm build`                                                       | exit 0                              |
| `pnpm exec playwright test e2e/auth-guard.spec.ts --reporter=line` | **`6 passed (6.2s)` — REAL_EXIT=0** |

RED → GREEN transition on the gate spec is complete and re-verified after the fix.
`e2e/login-click-contract.spec.ts` and `e2e/login-error-state.spec.ts` remain RED by design — Phase 05 owns them.

## Constraint compliance (verified by reading the code, not by grep)

- `getUser()` called immediately after `createServerClient`, nothing between. ✓
- No `getSession()` anywhere in the auth path. ✓
- No `runtime` key in `proxy.ts` or its config. ✓
- `getAll`/`setAll` adapter; two-sided write (request, then rebuilt response). ✓
- `pathname !== "/"` exemption from the reference code correctly REMOVED — `/` is protected. ✓
- Public paths defined once in `isPublicPath`, shared by both branches. ✓
- Redirects to `/login`, not the reference's `/auth/login`. ✓
- FR-102 branch present: authenticated + `/login` → `isBeforeLaunch() ? "/countdown" : "/about"`. ✓

## Note on the implementer's self-report

It reported rewording two code comments to avoid the literal substrings `getSession` and `runtime`
so the phase's literal `grep` success-criteria would not false-positive. The explanations survive and
the behavior is correct — but it is a reminder that grep-shaped acceptance criteria measure text, not
semantics. This phase was accepted on a read of the code; the defect above was invisible to every
grep check in the phase file.
