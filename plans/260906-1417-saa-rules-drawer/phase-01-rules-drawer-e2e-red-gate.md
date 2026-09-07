# Phase 01 — Rules drawer e2e RED gate (G3)

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Test cases of record: [`data/b1Filzi9i6-testcases.csv`](./data/b1Filzi9i6-testcases.csv) (9)
- Spec of record: [`data/b1Filzi9i6-specs.csv`](./data/b1Filzi9i6-specs.csv) (4 rows)
- Shared prerequisite:
  [`../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md`](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md)
- Implementation: `components/homepage/saa-rules-drawer.tsx`, opened from
  `components/homepage/widget-button.tsx:82-94`

## Overview

**Priority:** P1
**Status:** completed 2026-09-07
**Effort:** 2h
**Depends on:** the shared authenticated storage-state fixture
**Resolved `test_policy`:** `e2e-red-first` — MoMorph supplies 9 real test cases for this screen,
five of them behavioral (scroll on overflow, no-scroll when it fits, close, open the kudos form,
disabled rejects clicks). Behavior work here is RED-first.

## Key Insights

- **Where the valid RED comes from.** Seven of the nine cases pass against today's code. The two
  that cannot are TC_THELE_GUI_003 and TC_THELE_FUN_005 — both about a **disabled footer button
  that does not exist**. Asserting them fails today for a real reason, and phase 02 makes them
  pass. That is the RED. Do **not** invent a display bug to manufacture one.
- **But the disabled assertions cannot be written yet.** Nobody knows what _causes_ the disabled
  state (plan question 1). Write them as `test.fixme` with the open question named in a comment,
  and produce the RED from the _reachable_ half — an assertion that a disabled variant renders
  under whatever trigger the product answer supplies. If the answer is "nothing disables them,
  the spec row is aspirational", then this phase's honest outcome is **seven GREEN cases and two
  documented as unimplementable**, with phase 02 closed as won't-do. Say so rather than forcing a
  RED.
- **Reaching the drawer is three clicks deep and route-bound.** It opens only from the FAB
  (`widget-button.tsx`), the FAB mounts only on `/about`, and `/about` is guarded. The test path
  is: authenticated → `/about` → click the FAB trigger → click "Thể lệ" → drawer open. Every
  earlier step is a failure mode that will look like a drawer bug.
- **The drawer is always in the DOM.** `saa-rules-drawer.tsx:81-83` renders the wrapper
  unconditionally with `aria-hidden={!open}` and `pointer-events-none`, and the panel translates
  with `translate-x-full` when closed. `toBeVisible()` will therefore **not** behave the way a
  conditionally-mounted dialog would. Assert on `aria-hidden`, or on the transform, or add a
  deliberate testing hook — but decide it consciously, because a naive visibility assertion here
  passes when the drawer is shut.
- **The 300ms transition** (`duration-300`) means close assertions must wait on the attribute,
  not fire immediately after the click.
- **TC_THELE_FUN_002 (no scroll when content fits) is not reachable with real content.** The
  shipped `rules.json` is far longer than any viewport. Either assert the honest inverse
  (`scrollHeight > clientHeight` with real content) or drive a tall viewport — do not stub the
  i18n dictionary to fake a short body.
- Body scroll lock is worth asserting even though no test case names it: it is real behavior with
  a real cleanup path (`saa-rules-drawer.tsx:71-77`) and it is the kind of thing that silently
  breaks.

## Requirements

**Functional** — `e2e/rules-drawer.spec.ts` covering:

- TC_THELE_GUI_001 — title, description, the 6 collectible badges, and both footer buttons.
- TC_THELE_GUI_002 — "Đóng" is outlined/secondary, "Viết KUDOS" is gold/primary.
- TC_THELE_GUI_004 — hovering each footer button changes its rendering.
- TC_THELE_FUN_001 — the panel body scrolls with real content.
- TC_THELE_FUN_003 — "Đóng" closes it and the page beneath is usable again.
- TC_THELE_FUN_004 — "Viết KUDOS" closes the drawer and opens the kudos form modal.
- TC_THELE_GUI_003 / TC_THELE_FUN_005 — the disabled pair (see Key Insights).
- Plus: body scroll locked while open, restored on close.

**Non-functional** — under 200 lines; no `waitForTimeout`; three consecutive clean runs of the
passing subset.

## Architecture

