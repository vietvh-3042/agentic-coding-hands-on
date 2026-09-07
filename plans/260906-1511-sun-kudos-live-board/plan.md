---
title: "Batch A — Kudos data layer (F002–F006 + security hardening + seed)"
description: "Replace the four kudos mock-data modules with real Supabase reads and writes, add the hashtag taxonomy, hearts, and secret-box reveal, on top of a profiles privilege-escalation fix."
status: completed
priority: P1
effort: 16.5h
branch: develop
tags: [supabase, rls, security, kudos, hashtags, e2e, nextjs16]
created: 2026-09-06
work_type: feature
spec: plans/260710-1511-sun-kudos-live-board/spec/
test_policy: e2e-red-first
spec_lang: en
---

# Batch A — Kudos Data Layer

Decisions of record: [`clarifications.md`](./clarifications.md) · features
[`spec/feature-list.md`](./spec/feature-list.md) (F002–F006) · evidence
[`reports/security-260906-1740-profiles-privilege-escalation.md`](./reports/security-260906-1740-profiles-privilege-escalation.md) ·
[`reports/researcher-260906-1732-kudos-data-layer.md`](./reports/researcher-260906-1732-kudos-data-layer.md).

**Goal.** `/sun-kudos` stops rendering `feed-mock-data.ts`, `highlight-mock-data.ts`,
`spotlight-mock-data.ts`, `kudos-mock-data.ts` and starts rendering real rows; kudo authoring,
hearting, hashtag filtering and the secret-box reveal become real writes — on a schema whose
privileged columns a user can no longer write.

## Phases

| #   | Phase                                                                                              | Owns (files)                                                                                                                                                                                                                                                                                                                          | Depends on | Policy               | Effort | Status    |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------- | ------ | --------- |
| 01  | [Profiles column privileges (security)](./phase-01-security-profiles-column-privileges.md)         | `supabase/migrations/20260906*_profiles_column_privileges.sql`, `supabase/tests/privileges.sql`                                                                                                                                                                                                                                       | —          | sql-assert-red-first | 1h     | completed |
| 02  | [Toolchain foundation + authenticated E2E harness](./phase-02-foundation-ui-types-e2e-harness.md)  | `lib/utils.ts`, `components/ui/**`, `lib/supabase/database.types.ts`, `e2e/support/**`, `playwright.config.ts`, `package.json`                                                                                                                                                                                                        | 01         | infrastructure       | 1.5h   | completed |
| 03  | [Schema migrations — hashtags, stats view, special day, box draw](./phase-03-schema-migrations.md) | `supabase/migrations/20260906*_{kudo_hashtags,profile_stats_view,heart_multiplier,secret_box_draw}.sql`                                                                                                                                                                                                                               | 01         | sql-assert-red-first | 2h     | completed |
| 04  | [Seed data — 15 profiles / 40 kudos / hearts / tags](./phase-04-seed-data.md)                      | `supabase/seed.sql`                                                                                                                                                                                                                                                                                                                   | 03         | fixture              | 1.5h   | completed |
| 05  | [Shared hashtag module + retire `SAA_HASHTAGS`](./phase-05-shared-hashtag-module.md)               | `lib/kudos/hashtags.ts`, `lib/kudos/types.ts`, `constants/index.ts`                                                                                                                                                                                                                                                                   | 03         | infrastructure       | 0.5h   | completed |
| 06  | [F002 board reads + page-level filter lift](./phase-06-f002-board-reads.md)                        | `app/sun-kudos/page.tsx`, `app/sun-kudos/actions/load-feed-page.ts`, `lib/kudos/board-queries.ts`, `components/kudos-board/{all-kudos-section,feed-list,feed-kudo-post-card,highlight-section,highlight-kudo-card,highlight-filter-dropdown,spotlight-*,sidebar-panel,sidebar-stats,sidebar-leaderboard}.tsx`, deletes 3 mock modules | 02,04,05   | e2e-red-first        | 3h     | completed |
| 07  | [F003 authoring + Addlink Box](./phase-07-f003-authoring-addlink.md)                               | `components/kudos/**`, `components/kudos-board/write-kudos-bar.tsx`, `app/sun-kudos/actions/submit-kudo.ts`, `lib/kudos/kudo-validation.ts`, deletes `kudos-mock-data.ts`                                                                                                                                                             | 02,04,05   | e2e-red-first        | 3h     | completed |
| 08  | [F004 hearts](./phase-08-f004-hearts.md)                                                           | `components/kudos-board/heart-button.tsx`, `app/sun-kudos/actions/heart-kudo.ts` (+ edits the two card files)                                                                                                                                                                                                                         | 06         | e2e-red-first        | 1.5h   | completed |
| 09  | [F006 secret-box reveal](./phase-09-f006-secret-box-reveal.md)                                     | `components/kudos-board/{sidebar-gift-dialog,secret-box-reveal-panel}.tsx`, `app/sun-kudos/actions/open-secret-box.ts`, `lib/i18n/locales/*/kudos-feed.json`                                                                                                                                                                          | 02,03,04   | e2e-red-first        | 1.5h   | completed |

