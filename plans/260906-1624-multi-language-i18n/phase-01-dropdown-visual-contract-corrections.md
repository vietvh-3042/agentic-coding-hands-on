# Phase 01 — Dropdown visual-contract corrections (G1, G2, G3)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table and open questions
- Spec of record: [`data/hUyaaugye2-specs.csv`](./data/hUyaaugye2-specs.csv) (rows A, A.1, A.2)
- Frame: [`data/hUyaaugye2-frame.json`](./data/hUyaaugye2-frame.json)
- MoMorph: <https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2>
- Implementation: `components/common/language-selector.tsx`

## Overview

**Priority:** P2
**Status:** pending
**Effort:** 1h
**Depends on:** nothing
**Resolved `test_policy`:** **`visual-contract`.** MoMorph returned **zero** test cases for
`hUyaaugye2`; the testcases CSV holds only a marker line. No test case is fabricated, and this
phase makes **no RED/GREEN claim**. Verification is visual comparison against the design frame,
plus the existing static gate.

Three chrome deviations. The dropdown's behavior and accessibility are already correct and are
explicitly **out of scope** — do not "improve" them while in here.

## Key Insights

- **This phase is blocked on two measurements, not on code.** G1 needs the exact grey ("xám đậm"
  carries no token in the spec) and G2 needs confirmation that 110×56px applies to the option
  rows rather than to the trigger cell. Both are read off the Figma frame via MoMorph. **Guessing
  either is how a "fix" becomes a new deviation.** The plan lists them as open questions.
- **A 56px option row is a real design tension, not a detail.** The header is `h-20` (80px) and
  the trigger is a `py-3` control roughly 48px tall. Two stacked 56px rows makes a 112px panel
  hanging off a 48px control. That may well be what the design shows — but if the frame turns out
  to disagree with the CSV, the frame wins and the CSV row gets flagged back to MoMorph.
