# Phase 02 — Countdown e2e RED gate (G3)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Test cases of record: [`data/8PJQswPZmU-testcases.csv`](./data/8PJQswPZmU-testcases.csv) (17)
- Prerequisite fixture (shared, documented once):
  [`../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md`](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md)
- Data-source change this proves: [`phase-01`](./phase-01-launch-datetime-from-event-settings.md)

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 2h
**Depends on:** the shared storage-state fixture; runs alongside phase 01
**Resolved `test_policy`:** `e2e-red-first`

17 MoMorph test cases, zero executable coverage. This phase writes the durable spec.

## Key Insights

- **Where the RED comes from.** Most GUI cases pass against today's code — the display layer is
  correct. The assertion that genuinely fails today is the _data source_: with `launch_at` set to
  a known future instant in the database, the current build ignores it and counts down from
  `Date.now() + 8_000` (`lib/countdown-config.ts:19`). A spec that seeds the row and asserts the
  rendered days match it is RED now and GREEN after phase 01. **Do not fabricate a display bug to
  manufacture a RED.**
- **The screen is time-dependent, which is the whole testing difficulty.** Control time through
  the _database row_, not through `page.clock` or a frozen system clock — the row is the contract
  phase 01 introduces, and driving the test through it exercises the real path.
- **Eight seconds is a trap for the test author.** On today's build the page redirects itself to
  `/about` roughly eight seconds after load (`countdown-timer.tsx:53-55`). Any assertion slower
  than that will fail with a confusing navigation error rather than a value mismatch. Assert
  early, and note this in the spec file so the next reader is not baffled.
- The route is guarded — `/countdown` is in `PROTECTED_ROUTES` in `e2e/auth-guard.spec.ts`. The
  storage-state fixture is mandatory.
- Digits are text inside `CountdownDigitBox`, one character per box, with a decorative `8`
  ghost carrying `aria-hidden`. A naive `toHaveText("07")` on the unit container will pick up the
  ghosts. Target the lit `<span>`s, or assert on an accessible name — and if neither is clean,
  the honest fix is a `data-testid` on the unit, not a brittle selector.
- Cases `f98adad8` (hours −1/25 → "00") and `724e6e17` (minutes −1/60 → "00") describe inputs
  that **cannot occur**: hours and minutes are derived by modular arithmetic in
  `hooks/use-countdown.ts:25-28`, never assigned. Assert the reachable equivalents (00, 12, 23 /
  00, 30, 59) via seeded offsets and record that the invalid-input half is unreachable by
  construction rather than pretending to test it.

## Requirements

**Functional** — `e2e/countdown.spec.ts` covering:

- GUI `400e248f` / `25d9ddaa` / `68cf8e17` — each unit renders two digit boxes + its label.
- GUI `37fd89d1` — labels are uppercase DAYS / HOURS / MINUTES.
- GUI `33fe648b` / `1bd69f78` / `8dc4bba6` — two-digit values across 0, 9, 10, 31/23/59.
- FUNCTION `840dd6be` — values update over time.
- FUNCTION `b373626d` — under one day, DAYS shows "00".
- FUNCTION `50fc4021` — at or past target, every unit shows "00".
- FUNCTION `c715cb38` — leading zeros for single digits.
- ACCESSING `e6a59553` — unauthenticated access is redirected (already covered by
  `auth-guard.spec.ts`; assert by reference, do not duplicate).
- **The RED:** a seeded `launch_at` is what the screen displays.

**Non-functional** — under 200 lines; no `waitForTimeout` for correctness (only, if truly
unavoidable, for the "values update" case, and then with a comment); restores the `event_settings`
row after the run.

## Architecture

```text
e2e/countdown.spec.ts
  helper setLaunchAt(offsetMs)  → docker exec … psql -c "update public.event_settings
                                    set launch_at = now() + interval '…' where id = 1"
  beforeAll : capture the existing launch_at
  afterAll  : restore it            ← the suite must not leave the stack mutated

  seeded +31d02h30m → assert DAYS "31", HOURS "02", MINUTES "30"     ← RED today
  seeded +9d        → "09"                    (leading zero)
  seeded +23h       → DAYS "00"               (b373626d)
  seeded −1h        → all units "00"          (50fc4021)
  labels/structure  → static, no seeding
```