```text
e2e/rules-drawer.spec.ts
  openDrawer(page):                       ← one helper, used by every test
    goto("/about")                        (authenticated via project storageState)
    click FAB trigger                     widget-button.tsx closed pill
    click "Thể lệ"                        widget-button.tsx:82
    await drawer to report open           aria-hidden="false" on the wrapper

  GUI_001 → title, 6 badge labels, both buttons present
  GUI_002 → class/computed-style assertions on the two buttons
  GUI_004 → hover, compare computed style before/after
  FUN_001 → evaluate scrollHeight > clientHeight on the scroll container, then scroll
  FUN_003 → click "Đóng" → wrapper aria-hidden="true", body overflow restored
  FUN_004 → click "Viết KUDOS" → drawer closed AND kudos form modal open
  GUI_003 / FUN_005 → test.fixme until the disabling condition is settled
```

## Related Code Files

**Create** — `e2e/rules-drawer.spec.ts`
**Modify** — none in this phase. (If a testing hook proves genuinely necessary on the drawer
wrapper, it lands in `saa-rules-drawer.tsx` — which [phase-02](./phase-02-footer-disabled-state.md)
owns, so sequence it there rather than editing the same file from two phases.)
**Read for context** — `components/homepage/saa-rules-drawer.tsx`,
`components/homepage/widget-button.tsx`, `lib/i18n/locales/vi/rules.json`

## Implementation Steps

1. Confirm the shared fixture: `goto("/about")` must not land on `/login`.
2. Write `openDrawer()` first and prove it in one throwaway assertion. Three quarters of the
   difficulty in this spec is getting reliably to an open drawer.
3. Settle the open/closed assertion strategy explicitly (see Key Insights) and write it down in
   the spec file's docblock, so the next reader does not "fix" it into a broken `toBeVisible()`.
4. Write the seven reachable cases. They should pass.
5. Write the two disabled cases as `test.fixme`, each with a comment naming the open product
   question and linking `plan.md`.
6. Record the run: command, exit code, and which cases are skipped versus passing. If the product
   answer arrives during this phase, convert the fixmes and record the resulting genuine RED.
7. Run three times; fix any transition-timing flake.

## Todo List

- [ ] Shared fixture confirmed
- [ ] `openDrawer()` helper proven before anything else
- [ ] Open/closed assertion strategy chosen deliberately and documented in the file
- [ ] Seven reachable cases GREEN
- [ ] Disabled pair written as `test.fixme` with the open question named
- [ ] Body scroll lock and restore asserted
- [ ] FUN_002 handled honestly — no stubbed dictionary
- [ ] No `waitForTimeout`
- [ ] 3 consecutive clean runs
- [ ] `pnpm lint && pnpm typecheck` exit 0

## Success Criteria

| ID    | Criterion                                                | Method                                                            |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| SC-01 | Seven reachable cases GREEN                              | reporter output                                                   |
| SC-02 | The two disabled cases are skipped, not silently passing | reporter shows them as fixme                                      |
| SC-03 | A closed drawer fails the "open" assertion               | deliberately skip the FAB click once and confirm the spec fails   |
| SC-04 | Stable across 3 runs                                     | `for i in 1 2 3; do pnpm test:e2e e2e/rules-drawer.spec.ts; done` |

**Exact command:** `pnpm test:e2e e2e/rules-drawer.spec.ts`

SC-03 is the important one: because the drawer is always mounted, a badly written spec passes
against a shut drawer. Prove the assertion can fail before trusting that it passes.

## Risk Assessment

| Risk                                                            | Likelihood | Impact       | Countermeasure                                                                  |
| --------------------------------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------- |
| Assertions pass against a closed drawer (always-mounted DOM)    | **High**   | **Critical** | SC-03 forces a proven-failing check; strategy documented in step 3              |
| A RED manufactured by inventing a disabled trigger              | Medium     | High         | Key Insights states won't-do is a legitimate outcome; fixme rather than fiction |
| Flake on the 300ms open/close transition                        | **High**   | Medium       | Wait on `aria-hidden`, never on a fixed delay                                   |
| Failures caused by the FAB or the guard, misread as drawer bugs | Medium     | Medium       | `openDrawer()` proven independently in step 2                                   |
| Hover assertions brittle against Tailwind class churn           | Medium     | Low          | Compare computed styles, not class strings                                      |

## Security Considerations

Read-only presentational surface with no user input and no data mutation. The only sensitive
artifact is the storage state from the shared fixture, already gitignored there. The "Viết KUDOS"
case opens a form modal but must not submit one — this spec asserts the modal appears and stops.

## Next Steps

Hands its recorded state to [phase-02](./phase-02-footer-disabled-state.md), which is blocked on
the same product answer this phase parks as `fixme`.

## Rollback

`rm e2e/rules-drawer.spec.ts`. No product code changed.
