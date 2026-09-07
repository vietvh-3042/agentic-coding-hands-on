---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

**Priority**: P2
**Type**: mixed

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

## 1. Overview

**Problem:** Members collect unopened secret boxes as a reward, but nothing today lets them redeem
one for a badge — the existing modal only renders the "not yet opened" shell.
**Solution:** Clicking the box in the Secret Box modal draws one of six fixed collectible badges at
a weighted random, shows it immediately, and reduces the member's unopened count by one.
**Scope:** Opening exactly one box per click, the six-badge weighted draw, the counter refresh, and
the transition from the unopened shell to the reveal state.
**Non-Scope:** No admin screen for granting boxes, no history/gallery of previously unlocked
badges, no trading or purchasing of boxes — those stay out of this feature.

**Actors**

| Actor  | Description                                              | Primary goal                          |
| ------ | -------------------------------------------------------- | ------------------------------------- |
| Member | a signed-in Sunner with at least one unopened secret box | open a box and see the badge they won |

## 2. Functional Capabilities

| ID     | Capability        | What the user can do                                                                          | User Stories | Requirements                           | Business Rules                 | Screens        |
| ------ | ----------------- | --------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | ------------------------------ | -------------- |
| CAP-01 | Open a Secret Box | draw one random badge from an unopened box and watch the badge and counter update immediately | US001        | FR-001, FR-101, FR-201, FR-401, FR-601 | BR-001, BR-002, BR-003, BR-004 | SCR-secret-box |

## 3. Open Decisions

| D### | Decision                                                                                                                                               | Default proposal                                                   | Rationale                                                                                                                                | Blocks work |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D001 | When a draw lands on a badge the member already owns, should it show as a normal reveal with no new collection entry, or convert to some other reward? | Show the same badge again; no new unlock row, no bonus conversion. | Keeps the existing composite-PK schema (`user_id`, `icon_id`) unchanged and matches the simplest reading of "one random badge per open." | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** The member's opened and unopened secret-box counts are always read from the backend — never computed or cached client-side.

### Navigation (1xx)

- **FR-101** A member reaches the Secret Box modal by selecting "Mở quà" from their personal stats panel.

### Secret Box Modal (2xx)

- **FR-201** The modal shows the current unopened count, hides the "click to open" instruction and disables the box art when the count is zero, and otherwise lets the member click the box to reveal one badge.

### Interaction (4xx)

- **FR-401** Clicking the box triggers exactly one badge draw per available box — rapid repeat clicks or overlapping requests never consume more boxes than the member actually has.

### Security (6xx)

- **FR-601** Only a signed-in member with at least one unopened box may open one, and the badge, the draw, and both counters are decided entirely by the backend — nothing the client sends can change which badge is granted or how many boxes remain.

## 5. Business Rules

- The badge draw uses six fixed weighted outcomes — Stay Gold 30%, Flow to Horizon 25%, Touch of Light 20%, Beyond the Boundary 10%, Revival 10%, Root Further 5% — set once, not admin- or user-configurable (BR-001)
- Opening a box always changes both counters together with the draw — a box can never be consumed without a badge being granted, or vice versa (BR-002)
- Drawing a badge the member already owns still consumes the box and shows that badge again, without creating a second collection entry (BR-003)
- The box art and the opening instruction are hidden or disabled the instant the unopened count reaches zero, both in what the member sees and in what the backend will actually accept (BR-004)

## 6. Screens

| Screen Name      | SCR###                 | What User Sees                                                                                | What User Can Do                                                 |
| ---------------- | ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Secret Box Modal | SCR-secret-box (draft) | title, an instruction line (hidden at 0 unopened), the box art, and the unopened-count footer | click the box to reveal a badge (when eligible), close the modal |

### User Journey

1. Member clicks "Mở quà" in their stats panel and sees the Secret Box modal in its unopened state.
2. If they have unopened boxes, they click the box art — it shows a brief reveal and displays the new badge, and the unopened count drops by one.
3. If they have zero unopened boxes, the instruction line is hidden and the box art does not respond to clicks.
4. The member closes the modal via the X button; the sidebar counters reflect the same numbers the next time it opens.

## 7. User Stories

### US001 — Open a Secret Box

**Actor:** Member
**Goal:** open one of their unopened secret boxes to see which badge they won
**Business value:** rewards participation with a collectible, encouraging members to keep sending and receiving kudos to earn more boxes

**Acceptance Criteria:**

- [ ] Clicking the box when the unopened count is > 0 reveals exactly one of the six known badges
- [ ] The unopened count decreases by 1 and the opened count increases by 1 immediately after
- [ ] Clicking the box when the unopened count is 0 has no effect — the control is disabled and the instruction is hidden

## 8. Scenarios

### US001 — Happy Path

**Given** a member has 3 unopened secret boxes, **When** they click the box art, **Then** they see one newly revealed badge and the counters read 2 unopened, opened count +1.

### US001 — Error: no boxes left

**Given** a member has 0 unopened secret boxes, **When** they view the modal, **Then** the instruction line is hidden and the box art does not respond to clicks.

### US001 — Error: double-click race

**Given** a member has exactly 1 unopened secret box, **When** they click the box twice in quick succession, **Then** only one badge is revealed and the counter reads 0 unopened — the second click has no further effect.

## 9. Edge Cases

| Scenario                                                 | What Happens                                                                                                         | User-Facing Message                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Member has 0 unopened boxes                              | The instruction line is hidden and the box art stops responding to clicks                                            | "None — no message shown; the control simply becomes inert"                        |
| Member double-clicks the box while only 1 box remains    | Only the first click is honored; the second finds the count already at zero and is rejected                          | "None — the second click has no visible effect beyond the already-updated counter" |
| The draw lands on a badge the member already owns        | The box is still consumed and the same badge is shown again; no second collection entry is created                   | "None — the reveal looks identical to a first-time draw"                           |
| The open request fails partway (network or server error) | Nothing changes — no box is consumed and no badge is granted, because the whole operation is one all-or-nothing step | "Something went wrong — try again"                                                 |

## 10. Edge Behaviours to Verify

- **FR-201** → tester confirms the instruction line and the box-click affordance disable exactly when the unopened count is zero, and re-enable as soon as it is positive again.
- **FR-401** → tester confirms a rapid double-click (or two browser tabs) opening the same account's last box never grants two badges.
- **FR-601** → tester confirms that editing the displayed counter or badge via browser dev tools has no effect once the modal is refreshed or reopened.

## 11. Risks & Known Issues

| ID  | Type | Description | Impact | Status |
| --- | ---- | ----------- | ------ | ------ |

N/A — none found.

## 12. Dependencies

| Dependency                                      | Type           | Why this feature needs it                                                                                                                                            | Evidence                                      |
| ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| F002_KudosBoardData                             | feature        | reuses the same profile-stats read path and sidebar chrome this feature's counters render inside                                                                     | `profiles.boxes_opened`/`boxes_unopened`      |
| Phase-0 profiles privilege-escalation hardening | infrastructure | once shipped, `boxes_opened`/`boxes_unopened` become non-user-writable columns — this feature's server-side RPC must be the only remaining path that can change them | security report: profiles column-level GRANTs |

## 13. Configuration

N/A — no user-facing configuration constants for this feature.