> **Ownership correction (2026-09-06, orchestrator).** Phase 06's original glob
> `components/kudos-board/sidebar-*.tsx` collided with phase 09's explicit ownership of
> `sidebar-gift-dialog.tsx`, and both were scheduled in the same parallel window (06 ∥ 07 ∥ 09).
> Phase 06 is narrowed to `sidebar-panel`, `sidebar-stats`, `sidebar-leaderboard`;
> **`sidebar-gift-dialog.tsx` belongs to phase 09 alone.**
> Related: phase 07 owns `write-kudos-bar.tsx` but **not** `app/sun-kudos/page.tsx`, which phase 06
> owns. Phase 07 must keep `WriteKudosBar`'s public props stable, or report the required page
> wiring instead of editing the page itself.

| 10 | [Green gate + security re-assertion](./phase-10-green-gate.md) | `e2e/**` (re-run), `reports/` | 06,07,08,09 | verification | 1h | completed |

**Parallel windows.** 06 ∥ 07 ∥ 09 (disjoint file sets, all depend only on 02/04/05). Everything
else is sequential. 08 must follow 06 — it edits the two card files 06 owns.

## Dependency notes

- **01 is a hard gate.** F006 moves `profiles.boxes_*`; that is only meaningful once a user
  cannot move those columns themselves. `20260722070000_grant_table_privileges.sql` intends narrow
  grants but a postgres-owned default ACL on schema `public` grants ALL to anon+authenticated on
  every table — so every REVOKE/GRANT must be asserted explicitly, and **re-asserted for each new
  table phase 03 adds**.
- **02 before every e2e phase.** `/sun-kudos` sits behind the `proxy.ts` guard, so no board
  assertion is reachable without a real GoTrue session. 02 builds that harness; without it a RED
  is a redirect, not an assertion failure.
- **03 before 04.** `seed.sql` inserts `kudo_hashtags` rows into a table 03 creates.
- **05 before 06 and 07.** Both read the same `getHashtags()` and both would otherwise edit
  `constants/index.ts`; isolating that edit is what makes 06 ∥ 07 safe.

## Test matrix

| Level                                                   | Covers                                                                                 | Where                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SQL assertion (`docker exec … psql -v ON_ERROR_STOP=1`) | privilege escalation closed, new-table grants, RPC atomicity, multiplier trigger       | `supabase/tests/*.sql`                          |
| E2E (`@playwright/test`, authenticated storageState)    | MaZUn5xHXZ / ihQ26W78P2 / OyDLDuSGEa / J3-4YFIpMM behavioral test cases                | `e2e/kudos-*.spec.ts`, `e2e/secret-box.spec.ts` |
| Static gate                                             | `pnpm validate` (format, lint, typecheck, build)                                       | CI + pre-push                                   |
| Manual                                                  | Spotlight pan/zoom, carousel arrows, image lightbox (visual-contract, already shipped) | Phase 10 checklist                              |

No unit runner exists and none is introduced (YAGNI). `test:e2e` stays out of `pnpm validate`.

## Decisions taken in this plan (not re-opening clarifications.md)

- `FEED_PAGE_SIZE = 10` — never stated in any spec; 10 × 40 seeded kudos gives 4 pages.
- Highlight tie-break `hearts_count DESC, created_at DESC, id ASC` — deterministic top-5.
- The heart multiplier is applied by a **BEFORE INSERT trigger**, not by the Server Action, so a
  direct anon-key insert cannot forge `hearts_value = 2`.
- The secret-box draw is a `security definer` RPC, not a service-role Server Action — no new
  secret enters `.env.local`.
- The board stays **behind the auth guard**. See "Known deviations".

## Known deviations from the specs

- **FR-101/FR-601 (F002) say the board is public.** The shipped `proxy.ts` guard redirects
  `/sun-kudos` to `/login`, and `e2e/auth-guard.spec.ts` asserts that. Batch A keeps the guard; the
  "anonymous visitor" scenarios are out of scope and marked so in phase 06.
- **The E2E suite stops being Docker-free** for the board specs. Recorded and reasoned in
  [phase-02](./phase-02-foundation-ui-types-e2e-harness.md#key-insights).
- **The secret-box screen states are inverted** relative to `clarifications.md` and the task brief:
  `sidebar-gift-dialog.tsx` already implements the _unopened_ shell; J3-4YFIpMM is the _success_
  modal and is what is missing. Phase 09 builds the missing half.

## Out of scope

Department directory (`DEPARTMENTS` stays hardcoded, D001) · both sidebar leaderboards (no backing
table, D002 — they render `'Chưa có dữ liệu'`) · rich-text toolbar beyond the link button (D002 of
F003) · `@`-mention autocomplete · kudo detail page · realtime subscriptions · admin surfaces.