- **G3 is the one unambiguous gap.** The spec says _background_ twice (A.1 "nền khác để phân
  biệt", A.2 "nền highlight") and the code distinguishes selected state by text colour alone.
  Colour-only differentiation is also the weaker accessibility choice. `aria-selected` is already
  correct, so this is purely the visual half.
- **Do not touch the behavior.** Click toggle, Esc, outside-click, cookie persistence,
  `documentElement.lang`, the `useEffect` placement of side effects, `aria-*` — all verified
  correct. Every one of them is a regression risk for zero spec benefit.
- **Tailwind ordering is enforced.** `pnpm lint:fix` runs `tailwind-lint` alongside ESLint;
  hand-ordering the new classes wastes time.
- G4 (hand-rolled vs shadcn/ui) is deliberately **not** in this phase. Migrating one dropdown to
  a primitive set that is not installed anywhere in the repo would leave the codebase in two
  styles at once. It is a single repo-wide decision, recorded in the homepage retro.

## Requirements

**Functional** — none. No behavior changes.

**Non-functional / visual**

- The trigger carries the spec's dark-grey selected surface (G1).
- Option rows match the spec's dimensions once confirmed (G2).
- The selected option is distinguished by a background, not by text colour alone (G3).
- Existing hover treatment survives and remains distinguishable from selected.
- `language-selector.tsx` stays under 200 lines (117 today).
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` exit 0.

## Architecture

No structural change whatsoever. The component keeps its shape:

```text
<div ref=rootRef>                       ← useClickOutside anchor (untouched)
  <button aria-haspopup="listbox" aria-expanded>   ← G1: add the grey surface here
      flag + label + chevron
  {open && <ul role="listbox">                     ← G2: row height/width here
      <li><button role="option" aria-selected>      ← G3: selected background here
```

**Three visual states must stay mutually distinguishable** after the change — this is the whole
risk of the phase:

| State                  | Today                     | After                                       |
| ---------------------- | ------------------------- | ------------------------------------------- |
| resting option         | transparent               | transparent                                 |
| hovered option         | `bg-white/10`             | `bg-white/10` (unchanged)                   |
| selected option        | gold text                 | gold text **+** its own background          |
| hovered _and_ selected | gold text + `bg-white/10` | must not collapse into the plain hover look |

That last row is the one that breaks silently. Check it explicitly.

## Related Code Files

**Modify** — `components/common/language-selector.tsx` (className strings only)
**Read only** — `data/hUyaaugye2-specs.csv`, `data/hUyaaugye2-frame.json`, `app/globals.css`

**Do not modify** — `lib/i18n/**` (the i18n layer is sound and out of scope),
`components/common/i18n-provider.tsx`, `app/layout.tsx`. No other phase in any of the six folders
claims this file.

## Implementation Steps

1. Pull the frame from MoMorph and read the two open measurements: the trigger's grey fill, and
   whether 110×56 governs the option rows. **Do not start until both are answered** — record the
   answers in this folder.
2. G1: add the resting background to the trigger. Keep the hover treatment layered above it, or
   the control will look inert on hover.
3. G3: add a selected background to the option row, keeping the gold text. Then walk all four
   rows of the state table above in the browser.
4. G2: apply the confirmed dimensions to the `<ul>` / `<li> button`. If the frame contradicts the
   CSV, apply the frame and note the discrepancy in `plan.md` rather than splitting the
   difference.
5. `pnpm lint:fix` to normalize Tailwind order, then the full static gate.
6. Visual check at both locales and both dropdown states, on `/about` and `/award-info` (the
   header is shared, so the change lands on every page at once).

## Todo List

- [ ] Grey token confirmed from the frame — not guessed
- [ ] 110×56 confirmed to apply to option rows — or the frame's actual values recorded
- [ ] G1 trigger surface applied; hover still visibly changes
- [ ] G3 selected background applied; gold text kept
- [ ] All four visual states verified distinct, including hovered-and-selected
- [ ] G2 dimensions applied
- [ ] No behavior, `aria-*`, cookie or `lang` code touched — diff is className-only
- [ ] `pnpm format:check && lint && typecheck && build` exit 0
- [ ] Checked on `/about` and `/award-info` (shared header)

## Success Criteria

| ID    | Criterion                                                           | Method                                            |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------- |
| SC-01 | Trigger matches the frame's selected surface                        | side-by-side visual against the Figma frame       |
| SC-02 | Option rows match the confirmed dimensions                          | DevTools box model vs the frame                   |
| SC-03 | Selected option is distinguishable with colour vision simulated off | DevTools rendering emulation (achromatopsia)      |
| SC-04 | Hovered-and-selected is distinct from hovered-only                  | manual, both rows                                 |
| SC-05 | Behavior untouched                                                  | `git diff` contains only className/style changes  |
| SC-06 | Static gate                                                         | `pnpm format:check && lint && typecheck && build` |

No e2e command is named, because no test case exists to name one for.

## Risk Assessment

| Risk                                                           | Likelihood                    | Impact | Countermeasure                                                                                       |
| -------------------------------------------------------------- | ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| The grey is guessed and the "fix" becomes a new deviation      | **High** if step 1 is skipped | Medium | Step 1 is a hard gate; both measurements recorded in the folder before any edit                      |
| Selected background swallows the hover state                   | **High**                      | Medium | The four-state table plus SC-04, checked explicitly                                                  |
| A 56px row makes the panel visually wrong under a 48px trigger | Medium                        | Medium | Confirm against the frame first; escalate a CSV/frame conflict rather than resolving it silently     |
| Behavior or a11y regressed while restyling                     | Medium                        | High   | SC-05 — the diff must be className-only                                                              |
| Change lands on four pages at once unnoticed                   | **High** (certain)            | Low    | The header is shared by `/about`, `/award-info`, `/sun-kudos`, `/login`; step 6 checks more than one |
| Scope creeps into the shadcn/ui migration                      | Medium                        | Medium | G4 is excluded here by design and lives in the homepage retro                                        |

## Security Considerations

None. Presentation-only change to a control that writes one non-sensitive cookie (`NEXT_LOCALE`,
`samesite=lax`, no auth value). No data access, no new dependency, no auth path touched.

## Next Steps

Closes G1–G3. G4 waits on the repo-wide shadcn/ui decision; G5 waits on a bundle measurement.
Neither is scheduled here.

## Rollback

`git checkout -- components/common/language-selector.tsx`. Purely visual — nothing persisted,
nothing migrated.
