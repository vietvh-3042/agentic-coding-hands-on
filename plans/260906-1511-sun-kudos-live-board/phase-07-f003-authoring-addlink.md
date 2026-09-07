# Phase 07 — F003 Kudo authoring + Addlink Box

## Context Links

- [`plan.md`](./plan.md) · [phase-04](./phase-04-seed-data.md) · [phase-05](./phase-05-shared-hashtag-module.md)
- [`spec/kudo-authoring/functional-spec.md`](./spec/kudo-authoring/functional-spec.md) ·
  [`technical-spec.md`](./spec/kudo-authoring/technical-spec.md) A1–A9
- Test cases: `plans/260709-1540-kudos-write-form/data/ihQ26W78P2-testcases.csv`
  (`ID-7`, `ID-11`, `ID-14..18`, `ID-21`, `ID-41..44`, `ID-46..49`, `ID-50..56`) and
  `OyDLDuSGEa-testcases.csv` (`3912184e`, `adb699ca`, `7d85997d`, `97dc4028`, `db2ca333`,
  `aad5791a`, `13c491cb`, `48467d34`, `e5632ac7`, `ef4d0413`)
- MoMorph: [Viết Kudo](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2) ·
  [Addlink Box](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/OyDLDuSGEa)

## Overview

- **Priority:** P0
- **Status:** completed (RED→GREEN)
- Fake submit replaced with real Server Action, `MOCK_SUNNERS` replaced with DB search, hashtag
  picker wired to 13 real rows, and Addlink Box built with link validation (http/https).
- **Policy: `e2e-red-first`.** Every rule tested and green.

## Key Insights

- **Today's submit is theatre.** `kudos-form-modal.tsx:137-140` resolves after a 1200 ms timeout
  and always "succeeds". Nothing reaches Supabase. That handler is deleted, not extended.
- **The character counter does not exist yet.** There is no message-length state anywhere in the
  form. The 500-cap is _new on both sides_: a counter for UX and a server re-check that is the
  actual control (BR-001, FR-601). A test that only exercises the counter proves nothing — the
  RED must include a direct action invocation with a 501-character body.
- **`accept="image/*"` is a picker hint, not a validation.** Drag-and-drop and "all files"
  bypass it. Add an explicit MIME/extension check after selection **and** a server-side re-check
  (BR-003).
- **Uploads must complete before the row is written.** If image 3 of 5 fails, no `kudos` row may
  exist with a partial `image_urls`. Upload first, insert last, and delete the already-uploaded
  objects on abort — the storage policy already scopes writes to `{auth.uid()}/…`.
- **`kudo_hashtags` rows are part of the same submit.** The policy phase 03 adds requires the
  parent kudo to exist and to be the caller's, so the order is: upload → insert kudo → insert
  joins. A failure after the kudo insert leaves an untagged kudo; accept it and record it (an
  untagged kudo is visible-but-unfiltered, not corrupt), or wrap both inserts in a small RPC if it
  proves to matter. Do not build the RPC speculatively.
- **The anonymous-name field does not exist.** `kudos-form-modal.tsx:228-238` flips the boolean
  only; the required reveal (DEC-001, TC `ID-43`) is new.
- **Drop the "Danh hiệu" field** (D001) — it appears in no MoMorph spec for this screen.
- The other five toolbar buttons stay no-ops (D002). Only the link button becomes real.
- `kudos-form-modal.tsx` is 263 lines — **already over budget**. Splitting it is part of this
  phase, not a nice-to-have.

## Requirements

- **FN-1 (A2)** Recipient autocomplete over `profiles.display_name`, min 1 char, required, commits
  an id — free text never submits.
- **FN-2 (A3)** Hashtag picker reads the 13 real rows, 1–5 selectable, unselected rows disable at 5.
- **FN-3 (A4)** ≤ 5 images, `.jpg`/`.png` only, checked at selection and again server-side.
- **FN-4 (A5)** Anonymous checkbox reveals a required name field; unchecking clears it.
- **FN-5 (A6)** `submitKudoAction` re-validates recipient existence, ≤ 500 chars, 1–5 hashtags,
  ≤ 5 images and their types, and forces `sender_id = auth.uid()` (FR-602).
