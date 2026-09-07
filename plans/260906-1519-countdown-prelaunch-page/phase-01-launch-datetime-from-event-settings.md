# Phase 01 — Launch datetime from `event_settings` (G1)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table
- Spec row 1 (`databaseNote`: "TODO: thiết kế API endpoint để lấy target datetime"):
  [`data/8PJQswPZmU-specs.csv`](./data/8PJQswPZmU-specs.csv)
- Table of record: `supabase/migrations/20260714080000_event_settings.sql`
- Current consumer of `isBeforeLaunch()`: `lib/supabase/proxy.ts:3,84`

## Overview

**Priority:** P0
**Status:** pending
**Effort:** 2.5h
**Depends on:** nothing
**Resolved `test_policy`:** `e2e-red-first` — this screen has 17 real MoMorph test cases and this
phase changes behavior (where the target instant comes from, and therefore what the screen
displays). Coordinate with [phase-02](./phase-02-countdown-e2e-red-gate.md): its data-source
assertion is this phase's RED.

The countdown's target instant is a hardcoded config value. The database already holds the real
one and nothing reads it.

## Key Insights (all verified, not assumed)

- **The current source.** `lib/countdown-config.ts:17-19`:
  `process.env.NEXT_PUBLIC_LAUNCH_AT ?? new Date(Date.now() + 8_000).toISOString()`. With the
  env var unset — as it is in this tree — the page counts down **eight seconds from module
  load** and then redirects. That is a development convenience the file's own TODO admits, still
  shipping.
- **The table is real and readable.** `\d public.event_settings` shows `id integer` with
  `check (id = 1)`, `launch_at timestamptz not null`, `updated_at timestamptz not null`, and one
  policy: `"event_settings readable by all" FOR SELECT TO anon, authenticated USING (true)`.
  The live row is `(1, 2026-07-21 02:00:00+00, …)`. `grep -rn "event_settings" --include="*.ts*"`
  returns **nothing** outside the migration.
- **`launch_at` is `timestamptz`.** It is an absolute instant, already UTC-normalized. The spec's
  Asia/Ho_Chi_Minh (UTC+7) requirement is satisfied by the offset the value carries — do **not**
  add manual timezone arithmetic on top. `new Date(row.launch_at)` is correct as-is.
- **The blast radius is the proxy, not the page.** `isBeforeLaunch()` is imported by
  `lib/supabase/proxy.ts` and decides the post-login landing route (`:84`). Making it read the
  database makes it `async`, and it is called inside `updateSession` on **every** proxied
  request. That is the real design problem in this phase, not the fetch itself.
- **Only one call site needs the value.** `proxy.ts:84` runs the branch solely when
  `pathname === "/login"`. Fetch lazily inside that branch; do not hoist it to the top of
  `updateSession` where it would add a round-trip to every page load.
- **Second-order consequence, must be surfaced before merging.** Today's row is
  `2026-07-21`, already in the past. The moment this phase lands, `isBeforeLaunch()` becomes
  **false** and `/countdown` renders `00 00 00` permanently. That is arguably _correct_ — the
  event has started — but it will look like a regression to anyone who expects a live counter.
  The fix is to update the row, not the code.
- **The page is a Server Component.** `app/countdown/page.tsx` has no `"use client"`, so it can
  `await` the row and hand it down as a prop. `CountdownTimer` stays a client component and keeps
  owning the tick. This avoids exposing another `NEXT_PUBLIC_*` and keeps `useCountdown`'s
  signature (`iso: string`) unchanged.

## Requirements

**Functional**

- The countdown target is `public.event_settings.launch_at` for `id = 1`.
- `NEXT_PUBLIC_LAUNCH_AT` and the `now + 8s` fallback are removed.
- A missing row or a failed query is treated as **already launched** — never trap a user on a
  countdown the system cannot substantiate (this preserves `isBeforeLaunch()`'s documented
  behavior for an unparseable value).
- `proxy.ts`'s post-login branch keeps working and still returns `/countdown` or `/about`.

**Non-functional**

