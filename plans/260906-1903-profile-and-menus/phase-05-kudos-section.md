# Phase 05 — KUDOS section: direction dropdown, feeds, paging, interactions

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q6)
- Specs: [`data/3FoIx6ALVb-specs.csv`](./data/3FoIx6ALVb-specs.csv) rows `mms_C_Header Giải thưởng`,
  `mms_C.1_title`, `mms_C.2_KUDOS title`, `mms_C.3_Button`, `mms_D_Post all`, `mms_D.3.1_Status`
- Test cases: `FUN_009..015`, `SEC_001..003`, `GUI_006`, `GUI_007`, `GUI_008`, `GUI_012`
- Data layer: [`phase-02`](./phase-02-profile-read-layer.md) — `getReceivedFeed`, `getSentFeed`

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 4.5h
**Depends on:** 04 · **Batch A F002** (board mapper, card, keyset cursor) · **F004** (`heartKudo`) ·
**F005** (hashtag → board filter)
**test_policy:** **`e2e-red-first`**
**redTestFiles:** `e2e/profile-kudos-section.spec.ts`
**redCommand:** `pnpm test:e2e --project=profile --grep "profile-kudos-section"`

The lower half of the screen: a direction dropdown over an infinitely-scrolling feed of the same
cards the board renders. This phase carries **the single most important case on the screen**
(`SEC_001`) and the two that sit either side of it.

## Key Insights

- **`SEC_001` — "The leak is closed by removing the surface, not by adjusting the count."** On
  another Sunner's profile the dropdown must contain **exactly one** option. Their sent count
  includes anonymous Kudos no feed will ever show, so publishing the number — or a Sent list that
  contradicts it — reveals how many anonymous Kudos they sent. The option list is derived from
  `stats === null`, the same phase-02 branch phase 04 uses. One fact, one source.
- **`SEC_002` is the mirror image and is easy to get backwards.** Your own Sent list must include the
  Kudos you sent anonymously **and show you as their author**, because the public feed masks the
  sender and a naive sender-filter through the board's masking mapper would drop them, under-reporting
  against the very count printed beside them. Served by phase 02's caller-scoped definer view. The
  card is still marked as having been sent anonymously — masked-alias placeholder for others,
  your own name for you.
- **`GUI_006` forbids a second card component.** Same mapper, same column list, same card — sender,
  recipient, title, body, timestamp, hashtags, attachments, hearts, Copy Link — so the profile feed
  and the board cannot diverge. Import Batch A's card; do not fork it.
- **`FUN_010`: switching direction discards the other list.** Infinite scroll accumulates pages; a
  switch replaces the feed with page 1 of the new direction and drops what was stacked. And the
  trigger label updates **only once the new page has actually loaded** — never optimistically.
- **`FUN_011`: re-picking the active option is a no-op, not a clear.** There is no unfiltered state
  for this list to fall back to. The dropdown closes, no request is issued, the list does not blank.
  This is the opposite of `highlight-filter-dropdown.tsx`'s toggle-to-null behaviour — do **not**
  reuse that component's selection semantics here even though the shell looks similar.
- **`FUN_012`: two empty states, not one.** "No Kudos yet" and "you have not sent any" are different
  facts. The received wording matches the board's verbatim; the sent wording is new.
- **`GUI_007`: the Spam chip is never rendered.** No moderation model exists in the schema
  (`kudos.is_spam` exists but nothing sets it meaningfully) or in the specs. Carry a typed `status`
  field on the card shape — already required by phase 02 — so the chip can be switched on later
  without reshaping anything, and render nothing today.
- **`FUN_015`: the profile has no hashtag filter of its own.** A tag click navigates **out** to the
  board filtered by that tag — the board already answers "who else was thanked for this", which is
  what clicking a tag is asking. Note the board route is `/sun-kudos`; the test cases' `/kudos` does
  not exist.
- **`FUN_014`: hearts go through Batch A's action untouched**, including the refusal on your own
  Kudo, and the count shown is the value the **server** reports — not a locally incremented one.

## Requirements

**Functional**

- FR-B501 — self view: trigger reads `Đã nhận (N)`; opening lists exactly two options with the
  caller's received and sent counts; Received is active first (`FUN_009`).
- FR-B502 — other view: exactly one option, `Đã nhận (N)`; the string `Đã gửi` appears nowhere on the
  page (`SEC_001`).
- FR-B503 — own Sent list includes own anonymous Kudos, attributed to the caller, card count equal to
  the label count (`SEC_002`).
- FR-B504 — two sessions' Sent lists are disjoint; no request shape can ask for another Sunner's
  (`SEC_003`).
- FR-B505 — cards are the board's cards, with anonymous senders masked on a Received list (`GUI_006`).
- FR-B506 — a direction switch loads page 1 and discards the previous direction's pages; the label
  updates only after the load (`FUN_010`).
