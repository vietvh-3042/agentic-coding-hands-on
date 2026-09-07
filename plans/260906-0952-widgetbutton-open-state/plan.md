---
title: "Floating action button, open state — retrospective + gap list"
description: "What the FAB's expanded state actually ships today measured against MoMorph screen Sv7DFwBw1h (3 spec rows, zero test cases)."
status: completed
priority: P3
effort: 1.5h → 2h (scope extended: mount work)
branch: develop
tags: [retrospective, gap-analysis, fab, widget, visual-contract, momorph]
created: 2026-09-06
work_type: retrospective
test_policy: visual-contract
spec_lang: en
screen: Sv7DFwBw1h
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Floating Action Button — open state — Retrospective Plan

**This screen is already built.** MoMorph ref:
<https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/Sv7DFwBw1h> ·
[`data/Sv7DFwBw1h-specs.csv`](./data/Sv7DFwBw1h-specs.csv) (3 rows) ·
frame `313:9139` "Floating Action Button - phim nổi chức năng 2".

> **`test_policy: visual-contract`, and it is not a downgrade.** MoMorph holds **zero** test
> cases for this screen — [`data/Sv7DFwBw1h-testcases.csv`](./data/Sv7DFwBw1h-testcases.csv)
> contains only `EMPTY — MoMorph returned no rows for Sv7DFwBw1h`. No test cases are invented and
> **no RED/TDD claim is made**. Every gap below is a static/visual deviation read off the spec
> against the code.

## What was actually built

`components/homepage/widget-button.tsx` (167 lines) — a viewport-fixed control at
`bottom-6 / right: 19px`, mounted on **`/about` only**. Closed it is one gold pill; open it becomes
the three controls this screen specifies.

| Spec row            | Built as                                                                                                                        | Verdict                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A Button thể lệ     | `:82-94` — gold pill (`ACTION_PILL`, `h-16` = 64px), `widget-flash.svg` + `t("common:widget.saaRules")`, opens `SaaRulesDrawer` | matches; width (G2), hover (G1) |
| B Button viết kudos | `:97-109` — same pill, inlined `IconPen` + `t("common:widget.writeKudos")`, opens `KudosFormModal`                              | matches; hover (G1)             |
| C Button hủy        | `:112-121` — `h-14 w-14` (**56×56 ✓**), `#D4271D` ✓, white `widget-close.svg` ×, shadow ✓                                       | matches                         |

**Verified sound:** all three controls exist with the right actions; the close button's 56×56 and
red fill are exact; labels are i18n; outside-click and Esc collapse the group; `aria-label` on the
close button. The docblock's fixed-position reasoning (Figma anchors this at `top: 830px` on the
page frame; the code pins to the viewport keeping `right: 19px`) is a considered, documented
deviation — **not a gap.**

## Gap list

**All gaps from 260716 are resolved.** Status as of 2026-09-07:

| #   | Gap                                                                        | Sev | Status                                                                                                                                                                |
| --- | -------------------------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Hover treatment on action pills                                            | P2  | ✅ DONE — phase 01 delivered                                                                                                                                          |
| G2  | Width of action pills (149px proposal)                                     | P2  | ❌ by-design — fixed width truncates English label. See session [`G2`](../260907-1402-three-screen-gap-closure/clarifications.md#floating-action-button-sv7dfwbw1h)   |
| G3  | Menu semantics on expanded FAB group                                       | P2  | ✅ DONE — phase 01 delivered                                                                                                                                          |
| G4  | FAB mount coverage (should mount on `/award-info`, `/sun-kudos`)           | P2  | ✅ DONE — mounted on all three pages, docblock fixed. See session [`G4`](../260907-1402-three-screen-gap-closure/clarifications.md#floating-action-button-sv7dfwbw1h) |
| G5  | MoMorph's frame reports `dev_status: "none"` for a screen that has shipped | P2  | Housekeeping — update the screen status in MoMorph                                                                                                                    |

**Not gaps, recorded so they are not "fixed" later:** the closed trigger pill is absent from this
spec entirely (this screen is the _open_ state, "chức năng 2"), so its styling has no contract
here; the inlined `IconPen` (`:25-40`) beside two `public/icons/widget-*.svg` assets is an idiom
inconsistency, not a spec deviation. **Neighbour owned elsewhere:** this FAB opens
`components/kudos/kudos-form-modal.tsx` — **263 lines**, over the ceiling, belonging to
`plans/260709-1540-kudos-write-form/`.

## Phases

| #   | Phase                                                                                       | Owns (files)                            | Depends on | Effort | Status    |
| --- | ------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- | ------ | --------- |
| 01  | [Hover treatment + menu semantics (G1, G3, G2)](./phase-01-fab-hover-and-menu-semantics.md) | `components/homepage/widget-button.tsx` | —          | 2h     | completed |

One phase, one file. G4 is a product question and G5 is MoMorph housekeeping — neither is code
work, so neither gets a phase.

**File-ownership warning:** `widget-button.tsx` is also a candidate edit in the rules-drawer
retro's [phase-02](../260709-1417-saa-rules-drawer/phase-02-footer-disabled-state.md) (lifting
`IconPen` into a shared module). Exactly one of the two may own this file — settle it first.

## Unresolved questions

1. **G2** — is 149px binding, and what happens to the English label? A fixed width that truncates
   "SAA Rules" is worse than today's content-driven width. Read the frame, check both locales.
2. **G4** — should the FAB appear on `/award-info` and `/sun-kudos`? Either way,
   `app/award-info/page.tsx`'s docblock is currently wrong.
3. **G3** — how far should menu semantics go? Roving focus is most of a component. If the
   repo-wide shadcn/ui decision ([homepage retro](../260706-1533-homepage-saa/plan.md) G6) lands
   first, a primitive supplies it — better to wait than hand-build it twice.
