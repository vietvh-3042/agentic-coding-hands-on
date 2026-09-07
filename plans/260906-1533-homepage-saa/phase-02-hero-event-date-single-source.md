# Phase 02 — Hero event date, single source (G2, G5)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table
- Defect site: `components/homepage/hero-info-block.tsx:11`
- The canonical source this phase consumes:
  [`../260708-1519-countdown-prelaunch-page/phase-01-launch-datetime-from-event-settings.md`](../260708-1519-countdown-prelaunch-page/phase-01-launch-datetime-from-event-settings.md)
- Table of record: `supabase/migrations/20260714080000_event_settings.sql`

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 2h
**Depends on:** the countdown retro's phase 01 (hard — `lib/event-settings.ts` must exist first)
**Resolved `test_policy`:** `visual-contract` — no MoMorph screen or test cases exist for this
homepage. No RED/TDD claim is made. Verification is by seeded manual checks.

One event, three answers. This phase makes the hero read the same instant everything else does.

## Key Insights

- **The three sources, all verified by reading:**

  | Where                             | Value                                   | Kind                      |
  | --------------------------------- | --------------------------------------- | ------------------------- |
  | `hero-info-block.tsx:11`          | `new Date("2026-12-26T18:30:00+07:00")` | module-level literal      |
  | `lib/countdown-config.ts:17`      | `NEXT_PUBLIC_LAUNCH_AT` ?? `now + 8s`   | env / fallback            |
  | `public.event_settings.launch_at` | `2026-07-21 02:00:00+00`                | database, read by nothing |

  They disagree by five months. Whichever is right, at most one of them is.

- **They may legitimately be two different events.** The hero literal is commented _"Figma
  'mms_B1.3_Countdown' (26/12/2025, 18:30 ICT)"_ — a gala date — while `event_settings.launch_at`
  gates _site launch_. If those are genuinely distinct, the answer is **two columns on one row**,
  not one value shared. **Settle this before writing code** (see the plan's unresolved question
  4); do not collapse two real concepts into one just to satisfy DRY.
- The literal's comment says _26/12/2025_ while the code says _2026_-12-26. Already drifted from
  its own annotation — evidence that a literal here does not stay true.
- **The hero countdown is a genuinely good implementation.** `useSyncExternalStore` with a stable
  `INITIAL_STATE` snapshot gives a clean SSR/hydration story, and the "coming soon" state is
  handled. This phase changes only _where the target comes from_, and must not regress that.
- **`hero-info-block.tsx` is 201 lines** — one over the ceiling. Extracting the store into
  `hooks/use-event-countdown.ts` fixes G5 and is the natural shape once the target arrives as a
  prop rather than a module constant. Two birds, one edit — but the extraction is a pure move,
  with no logic change, so it stays reviewable.
- **The hero is inside a client component tree.** `hero-section.tsx` is `"use client"`, so
  `HeroInfoBlock` cannot fetch on the server itself. The instant must be fetched in
  `app/about/page.tsx` (a Server Component) and threaded down as a prop. That means
  `hero-section.tsx` gains a pass-through prop — a small ripple worth naming up front.

## Requirements

**Functional**

- The hero countdown targets the same instant as the rest of the app, obtained via
  `lib/event-settings.ts`.
- No event datetime literal remains in `components/`.
- Missing/unavailable instant → the existing "coming soon" state, never a crash and never `NaN`.
- The SSR/hydration behavior is preserved exactly.

**Non-functional**

- `hero-info-block.tsx` drops below 200 lines.
- The extracted hook is a pure move — no behavior change in the same commit.
- One `event_settings` read per `/about` request, not one per component.

## Architecture

```text
app/about/page.tsx                    (Server Component)
  const supabase = await createClient()
  const launchAt = await getLaunchAt(supabase)          // lib/event-settings.ts (countdown p01)
  <HeroSection launchAt={launchAt?.toISOString() ?? null} />
       └─ HeroInfoBlock launchAt={…}
              └─ useEventCountdown(launchAt)            // hooks/use-event-countdown.ts (moved)

hooks/use-event-countdown.ts          (extracted verbatim from hero-info-block.tsx)
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  target === null → INITIAL_STATE (coming soon), no subscription
```

**Data flow**

| In                         | Transform                          | Out                               |
| -------------------------- | ---------------------------------- | --------------------------------- |
| `event_settings.launch_at` | `getLaunchAt` → `Date` \| `null`   | ISO string prop                   |
| ISO string \| `null`       | `useEventCountdown` external store | `{ countdown[], showComingSoon }` |
| `{days,hours,minutes}`     | `pad2` (unchanged)                 | three 2-digit unit boxes          |

**Compatibility.** `HeroSection` gains one optional-shaped prop. It has exactly one caller
(`app/about/page.tsx`); `grep -rn "HeroSection" app components` confirms it. `HeroInfoBlock`
likewise has one caller. No public contract is broken.

