---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Functional Spec — F005_HashtagTaxonomy

**Priority**: P1
**Type**: mixed
**Generated**: 2026-09-06

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities (including the proposed `hashtags`/`kudo_hashtags` DDL), and DB writes for a
Dev/QA/SA audience.

**Traceability:** F005 (provisional) → SCR-hashtag-filter, SCR-hashtag-picker → US001, US002, US003 → — → TBD (draft) → TBD (draft)

## 1. Overview

**Problem:** The board's hashtag filter and the write-form's hashtag picker each read from their
own hardcoded, mutually-disjoint list of hashtag names, so tagging a kudo and filtering the board
draw from two different vocabularies and neither can be curated in one place.
**Solution:** One shared hashtag list (13 categories) backs both dropdowns; picking a hashtag from
either dropdown, or from a hashtag chip on any kudo card, narrows the board's Highlight carousel
and All Kudos feed together and resets the carousel back to page 1.
**Scope:** Seed and serve the canonical hashtag list to both dropdowns; lift the shared filter
state so both board sections read the same value; back-fill the existing free-text hashtags on
older kudos into the new structured list; define the write permission the kudo-submission flow
needs to attach hashtags to a new kudo.
**Non-Scope:** Kudo submission itself (a separate feature owns writing a kudo and its hashtags);
any hashtag admin/CRUD UI (none exists in this batch — the list is seeded, not user-editable);
department filtering (existing, unaffected by this feature).

**Actors**

| Actor  | Description                                             | Primary goal                                                                                           |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Sunner | any Sun* Kudos board visitor, viewing or writing a kudo | narrow the board to kudos matching a theme, or tag a kudo they are writing so others can find it later |

## 2. Functional Capabilities

| ID     | Capability                  | What the user can do                                                                                  | User Stories | Requirements                           | Business Rules                 | Screens            |
| ------ | --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | ------------------------------ | ------------------ |
| CAP-01 | Filter the board by hashtag | Narrow Highlight and All Kudos to one hashtag category, from a dropdown or a chip, and clear it again | US001, US002 | FR-001, FR-201, FR-202, FR-401, FR-601 | BR-001, BR-002, BR-004, SM-001 | SCR-hashtag-filter |
| CAP-02 | Tag a kudo while writing it | Pick up to 5 hashtags for a new kudo from the shared list                                             | US003        | FR-301, FR-302                         | BR-003, DEC-001                | SCR-hashtag-picker |

## 3. Open Decisions

None — no unresolved domain confirmations. (The hashtag list, feed sort order, and message length
questions raised during research were all resolved in `clarifications.md`'s gap-resolution
session; remaining open items are implementation-detail unknowns, tracked in
`technical-spec.md § 5.3`, or listed in the Gaps for Clarification block at the end of this pass.)

## 4. Requirements

### Foundation (0xx)

- **FR-001** The hashtag list a Sunner picks from and filters by comes from one shared list of 13
  categories, not two separate hardcoded lists per screen.

### Board hashtag filter (2xx)

- **FR-201** The board filter dropdown is single-select; picking the currently active tag again
  clears it instead of re-selecting it.
- **FR-202** Selecting a hashtag from the filter dropdown applies it to both Highlight and All
  Kudos and resets the carousel back to page 1.

### Write-form hashtag picker (3xx)

- **FR-301** The write-form picker lets a Sunner select up to 5 hashtags for the kudo they are
  writing, marking each selected row with a check icon.
- **FR-302** Once 5 hashtags are selected, the remaining unselected rows disable until one is
  removed.

### Interaction (4xx)

- **FR-401** Clicking a hashtag chip on a highlight card, a feed card, or the feed's category chip
  applies that hashtag to the shared board filter, exactly as picking it from the dropdown would.

### Security (6xx)

- **FR-601** Only the sender of a kudo may attach hashtags to it — enforced when F003's submission
  flow writes the kudo's hashtags.

## 5. Business Rules

- Selecting a hashtag from the board filter dropdown, or clicking a hashtag chip on any card,
  re-filters Highlight and All Kudos together and resets the carousel to page 1 (BR-001)
- The board filter dropdown is single-select; clicking the currently active tag clears the filter,
  and the dropdown always closes after a click (BR-002)
- The write-form picker allows at most 5 selected hashtags; once 5 are chosen, unselected rows
  disable until the Sunner removes one (BR-003)
- A kudo's hashtags may only be inserted by that kudo's own sender (BR-004)
- Unselected rows in the write-form picker render disabled once 5 hashtags are already selected
  (DEC-001)
- The shared hashtag filter — no active tag, or one active tag — is tracked once at the page level
  and drives both Highlight and All Kudos together (SM-001)

## 6. Screens

| Screen Name               | SCR###             | What User Sees                                                                      | What User Can Do                                                               |
| ------------------------- | ------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Board hashtag filter      | SCR-hashtag-filter | A dropdown list of 13 hashtag categories, with the currently active one highlighted | Pick one hashtag to filter the board, or pick the active one again to clear it |
| Write-form hashtag picker | SCR-hashtag-picker | The same 13-category list, with a check mark on already-picked rows                 | Pick up to 5 hashtags for the kudo being written, or remove any of them        |

### User Journey

1. A Sunner opens the Sun* Kudos board and clicks the hashtag filter button; the Board hashtag
   filter dropdown opens.
