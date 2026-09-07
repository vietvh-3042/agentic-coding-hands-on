---
title: "Countdown prelaunch page — retrospective + gap list"
description: "What /countdown actually ships today measured against MoMorph screen 8PJQswPZmU (5 spec rows, 17 test cases), including the confirmed hardcoded-launch-date defect."
status: pending
priority: P1
effort: 6h
branch: develop
tags: [retrospective, gap-analysis, countdown, supabase, e2e, momorph]
created: 2026-09-06
work_type: retrospective
test_policy: e2e-red-first
spec_lang: en
screen: 8PJQswPZmU
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Countdown — Prelaunch page (`/countdown`) — Retrospective Plan

**This screen is already built.** MoMorph ref:
<https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU> ·
[`data/8PJQswPZmU-specs.csv`](./data/8PJQswPZmU-specs.csv) (5 rows) ·
[`data/8PJQswPZmU-testcases.csv`](./data/8PJQswPZmU-testcases.csv) (17 cases).

## What was actually built

`app/countdown/page.tsx` (57) → full-bleed artwork + gradient scrim + `CountdownTimer`.
`components/countdown/countdown-timer.tsx` (72) → title + units. `countdown-digit-box.tsx` (32)
→ the DSEG7 LED box. `hooks/use-countdown.ts` (50) → the tick. `lib/countdown-config.ts` (30)
→ the target instant.

| Spec row       | Built as                                                              | Verdict                                            |
| -------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| 0.1 Background | `page.tsx` — `object-cover` artwork + the Figma gradient verbatim     | matches                                            |
| 0.2 Title      | i18n `countdown:title` — "Sự kiện sẽ bắt đầu sau" / "Event starts in" | matches                                            |
| 1 Days         | 2 digit boxes + "DAYS", `Math.min(99, …)`, zero-padded                | display matches; **source + lock do not** (G1, G2) |
| 2 Hours        | 2 boxes + "HOURS", derived `%86400/3600` so 00–23 holds structurally  | matches                                            |
| 3 Minutes      | 2 boxes + "MINUTES", derived `%3600/60` so 00–59 holds structurally   | matches                                            |

Verified **not** gaps: 2-digit zero padding (`padStart(2,"0")`), all-zero at or past target
(`diff <= 0 → ALL_ZERO`), out-of-range hours/minutes impossible by construction (they are
derived, never assigned), hydration-safe (`null` until mounted so SSR and first client render
agree), 1-second interval with cleanup.

## Gap list

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                      | Sev            | Fix direction                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| G1  | **Launch datetime is not read from the database.** `lib/countdown-config.ts:17` takes `NEXT_PUBLIC_LAUNCH_AT` or falls back to `Date.now() + 8_000`. `public.event_settings` exists (migration `20260714080000`, singleton `id=1`, RLS `select` for `anon`+`authenticated`) and holds `launch_at = 2026-07-21 02:00:00+00`. `grep` finds **no code reading it**. Spec row 1 says the target "lấy từ API" | **P0**         | [phase-01](./phase-01-launch-datetime-from-event-settings.md)                            |
| G2  | Spec row 1's `transitionNote` requires a navigation lock — before zero, navigation to other pages is blocked; at zero it unlocks. Nothing implements it; `proxy.ts` only special-cases `/login`, so `/about` is reachable pre-launch                                                                                                                                                                     | P1             | [phase-03](./phase-03-prelaunch-navigation-lock.md)                                      |
| G3  | Zero e2e coverage for 17 MoMorph test cases                                                                                                                                                                                                                                                                                                                                                              | P1             | [phase-02](./phase-02-countdown-e2e-red-gate.md)                                         |
| G4  | A **4th SECONDS unit** is rendered. The spec has exactly three units and every GUI test case names only DAYS/HOURS/MINUTES                                                                                                                                                                                                                                                                               | P2             | Product call — keep and amend the spec, or drop the unit and the `countdown:seconds` key |
| G5  | On reaching zero the timer does `router.replace("/about")`. The spec says _unlock navigation_, not _navigate_. Extra behavior nobody asked for                                                                                                                                                                                                                                                           | P2             | Fold into G2's decision — a lock that lifts makes the forced redirect redundant          |
| G6  | The page renders no `SiteHeader`, so `LanguageSelector` is unreachable while on `/countdown`; the i18n title (spec 0.2) can only be switched from another page                                                                                                                                                                                                                                           | P2 (inference) | Confirm intent — a full header may be deliberate prelaunch minimalism                    |
| G7  | `app/countdown/page.tsx:24` cites "plan clarifications" for having no guard and no lock. No `clarifications.md` exists in this folder                                                                                                                                                                                                                                                                    | P2             | Either recover the decision or treat G2 as genuinely open                                |

