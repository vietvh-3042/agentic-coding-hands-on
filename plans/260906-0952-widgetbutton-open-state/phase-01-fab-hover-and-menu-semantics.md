# Phase 01 — Hover treatment + menu semantics (G1, G3, G2)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table and open questions
- Spec of record: [`data/Sv7DFwBw1h-specs.csv`](./data/Sv7DFwBw1h-specs.csv) (rows A, B, C)
- Frame: [`data/Sv7DFwBw1h-frame.json`](./data/Sv7DFwBw1h-frame.json) (`313:9139`)
- MoMorph: <https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/Sv7DFwBw1h>
- Implementation: `components/homepage/widget-button.tsx`

## Overview

**Priority:** P2
**Status:** completed 2026-09-07
**Effort:** 2h (was 1.5h; +0.5h for the mount work and `IconPen` extraction)
**Depends on:** nothing — **the ownership warning is settled: this phase owns
`widget-button.tsx`.** It also extracts `IconPen` into `components/common/icon-pen.tsx`, which the
rules-drawer [phase 02](../260709-1417-saa-rules-drawer/phase-02-footer-disabled-state.md) then
imports. Land this before that. See
[`../260907-1402-three-screen-gap-closure/plan.md`](../260907-1402-three-screen-gap-closure/plan.md).

> **DECISIONS 2026-09-07** — recorded in
> [`../260907-1402-three-screen-gap-closure/clarifications.md`](../260907-1402-three-screen-gap-closure/clarifications.md).
>
> - **G4 answered — mount the FAB on `/award-info` and `/sun-kudos` as well as `/about`**, and fix
>   the docblock at `app/award-info/page.tsx:29` that already claims a FAB it does not render.
>   This was a product question with no phase; it now belongs to this phase.
>   Files added to this phase's ownership: `app/award-info/page.tsx`, `app/sun-kudos/page.tsx`.
> - **G2 closed as by-design — do NOT apply a fixed 149px width.** The 64px height (`h-16`) is
>   exact and stays. The width must remain content-driven (`px-4` + label): a hard 149px truncates
>   the English label "SAA Rules". Nothing to implement for G2.
> - **G3 stays in scope but stops short of roving focus** — `role="menu"`/`menuitem` plus keeping an
>   `aria-expanded` element mounted while open. `components/ui/` now exists, so a full roving-focus
>   menu should come from a primitive later rather than be hand-built here twice.
>   **Resolved `test_policy`:** **`visual-contract`.** MoMorph returned **zero** test cases for
>   `Sv7DFwBw1h`; the testcases CSV holds only a marker line. No test case is fabricated and this
>   phase makes **no RED/GREEN claim**. Verification is visual comparison against the frame, a
>   keyboard/screen-reader pass, and the existing static gate.

Two spec-mandated hover states are missing, the expanded group has no menu semantics, and one
dimension needs confirming before it can be applied.

## Key Insights

- **G1 is the clearest gap on this screen and the cheapest to close.** Both spec rows name hover
  explicitly — A: _"Hover: tăng nhẹ shadow"_, B: _"Hover: tăng bóng nhẹ và đổi độ sáng"_ — and
  the pills at `:82-109` carry no `hover:` class at all. `PILL_SHADOW` is applied as an inline
  `style` object (`:21-23`), so a Tailwind `hover:shadow-*` class **will not override it** —
  inline styles win. Either move the base shadow into a class, or express the hover state as a
  CSS-variable swap. Adding `hover:shadow-lg` next to an inline `boxShadow` produces no visible
  change and looks like a working fix. That is the trap in this phase.
- **G3 is a half-implemented promise, not a missing nicety.** `:128-129` puts
  `aria-haspopup="menu"` and `aria-expanded={isOpen}` on the closed trigger — then `:79` swaps
  that button out entirely when open. A screen-reader user is told a menu is opening and the
  announcing element vanishes; focus lands nowhere; nothing has `role="menu"`. Either honour the
  contract (keep an element that owns the expanded state, give the three controls menu roles,
  move focus in and restore it on close) or drop `aria-haspopup` so nothing false is announced.
  **Half is worse than either whole.**
