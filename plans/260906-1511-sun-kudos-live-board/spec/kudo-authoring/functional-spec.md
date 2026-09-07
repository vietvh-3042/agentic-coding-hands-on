---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Functional Spec — F003_KudoAuthoring

**Priority**: P0
**Type**: ui
**Generated**: 2026-09-06

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F003_KudoAuthoring → SCR-write-kudo, SCR-addlink-box → US001, US002

## 1. Overview

**Problem:** A Sunner wants to publicly thank a colleague, but the "Viết Kudo" form is wired to mock
data and a fake client-only submit — nothing actually reaches the database, and the editor's link
button does nothing at all.
**Solution:** Wire the existing compose form to a real recipient/hashtag data source and a Server
Action that persists the kudo, and build the missing Addlink Box so the editor's link button
becomes real.
**Scope:** Recipient selection, a ≤500-character message, 1-5 hashtags, up to 5 images, an optional
anonymous name, inserting a link via the Addlink Box, and a server-validated submit.
**Non-Scope:** Rich-text formatting (bold/italic/strikethrough/numbered-list/quote) and `@`-mention
autocomplete stay presentational/no-op — only the link button is made functional this pass. Editing
an already-sent kudo, a kudo-detail page, and the recipient/hashtag data sources' own master tables
(F005) are also out of scope here.

**Actors**

| Actor                | Description                           | Primary goal                                                                                               |
| -------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Sunner (kudo sender) | Any authenticated member of the event | Compose and send a kudo — with a message, hashtags, optional images, and an optional link — to a colleague |

This feature is part of the kudos data-layer batch — see the sibling
[F002_KudosBoardData](../F002_KudosBoardData/functional-spec.md) (board reads) and
[F005_HashtagTaxonomy](../F005_HashtagTaxonomy/functional-spec.md) (the hashtag master list this
feature consumes).

## 2. Functional Capabilities

| ID     | Capability                     | What the user can do                                                                                                                | User Stories | Requirements                                                                   | Business Rules                           | Screens         |
| ------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------ | ---------------------------------------- | --------------- |
| CAP-01 | Compose & send a kudo          | Pick a recipient, write a message, add up to 5 hashtags, optionally attach up to 5 images, optionally send anonymously, then submit | US001        | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, FR-601, FR-602 | BR-001, BR-002, BR-003, DEC-001, DEC-002 | SCR-write-kudo  |
| CAP-02 | Insert a link into the message | Open the Addlink Box from the editor toolbar, enter display text + a URL, save to insert or cancel to discard                       | US002        | FR-301, FR-302, FR-401, FR-402                                                 | BR-004, BR-005, DEC-003                  | SCR-addlink-box |

## 3. Open Decisions

| D### | Decision                                                                                                                             | Default proposal                                                                             | Rationale                                                                                                                                                                              | Blocks work |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D001 | The current form has a "Danh hiệu" (title/category) field with no counterpart in the MoMorph `ihQ26W78P2` spec — keep it or drop it? | Drop it — the field does not appear anywhere in the approved screen spec.                    | The requested scope (recipient, message, hashtags, images, Addlink Box) never mentions a title/category field; keeping an unspecified field risks shipping something nobody asked for. | no          |
| D002 | Should the editor's other five toolbar buttons (bold/italic/strikethrough/numbered-list/quote) become functional in this pass?       | No — only the link button (Addlink Box) is implemented.                                      | The clarified scope calls out only the link button and the Addlink Box as confirmed missing; the other five stay presentational/no-op as they are today.                               | no          |
| D003 | `kudos.hashtag_title` exists as a column separate from the new `kudo_hashtags` join table — does this feature write to it?           | No — leave it at its existing default (`''`); this feature only writes `kudo_hashtags` rows. | No spec field maps to `hashtag_title`; inventing a value for an unused column would be a fabrication.                                                                                  | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** Only an authenticated Sunner may open or submit the "Viết Kudo" form.

### Navigation (1xx)

- **FR-101** A Sunner opens "Viết Kudo" from the board's write-kudos entry bar.

### Viết Kudo (2xx)

- **FR-201** Recipient is required, chosen via autocomplete search over Sunners, minimum 1
  character.
- **FR-202** The message body is required and capped at 500 characters, shown with a live counter.
- **FR-203** Hashtags are required — minimum 1, maximum 5 — picked from the shared master hashtag
  list.
- **FR-204** Images are optional, maximum 5, only `.jpg`/`.png` accepted.
- **FR-205** Checking "send anonymously" reveals a required anonymous display-name field;
  unchecking hides it.
