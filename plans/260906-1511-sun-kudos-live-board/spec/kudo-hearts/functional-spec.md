---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

**Priority**: P1
**Type**: mixed
**Generated**: 2026-09-06

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations,
pseudocode, key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F004_KudoHearts → SCR-sun-kudos-board → US001, US002

## 1. Overview

**Problem:** Members want a lightweight way to acknowledge a kudo they see on the board, and the
platform needs a way to reward active kudo-senders for the appreciation they receive — today the
heart is a purely client-side `useState` toggle with no persistence, no reward, and no per-user
gating.
**Solution:** A member can heart, or un-heart, any kudo except one they sent themselves. Each heart
credits the kudo's sender with hearts (visible in their "hearts received" figure), doubled on an
admin-configured special day; un-hearting revokes exactly the amount that heart originally
granted, even after the special day has passed.
**Scope:** The heart/un-heart control on the board's kudo cards (feed and highlight); one heart
per member per kudo; the sender-credit rule and its special-day multiplier; and an accurate
reversal on un-heart.
**Non-Scope:** Hearting from any screen other than the live board; an admin screen for configuring
special days (`event_settings`'s special-day columns are written by an out-of-scope admin
process); notifications when a member receives a heart; any leaderboard or history of who gave
which hearts.

**Actors**

| Actor       | Description                                                                                        | Primary goal                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Sunner      | Any signed-in Sun* member viewing the live board                                                   | Show appreciation for a kudo by hearting it, or undo a heart given by mistake |
| Kudo sender | The member who originally sent the kudo being hearted (the same actor type, in the receiving role) | Passively receives heart credit; cannot heart their own kudo                  |

## 2. Functional Capabilities

| ID     | Capability              | What the user can do                                                                                                                               | User Stories | Requirements                                                   | Business Rules                          | Screens             |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- | --------------------------------------- | ------------------- |
| CAP-01 | Heart & Un-heart a Kudo | Toggle a heart on any kudo not sent by the viewer; the sender is credited or debited the correct heart amount, honoring the special-day multiplier | US001, US002 | FR-001, FR-201, FR-202, FR-203, FR-204, FR-401, FR-402, FR-601 | BR-001, BR-002, BR-003, BR-004, DEC-001 | SCR-sun-kudos-board |

## 3. Open Decisions

| D### | Decision                                                                                                                       | Default proposal                                                                     | Rationale                                                                                                                                                                  | Blocks work |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D001 | When a kudo is sent anonymously, is the real sender still the one credited with the heart, or is crediting skipped/redirected? | Credit the real `sender_id` — anonymity affects display only, not backend crediting. | `kudos.sender_id` is always the real user (anonymity only replaces the displayed name), and that same identity already drives ownership/self-heart checks everywhere else. | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** The system maintains exactly one heart record per (kudo, member) pair, recording how
  many hearts that pairing granted, and keeps the kudo's displayed heart count automatically in
  sync with those records.

### Sun* Kudos Live Board (2xx)

- **FR-201** A member can heart a kudo they did not send.
- **FR-202** A member can un-heart a kudo they previously hearted.
- **FR-203** The heart control is disabled on kudos the current member sent themselves.
- **FR-204** The heart control reflects whether the current member has already hearted this kudo,
  and toggles between states without a page reload.

### Interaction (4xx)

- **FR-401** Hearting credits the kudo's sender with additional hearts equal to the multiplier
  active at the moment of hearting — 1 normally, 2 on a special day; un-hearting later revokes
  exactly that same amount, never a flat -1.
- **FR-402** Rapidly toggling the same kudo's heart never produces more than one active heart for
  that member, and never desyncs the displayed count from the stored state.

### Security (6xx)

- **FR-601** Only an authenticated member may heart or un-heart a kudo; the action is rejected for
  an anonymous visitor and for the kudo's own sender.

## 5. Business Rules

- A member holds at most one heart per kudo; repeated toggling never creates a duplicate or a
  negative count. (BR-001)
- A kudo's own sender cannot heart it; the control is disabled for them and the underlying request
  is rejected regardless. (BR-002)
- Hearting credits the kudo's sender with 1 heart, or 2 hearts on an admin-configured special day;
  the amount granted is stored on the heart record itself. (BR-003)
- Un-hearting revokes exactly the amount that specific heart originally granted (1 or 2), never a
  flat -1, even if the special day has since ended. (BR-004)
- The heart control's enabled/filled appearance depends on whether the viewer is signed in,
  whether they are the kudo's sender, and whether they have already hearted it. (DEC-001)

## 6. Screens

| Screen Name           | SCR###                                                                 | What User Sees                                                                                                                                                                      | What User Can Do                        |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Sun* Kudos Live board | SCR-sun-kudos-board (owned by F002 — no new screen spec authored here) | The heart icon + count on every kudo card in the Highlight carousel and the All-Kudos feed; filled/red when the viewer has hearted it, disabled on kudos the viewer sent themselves | Click to heart; click again to un-heart |

### User Journey

1. Member browses the board (Highlight or All Kudos) and sees a kudo they did not send.
2. Member clicks the heart icon; the icon fills red and the count increments by one — invisibly to
   the member, the kudo's sender is credited a heart.
