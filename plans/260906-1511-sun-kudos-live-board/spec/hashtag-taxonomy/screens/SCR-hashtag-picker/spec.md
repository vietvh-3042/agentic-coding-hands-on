---
status: draft
authored_by: takumi
fcode: F005
created: 2026-09-06
---

# SCR-hashtag-picker — Screen Spec

**Screen**: SCR-hashtag-picker: Dropdown list hashtag
**Feature**: F005_HashtagTaxonomy
**Type**: atomic
**Route**: N/A — dropdown overlay inside the Viết Kudo write form, not its own route
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** Lets a Sunner composing a kudo pick up to 5 hashtags to attach to it, from the same
13-category list the board filter uses.
**Actors:** Sunner (authenticated, composing a kudo)
**Entry Conditions:** the Sunner clicks "+ Hashtag" in the Viết Kudo write form.
**Exit Conditions:** the Sunner clicks outside the dropdown to dismiss it — selections persist as
chips in the write form regardless of how the dropdown closes.

## 2. Screen Layout

### Layout Sketch

A dark floating panel anchored below the "+ Hashtag" button: a scrollable list of 13 rows. Each row
shows the hashtag text on the left and a 24×24 check-circle on the right — filled when selected, an
empty 24×24 spacer when not, so the layout never shifts
(`components/kudos/kudos-hashtag-input.tsx:90-126`).

```
┌────────────────────────────┐
│  R1: Hashtag list (scrolls)│
│   #Toàn diện           [ ] │
│   #Cống hiến           [✓] │
│   ...                       │
└────────────────────────────┘
```

### Layout Regions

| Region ID | Name               | Position                               | Scrollable | Key Components       |
| --------- | ------------------ | -------------------------------------- | ---------- | -------------------- |
| R1        | Hashtag list panel | static, anchored to "+ Hashtag" button | yes        | dropdown option list |

## 3. UI Elements

| ID  | Element                            | Type          | Required | Default          | Visibility                           | Action                           | Source      | Format | Empty Behavior | Cross-ref                           |
| --- | ---------------------------------- | ------------- | -------- | ---------------- | ------------------------------------ | -------------------------------- | ----------- | ------ | -------------- | ----------------------------------- |
| E01 | "+ Hashtag" button                 | button        | —        | Enabled          | Conditional (hidden once 5 selected) | Opens/closes the dropdown        | —           | raw    | —              | N/A                                 |
| E02 | Hashtag row (×13)                  | button        | —        | Enabled/Disabled | Always                               | Toggles that hashtag's selection | API field   | raw    | dash           | MODEL_Hashtag.name (planned)        |
| E03 | Check icon (per row)               | display field | —        | hidden           | Conditional (row selected)           | —                                | store state | raw    | hidden         | binding: `tags.includes(row.value)` |
| E04 | Selected chip (per selection, ×≤5) | display field | —        | —                | Conditional (≥1 selected)            | Removes that hashtag via its `x` | store state | raw    | hidden         | N/A                                 |

## 4. User Actions

> **Scope:** within-screen interactions only. What a finished selection feeds into (F003's
> submission payload) is out of this screen's scope.

### Available Actions

| Action                  | Element                    | Trigger | Condition                  | Result on this screen                                     | Source                           |
| ----------------------- | -------------------------- | ------- | -------------------------- | --------------------------------------------------------- | -------------------------------- |
| Open dropdown           | E01                        | click   | fewer than 5 selected      | Panel opens                                               | `kudos-hashtag-input.tsx:70-88`  |
| Select hashtag          | E02 (unselected)           | click   | fewer than 5 selected      | Row becomes selected, check icon appears, a chip is added | `kudos-hashtag-input.tsx:38-44`  |
| Deselect hashtag        | E02 (selected)             | click   | —                          | Row becomes unselected, check icon hides                  | `kudos-hashtag-input.tsx:38-40`  |
| Attempt select past cap | E02 (unselected, disabled) | click   | exactly 5 already selected | No effect — row is disabled and does not respond          | `kudos-hashtag-input.tsx:41,108` |
| Remove chip             | E04's `x`                  | click   | that hashtag is selected   | Hashtag deselected, chip removed                          | `kudos-hashtag-input.tsx:46-47`  |

