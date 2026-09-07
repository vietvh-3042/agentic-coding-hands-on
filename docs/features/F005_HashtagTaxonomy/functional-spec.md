---
authored_by: rebuild-spec
---

# Functional Spec — F005_HashtagTaxonomy

**Priority**: P1
**Type**: mixed
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F005_HashtagTaxonomy → SCR006/REG001, SCR006/REG003 → US013

## 1. Overview

**Problem:** Before this feature, the board's hashtag filter and the write-form's hashtag picker
each read their own hardcoded, independently-drifting list of category names, so the two could
disagree and neither could be managed without a code change.
**Solution:** One shared, database-backed hashtag catalog (13 seeded categories) feeds both
surfaces: a single-select filter on the board (shareable via the URL, narrows both the Highlight
carousel and the All-Kudos feed together) and a max-5 multi-select picker in the kudo composer.
**Scope:** Reading the shared hashtag catalog; filtering the board by hashtag from any of three
entry points; supplying the catalog and the access-control gate the composer's picker reads and
writes through.
**Non-Scope:** Does not include the unrelated free-text "category" chip shown next to this
feature's hashtag chips on each kudo card (a separate, older field — see § 5's note); does not
include the Highlight-only department narrow (a distinct, unfiltered-by-hashtag feature); does
not include actually saving a kudo's chosen hashtags to the database (that is the kudo-authoring
feature's own submit step — this feature only supplies the picker UI and the access gate that
step writes through).

**Actors**

| Actor  | Description                                  | Primary goal                                                                  |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Sunner | Any signed-in employee using the Kudos board | Find kudos in a category they care about, or tag their own kudo so others can |

## 2. Functional Capabilities

| ID     | Capability                                        | What the user can do                                                                                                                                                      | User Stories | Requirements                                                                   | Business Rules                          | Screens                      |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------- |
| CAP-01 | Hashtag taxonomy: filter the board and tag a kudo | Pick one hashtag anywhere on the board (dropdown or a chip) to narrow both the Highlight carousel and the All-Kudos feed; pick up to 5 hashtags when composing a new kudo | US013        | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-401, FR-402, FR-601 | BR-001, BR-002, BR-003, DEC-001, SM-001 | SCR006/REG001, SCR006/REG003 |

## 3. Open Decisions

None — no unresolved domain confirmations.

## 4. Requirements

### Foundation (0xx)

- **FR-001** The hashtag catalog is a fixed, pre-seeded list of 13 categories; end users never
  create, rename, or delete a hashtag — new rows only ever arrive by seed or migration.

### Navigation (1xx)

- **FR-101** The board can be reached directly at a URL that already carries a hashtag filter
  (`/sun-kudos?tag=<id>`), restoring that same filtered view on load without any further
  selection.

### Sun\* Kudos — Live Board (2xx)

- **FR-201** The board's hashtag dropdown lets a Sunner pick exactly one hashtag from the full
  catalog at a time.
- **FR-202** Each Highlight card's hashtag chips are individually clickable and apply the same
  single-select filter as the dropdown.
- **FR-203** Each All-Kudos feed card's hashtag chips are individually clickable and apply the
  same single-select filter.
- **FR-204** While a hashtag filter is active, the feed shows a dismissible chip naming it; the
  chip is the only way to clear the filter from the feed side.
- **FR-205** The kudo composer's hashtag picker lets the sender choose up to 5 hashtags from the
  same catalog, disabling every remaining choice once 5 are picked.

### Interaction (4xx)

- **FR-401** Selecting a hashtag from ANY entry point (dropdown, a Highlight-card chip, or a
  Feed-card chip) narrows BOTH the Highlight carousel and the All-Kudos feed to that hashtag at
  once, and resets the carousel to its first slide.
- **FR-402** The active hashtag filter is carried in the page URL and survives a reload.

### Security (6xx)

- **FR-601** Anyone can see which hashtags a kudo carries; only the kudo's own sender may attach
  a hashtag to it.

## 5. Business Rules

- Selecting a hashtag from any entry point — the dropdown, a Highlight-card chip, or a Feed-card
  chip — applies one shared filter across both board sections and resets the carousel to its
  first slide (BR-001)
- Re-selecting the currently active hashtag clears the filter instead of re-applying it, and the
  dropdown always closes after a pick (BR-002)
- At most 5 hashtags may be attached to a kudo; once 5 are chosen, every remaining choice disables
  until one is removed (BR-003)
- Once 5 hashtags are already chosen, any further row in the picker renders visibly disabled and
  cannot be clicked (DEC-001)
- The shared board filter has exactly two states — no filter active, or one hashtag active — with
  no way to filter by more than one hashtag at once (SM-001)

**Note — a separate, unrelated field:** a per-kudo free-text "category" (`kudos.hashtag_title`, a
legacy column) renders its own single chip next to this feature's structured hashtag chips on
every card. It is a distinct, still-live concern, not part of this feature's taxonomy and not
wired to any filter — see § 11 Risks & Known Issues.

## 6. Screens