- No added database round-trip on requests that do not need the value.
- Every touched file stays under 200 lines (largest is 72 today).
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` exit 0.

## Architecture

```text
lib/event-settings.ts                     (new, ~30 lines)
  export async function getLaunchAt(supabase): Promise<Date | null>
      .from("event_settings").select("launch_at").eq("id", 1).single()
      → null on error or no row  (caller treats null as "already launched")

app/countdown/page.tsx        (Server Component)
  const supabase = await createClient()          // lib/supabase/server.ts
  const launchAt = await getLaunchAt(supabase)
  <CountdownTimer launchAt={launchAt?.toISOString() ?? null} />

components/countdown/countdown-timer.tsx  ("use client")
  props: { launchAt: string | null }
  useCountdown(launchAt)        ← hook now accepts null → all zeros, no interval

lib/supabase/proxy.ts
  if (user && pathname === "/login") {
    const launchAt = await getLaunchAt(supabase)      // ← fetched ONLY in this branch
    const target = launchAt && Date.now() < launchAt.getTime() ? "/countdown" : "/about"
    …
  }

lib/countdown-config.ts        → DELETED (both exports move or disappear)
```

**Data flow**

| In                                       | Transform                                         | Out                        |
| ---------------------------------------- | ------------------------------------------------- | -------------------------- |
| `event_settings.launch_at` (timestamptz) | PostgREST → ISO 8601 string with offset           | `Date`                     |
| `Date` \| `null`                         | ISO string prop across the server/client boundary | `useCountdown(iso)`        |
| target ms − `Date.now()`                 | `computeParts` (unchanged)                        | days/hours/minutes/seconds |
| target ms vs now, at `/login` only       | comparison in `proxy.ts`                          | `/countdown` \| `/about`   |

**Compatibility.** `useCountdown` must accept `string | null`. Widening it (return `ALL_ZERO`
and start no interval when `null`) is backward-compatible with its only other behavior. No other
caller exists — `grep -rn "useCountdown"` returns just `countdown-timer.tsx`.

## Related Code Files

**Create** — `lib/event-settings.ts`
**Modify** — `app/countdown/page.tsx`, `components/countdown/countdown-timer.tsx`,
`hooks/use-countdown.ts` (widen the parameter), `lib/supabase/proxy.ts`
**Delete** — `lib/countdown-config.ts`
**Read only** — `lib/supabase/server.ts`, `supabase/migrations/20260714080000_event_settings.sql`

**Ownership warning.** `lib/supabase/proxy.ts` is also owned by
[phase-03](./phase-03-prelaunch-navigation-lock.md). These two phases must not run concurrently.
`components/homepage/hero-info-block.tsx` carries a _third_ hardcoded event date and is owned by
the [homepage retro](../260706-1533-homepage-saa/plan.md) — do not touch it here.

## Implementation Steps

1. Write `lib/event-settings.ts` with `getLaunchAt(supabase)`. Swallow the error into `null` and
   comment why (a countdown that cannot prove itself must not block the product).
2. Widen `useCountdown(iso: string | null)`: on `null`, set `ALL_ZERO` and register no interval.
3. Convert `app/countdown/page.tsx` to `async`, fetch the row, pass the ISO string down.
4. Add the `launchAt` prop to `CountdownTimer` and drop the `LAUNCH_AT` import.
5. Update `lib/supabase/proxy.ts:83-85` to fetch lazily inside the `/login` branch. **Keep the
   "nothing between `createServerClient()` and `getUser()`" rule intact** — the new fetch goes
   _after_ `getUser()`, never between them.
6. Delete `lib/countdown-config.ts`. `grep -rn "countdown-config\|LAUNCH_AT"` must come back
   empty except in plan documents.
7. `pnpm typecheck && pnpm lint && pnpm build`.
8. Manually verify both branches by moving the row:
   `docker exec supabase_db_mock-aidd-kudo-app psql -U postgres -d postgres -c "update public.event_settings set launch_at = now() + interval '2 days' where id = 1;"`
   → `/countdown` shows a live counter and `/login` bounces an authenticated user to
   `/countdown`. Then set it to `now() - interval '1 day'` and confirm `/about`.
9. Restore the row to its intended production value and record what that value is.

## Todo List

- [ ] `lib/event-settings.ts` created; error path returns `null` with a stated reason
- [ ] `useCountdown` accepts `null` and starts no interval
- [ ] `app/countdown/page.tsx` is a Server Component fetching the row
- [ ] `CountdownTimer` takes `launchAt` as a prop
- [ ] `proxy.ts` fetches **only** inside the `/login` branch, after `getUser()`
- [ ] `lib/countdown-config.ts` deleted; grep for `LAUNCH_AT` clean
- [ ] Both routing branches verified by moving the row
- [ ] The past-dated live row (`2026-07-21`) explicitly re-decided, not left by accident
- [ ] `pnpm format:check && lint && typecheck && build` exit 0
- [ ] `e2e/auth-guard.spec.ts` still GREEN ×6

## Success Criteria

| ID    | Criterion                               | Method                                                                                |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| SC-01 | No env var or literal drives the target | `grep -rn "NEXT_PUBLIC_LAUNCH_AT\|countdown-config" app components lib hooks` → empty |
| SC-02 | The row drives the display              | set `launch_at = now() + 2 days`, load `/countdown`, expect ~`02 00 00`               |
| SC-03 | The row drives post-login routing       | authenticated `/login` → `/countdown` while future, `/about` while past               |
| SC-04 | No extra round-trip on ordinary pages   | Supabase logs show no `event_settings` select for a `/about` request                  |
| SC-05 | Missing row degrades safely             | `delete from event_settings` → `/countdown` shows `00`s, `/login` → `/about`, no 500  |
| SC-06 | Guard unbroken                          | `pnpm test:e2e e2e/auth-guard.spec.ts` GREEN ×6                                       |

## Risk Assessment

| Risk                                                                                                                          | Likelihood          | Impact       | Countermeasure                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| A fetch added between `createServerClient()` and `getUser()` reintroduces the random-logout footgun the login plan documented | Medium              | **Critical** | Step 5 states the ordering; SC-06 catches the gross case; reviewer inspects that exact block first         |
| A per-request `event_settings` select on every proxied route                                                                  | **High** if hoisted | High         | Lazy fetch inside the `/login` branch only; SC-04 proves it                                                |
| Countdown silently shows `00 00 00` after merge because the row is past-dated                                                 | **High**            | Medium       | Called out in Key Insights; step 9 and the todo force an explicit decision on the row's value              |
| A Supabase outage traps users on a countdown                                                                                  | Low                 | High         | `null` → treated as launched; SC-05 asserts it                                                             |
| Deleting `countdown-config.ts` breaks an unseen importer                                                                      | Low                 | Medium       | `grep` shows exactly two importers (`proxy.ts`, `countdown-timer.tsx`), both handled here; SC-01 re-checks |
| `hero-info-block.tsx`'s own hardcoded date is "fixed" opportunistically here                                                  | Medium              | Medium       | Explicitly out of scope — different owner, different plan folder                                           |

## Security Considerations

- Reads only. `event_settings` RLS already grants `select` to `anon` and `authenticated`, so the
  anon key suffices — **no service-role key belongs anywhere in this phase.**
- The table has **no write policy at all**. Nothing here adds one; if a launch-date admin UI is
  ever wanted, that is separate work with its own authorization design.
- `launch_at` is not user-controlled input, but it still crosses the server/client boundary as a
  string and is parsed with `new Date()`. An unparseable value yields `NaN`, which
  `computeParts`'s `Number.isFinite(diff)` guard already handles.

## Next Steps

Unblocks [phase-03](./phase-03-prelaunch-navigation-lock.md), which needs a trustworthy launch
instant before it can lock anything. Report the chosen production `launch_at` value to the
homepage retro, whose G2 concerns the same instant.

## Rollback

`git revert` the phase. `lib/countdown-config.ts` returns and the proxy branch goes back to a
synchronous call. **No database change is required to roll back** — the table is only read, never
written, so the row can stay exactly as it is.
