# Phase 01 — Real sign-out (G1)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table
- Defect site: `components/homepage/user-menu.tsx:68-79`
- The guard that exposes it: `lib/supabase/proxy.ts:83-85`
- Browser client factory: `lib/supabase/client.ts`
- Cookie-handling precedent: [`../260702-1448-login-page/phase-04-auth-layer-proxy-guard.md`](../260702-1448-login-page/phase-04-auth-layer-proxy-guard.md)

## Overview

**Priority:** P0
**Status:** pending
**Effort:** 1h
**Depends on:** nothing
**Resolved `test_policy`:** `visual-contract` — this folder has **no MoMorph test cases** (no
screenId, empty `data/`), so no RED-first claim may be made here. The verification below is
manual and evidence-based, not a TDD gate. Behavior is still real; the _proof_ is manual.

The user menu's "Sign out" is decoration. It navigates without ending the session.

## Key Insights

- **The exact failure, traced end to end.** `user-menu.tsx:73` runs `router.push("/login")`. The
  Supabase session cookies are untouched, so the very next request carries a valid session.
  `proxy.ts:75` resolves a real `user`, `proxy.ts:83` sees `pathname === "/login"`, and
  `proxy.ts:84` redirects back to `/about` (or `/countdown`). The user lands where they started
  and there is **no way to sign out of this application at all**.
- The file's own docblock admits it: _"Presentational except 'Sign out', which navigates to the
  login page -- there is no real auth/session wiring here."_ This is known debt, not a surprise —
  but it is P0 because a session that cannot be ended is a security problem on any shared
  machine, not a cosmetic one.
- **`signOut()` must run through the browser client**, `lib/supabase/client.ts`, so
  `@supabase/ssr` clears the cookies it set. Clearing `document.cookie` by hand would miss the
  chunked cookie names the SSR adapter uses.
- **A client-side `router.push` after `signOut()` is not enough on its own.** The App Router
  cache can serve a stale authenticated render. Use `router.refresh()` after the push, or a hard
  `window.location.assign("/login")`. Prefer the router pair and verify; fall back to the hard
  navigation only if a stale render is actually observed.
- **`signOut()` can reject** — network down, GoTrue unreachable. An unguarded call leaves the
  menu open and the user believing they signed out. Wrap it, and on failure still navigate away
  _and_ surface the failure rather than silently pretending. The login plan's phase 06 found the
  identical class of defect (unguarded `handleLogin`) and fixed it; do not re-introduce it here.
- **Scope discipline.** This phase changes one handler in one file. It does **not** touch the
  Profile / Admin Dashboard items (phase 03) and does **not** touch `proxy.ts` (countdown retro).

## Requirements

**Functional**

- Clicking "Sign out" ends the Supabase session before navigating.
- After it completes the user is on `/login` and stays there.
- A subsequent direct request to `/about` redirects to `/login`.
- A failed `signOut()` does not leave the user in a false "signed out" state.

**Non-functional**

- `user-menu.tsx` stays well under 200 lines (84 today).
- No new dependency; no new component.
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` exit 0.

## Architecture

```text
UserMenu ("use client")
  handleSignOut = async () => {
    setOpen(false)
    try   { await createClient().auth.signOut() }      // lib/supabase/client.ts
    catch { surface the failure — do not swallow }
    finally { router.push("/login"); router.refresh() }
  }
