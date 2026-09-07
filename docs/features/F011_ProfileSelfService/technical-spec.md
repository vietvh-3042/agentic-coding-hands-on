---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# F011_ProfileSelfService — Technical Spec

**Priority**: P3
**Type**: background
**Generated**: 2026-09-07

**See also:** [`functional-spec.md`](./functional-spec.md) — plain-language overview, open
decisions, requirements/business rules stated in one-liners, screens, user stories, scenarios,
edge cases, and configuration for a BA/QA audience.

**How to read this file:** this feature has zero actions. § 2 carries only the mandatory `A0`
cross-cutting row; § 3 states plainly what was searched for and not found, then documents the one
real thing that exists — a database-level GRANT with no application code path to it.

## 1. Technical Overview

`PERM004_ProfilesOwnerColumnUpdate` column-scopes the `profiles` table's owner `UPDATE` grant to
`display_name`, `avatar_url`, `language` — live Postgres RLS + GRANT, no application layer
involved. No profile-edit screen, form, Server Action, or route exists in `app/`, `components/`,
or `lib/` (see § 3.1 for the exact searches run); every `.from("profiles")` call found in the
codebase is a `SELECT`, and the one column this GRANT covers that has an adjacent write
candidate — `language` — is written to a cookie only by F009's `LanguageSelector`, never to this
column. This feature exists to keep `PERM004` and these three GRANT-scoped columns from being
silently dropped from the artifact set, not to describe a working feature.

## 2. Action Index

| #      | Action (handler)                              | Method · Path | Codes          | Writes | Detail |
| ------ | --------------------------------------------- | ------------- | -------------- | ------ | ------ |
| **A0** | _cross-cutting — belongs to no single action_ | —             | FR-001, BR-001 | —      | § 4.4  |

No `A1`+ row exists — zero actions were found (see § 3.1 for the searches run and their results).

**Rung set** — n/a; no action block exists in § 3 to carry rungs.

## 3. Actions

### 3.1 CAP-01 — Owner-Scoped Profile Column Update (Unconsumed)

**No action exists in this bucket.** Searches run this pass, and their results:

- `grep -rn '.from("profiles")' app/ components/ lib/` → 4 matches, **all `.select(...)` reads**,
  zero `.update(`/`.upsert(`/`.insert(` calls against `profiles` anywhere in the tree:
  - `components/kudos/kudos-recipient-select.tsx:74` — `.select("id, display_name")` (recipient
    search autocomplete)
  - `app/sun-kudos/actions/open-secret-box.ts:104` — `.select("boxes_unopened, boxes_opened")`
  - `app/sun-kudos/actions/submit-kudo.ts:70` — `.select("id")` (recipient-exists check)
  - `lib/kudos/board-aggregates.ts:80` — `.select("boxes_opened, boxes_unopened")`
- `grep -rn "profiles" app/ components/ lib/ | grep -iE "update|upsert|insert"` → **zero matches**.
- `find app -iname "*profile*"` and `find components -iname "*profile*"` → **zero matches** — no
  profile-edit screen, page, or component exists anywhere in the tree.
- `components/common/language-selector.tsx` (the one plausible adjacent write, since it owns the
  `language` toggle) read in full: its only persistence call is
  `document.cookie = ${cookieName}=${selected}; ...` at line 49 — **no Supabase import, no
  `.from()` call anywhere in the file.** The cookie write is F009's, not this feature's.

The only thing this bucket claims is the live database permission itself (**FR-001**, **BR-001**
— full statement in § 4.4 Bin 3) — a capability that exists at the schema/GRANT layer with no
application code to bind an action row to.

### 3.2 Edge cases

| Action | Scenario                                                                                                                                                                            | Behavior                                                                                                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0     | A client issues a direct Postgres/Supabase `UPDATE` against `profiles.role` (or any column outside the 3-column grant) as `authenticated`, bypassing any UI — none exists to bypass | Rejected by Postgres before RLS's `WITH CHECK` is even evaluated — the column is simply not covered by `grant update (display_name, avatar_url, language)`. `supabase/migrations/20260906190000_profiles_column_privileges.sql:57` |

