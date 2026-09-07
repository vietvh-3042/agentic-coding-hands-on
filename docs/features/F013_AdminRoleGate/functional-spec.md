---
authored_by: rebuild-spec
---

<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F013_AdminRoleGate

**Priority**: P3
**Type**: background
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F013 → N/A (owns no screen) → N/A (no User Story claims this feature) → N/A (no
background-logic entry) → N/A (no route) → N/A (no test cases yet)

## 1. Overview

**Problem:** N/A — inferred from code; domain confirmation needed. A privilege classification
(regular member vs. admin) was clearly intended — the database column exists, and an "Admin
Dashboard" menu entry was added for it — but nothing in the repository states what admin capability
was meant to gate, and none was ever built.
**Solution:** Today there is no solution — only a declared placeholder. Every member profile carries
a `role` value of either `user` or `admin`, but no screen, rule, or query anywhere in the app reads
it. The one visible trace is a menu item labeled "Admin Dashboard" that every signed-in member sees,
regardless of their own role — clicking it does nothing.
**Scope:** This spec documents three things as they stand today: the declared-but-unused `role`
column, the inert menu item that alludes to it, and a database-level privilege boundary that already
prevents a member from setting their own `role` to `admin`.
**Non-Scope:** Any admin dashboard, admin-only screen, or admin capability — none exists. This spec
does not describe a working gate.

**Actors**

| Actor            | Description                                                     | Primary goal                                                 |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| Signed-in member | Any authenticated user, regardless of their stored `role` value | Sees an "Admin Dashboard" menu entry that does nothing today |

This feature is not part of any documented cross-feature flow.

## 2. Functional Capabilities

**Single-capability rationale:** not required — this feature declares exactly one capability and
its own US/BL count is zero, below the review-trigger band for either type.

| ID     | Capability                                    | What the user can do                                                                                                        | User Stories                          | Requirements           | Business Rules | Screens                        |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------- | -------------- | ------------------------------ |
| CAP-01 | Admin role placeholder (declared, unenforced) | Nothing — the `role` column and the menu entry that alludes to it exist, but no admin capability is reachable by any member | — (no User Story claims this feature) | FR-001, FR-601, FR-602 | BR-001, BR-002 | N/A — owns no screen (see § 6) |

## 3. Open Decisions

None — no unresolved domain confirmations found while researching this feature's current
(unimplemented) state. A separate plan (`plans/260906-1903-profile-and-menus` phase 06) already
describes a planned design for the real gate; re-litigating that plan's own open questions is out
of scope for this spec, which documents current behavior only.

## 4. Requirements

### Foundation (0xx)

- **FR-001** Every member profile carries a privilege classification, `user` or `admin`, but it is
  not currently read anywhere in the app.

### Security (6xx)

- **FR-601** `[EXPECTED]` Any future capability that depends on a member's role (for example, an
  admin dashboard) must confirm that role on the server on every request — a check that only lives
  in the browser is never sufficient by itself.
- **FR-602** A member may update their own display name, avatar, and language, but never their own
  role, when editing their profile.

## 5. Business Rules

- The `role` field carries two allowed values, `user` and `admin`, but is not read by any code path
  today — it currently has no effect anywhere in the app. (BR-001)
- A member can update their own display name, avatar, and language, but the database itself refuses
  any attempt to change their own role — this is enforced independently of, and before, any
  application-level check. (BR-002)

## 6. Screens

N/A — this feature owns no screen of its own. The "Admin Dashboard" item it documents is a single
inert entry inside `UserMenu`, shared header chrome mounted on SCR004_AboutHomepage,
SCR005_AwardInfoScreen, and SCR006_SunKudosBoard — screens owned by other features. F013 does not
control what any of those screens show beyond this one menu entry, and no admin screen exists
anywhere in the app for it to point to.

## 7. User Stories

None. `feature-list.md`'s F013 entry and `user-stories.md`'s Inert Elements table both confirm this
feature claims zero User Stories — the menu item is classified as an inert, unwired element, not an
interaction a story was written for.

## 8. Scenarios

None — no User Story exists for this feature to write a Given/When/Then scenario against (see § 7).

## 9. Edge Cases

| Scenario                                                                                                             | What Happens                                                                                                                                                  | User-Facing Message                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A regular member opens the account menu and clicks "Admin Dashboard"                                                 | Nothing happens — no page change, no error, no request                                                                                                        | "None — no message is shown; nothing happens."                                                             |
| A member whose stored role is actually `admin` opens the same menu                                                   | Sees the identical menu — role makes no observable difference anywhere in the app                                                                             | "None — same experience as a regular member."                                                              |
| A member (of either role) attempts to change their own role directly, bypassing the UI (e.g. a hand-crafted request) | The database refuses the write before it ever reaches row-level checks — the role field is outside what a member is allowed to change about their own profile | "Not exposed to the user today — no screen in the app attempts this; verified only at the database level." |

## 10. Edge Behaviours to Verify

- **FR-601** → Confirm that if an admin capability is added later, it is refused for a non-admin
  caller even when the browser-side check is bypassed or tampered with.
- **FR-602** → Confirm a member cannot change their own role by any means other than a direct
  administrative action outside the app — this must hold independent of any screen or button.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                              | Impact                                                                                                                                                                                     | Status    |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| RISK-01 | known-issue | The account menu's "Admin Dashboard" item renders for every signed-in member regardless of role, with no click handler wired — clicking it does nothing, while the immediately adjacent "Sign out" item in the same menu is fully wired. | Misleading UI only, today: a member sees a menu entry implying admin access that does not exist and cannot be reached; no functional or security effect since the item performs no action. | confirmed |
| RISK-02 | risk        | If a future change wires this menu item, or any other admin capability, to real functionality using only a check in the browser, any signed-in member could reach that capability by bypassing the browser-side check.                   | Would become a privilege-escalation path the day such a change ships without an accompanying server-side check — the browser is never a trustworthy enforcement point on its own.          | confirmed |

## 12. Dependencies

| Dependency                         | Type    | Why this feature needs it                                                                                                                                   | Evidence                                   |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| F001_GoogleSignIn                  | feature | F013 has no header of its own — its one UI element (the "Admin Dashboard" item) is mounted inside `UserMenu`, the same shared chrome F001 uses for Sign Out | `components/homepage/user-menu.tsx:90-111` |
| Member profile role classification | data    | This feature is entirely about the `role` field's declared-but-unused state and the database privilege boundary around it                                   | MODEL001_PROFILES                          |

## 13. Configuration

N/A — no user-facing configuration constants for this feature.
