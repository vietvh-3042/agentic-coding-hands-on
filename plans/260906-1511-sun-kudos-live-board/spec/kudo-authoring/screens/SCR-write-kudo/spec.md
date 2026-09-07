---
status: draft
authored_by: takumi
created: 2026-09-06
---

# SCR-write-kudo — Screen Spec

**Screen**: SCR-write-kudo: Viết Kudo
**Feature**: F003_KudoAuthoring
**Type**: composite
**Route**: modal within `/sun-kudos` (no dedicated URL)
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** Lets a logged-in Sunner compose and send a kudo — a public thank-you — to a colleague,
with a message, up to 5 hashtags, up to 5 images, and an optional inserted link.
**Actors:** Sunner (kudo sender)
**Entry Conditions:** The Sunner is authenticated and has clicked the write-kudos bar on the
Kudos Live board.
**Exit Conditions:** The modal closes either on a successful submit (kudo saved) or on cancel
(Hủy / `Escape` / backdrop click — draft discarded).

## 2. Screen Layout

### Layout Sketch

A centered modal dialog over a dimmed backdrop (`components/kudos/kudos-form-modal.tsx:143-163`):
a title, then a vertical stack of fields (Recipient → message editor with a formatting toolbar →
Hashtag → Image → anonymous checkbox), and a footer with Hủy/Gửi anchored at the bottom.

```
┌───────────────────────────────────────────┐
│  R1: Title ("Gửi lời cám ơn...")          │
├───────────────────────────────────────────┤
│  R2: Recipient (label + search input)     │
│  R3: Message editor (toolbar + textarea)  │
│  R4: Hashtag (label + chips + "+Hashtag") │
│  R5: Image (label + thumbnails + "+Image")│
│  R6: Anonymous checkbox (+ name if checked)│
├───────────────────────────────────────────┤
│  R7: Footer (Hủy | Gửi)                   │
└───────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name           | Position | Scrollable                                 | Key Components                    |
| --------- | -------------- | -------- | ------------------------------------------ | --------------------------------- |
| R1        | Title          | static   | no                                         | plain text                        |
| R2        | Recipient      | static   | no                                         | `KudosRecipientSelect`            |
| R3        | Message editor | static   | no (textarea itself may scroll internally) | `KudosContentEditor`              |
| R4        | Hashtag        | static   | no                                         | `KudosHashtagInput`               |
| R5        | Image          | static   | no                                         | `KudosImageUpload`                |
| R6        | Anonymous      | static   | no                                         | checkbox + conditional text input |
| R7        | Footer         | static   | no                                         | Hủy / Gửi buttons                 |

## 3. UI Elements

| ID  | Element                                             | Type         | Required    | Default                                      | Visibility                             | Action                                                               | Source    | Format          | Empty Behavior               | Cross-ref                        |
| --- | --------------------------------------------------- | ------------ | ----------- | -------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- | --------- | --------------- | ---------------------------- | -------------------------------- |
| E01 | Người nhận                                          | text input   | yes         | Empty                                        | Always                                 | Opens autocomplete over Sunners; selecting one commits the recipient | API field | raw             | dash (red border)            | binding: `form.recipient`        |
| E02 | Toolbar: Đậm/Nghiêng/Gạch ngang/Danh sách/Trích dẫn | button (x5)  | —           | Enabled                                      | Always                                 | Presentational, no-op (Non-Scope, D002)                              | static    | —               | —                            | N/A                              |
| E03 | Toolbar: Chèn liên kết                              | button       | —           | Enabled                                      | Always                                 | Opens the Addlink Box (E10 in `SCR-addlink-box`)                     | static    | —               | —                            | binding: opens `SCR-addlink-box` |
| E04 | Message textarea                                    | textarea     | yes         | Empty                                        | Always                                 | Types the kudo message; shows a live character counter capped at 500 | computed  | raw, ≤500 chars | dash (red border)            | binding: `form.content`          |
| E05 | Hashtag chips + "+ Hashtag"                         | tag_group    | yes         | Empty                                        | Always                                 | Opens the hashtag picker dropdown; chips show an `x` to remove       | API field | raw             | dash                         | binding: `form.hashtags`         |
| E06 | Image thumbnails + "+ Image"                        | image_upload | no          | Empty                                        | Always                                 | Opens a file picker; button hides once 5 images are attached         | computed  | raw             | hidden (no thumbnails shown) | binding: `form.images`           |
| E07 | Gửi lời cám ơn và ghi nhận ẩn danh (checkbox)       | checkbox     | no          | unchecked                                    | Always                                 | Toggles the anonymous-name field (E08)                               | static    | —               | —                            | N/A                              |
| E08 | Anonymous display name                              | text input   | Conditional | Empty                                        | Conditional — only when E07 is checked | Types the name shown in place of the sender's own name               | API field | raw             | dash (red border)            | binding: `form.anonymousName`    |
| E09 | Hủy                                                 | button       | —           | Enabled                                      | Always                                 | Closes the modal, discards the draft                                 | static    | —               | —                            | N/A                              |
| E10 | Gửi                                                 | button       | —           | Enabled only when E01/E04/E05 are all filled | Always                                 | Submits the kudo via the Server Action                               | static    | —               | —                            | N/A                              |

## 4. User Actions

> **Scope:** within-screen interactions only. Opening `SCR-addlink-box` and returning is a
> cross-screen event — see `## 8. Navigation`.