- **FR-206** "Gửi" stays disabled until recipient, message, and at least one hashtag are all
  filled.

### Addlink Box (3xx)

- **FR-301** The Addlink Box "Text" field is required, 1-100 characters, and rejects a
  whitespace-only value.
- **FR-302** The Addlink Box "Link" field is required, a valid `http`/`https` URL, 5-2048
  characters, checked on blur and on save.

### Interaction (4xx)

- **FR-401** Clicking the editor's link toolbar button opens the Addlink Box; saving a valid link
  inserts it into the message being composed.
- **FR-402** Closing the Addlink Box (Hủy, `Escape`, or clicking outside) discards it without
  changing the message.

### Security (6xx)

- **FR-601** The Server Action re-validates every field server-side (recipient exists, message
  ≤500 chars, hashtags 1-5, images ≤5 and correctly typed), regardless of what the client already
  checked.
- **FR-602** The `kudos` row is always inserted with `sender_id` equal to the authenticated
  caller's id; a client-supplied sender id is ignored.

## 5. Business Rules

- The message body must be no more than 500 characters; the client counter is a convenience, the
  server re-check is the actual control. (BR-001)
- Between 1 and 5 hashtags must be selected; a 6th pick is rejected both in the picker and again on
  submit. (BR-002)
- At most 5 images may be attached, and only `.jpg`/`.png` files are accepted; both checks run
  again on submit. (BR-003)
- Checking "send anonymously" reveals a required name field for the anonymous display name shown
  in place of the sender's own name. (DEC-001)
- "Gửi" only becomes clickable once a recipient, a message, and at least one hashtag are all
  present. (DEC-002)
- Saving the Addlink Box only succeeds once both its fields pass validation; otherwise it stays
  open with per-field errors. (DEC-003)
- The Addlink Box "Text" field must be 1-100 characters and not whitespace-only. (BR-004)
- The Addlink Box "Link" field must be a valid `http`/`https` URL, 5-2048 characters. (BR-005)

## 6. Screens

| Screen Name | SCR###          | What User Sees                                                                                                                                                                   | What User Can Do                                                                                                                         |
| ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Viết Kudo   | SCR-write-kudo  | A compose dialog: recipient field, a formatting toolbar over the message textarea, a hashtag chip field, an image thumbnail row, an anonymous-send checkbox, and Hủy/Gửi buttons | Pick a recipient, write and format a message, add up to 5 hashtags, attach up to 5 images, optionally send anonymously, submit or cancel |
| Add link    | SCR-addlink-box | A small dialog with a "Text" field and a "Link" field, and Hủy/Lưu buttons                                                                                                       | Enter link display text + a URL, save to insert the link into the message, or cancel without saving                                      |

### User Journey

1. Sunner clicks the write-kudos bar on the board and sees the Viết Kudo screen open, empty.
2. Sunner picks a recipient, writes a message, and adds hashtags — optionally, they click the
   editor's link icon and see the Add link screen open on top.
3. On the Add link screen, they enter display text and a URL and click "Lưu" — the screen closes
   and the link appears inside the Viết Kudo message.
4. Back on Viết Kudo, they optionally attach images and check "send anonymously", then click
   "Gửi" — the screen shows a brief loading state, then closes on success.

## 7. User Stories

### US001 — Compose and send a kudo

**Actor:** Sunner (kudo sender)
**Goal:** Send a kudo — a public thank-you — to a colleague with a message, hashtags, and
optional images.
**Business value:** Peer recognition is the core loop of the SAA program; without a working submit
path, no kudo the board displays is ever real.

**Acceptance Criteria:**

- [ ] A kudo cannot be submitted without a recipient, a message, and at least one hashtag.
- [ ] The message is capped at 500 characters, enforced both by the form and by the server.
- [ ] At most 5 hashtags and 5 images may be attached; only `.jpg`/`.png` images are accepted.
- [ ] Checking "send anonymously" requires an anonymous display name before submit.
- [ ] A successful submit closes the form and clears the draft; a failed submit keeps the draft
      and shows an error.

### US002 — Insert a link via the Addlink Box

**Actor:** Sunner (kudo sender)
**Goal:** Embed a hyperlink inside the kudo message without leaving the compose flow.
**Business value:** Lets a sender reference an external article, doc, or photo album as part of
their thank-you, which today is impossible — the link button is a documented no-op.

**Acceptance Criteria:**

