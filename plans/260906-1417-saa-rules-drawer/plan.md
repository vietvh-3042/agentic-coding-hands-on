---
title: "SAA rules drawer (Thể lệ) — retrospective + gap list"
description: "What the Thể lệ drawer actually ships today measured against MoMorph screen b1Filzi9i6 (4 spec rows, 9 test cases), including the untested disabled footer state."
status: completed
priority: P2
effort: 3.5h → 2.3h (G1 closed as won't-do, only G2 forged)
branch: develop
tags: [retrospective, gap-analysis, rules, drawer, e2e, momorph]
created: 2026-09-06
work_type: retrospective
test_policy: e2e-red-first
spec_lang: en
screen: b1Filzi9i6
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Thể lệ UPDATE — Rules Drawer — Retrospective Plan

**This screen is already built.** MoMorph ref:
<https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6> ·
[`data/b1Filzi9i6-specs.csv`](./data/b1Filzi9i6-specs.csv) (4 rows) ·
[`data/b1Filzi9i6-testcases.csv`](./data/b1Filzi9i6-testcases.csv) (9 cases).

## What was actually built

`components/homepage/saa-rules-drawer.tsx` (188 lines) — a right-side slide-in panel over a
dimmed backdrop, opened from the floating widget's "Thể lệ" action
(`components/homepage/widget-button.tsx:82-94`). Content comes from
`lib/i18n/locales/{vi,en}/rules.json` (18 keys each, parity exact).

| Spec row                | Built as                                                                                                             | Verdict                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A Panel nội dung thể lệ | `<aside role="dialog" aria-modal="true">`, title + 3 content sections + 6 collectible badges, `overflow-y-auto` body | matches, one ambiguity (G4)                 |
| B Footer modal          | Sticky footer, two buttons, both with hover treatments                                                               | matches except disabled (G1) and icons (G2) |
| B.1 Đóng                | Secondary/outlined, `border-white/40`, closes the panel                                                              | matches except icon (G2)                    |
| B.2 Viết KUDOS          | Primary gold `bg-[#FFEA9E]`, closes the drawer then opens the kudos form via `onWriteKudos`                          | matches except icon (G2)                    |

**Verified sound:** closes on backdrop click, Esc, and the button; body scroll locked while open
and restored on cleanup; the panel scrolls only when content overflows (satisfying TC_THELE_FUN_001
and _002); both footer buttons have real hover restyles (TC_THELE_GUI_004); dialog `aria-label`;
all 4 hero tiers and 6 collectibles render.

## Gap list

**All gaps from 260709 — Resolution status 2026-09-07:**

| #   | Gap                                                                | Sev | Status                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Disabled state on footer buttons while a KUDOS submit is in flight | P1  | ❌ **CLOSED as won't-do.** Architecturally unreachable — drawer closes before form opens. See session [`G1`](../260907-1402-three-screen-gap-closure/clarifications.md#th-l-update-b1filzi9i6)                |
| G2  | Footer icons (X and pen, not text glyphs)                          | P2  | ✅ **DONE** — real icons delivered. See session [`G2`](../260907-1402-three-screen-gap-closure/clarifications.md#th-l-update-b1filzi9i6)                                                                      |
| G3  | E2E coverage for 9 test cases (5 behavioral)                       | P1  | ✅ **DONE** — phase 01 e2e gate passed. See session [`E2E gate`](../260907-1402-three-screen-gap-closure/clarifications.md#th-l-update-b1filzi9i6)                                                            |
| G4  | "Danh sách thưởng" (prize list) — is it rendered or missing?       | P2  | ✅ **CLOSED as not a gap.** Frame read; drawer matches 1:1. Rewards in section prose, not separate list. See session [`G4`](../260907-1402-three-screen-gap-closure/clarifications.md#th-l-update-b1filzi9i6) |
| G5  | Dialog missing focus trap, initial focus, focus restore            | P2  | ⏳ **OPEN** — deferred to shadcn/ui primitive rollout (not this batch)                                                                                                                                        |

**Neighbour worth flagging, owned elsewhere:** the "Viết KUDOS" button hands off to
`components/kudos/kudos-form-modal.tsx`, which is **263 lines** — over the 200-line ceiling. It
belongs to `plans/260709-1540-kudos-write-form/`, not here.

## Phases

| #   | Phase                                                                    | Owns (files)                               | Depends on                                                                                                | Effort | Status    |
| --- | ------------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------ | --------- |
| 01  | [Rules drawer e2e RED gate](./phase-01-rules-drawer-e2e-red-gate.md)     | `e2e/rules-drawer.spec.ts`                 | award-system [phase-01](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md) | 2h     | completed |
| 02  | [Footer icons (G2 only; G1 closed)](./phase-02-footer-disabled-state.md) | `components/homepage/saa-rules-drawer.tsx` | 01, Track B `components/common/icon-pen.tsx` extraction                                                   | 0.3h   | completed |

The authenticated storage-state fixture is a **shared prerequisite** documented once in the
[award-system folder](../260708-1041-award-system-page/phase-01-authenticated-storage-state-fixture.md).
It matters most here: the drawer opens only from the FAB, the FAB mounts only on `/about`, and
`/about` is guarded. G2 folds into phase 02 (same file) rather than taking a phase of its own.

## Unresolved questions

1. **G1 — what disables a footer button?** Nothing in the spec, the test cases or the code says.
   Plausible candidates: "Viết KUDOS" disabled after the event closes; disabled while the kudos
   form is submitting; disabled for a user who has exhausted a quota. Each implies different
   state plumbing. **Phase 02 cannot start without an answer**, and inventing one would put
   fictional behavior into a retrospective.
2. **G4 — what is "danh sách thưởng"?** Is it the hero-tier list already rendered, or a genuinely
   missing section? Read the frame before adding anything.
3. Does the drawer need to be reachable from `/award-info` and `/sun-kudos`? The FAB that opens
   it is mounted only on `/about` — see the [homepage retro](../260706-1533-homepage-saa/plan.md)
   G8 and the [widget retro](../260716-0952-widgetbutton-open-state/plan.md).
