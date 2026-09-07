# Phase 02 — Award screen e2e RED gate

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Test cases of record: [`data/zFYDgyj_pD-testcases.csv`](./data/zFYDgyj_pD-testcases.csv)
- Spec of record: [`data/zFYDgyj_pD-specs.csv`](./data/zFYDgyj_pD-specs.csv)
- Prerequisite fixture: [`phase-01`](./phase-01-authenticated-storage-state-fixture.md)
- MoMorph: <https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD>

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 2h
**Depends on:** Phase 01 (authenticated storage state)
**Resolved `test_policy`:** `e2e-red-first` — MoMorph supplies 15 real test cases for this
screen, several of them behavioral (menu active-state transitions, smooth scroll, CTA
navigation), so behavior work here is RED-first and not visual-contract.

The screen ships and looks right; what is missing is any executable proof of it. This phase
writes the durable spec file. Most assertions will pass on the _current_ code — that is expected
and fine. **The RED this phase must produce is G1**: the Top Talent quantity unit currently reads
"Cá nhân" where spec D.1 and TC ID-6 both demand "Đơn vị". Phase 03 turns it GREEN.

## Key Insights

- **A RED that is merely "no test existed" is not a RED.** The gate is satisfied only by a real
  non-zero exit caused by an assertion about the screen. ID-6's quantity assertion is that
  assertion — it fails today against real shipped copy, and it is a genuine defect rather than a
  test contrivance.
- **Every assertion runs authenticated.** Without phase 01 the very first `goto("/award-info")`
  lands on `/login` and all 15 cases fail for one uninteresting reason.
- ID-9 and ID-11 need care: `CategoryNav` drives active state from _both_ clicks and an
  `IntersectionObserver` scrollspy, with an 800ms suppression window
  (`CLICK_SCROLL_SUPPRESS_MS`). Assert the active item **after** the smooth scroll settles, or
  the observer will hand back a different item mid-flight and the test will flake.
- `scroll-mt-24` on each `<section>` and `scroll-behavior: smooth` mean Playwright's default
  auto-waiting is not enough — wait on the `aria-current` attribute, not on a scroll position.
- ID-13 and ID-14 are `Abnormal_Others` cases whose current behavior is already correct
  (optional-chained `getElementById`, a `/sun-kudos` route that exists). Assert them anyway —
  they are cheap regression guards, and ID-13 in particular protects the null-safety.

## Requirements

**Functional** — one spec file covering, at minimum:

- ID-3 layout: title above, nav left, cards centre, Sun* Kudos banner below.
- ID-4 title: eyebrow "Sun* Annual Awards 2025" + gold `<h1>`.
- ID-5 menu: exactly 6 items, in the spec's order.
- ID-6 cards: all 6 with their quantity and prize values (**this is the RED**).
- ID-9 / ID-11 active state: click each item → correct section anchored, `aria-current` set on
  it and cleared from the previous one.
- ID-12 CTA: "Chi tiết" navigates to `/sun-kudos`.
- ID-13: a non-existent anchor id throws no page error.

**Non-functional** — spec file under 200 lines; no `waitForTimeout`; runs in both the default and
the `--headed` mode without flaking across 3 consecutive runs.

## Architecture

```text
e2e/award-system.spec.ts
  test.describe("Hệ thống giải — /award-info")
    beforeEach: page.goto("/award-info")        ← authenticated via project storageState
    ID-3/4/5  → structural locators (nav, h1, sections)
    ID-6      → for each of the 6 awards, assert quantity value + unit + prize amount
    ID-9/11   → click nav item → expect(navItem).toHaveAttribute("aria-current", …)
                              → expect(previous).not.toHaveAttribute("aria-current")
    ID-12     → click "Chi tiết" → expect(page).toHaveURL(/\/sun-kudos/)
    ID-13     → page.on("pageerror") collector, evaluate a bogus id, expect no errors
```

