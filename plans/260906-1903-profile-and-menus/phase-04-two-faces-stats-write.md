# Phase 04 — The two faces: statistics card vs write-Kudo bar

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q5)
- Specs: [`data/3FoIx6ALVb-specs.csv`](./data/3FoIx6ALVb-specs.csv) rows `mms_B_Thống kê`,
  `mms_B.1`–`mms_B.5` (the five counters), `mms_B.6_Button mở quà`
- Test cases: `GUI_004`, `GUI_005`, `FUN_006`, `FUN_007`, `FUN_008`, `SEC_001` (surface half), `SEC_004`
- Data layer: [`phase-02`](./phase-02-profile-read-layer.md) — `getProfileStats` returns `null` off-self
- Shell: [`phase-03`](./phase-03-route-shell-hero-badges.md)

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 3h
**Depends on:** 03 · **Batch A F003** (`KudosFormModal` recipient prop)
**test_policy:** **`e2e-red-first`**
**redTestFiles:** `e2e/profile-two-faces.spec.ts`
**redCommand:** `pnpm test:e2e --project=profile --grep "profile-two-faces"`

One slot on the page — item `mms_B_Thống kê` — holds two mutually exclusive things: your five
counters on your own profile, a write-Kudo bar on anyone else's. Never both, never neither.

## Key Insights

- **The branch is already decided in the data, not here.** `getProfileStats` returns `null` for any
  target that is not the caller. This phase renders `stats ? <StatsCard/> : <WriteBar/>` and that
  single expression satisfies `GUI_004`, `FUN_006`, `FUN_008` and the surface half of `SEC_001` at
  once. Adding a second `isSelf` boolean here would be a second source of truth for one fact.
- **`SEC_001` is why the whole card is swapped rather than reused with the numbers blanked.** A
  Sunner's sent count includes Kudos they sent anonymously. Rendering the card with a hidden row
  still ships the number to the client. Replace the component; do not style it away.
- **The labels are second-person (`bạn`)** — that is the stated reason the card cannot be reused on
  someone else's profile, and it is worth restating in the component doc comment so nobody
  "generalises" it later.
- **Reuse `SidebarStats`' row shape, not the component.** `components/kudos-board/sidebar-stats.tsx`
  renders the same five concepts plus the divider and the "Mở Secret Box" button, and its label
  wording is what `GUI_008` says the profile must match. But it is `"use client"`, reads
  `OVERVIEW_STATS` mock data, and owns the gift dialog. Extract nothing from it this batch — Batch A
  is actively replacing its data source. Mirror its **label keys and row proportions**, take its
  values from `getProfileStats`, and record the near-duplication as a deliberate, temporary cost with
  a named trigger for merging (see Risk).
- **`FUN_007` is an optional prop with a `null` default.** The write bar opens the existing
  `KudosFormModal` with the recipient pre-filled and the suggestion list **not** popped open over the
  untouched field, and the field stays editable. Defaulting to `null` is what keeps the homepage and
  board compose flows byte-identical.
- **`GUI_005` and the live seed disagree** — the test case says both Secret Box rows read `0` and the
  button is disabled; the demo profile carries `boxes_opened = 25, boxes_unopened = 25` and Batch A
  F006 is making that button work. [Q5](./clarifications.md) must be answered before this phase is
  forged. The fallback assumed by the blueprint: real counters, button rendered **disabled** on
  `/profile`, no second entry point into F006.

## Requirements

**Functional**

- FR-B401 — on the self view the slot renders five rows with the caller's real counters: Kudos
  received, Kudos sent, hearts received, divider, boxes opened, boxes unopened (`GUI_004`).
- FR-B402 — on another Sunner's profile the same slot renders a write-Kudo bar naming that Sunner,
  and **no** statistics row, counter or "Mở Secret Box" button appears anywhere on the page
  (`FUN_006`).
- FR-B403 — clicking the bar opens `KudosFormModal` with that Sunner pre-selected, the suggestion
  list closed, and the field editable (`FUN_007`).
- FR-B404 — the self view renders no write-Kudo bar (`FUN_008`).
- FR-B405 — the Secret Box button is non-interactive on this page: clicking produces no dialog, no
  navigation and no error (`GUI_005`, subject to Q5).
- FR-B406 — no edit affordance on name, avatar or department on either face (`SEC_004`).

**Non-functional**

- Both components under 200 lines. The write bar is a thin client leaf; the stats card is a server
  component with no interactivity at all.
- Label keys live in the `profile` namespace but must read identically to the board sidebar's
  wording in both locales (`GUI_008`).

## Architecture

```text
app/profile/page.tsx
  const stats = await getProfileStats(target.id, user.id)   // null unless self
  …
  {stats
    ? <ProfileStatsCard {...stats} />          server, zero client JS
    : <ProfileWriteBar recipient={header} />}  client leaf (opens the modal)

ProfileWriteBar (client)
  └─ <KudosFormModal open recipient={recipient} onClose={…} />
                              ▲ optional prop, default null  ← Batch A F003 owns the prop
```

**Data flow**

| In                     | Transform                     | Out                                          |
| ---------------------- | ----------------------------- | -------------------------------------------- |
| `target.id`, `user.id` | `getProfileStats`             | `ProfileStats` when self, else `null`        |
| `stats`                | one ternary in the page       | stats card XOR write bar                     |
| click on the bar       | `setOpen(true)` + `recipient` | modal with the field pre-filled, list closed |

There is deliberately **no** state in the page for this. The face is a function of the request.

## Related Code Files

**Create**

- `components/profile/profile-stats-card.tsx` (~80, server)
- `components/profile/profile-write-bar.tsx` (~60, client)

**Modify**

