---
title: "Three-screen gap closure — FAB, Thể lệ, Profile"
description: "Forge the unbuilt /profile route and close the real design gaps on the two already-shipped screens (FAB open state, Thể lệ rules drawer)."
status: in_progress
priority: P2
effort: 20h
branch: develop
tags: [profile, fab, rules-drawer, momorph, e2e, supabase, nextjs16]
created: 2026-09-07
work_type: feature
test_policy: mixed
spec_lang: en
screens: [Sv7DFwBw1h, b1Filzi9i6, 3FoIx6ALVb]
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Three-screen gap closure — Implementation Plan

**Orchestration only.** This plan owns no phase files of its own — it sequences phases that already
exist in three prior plans and records this session's decisions in
[`clarifications.md`](./clarifications.md). Nothing here is copied; DRY over duplication.

**Premise, corrected.** The request assumed all three screens were unbuilt. Two ship today. Only
`3FoIx6ALVb` Profile is genuinely absent. See `clarifications.md` → Premise correction.

## Tracks

| #   | Track                                                | Source plan                                                                                 | Phases forged                                                             | Policy            | Status                      |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------- | --------------------------- |
| A   | **Profile** — build `/profile` whole                 | [`../260906-1903-profile-and-menus/`](../260906-1903-profile-and-menus/plan.md)             | 01 ✅, 02 ✅, 03 ✅, 04 ✅, 05 ✅, 07 ✅ (**06 deferred — out of scope**) | `e2e-red-first`   | **DONE**                    |
| B   | **FAB gaps** — hover, menu semantics, mount coverage | [`../260716-0952-widgetbutton-open-state/`](../260716-0952-widgetbutton-open-state/plan.md) | 01 ✅ (+ mounts, `IconPen` extraction)                                    | `visual-contract` | **DONE**                    |
| C   | **Thể lệ gaps** — e2e gate + real icons              | [`../260709-1417-saa-rules-drawer/`](../260709-1417-saa-rules-drawer/plan.md)               | 01 ✅, 02 ✅ (G2 only; **G1 won't-do**)                                   | `e2e-red-first`   | **DONE** — 9 passed, exit 0 |

**Track C outcome:** G1 (disabled footer state) closed as **won't-do** — the chosen trigger proved
architecturally unreachable and the two tests written for it were invalid. G2 (real X + pen icons)
delivered. See `clarifications.md` → Thể lệ UPDATE.

**Incidental fix (orchestrator):** 6 board specs hardcoded a foreign Docker container name, failing
9 tests. Extracted `e2e/support/psql.ts` deriving it from `supabase/config.toml`. `chromium-authed`
went from 33 passed/9 failed → **42 passed, exit 0**.

Track A phase 06 (header dropdowns `z4sCl3_Qtk` / `54rekaCHG1`) is **not** forged — those screens
were not requested. Its gating questions stay open.

## File ownership (disjoint — the parallel-safety contract)

| Track | Owns                                                                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `app/profile/**`, `lib/profile/**`, `components/profile/**`, `e2e/profile-*.spec.ts`, `supabase/migrations/20260907*`, `supabase/seed.sql`, `e2e/support/**`, `playwright.config.ts`, `lib/i18n/locales/{vi,en}/profile.json`, `public/profile/**` |
| B     | `components/homepage/widget-button.tsx`, `components/common/icon-pen.tsx` (**new, extracted**), `app/award-info/page.tsx`, `app/sun-kudos/page.tsx`                                                                                                |
| C     | `components/homepage/saa-rules-drawer.tsx`, `e2e/rules-drawer.spec.ts`, `lib/i18n/locales/{vi,en}/rules.json`                                                                                                                                      |

**The one collision the source plans warned about, settled:** both retros wanted to touch
`widget-button.tsx` to share `IconPen`. **Track B owns it** and extracts `IconPen` into
`components/common/icon-pen.tsx`; Track C imports from there. So **B must land before C's phase 02**.

## Sequencing

```
Track A (long pole) ───────────────────────────────────────────►  01 → 02 → 03 → 04 → 05 → 07
Track B ──────► 01 (+mounts)
                    └──► Track C ──► 01 (RED) → 02 (disabled + icons)
```

A runs concurrently with B+C throughout — disjoint file sets. B→C is ordered only by the
`icon-pen.tsx` extraction. Track A is internally sequential: 02 is the data half of 03's RED.

## Decisions carried in (see `clarifications.md`)

- Footer disabled condition = **while a KUDOS submit is in flight** (user).
- FAB mounts on `/award-info` + `/sun-kudos`, false docblock fixed (user).
- Hero tiers derive at read time from **distinct senders**: 1–4 / 5–9 / 10–20 / >20 (evidence:
  the shipped rules drawer). Hoa-thi stars key on **total received** (10/20/50) — a different
  denominator, deliberately.
- Department renders from `hero_code`; **no `departments` table exists**, so DD-01 is not a dependency.
- shadcn baseline **is** restored → the direction dropdown uses `components/ui/dropdown-menu.tsx`.
- "danh sách thưởng" is **not** a missing section — the frame was read; the drawer matches it 1:1.

## Outcome (2026-09-07)

All three tracks delivered. `/profile` exists with both faces on real Supabase reads; the two
already-shipped screens had their real gaps closed. Phase 07's green gate is satisfied by the full
suite below; `SEC_003` (two concurrent sessions' Sent lists are disjoint) remains **not automated**
— it genuinely needs two live sessions and is listed as residual risk.

**Cold-mint verification:** `pnpm test:e2e` **96 passed, exit 0** · `pnpm lint` 0 · `pnpm typecheck`
0 · `pnpm build` 0 · prettier clean · no DB fixture residue.

Four defects were found and fixed en route that had nothing to do with the requested screens — a
foreign Docker container name breaking 9 board tests, a test asserting a fallback that only rendered
because an asset 404'd, a `JWT issued at future` flake root-caused to token `iat` granularity, and
two of my own (a lint error and a 200-line breach). Details in `clarifications.md`.

## Success criteria

1. `/profile` renders both faces (self / other) on real Supabase reads; `SEC_001..003` hold with two
   live sessions.
2. `pnpm test:e2e` GREEN, including the new `e2e/profile-*.spec.ts` and `e2e/rules-drawer.spec.ts`
   (9 Thể lệ cases; 30 Profile cases minus those needing two concurrent sessions).
3. `pnpm lint`, `pnpm typecheck`, `pnpm format:check` clean; `pnpm build` passes.
4. FAB shows hover treatment and appears on all three content pages.
5. No file exceeds the 200-line ceiling among files this batch creates.

## Risks

- **Local Supabase stack must be up** for the authed E2E project; with it down, `pnpm test:e2e` must
  fail loudly on `setup`, never silently skip Profile assertions.
- The definer view closes anonymity for `/profile` only; the base-table hole is a recorded separate
  item. Do not narrow `kudos` SELECT here — it would break the live board.
- Track C's phase 02 depends on Track B's icon extraction. If B slips, C's phase 01 still proceeds.
