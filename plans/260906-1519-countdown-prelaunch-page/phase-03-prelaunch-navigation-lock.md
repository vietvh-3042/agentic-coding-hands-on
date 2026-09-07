# Phase 03 — Prelaunch navigation lock (G2, G5)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Spec row 1 `transitionNote`: [`data/8PJQswPZmU-specs.csv`](./data/8PJQswPZmU-specs.csv)
- Trustworthy launch instant comes from: [`phase-01`](./phase-01-launch-datetime-from-event-settings.md)
- Guard being extended: `lib/supabase/proxy.ts`
- Existing guard coverage: `e2e/auth-guard.spec.ts`

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 1.5h
**Depends on:** Phase 01 (hard — the lock must key off the database instant, never the deleted
config constant) **and** Phase 02 (the time-seeding helper)
**Resolved `test_policy`:** `e2e-red-first` — this is a behavioral state transition drawn from a
MoMorph test case set, and it changes routing for every user.

Spec row 1 states it plainly: _"Khi countdown về 0: người dùng được phép điều hướng đến các
trang khác. Khi chưa về 0: toàn bộ điều hướng đến các trang khác bị khóa."_ Nothing implements
it. An authenticated user can type `/about` before launch and read the whole site.

## Key Insights

- **This phase is blocked on a product answer, not on engineering.** `app/countdown/page.tsx:24`
  says the lock was dropped "per plan clarifications", and no `clarifications.md` exists in this
  folder to substantiate that. Either the decision is recovered or it is re-taken. **Do not
  implement this phase on the strength of the spec row alone** — reversing a deliberate product
  choice is worse than leaving the gap open and labelled.
- **The right layer is the proxy.** `updateSession` already runs on every matched request and
  already redirects. Adding a second branch there is DRY; scattering `isBeforeLaunch()` checks
  across five page components is not.
- **Ordering matters and is easy to get wrong.** The auth check must stay first. An
  unauthenticated user hitting `/about` before launch must go to `/login` (SC-001 of the login
  plan, asserted by `e2e/auth-guard.spec.ts`), _not_ to `/countdown`. Put the lock branch after
  the `!user` branch.
- **`/countdown` must be exempt from its own lock**, or the redirect loops infinitely. So must
  `/login` and `/auth/*` — reuse `isPublicPath()` rather than writing a second list.
- **G5 dissolves into this.** `countdown-timer.tsx:53-55` currently force-navigates to `/about`
  at zero. Once the proxy lock lifts on its own, that client-side redirect is redundant _and_
  wrong — it navigates rather than merely unlocking. Remove it as part of this phase; leaving
  both means two mechanisms racing on the same transition.
- **The lock's window is currently empty.** The live row is `2026-07-21`, in the past, so the
  lock would never engage on today's data. It must be tested by seeding a future instant (phase
  02's helper), not by hoping.

## Requirements

**Functional**

- While `now < launch_at`: every protected path other than `/countdown` redirects to
  `/countdown`.
- While `now >= launch_at`, or when `launch_at` is unavailable: no lock at all.
- Unauthenticated users still reach `/login` first, from any path.
- `/countdown`, `/login` and `/auth/*` are never locked.
- The client-side auto-redirect in `CountdownTimer` is removed.

**Non-functional**

- No additional database round-trip beyond phase 01's — the lock and the post-login target need
  the same value; fetch it once per request that needs it.
- `proxy.ts` stays well under 200 lines (91 today).
- `e2e/auth-guard.spec.ts` stays GREEN ×6 unchanged.

## Architecture

```text
updateSession(request):
  supabaseResponse = NextResponse.next({ request })
  supabase = createServerClient(…)
  user = await supabase.auth.getUser()          ← nothing between these two, still
  pathname = request.nextUrl.pathname

  1. if (!user && !isPublicPath(pathname))            → /login       (unchanged)
  2. launchAt = needsLaunchAt(pathname) ? await getLaunchAt(supabase) : null
  3. if (user && pathname === "/login")                → beforeLaunch ? /countdown : /about
  4. if (user && beforeLaunch && !isPublicPath(pathname) && pathname !== "/countdown")
                                                       → /countdown   ← NEW
  5. return supabaseResponse
```

`needsLaunchAt(pathname)` is true for `/login` and for any protected path — i.e. everything the
matcher already reaches except `/auth/*`. Steps 3 and 4 share the one fetched value.

**State transition**

| now vs `launch_at` | authenticated? | requested path                             | outcome           |
| ------------------ | -------------- | ------------------------------------------ | ----------------- |
| before             | no             | anything protected                         | `/login`          |
| before             | yes            | `/about`, `/award-info`, `/sun-kudos`, `/` | `/countdown`      |
| before             | yes            | `/countdown`                               | renders           |
| before             | yes            | `/login`                                   | `/countdown`      |
| after / unknown    | yes            | anything                                   | renders (no lock) |

**Rollback path is the same branch.** Deleting step 4 restores today's behavior exactly; no data
or cookie migration is involved.

## Related Code Files

