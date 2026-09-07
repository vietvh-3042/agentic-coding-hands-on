---
authored_by: rebuild-spec
---

# Functional Spec — F006_SecretBoxReveal

**Priority**: P2
**Type**: mixed
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations,
pseudocode, key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F006 → SCR006/REG004 → US021, US022 → — → ROUTE005, ROUTE006 → —

## 1. Overview

**Problem:** Members are granted "secret boxes" they can redeem for a random collectible badge,
but before this feature there was no way to actually make that draw — the unopened count existed
only as a static display number with no click-through action behind it.
**Solution:** Adds a two-state dialog, opened from the sidebar, that lets a signed-in member spend
one unopened box for a weighted-random badge. The draw runs entirely server-side, so the result
cannot be tampered with by editing the displayed count or replaying the click.
**Scope:** A member with at least one unopened box can open the dialog, always see the
database's own unopened/opened counts (never a stale or client-editable number), and draw exactly
one badge per click — safely even under a double-click or two overlapping requests.
**Non-Scope:** Granting a member new unopened boxes — no in-app mechanism exists for this yet (see
§ 11 Risks & Known Issues); managing or editing the badge catalog; displaying which badges a
member owns anywhere outside this dialog (e.g. a profile/collection screen). This feature's scope
is the draw-and-reveal dialog only.

**Actors**

| Actor            | Description                         | Primary goal                                                        |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Signed-in Sunner | An authenticated Kudos Board member | Check how many boxes remain, then draw a collectible badge from one |

## 2. Functional Capabilities

| ID     | Capability      | What the user can do                                                                         | User Stories | Requirements                                                   | Business Rules                          | Screens       |
| ------ | --------------- | -------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- | --------------------------------------- | ------------- |
| CAP-01 | Secret Box Draw | Open the secret-box dialog, see the authoritative box counts, and draw one collectible badge | US021, US022 | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-401, FR-601 | BR-001, BR-002, BR-003, BR-004, DEC-001 | SCR006/REG004 |

## 3. Open Decisions

None — no unresolved domain confirmations. The two genuine unresolved items surfaced during
research (missing `public/profile/` badge artwork, and no in-app path that ever increments
`profiles.boxes_unopened`) are technical/known-issue findings, not domain decisions awaiting a
human's choice — they are filed under § 11 Risks & Known Issues here (RISK-01, RISK-02) and
§ 5.3 Unresolved Questions in `technical-spec.md`, not duplicated here.

## 4. Requirements

### Foundation (0xx)

- **FR-001** The system maintains a fixed catalog of six collectible badges, each with a draw
  weight, that the draw rolls against.

### Navigation (1xx)

- **FR-101** A signed-in member reaches the secret-box dialog by clicking "Open Secret Box" in the
  Kudos Board sidebar.

### Secret Box Dialog (2xx)

- **FR-201** The dialog shows an "unopened" box view while boxes remain, and switches to a
  "revealed" badge view immediately after a successful draw.
- **FR-202** The dialog re-reads the member's authoritative unopened/opened counts every time it
  opens, overriding whatever count was already on screen.
- **FR-203** The box image cannot be clicked, and no instruction text shows, once the member has
  zero unopened boxes remaining.
- **FR-204** When a drawn badge's artwork cannot be loaded, the dialog shows the badge's name as
  text instead of a broken image.

### Interaction (4xx)

- **FR-401** A successful draw updates the revealed badge, the footer count, and the sidebar's own
  stat display together, from one server response — never computed or guessed client-side.

### Security (6xx)

- **FR-601** Only an authenticated member may draw a badge, and a draw always acts on that
  member's own account — no request can target anyone else's boxes.

## 5. Business Rules

- Each draw's odds are proportional to the badge's configured weight, out of the full catalog's
  total (BR-001)
- A draw is locked and processed one at a time per member, so a double-click or two overlapping
  requests can never draw more badges than boxes actually available (BR-002)
- Drawing a badge the member already owns still spends the box, but does not create a duplicate
  entry — the same badge is shown again (BR-003)
- Drawing is refused, both on screen and by the server, once a member has zero unopened boxes left
  (BR-004)
- Whether the drawn badge shows as an image or as text depends on whether its artwork can actually
  be loaded (DEC-001)

## 6. Screens

| Screen Name                        | SCR###                      | What User Sees                                                                                                                                                                                        | What User Can Do                                                                                                        |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sun\* Kudos — Live Board (Sidebar) | SCR006_SunKudosBoard/REG004 | The sidebar stats panel (kudos/hearts stats, secret-box opened/unopened counts, "Open Secret Box" button); the dialog it opens shows either the closed box image or, after a draw, the revealed badge | Open the secret-box dialog, view current unopened/opened counts, draw one badge, view the drawn badge, close the dialog |

### User Journey

1. User arrives at the Kudos Board and sees their secret-box opened/unopened counts alongside
   their other stats in the sidebar.
2. User clicks "Open Secret Box" — the dialog opens showing the closed box image and the
   authoritative unopened count.