## 4. Shared Foundation

### 4.1 Components

N/A — no application component implements this feature. The entire surface is a database-level
GRANT (§ 4.4 Bin 3); there is no controller, service, presenter, or page to list.

### 4.2 Data Model

<!-- No erDiagram: F011's only concern is 3 columns on one existing entity, zero relationships or
     foreign keys of its own. The full profiles ER shape already lives in entities.md, shared
     across F001/F002/F004/F006/F011/F013 — repeating it here would duplicate, not clarify. -->

| Entity    | Table      | Used for                                                                                            | Action |
| --------- | ---------- | --------------------------------------------------------------------------------------------------- | ------ |
| `Profile` | `profiles` | 3-column owner-editable scope (`display_name`, `avatar_url`, `language`) — GRANT exists, unconsumed | A0     |

#### Polymorphic Behavior

`profiles` carries two `DISC-###` entries in `docs/generated/entities.md` (DISC-001 `hero_badge`,
DISC-002 `language`). Both are covered below for completeness, scoped honestly to what F011 itself
does — which, for both, is nothing (no action exists).

##### DISC-001 — Profile.hero_badge

| Value                                 | Render                                                                                              | Validation                                  | Persistence                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `new` / `rising` / `legend` / `super` | N/A — F011 has no action; badge rendering is owned by other features (see `entities.md` § MODEL001) | N/A — not GRANT-covered by `PERM004` at all | No write path in F011 — `hero_badge` is outside this feature's 3-column GRANT scope |

##### DISC-002 — Profile.language

| Value | Render                                                                                              | Validation                                                         | Persistence                                                                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vi`  | Selects the `vi` i18n bundle when no cookie override is present — rendering owned by F009, not F011 | DB `CHECK (language in ('vi','en'))` enforced regardless of caller | GRANT-writable by `authenticated` (this is F011's whole subject) — zero code calls `.update()`/`.upsert()` against it; F009's `LanguageSelector` writes only the `NEXT_LOCALE` cookie (§ 3.1) |
| `en`  | Same as above, `en` bundle                                                                          | Same                                                               | Same                                                                                                                                                                                          |

**Source:** `docs/generated/entities.md` § MODEL001_PROFILES > Discriminator Fields

### 4.3 State Management

None. No state machine exists — there is no action to transition anything.

### 4.4 Shared Rules

#### Bin 3 — cross-cutting, belongs to no single action

**A0 · FR-001 / BR-001 — Any authenticated user may `UPDATE` exactly `display_name`,
`avatar_url`, `language` on their own `profiles` row; no other column and no other row is
writable via any client role.** This is a database-level GRANT scoped to the `authenticated`
Postgres role, combined with the pre-existing RLS policy `"profiles updatable by owner"`
(`auth.uid() = id`) for row-scoping — it applies table-wide, not to any one screen or action, and
holds regardless of whether application code exists to invoke it.

**Historical context (why this is narrower than a bare table GRANT — the reason this scope must
never widen without care):** before `20260906190000_profiles_column_privileges.sql`, `profiles`
inherited the schema's wide-open default ACL (`ALTER DEFAULT PRIVILEGES ... GRANT ALL` to
`anon`/`authenticated` on every new table). Postgres RLS has no per-column `WITH CHECK` — the
existing owner-row UPDATE policy constrained WHICH ROW, never WHICH COLUMN. Combined, any
signed-in user could run an update setting their own row's `role` to `'admin'` (also true of
`hero_badge`/`hero_code`/`boxes_opened`/`boxes_unopened`) and self-promote to admin. The migration
closed this by revoking the inherited default-ACL grant entirely and re-granting exactly
`SELECT` (both roles) plus column-scoped `UPDATE` (authenticated only). **Any future feature that
implements this capability for real (a profile-edit screen/Server Action) must not widen the
GRANT beyond these three columns** — doing so reopens the exact hole this migration closed.

**Source:** `supabase/migrations/20260906190000_profiles_column_privileges.sql:53-57`

```text
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, avatar_url, language) on public.profiles to authenticated;
```

### 4.5 Algorithms & Integrations

None. No computation or external integration exists — there is no action to implement one.

### 4.6 Configuration

`N/A — no technical configuration beyond framework defaults.`

**Client behavior:** see
[`behavior-logic.md`](../../generated/behavior-logic.md) (client-side patterns — debounce, optimistic UI, polling, upload, realtime),
[`permissions.md`](../../system/permissions.md) (feature flags / experiments / env / locale gates),
[`screen-flow.md`](../../generated/screen-flow.md) (guards / deep-link state restoration / unsaved-changes protection).

All three are N/A for this feature — no client code exists to carry any of these patterns.

## 5. Verification & Technical Notes

### 5.1 Technical Verification

- **SC-001** _(A0)_ Attempting a Postgres `UPDATE` to `profiles.role` (or `hero_badge`,
  `hero_code`, `boxes_opened`, `boxes_unopened`, `created_at`, `id`) as `authenticated` is
  rejected by the GRANT, independent of any RLS check — cross-verified against the live GRANT
  state recorded in `permissions-matrix.md` § PERM004 and the migration's own header comment
  pointing at `supabase/tests/privileges.sql` as the executable assertion. (covers FR-001, BR-001)

No `#### {US###}` sub-block exists — this feature declares zero `US###` codes (feature-list.md
F011 § Related User Stories: `—`).