**Locale note.** Assertions read Vietnamese copy, which is the default locale (`defaultLocale:
"vi"` in `lib/i18n/settings.ts`) and what an unset `NEXT_LOCALE` cookie yields. Do not set the
cookie in this spec; if a later phase changes the default, this spec should break loudly.

## Related Code Files

**Create** — `e2e/award-system.spec.ts`
**Modify** — none
**Read for context** — `components/awards/*.tsx`, `lib/i18n/locales/vi/awards.json`,
`components/homepage/sunkudos-section.tsx`

Owns exactly one new file. No overlap with phase 01 (config + setup) or phase 03 (locales +
components).

## Implementation Steps

1. Confirm phase 01 is done: a scratch `goto("/award-info")` must not land on `/login`.
2. Write the structural cases (ID-3, ID-4, ID-5) first — they should pass immediately and
   confirm the harness works before anything subtle is attempted.
3. Write ID-6 as a data-driven loop over the 6 awards with the values **taken from the spec CSV,
   not from `award-detail-section.tsx`**. Copying from the implementation would encode G1 as
   correct and destroy the point of the phase.
4. Run it. Record `redCommand`, `redExitCode` and the exact `redFailure` text for the Top Talent
   quantity-unit assertion. **Stop here if the failure is anything other than that assertion** —
   a redirect, a build error or a missing container is not a valid RED.
5. Add ID-9 / ID-11 / ID-12 / ID-13. These should pass.
6. Re-run three times; fix any flake in the active-state waits before handing off.

## Todo List

- [ ] Phase 01 confirmed working
- [ ] ID-3, ID-4, ID-5 pass
- [ ] ID-6 written from the spec CSV, not the code
- [ ] Valid RED recorded: command, exit code, failing assertion text
- [ ] ID-9 / ID-11 assert both set-on-new and cleared-from-old
- [ ] ID-12 asserts `/sun-kudos`
- [ ] ID-13 collects `pageerror` and expects none
- [ ] No `waitForTimeout` anywhere
- [ ] 3 consecutive clean runs of the passing subset
- [ ] `pnpm lint && pnpm typecheck` exit 0

## Success Criteria

| ID    | Criterion                                                  | Method                                                            |
| ----- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| SC-01 | `pnpm test:e2e e2e/award-system.spec.ts` exits non-zero    | recorded `redExitCode`                                            |
| SC-02 | The only failure is the Top Talent quantity-unit assertion | reporter output                                                   |
| SC-03 | All other listed cases GREEN                               | same run                                                          |
| SC-04 | Stable across 3 runs                                       | `for i in 1 2 3; do pnpm test:e2e e2e/award-system.spec.ts; done` |

**Exact command:** `pnpm test:e2e e2e/award-system.spec.ts`

## Risk Assessment

| Risk                                                                        | Likelihood | Impact       | Countermeasure                                                                                       |
| --------------------------------------------------------------------------- | ---------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Active-state assertions flake against the 800ms observer suppression        | **High**   | Medium       | Wait on the `aria-current` attribute via web-first assertions; never on a timeout or a scroll offset |
| ID-6 values copied from the implementation, hiding G1                       | Medium     | **Critical** | Step 3 states the source explicitly; reviewer diffs the spec constants against the CSV               |
| `pnpm build && pnpm start` per run makes the loop slow enough to be skipped | Medium     | Medium       | `reuseExistingServer` is already true outside CI — run `pnpm start` once by hand while iterating     |
| Vietnamese copy assertions break on a locale-default change                 | Low        | Low          | Accepted and documented above — a loud break is the desired behavior                                 |

## Security Considerations

Read-only screen, no mutations, no privileged data. The only sensitive artifact in play is the
storage state from phase 01, already gitignored there.

## Next Steps

Hands the recorded RED to [phase-03](./phase-03-award-copy-and-a11y-corrections.md).

## Rollback

`rm e2e/award-system.spec.ts`. Nothing else changed.