- FR-B507 — re-selecting the active option closes the menu and issues no request (`FUN_011`).
- FR-B508 — distinct empty copy per direction (`FUN_012`).
- FR-B509 — infinite scroll, 10 at a time, keyset cursor, no duplicate or skipped card, end-of-feed
  message on the last page (`FUN_013`).
- FR-B510 — heart toggles through the existing server action and refuses on own Kudos with the
  board's message; the displayed count is the server's (`FUN_014`).
- FR-B511 — hashtag click navigates to `/sun-kudos` filtered by that tag; Copy Link copies and shows
  the board's toast (`FUN_015`).
- FR-B512 — no Spam chip in any direction, in any state (`GUI_007`).

**Non-functional**

- Three files, each well under 200 lines: section container, dropdown, feed list. The section is the
  only client component holding direction state.
- Zero forked board code: card, mapper, cursor helper, heart action and copy-link toast are all
  imported.

## Architecture

```text
ProfileKudosSection (client) ── owns { direction, pages[], cursor, pending }
  ├─ ProfileDirectionDropdown        options derived from stats === null
  │     self  → [ received(N), sent(M) ]
  │     other → [ received(N) ]                        ← SEC_001
  └─ ProfileFeed
        ├─ Batch A <FeedKudoPostCard/>  ×N             ← GUI_006, imported
        ├─ IntersectionObserver sentinel → next page   ← FUN_013
        └─ empty copy | end-of-feed copy               ← FUN_012

server: getReceivedFeed(targetId, cursor)   |   getSentFeed(cursor)   ← no target param, SEC_003
```

**Data flow**

| In                        | Transform                                             | Out                               |
| ------------------------- | ----------------------------------------------------- | --------------------------------- |
| `stats` (`null` off-self) | option-list derivation                                | 1 or 2 dropdown options           |
| direction change          | discard `pages`, fetch page 1, **then** set the label | fresh feed + updated trigger      |
| same direction re-picked  | early return before any fetch                         | menu closes, nothing else changes |
| sentinel intersects       | keyset cursor → next 10                               | appended page, or end-of-feed     |
| heart click               | Batch A `heartKudo` action                            | **server-reported** count         |
| hashtag click             | `router.push("/sun-kudos?hashtag=…")`                 | filtered board                    |

## Related Code Files

**Create**

- `components/profile/profile-kudos-section.tsx` (~120, client)
- `components/profile/profile-direction-dropdown.tsx` (~80, client)
- `components/profile/profile-feed.tsx` (~90, client)
- `e2e/profile-kudos-section.spec.ts`

**Modify**

- `app/profile/page.tsx` — fill the phase-03 KUDOS slot (this hunk only)
- `lib/i18n/locales/{vi,en}/profile.json` — direction labels with counts, two empty strings,
  end-of-feed copy

**Read for context (do not modify — Batch A owns all of these)**

- `components/kudos-board/feed-kudo-post-card.tsx` — the card (`GUI_006`)
- `components/kudos-board/feed-list.tsx` — the paging pattern to mirror
- `components/kudos-board/use-copy-link-toast.tsx` — the toast (`FUN_015`)
- `components/kudos-board/highlight-filter-dropdown.tsx` — the dropdown **shell** only; its
  toggle-to-null selection semantics are wrong here (`FUN_011`)

## Implementation Steps

1. **RED first.** Write `e2e/profile-kudos-section.spec.ts` covering FR-B501/502/506/507/508/512 and
   run `redCommand`. Record the assertion-caused failure.
2. Confirm A-F002's card and cursor helper and A-F004's `heartKudo` exist and are importable.
   Missing → **BLOCKED**; do not fork them.
3. `profile-direction-dropdown.tsx` — options in, selection out. **No internal toggle-to-null.**
   Re-picking the active option calls back with the same value; the section short-circuits.
4. `profile-feed.tsx` — render imported cards, sentinel, the two empty states and the end-of-feed
   message. No card markup of its own.
5. `profile-kudos-section.tsx` — direction state, page accumulation, discard-on-switch, and the
   deferred label update (`FUN_010`). This is the only place any of that lives.
6. i18n: both bundles, counts interpolated (`Received (12)`), key parity asserted (`GUI_008`).
7. Wire into the page. Re-run `redCommand` → GREEN. `pnpm validate`.
8. Manual: `SEC_003` with two live browser sessions — a single-session test cannot demonstrate it.

## Todo List