2. They pick a category; the dropdown closes, and both the Highlight carousel and the All Kudos
   feed narrow to that category, with the carousel back on page 1.
3. Later, while writing a kudo, the Sunner opens "+ Hashtag" and the Write-form hashtag picker
   appears with the same 13 categories.
4. They pick up to 5; a 6th pick is blocked until one is removed, and the chosen tags travel with
   the kudo when it is submitted.

## 7. User Stories

### US001 — Filter the board by hashtag

**Actor:** Sunner
**Goal:** Narrow the board to kudos tagged with one category.
**Business value:** Quickly finds kudos relevant to a specific value or theme without scrolling the
whole feed.

**Acceptance Criteria:**

- [ ] Picking a hashtag from the dropdown narrows both Highlight and All Kudos to that hashtag
- [ ] Picking the same hashtag again clears the filter
- [ ] The carousel returns to page 1 whenever the filter changes

### US002 — Filter the board from a hashtag chip

**Actor:** Sunner
**Goal:** Jump straight from a kudo's own hashtag chip to everything else tagged the same way.
**Business value:** Turns every hashtag chip into a one-click discovery path, no dropdown needed.

**Acceptance Criteria:**

- [ ] Clicking a hashtag chip on a highlight card, a feed card, or the feed's category chip applies
      that hashtag as the active board filter
- [ ] The effect is identical to picking the same hashtag from the dropdown

### US003 — Tag a kudo while writing it

**Actor:** Sunner
**Goal:** Attach up to 5 relevant hashtags to a kudo before sending it.
**Business value:** Keeps kudos discoverable and categorized so the board's filter has something
real to filter by.

**Acceptance Criteria:**

- [ ] The picker offers the same 13 categories as the board filter
- [ ] Up to 5 can be selected; a selected row shows a check mark
- [ ] Once 5 are selected, remaining rows disable until one is removed

## 8. Scenarios

### US001 — Happy Path

**Given** the board is showing all kudos, **When** the Sunner picks "Cống hiến" from the filter
dropdown, **Then** only kudos tagged "Cống hiến" show in Highlight and All Kudos, and the carousel
resets to page 1.

### US001 — Error: Filter matches zero kudos

**Given** the Sunner picks a hashtag no kudo currently carries, **When** the filter applies,
**Then** both sections show their existing empty-state message and the filter stays visibly active
so it can be cleared.

### US002 — Happy Path

**Given** a feed card shows "#Cống hiến", **When** the Sunner clicks that chip, **Then** the board
filter updates to "Cống hiến" exactly as if it were picked from the dropdown.

### US002 — Error: Chip's hashtag no longer exists

**Given** a hashtag chip's tag was deleted since the page loaded, **When** the Sunner clicks it,
**Then** the filter falls back to showing all kudos and no error is shown.

### US003 — Happy Path

**Given** the Sunner has selected 4 hashtags in the picker, **When** they pick a 5th, **Then** it
is added, the row shows a check mark, and all unselected rows become disabled.

### US003 — Error: 6th hashtag attempted

**Given** 5 hashtags are already selected, **When** the Sunner attempts to click a 6th, **Then**
the click has no effect and the row stays visibly disabled ("Tối đa 5 hashtag" is shown per the
field's guidance text).

## 9. Edge Cases

| Scenario                                                                                           | What Happens                                                                | User-Facing Message              |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------- |
| A kudo has zero hashtags (e.g. a backfilled row whose free text matched none of the 13 categories) | The hashtag chip line is simply omitted from that card                      | (no message — the row is absent) |
| The active hashtag filter matches zero kudos                                                       | Both Highlight and All Kudos show their existing empty state                | "Hiện tại chưa có Kudos nào."    |
| The active filter's hashtag is deleted while it is applied                                         | The filter falls back to showing all kudos instead of erroring              | (no message — silent fallback)   |
| A Sunner tries to pick a 6th hashtag while writing a kudo                                          | The pick is blocked and the remaining unselected rows stay disabled         | "Tối đa 5 hashtag"               |
| A backfilled kudo's free-text tokens match none of the 13 seeded names                             | No hashtag is attached to that kudo (same as the first row above)           | (no message)                     |
| The Sunner clears the active filter (re-clicking the same tag, or the Clear row)                   | Both sections return to showing all kudos and the carousel resets to page 1 | (no message)                     |

## 10. Edge Behaviours to Verify

- **FR-202** → confirm picking a hashtag narrows both Highlight and All Kudos in the same update,
  and the carousel returns to page 1.
- **FR-302** → confirm a 6th pick is blocked and the "Tối đa 5 hashtag" guidance stays visible.
- **FR-601** → confirm a hashtag write attempted by someone other than the kudo's sender is
  rejected.

## 11. Risks & Known Issues

N/A — none found.

## 12. Dependencies

| Dependency                                 | Type    | Why this feature needs it                                                                                                     | Evidence                           |
| ------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| F003_KudoAuthoring                         | feature | F003's submission Server Action is the only writer of `kudo_hashtags` rows — F005 only defines the table and its write policy | F003_KudoAuthoring                 |
| Existing free-text `kudos.hashtags` column | data    | Source data the one-time backfill reads to populate the new structured hashtag list                                           | `kudos.hashtags` (existing column) |

## 13. Configuration

```text
KUDOS_MAX_HASHTAGS = 5   # max hashtags a Sunner may attach to one kudo (write-form picker cap)
```
