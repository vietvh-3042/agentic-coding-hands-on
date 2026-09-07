---
status: draft
authored_by: takumi
created: 2026-09-06
---

# SCR-addlink-box — Screen Spec

**Screen**: SCR-addlink-box: Add link
**Feature**: F003_KudoAuthoring
**Type**: atomic
**Route**: modal opened from within `SCR-write-kudo` (no dedicated URL)
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** Lets a Sunner insert a hyperlink into the Viết Kudo message they are composing, by
entering display text and a URL. Confirmed missing — the editor's link toolbar button currently
has no handler (`components/kudos/kudos-content-editor.tsx:41-50`).
**Actors:** Sunner (kudo sender)
**Entry Conditions:** `SCR-write-kudo` is open and the Sunner clicks the editor's link toolbar
button (E03 there).
**Exit Conditions:** Closes on "Lưu" with a valid link inserted into the parent message, or on
"Hủy"/`Escape`/backdrop click with nothing changed.

## 2. Screen Layout

### Layout Sketch

A small centered dialog over the Viết Kudo modal: a title, two stacked labeled fields (Text, Link),
and a footer with Hủy/Lưu anchored at the bottom (`TBD (draft)` — component not yet written; layout
inferred from MoMorph spec `OyDLDuSGEa`).

```
┌───────────────────────────────────────────┐
│  R1: Title ("Add link")                   │
├───────────────────────────────────────────┤
│  R2: Text (label + input, 672x56px)       │
│  R3: Link (label + input, 672x56px)       │
├───────────────────────────────────────────┤
│  R4: Footer (Hủy | Lưu)                   │
└───────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name       | Position                                | Scrollable | Key Components     |
| --------- | ---------- | --------------------------------------- | ---------- | ------------------ |
| R1        | Title      | static                                  | no         | plain text         |
| R2        | Text field | static                                  | no         | label + text input |
| R3        | Link field | static                                  | no         | label + text input |
| R4        | Footer     | static (anchored bottom, per test case) | no         | Hủy / Lưu buttons  |

## 3. UI Elements

| ID  | Element | Type       | Required | Default | Visibility | Action                                                           | Source | Format            | Empty Behavior    | Cross-ref            |
| --- | ------- | ---------- | -------- | ------- | ---------- | ---------------------------------------------------------------- | ------ | ----------------- | ----------------- | -------------------- |
| E01 | Text    | text input | yes      | Empty   | Always     | Types the link's display text; label click focuses this input    | static | raw, 1-100 chars  | dash (red border) | binding: `form.text` |
| E02 | Link    | text input | yes      | Empty   | Always     | Types the target URL; validated on blur and on save              | static | url, 5-2048 chars | dash (red border) | binding: `form.url`  |
| E03 | Hủy     | button     | —        | Enabled | Always     | Closes without saving                                            | static | —                 | —                 | N/A                  |
| E04 | Lưu     | button     | —        | Enabled | Always     | Validates both fields; saves + closes, or shows per-field errors | static | —                 | —                 | N/A                  |

## 4. User Actions

> **Scope:** within-screen interactions only. Returning `{text, url}` to `SCR-write-kudo` on save
> is a cross-screen event — see `## 8. Navigation`.

### Available Actions

| Action                | Element  | Trigger                          | Condition              | Result on this screen                         | Source        |
| --------------------- | -------- | -------------------------------- | ---------------------- | --------------------------------------------- | ------------- |
| Focus Text via label  | E01      | click the "Text" label           | —                      | Focuses E01                                   | `TBD (draft)` |
| Focus highlight       | E01, E02 | focus                            | —                      | Shows a highlighted border                    | `TBD (draft)` |
| Validate Link on blur | E02      | blur                             | —                      | Shows an inline error if the URL is malformed | `TBD (draft)` |
| Cancel                | E03      | click, `Escape`, or double-click | —                      | Closes without saving (idempotent)            | `TBD (draft)` |
| Save                  | E04      | click                            | E01 and E02 both valid | Validates, saves, closes                      | `TBD (draft)` |

### Happy Path