**Ownership.** One new file. Phase 01 owns the library and page changes; this phase owns no
product code. The `psql` helper is confined to this spec file.

## Related Code Files

**Create** — `e2e/countdown.spec.ts`
**Modify** — none. (If a `data-testid` proves necessary, it lands in
`components/countdown/countdown-timer.tsx` — which phase 01 also owns, so sequence it after
phase 01 rather than editing the same file in parallel.)
**Read for context** — `components/countdown/*`, `hooks/use-countdown.ts`

## Implementation Steps

1. Confirm the shared fixture works: `goto("/countdown")` must not land on `/login`.
2. Write the seeding helper and the `beforeAll`/`afterAll` capture-and-restore. Build this
   **first** — a spec that leaves the row mutated poisons every later manual check.
3. Write the structural/label cases. They should pass immediately.
4. Write the seeded-value cases. Run. Record `redCommand`, `redExitCode` and the failing
   assertion text. On today's build the seeded values are ignored, so these fail with the seeded
   number against a near-zero rendered number — that is the valid RED.
5. Add the boundary cases (under one day, past target, leading zeros).
6. After phase 01 lands, re-run: everything GREEN.

## Todo List

- [ ] Shared storage-state fixture confirmed
- [ ] `afterAll` restores the original `launch_at` — written before any seeding case
- [ ] Structural + label cases pass
- [ ] Valid RED recorded on the seeded-value assertion
- [ ] Boundary cases: <1 day, past target, single-digit padding
- [ ] Digit assertions do not pick up the `aria-hidden` ghost `8`
- [ ] Unreachable-input cases documented as unreachable, not faked
- [ ] `pnpm lint && pnpm typecheck` exit 0

## Success Criteria

| ID    | Criterion                                                               | Method                                              |
| ----- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| SC-01 | `pnpm test:e2e e2e/countdown.spec.ts` exits non-zero before phase 01    | recorded `redExitCode`                              |
| SC-02 | The failure is a seeded-value mismatch, not a redirect or a build error | reporter output                                     |
| SC-03 | Same command exits 0 after phase 01                                     | exit code                                           |
| SC-04 | The row is unchanged after the run                                      | `select launch_at from event_settings` before/after |

**Exact command:** `pnpm test:e2e e2e/countdown.spec.ts`

## Risk Assessment

| Risk                                                                        | Likelihood | Impact | Countermeasure                                                                                                |
| --------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| The 8-second self-redirect on the pre-phase-01 build masks the real failure | **High**   | High   | Assert within the first seconds; documented in the spec file's docblock                                       |
| The suite leaves `event_settings` mutated                                   | Medium     | High   | `afterAll` restore built in step 2, before any seeding; SC-04                                                 |
| Digit assertions match the decorative ghost `8`                             | Medium     | Medium | Target the lit span; `data-testid` as the honest fallback                                                     |
| Second-boundary flake (assert "30" as it ticks to "29")                     | Medium     | Medium | Seed offsets away from a rollover (e.g. `+30m 30s`) and assert a small range where exactness is not the point |
| `docker exec` unavailable on the runner                                     | Medium     | High   | Same Docker dependency the shared fixture already introduces — stated once there, inherited here              |

## Security Considerations

The seeding helper runs `psql` as `postgres` inside the local container — a superuser path that
exists **only** because there is no write policy on `event_settings` (verified: the table's sole
policy is `SELECT`). This is acceptable for a disposable local stack and must never be pointed at
a shared environment.

## Next Steps

Feeds GREEN evidence to [phase-01](./phase-01-launch-datetime-from-event-settings.md) and gives
[phase-03](./phase-03-prelaunch-navigation-lock.md) a working time-seeding helper to build on.

## Rollback

`rm e2e/countdown.spec.ts` and restore `event_settings.launch_at` if a run was interrupted before
`afterAll`.