## Phases

| #   | Phase                                                                                      | Owns (files)                                                                                                                                            | Depends on                                                                                                | Effort | Status  |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ | ------- |
| 01  | [Launch datetime from `event_settings`](./phase-01-launch-datetime-from-event-settings.md) | `lib/countdown-config.ts`, `lib/event-settings.ts` (new), `app/countdown/page.tsx`, `components/countdown/countdown-timer.tsx`, `lib/supabase/proxy.ts` | —                                                                                                         | 2.5h   | pending |
| 02  | [Countdown e2e RED gate](./phase-02-countdown-e2e-red-gate.md)                             | `e2e/countdown.spec.ts`                                                                                                                                 | award-system [phase-01](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md) | 2h     | pending |
| 03  | [Prelaunch navigation lock](./phase-03-prelaunch-navigation-lock.md)                       | `lib/supabase/proxy.ts`                                                                                                                                 | 01, 02                                                                                                    | 1.5h   | pending |

**Not parallelisable.** Phases 01 and 03 both own `lib/supabase/proxy.ts` — 01 changes
`isBeforeLaunch()`'s signature, 03 adds a branch that calls it. They must run in order, and
phase 03 must not start until 01's proxy edit has landed.

The authenticated storage-state fixture is a **shared prerequisite** documented once, in the
[award-system folder](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md).
It is not restated here.

## Unresolved questions

1. **G4** — is the SECONDS unit wanted? It is in the code and absent from the design.
2. **G2/G5/G7** — was "no navigation lock" a real product decision, or drift? The lock is the
   single largest behavioral item in this screen's spec.
3. Who may write `event_settings.launch_at`? RLS grants `select` to everyone and no write policy
   exists at all, so today the row is effectively immutable outside the service role.

---

## Addendum 2026-09-06 — three competing event dates (verified live)

The retro gap list asked "which event datetime is authoritative among the three found." The
rebuild-spec Core pass independently found the same conflict from a different angle, so it is now
confirmed rather than suspected. All three values are live **simultaneously**:

| Source                                      | Value                       | Consumed by                                                        |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `event_settings.launch_at` (DB column)      | `2026-07-21 02:00:00+00`    | **nothing** — no TypeScript reads it                               |
| `NEXT_PUBLIC_LAUNCH_AT` (env, `.env.local`) | `2026-12-31T18:00:00+07:00` | `/countdown` via `lib/countdown-config.ts`                         |
| `EVENT_DATE` (hardcoded)                    | `2026-12-26T18:30:00+07:00` | `/about` hero widget, `components/homepage/hero-info-block.tsx:11` |

**User-visible today:** `/countdown` and `/about` display event dates five days apart.

Two further defects found in the same place:

- `lib/countdown-config.ts:17` — `process.env.NEXT_PUBLIC_LAUNCH_AT ?? new Date(Date.now() + 8_000)`.
  Any deployment without that env var renders a countdown that **expires 8 seconds after load**.
  A fallback that silently produces plausible-but-wrong output is worse than a hard failure here.
- `hero-info-block.tsx:11` — the code says `2026-12-26`, its own comment cites the Figma spec as
  `26/12/2025`. Code and design disagree by a year; which is right is unknown.

**Unresolved — needs a product decision, deliberately NOT decided here.** Which of the three is
authoritative? The likely correct shape is a single source (`event_settings.launch_at`, already
present, RLS read-only, and tamper-resistant) read server-side, with the env var and the hardcoded
constant both retired. That is a behaviour change on two shipped screens, so it needs sign-off,
not an implementer's judgement.
