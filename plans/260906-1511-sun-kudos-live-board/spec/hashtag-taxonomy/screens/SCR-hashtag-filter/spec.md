---
status: draft
authored_by: takumi
fcode: F005
created: 2026-09-06
---

# SCR-hashtag-filter — Screen Spec

**Screen**: SCR-hashtag-filter: Dropdown Hashtag filter
**Feature**: F005_HashtagTaxonomy
**Type**: atomic
**Route**: N/A — dropdown overlay on `/sun-kudos`, not its own route
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** Lets any board visitor pick one hashtag category to narrow the Sun* Kudos board
(Highlight + All Kudos) down to kudos tagged with it.
**Actors:** Sunner (any board visitor — the board itself is public)
**Entry Conditions:** the Sunner clicks the hashtag filter button on the Sun* Kudos board.
**Exit Conditions:** a hashtag is picked (dropdown closes, filter applied), the active filter is
cleared, or the Sunner clicks outside the dropdown to dismiss it without changing the filter.

## 2. Screen Layout

### Layout Sketch

A single floating panel anchored below the filter button: a scrollable list of 13 rows, one per
hashtag, in Vietnamese. The currently active row (if any) renders with a raised dark background
and bright text; all other rows are plain list text. The panel has no header or footer — just the
list (`components/kudos-board/highlight-filter-dropdown.tsx:53-90`).

```
┌────────────────────────────┐
│  R1: Hashtag list (scrolls)│
│   #Toàn diện                │
│   #Cống hiến (selected)     │
│   ...                       │
└────────────────────────────┘
```

### Layout Regions

| Region ID | Name               | Position                          | Scrollable | Key Components       |
| --------- | ------------------ | --------------------------------- | ---------- | -------------------- |
| R1        | Hashtag list panel | static, anchored to filter button | yes        | dropdown option list |

## 3. UI Elements

| ID  | Element           | Type   | Required | Default | Visibility  | Action                                            | Source    | Format | Empty Behavior | Cross-ref                    |
| --- | ----------------- | ------ | -------- | ------- | ----------- | ------------------------------------------------- | --------- | ------ | -------------- | ---------------------------- |
| E01 | Filter button     | button | —        | Enabled | Always      | Opens/closes the dropdown                         | —         | raw    | —              | N/A                          |
| E02 | Hashtag row (×13) | button | —        | Enabled | Always      | Selects/toggles that hashtag as the active filter | API field | raw    | dash           | MODEL_Hashtag.name (planned) |
| E03 | "Clear" row       | button | —        | Enabled | Conditional | Clears the active filter                          | —         | raw    | —              | N/A                          |

## 4. User Actions

> **Scope:** within-screen interactions only. What the filter does to the board itself is
> `technical-spec.md § 3.1`'s job, not this screen's.

### Available Actions

| Action                    | Element                        | Trigger | Condition                   | Result on this screen           | Source                                |
| ------------------------- | ------------------------------ | ------- | --------------------------- | ------------------------------- | ------------------------------------- |
| Open dropdown             | E01                            | click   | —                           | Panel opens below the button    | `highlight-filter-dropdown.tsx:38`    |
| Select hashtag            | E02                            | click   | —                           | Row highlights, dropdown closes | `highlight-filter-dropdown.tsx:64-67` |
| Toggle off active hashtag | E02 (the already-selected row) | click   | a hashtag is already active | Filter clears, dropdown closes  | `highlight-filter-dropdown.tsx:64-67` |
| Clear filter              | E03                            | click   | a hashtag is already active | Filter clears, dropdown closes  | `highlight-filter-dropdown.tsx:77-88` |

### Happy Path

1. The Sunner clicks the filter button (E01); the dropdown panel opens (R1).
2. The Sunner clicks a hashtag row (E02); that row highlights and the dropdown closes.
3. To remove the filter, the Sunner reopens the dropdown and clicks the same row again, or clicks
   the "Clear" row (E03).

### Branches

| Decision point | Condition                                 | Outcome on this screen                         | Source                                |
| -------------- | ----------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| Step 2         | the clicked row is already the active one | filter clears instead of re-selecting          | `highlight-filter-dropdown.tsx:65`    |
| List rendering | zero hashtags available                   | list shows an empty-state line instead of rows | `highlight-filter-dropdown.tsx:55-58` |

## 5. UI States

| State              | Trigger                                     | Visual Behavior                             | User Action Available                           | Source                                |
| ------------------ | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| closed             | default / outside click                     | panel hidden                                | click E01 to open                               | `highlight-filter-dropdown.tsx:53`    |
| open, no selection | E01 clicked, no active filter               | all rows plain, no Clear row                | pick any row                                    | `highlight-filter-dropdown.tsx:53-76` |
| open, one selected | a hashtag is active                         | that row highlighted, Clear row visible     | pick another row, re-click active row, or clear | `highlight-filter-dropdown.tsx:59-88` |
| empty              | zero hashtags returned from the list source | empty-state text shown in place of rows     | none                                            | `highlight-filter-dropdown.tsx:55-58` |
| loading            | [EXPECTED] hashtag list fetch in-flight     | a loading placeholder replaces the row list | none                                            | TBD (draft)                           |
| error              | [EXPECTED] hashtag list fetch fails         | falls back to the empty-state copy          | retry on reopen                                 | TBD (draft)                           |

## 6. Validation & Feedback

N/A — no validation rules or submit-side error feedback detected (a selection cannot be invalid;
there is no submit step).

## 7. Conditional UI

| Condition                                           | Type          | Element(s) | Visible when               | Hidden when         | Notes                              |
| --------------------------------------------------- | ------------- | ---------- | -------------------------- | ------------------- | ---------------------------------- |
| The Clear row only appears once a hashtag is active | configuration | E03        | a hashtag filter is active | no filter is active | `highlight-filter-dropdown.tsx:77` |

## 8. Navigation

### Entry Points

| From                                | Trigger there                   | Condition | Source                                               |
| ----------------------------------- | ------------------------------- | --------- | ---------------------------------------------------- |
| Sun* Kudos board (Highlight header) | click the hashtag filter button | —         | `components/kudos-board/highlight-section.tsx:87-95` |

### Exits

N/A — this screen has no exits (terminal screen; it closes in place rather than navigating
anywhere).

## 9. Accessibility

| Aspect                      | Status               | Notes                                                                                                                                  |
| --------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | [EXPECTED] present   | option rows should carry `role="option"`/`aria-selected`, matching the write-form picker's pattern (`kudos-hashtag-input.tsx:106-107`) |
| Keyboard navigation         | [EXPECTED] supported | arrow-key row navigation + Enter to select, Escape to close                                                                            |
| Focus management            | [EXPECTED] managed   | focus should return to the filter button on close                                                                                      |
| Screen reader compatibility | [EXPECTED] tested    | dropdown should announce as a listbox with the active option                                                                           |
| Error announcement          | N/A                  | no validation/error state on this screen                                                                                               |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
