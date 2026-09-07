# Phase 03 — Page-wide department filter

## Context Links

- Plan overview: [`plan.md`](./plan.md) · options source: [`phase-02`](./phase-02-department-options-source.md)
- Spec: [`data/WXK5AYB_rG-specs.csv`](./data/WXK5AYB_rG-specs.csv) rows `mms_A.1`–`mms_A.3` —
  _"Click: chọn và đóng dropdown, áp dụng filter cho toàn trang (lọc ra các lời cảm ơn đến người
  thuộc phòng ban này)"_
- Batch A's parallel decision (read, do not re-plan):
  [`../260710-1511-sun-kudos-live-board/clarifications.md`](../260710-1511-sun-kudos-live-board/clarifications.md)
  — _"this state must be lifted to the page"_

## Overview

**Priority:** P2 · **Status:** pending · **Effort:** 2h
**Depends on:** 02 · **Batch A F005** (hashtag filter state lifted from `feed-list.tsx` to the page)
**test_policy:** **`visual-contract`** — zero MoMorph test cases for `WXK5AYB_rG`.

This phase is genuinely **behavioural**, which sits awkwardly under a visual contract. That tension
is [raised as an open question in the plan overview](./plan.md#unresolved-in-this-folder) and is
**not** silently upgraded to `e2e-red-first`: doing so would mean hand-writing test cases for a
screen MoMorph says has none, which the policy rules forbid. Verification here is the manual
checklist plus the static gate.

The dropdown currently changes only the Highlight carousel. The spec says it filters the **whole
page** — the Kudos _sent to people in that department_.

## Key Insights

- **This phase edits files Batch A F005 is actively rewriting.** `highlight-section.tsx` (212 lines
  today) owns `department` in local `useState`, and Batch A is lifting the _hashtag_ axis of the same
  filter row up to `app/sun-kudos/page.tsx`. Two agents editing those two files at once is the
  clearest file-ownership collision in Batch B. **Sequenced, not parallel** — this phase starts only
  after F005 has landed, and then adds the department axis to the container F005 built. If F005 has
  not landed, report **BLOCKED**; do not build a second, competing state container.
- **The filter predicate is on the _receiver_, not the sender.** The spec is explicit: _lọc ra các
  lời cảm ơn **đến** người thuộc phòng ban này_ — Kudos addressed **to** members of that department.
  Getting this backwards produces a plausible-looking board that answers the wrong question, and no
  visual check would catch it. This is the single most important line in this phase.
- **`profiles.department_id` is nullable** (phase 01, and `'CEVC10'` proves it will be null in
  practice). A department filter must therefore _exclude_ null-department recipients rather than
  accidentally including them through a null-permissive join. State the join type explicitly.
- **Selecting a department resets the carousel to page 1**, exactly as Batch A specified for the
  hashtag axis. Reuse that reset; do not add a second one.
- **The two axes compose.** Hashtag AND department together, not one replacing the other. Whether
  they compose as `AND` is the obvious reading, but it is worth confirming during the manual walk —
  a board that silently drops the hashtag when a department is picked is a bug that looks like a
  feature.
- Filtering happens **server-side**, in the query, not by filtering an already-fetched array
  client-side. A client-side filter over a paginated infinite-scroll feed produces short pages and
  wrong counts.

## Requirements

**Functional**

- FR-D301 — selecting a department filters **both** the Highlight carousel and the All Kudos feed.
- FR-D302 — the predicate matches Kudos whose **receiver** belongs to that department.
- FR-D303 — recipients with a null `department_id` are excluded when any department is selected.
- FR-D304 — selecting resets the Highlight carousel to page 1 and the feed to its first page.
- FR-D305 — department and hashtag compose; picking one does not clear the other.
- FR-D306 — clearing the department restores the unfiltered page.
- FR-D307 — the dropdown closes on selection and shows the selected item highlighted (`mms_A.1`).

**Non-functional**

- `highlight-section.tsx` is already 212 lines — over the project's 200-line guidance before this
  phase touches it. **Do not grow it.** Extract the filter row into
  `components/kudos-board/board-filter-row.tsx` as part of this work, bringing the file back under
  the limit rather than adding to the overrun.
- The predicate lives once, in `lib/kudos/board-filters.ts`, shared by the carousel query and the
  feed query. Two copies of a filter is how they diverge.

## Architecture

```text
app/sun-kudos/page.tsx  (server; F005 built the container)
   filters = { hashtagId, departmentId }          ← F005 owns hashtagId, this phase adds departmentId
        │
        ├─ getHighlightKudos(filters)  ┐
        └─ getBoardFeed(filters, cursor)┘ both call →  lib/kudos/board-filters.ts
                                                          applyFilters(query, filters)
                                                            .eq("receiver.department_id", id)   ← RECEIVER
                                                            (inner join on profiles; nulls excluded)
        ▼
   <BoardFilterRow>                    ← extracted from highlight-section.tsx this phase
        ├─ HighlightFilterDropdown  hashtag     (F005)
        └─ HighlightFilterDropdown  department  (phase 02's options)
```

**Data flow**

| In               | Transform                                | Out                               |
| ---------------- | ---------------------------------------- | --------------------------------- |
| department click | `onSelect(id)` → page-level filter state | `filters.departmentId`            |
| `filters`        | `applyFilters` on **both** queries       | filtered carousel + filtered feed |
| filter change    | carousel → page 1, feed → first page     | fresh render                      |
| clear            | `departmentId = null`, predicate omitted | unfiltered page                   |

## Related Code Files

**Modify (shared — coordinate with Batch A F005)**

- `app/sun-kudos/page.tsx` — add the department axis to F005's filter container
- `components/kudos-board/highlight-section.tsx` — extract the filter row out; **net line count must
  go down**

**Create**

- `components/kudos-board/board-filter-row.tsx` (~60) — the extracted row
- `lib/kudos/board-filters.ts` (~40) — the shared predicate, if F005 has not already created it;
  otherwise **extend F005's file**, do not add a parallel one

**Read for context (do not modify)**

- `components/kudos-board/feed-list.tsx` — where the state used to live before F005
- `components/kudos-board/highlight-filter-dropdown.tsx` — the dropdown, unchanged since phase 02

## Implementation Steps

1. **Gate:** confirm A-F005 has landed and read the container it built. Not landed → **BLOCKED**.
2. Extract the filter row from `highlight-section.tsx` into `board-filter-row.tsx`. Confirm
   `wc -l components/kudos-board/highlight-section.tsx` drops below 200.
3. Add `departmentId` to F005's filter shape and to the page-level state.
4. Extend `applyFilters` with the receiver-department predicate. Write the join explicitly — an
   inner join on the receiver profile, so null-department recipients fall out (FR-D303).
5. Wire both queries through it. Verify the _carousel_ is filtered too, not just the feed — that is
   the half most likely to be forgotten.
6. Reset carousel and feed on change, reusing F005's reset.
7. `pnpm validate`, then the manual checklist.

## Todo List

- [ ] A-F005 landed and read (else BLOCKED)
- [ ] Filter row extracted; `highlight-section.tsx` now < 200 lines
- [ ] Predicate is on the **receiver**, verified against real rows
- [ ] Null-department recipients excluded when a department is selected
- [ ] Both Highlight **and** All Kudos filtered by the same predicate
- [ ] One predicate module; no duplicate filter logic
- [ ] Department + hashtag compose; neither clears the other
- [ ] Carousel and feed reset to page 1 on change
- [ ] Clearing restores the unfiltered page
- [ ] Filtering is server-side; no client-side array filter
- [ ] `pnpm validate` exits 0
- [ ] Manual checklist walked; `tester` visual verdict recorded

## Success Criteria

| ID      | Criterion            | Method                                                                                                                                                                 |
| ------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-D301 | Both sections filter | manual: pick a department, confirm carousel **and** feed both change                                                                                                   |
| SC-D302 | Receiver, not sender | `psql`: pick a department with a known receiver; the board's rows must match `select … where receiver.department_id = X`, and must **not** match the sender-side query |
| SC-D303 | Nulls excluded       | a null-department recipient's Kudo is absent under any department selection                                                                                            |
| SC-D304 | Reset                | after scrolling to page 2, a selection returns the feed to 10 cards                                                                                                    |
| SC-D305 | Composition          | hashtag + department both applied; row set is the intersection                                                                                                         |
| SC-D306 | Clear restores       | clearing returns the original unfiltered counts                                                                                                                        |
| SC-D307 | Size discipline      | `wc -l components/kudos-board/highlight-section.tsx` < 200                                                                                                             |
| Build   | `pnpm validate`      | exit 0                                                                                                                                                                 |

## Risk Assessment

| Risk                                                                                 | Likelihood                               | Impact   | Countermeasure                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Predicate written on the **sender** — a plausible board answering the wrong question | **High**                                 | **High** | Called out as the most important line in the phase; SC-D302 compares against **both** SQL queries, not just the receiver one |
| Concurrent edits with Batch A F005 on the same two files                             | **High**                                 | High     | Hard sequencing; step 1 is a BLOCK, not a merge attempt                                                                      |
| Only the feed filtered, carousel left unfiltered                                     | **High** (it is the easy half to forget) | Medium   | Step 5 and SC-D301 assert both explicitly                                                                                    |
| Null-department recipients leak in through a permissive join                         | Medium                                   | Medium   | FR-D303 + SC-D303; the join type is written out in step 4                                                                    |
| `highlight-section.tsx` grows further past 200 lines                                 | Medium                                   | Medium   | Extraction is a requirement, and SC-D307 makes the reduction a pass/fail criterion                                           |
| Two filter predicates drift apart                                                    | Medium                                   | High     | One module, shared; extend F005's rather than adding a second                                                                |
| Behaviour shipped with no automated gate (the `visual-contract` tension)             | Medium                                   | Medium   | Manual checklist is mandatory and evidenced; the policy question is raised, not resolved unilaterally                        |

## Security Considerations

- The department id arrives from the client. It is a **filter**, never an authorization input — a
  user selecting another department sees Kudos they could already see. Nothing here widens what any
  role can read.
- The value is still validated as a real `departments.id` before it reaches a query, for the same
  `22P02` reason phase 02 of `profile-and-menus` gives: a non-uuid sent to a uuid column is a 500.
- Filtering is server-side. A client-side filter would ship unfiltered rows to the browser, which
  matters the moment any department becomes sensitive.

## Next Steps

Last phase in this folder. Report the SC-D302 SQL comparison, the line count for SC-D307, and the
`tester` visual verdict. Feed the receiver/sender finding back to Batch A if F005's hashtag axis has
the mirror-image ambiguity.

## Rollback

`git checkout app/sun-kudos/page.tsx components/kudos-board/highlight-section.tsx && rm
components/kudos-board/board-filter-row.tsx`, and revert the department branch in
`lib/kudos/board-filters.ts` (leave the file — F005 owns it). The board returns to F005's
hashtag-only filtering; phases 01 and 02 stay, since `profile-and-menus` depends on them.