1. Sunner clicks the label or field for "Text" (E01) and types 1-100 non-whitespace characters.
2. Sunner clicks "Link" (E02) and types a valid `http`/`https` URL, 5-2048 characters.
3. Sunner clicks "Lưu" (E04) — the dialog closes and `{text, url}` is inserted into the parent
   message.

### Branches

| Decision point | Condition                                               | Outcome on this screen                       | Source        |
| -------------- | ------------------------------------------------------- | -------------------------------------------- | ------------- |
| Step 3         | E01 fails (empty, whitespace-only, or >100 chars)       | Inline error under "Text", dialog stays open | `TBD (draft)` |
| Step 3         | E02 fails (empty, invalid URL, or out of 5-2048 length) | Inline error under "Link", dialog stays open | `TBD (draft)` |
| Any step       | Sunner clicks "Hủy" or presses `Escape`                 | Dialog closes immediately, nothing saved     | `TBD (draft)` |

### Interaction Notes

- **Clicking the "Text" label moves focus into the Text input** — source: `TBD (draft)`.
- **A double-click on "Hủy" has no adverse effect** — the dialog simply closes once — source:
  `TBD (draft)`.

## 5. UI States

> N/A — no async ops. This dialog performs no network call of its own; "Lưu" only computes and
> returns a local `{text, url}` value to the parent editor (the parent's own submit, not this
> screen, is what eventually reaches the server).

| State   | Trigger                      | Visual Behavior                           | User Action Available              | Source        |
| ------- | ---------------------------- | ----------------------------------------- | ---------------------------------- | ------------- |
| error   | invalid Text or Link on save | per-field inline error, dialog stays open | fix the field(s), retry save       | `TBD (draft)` |
| success | valid save                   | dialog closes                             | none (returns to `SCR-write-kudo`) | `TBD (draft)` |

## 6. Validation & Feedback

| Element | Rule                                                  | Feedback                                          | Trigger    |
| ------- | ----------------------------------------------------- | ------------------------------------------------- | ---------- |
| E01     | Required, 1-100 characters, not whitespace-only       | "Độ dài 1-100 ký tự / Không chỉ gồm khoảng trắng" | save       |
| E02     | Required, valid `http`/`https` URL, 5-2048 characters | "Định dạng URL hợp lệ (http/https)"               | blur, save |

## 7. Conditional UI

N/A — no conditional UI detected. Both fields are always visible; only their validity state
changes.

## 8. Navigation

### Entry Points

| From           | Trigger there                                      | Condition | Source                                                                              |
| -------------- | -------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| SCR-write-kudo | click the editor's link toolbar button (E03 there) | —         | `components/kudos/kudos-content-editor.tsx:41-50` _(button exists, handler is new)_ |

### Exits

| Action | Element | Condition              | Destination    | Result                                          | Source        |
| ------ | ------- | ---------------------- | -------------- | ----------------------------------------------- | ------------- |
| Save   | E04     | E01 and E02 both valid | SCR-write-kudo | closes, `{text, url}` inserted into the message | `TBD (draft)` |
| Cancel | E03     | —                      | SCR-write-kudo | closes, nothing changed                         | `TBD (draft)` |

## 9. Accessibility

| Aspect                      | Status     | Notes                                                                                         |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | [EXPECTED] | Not yet implemented — component does not exist                                                |
| Keyboard navigation         | [EXPECTED] | `Escape`-to-close is spec-required (test cases confirm it); not yet implemented               |
| Focus management            | [EXPECTED] | Focus-on-label-click and a highlighted-border-on-focus are spec-required; not yet implemented |
| Screen reader compatibility | unknown    | Not tested — component does not exist                                                         |
| Error announcement          | [EXPECTED] | Per-field inline errors should use `aria-live`/`role="alert"` once built                      |

`[NO_A11Y_DETECTED]` — accessibility audit needed before production release; this screen has no
implementation yet.

## 10. Responsive Behavior

N/A — no responsive behavior found in source; the component does not exist yet, and the MoMorph
spec gives only a single fixed size (672x56px inputs).
