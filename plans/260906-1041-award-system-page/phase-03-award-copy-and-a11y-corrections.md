# Phase 03 — Copy + a11y corrections (G1, G3, G5, G6)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table
- RED to satisfy: [`phase-02`](./phase-02-award-screen-e2e-red-gate.md#success-criteria)
- Spec rows D.1–D.6: [`data/zFYDgyj_pD-specs.csv`](./data/zFYDgyj_pD-specs.csv)
- Test case ID-6: [`data/zFYDgyj_pD-testcases.csv`](./data/zFYDgyj_pD-testcases.csv)

## Overview

**Priority:** P1 (G1) / P2 (G3, G5, G6)
**Status:** pending
**Effort:** 0.75h
**Depends on:** Phase 02 (recorded RED)
**Resolved `test_policy`:** `e2e-red-first` — this phase exists to turn phase 02's recorded
assertion failure GREEN.

Four small corrections, all textual or attribute-level. No layout, no logic, no new component.

## Key Insights

- **G1 is the only one that is a defect.** Spec D.1 reads
  `quantity 'Số lượng giải thưởng: 10 Đơn vị'` and TC ID-6 restates it as
  `Top Talent (10 Đơn vị, …)`. `lib/i18n/locales/vi/awards.json` ships `"quantityUnit": "Cá
nhân"`. The other five awards' units _do_ match their spec rows — this is a single-key slip,
  not a systematic mistranslation.
- **The English side is not automatically wrong.** `en/awards.json` has `"Individual"` for
  top-talent. "Đơn vị" ≈ "unit/entity", which is not "Individual". Whether EN should become
  "Unit" is a copy decision, not a mechanical mirror of the VI fix — flag it rather than guess.
  Note the key-count parity (32 = 32) must survive whatever is chosen.
- **G3 ("VND" → "VNĐ") touches code, not locales.** The amounts live in the `AWARDS` array in
  `components/awards/award-detail-section.tsx`, deliberately outside i18n because they are
  numerals. Six strings, one file.
- **G5 is a correctness fix, not a preference.** `aria-current="true"` is not in the enumerated
  token list; assistive tech falls back to `"true"` meaning _unspecified_. `nav-links.tsx:34`
  already models the right answer (`"page"`) — `category-nav.tsx:79` should match it. Within one
  screen the same idea is currently expressed two ways (DRY).
- **G6 is a stale comment, nothing more.** `app/award-info/page.tsx:29` promises a widget button;
  `grep -rn "WidgetButton" app` returns only `app/about/page.tsx`. Deleting the clause is the fix
  — do **not** "resolve" it by adding a FAB nobody specified for this screen (YAGNI).

## Requirements

**Functional**

- G1 — `awards:items.top-talent.quantityUnit` (vi) renders "Đơn vị".
- G3 — all six prize amounts render "VNĐ".
- G5 — every `CategoryNav` item uses `aria-current="page"` when active.
- G6 — the page docblock describes what the file actually renders.

**Non-functional**

- vi/en key parity stays 32/32.
- No file grows past 200 lines (all four are well under).
- `pnpm format:check && pnpm lint && pnpm typecheck` exit 0.

## Architecture

No structural change. Data flow is untouched:

| In                                    | Transform                     | Out                                |
| ------------------------------------- | ----------------------------- | ---------------------------------- |
| `AWARDS` const (numerals, image refs) | spread into `AwardDetailData` | `AwardDetailCard` props            |
| `awards:items.<id>.*` (i18n)          | `t()` at render               | title / description / quantityUnit |

G1 moves one leaf value inside the second row. G3 moves six leaf values inside the first.

## Related Code Files

**Modify**

- `lib/i18n/locales/vi/awards.json` — G1, one key
- `lib/i18n/locales/en/awards.json` — G1 counterpart, **only if the copy question is answered**
- `components/awards/award-detail-section.tsx` — G3, six `amount` strings
- `components/awards/category-nav.tsx` — G5, line 79
- `app/award-info/page.tsx` — G6, docblock only

**Do not modify** — `components/awards/award-detail-card.tsx` (renders whatever it is handed;
nothing to fix there), `components/homepage/sunkudos-section.tsx` (owned by the homepage retro).

## Implementation Steps

1. Re-run phase 02's command and confirm the same single failure is still present.
2. G1: `"Cá nhân"` → `"Đơn vị"` for `items.top-talent.quantityUnit` in `vi/awards.json` only.
3. Re-run. ID-6 must now be GREEN and every other case must stay GREEN.
4. G3: six `amount` values `"… VND"` → `"… VNĐ"` in `award-detail-section.tsx`. If phase 02's
   ID-6 asserts the amount strings, they were written from the CSV and will already expect
   "VNĐ" — in which case step 4 clears a second recorded failure rather than passing vacuously.
5. G5: `aria-current={isActive ? "page" : undefined}`.
6. G6: rewrite the docblock's last sentence to name only `SunkudosSection` and `SiteFooter`.
7. `pnpm format:check && pnpm lint && pnpm typecheck`, then the full `pnpm test:e2e`.

## Todo List

- [ ] Phase 02 RED reproduced before any edit
- [ ] G1 fixed in `vi/awards.json`; ID-6 GREEN
- [ ] EN counterpart decided by a human, or explicitly deferred with the question left open
- [ ] vi/en key parity still 32/32
- [ ] G3 applied to all six amounts
- [ ] G5 `aria-current="page"`
- [ ] G6 docblock corrected; no FAB added
- [ ] `pnpm test:e2e` fully GREEN
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck` exit 0

## Success Criteria

| ID    | Criterion                                                   | Method                                                  |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------- |
| SC-01 | `pnpm test:e2e e2e/award-system.spec.ts` exits 0            | exit code                                               |
| SC-02 | vi/en key parity holds                                      | the parity script in the plan report, or a manual count |
| SC-03 | `grep -n 'VND' components/awards/award-detail-section.tsx`  | zero hits                                               |
| SC-04 | `grep -n 'aria-current' components/awards/category-nav.tsx` | shows `"page"`                                          |
| SC-05 | `grep -n 'widget' app/award-info/page.tsx`                  | zero hits                                               |
| SC-06 | Static gate                                                 | `pnpm format:check && pnpm lint && pnpm typecheck`      |

## Risk Assessment

| Risk                                                                     | Likelihood | Impact | Countermeasure                                                                                               |
| ------------------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| EN copy changed to mirror VI without a decision, producing wrong English | Medium     | Medium | Listed as an unresolved question in `plan.md`; the todo demands a human answer or an explicit deferral       |
| "VNĐ" trips the Vietnamese subset in the loaded font                     | Low        | Low    | `Montserrat` is loaded with `subsets: ["latin","vietnamese"]` in `app/award-info/page.tsx:13` — Đ is covered |
| Editing `sunkudos-section.tsx` here collides with the homepage retro     | Low        | Medium | Explicitly excluded above; that file belongs to `260706-1533-homepage-saa`                                   |
| A vacuous GREEN because the spec was written from the code               | Medium     | High   | Phase 02 step 3 + this phase's step 1 (reproduce RED first)                                                  |

## Security Considerations

None — four string/attribute edits on a read-only public-facing screen. No auth path, no
user-supplied data, no new dependency.

## Next Steps

Closes the award-system gap list except G4 (route naming), which is blocked on a product answer
and deliberately carries no phase.

## Rollback

`git checkout -- lib/i18n/locales/vi/awards.json components/awards app/award-info`. Each edit is
independent; any one can be reverted without touching the others.