- `app/profile/page.tsx` — fill the phase-03 slot with the ternary (this phase owns that hunk only)
- `e2e/profile-two-faces.spec.ts` — new

**Read for context (do not modify)**

- `components/kudos-board/sidebar-stats.tsx` — label wording and row proportions to mirror
- `components/kudos-board/write-kudos-bar.tsx` — the board's bar; the profile bar is a narrower
  sibling (no search input)
- `components/kudos/kudos-form-modal.tsx`, `components/kudos/kudos-recipient-select.tsx` — **Batch A
  F003 owns these.** The `recipient` prop is an A-F003 deliverable; if it is absent when this phase
  starts, report BLOCKED rather than editing a file another batch owns.

## Implementation Steps

1. **RED first.** `e2e/profile-two-faces.spec.ts`: self view shows five counters and no bar; other
   view shows the bar naming that Sunner and **zero** occurrences of the counter labels; clicking the
   bar opens the modal with the recipient pre-filled. Run `redCommand`, record the failure.
2. Confirm `KudosFormModal` accepts an optional `recipient`. Absent → **BLOCKED**, hand back to the
   orchestrator for A-F003.
3. `profile-stats-card.tsx` — five rows plus the divider, values from `getProfileStats`, second-person
   labels, disabled Secret Box button. Server component; no `"use client"`.
4. `profile-write-bar.tsx` — client leaf, `useState` for the modal, passes `recipient`. Nothing else.
5. Wire the ternary into the page.
6. Re-run `redCommand` → GREEN. `pnpm validate`.

## Todo List

- [ ] RED recorded, assertion-caused
- [ ] `KudosFormModal` recipient prop confirmed present (else BLOCKED)
- [ ] One ternary decides the face; no second `isSelf` flag anywhere
- [ ] Five rows + divider, second-person labels matching the board sidebar wording
- [ ] Other-profile page contains **zero** occurrences of any counter label
- [ ] Write bar absent on the self view
- [ ] Modal opens pre-filled, suggestion list closed, field still editable
- [ ] Secret Box button disabled; clicking does nothing
- [ ] No edit affordance on name/avatar/department on either face
- [ ] Both files < 200 lines; stats card carries no `"use client"`
- [ ] `pnpm validate` exits 0

## Success Criteria

| ID      | Criterion                     | Method                                                                                                                        |
| ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SC-B401 | `GUI_004`                     | five rows with the seeded values, asserted individually                                                                       |
| SC-B402 | `FUN_006` + `SEC_001` surface | on `?id={other}`: `expect(page.getByText(/Đã gửi\|Sent/)).toHaveCount(0)` **and** the same check against the raw HTML payload |
| SC-B403 | `FUN_007`                     | modal open, recipient input `toHaveValue(name)`, suggestion list not visible                                                  |
| SC-B404 | `FUN_008`                     | self view: write bar locator count 0                                                                                          |
| SC-B405 | `GUI_005`                     | button `toBeDisabled()`; click → no dialog role appears                                                                       |
| SC-B406 | `SEC_004`                     | no `input`, `button[aria-label*=edit]` or contenteditable in the hero on either face                                          |
| GREEN   | `redCommand`                  | exit 0                                                                                                                        |

## Risk Assessment

| Risk                                                                             | Likelihood | Impact               | Countermeasure                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------- | ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sent count reaches the client on another profile and is merely hidden by CSS     | Medium     | **High** (`SEC_001`) | The data returns `null`; SC-B402 asserts against the **raw HTML payload**, not the rendered DOM                                                                                                                                             |
| `KudosFormModal` edited here, colliding with Batch A F003                        | Medium     | High                 | File ownership: A-F003 owns it. Step 2 reports BLOCKED instead of editing                                                                                                                                                                   |
| Stats card duplicated from `sidebar-stats.tsx`, so a later label change diverges | **High**   | Medium               | Accepted, time-boxed: both read the same i18n keys, so wording cannot drift. **Named merge trigger:** once A-F002 has moved `sidebar-stats.tsx` off `OVERVIEW_STATS`, the row primitive is extracted to `components/common/` in a follow-up |
| Recipient pre-fill pops the suggestion list open over the untouched field        | Medium     | Low                  | `FUN_007` states it; SC-B403 asserts the list is not visible                                                                                                                                                                                |
| Q5 unanswered → real counters shipped where the test case expects zeros          | Medium     | Medium               | Phase is gated on [Q5](./clarifications.md); the fallback is recorded, not assumed silently                                                                                                                                                 |
| Someone "generalises" the second-person card for reuse                           | Low        | High                 | Reason recorded in the component doc comment and in `GUI_004`'s Note                                                                                                                                                                        |

## Security Considerations

- The self/other decision is enforced in the **query layer** (phase 02). This phase must never
  reconstruct it from a client-visible value; a client-side `isSelf` is not a boundary.
- `SEC_004`: this page introduces **no write surface** beyond the pre-existing heart action. After
  Batch A phase 0, only `display_name`, `avatar_url` and `language` are user-writable — if the
  design later asks for editing anything else here, raise it as a conflict; do not widen the GRANT.
- The write bar submits through Batch A's existing Server Action, which re-validates server-side.
  The `kudos_no_self` DB constraint stays the real guard against a self-Kudo; `FUN_008` only stops
  the surface from inviting the attempt.

## Next Steps

Unblocks **phase 05** (the KUDOS section sits directly below this slot). Report the GREEN rerun and
the raw-payload check for SC-B402.

## Rollback

`rm components/profile/profile-stats-card.tsx components/profile/profile-write-bar.tsx
e2e/profile-two-faces.spec.ts` and revert the ternary hunk in `app/profile/page.tsx` to the phase-03
placeholder. The page keeps rendering hero + badges; nothing else references either component.
