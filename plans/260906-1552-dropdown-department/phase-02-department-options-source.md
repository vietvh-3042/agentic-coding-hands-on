# Phase 02 — DB-sourced options; retire the hardcoded constant

## Context Links

- Plan overview: [`plan.md`](./plan.md) · schema: [`phase-01`](./phase-01-departments-schema.md)
- Spec: [`data/WXK5AYB_rG-specs.csv`](./data/WXK5AYB_rG-specs.csv) rows `mms_A_Dropdown-List`,
  `mms_A.1`–`mms_A.3`
- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/WXK5AYB_rG
- Shared decisions: [`../260906-1903-profile-and-menus/clarifications.md`](../260906-1903-profile-and-menus/clarifications.md) (Q10)

## Overview

**Priority:** P2 · **Status:** pending · **Effort:** 1.5h · **Depends on:** 01
**test_policy:** **`visual-contract`** — zero MoMorph test cases for this screen. No RED, no TDD,
nothing fabricated. `tester` owns the post-code browser/visual validation.

Swap the option source: `constants/index.ts`'s four hardcoded CEVC rows out, a query against
`public.departments` in. The dropdown's _appearance_ and _interaction_ are unchanged from what
`highlight-filter-dropdown.tsx` already renders; only where the options come from changes.

## Key Insights

- **`IOption.value` is `number`; `departments.id` is `uuid`.** `constants/index.ts` declares
  `IOption { label: string; value: number }` and both `SAA_HASHTAGS` and `DEPARTMENTS` use it, and
  `highlight-filter-dropdown.tsx` is typed `selected: number | null`. A uuid does not fit. Batch A's
  F005 is solving exactly this problem for the hashtag axis — **adopt whatever shape F005 lands on
  rather than inventing a second one.** If F005 has not landed when this phase starts, widen
  `IOption.value` to `string | number` in one place; do not fork the dropdown component.
- **`departmentLabel(value: number)` has exactly one caller** —
  `components/kudos-board/highlight-kudo-card.tsx:41`, `departmentLabel(person.department)`. Retiring
  the constant is therefore a two-file change, not a sweep. Grep before assuming otherwise.
- **The list is 50 entries and the design's box is 101×348px** with six visible rows. The dropdown
  needs a scroll region; four hardcoded rows never did. This is the one genuinely new _visual_
  requirement in this phase.
- **The design shows `CEVC2` selected with `CEVC3, CEVC4, CEVC1, OPD, Infra` below it** — neither in
  master-list order nor alphabetical. Treat it as an illustrative render, not an ordering rule;
  `sort_order` from phase 01 is the ordering. `OPD` and `Infra` are the Q2 mismatch.
- The department options are needed in **two** places — the board filter and (through
  `profiles.department_id`) the profile hero. Only the board needs the _list_; the hero needs a
  single joined label. Do not build a shared client-side store for one list (YAGNI).

## Requirements

**Functional**

- FR-D201 — `getDepartments()` returns all rows ordered by `sort_order`, from `public.departments`.
- FR-D202 — `constants/index.ts` no longer exports `DEPARTMENTS`, and `departmentLabel()` is either
  removed or re-pointed; no hardcoded department string remains in the tree.
- FR-D203 — the dropdown renders all 50 options in a scrollable region matching the design's box.
- FR-D204 — the selected item keeps the design's raised/highlighted treatment; hover shows the
  pointer and the light lift; centre-aligned text (`mms_A.1`–`A.3`).
- FR-D205 — picking an option closes the dropdown (the filter _effect_ is phase 03).

**Non-functional**

- The query lives in `lib/departments/`, server-side; no component queries Supabase directly.
- No second dropdown component. `highlight-filter-dropdown.tsx` is reused as-is except for the value
  type and the scroll region.

## Architecture

```text
app/sun-kudos/page.tsx (server)
  const departments = await getDepartments()      ← lib/departments/queries.ts
        │  passed down as options
        ▼
HighlightSection (client)  ← Batch A F005 owns the state lift; phase 03 owns this wiring
        ▼
HighlightFilterDropdown    options: IOption[]     ← unchanged component, scrollable list
```

**Data flow**

| In                   | Transform                                         | Out                                |
| -------------------- | ------------------------------------------------- | ---------------------------------- |
| `public.departments` | `select id, name, sort_order order by sort_order` | 50 options                         |
| option list          | passed as a prop from the server page             | rendered menu                      |
| click                | `onSelect(value)`                                 | menu closes; filtering is phase 03 |

## Related Code Files

**Create**

- `lib/departments/queries.ts` (~30, server-only)
- `lib/departments/types.ts` (~15) — only if F005's shared option type does not already cover it

**Modify**