3. If boxes remain, the user clicks the box image; the system draws one badge and switches to the
   revealed view showing the badge and the updated counts.
4. If no boxes remain, the box image is disabled and no instruction text shows — drawing stays
   unavailable until the member is granted more boxes.
5. User closes the dialog (its close button, Escape, or clicking outside); the sidebar reflects the
   updated counts.

## 7. User Stories

### US021_OpenSecretBoxDialog — Open the Secret Box Dialog

**Actor:** Signed-in Sunner
**Goal:** Open the secret-box dialog to see how many boxes are left before drawing one.
**Business value:** Gives the member visibility into their reward inventory before committing to a
draw.

**Acceptance Criteria:**

- [ ] Clicking "Open Secret Box" in the sidebar opens the dialog.
- [ ] The dialog re-reads the authoritative unopened count on open, replacing any stale value.
- [ ] The dialog shows the "unopened" box view when the count is greater than zero.

### US022_DrawFromSecretBox — Draw From the Secret Box

**Actor:** Signed-in Sunner
**Goal:** Draw a badge from the secret box.
**Business value:** Receives a random collectible reward as recognition for their engagement.

**Acceptance Criteria:**

- [ ] Clicking the box image draws one badge and switches to the revealed view.
- [ ] A successful draw decrements the unopened count and increments the opened count.
- [ ] Drawing with zero boxes left shows an error message instead of crashing.
- [ ] The draw cannot over-award badges under rapid clicking or two overlapping attempts — at most
      one badge is drawn per available box.

## 8. Scenarios

### US021_OpenSecretBoxDialog — Happy Path

**Given** the member has 2 unopened boxes, **When** they click "Open Secret Box", **Then** the
dialog opens showing the "unopened" view with count 02.

### US021_OpenSecretBoxDialog — Error: Authoritative Reread Fails

**Given** the authoritative count reread fails (e.g. an expired session), **When** the dialog
mounts, **Then** it keeps showing the stale count it was already displaying, without crashing.

### US022_DrawFromSecretBox — Happy Path

**Given** the member has 1 unopened box, **When** they click the box image, **Then** a badge is
drawn and shown, and the unopened count drops to 0.

### US022_DrawFromSecretBox — Error: No Boxes Left

**Given** the member has 0 unopened boxes, **When** they click the (disabled) box image, or a race
leaves 0 boxes server-side, **Then** the "no boxes left" error message renders and no badge is
drawn.

## 9. Edge Cases

| Scenario                                                         | What Happens                                                                             | User-Facing Message                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Draw attempted with 0 unopened boxes                             | The draw is refused; no badge is drawn and no counters change                            | "You have no Secret Boxes left to open."                    |
| Two overlapping draw requests against the same last box          | Only one request draws a badge; the other observes 0 boxes remaining and is refused      | "You have no Secret Boxes left to open." (for the loser)    |
| Draw resolves to a badge the member already owns                 | The box is still spent and the same badge is shown again; no duplicate entry is recorded | None — the member sees the badge exactly as on a fresh draw |
| Drawn badge's artwork cannot be loaded                           | The dialog shows the badge's name as text instead of a broken image                      | None — the name-text badge itself is the message            |
| Dialog's authoritative count reread fails (e.g. expired session) | The dialog keeps showing whatever count it already had, instead of erroring out          | None — no error shown for this specific case                |

## 10. Edge Behaviours to Verify

- **FR-202** → Confirm the dialog always shows the database's own unopened/opened counts on open,
  never a stale or client-supplied value.
- **FR-401** → Confirm a successful draw updates the badge shown, the footer count, and the
  sidebar's stat display consistently, from the same server response.
- **FR-601** → Confirm a request with no valid session cannot draw a badge under any
  circumstance.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                       | Impact                                                                                                                | Status    |
| ------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | Drawn badge artwork does not exist: `secret_box_icons.image_url` points at `/profile/icons/icon-N.png`, and no `public/profile/` directory exists in this project | Every drawn badge renders as a name-text fallback instead of the intended artwork                                     | confirmed |
| RISK-02 | known-issue | No in-app mechanism grants a member additional unopened boxes — the counter is only ever seeded once and then decremented by a draw                               | Once a member's unopened count reaches zero, there is no way for them to receive more boxes through the product today | confirmed |

## 12. Dependencies

| Dependency          | Type    | Why this feature needs it                                                                                                          | Evidence      |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| F002_KudosBoardData | feature | Supplies the page-level sidebar overview read that seeds the dialog's initial unopened-count prop, before the authoritative reread | SCR006/REG004 |
| F001_GoogleSignIn   | feature | The draw requires an authenticated session; this feature establishes and refreshes it                                              | FR-601        |

## 13. Configuration

```text
Stay Gold = 30              # draw weight (relative probability, out of 100 total)
Flow to Horizon = 25        # draw weight
Touch of Light = 20         # draw weight
Beyond the Boundary = 10    # draw weight
Revival = 10                 # draw weight
Root Further = 5             # draw weight
```