### Happy Path

1. The Sunner clicks "+ Hashtag" (E01); the dropdown opens (R1).
2. The Sunner clicks up to 5 hashtag rows (E02); each click adds a check icon (E03) and a removable
   chip (E04).
3. On the 5th selection, all remaining unselected rows disable and "+ Hashtag" (E01) hides.
4. The Sunner removes a chip (E04) if they want to swap one out; the corresponding row re-enables
   and E01 reappears.

### Branches

| Decision point | Condition                   | Outcome on this screen                                      | Source                                      |
| -------------- | --------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| Step 2/3       | 5 hashtags already selected | unselected rows render disabled; clicks on them are ignored | `kudos-hashtag-input.tsx:36,41,101,108,112` |

## 5. UI States

| State                     | Trigger                                 | Visual Behavior                                              | User Action Available   | Source                              |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------ | ----------------------- | ----------------------------------- |
| closed                    | default / outside click                 | panel hidden, selected chips still visible in the write form | click E01 to reopen     | `kudos-hashtag-input.tsx:34,90`     |
| open, under cap           | E01 clicked, <5 selected                | all rows clickable; selected rows show the check icon        | select/deselect any row | `kudos-hashtag-input.tsx:99-124`    |
| open, at cap (5 selected) | 5th hashtag selected                    | unselected rows disabled + dimmed; "+ Hashtag" button hidden | deselect a selected row | `kudos-hashtag-input.tsx:36,70,101` |
| loading                   | [EXPECTED] hashtag list fetch in-flight | a loading placeholder replaces the row list                  | none                    | TBD (draft)                         |
| error                     | [EXPECTED] hashtag list fetch fails     | falls back to an empty list with a retry affordance          | retry on reopen         | TBD (draft)                         |

## 6. Validation & Feedback

| Element                            | Rule                                                    | Feedback              | Trigger                                                |
| ---------------------------------- | ------------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| E02                                | At most 5 may be selected                               | "Tối đa 5 hashtag"    | change (attempting a 6th selection)                    |
| (Hashtag field, in the write form) | At least 1 must be selected before the kudo can be sent | "Không được để trống" | submit (enforced by the write form, not this dropdown) |

## 7. Conditional UI

| Condition                                            | Type          | Element(s)            | Visible when                                           | Hidden when                                        | Notes                             |
| ---------------------------------------------------- | ------------- | --------------------- | ------------------------------------------------------ | -------------------------------------------------- | --------------------------------- |
| The "+ Hashtag" button hides once the cap is reached | configuration | E01                   | fewer than 5 hashtags selected                         | exactly 5 are selected                             | `kudos-hashtag-input.tsx:70`      |
| Unselected rows disable at the cap                   | configuration | E02 (unselected rows) | fewer than 5 selected, or this row is already selected | 5 already selected and this row is not one of them | `kudos-hashtag-input.tsx:101,108` |

## 8. Navigation

### Entry Points

| From                                 | Trigger there     | Condition                     | Source                          |
| ------------------------------------ | ----------------- | ----------------------------- | ------------------------------- |
| Viết Kudo write form (Hashtag field) | click "+ Hashtag" | fewer than 5 already selected | `kudos-hashtag-input.tsx:70-88` |

### Exits

N/A — this screen has no exits (terminal screen; it closes in place and its selections are
consumed by the write form that opened it, not navigated to elsewhere).

## 9. Accessibility

| Aspect                      | Status               | Notes                                                                                                                           |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | present              | `role="listbox"`/`role="option"`/`aria-selected`/`aria-multiselectable` already implemented at `kudos-hashtag-input.tsx:92-107` |
| Keyboard navigation         | [EXPECTED] supported | arrow-key row navigation is not yet confirmed from source; recommended for parity with the listbox role already in place        |
| Focus management            | [UNVERIFIED]         | outside-click closes the panel (`use-click-outside`) but focus-return-on-close is not confirmed from source                     |
| Screen reader compatibility | [UNVERIFIED]         | roles are present; no confirmation of a live-region announcement when the 5-cap disables remaining rows                         |
| Error announcement          | [EXPECTED] supported | the "Tối đa 5 hashtag" message should be announced when a 6th pick is attempted                                                 |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