### Available Actions

| Action           | Element | Trigger                       | Condition                     | Result on this screen                       | Source                                              |
| ---------------- | ------- | ----------------------------- | ----------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Search recipient | E01     | typing                        | ≥1 character                  | Filters the autocomplete list               | `components/kudos/kudos-recipient-select.tsx:48-50` |
| Select recipient | E01     | click a result                | —                             | Fills E01, closes the dropdown              | `components/kudos/kudos-recipient-select.tsx:90-99` |
| Pick a hashtag   | E05     | click "+ Hashtag" then a row  | count < 5                     | Adds a chip                                 | `components/kudos/kudos-hashtag-input.tsx:38-44`    |
| Remove a hashtag | E05     | click chip's `x`              | —                             | Removes the chip                            | `components/kudos/kudos-hashtag-input.tsx:46-47`    |
| Attach an image  | E06     | click "+ Image", pick file(s) | count < 5, `.jpg`/`.png` only | Adds thumbnail(s)                           | `components/kudos/kudos-image-upload.tsx:43-53`     |
| Remove an image  | E06     | click thumbnail's `x`         | —                             | Removes the thumbnail                       | `components/kudos/kudos-image-upload.tsx:55-59`     |
| Toggle anonymous | E07     | click checkbox                | —                             | Reveals/hides E08                           | `components/kudos/kudos-form-modal.tsx:228-238`     |
| Cancel           | E09     | click                         | —                             | Closes, discards draft                      | `components/kudos/kudos-form-modal.tsx:78-83`       |
| Submit           | E10     | click                         | E01, E04, E05 all filled      | Validates, shows loading, closes on success | `TBD (draft)` (planned Server Action)               |

### Happy Path

1. Sunner searches and selects a recipient in E01.
2. Sunner writes a message in E04 (under 500 characters).
3. Sunner picks 1-5 hashtags in E05.
4. Sunner optionally attaches up to 5 images in E06, optionally checks E07 and fills E08, and
   optionally opens the Addlink Box from E03 to insert a link.
5. Sunner clicks E10 "Gửi" — the button shows a loading state, then the modal closes.

### Branches

| Decision point | Condition                                             | Outcome on this screen                                                                    | Source                                          |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Step 5         | any required field (E01/E04/E05) empty                | E10 stays disabled; if forced, the empty field shows a red border + "Không được để trống" | `components/kudos/kudos-form-modal.tsx:86-92`   |
| Step 4         | E07 checked                                           | E08 appears, required before submit                                                       | `components/kudos/kudos-form-modal.tsx:228-238` |
| Step 5         | Server Action rejects (validation or network failure) | Modal stays open, inline error shown, draft preserved                                     | `TBD (draft)`                                   |

### Interaction Notes

- **Selecting a recipient from the dropdown fills the field and closes it** — source:
  `components/kudos/kudos-recipient-select.tsx:90-99`.
- **The image "+ Image" button hides once 5 images are attached, and reappears the moment one is
  removed** — source: `components/kudos/kudos-image-upload.tsx:88`.

## 5. UI States