- [ ] RED recorded, assertion-caused
- [ ] Batch A card / cursor / heart action confirmed importable (else BLOCKED)
- [ ] Other profile: dropdown has exactly one option; `Đã gửi` absent from the whole page **payload**
- [ ] Own Sent list includes own anonymous Kudo, attributed to the caller
- [ ] Card count equals the label count on the Sent list
- [ ] Direction switch discards prior pages; label updates only after the load
- [ ] Re-picking the active option issues no request and does not blank the list
- [ ] Two distinct empty strings; received wording matches the board verbatim
- [ ] Infinite scroll, 10/page, keyset cursor, end-of-feed message
- [ ] Heart count comes from the server response
- [ ] Hashtag click lands on `/sun-kudos` filtered; Copy Link shows the board toast
- [ ] No Spam chip anywhere; `status` field present and unrendered
- [ ] Three files, each < 200 lines
- [ ] `SEC_003` verified with two live sessions
- [ ] `pnpm validate` exits 0

## Success Criteria

| ID      | Criterion     | Method                                                                                                   |
| ------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| SC-B501 | `FUN_009`     | trigger text + exactly two options with correct counts                                                   |
| SC-B502 | **`SEC_001`** | on `?id={other}`: option count is 1 **and** `/Đã gửi\|Sent \(/` has zero matches in the raw HTML payload |
| SC-B503 | `SEC_002`     | seeded anonymous sent Kudo visible on own Sent list, authored by the caller; card count == label count   |
| SC-B504 | `SEC_003`     | two live sessions, lists disjoint (manual, phase 07)                                                     |
| SC-B505 | `GUI_006`     | same card testid/structure as `/sun-kudos`; anonymous sender masked on Received                          |
| SC-B506 | `FUN_010`     | scroll to page 2, switch, assert card count == 10 and label updated after                                |
| SC-B507 | `FUN_011`     | network-request count unchanged across the re-pick                                                       |
| SC-B508 | `FUN_012`     | both empty strings asserted on their respective fixtures                                                 |
| SC-B509 | `FUN_013`     | no duplicate card id across three pages; end-of-feed message present                                     |
| SC-B512 | `GUI_007`     | Spam-chip locator count 0 in both directions                                                             |
| GREEN   | `redCommand`  | exit 0                                                                                                   |

## Risk Assessment

| Risk                                                                              | Likelihood                                    | Impact                   | Countermeasure                                                                        |
| --------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| Sent option merely hidden client-side while the count still ships                 | Medium                                        | **Critical** (`SEC_001`) | Derived from `stats === null` server-side; SC-B502 greps the raw payload, not the DOM |
| Own anonymous sent Kudos silently dropped, under-reporting against the label      | **High** (the naive filter does exactly this) | High                     | Phase 02's definer view; SC-B503 asserts count equality, which is what catches it     |
| Board card forked "just to add the direction"                                     | Medium                                        | High                     | `GUI_006` Note is explicit; SC-B505 compares structure against `/sun-kudos`           |
| `highlight-filter-dropdown.tsx` reused wholesale → toggle-to-null blanks the feed | **High** (it looks like the right component)  | Medium                   | Called out in Key Insights, Implementation step 3 and a todo item; SC-B507 catches it |
| Optimistic label update makes the trigger lie during a slow load                  | Medium                                        | Low                      | `FUN_010` states the ordering; SC-B506 asserts it                                     |
| Offset paging instead of keyset → duplicated/skipped cards as Kudos arrive        | Medium                                        | Medium                   | Cursor helper imported from A-F002; SC-B509 asserts no duplicate ids                  |
| Locally incremented heart count diverges from the server (multiplier day)         | Medium                                        | Medium                   | `FUN_014`: render the server-reported value only                                      |
| A-F004/F005 not merged when this phase starts                                     | Medium                                        | Medium                   | Hard dependency; step 2 reports BLOCKED                                               |

## Security Considerations

- `SEC_001` and `SEC_003` are **authorization** cases wearing UI clothes. Both are enforced by
  phase 02's query layer; anything this phase does is presentation on top of an already-closed door.
  A reviewer should verify the door, then the presentation.
- `getSentFeed` takes no target id. If a future edit adds one, `SEC_003` is broken regardless of what
  the UI sends — the parameter's absence is the control.
- The base `kudos` SELECT policy remains permissive, so the data API still exposes `sender_id` on
  anonymous rows. Recorded as [Q6](./clarifications.md); do not claim this phase closes it.
- Copy Link must copy a link to the Kudo, never anything derived from the viewer's session.

## Next Steps

Unblocks **phase 07**. Report the GREEN rerun, the raw-payload check for SC-B502, and the two-session
`SEC_003` result.

## Rollback

`rm components/profile/profile-{kudos-section,direction-dropdown,feed}.tsx
e2e/profile-kudos-section.spec.ts`, revert the page hunk and the added i18n keys. Hero, badges and
the phase-04 slot keep working; no schema or data is touched.