- **FN-6 (A7–A9)** Addlink Box: Text required 1–100 non-whitespace; Link required, `http`/`https`,
  5–2048 chars; validate on blur and on save; Hủy/Escape/backdrop discard; only one instance open.
- **FN-7** `'Gửi'` enabled only with recipient + message + ≥ 1 hashtag (+ anonymous name when
  checked).
- **NFR-1** Every file under 200 lines.
- **NFR-2** Reuse the phase-02 shadcn `dialog`/`input`; do not hand-build another modal shell.

## Architecture

```text
WriteKudosBar → KudosFormModal (client)
   ├─ KudosRecipientSelect  → browser supabase: profiles ilike  (RLS: public read)
   ├─ KudosHashtagInput     → 13 rows passed in as props from the page (phase 05/06)
   ├─ KudosContentEditor    → link button → AddlinkBox → {text,url} → inserted into the draft
   ├─ KudosImageUpload      → File[] previews (object URLs)
   └─ submit → submitKudoAction(FormData)   "use server"
         getUser() → validate (lib/kudos/kudo-validation.ts, shared with the client)
         → upload N files to kudos-images/{uid}/…   (rollback on partial failure)
         → insert kudos (sender_id = auth.uid())
         → insert kudo_hashtags[]
         → revalidatePath('/sun-kudos')
```

`kudo-validation.ts` is the single rule source both sides import — the client renders the errors,
the server enforces them (DRY, and it makes "the counter is UX, not a control" structurally true).

## Related Code Files

**Create**

- `components/kudos/addlink-box.tsx`
- `components/kudos/kudos-form-fields.tsx` (extracted from the oversized modal)
- `app/sun-kudos/actions/submit-kudo.ts`
- `lib/kudos/kudo-validation.ts`
- `lib/kudos/upload-kudo-images.ts`

**Modify**

- `components/kudos/{kudos-form-modal,kudos-recipient-select,kudos-hashtag-input,kudos-image-upload,kudos-content-editor}.tsx`
- `components/kudos-board/write-kudos-bar.tsx`
- `lib/i18n/locales/{en,vi}/kudos.json` — Addlink Box + counter + error copy from the MoMorph spec

**Delete** — `components/kudos/kudos-mock-data.ts`

## Implementation Steps

1. **RED first.** Two specs, project `chromium-authed`:
   - `e2e/kudo-authoring.spec.ts` — open the modal from the bar (`ID-2`); `'Gửi'` disabled until
     recipient + message + hashtag (`ID-48`); recipient autocomplete returns a seeded profile
     (`ID-8`); the 6th hashtag row is disabled (`ID-16`); a `.pdf` is rejected (`ID-21`); the
     anonymous checkbox reveals a required name (`ID-43`); a full happy-path submit closes the
     modal and the new kudo appears at the top of the feed after reload (`ca8f60b3`); a
     501-character body is rejected server-side (`ID-11`/FR-202 edge).
   - `e2e/addlink-box.spec.ts` — whitespace-only Text blocked (`adb699ca`); 101 chars blocked
     (`7d85997d`); `not-a-url` blocked on blur and on save (`db2ca333`); a 4-char Link blocked
     (`aad5791a`); a valid save inserts the link into the message and closes (`13c491cb`,
     `ef4d0413`); Hủy/Escape discards (`48467d34`).
     Record `redCommand` / `redExitCode` / an assertion-caused `redFailure`.
2. `lib/kudos/kudo-validation.ts` — pure functions + a `validateKudoDraft(input)` returning field
   errors. Constants come from `constants/index.ts` (`KUDOS_MAX_IMAGES`, `KUDOS_MAX_HASHTAGS`) plus
   a new `KUDOS_MESSAGE_MAX_LENGTH = 500`.
3. Recipient select: swap `MOCK_SUNNERS` for a debounced browser query
   `select id, display_name, avatar_url from profiles where display_name ilike %q% limit 10`.
   Keep the existing empty-state key.
4. Hashtag input: accept `hashtags: Hashtag[]` as a prop (fetched once on the page), drop the
   `SAA_HASHTAGS` import, keep the existing toggle/disable/chip logic untouched.