- **G3 may be better deferred than built.** A correct roving-focus menu is most of a component.
  If the repo-wide shadcn/ui decision (homepage retro G6) lands, a Base UI primitive supplies it.
  Hand-building it now and migrating later means writing it twice. **Check the status of that
  decision before starting G3**; G1 and G2 do not depend on it and can proceed either way.
- **G2 is blocked on a measurement and a locale check.** 149px is the CSV's number; the frame is
  authoritative. And a fixed width must survive both labels — `common:widget.saaRules` is "Thể
  lệ" (vi) and its English counterpart is longer. A fixed 149px that truncates English is a
  worse outcome than today's content-driven width. Confirm, then check both locales, then apply.
- **Do not touch the fixed-position deviation.** The docblock at `:50-53` explains why the Figma
  `top: 830px` anchor is not applied literally. That reasoning is correct; "fixing" it to match
  the mockup would break the control across viewports.
- **Out of scope by design:** the closed trigger's styling (not in this spec — this screen is the
  open state), the pen icon's inline-vs-asset idiom (an inconsistency, not a spec deviation), and
  mounting the FAB on other routes (G4, a product question).

## Requirements

**Functional**

- Hovering either action pill produces the spec's shadow/brightness change (G1).
- The expanded group either carries coherent menu semantics with focus management, or stops
  claiming `aria-haspopup="menu"` (G3) — one or the other, decided deliberately.
- Keyboard: Tab reaches all three controls when open; Esc still collapses (already works).

**Non-functional / visual**

- The "Thể lệ" pill matches the frame's confirmed width in **both** locales (G2).
- `widget-button.tsx` stays under 200 lines (167 today — 33 to spare; if menu semantics need more
  than that, extract rather than overflow).
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm build` exit 0.

## Architecture

```text
current                                    after
─────────────────────────────────────────  ────────────────────────────────────────────
<div fixed bottom-6 right:19px>            <div fixed …>
  isOpen ?                                   isOpen ?
    <button ACTION_PILL style=PILL_SHADOW>     <div role="menu" aria-label=…>   ← G3
    <button ACTION_PILL style=PILL_SHADOW>       <button role="menuitem" hover:…>  ← G1
    <button rounded-full red ×>                  <button role="menuitem" hover:…>
  :                                              <button aria-label=close>
    <button aria-haspopup="menu"                 focus moves to first item on open,
            aria-expanded={isOpen}>              restores to the trigger on close