- `constants/index.ts` — remove `DEPARTMENTS`, remove or re-point `departmentLabel`
- `components/kudos-board/highlight-kudo-card.tsx` — the single `departmentLabel` call site
- `components/kudos-board/highlight-filter-dropdown.tsx` — value type + `max-h` scroll region
  (**shared with Batch A F005 — coordinate; if F005 is in flight, wait**)

**Read for context (do not modify)**

- `components/kudos-board/highlight-section.tsx` — phase 03 owns its edits, not this phase

## Implementation Steps

1. Confirm phase 01 applied: `select count(*) from public.departments` → `50`.
2. Check whether A-F005 has landed a shared option type. If yes, adopt it. If no, widen
   `IOption.value` to `string | number` in `constants/index.ts` — one line, one place.
3. `lib/departments/queries.ts` — `getDepartments()`, explicit column list, `order by sort_order`.
4. Remove `DEPARTMENTS`. Fix the one `departmentLabel` call site — with a real join, the card should
   render the joined name rather than look a label up from an id.
5. Add the scroll region to the dropdown's menu (`max-h` + `overflow-y-auto`), sized from the
   design's 101×348 box. Pull the exact values through the MoMorph MCP; **invent nothing**.
6. `pnpm lint && pnpm typecheck && pnpm format:check && pnpm build`.
7. Hand to `tester` for the visual contract against the MoMorph frame.

## Todo List

- [ ] `departments` confirmed populated (50)
- [ ] Option-type shape adopted from A-F005, or widened in one place
- [ ] `getDepartments()` server-side, explicit columns, `sort_order` ordering
- [ ] `DEPARTMENTS` removed; `grep -rn "DEPARTMENTS\|departmentLabel"` returns only intended hits
- [ ] `highlight-kudo-card.tsx` call site fixed
- [ ] Scroll region added; all 50 reachable
- [ ] Selected / hover / centre-aligned treatments match the spec rows
- [ ] Visual values traced to MoMorph, none invented
- [ ] No second dropdown component created
- [ ] `pnpm validate` exits 0
- [ ] `tester` visual verdict recorded

## Success Criteria

| ID      | Criterion               | Method                                                                                  |
| ------- | ----------------------- | --------------------------------------------------------------------------------------- |
| SC-D201 | 50 options rendered     | DOM count in the `tester` capture                                                       |
| SC-D202 | Constant retired        | `grep -rn "CEVC" --include=*.ts --include=*.tsx .` → zero hardcoded department literals |
| SC-D203 | Order is `sort_order`   | first five options are `CTO, SPD, FCOV, CEVC1, CEVC2`                                   |
| SC-D204 | Scrollable, not clipped | the 50th option is reachable by scrolling within the box                                |
| SC-D205 | Visual contract         | `tester` capture vs. the MoMorph frame                                                  |
| Build   | `pnpm validate`         | exit 0                                                                                  |

## Risk Assessment

| Risk                                                                               | Likelihood | Impact | Countermeasure                                                                                                                       |
| ---------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Two incompatible option shapes land — one for hashtags (F005), one for departments | **High**   | High   | Step 2 makes adopting F005's shape the first action, and widening in one place the only fallback                                     |
| `highlight-filter-dropdown.tsx` edited concurrently with Batch A F005              | **High**   | High   | Declared shared; the instruction is to wait, not to merge later                                                                      |
| 50 options overflow the box and the last ones become unreachable                   | Medium     | Medium | SC-D204 asserts the 50th is reachable, not that a scrollbar exists                                                                   |
| Design's illustrative order copied as the real ordering                            | Medium     | Low    | Key Insights states `sort_order` wins; SC-D203 pins the first five                                                                   |
| A missed `departmentLabel` caller breaks the build                                 | Low        | Low    | Only one call site; `pnpm typecheck` catches any other                                                                               |
| shadcn `Select`/`DropdownMenu` introduced here                                     | Medium     | High   | [Q10](../260906-1903-profile-and-menus/clarifications.md): follow the hand-rolled pattern unless Batch A restores the baseline first |

## Security Considerations

- `getDepartments()` reads a public, read-only table; there is no user input in the query and nothing
  to inject.
- The department is a **label**. Nothing here reads it to make an authorization decision, and the
  selected value must never be trusted as one in phase 03 either.
- Explicit column list, no `select *` — consistent with the rest of the batch.

## Next Steps

Unblocks [phase 03](./phase-03-page-wide-filter.md). Report the `tester` visual verdict and the
`grep` result for SC-D202.

## Rollback

`git checkout constants/index.ts components/kudos-board/highlight-kudo-card.tsx
components/kudos-board/highlight-filter-dropdown.tsx && rm -rf lib/departments`. The four hardcoded
rows return and the board renders exactly as it does today. Phase 01's table stays; it is inert
without a reader, and `profile-and-menus` phase 02 may already depend on it — do **not** roll phase
01 back as part of this.