5. Image upload: add the post-selection MIME + extension check and the inline error string.
6. Content editor: give the link button an `onClick` that opens `AddlinkBox`; on save, splice
   `[text](url)` into the textarea at the caret (fall back to append if the caret is unknown) and
   return focus. Add the live character counter under the textarea, turning red past 500.
7. `AddlinkBox` on the shadcn `dialog`: two fields, blur + save validation, Hủy/Escape/backdrop
   close, single-instance guard mirroring `KudosFormModal`'s `open` gate.
8. Anonymous reveal: new `anonymousName` form key, required when checked, cleared on uncheck, and
   folded into the `isValid` memo.
9. `submitKudoAction`: `getUser()` → `validateKudoDraft` → `uploadKudoImages` (with rollback) →
   insert kudos → insert `kudo_hashtags` → `revalidatePath('/sun-kudos')`. Return
   `{ ok } | { error, fieldErrors }`; never throw to the client.
10. Replace the fake `handleSubmit`; split the modal; delete `kudos-mock-data.ts`.
11. `pnpm validate` + both specs GREEN.

## Todo List

- [x] Both spec files written; assertion-caused RED recorded
- [x] `kudo-validation.ts` shared by client and server
- [x] Recipient autocomplete on real `profiles`
- [x] Hashtag picker on the 13 real rows, max 5 enforced both sides
- [x] Image MIME/extension check client + server
- [x] Anonymous name field revealed and required
- [x] Addlink Box built, validated, single-instance, insert + discard paths
- [x] Character counter + 500-char server rejection
- [x] `submitKudoAction` with upload rollback; `sender_id` forced from `auth.uid()`
- [x] "Danh hiệu" field removed; `kudos-mock-data.ts` deleted
- [x] All touched files under 200 lines; `pnpm validate` green

## Success Criteria

- A happy-path submit creates exactly one `kudos` row with `sender_id = auth.uid()` and N
  `kudo_hashtags` rows; the kudo is first in the feed after reload.
- A direct `submitKudoAction` call with a 501-char message, 0 hashtags, 6 hashtags, or 6 images is
  rejected and writes **nothing** — verified by row counts before and after.
- A submit whose second image upload fails leaves zero `kudos` rows and zero orphaned objects
  under `kudos-images/{uid}/`.
- Every Addlink Box validation TC above asserts and passes.
- `grep -rn "MOCK_SUNNERS\|kudos-mock-data" components/` returns nothing.

## Risk Assessment

| Risk                                                                                                   | L×I     | Countermeasure                                                                                                                     |
| ------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Caret-position insertion in a plain `<textarea>` misplaces the link                                    | M×L     | `selectionStart` splice with an append fallback; the test asserts the link is present, not its exact offset                        |
| Storage rollback leaves orphans when the delete itself fails                                           | M×M     | Best-effort delete + a logged warning; an orphan in a public demo bucket is cosmetic, a partial kudo is not                        |
| `revalidatePath('/sun-kudos')` does not refresh a client-held feed                                     | M×M     | The modal closes and the action returns `ok`; the feed refresh is a `router.refresh()` on the client after success                 |
| Message stored as raw text but the board renders HTML (`<p>`-wrapped, per the existing column comment) | M×**H** | Escape on the way in and wrap in `<p>`; never `dangerouslySetInnerHTML` on user input. Assert a `<script>` payload renders as text |
| Splitting the 263-line modal churns shipped visual work                                                | M×M     | Extract fields wholesale, no restyling; the design is already approved and untouched (`visual-contract` territory)                 |
| `KudosHashtagInput` prop change ripples into phase 06's page                                           | M×L     | The page already fetches `getHashtags()` for the board dropdown — one fetch, two consumers                                         |

## Security Considerations

- FR-602 is non-negotiable: `sender_id` comes from `getUser()`, and any client-supplied value is
  discarded before the insert.
- Every client check has a server twin (FR-601) — that is the acceptance bar for this phase, and
  the 501-char direct-invocation test is what proves it.
- Uploads stay under `{auth.uid()}/`; the storage policy enforces it, the code must not fight it.
- The message is user input rendered on a public board: escape it, and never trust the link URL
  beyond an `http(s)` scheme check.

## Next Steps

Runs in parallel with 06 and 09. Feeds phase 10.