- [ ] "Text" is required, 1-100 characters, and rejects a whitespace-only value.
- [ ] "Link" is required, a valid `http`/`https` URL, 5-2048 characters.
- [ ] Saving with valid fields inserts the link into the message and closes the dialog.
- [ ] Cancelling (Hủy, `Escape`, or clicking outside) discards without changing the message.
- [ ] Only one Addlink Box instance can be open at a time.

## 8. Scenarios

### US001 — Happy Path

**Given** a Sunner has opened Viết Kudo, **When** they pick a recipient, write a message under 500
characters, add one hashtag, and click "Gửi", **Then** the kudo is saved and the form closes.

### US001 — Error: required fields empty

**Given** a Sunner has opened Viết Kudo, **When** they click "Gửi" with the recipient, message, or
hashtag field empty, **Then** each empty required field shows a red border and "Không được để
trống", and nothing is submitted.

### US002 — Happy Path

**Given** the Addlink Box is open, **When** the Sunner enters a valid Text and a valid `https://`
Link and clicks "Lưu", **Then** the link is inserted into the message and the dialog closes.

### US002 — Error: malformed URL

**Given** the Addlink Box is open, **When** the Sunner enters an invalid URL into "Link" and blurs
the field or clicks "Lưu", **Then** an inline error appears under "Link" and the dialog stays open.

## 9. Edge Cases

| Scenario                                                     | What Happens                                                                                           | User-Facing Message                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Message body left empty                                      | "Gửi" stays disabled; a forced submit is rejected on the message field                                 | "Không được để trống"                                                                                 |
| Message body exceeds 500 characters                          | The counter turns red past the limit; the server rejects the whole submission                          | "Không được để trống" _(reused required-field message; a distinct "too long" message is TBD (draft))_ |
| A 6th hashtag is attempted                                   | The unselected hashtag rows disable once 5 are picked; the server rejects any payload with more than 5 | "Tối đa 5 hashtag"                                                                                    |
| No recipient selected                                        | "Gửi" stays disabled; a forced submit is rejected on the recipient field                               | "Không được để trống"                                                                                 |
| An image upload fails partway (e.g. network drop)            | The whole submission is aborted before any row is written — no partial kudo                            | "None — a generic retry error is shown; no partial data is ever saved"                                |
| Submitting while offline                                     | The Server Action call itself fails; the client shows a retry prompt and keeps the entered data        | "Couldn't reach the server — please try again"                                                        |
| A malformed URL is entered in the Addlink Box                | The Link field is rejected on blur and on save; the dialog stays open                                  | "Định dạng URL hợp lệ (http/https)"                                                                   |
| An unsupported image type is selected (`.pdf`/`.mp4`/`.txt`) | The file is rejected before it is added to the preview list                                            | "Invalid file type — only .jpg and .png are accepted"                                                 |

## 10. Edge Behaviours to Verify

- **FR-202** → Confirm a 501-character message is rejected by the server even if the client-side
  counter were bypassed.
- **FR-203** → Confirm a submission with 0 or 6+ hashtags is rejected server-side.
- **FR-204** → Confirm a non-`.jpg`/`.png` file is rejected both at selection time and if it
  somehow reaches the server.
- **FR-206** → Confirm "Gửi" re-disables if a required field is cleared after being filled.
- **FR-301** → Confirm a 101-character or whitespace-only "Text" value blocks the Addlink Box save.
- **FR-302** → Confirm a 4-character or non-`http(s)` "Link" value blocks the Addlink Box save.
- **FR-601** → Confirm every client-side check has a matching server-side re-check that fires even
  when the client check is bypassed (e.g. via a direct request).

## 11. Risks & Known Issues

N/A — none found. This is a greenfield draft; nothing has shipped yet to have observed defects in.

## 12. Dependencies

| Dependency                    | Type           | Why this feature needs it                                                                                   | Evidence                                                                          |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| F005_HashtagTaxonomy          | feature        | Supplies the master hashtag list the picker reads and the join table + insert policy this feature writes to | The join-table write is listed as F005's, not F003's, in the project feature list |
| `kudos-images` storage bucket | infrastructure | Destination for uploaded image attachments                                                                  | Bucket and its upload/read policies already exist in the database migrations      |
| Kudo insert policy            | infrastructure | Lets an authenticated Sunner insert their own kudo row                                                      | Policy already exists in the database migrations (see technical-spec.md § 4.4)    |

## 13. Configuration

```text
KUDOS_MAX_IMAGES = 5      # maximum images a Sunner can attach to one kudo
KUDOS_MAX_HASHTAGS = 5    # maximum hashtags a Sunner can pick for one kudo
KUDOS_MESSAGE_MAX_LENGTH = 500  # maximum characters in the message body
```
