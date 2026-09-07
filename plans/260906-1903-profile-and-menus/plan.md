---
title: "Batch B — Profile page and the header profile/admin menus"
description: "Build the unbuilt /profile route (self + other faces, real Supabase data) and turn the presentational header menu into a server-gated Dropdown-profile / Dropdown-profile Admin."
status: in_progress
priority: P2
effort: 21h
branch: develop
tags: [profile, rbac, supabase, nextjs16, e2e, i18n, batch-b]
created: 2026-09-06
work_type: feature
test_policy: mixed
spec_lang: en
---

# Batch B — Profile & Menus — Implementation Plan

Screens (fileKey `9ypp4enmFmdK3YAFJLIu6C`):
[`3FoIx6ALVb` Profile bản thân](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb) ·
[`z4sCl3_Qtk` Dropdown-profile](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/z4sCl3_Qtk) ·
[`54rekaCHG1` Dropdown-profile Admin](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/54rekaCHG1).
Data: [`data/`](./data/) · decisions: [`clarifications.md`](./clarifications.md) · sibling:
[`../260713-1552-dropdown-department/plan.md`](../260713-1552-dropdown-department/plan.md).

**Goal.** `/profile` does not exist today — build it whole: one route, two faces (self / another
Sunner), real Supabase reads. Then replace the presentational `user-menu.tsx` (three hardcoded
items, no auth) with the two designed dropdowns, the Admin variant gated **server-side** on
`profiles.role`.

## Test policy per screen

| Screen                              | Cases | Policy                                                                                                                          |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `3FoIx6ALVb` Profile                | 30    | **`e2e-red-first`** — runner exists (`@playwright/test`, `e2e/`, `pnpm test:e2e`)                                               |
| `z4sCl3_Qtk` Dropdown-profile       | **0** | **`visual-contract`** — no RED/TDD claimed, none fabricated                                                                     |
| `54rekaCHG1` Dropdown-profile Admin | **0** | **`visual-contract`** — a behavioral gate is arguably warranted; raised as [Q9](./clarifications.md), **not** silently upgraded |

## Phases

| #   | Phase                                                                          | Owns (files)                                                                                                                                                                              | Depends on         | Effort | Status       |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------ | ------------ |
| 01  | [E2E identity fixtures + seed users](./phase-01-e2e-identity-fixtures.md)      | `e2e/auth.setup.ts`, `e2e/fixtures/**`, `playwright.config.ts`, `supabase/seed.sql`, `.gitignore`                                                                                         | —                  | 2.5h   | completed    |
| 02  | [Profile read layer + anonymity boundary](./phase-02-profile-read-layer.md)    | `lib/profile/**`, `supabase/migrations/20260907*_profile_read_layer.sql`                                                                                                                  | A-p0, DD-01        | 4h     | completed    |
| 03  | [Route shell, hero, badge collection](./phase-03-route-shell-hero-badges.md)   | `app/profile/page.tsx`, `components/profile/profile-hero.tsx`, `components/profile/profile-badge-collection.tsx`, `lib/i18n/**`, `e2e/profile-access.spec.ts`, `e2e/profile-hero.spec.ts` | 01, 02             | 4h     | completed    |
| 04  | [The two faces — stats card vs write bar](./phase-04-two-faces-stats-write.md) | `components/profile/profile-stats-card.tsx`, `components/profile/profile-write-bar.tsx`, `e2e/profile-two-faces.spec.ts`                                                                  | 03, A-F003         | 3h     | completed    |
| 05  | [KUDOS section — direction, feed, paging](./phase-05-kudos-section.md)         | `components/profile/profile-kudos-section.tsx`, `components/profile/profile-direction-dropdown.tsx`, `components/profile/profile-feed.tsx`, `e2e/profile-kudos-section.spec.ts`           | 04, A-F002, A-F004 | 4.5h   | completed    |
| 06  | [Header menus + server-side admin gate](./phase-06-header-menus-admin-gate.md) | `components/homepage/site-header.tsx`, `components/homepage/user-menu.tsx`, `lib/auth/current-profile.ts`, `app/admin/**`, `lib/i18n/locales/{vi,en}/common.json`                         | 03, A-p0           | 2.5h   | **deferred** |
| 07  | [GREEN gate + verification](./phase-07-green-gate-verification.md)             | `e2e/**` (re-run only), `plans/reports/`                                                                                                                                                  | 03–06              | 0.5h   | completed    |

