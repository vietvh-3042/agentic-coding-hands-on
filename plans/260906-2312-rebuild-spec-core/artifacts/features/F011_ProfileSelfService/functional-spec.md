---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F011_ProfileSelfService

**Priority**: P3
**Type**: background
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F011_ProfileSelfService

## 1. Overview

**Problem:** The database already lets a signed-in user own and change three fields on their own
account (display name, avatar, language preference), but nothing in the application surfaces that
permission — there is no screen, form, or button anywhere that lets a user actually use it.
**Solution:** N/A — no solution is implemented. What exists is the permission itself: a live
database rule scoping exactly which three columns a user may change on their own row, and no
code path anywhere that exercises it.
**Scope:** Documenting the live, unconsumed database permission so it is not silently dropped from
the record, and naming precisely which three columns it covers and why the scope is narrow.
**Non-Scope:** Building the profile-edit screen, form, or save action is explicitly out of scope
here — none of that exists today, and this document does not propose or design it.

**Actors**

| Actor              | Description                                                                         | Primary goal                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated user | Any signed-in Supabase Auth user — the role the live column permission is scoped to | None today — no code path lets this actor use the permission; the row exists to name who the live database permission applies to |

## 2. Functional Capabilities

| ID     | Capability                                      | What the user can do                                                                           | User Stories | Requirements | Business Rules | Screens |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------ | ------------ | -------------- | ------- |
| CAP-01 | Owner-Scoped Profile Column Update (Unconsumed) | Nothing today — the capability is a live database permission with no code path that invokes it | —            | FR-001       | BR-001         | N/A     |

## 3. Open Decisions

None — no unresolved domain confirmations. Everything about this feature's current state is
directly confirmed from the migration, the permissions matrix, and the searches recorded in
`technical-spec.md` § 3.1 — nothing here depends on a business or stakeholder answer.

## 4. Requirements

### Foundation (0xx)

- **FR-001** The database permits a signed-in user to change exactly three fields on their own
  profile — display name, avatar, and language — and nothing else; no application code exercises
  this permission today.

## 5. Business Rules

- An authenticated user may change only display name, avatar, and language on their own profile;
  every other field — including account role — has no way to be changed by that user at all, a
  scope that closed a prior gap where any user could have changed their own role to admin. (BR-001)

## 6. Screens

N/A — background feature; no user-facing screens.

## 7. User Stories

N/A — no user story exists for this feature (feature-list.md F011 § Related User Stories: `—`).
No code path invokes the capability described in § 1, so there is no story to elaborate.

## 8. Scenarios

N/A — no user story exists in § 7 to scenario-ize.

## 9. Edge Cases

| Scenario                                                                                                                                                                       | What Happens                                                                                                  | User-Facing Message                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| A client tries to change a user's account role (or any field besides display name/avatar/language) directly through the database, bypassing any screen — none exists to bypass | The database rejects the change outright; the field is simply not covered by what a user is allowed to change | "None — no UI surfaces this; a direct database call is rejected before it takes effect." |

## 10. Edge Behaviours to Verify

- **FR-001** → Confirm that changing a user's account role (or any field outside display
  name/avatar/language) as that same signed-in user is rejected by the database, independent of
  any application code.

## 11. Risks & Known Issues

| ID      | Type | Description                                                                                                                                                                                                                                                                                             | Impact                                                                                                                                                                     | Status    |
| ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | risk | If a future change ever widens this permission (e.g. a new user-editable field is added) without narrowing it column-by-column again, the same class of gap this feature's permission was built to close could reopen — row-level security alone does not restrict which field changes, only which row. | A future user could change a field they should not be able to (e.g. self-promoting to admin), the same class of exposure this permission's narrow scope exists to prevent. | confirmed |

## 12. Dependencies

| Dependency        | Type    | Why this feature needs it                                                                                                                 | Evidence |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F001_GoogleSignIn | feature | Creates the profile row (on first sign-in) that this permission's scope applies to — the permission is meaningless before that row exists | BL001    |

## 13. Configuration

`N/A — no user-facing configuration constants for this feature.`
