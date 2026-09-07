---
status: draft
authored_by: takumi
created: 2026-09-06
---

# SCR-secret-box — Screen Spec

**Screen**: SCR-secret-box (draft): Secret Box Modal
**Feature**: F006_SecretBoxReveal (provisional)
**Type**: atomic
**Route**: N/A — modal overlay, no dedicated URL; opened from the sidebar within `/sun-kudos`
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** Lets a signed-in member spend one unopened secret box for a single randomly-drawn
collectible badge, shown immediately in the same modal.
**Actors:** Member
**Entry Conditions:** member is signed in and clicks "Mở quà" in their sidebar stats panel
**Exit Conditions:** member closes the modal via the top-right X button, or navigates away —
opening a box does not itself close the modal

## 2. Screen Layout

### Layout Sketch

A single centered modal over a dark overlay (`components/kudos-board/sidebar-gift-dialog.tsx:49-121`):
a title bar with a close button (top, static), a divider, an optional instruction line, the square
box illustration (center, the dominant clickable element), a second divider, and a footer showing
the unopened-box label and count (bottom, static).

```
┌─────────────────────────────────────────┐
│  R1: Title + Close (static)              │
├───────────────────────────────────────────┤
- - - - - - - - - - - - - - - - - - - - - - -
│  R2: Instruction line (conditional)       │
- - - - - - - - - - - - - - - - - - - - - - -
│  R3: Box illustration (static, clickable) │
├───────────────────────────────────────────┤
│  R4: Footer counter (static)              │
└─────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name             | Position | Scrollable | Key Components |
| --------- | ---------------- | -------- | ---------- | -------------- |
| R1        | Title + Close    | static   | no         | TBD (draft)    |
| R2        | Instruction line | static   | no         | TBD (draft)    |
| R3        | Box illustration | static   | no         | TBD (draft)    |
| R4        | Footer counter   | static   | no         | TBD (draft)    |

## 3. UI Elements

| ID  | Element          | Type          | Required | Default                        | Visibility                         | Action                         | Source    | Format              | Empty Behavior | Cross-ref                 |
| --- | ---------------- | ------------- | -------- | ------------------------------ | ---------------------------------- | ------------------------------ | --------- | ------------------- | -------------- | ------------------------- |
| E01 | Modal title      | display field | —        | "MỞ SECRET BOX THÀNH CÔNG"     | Always                             | —                              | static    | raw                 | —              | N/A                       |
| E02 | Close button     | button        | —        | Enabled                        | Always                             | Closes the modal               | —         | —                   | —              | N/A                       |
| E03 | Instruction line | display field | —        | "Click vào box để tiếp tục mở" | Conditional (hidden at 0 unopened) | —                              | API field | raw                 | hidden         | binding: `boxes_unopened` |
| E04 | Box illustration | button        | —        | Enabled when unopened > 0      | Always                             | Opens one box, reveals a badge | API field | image               | —              | binding: `boxes_unopened` |
| E05 | Footer label     | display field | —        | "Secretbox chưa mở"            | Always                             | —                              | static    | raw                 | —              | N/A                       |
| E06 | Footer count     | display field | —        | Empty                          | Always                             | —                              | API field | zero-padded 2-digit | dash           | binding: `boxes_unopened` |

## 4. User Actions

> **Scope:** within-screen interactions only. This screen has no cross-screen exits beyond closing
> itself — see `## 8. Navigation`.

### Available Actions

| Action      | Element | Trigger | Condition            | Result on this screen                          | Source                                                  |
| ----------- | ------- | ------- | -------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Open box    | E04     | click   | `boxes_unopened > 0` | badge image updates, E06 count decrements by 1 | `components/kudos-board/sidebar-gift-dialog.tsx:95-106` |
| Close modal | E02     | click   | —                    | modal closes                                   | `components/kudos-board/sidebar-gift-dialog.tsx:71-81`  |

### Happy Path

1. Member clicks E04 (Box illustration) while E06 shows a value greater than 0.
2. The screen shows a brief reveal and swaps in the newly drawn badge image.
3. E06 updates to the new, decremented count; the modal stays open so the member can review the badge.

### Branches

| Decision point | Condition             | Outcome on this screen                                         | Source                                                  |
| -------------- | --------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Click E04      | `boxes_unopened == 0` | click has no effect — E04 is non-interactive and E03 is hidden | `components/kudos-board/sidebar-gift-dialog.tsx:88-100` |

### Interaction Notes

- **Pressing ESC closes the modal** — source: `components/kudos-board/sidebar-gift-dialog.tsx:30-36`

## 5. UI States

| State            | Trigger                            | Visual Behavior                   | User Action Available | Source                                                  |
| ---------------- | ---------------------------------- | --------------------------------- | --------------------- | ------------------------------------------------------- |
| loading          | modal mount, counts not yet loaded | TBD (draft)                       | none                  | TBD (draft)                                             |
| empty (no boxes) | `boxes_unopened == 0`              | instruction hidden, box art inert | none                  | `components/kudos-board/sidebar-gift-dialog.tsx:88-100` |
| saving           | open-box request in flight         | TBD (draft)                       | none                  | TBD (draft)                                             |
| error            | open-box request fails             | TBD (draft)                       | retry                 | TBD (draft)                                             |
| success          | badge revealed                     | new badge image + updated counter | dismiss (close modal) | TBD (draft)                                             |

## 6. Validation & Feedback

N/A — no form input on this screen; the only control is the box-click action, whose eligibility is
a UI-state row above, not a validation rule.

## 7. Conditional UI

| Condition                                                   | Type          | Element(s) | Visible when         | Hidden when           | Notes                                    |
| ----------------------------------------------------------- | ------------- | ---------- | -------------------- | --------------------- | ---------------------------------------- |
| The opening instruction only makes sense while boxes remain | configuration | E03        | `boxes_unopened > 0` | `boxes_unopened == 0` | no consequence beyond a hidden hint line |

## 8. Navigation

### Entry Points

| From                            | Trigger there  | Condition | Source                                           |
| ------------------------------- | -------------- | --------- | ------------------------------------------------ |
| Sun* Kudos Live Board (sidebar) | click "Mở quà" | signed in | `components/kudos-board/sidebar-stats.tsx:39-46` |

### Exits

N/A — this screen has no exits beyond closing itself (terminal overlay; closing returns to the
board underneath).

## 9. Accessibility

| Aspect                      | Status     | Notes                                                                                                                          |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ARIA roles/labels           | [EXPECTED] | modal carries `role="dialog"` + `aria-modal` + a labelled title, matching the existing shell (`sidebar-gift-dialog.tsx:51-53`) |
| Keyboard navigation         | [EXPECTED] | ESC closes the modal, matching the existing shell's key handler (`sidebar-gift-dialog.tsx:30-36`)                              |
| Focus management            | [EXPECTED] | focus should move into the modal on open and return to the trigger button on close                                             |
| Screen reader compatibility | [EXPECTED] | the revealed badge's name should be announced, not just its image                                                              |
| Error announcement          | [EXPECTED] | an open-box failure should be announced via an `aria-live` region                                                              |

## 10. Responsive Behavior

N/A — no responsive behavior found in source.