**Parallel window:** 06 may run concurrently with 04+05 once 03 lands — disjoint sets,
`components/profile/**` vs `components/homepage/**`. Everything else is sequential. 02 must not
start before Batch A phase 0 is applied to the live DB.

## Cross-batch dependencies (Batch A — do NOT re-plan here)

| Ref        | Batch A item                                                                                                    | Why Batch B blocks on it                                                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **A-p0**   | `profiles` column-level GRANT hardening (`REVOKE UPDATE … ; GRANT UPDATE (display_name, avatar_url, language)`) | The admin menu is only a gate if `role` is not self-writable. Verified **still unapplied** on the live DB 2026-09-06                        |
| **A-F002** | Board mapper, card, keyset cursor                                                                               | Phase 05 reuses verbatim; GUI_006 requires an identical card                                                                                |
| **A-F003** | `KudosFormModal` recipient prop                                                                                 | Phase 04's write bar pre-fills the recipient (FUN_007)                                                                                      |
| **A-F004** | `heartKudo` server action                                                                                       | Phase 05's cards heart through it unchanged (FUN_014)                                                                                       |
| **A-F005** | Hashtag chip → board filter                                                                                     | FUN_015 navigates out to the filtered board                                                                                                 |
| **A-F006** | Secret-box reveal + `user_icon_unlocks` write path                                                              | Decides whether badge slots ever light up ([Q4](./clarifications.md))                                                                       |
| **DD-01**  | `departments` + `profiles.department_id`                                                                        | Owned by [dropdown-department phase 01](../260713-1552-dropdown-department/phase-01-departments-schema.md); the hero renders the department |

## Test matrix

| Level               | Covers                                                                  | Where                                      |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| E2E `e2e-red-first` | ACC 001–002, FUN 001–015, SEC 001–002, GUI 001–009 (automatable subset) | `e2e/profile-*.spec.ts`, project `profile` |
| SQL assertion       | GRANT/RLS of the new view; `role` non-writability re-check              | phases 02, 06                              |
| Static + manual     | `pnpm validate`; GUI 001/006/008 sweep; SEC_003 two live sessions       | phase 07                                   |

No unit-test runner exists and none is introduced (YAGNI).

## Known scope boundaries

- **The `e2e-red-first` suite requires local Supabase running.** The login batch kept `pnpm test:e2e`
  Docker-free; an authenticated storage state cannot be. Phase 01 isolates it in a separate
  Playwright project so the existing three specs stay Docker-free.
- **SEC_003** (two concurrent sessions) is manual — the limitation the login plan hit on SC-002.
- **The 30 test cases name a repo that does not exist**: `/kudos` (the route is `/sun-kudos`),
  `app/kudos/use-board-interactions.ts` (absent), `PUBLIC_ROUTES in proxy.ts` (it is `isPublicPath()`
  in `lib/supabase/proxy.ts`). Every phase maps them onto the real tree.

## Out of scope

Board data, authoring, hashtag taxonomy, hearts, secret-box reveal (all Batch A) · the `departments`
migration (dropdown-department phase 01) · profile **editing** of any kind (SEC_004 forbids it; A-p0
narrows writable columns to three) · the Admin Dashboard's content ([Q7](./clarifications.md)).

## Phase 06 — Deferred

**Status:** Phase 06 (header dropdowns `z4sCl3_Qtk` / `54rekaCHG1`) is **not forged** this session —
those screens were not requested. Its gating questions (Q7/Q8/Q9) remain open. See session plan
[`../260907-1402-three-screen-gap-closure/plan.md`](../260907-1402-three-screen-gap-closure/plan.md).

**CRITICAL:** Phase 06's planning doc assumes `e2e/.auth/user.json` is the **ordinary** identity and
`admin.json` the admin fixture. The delivered reality is **opposite**: `e2e/.auth/user.json` is the
**admin/demo-user** state (used by `e2e/board/**` specs), and the ordinary fixture is the separately
named `e2e/.auth/ordinary-user.json`. Renaming would break the passing board suite (deliberately not
renamed). Whoever forges phase 06 must either (a) use `ordinary-user.json` in that phase's assertions
or (b) update phase 06's planning doc first. Recorded in session plan
[`../260907-1402-three-screen-gap-closure/clarifications.md`](../260907-1402-three-screen-gap-closure/clarifications.md#batch-a-reuse-contract) at 4b.