## Related Code Files

**Create** — `hooks/use-event-countdown.ts`
**Modify** — `components/homepage/hero-info-block.tsx`, `components/homepage/hero-section.tsx`
(pass-through prop), `app/about/page.tsx` (fetch + prop)
**Read only** — `lib/event-settings.ts`, `lib/supabase/server.ts`

**Ownership.** No overlap with phase 01 (`user-menu.tsx`) or phase 03
(`notification-menu.tsx` + `user-menu.tsx`). Runs in parallel with phase 01 safely.
`lib/countdown-config.ts` and `lib/supabase/proxy.ts` belong to the countdown retro — **not
touched here**.

## Implementation Steps

1. **Wait for the product answer** on one instant vs two (gala date vs launch date). If two, this
   phase's target is a new `event_settings` column and the migration is scoped here, not assumed.
   Everything below assumes one shared instant.
2. Confirm `lib/event-settings.ts` exists and exports `getLaunchAt`. If not, stop — the
   dependency has not landed.
3. Extract the store into `hooks/use-event-countdown.ts` as a **pure move**, target still the
   literal. Verify the page renders identically. Commit this separately so the move is reviewable
   on its own.
4. Change the hook to accept `string | null`; on `null` return `INITIAL_STATE` and subscribe to
   nothing.
5. Thread the prop: `app/about/page.tsx` → `HeroSection` → `HeroInfoBlock`. Delete the literal.
6. `grep -rn "2026-12-26\|EVENT_DATE" components app` → empty.
7. `wc -l components/homepage/hero-info-block.tsx` → under 200.
8. Verify by seeding the row (see Success Criteria).

## Todo List

- [ ] One-instant-vs-two answered before any edit
- [ ] `lib/event-settings.ts` confirmed present
- [ ] Store extracted as a pure move, in its own commit
- [ ] Hook accepts `null` → "coming soon", no subscription
- [ ] Prop threaded through `HeroSection`
- [ ] Literal deleted; grep clean
- [ ] `hero-info-block.tsx` under 200 lines
- [ ] SSR/hydration unchanged — no console hydration warning on `/about`
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                          | Method                                                                                          |
| ----- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| SC-01 | No event literal in `components/`                  | `grep -rn "2026-12-26\|EVENT_DATE" components app` → empty                                      |
| SC-02 | The row drives the hero                            | `update event_settings set launch_at = now() + interval '3 days 04:05'` → hero shows `03 04 0x` |
| SC-03 | Past instant → "coming soon" hidden, units at `00` | seed `now() - interval '1 day'`                                                                 |
| SC-04 | Row deleted → "coming soon", no crash              | `delete from event_settings`, load `/about`                                                     |
| SC-05 | No hydration warning                               | DevTools console on a fresh `/about` load                                                       |
| SC-06 | File size                                          | `wc -l components/homepage/hero-info-block.tsx` < 200                                           |
| SC-07 | One read per request                               | Supabase logs for a single `/about` load                                                        |

## Risk Assessment

| Risk                                                                            | Likelihood | Impact | Countermeasure                                                                               |
| ------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| Two distinct real dates collapsed into one for the sake of DRY                  | **Medium** | High   | Step 1 is a hard gate; the alternative (a second column) is named rather than hand-waved     |
| Hydration mismatch introduced while changing the store's input                  | Medium     | High   | Extraction is a pure move first (step 3, separate commit); SC-05 checks the console          |
| `null` target produces `NaN` digits instead of "coming soon"                    | Medium     | Medium | Step 4 short-circuits before any arithmetic; SC-04                                           |
| The dependency has not landed and a local `getLaunchAt` is written here instead | Medium     | High   | Step 2 stops the phase; a duplicate fetch helper would recreate the very problem being fixed |
| The pass-through prop pushes `hero-section.tsx` toward a prop-drilling habit    | Low        | Low    | One prop, one level. If a second consumer appears, revisit — not before (YAGNI)              |

## Security Considerations

- Read-only, and the value is public information (an event date). `event_settings` RLS already
  permits `select` to `anon`; the anon key suffices and no service-role key is involved.
- The instant crosses the server/client boundary as a string and is parsed with `new Date()`; the
  `null` and non-finite paths must both be handled (steps 4 and SC-04).
- If step 1 concludes a new column is needed, that migration must carry its own RLS review — a
  new column on a table with a permissive `select` policy is exposed by default.

## Next Steps

Closes G2 and G5. Report the resolved instant back to the countdown retro so both screens agree
on the same production value.

## Rollback

Revert the prop threading and restore the literal; the extracted hook can stay (it is behavior-
neutral). Because step 3 is a separate commit, the risky half can be reverted without losing the
size fix.
