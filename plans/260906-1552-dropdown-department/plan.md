---
title: "Dropdown Phòng ban — department master data and page-wide filter"
description: "Replace the 4-row hardcoded DEPARTMENTS constant with a real departments table seeded from the spec's 50-entry master list, link profiles to it, and make the board's department dropdown filter the page."
status: pending
priority: P2
effort: 6h
branch: develop
tags: [departments, schema, migration, kudos-board, batch-b]
created: 2026-09-06
work_type: feature
test_policy: visual-contract
spec_lang: en
---

# Dropdown Phòng ban — Implementation Plan

Screen [`WXK5AYB_rG`](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/WXK5AYB_rG),
fileKey `9ypp4enmFmdK3YAFJLIu6C`. Source: [`data/WXK5AYB_rG-specs.csv`](./data/WXK5AYB_rG-specs.csv)
(4 rows, all `spec_progress: completed`).
Sibling blueprint and shared decision log:
[`../260906-1903-profile-and-menus/plan.md`](../260906-1903-profile-and-menus/plan.md) ·
[`clarifications.md`](../260906-1903-profile-and-menus/clarifications.md) (Q1, Q2).

**Goal.** `constants/index.ts` hardcodes four CEVC rows. The spec's `mms_A_Dropdown-List`
description carries a **50-entry** department master list and says the dropdown is DB-sourced. No
department table exists. This plan creates one, links `profiles` to it, retires the constant, and
makes selection filter the board page rather than only the Highlight carousel.

## Test policy

**`visual-contract`** — MoMorph returns **zero** test cases for `WXK5AYB_rG` (`status: empty`, not
an error; the file is a bare header row). No RED is claimed, no TDD is claimed, and no test case is
fabricated. Phase 03 is genuinely behavioural, which sits awkwardly under a visual contract; that is
raised as an open question rather than silently upgraded — see [Unresolved](#unresolved-in-this-folder).
Migration correctness (phase 01) is proved by SQL assertion, which is evidence, not a policy.

## Phases

| #   | Phase                                                                                 | Owns (files)                                                                                                                                                    | Depends on      | Effort | Status  |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------ | ------- |
| 01  | [`departments` table, master seed, profile linkage](./phase-01-departments-schema.md) | `supabase/migrations/20260907020000_departments.sql`                                                                                                            | Batch A phase 0 | 2.5h   | pending |
| 02  | [DB-sourced options; retire the constant](./phase-02-department-options-source.md)    | `lib/departments/**`, `constants/index.ts`                                                                                                                      | 01              | 1.5h   | pending |
| 03  | [Page-wide department filter](./phase-03-page-wide-filter.md)                         | `components/kudos-board/highlight-section.tsx`, `app/sun-kudos/page.tsx`, `lib/kudos/board-filters.ts` (**shared with Batch A F005 — sequenced, not parallel**) | 02, **A-F005**  | 2h     | pending |

**No parallel window.** 01 → 02 → 03 is strictly sequential, and 03 additionally waits on Batch A's
F005 filter-state lift because they edit the same two files.

## Cross-batch dependencies

| Ref                 | Item                                                         | Why this plan blocks on it                                                                                                              |
| ------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **A-p0**            | `profiles` column-level GRANT hardening                      | Phase 01 adds a column to `profiles`; the GRANT must be re-asserted afterwards or the new column inherits the wide default ACL          |
| **A-F005**          | Hashtag filter state lifted from `feed-list.tsx` to the page | Phase 03 edits the same files for the department axis. Doing both at once guarantees a conflict                                         |
| **DD-01 → Batch B** | `departments` + `profiles.department_id`                     | [`profile-and-menus` phase 02](../260906-1903-profile-and-menus/phase-02-profile-read-layer.md) joins it for the hero's department line |

## Test matrix

| Level           | Covers                                                                    | Where                                |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| SQL assertion   | Row count, uniqueness, FK, RLS + explicit GRANTs, backfill match rate     | phase 01                             |
| visual-contract | Dropdown appearance, selected/hover states, list order                    | `tester` MCP vs. frame, phases 02–03 |
| Static + manual | `pnpm validate`; a selection filters Highlight **and** All Kudos together | phase 03                             |

## Known scope boundaries

- **The master list was flattened by the CSV export** — 50 entries in one whitespace-joined string,
  hierarchical entries joined internally by `" - "`. The parse in
  [phase 01](./phase-01-departments-schema.md#the-master-list) is a **heuristic** yielding exactly 50
  unique entries, recorded verbatim for BA confirmation. Artefacts: `CEVEC` (likely a `CEVC` typo)
  and `PAO - PAO`. The design's _visible_ dropdown additionally shows `OPD` and `Infra`, in the list
  nowhere; and live `profiles.hero_code` holds `'CEVC10'`, also absent. See Q2.
- Reporting hierarchy (`OPDC - HRD - L&D` is three levels) is **not** modelled as a tree. The
  dropdown is flat, the design is flat; YAGNI.

## Unresolved in this folder

- **Should phase 03 be `e2e-red-first`?** It changes what the board renders — a real state
  transition — but the screen has zero test cases, so the resolved policy is `visual-contract`.
  Raised here deliberately; **not** silently upgraded. A behavioural gate for it would have to be
  hand-written, which is exactly what the policy rules forbid inventing.
- Q1 (does `department_id` replace `hero_code`?) and Q2 (the `CEVEC` / `OPD` / `Infra` / `CEVC10`
  mismatches) are recorded in the shared
  [`clarifications.md`](../260906-1903-profile-and-menus/clarifications.md) and block phase 01's seed.

## Out of scope

The hashtag axis of the same filter row (Batch A F005) · the board's data layer (F002) ·
department-based permissions of any kind — a department is a label, not a role.