**Modify** — `lib/supabase/proxy.ts` (one branch + one predicate),
`components/countdown/countdown-timer.tsx` (remove the `useEffect` redirect, `useRouter` import
and the `expired` computation)
**Create** — assertions appended to `e2e/countdown.spec.ts` (phase 02's file), or a small
`e2e/prelaunch-lock.spec.ts` if that file is already at a comfortable size
**Read only** — `lib/event-settings.ts`, `e2e/auth-guard.spec.ts`

**Ownership warning.** `lib/supabase/proxy.ts` is shared with phase 01 — strictly sequential.
`countdown-timer.tsx` is likewise touched by phase 01. Neither file may be edited by two phases
at once.

## Implementation Steps

1. **Get the product answer first.** If the lock is not wanted, close this phase as
   _won't-do_ and record the decision in a `clarifications.md` in this folder so the next reader
   does not re-open it. Everything below assumes a "yes".
2. Write the failing e2e first: seed `launch_at = now() + 2 days`, then assert that an
   authenticated `goto("/about")` ends on `/countdown`. Record the RED (today it renders
   `/about`).
3. Add `needsLaunchAt()` and hoist the single `getLaunchAt` call so steps 3 and 4 share it.
4. Add branch 4, ordered after the `!user` branch and reusing `isPublicPath`.
5. Remove the client-side redirect from `CountdownTimer` (G5).
6. Re-run the seeded lock spec → GREEN. Re-run `auth-guard.spec.ts` → GREEN ×6. Re-run the whole
   countdown spec → GREEN.
7. Seed `launch_at` into the past and confirm every route renders normally again.

## Todo List

- [ ] Product decision recorded in `clarifications.md` before any code
- [ ] RED recorded: authenticated `/about` reaches `/about` while pre-launch
- [ ] Lock branch sits **after** the `!user` branch
- [ ] `isPublicPath` reused; no second path list
- [ ] `/countdown` exempt — no redirect loop
- [ ] `getLaunchAt` fetched once per request, shared by both branches
- [ ] Client-side auto-redirect removed from `CountdownTimer`
- [ ] `auth-guard.spec.ts` GREEN ×6
- [ ] Post-launch seed → no lock
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                                          | Method                                                              |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| SC-01 | Pre-launch, authenticated `/about` → `/countdown`                  | seeded e2e                                                          |
| SC-02 | Pre-launch, unauthenticated `/about` → `/login` (not `/countdown`) | seeded e2e — this is the ordering proof                             |
| SC-03 | Pre-launch `/countdown` renders                                    | seeded e2e, no redirect                                             |
| SC-04 | Post-launch, every protected route renders                         | seeded e2e                                                          |
| SC-05 | `launch_at` missing → no lock                                      | delete the row, hit `/about`                                        |
| SC-06 | One `event_settings` select per locked request, not two            | Supabase logs                                                       |
| SC-07 | No client-side redirect remains                                    | `grep -n "router" components/countdown/countdown-timer.tsx` → empty |

**Exact command:** `pnpm test:e2e e2e/countdown.spec.ts e2e/auth-guard.spec.ts`

## Risk Assessment

| Risk                                                                                         | Likelihood | Impact       | Countermeasure                                                                                               |
| -------------------------------------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| Infinite redirect loop if `/countdown` is not exempted                                       | Medium     | **Critical** | SC-03 asserts it directly; the exemption is written before the branch, not after                             |
| Lock ordered before the auth check, leaking `/countdown` to anonymous visitors               | Medium     | High         | SC-02 exists specifically to catch this ordering error                                                       |
| Implemented against a real prior decision to drop the lock                                   | **Medium** | High         | Step 1 is a hard gate; the phase does not start without an answer                                            |
| A stale `launch_at` locks the entire site indefinitely                                       | Low        | **Critical** | `null`/unavailable → no lock (SC-05); the row is the single lever and is documented in phase 01              |
| Second fetch added, doubling round-trips on locked requests                                  | Medium     | Low          | SC-06                                                                                                        |
| Users mid-session at the launch instant get bounced to `/countdown` on their next navigation | Low        | Low          | Accepted — the lock lifting is the desired transition; the countdown page is where they should be until then |

## Security Considerations

- This is a **UX lock, not an authorization boundary.** It hides pages that the user is otherwise
  entitled to see; it does not protect data. Anything genuinely sensitive must still be gated by
  RLS at the database, not by a proxy redirect. State this in the code comment so the next reader
  does not mistake it for access control.
- The lock never reads a client-supplied hint — the instant comes from the database only. No
  open-redirect surface is added.
- Redirects must keep using `redirectPreservingCookies`, or the new branch reintroduces the
  cookie-dropping random-logout defect the login plan fixed.

## Next Steps

Closes G2 and G5. With this landed the countdown gap list holds only P2 items (G4 SECONDS, G6
header) plus the open product questions in `plan.md`.

## Rollback

Delete branch 4 and restore the `useEffect` in `CountdownTimer`. No data change, no cookie
cleanup — the row is read-only throughout.
