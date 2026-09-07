# Phase 02 — Footer real icons (G2); G1 closed as won't-do

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table and open questions
- Spec row B: [`data/b1Filzi9i6-specs.csv`](./data/b1Filzi9i6-specs.csv)
- Test cases TC_THELE_GUI_003, TC_THELE_FUN_005:
  [`data/b1Filzi9i6-testcases.csv`](./data/b1Filzi9i6-testcases.csv)
- RED to satisfy: [`phase-01`](./phase-01-rules-drawer-e2e-red-gate.md#success-criteria)
- Implementation: `components/homepage/saa-rules-drawer.tsx:166-184`
- Icon idiom already in the tree: `components/common/custom-svg-icon.tsx`,
  `components/homepage/widget-button.tsx:25-40` (`IconPen`)

## Overview

**Priority:** P2 (G2 only — G1 closed)
**Status:** **DONE 2026-09-07 — G2 implemented, G1 closed as won't-do**
**Effort:** 1.5h estimated → ~0.3h actual (G1 dropped)
**Depends on:** ~~Phase 01~~ · Track B's `components/common/icon-pen.tsx` extraction (for G2) —
delivered. See [`../260907-1402-three-screen-gap-closure/plan.md`](../260907-1402-three-screen-gap-closure/plan.md)

> **RESOLVED 2026-09-07 — G1 is CLOSED AS WON'T-DO. The last row of the candidate table below is
> the outcome.** Full rationale in
> [`../260907-1402-three-screen-gap-closure/clarifications.md`](../260907-1402-three-screen-gap-closure/clarifications.md)
> → Thể lệ UPDATE.
>
> The user first selected "disabled while a KUDOS submit is in flight", but that condition is
> **architecturally unreachable for this button**: `onWriteKudos` closes the drawer before the kudos
> form opens (`widget-button.tsx` → `handleWriteKudos`), and while closed the wrapper is
> `aria-hidden` + `pointer-events-none`. The footer button is never on screen during a submit.
>
> The "generic boilerplate" hypothesis in the Key Insights below is therefore **confirmed**, not
> disconfirmed — and the honest outcome this phase file itself predicted ("If the answer is
> won't-do, say so and stop") is what happened. Decisive supporting fact: the dimmed/unclickable
> behaviour spec B asks for **already exists** at the point a submit occurs —
> `components/kudos/kudos-form-modal.tsx:181` has
> `disabled={!isValid || status === "submitting"}` with `disabled:opacity-40`.
>
> **Scope consequence:** `TC_THELE_GUI_003` and `TC_THELE_FUN_005` are recorded **N/A**. The two
> assertions phase 01 had written for them were **invalid** (they asserted `disabled` on a
> freshly-opened drawer with no submit in flight, contradicting `TC_THELE_FUN_004`) and were
> removed from `e2e/rules-drawer.spec.ts`, with the rationale left in a comment where they sat.
>
> **G2 delivered:** the footer's text glyphs `✕`/`✎` were replaced with the real X icon
> (`CustomSvgIcon src="/icons/widget-close.svg"`, which paints via `currentColor`) and the shared
> `IconPen`. Verified: `pnpm exec playwright test --project=chromium-authed e2e/rules-drawer.spec.ts`
> → **9 passed, exit 0**; `pnpm typecheck` exit 0; eslint 0 errors.

**Resolved `test_policy`:** `e2e-red-first` for the screen as a whole (phase 01 owns its 9 cases,
all green). This phase ended up making **no** behavioural change: G1's two cases are N/A, and G2 is
a presentational icon swap covered by phase 01's existing assertions. No RED was produced or
claimed here.

**Note on the Key Insights below:** they are kept as the original reasoning record, so the
"blocked by design" framing is historical. The RESOLVED block above supersedes it.

## Key Insights

- **This phase is blocked by design, and that is the correct status.** Spec B says _"Disabled là
  mờ và không nhận click"_ and two test cases exercise it, but **nothing anywhere states what
  causes it**. Not the spec, not the test cases, not the code, and there is no `clarifications.md`
  in this folder. Implementing a disabled state means inventing a trigger, and inventing product
  behavior inside a _retrospective_ is exactly the failure this exercise exists to avoid.
- **The candidate answers imply genuinely different work**, which is why guessing is expensive:

  | Candidate trigger                             | What it needs                                                                                                               |
  | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
  | "Viết KUDOS" off after the event closes       | the launch/close instant from `event_settings` — see the [countdown retro](../260708-1519-countdown-prelaunch-page/plan.md) |
  | Disabled while the kudos form submits         | state lifted out of `KudosFormModal` into the drawer's parent                                                               |
  | Disabled when a per-user quota is spent       | a `kudos` count query and a quota rule that does not exist                                                                  |
  | Nothing — the spec row is generic boilerplate | **close as won't-do**; delete the two test cases from scope                                                                 |

  The last row is a legitimate outcome. The `itemSubtype` for row B is a generic `icon_text`
  button and its description reads like a component-library blurb ("Hover thay đổi màu/độ nổi,
  Disabled là mờ và không nhận click"), which is weak evidence that no product rule was ever
  intended. **That is a hypothesis, not a finding** — it needs confirming, not assuming.

- **If the answer is "won't-do", say so and stop.** Record it in a `clarifications.md` here,
  convert phase 01's `test.fixme` pair into deleted scope with a note, and close this phase. No
  code changes. That is a complete, honest result.
- **G2 is unblocked and can proceed regardless.** `saa-rules-drawer.tsx:173` renders `✕` and
  `:181` renders `✎` as text characters. These are glyphs, not icons: they inherit font metrics,
  render differently across platforms, and ignore the design's actual artwork. The same feature's
  FAB already does this correctly — `CustomSvgIcon` for the flash and close icons, an inlined
  `IconPen` for the pen. Reuse both. `IconPen` currently lives inside `widget-button.tsx`; if the
  drawer needs it too, lift it to a shared module rather than copying it (DRY).
- **`disabled` on a `<button>` is not enough on its own.** The dimmed appearance must be a real
  visual change and the hover treatment must not fire while disabled — today's hover classes are
  unconditional and would still apply.

## Requirements

**Functional (G1, once unblocked)**

- Each footer button accepts a disabled condition.
- A disabled button renders visibly dimmed.
- A disabled button rejects clicks — no handler fires, no navigation, no modal.
- Hover restyling does not apply while disabled.
- The enabled behavior is unchanged.

**Functional (G2, unblocked now)**

- Both footer icons are real SVG artwork, matching the idiom used by `widget-button.tsx`.

**Non-functional**

- `saa-rules-drawer.tsx` stays under 200 lines (188 today — **only 12 to spare**, so if the
  disabled logic is more than trivial, extract the footer into its own component rather than
  pushing the file over).
- `pnpm format:check && lint && typecheck && build` exit 0.

## Architecture

```text
SaaRulesDrawer props
  open, onClose, onWriteKudos                 (unchanged)
  + closeDisabled?: boolean                   ← shape depends entirely on the answer
  + writeKudosDisabled?: boolean

footer button className
  base + (disabled ? "opacity-50 cursor-not-allowed" : hoverClasses)
                     ↑ dimmed                    ↑ hover must be conditional, not unconditional
  <button disabled={…}>                        ← the DOM attribute does the click rejection
```

If the answer turns out to require fetched state (event close time, quota), **the fetch does not
belong in this component**. It belongs where the drawer is mounted (`widget-button.tsx` → the
page), and arrives here as a boolean prop. Keep the drawer presentational — it is what makes it
testable.

**Sizing decision.** 188 + disabled logic + two icon swaps will approach 200. Extracting
`components/homepage/rules-drawer-footer.tsx` is the clean answer and keeps both files small.

## Related Code Files

**Modify** — `components/homepage/saa-rules-drawer.tsx`
**Create (likely)** — `components/homepage/rules-drawer-footer.tsx`; possibly
`components/common/icon-pen.tsx` if `IconPen` is lifted out of `widget-button.tsx`
**Modify (only if `IconPen` is lifted)** — `components/homepage/widget-button.tsx`
**Modify** — `e2e/rules-drawer.spec.ts` (converting the two `fixme` cases)

**Ownership warning.** `components/homepage/widget-button.tsx` is also discussed by the
[widget retro](../260716-0952-widgetbutton-open-state/plan.md) phase 01. If `IconPen` is lifted,
coordinate — one of the two phases must own that file, not both.

## Implementation Steps

1. **Get the answer.** Until then this phase does not start. Record whatever comes back in a new
   `clarifications.md` in this folder, in the `- Q: … → A: …` form.
2. If the answer is "nothing disables them": close this phase won't-do, drop the two test cases
   from scope with a written reason, and do **only** step 5 (G2). Stop.
3. Otherwise: reproduce phase 01's RED with the fixmes converted to real assertions.
4. Extract the footer into its own component, then add the disabled prop, the dimmed variant, and
   the conditional hover. Verify the disabled button fires nothing.
5. G2: replace `✕` and `✎` with real SVGs, reusing `CustomSvgIcon` and `IconPen`. Lift `IconPen`
   to a shared module if it is needed in both places — do not copy it.
6. `pnpm format:check && lint && typecheck && build`, then re-run the drawer spec GREEN.
7. `wc -l` both components — each under 200.

## Todo List

- [ ] Product answer obtained and written to `clarifications.md`
- [ ] Won't-do outcome accepted as valid and taken if that is the answer
- [ ] Footer extracted before the file crosses 200 lines
- [ ] Disabled renders dimmed
- [ ] Disabled rejects clicks — handler proven not to fire
- [ ] Hover classes conditional, not unconditional
- [ ] Enabled behavior unchanged (close still closes, write-kudos still opens the form)
- [ ] `✕` / `✎` replaced with real SVG artwork
- [ ] `IconPen` lifted rather than copied, if shared
- [ ] Both files under 200 lines
- [ ] `pnpm test:e2e e2e/rules-drawer.spec.ts` GREEN
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                                       | Method                                                            |
| ----- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| SC-01 | TC_THELE_GUI_003 GREEN — disabled button is dimmed              | e2e                                                               |
| SC-02 | TC_THELE_FUN_005 GREEN — disabled click triggers nothing        | e2e, asserting the drawer stays open and no modal appears         |
| SC-03 | Enabled path unregressed — all seven phase-01 cases still GREEN | e2e                                                               |
| SC-04 | No text glyphs remain                                           | `grep -n '✕\|✎' components/homepage/saa-rules-drawer.tsx` → empty |
| SC-05 | Size discipline                                                 | `wc -l components/homepage/*.tsx` — all under 200                 |
| SC-06 | Static gate                                                     | `pnpm format:check && lint && typecheck && build`                 |

**Exact command:** `pnpm test:e2e e2e/rules-drawer.spec.ts`

## Risk Assessment

| Risk                                                                                                   | Likelihood                    | Impact       | Countermeasure                                                       |
| ------------------------------------------------------------------------------------------------------ | ----------------------------- | ------------ | -------------------------------------------------------------------- |
| A disabling rule is invented to unblock the phase                                                      | **High** if step 1 is skipped | **Critical** | Step 1 is a hard gate; won't-do is pre-authorized as a valid outcome |
| `saa-rules-drawer.tsx` pushed past 200 lines                                                           | **High**                      | Medium       | Footer extracted first, in step 4; SC-05                             |
| Hover still fires on a disabled button                                                                 | Medium                        | Low          | Hover classes made conditional; SC-01 checks the rendered state      |
| `IconPen` copied into a second file                                                                    | Medium                        | Low          | Step 5 says lift, not copy; the widget retro is warned               |
| Fetched state (event close, quota) pulled into the drawer, coupling a presentational component to data | Medium                        | High         | Architecture states the boolean-prop boundary explicitly             |
| `widget-button.tsx` edited concurrently by the widget retro                                            | Medium                        | Medium       | Ownership warning above; one phase must claim that file              |

## Security Considerations

Presentational. A disabled button is a **UX affordance, not an authorization control** — if the
eventual rule is "this user may not write a kudos", that must be enforced on the write path
(RLS / server action), not by a dimmed button. Write that in a comment so nobody later mistakes
the visual state for a permission check.

## Next Steps

Closes G1 and G2. G4 ("danh sách thưởng") and G5 (focus trap) remain open — G4 needs the design
frame read, G5 rides on the repo-wide shadcn/ui decision in the homepage retro.

## Rollback

`git checkout -- components/homepage/` and re-mark the two e2e cases `fixme`. No data, no schema,
no persisted state involved.