| Screen Name                          | SCR###                      | What User Sees                                                                                                                                              | What User Can Do                                                                                                      |
| ------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sun\* Kudos — Live Board (Highlight) | SCR006_SunKudosBoard/REG001 | A hashtag filter dropdown above the Highlight carousel (alongside a separate, unrelated department dropdown), and a hashtag chip row on each Highlight card | Pick one hashtag from the dropdown, or click a card's chip, to narrow the carousel                                    |
| Sun\* Kudos — Live Board (All Kudos) | SCR006_SunKudosBoard/REG003 | The infinite-scroll kudos feed, each card showing its own hashtag chips, plus a dismissible active-filter chip when a hashtag is applied                    | Click a card's chip to filter, or click the active-filter chip to clear it                                            |
| Kudos composer (write-kudo modal)    | SCR006_SunKudosBoard        | A hashtag field showing already-picked hashtags as removable chips, plus an "add hashtag" button (max 5)                                                    | Pick up to 5 hashtags to attach to the kudo being composed; picked rows show a checkmark, and past 5 the rest disable |

### User Journey

1. A Sunner on the Live Board picks a hashtag from the Highlight dropdown, or clicks a chip on
   any card.
2. Both the Highlight carousel and the All-Kudos feed immediately narrow to that hashtag; the
   carousel returns to its first card.
3. The Sunner clicks the same hashtag again, or the feed's dismissible filter chip, and both
   sections show every kudo again.
4. Separately, while composing a new kudo, the Sunner picks up to 5 hashtags from the same
   catalog before submitting.

## 7. User Stories

### US013_FilterKudosByHashtag — Filter Kudos by Hashtag

**Actor:** Sunner
**Goal:** Filter the kudos board by hashtag.
**Business value:** Lets a Sunner see only the kudos in a category they care about, instead of
scanning the whole board.

**Acceptance Criteria:**

- [ ] Selecting a hashtag from the Highlight dropdown sets the filter, applied to both board
      sections
- [ ] Clicking a hashtag chip on a Highlight card or a Feed card applies the same filter
- [ ] The filter narrows the Highlight carousel (reset to its first slide) and the All-Kudos feed
      together, from either entry point
- [ ] The active filter survives a page reload and shows a dismissible chip in the feed

## 8. Scenarios

### US013_FilterKudosByHashtag — Happy Path

**Given** the board shows all kudos, **When** the Sunner picks "#Cống hiến" from the Highlight
dropdown, **Then** both the Highlight carousel and the All-Kudos feed narrow to kudos tagged
"Cống hiến", and the carousel shows its first slide.

### US013_FilterKudosByHashtag — Error: filter matches nothing

**Given** the board shows all kudos, **When** the Sunner picks a hashtag no visible kudo carries,
**Then** both sections show their normal "no kudos" empty state — the same message shown with no
filter at all — and the filter chip stays visible so it can be cleared.

## 9. Edge Cases

| Scenario                                                           | What Happens                                                                                        | User-Facing Message                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Active filter matches zero kudos                                   | Both sections render their normal empty state; the filter stays visibly active so it can be cleared | "There are no Kudos yet."                                                  |
| The URL's hashtag filter value is missing or not a number          | Treated the same as no filter — the board shows every kudo                                          | "None — silent handling"                                                   |
| A kudo carries zero hashtags (a legacy or otherwise untagged kudo) | Its hashtag row shows nothing; the kudo never matches any hashtag filter                            | "None — silent handling"                                                   |
| Sender tries to pick a 6th hashtag while composing a kudo          | The remaining rows are already shown disabled and cannot be clicked; nothing changes                | "Maximum 5 hashtags" _(shown only if a 6th id somehow reaches submission)_ |

## 10. Edge Behaviours to Verify

- **FR-401** → Confirm picking any single hashtag (dropdown or either card type) always narrows
  both board sections in the same visible update, never just one.
- **FR-402** → Confirm a hashtag-filtered URL, opened fresh (no prior client navigation), shows
  the same filtered state as if the Sunner had just clicked it.
- **FR-205** → Confirm the composer picker's 6th selection attempt is a true no-op, not merely a
  disabled visual with a working click underneath.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                                                           | Impact                                                                                                                                          | Status    |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | A separate, unrelated per-kudo "category" chip (free text, from a legacy `hashtag_title` column) renders next to this feature's structured hashtag chips on every card, but is not clickable — it is a leftover, never-wired filter axis from an earlier design pass. | A Sunner may expect the category text to filter the board the same way an adjacent hashtag chip does; it does not, and gives no indication why. | confirmed |
| RISK-02 | risk        | A second, legacy free-text hashtag field (`kudos.hashtags`) still exists on every kudo row alongside this feature's structured tables, deliberately kept this batch pending a later cleanup.                                                                          | A future change that reads or writes the wrong one of the two hashtag representations would silently diverge from this feature's own taxonomy.  | confirmed |

## 12. Dependencies

| Dependency          | Type    | Why this feature needs it                                                                                                                                               | Evidence                     |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| F002_KudosBoardData | feature | This feature's filter narrows rows F002 already fetches for the Highlight carousel and the All-Kudos feed                                                               | SCR006/REG001, SCR006/REG003 |
| F003_KudoAuthoring  | feature | F003's own submission step is the only place a kudo's chosen hashtags are ever saved; this feature supplies the picker UI and the access gate that write passes through | BR-003                       |

## 13. Configuration

```text
KUDOS_MAX_HASHTAGS = 5   # a Sunner may attach at most 5 hashtags when composing a kudo
```
