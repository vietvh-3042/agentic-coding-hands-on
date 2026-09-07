---
authored_by: rebuild-spec
---

<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F012_InAppNotifications

**Priority**: P3
**Type**: background
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F012 → N/A (owns no screen) → N/A (no User Story claims this feature) → N/A (no
background-logic entry) → N/A (no route) → N/A (no test cases yet)

## 1. Overview

**Problem:** N/A — inferred from code; domain confirmation needed. The database side (an
owner-scoped `notifications` table) was clearly built to support a notification bell, but nothing
in the repository states what user problem the bell was meant to solve, and no code ever puts it to
use.
**Solution:** Today, "the solution" is two disconnected halves. A real, permission-protected
notifications table exists in the database, seeded with sample rows for one demo user. Separately,
a bell icon in the site header opens a small panel — but that panel always shows the same fixed
"no notifications" message, no matter what is actually in the table. Clicking the bell never asks
the database anything.
**Scope:** As currently built, this feature's only real behavior is the bell icon's open/close
toggle and its always-empty panel — a shell with nothing behind it.
**Non-Scope:** Delivering, generating, or displaying real notifications; marking a notification as
read; any connection between the database table and what a user sees.

**Actors**

| Actor            | Description                                                                  | Primary goal                                                                  |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Signed-in member | Any authenticated user viewing the homepage, award info, or Sun* Kudos board | Would check for new notifications, if the bell did anything — today it cannot |

This feature is not part of any documented cross-feature flow.

## 2. Functional Capabilities

**Single-capability rationale:** not required — this feature declares exactly one capability and
its own US/BL count is zero, below the review-trigger band for either type.

| ID     | Capability                                | What the user can do                                                                            | User Stories                          | Requirements           | Business Rules | Screens                        |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- | -------------- | ------------------------------ |
| CAP-01 | Notification bell chrome (non-functional) | Open and close a notification panel that always shows the same fixed "no notifications" message | — (no User Story claims this feature) | FR-001, FR-401, FR-601 | BR-001         | N/A — owns no screen (see § 6) |

## 3. Open Decisions

| D### | Decision                                                                                                                                                                                           | Default proposal                                                                                             | Rationale                                                                                                                 | Blocks work |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D001 | Should the notification bell be finished (real query layer, mark-read action, and a source of truth for what generates a notification) before this reaches more users, or intentionally left dark? | Ship as-is (dark/inert) for this phase; revisit once a concrete trigger (e.g., kudo received) is prioritized | P3 priority and zero User Story demand signal this was never scoped for the current phase, not merely dropped by accident | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** A notifications table exists in the database, scoped one row per user, with sample
  data seeded for a demo account — but nothing in the app currently reads or writes it.

### Interaction (4xx)

- **FR-401** Clicking the bell icon opens or closes a small panel; the panel content never changes
  no matter what notifications exist for the signed-in user.

### Security (6xx)

- **FR-601** Only the owning signed-in user could ever read or mark-read their own notification
  rows — enforced entirely by the database, independent of any application code.

## 5. Business Rules

- Even if a query layer existed today, no signed-in user could ever create or delete their own
  notification row directly — new rows can only come from a seeded script or an internal
  service process, never from anything a user does in the app. (BR-001)

## 6. Screens

N/A — this feature owns no screen of its own. The bell icon (`NotificationMenu`) renders as shared
header chrome on SCR004_AboutHomepage, SCR005_AwardInfoScreen, and SCR006_SunKudosBoard — screens
owned by other features (Homepage Overview, Award Information Browsing, Sun* Kudos Board) — but
F012 does not control what any of those screens show beyond the bell itself.

## 7. User Stories

None. `feature-list.md`'s F012 entry and `user-stories.md`'s Inert Elements table both confirm this
feature claims zero User Stories — the bell's toggle is classified as an inert, unwired element, not
an interaction a story was written for.

## 8. Scenarios

None — no User Story exists for this feature to write a Given/When/Then scenario against (see § 7).

## 9. Edge Cases

| Scenario                                                                                          | What Happens                                                                                          | User-Facing Message                                                       |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Signed-in user whose account actually has unread notification rows in the database opens the bell | The panel still shows the fixed empty message; the real rows are never fetched or displayed           | "You have no notifications" (fixed string, shown regardless of real data) |
| User clicks the bell repeatedly, or clicks outside the open panel                                 | Panel opens and closes locally; clicking outside closes it                                            | None — silent, instant toggle                                             |
| A new notification-worthy event happens elsewhere in the app (e.g. receiving a kudo)              | Nothing appears in the bell — no code path creates a notification row or refreshes the panel for this | None shown — the event has no visible effect here                         |

## 10. Edge Behaviours to Verify

- **FR-401** → Confirm the panel's content is identical before and after seeding notification rows
  for the signed-in user — it should never change.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                               | Impact                                                                                                                                                         | Status    |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | The header bell's red badge dot is hardcoded into the button markup — it renders on every page load with no check against any unread count or real data.                                                  | A user sees the same "you have something new" signal whether they truly have unread notifications or none at all; the badge conveys no real information today. | confirmed |
| RISK-02 | known-issue | The database already holds seeded sample notification rows (2 unread, 2 read) for one demo user, and the schema is fully permission-protected, but no code anywhere queries, inserts, or marks them read. | The feature reads as scaffolded rather than finished — a reviewer or stakeholder could mistake the live table for a working feature; it is not.                | confirmed |

## 12. Dependencies

| Dependency                                                                                                        | Type    | Why this feature needs it                                                                                       | Evidence                                   |
| ----------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Homepage / Award Information / Sun* Kudos Board (whichever feature owns the shared site header on a given screen) | feature | F012 has no header of its own — its only UI element is mounted inside another feature's shared header component | `components/homepage/site-header.tsx:8,40` |

## 13. Configuration

N/A — no user-facing configuration constants for this feature.
