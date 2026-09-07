# Phase 07 — GREEN gate + verification

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md)
- All 30 test cases: [`data/3FoIx6ALVb-testcases.csv`](./data/3FoIx6ALVb-testcases.csv)
- Phases under verification: [03](./phase-03-route-shell-hero-badges.md) ·
  [04](./phase-04-two-faces-stats-write.md) · [05](./phase-05-kudos-section.md) ·
  [06](./phase-06-header-menus-admin-gate.md)

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 0.5h · **Depends on:** 03, 04, 05, 06
**test_policy:** inherits — `e2e-red-first` for `3FoIx6ALVb`, `visual-contract` for the two menus.
This phase adds no product code and owns no source file. It runs the whole gate once, on the final
merged tree, and writes the evidence.

## Key Insights

- **Tests run against the FINAL code** — the same code that gets reviewed and merged. Re-running each
  phase's spec in isolation at the end of that phase is not the same as running them together after
  06 has changed the header on every page.
- **Phase 06 changes a component five pages mount.** The most likely late regression in this batch is
  not in `/profile` at all — it is `pnpm build` or the existing `auth-guard.spec.ts` breaking because
  `site-header.tsx` became a server component. Run the `public` project too.
- Three cases cannot be automated under this batch's constraints and are verified by hand here:
  `SEC_003` (two live sessions — a single-session test cannot demonstrate it, the case says so),
  `GUI_008` (the full VN/EN sweep beyond key parity), and `GUI_006`'s side-by-side card comparison
  against `/sun-kudos`.
- **A failing test is never waved through** to make the build or a GitHub Action green. Any red here
  goes back to the owning phase with the failure text; it is not annotated away.

## Requirements

- FR-B701 — every `e2e/profile-*.spec.ts` passes against the merged tree, Supabase up.
- FR-B702 — `e2e/auth-guard.spec.ts`, `login-click-contract.spec.ts`, `login-error-state.spec.ts`
  still pass, and still pass **with Supabase down** (the Docker-free property phase 01 promised to
  preserve).
- FR-B703 — `pnpm validate` exits 0.
- FR-B704 — the manual checklist below is completed and recorded.
- FR-B705 — a verification report lands in `plans/reports/`.

## Verification Matrix

| Case                                  | Level           | Command / method                                                              |
| ------------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| ACC 001–002, FUN 001–005              | E2E             | `pnpm test:e2e --project=profile --grep profile-access`                       |
| GUI 001–003, 009                      | E2E             | `… --grep profile-hero`                                                       |
| GUI 004–005, FUN 006–008              | E2E             | `… --grep profile-two-faces`                                                  |
| FUN 009–015, SEC 001–002, GUI 006–007 | E2E             | `… --grep profile-kudos-section`                                              |
| **SEC 003**                           | **manual**      | two browsers, two accounts, both Sent lists captured and diffed               |
| **GUI 008**                           | **manual**      | VN then EN, both faces, every label read; no blank, no raw key                |
| **GUI 006**                           | **manual**      | same Kudo on `/profile` and `/sun-kudos`, side by side                        |
| SEC 004                               | E2E + manual    | no edit affordance; payload greps for email / auth uid                        |
| `z4sCl3_Qtk`, `54rekaCHG1`            | visual-contract | `tester` MCP capture vs. the MoMorph frames                                   |
| Admin gate                            | SQL             | rolled-back `update profiles set role='admin'` as an ordinary JWT → must fail |
| Regression                            | E2E             | `pnpm test:e2e --project=public`, Supabase **up** and **down**                |
| Static                                | gate            | `pnpm validate`                                                               |

## Implementation Steps

1. `pnpm validate`.
2. Supabase up: `pnpm test:e2e` (all projects). Record per-project exit codes.
3. Supabase down: `pnpm test:e2e --project=public`. Must exit 0. Then `pnpm test:e2e` unfiltered must
   exit **non-zero** on `setup` — a silent skip is a failure of phase 01's contract.
4. Re-run the SC-B605 SQL assertion on the final tree.
5. Walk the three manual cases; capture screenshots into this plan's `evidence/`.
6. `wc -l app/profile/page.tsx components/profile/*.tsx lib/profile/*.ts lib/auth/*.ts` — every file
   under 200.
7. Write `plans/reports/planner-*-batch-b-verification.md`: per-case status, exit codes, the manual
   findings, and anything that ended `DONE_WITH_CONCERNS`.
8. Hand the tree to the `reviewer` agent.

## Todo List

- [ ] `pnpm validate` exits 0
- [ ] All four profile specs green on the merged tree
- [ ] `public` project green with Supabase up **and** down
- [ ] Unfiltered run with Supabase down exits non-zero on `setup` (no silent skip)
- [ ] SC-B605 SQL assertion re-run and failing as required
- [ ] SEC_003 verified with two live sessions, evidence captured
- [ ] GUI_008 VN/EN sweep, both faces, no blank or raw key
- [ ] GUI_006 side-by-side card comparison captured
- [ ] `tester` visual verdict recorded for both dropdown screens
- [ ] Every new file under 200 lines
- [ ] Verification report written to `plans/reports/`
- [ ] Handed to `reviewer`

## Success Criteria

| ID      | Criterion                               | Method                                       |
| ------- | --------------------------------------- | -------------------------------------------- |
| SC-B701 | Zero failing tests on the final tree    | exit codes recorded verbatim, not summarized |
| SC-B702 | No regression in the pre-existing suite | `--project=public` exit 0                    |
| SC-B703 | Docker-free property intact             | stack-down run of `--project=public` exit 0  |
| SC-B704 | Manual cases evidenced                  | screenshots + notes in `evidence/`           |
| SC-B705 | Report exists                           | file present in `plans/reports/`             |

## Risk Assessment

| Risk                                                                         | Likelihood | Impact       | Countermeasure                                                                                    |
| ---------------------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------- |
| Phase 06's server-component header breaks a page only the full build reveals | Medium     | High         | Step 1 runs `pnpm validate` (which includes `build`) before any test                              |
| A red test is annotated/skipped to reach a green gate                        | Low        | **Critical** | Stated as a hard rule; the report records exit codes verbatim                                     |
| Manual cases quietly skipped because they are slow                           | Medium     | Medium       | Each is a separate todo item with a required artefact in `evidence/`                              |
| Storage state expires mid-run, producing confusing auth failures             | Medium     | Low          | `setup` regenerates it every invocation                                                           |
| Local flake mistaken for a real failure                                      | Medium     | Low          | Re-run the failing spec alone before filing it; `retries: 0` locally means a repeat is meaningful |

## Security Considerations

- The SQL assertion (SC-B605) is re-run **on the final tree**, not trusted from phase 06 — a later
  migration could have re-granted `UPDATE`.
- `SEC_001`, `SEC_002`, `SEC_003` and `SEC_004` are the four cases whose failure would ship a real
  leak. If any is red, the batch is BLOCKED, not `DONE_WITH_CONCERNS`.
- The report must not paste storage-state contents, tokens, or the seed password into
  `plans/reports/`.

## Next Steps

Hand to `reviewer`, then to `delivery-tracker` to update the plan statuses. Any unresolved
`clarifications.md` question still marked `TBD` at this point is reported to the user as an open
product decision, not closed by the implementer.

## Rollback

Nothing to roll back — this phase writes only reports and evidence. If the gate is red, roll back the
owning phase using its own rollback section; the phases were sequenced so 06 → 05 → 04 → 03 → 02 → 01
unwinds cleanly in that order.