```

**Data flow**

| In                 | Transform                       | Out                                            |
| ------------------ | ------------------------------- | ---------------------------------------------- |
| click              | `signOut()` → GoTrue revoke     | `Set-Cookie` clearing `sb-*-auth-token`        |
| cleared jar        | next request through `proxy.ts` | `user = null` → `/login` on any protected path |
| `router.refresh()` | discards the RSC cache          | no stale authenticated render                  |

**Compatibility.** Nothing else calls `signOut()` (`grep -rn "signOut" components app lib`
returns only the i18n label key and this menu item), so there is no shared contract to preserve.

## Related Code Files

**Modify** — `components/homepage/user-menu.tsx` (the sign-out handler only)
**Read only** — `lib/supabase/client.ts`, `lib/supabase/proxy.ts`, `app/login/page.tsx`

**Do not modify** — `lib/supabase/proxy.ts` (countdown retro owns it),
`components/common/notification-menu.tsx` (phase 03).

## Implementation Steps

1. Reproduce first: sign in, open the menu, click Sign out, observe the bounce back to `/about`.
   Record it — this is the evidence the fix is measured against.
2. Import `createClient` from `@/lib/supabase/client` and replace the handler body with the
   shape above.
3. Handle the rejection path explicitly. Decide and write down what the user sees: at minimum the
   navigation still happens; ideally the failure is visible rather than silent.
4. `pnpm typecheck && pnpm lint && pnpm build`.
5. Verify manually (steps below). Capture the cookie jar before and after.

## Todo List

- [ ] Failure reproduced and recorded before the fix
- [ ] `signOut()` called via the browser client, awaited
- [ ] Rejection path handled — no silent swallow
- [ ] `router.refresh()` (or a justified hard navigation) prevents a stale render
- [ ] `/about` after sign-out redirects to `/login`
- [ ] Menu closes before the async work starts
- [ ] `grep -n "getSession" components/homepage/user-menu.tsx` → empty (project ban holds)
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                                                     | Method                                            |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| SC-01 | Sign out lands on `/login` and stays                                          | manual, with DevTools open                        |
| SC-02 | `sb-*-auth-token` cookies are gone afterwards                                 | Application → Cookies, before/after               |
| SC-03 | `/about` typed directly afterwards → `/login`                                 | manual                                            |
| SC-04 | Back-button after sign-out does not restore an authenticated view             | manual                                            |
| SC-05 | With Supabase stopped, sign out still navigates and the failure is not silent | stop containers, retry                            |
| SC-06 | Static gate                                                                   | `pnpm format:check && lint && typecheck && build` |

No e2e assertion is claimed. Automating SC-01 needs the shared storage-state fixture
([award-system phase-01](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md));
once that lands, this is a strong candidate for the first authenticated spec — but that is
follow-up work, not this phase's gate.

## Risk Assessment

| Risk                                                                                  | Likelihood | Impact       | Countermeasure                                                                |
| ------------------------------------------------------------------------------------- | ---------- | ------------ | ----------------------------------------------------------------------------- |
| `signOut()` rejects and the user believes they are signed out                         | Medium     | **Critical** | Step 3 + SC-05; the same defect class the login plan's phase 06 caught        |
| Stale RSC cache renders authenticated content after sign-out                          | Medium     | High         | `router.refresh()`; SC-04 checks the back-button path specifically            |
| Hand-clearing cookies instead of using the client misses chunked names                | Low        | High         | The client is the only sanctioned path; called out in Key Insights            |
| Scope creep into the dead Profile/Admin items                                         | Medium     | Low          | Explicitly deferred to phase 03, which owns the same file afterwards          |
| `signOut({ scope: "global" })` chosen unthinkingly, killing the user's other sessions | Medium     | Medium       | Default (`local`) unless someone asks otherwise; note the choice in a comment |

## Security Considerations

- **This is the phase's whole point.** Until it lands there is no mechanism to end a session on a
  shared or public machine. Treat it as a security fix, not a UX polish.
- Use `getUser()` semantics throughout; `getSession()` remains banned project-wide.
- Do not log the session or token anywhere in the error path.
- Local vs global sign-out is a real security decision — record which was chosen and why.

## Next Steps

Unblocks [phase-03](./phase-03-header-menu-data-wiring.md), which edits the same file. Flag to
the award-system folder that the storage-state fixture would let SC-01 become an automated
assertion.

## Rollback

`git checkout -- components/homepage/user-menu.tsx`. One file, one handler; reverting restores
the current (broken) behavior with no residue beyond sessions already correctly ended.