### 5.2 Assumptions

- _(A0)_ This spec assumes the live GRANT state recorded in `permissions-matrix.md` § PERM004
  (itself re-verified against the running Postgres instance, per that document) still matches the
  migration file at spec time — a later migration could alter the grant without a corresponding
  doc update.
- _(A0)_ The absence of a write path is based on a static grep of `app/`, `components/`, `lib/` at
  the current HEAD. A dynamically constructed table name, a build-time codegen step, or a script
  outside these three directories invoking `.from("profiles").update(...)` would not be caught by
  this method.

### 5.3 Unresolved Questions

None — no implementation-detail unknowns remain. The absence of a consuming code path is fully
confirmed by the searches recorded in § 3.1; there is nothing further to read in source to resolve.

### 5.4 Source References

| Action | Order | Symbol                                             | Path                                                                      | Purpose                                                                              |
| ------ | ----- | -------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| —      | 1     | `profiles` (row creation)                          | `supabase/migrations/20260722090000_create_profile_on_signup.sql:7-28`    | the trigger (BL001, owned by F001) that creates the row this GRANT scopes updates to |
| —      | 2     | `profiles` (language column + owner-update policy) | `supabase/migrations/20260716090000_profile_language.sql:6-16`            | adds the `language` column and the row-scoping RLS policy this GRANT narrows         |
| A0     | 3     | `profiles` (column-scoped GRANT)                   | `supabase/migrations/20260906190000_profiles_column_privileges.sql:53-57` | the column-scoped GRANT this feature exists to document                              |

#### Data Flow

`N/A — no action crosses any hops; the entire surface is a static database GRANT, not a request/response thread.`

### 5.5 Artifact References

| Artifact           | File                                                           | Codes Used                                    | Reviewed |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------- | -------- |
| System Overview    | [overview.md](../../system/overview.md)                        | —                                             | [x]      |
| Feature List       | [feature-list.md](../../generated/feature-list.md)             | F011                                          | [x]      |
| Entities           | [entities.md](../../generated/entities.md)                     | MODEL001                                      | [x]      |
| Permissions Matrix | [permissions-matrix.md](../../generated/permissions-matrix.md) | PERM004                                       | [x]      |
| Screens            | [functional-spec.md § 6](./functional-spec.md#6-screens)       | —                                             | [x]      |
| Behavior Logic     | [behavior-logic.md](../../generated/behavior-logic.md)         | BL001 (owned by F001, cited for context only) | [x]      |
| User Stories       | [user-stories.md](../../generated/user-stories.md)             | —                                             | [x]      |