```

**The shadow problem, concretely.** `PILL_SHADOW` is an inline style. Any hover expressed as a
Tailwind class is overridden by it and silently does nothing. Two workable routes:

| Route                                                                                 | Cost                                                                   |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Move the base shadow into the `ACTION_PILL` class string, then add `hover:shadow-[…]` | Tailwind arbitrary values for both states; `tailwind-lint` normalizes  |
| Keep the inline style but drive it from a CSS variable the hover class swaps          | One extra indirection, but keeps the verbatim Figma value in one place |

Pick one and state why in a comment. Do not leave both shapes in the file.

## Related Code Files

**Modify** — `components/homepage/widget-button.tsx`
**Read only** — `data/Sv7DFwBw1h-specs.csv`, the MoMorph frame, `lib/i18n/locales/*/common.json`
(the two label strings), `app/globals.css`

**Do not modify** — `components/homepage/saa-rules-drawer.tsx`,
`components/kudos/kudos-form-modal.tsx` (both owned by other plan folders).

**Ownership warning.** The rules-drawer retro's
[phase-02](../260709-1417-saa-rules-drawer/phase-02-footer-disabled-state.md) may lift `IconPen`
out of this same file. **Exactly one phase may own `widget-button.tsx`.** Settle it before either
starts; running both concurrently guarantees a clobber.

## Implementation Steps

1. Check whether the repo-wide shadcn/ui decision has landed. If it has, G3 should use the
   primitive rather than a hand-built menu — and this step changes the shape of the whole phase.
2. Confirm the file's ownership against the rules-drawer phase 02.
3. Read the frame for G2's width, then render both locales and check the longer label fits.
   If it does not, **stop and escalate** rather than truncating.
4. G1: choose one of the two shadow routes, apply it to both pills, and verify in the browser
   that the hover actually renders — the inline-style override makes a no-op fix look done.
5. G3: implement the chosen option (full menu semantics, or remove `aria-haspopup`). If full
   semantics, move focus to the first item on open and restore it to the trigger on close.
6. Keyboard pass: Tab through all three, Esc to close, confirm focus returns to the trigger.
7. Screen-reader pass on the open/close announcement.
8. `pnpm lint:fix` for Tailwind ordering, then the full static gate.

## Todo List

- [ ] shadcn/ui decision status checked before touching G3
- [ ] File ownership settled against the rules-drawer phase 02
- [ ] G2 width read from the frame, both locales verified to fit
- [ ] G1 hover **visually confirmed in the browser**, not just present in the source
- [ ] Only one shadow idiom left in the file
- [ ] G3 resolved coherently — full semantics or `aria-haspopup` removed, not left half
- [ ] Focus moves in on open and returns to the trigger on close (if full semantics)
- [ ] Tab reaches all three controls; Esc still collapses
- [ ] Fixed-position deviation left alone
- [ ] File under 200 lines
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                                                 | Method                                                          |
| ----- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| SC-01 | Hovering either pill visibly changes its shadow/brightness                | manual, both pills, DevTools computed style before/after        |
| SC-02 | The rendered hover matches the frame's hover treatment                    | side-by-side visual                                             |
| SC-03 | "Thể lệ" pill matches the confirmed width in vi **and** en, no truncation | DevTools box model, both locales                                |
| SC-04 | Open/close is announced coherently                                        | screen-reader pass                                              |
| SC-05 | Focus enters the group on open, returns to the trigger on close           | keyboard pass                                                   |
| SC-06 | Close button still 56×56 `#D4271D`                                        | DevTools — regression check on the one row that already matched |
| SC-07 | Static gate                                                               | `pnpm format:check && lint && typecheck && build`               |

No e2e command is named, because no test case exists to name one for.

## Risk Assessment

| Risk                                                                                | Likelihood | Impact | Countermeasure                                                                               |
| ----------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| `hover:` class added beside the inline `boxShadow`, silently doing nothing          | **High**   | Medium | Called out twice above; SC-01 requires a _visually confirmed_ change, not a source-level one |
| A hand-built roving-focus menu is written and then discarded on shadcn/ui migration | Medium     | Medium | Step 1 checks that decision first; deferring G3 is an acceptable outcome                     |
| A fixed 149px truncates the English label                                           | Medium     | Medium | Step 3 stops and escalates rather than truncating; SC-03 covers both locales                 |
| `aria-haspopup` left in place with no menu behind it                                | Medium     | Medium | The half-implemented state is explicitly rejected in Key Insights; SC-04                     |
| Concurrent edit with the rules-drawer phase 02 clobbers the file                    | Medium     | High   | Step 2 gate; ownership warning in both plans                                                 |
| The considered fixed-position deviation "corrected" to match the mockup             | Low        | High   | Listed as out of scope and as a todo item; the docblock explains the reasoning               |

## Security Considerations

None. Presentation and accessibility only. The FAB triggers two client-side modals and performs
no data access, no navigation to an external origin, and no state mutation. No dependency is
added.

## Next Steps

Closes G1–G3. G4 (which routes mount the FAB) is a product question and G5 (MoMorph
`dev_status`) is housekeeping on the design side — neither is code work and neither is scheduled
here.

## Rollback

`git checkout -- components/homepage/widget-button.tsx`. Purely visual and semantic; nothing
persisted, nothing migrated.
