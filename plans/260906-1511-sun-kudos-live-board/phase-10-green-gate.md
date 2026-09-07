# Phase 10 — Green gate + security re-assertion

## Context Links

- [`plan.md`](./plan.md) — every phase feeds this one
- `AGENTS.md` § "Verification Expectations"
- Phases 06/07/08/09 RED records (each phase's report)

## Overview

- **Priority:** P1 — the batch is not delivered until this exits 0.
- **Status:** completed (verified: 41/41 e2e, 5/5 SQL suites, 0/44 XSS literal tags, pnpm validate)
- Full suite run from clean database, security properties re-asserted, deviations recorded.
- **Policy: verification.** No new behavior; green gate met.

## Key Insights

- Four phases each proved their own slice green in isolation. The failure mode this phase exists
  to catch is the interaction: phase 08's special-day test mutating `event_settings`, phase 09's
  draws draining `boxes_unopened`, phase 07's submits changing the feed's first row and breaking
  phase 06's "newest first" assertion. **Order matters, and a clean `supabase db reset` before the
  full run is not optional.**
- A green suite proves nothing about the security work — those properties are SQL-level and only
  the assertion scripts see them. Re-run phase 01's and phase 03's assertions here.
- Several shipped behaviors on this screen are `visual-contract`, not TDD: carousel arrows,
  Spotlight pan/zoom, the image lightbox, hover and responsive states. They get a manual
  checklist, and this phase must **not** claim RED/GREEN evidence for them.

## Requirements

- **FN-1** `supabase db reset` → `pnpm validate` → `pnpm test:e2e` all exit 0, in that order.
- **FN-2** Phase 01 + phase 03 SQL assertions exit 0 against the reset database.
- **FN-3** Every deleted mock module is gone and unreferenced.
- **FN-4** No file added or modified by this batch exceeds 200 lines.
- **FN-5** The manual `visual-contract` checklist is walked and recorded.

## Architecture

```text
supabase db reset            (migrations 01+03, seed 04)
  → supabase/tests/*.sql     (privileges, hashtags, hearts multiplier, secret box)
  → pnpm validate            (format:check, lint, typecheck, build)
  → pnpm test:e2e            (chromium: 3 auth specs · chromium-authed: board, authoring,
                              addlink, hearts, secret box)
  → manual checklist
  → reports/tester-<date>-batch-a-green-gate.md
```

## Related Code Files

**Modify** — `plans/260710-1511-sun-kudos-live-board/plan.md` (phase statuses)
**Create** — `plans/260710-1511-sun-kudos-live-board/reports/` verification record
No application code changes. If a failure demands a fix, it goes back to the owning phase.

## Implementation Steps

1. `supabase db reset` from a clean stack; confirm 13 hashtags, 15 profiles, 40 kudos.
2. Run every file in `supabase/tests/` with `-v ON_ERROR_STOP=1`; record exit codes.
3. `pnpm validate`. If the Turbopack build is blocked locally, fall back to
   `pnpm exec next build --webpack` and record the environment limitation (AGENTS.md allows this
   explicitly).
4. `pnpm test:e2e` — both projects, full run, no `-g` filter. Record the real exit code; a
   failure is a failure.
5. Reset again and re-run once to catch order dependence between the specs.
6. Assert cleanliness:
   `grep -rn "mock-data\|MOCK_SUNNERS\|SAA_HASHTAGS" app components lib constants` → empty;
   `find app components lib -name '*.ts*' -exec wc -l {} + | awk '$1>200'` → empty.
7. Confirm `event_settings.special_day_start is null` and no test residue in `kudo_hearts` /
   `user_icon_unlocks` beyond the seed.
8. Manual `visual-contract` checklist (TC `81446f61` carousel arrows at both ends, `cac4b7a3`
   pan/zoom toggle, `f9b68ffa` image lightbox, `0adfd7ce` copy-link toast, `1ce82447` search
   placeholder, `d3877e54` input placeholder). Record pass/fail; do not label these RED/GREEN.
9. Update every phase Status in `plan.md` via `ck plan check <id>` (fallback: edit the column).
10. Write the verification report into `plans/reports/`, including the RED evidence collected by
    06/07/08/09 and every deviation from the specs.

## Todo List

- [x] Clean `supabase db reset` verified by row counts
- [x] All SQL assertions exit 0
- [x] `pnpm validate` exit 0 (or webpack fallback recorded)
- [x] Full `pnpm test:e2e` exit 0, twice, from a reset DB
- [x] Cleanliness greps empty; no file over 200 lines
- [x] No test residue in the database
- [x] Manual visual checklist walked
- [x] `plan.md` statuses updated
- [x] Verification report written

## Success Criteria

- Three commands, three zero exits, reproducible from a reset database.
- Both projects green: 3 unauthenticated specs + 5 authenticated spec files.
- Phase 01's escalation assertion still fails the escalation (i.e. the fix held through every
  later migration).
- The report names every deviation: board behind the auth guard, the Docker-dependent E2E project,
  the inverted secret-box screen states, the missing badge artwork, the unmatched hashtag backfill.

## Risk Assessment

| Risk                                                       | L×I     | Countermeasure                                                                                                                                        |
| ---------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Specs pass individually, fail together (shared mutable DB) | **H×M** | Step 5's double run from a reset DB is exactly this check; any order dependence is fixed in the owning spec, never by reordering the suite            |
| A late failure tempts a weakened assertion to reach green  | M×**H** | Standing rule: never weaken a test or an RLS policy to pass. Failures route back to the owning phase                                                  |
| Turbopack build blocked in the sandbox                     | M×L     | Documented `--webpack` fallback, limitation recorded                                                                                                  |
| `test:e2e` needs Docker and CI has none                    | M×M     | `chromium-authed` is skippable by project; CI runs `chromium` unconditionally and `chromium-authed` only where the stack exists — decided in phase 02 |
| Phase statuses drift from reality in `plan.md`             | M×L     | Step 9 is a checklist item, driven by `ck plan check`                                                                                                 |

## Security Considerations

The last gate on the batch's security claims. Three properties must be re-proven, not assumed:
privileged `profiles` columns are unwritable; `hearts_value` cannot be forged by a client;
`boxes_*` moves only through `open_secret_box()`. Each has an assertion; all three run here.

## Next Steps

Batch A closes. Hand off to Batch B (profile + admin menus), which depends on phase 01 having
landed — its admin gate reads `profiles.role`.