3. Member clicks the same heart again; it un-fills, the count decrements by exactly the amount
   that click originally granted, and the sender's credit is reversed by the same amount.

## 7. User Stories

### US001 — Heart a Kudo

**Actor:** Sunner
**Goal:** Signal appreciation for a kudo someone else sent, without leaving the board.
**Business value:** Gives the kudo's sender a visible, gamified reward for participating,
encouraging more kudos.

**Acceptance Criteria:**

- [ ] Clicking the heart on a kudo the member did not send increments the visible count and marks
      the heart as active.
- [ ] The kudo's sender's hearts-received total increases by 1, or by 2 if the click happens on a
      special day.
- [ ] The heart control is disabled and shows no active state on a kudo the member sent
      themselves.

### US002 — Un-heart a Kudo

**Actor:** Sunner
**Goal:** Undo a heart previously given, for example one given by mistake.
**Business value:** Keeps the heart count trustworthy and gives the member control over their own
signal.

**Acceptance Criteria:**

- [ ] Clicking an already-active heart un-fills it and decrements the visible count by exactly the
      amount that heart originally granted.
- [ ] The kudo's sender's hearts-received total decreases by that same amount, even if a special
      day has since ended.

## 8. Scenarios

### US001 — Happy Path

**Given** a member viewing a kudo they did not send with no existing heart, **When** they click
the heart icon, **Then** the icon fills red, the count increments by 1, and the sender's hearts
total increases by 1 (or 2 on a special day).

### US001 — Error: Own kudo

**Given** a member viewing a kudo they sent themselves, **When** they attempt to click the heart
control, **Then** nothing happens — the control is rendered disabled and non-interactive.

### US002 — Happy Path

**Given** a member viewing a kudo they previously hearted, **When** they click the filled heart,
**Then** it un-fills, the count decrements by the originally-granted amount, and the sender's
total is reduced by the same amount.

### US002 — Error: Server rejection

**Given** a member clicks un-heart, **When** the server call fails, **Then** the UI rolls back to
the hearted state and shows a brief retry message.

## 9. Edge Cases

| Scenario                                                                              | What Happens                                                                                                                                                                                              | User-Facing Message                                      |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Double-click / rapid repeated toggling of the same kudo's heart                       | Each click alternates heart/un-heart; the underlying one-record-per-member-per-kudo rule makes duplicate crediting impossible, so the displayed state always settles to whatever the last click requested | "None — the heart icon simply reflects the latest click" |
| Member hearts their own kudo (via a stale or tampered UI)                             | The system rejects the request outright; the control is already rendered disabled so this should not be reachable through the normal UI                                                                   | "You can't heart your own kudo"                          |
| Un-hearting a kudo that was hearted on a special day, after the special day has ended | The system revokes exactly the amount recorded when the heart was given (e.g. 2), not today's rate — the sender's total drops by 2                                                                        | "None — silent handling"                                 |
| Hearting a kudo that was deleted between page load and the click                      | The request fails because the kudo no longer exists; the optimistic heart is rolled back                                                                                                                  | "Something went wrong — please try again"                |
| The heart/un-heart request fails for any other reason (network, session expired)      | The optimistically-updated icon and count revert to their pre-click state                                                                                                                                 | "Something went wrong — please try again"                |

## 10. Edge Behaviours to Verify

- **FR-201** → Confirm hearting a kudo not sent by the current member increments the count and
  fills the icon.
- **FR-202** → Confirm un-hearting reverses both the icon state and the count.
- **FR-203** → Confirm the heart control renders disabled on the member's own sent kudos.
- **FR-401** → Confirm the sender's hearts-received total changes by the multiplier-correct
  amount, including after a special day has ended.
- **FR-601** → Confirm an unauthenticated visitor cannot trigger the heart mutation.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                       | Impact                                                                                                                                  | Status    |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | The heart control's like state is entirely client-local (`useState`), reset on reload, not scoped per member, and never touches a database table. | Every kudo's heart count and heart toggle currently means nothing outside the current browser tab; no sender is ever actually credited. | confirmed |

## 12. Dependencies

| Dependency                                             | Type           | Why this feature needs it                                                                                                                                                      | Evidence               |
| ------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| F002_KudosBoardData                                    | feature        | The heart control renders on cards owned by F002's screen; F004 cannot ship without those card components existing                                                             | SCR-sun-kudos-board    |
| `event_settings` special-day configuration             | data           | The +2 multiplier requires an admin-writable special-day setting; no admin UI exists in this batch, so the columns must be seeded manually until an admin surface ships        | BR-003                 |
| Existing `kudo_hearts`/`kudos` schema and sync trigger | infrastructure | Already migrated — the composite primary key, `hearts_value` constraint, and count-sync trigger are the enforcement mechanism this feature relies on rather than re-implements | BR-001, BR-003, BR-004 |

## 13. Configuration

```text
special_day_start / special_day_end   # admin-configured date range (planned, on event_settings)
                                       # during which a heart credits the sender 2 instead of 1
```
