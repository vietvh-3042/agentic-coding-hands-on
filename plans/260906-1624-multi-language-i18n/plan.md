---
title: "Language dropdown (VN/EN) — retrospective + gap list"
description: "What the language selector and i18n layer actually ship today measured against MoMorph screen hUyaaugye2 (3 spec rows, zero test cases)."
status: pending
priority: P3
effort: 1.5h
branch: develop
tags: [retrospective, gap-analysis, i18n, visual-contract, momorph]
created: 2026-09-06
work_type: retrospective
test_policy: visual-contract
spec_lang: en
screen: hUyaaugye2
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Dropdown-ngôn ngữ — Retrospective Plan

**This screen is already built.** MoMorph ref:
<https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2> ·
[`data/hUyaaugye2-specs.csv`](./data/hUyaaugye2-specs.csv) (3 rows).

> **`test_policy: visual-contract`, and it is not a downgrade.** MoMorph holds **zero** test
> cases for this screen — [`data/hUyaaugye2-testcases.csv`](./data/hUyaaugye2-testcases.csv)
> contains only the marker line `EMPTY — MoMorph returned no rows for hUyaaugye2`. No test cases
> are invented here and **no RED/TDD claim is made**. Every gap below is a static/visual
> deviation verified by reading the spec against the code.

## What was actually built

Larger than the screen suggests. `components/common/language-selector.tsx` (117) is the dropdown;
behind it sits a complete i18n layer: `lib/i18n/settings.ts` (29, `vi` default + fallback,
`NEXT_LOCALE` cookie, 11 namespaces) · `lib/i18n/i18n.ts` (77, `createI18nInstance(locale)` making
a **fresh instance per provider mount** so concurrent server requests never share a locale — the
correct call, worth keeping) · `components/common/i18n-provider.tsx` (30) ·
`app/layout.tsx:37-38` (server-side cookie read, so `<html lang>` and the first render agree, no
hydration flash) · `lib/i18n/locales/{vi,en}/*.json` (22 files).

| Spec row        | Built as                                                                       | Verdict                                      |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| A Dropdown-List | Trigger button + `role="listbox"` panel; click toggles; choosing closes        | behavior matches, chrome deviates (G1)       |
| A.1 VN item     | Flag `/icons/flag_vn.svg` + "VN", hover highlight                              | matches except selected chrome (G3)          |
| A.2 EN item     | Flag `/icons/flag_en.svg` + "EN", hover, closes on click, switches UI language | matches except size + active chrome (G2, G3) |

**Verified sound, beyond the spec's ask:** `aria-haspopup="listbox"` / `aria-expanded` /
`role="option"` / `aria-selected` all present and correct; Esc and outside-click close; the choice
persists to `NEXT_LOCALE` and syncs `documentElement.lang`; side effects live in a `useEffect`,
not the click handler. **Key parity is exact** — identical counts in `vi` and `en` for all 11
namespaces (12/12, 4/4, 32/32, 32/32, 6/6, 5/5, 18/18, 29/29, 16/16, 22/22, 11/11). No
missing-translation gap.

## Gap list

| #   | Gap                                                                                                                                                                                                | Sev              | Fix direction                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| G1  | Spec A: the selected region has `nền xám đậm` (dark grey). The trigger is transparent with only a `hover:bg-white/10`                                                                              | P2               | [phase-01](./phase-01-dropdown-visual-contract-corrections.md)                                                            |
| G2  | Spec A.2 fixes the EN option at **110×56px**. The rendered option is `w-28` (112px) inside `px-4 py-2` — roughly 36px tall                                                                         | P2               | [phase-01](./phase-01-dropdown-visual-contract-corrections.md)                                                            |
| G3  | Spec A.1 "selected có nền khác để phân biệt" and A.2 "active hiển thị nền highlight" both call for a **background** distinction. The code distinguishes by **text colour** (`text-[#FFEA9E]`) only | P2               | [phase-01](./phase-01-dropdown-visual-contract-corrections.md)                                                            |
| G4  | The listbox is hand-rolled where `AGENTS.md` mandates shadcn/ui + Base UI primitives                                                                                                               | P2               | Repo-wide decision — recorded once in the [homepage retro](../260706-1533-homepage-saa/plan.md) G6, not re-litigated here |
| G5  | All 22 locale JSONs are **statically imported** in `lib/i18n/i18n.ts` and bundled into every client payload; no per-namespace lazy loading                                                         | P2 _(inference)_ | Measure the bundle before acting. Do not restructure i18n on a hunch                                                      |

**Not a gap, recorded as a question:** the spec shows only the _other_ language as an option
(selected VN above, EN below); the code lists both in the panel. The spec text is ambiguous about
whether the selected row sits inside the panel or above it, and the code's behavior is the
conventional one.

## Phases

| #   | Phase                                                                                              | Owns (files)                              | Depends on | Effort | Status  |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------- | ------ | ------- |
| 01  | [Dropdown visual-contract corrections (G1–G3)](./phase-01-dropdown-visual-contract-corrections.md) | `components/common/language-selector.tsx` | —          | 1h     | pending |

One phase, one file. G4 belongs to a repo-wide decision; G5 needs a bundle measurement before it
deserves any work. Neither gets a phase.

## Unresolved questions

1. Should the panel list **both** locales, or only the non-selected one? The spec's layout
   description is ambiguous and the current behavior is defensible.
2. G2 — is 110×56px binding for the option rows, or was it measured off the Figma frame where the
   trigger and option share a cell? Confirm against the frame before forcing a 56px row that will
   look oversized next to a 40px header control.
3. G1 — what exact grey? The spec says "xám đậm" without a token. `#101417` (the panel
   background) is the obvious candidate but is a guess.