| State                      | Trigger                   | Visual Behavior                             | User Action Available   | Source                                                                                                           |
| -------------------------- | ------------------------- | ------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| loading (recipient search) | typing in E01             | autocomplete list updates                   | none                    | `TBD (draft)` — currently synchronous mock filter, `components/kudos/kudos-recipient-select.tsx:48-50`           |
| empty (recipient results)  | 0 matches                 | "Không tìm thấy Sunner phù hợp"             | keep typing             | `components/kudos/kudos-recipient-select.tsx:84-87`                                                              |
| saving                     | E10 clicked, valid        | E10 disabled, shows a spinner/loading label | none                    | `TBD (draft)`                                                                                                    |
| error                      | Server Action rejects     | inline error banner, form stays populated   | retry (edit + resubmit) | `TBD (draft)`                                                                                                    |
| success                    | Server Action resolves ok | brief success indicator, then modal closes  | none                    | `components/kudos/kudos-form-modal.tsx:165-170` _(current fake-success variant, to be wired to the real result)_ |

## 6. Validation & Feedback

| Element | Rule                                         | Feedback                                                                    | Trigger                    |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------- | -------------------------- |
| E01     | Required; must resolve to an existing Sunner | "Không được để trống"                                                       | submit                     |
| E04     | Required, ≤500 characters                    | "Không được để trống" (empty) / a distinct too-long message (`TBD (draft)`) | change (counter), submit   |
| E05     | Required, 1-5 hashtags                       | "Không được để trống" (0 tags) / "Tối đa 5 hashtag" (6th attempt)           | submit / change            |
| E06     | ≤5 images, `.jpg`/`.png` only                | "Invalid file type — only .jpg and .png are accepted"                       | change (on file selection) |
| E08     | Required when E07 is checked                 | "Không được để trống"                                                       | submit                     |

## 7. Conditional UI

| Condition            | Type          | Element(s)        | Visible when                 | Hidden when               | Notes                                                 |
| -------------------- | ------------- | ----------------- | ---------------------------- | ------------------------- | ----------------------------------------------------- |
| Anonymous name field | configuration | E08               | E07 is checked               | E07 is unchecked          | Purely a client-side toggle, no feature flag involved |
| "+ Image" button     | configuration | E06 (add control) | fewer than 5 images attached | exactly 5 images attached | `components/kudos/kudos-image-upload.tsx:88`          |
| "+ Hashtag" button   | configuration | E05 (add control) | fewer than 5 hashtags picked | exactly 5 hashtags picked | `components/kudos/kudos-hashtag-input.tsx:70`         |

## 8. Navigation

### Entry Points

| From                               | Trigger there  | Condition               | Source                                             |
| ---------------------------------- | -------------- | ----------------------- | -------------------------------------------------- |
| Kudos Live board (write-kudos bar) | click the pill | Sunner is authenticated | `components/kudos-board/write-kudos-bar.tsx:14-23` |

### Exits

| Action           | Element | Condition        | Destination                 | Result                                               | Source                                        |
| ---------------- | ------- | ---------------- | --------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Cancel           | E09     | —                | (stays on Kudos Live board) | modal closes, draft discarded                        | `components/kudos/kudos-form-modal.tsx:78-83` |
| Submit success   | E10     | valid submission | (stays on Kudos Live board) | modal closes, new kudo appears on next board refresh | `TBD (draft)`                                 |
| Open Addlink Box | E03     | —                | SCR-addlink-box             | opens on top of this modal                           | `TBD (draft)` (planned handler)               |

## 9. Accessibility

| Aspect                      | Status     | Notes                                                                                                     |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | present    | `role="dialog"`, `aria-modal="true"`, `aria-label` on the modal root — `kudos-form-modal.tsx:157-160`     |
| Keyboard navigation         | partial    | `Escape` closes the modal (`kudos-form-modal.tsx:109-113`); full tab-order audit not yet done             |
| Focus management            | unmanaged  | No focus trap or initial-focus set on open today                                                          |
| Screen reader compatibility | unknown    | Not tested                                                                                                |
| Error announcement          | [EXPECTED] | Inline field errors should use `aria-live`/`role="alert"` — not implemented in the current mock-only form |

## 10. Responsive Behavior

N/A — no responsive behavior found in source (`max-w-[752px]` fixed-width modal,
`kudos-form-modal.tsx:161`); breakpoint behavior beyond that width is not specified.
