# Phase 01 — `departments` table, master seed, profile linkage

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- Spec: [`data/WXK5AYB_rG-specs.csv`](./data/WXK5AYB_rG-specs.csv) row `mms_A_Dropdown-List` — the
  master list lives in that row's `description` field
- Shared decisions: [`../260906-1903-profile-and-menus/clarifications.md`](../260906-1903-profile-and-menus/clarifications.md) (Q1, Q2)
- Consumer: [`profile-and-menus` phase 02](../260906-1903-profile-and-menus/phase-02-profile-read-layer.md)
- Access model to honour: [`../260710-1511-sun-kudos-live-board/spec/system/permissions.md`](../260710-1511-sun-kudos-live-board/spec/system/permissions.md)

## Overview

**Priority:** P1 · **Status:** pending · **Effort:** 2.5h
**Depends on:** **Batch A phase 0** (column-level GRANTs on `profiles`)
**test_policy:** `visual-contract` for screen `WXK5AYB_rG` — this phase renders nothing, so its own
evidence is SQL assertion. No RED, no TDD claimed.

One migration: create `public.departments`, seed the 50-entry master list, add
`profiles.department_id`, backfill it from the existing `hero_code` text, and assert the GRANTs the
project's default ACL would otherwise get wrong.

## Key Insights

- **The master list belongs in the migration, not in `seed.sql`.** It is master data the application
  depends on, not local fixture data — and putting it in `seed.sql` would collide with
  [profile-and-menus phase 01](../260906-1903-profile-and-menus/phase-01-e2e-identity-fixtures.md),
  which owns that file. One owner per file.
- **The postgres-owned default ACL grants all seven privilege types to `anon` AND `authenticated`
  on every new table in schema `public`** — confirmed with `\ddp`. Note this contradicts what
  `20260722070000_grant_table_privileges.sql` _intended_ (it issues `alter default privileges …
grant select`), because an earlier, wider default is still in force. **RLS is therefore the only
  real access control on this project; a GRANT is not a second line of defence and is not safely
  inherited.** This table must `revoke` explicitly, then grant `select` only.
- **`profiles.hero_code` is `text not null` and holds department-shaped values** (`'CEVC3'`,
  `'CEVC10'` live). Whether `department_id` replaces it is [Q1](../260906-1903-profile-and-menus/clarifications.md)
  — a product decision. This phase **adds** a nullable column and touches `hero_code` not at all: a
  destructive drop is unrecoverable, an additive column is a one-line rollback.
- **`department_id` must be nullable.** `'CEVC10'` matches nothing in the master list, so a
  `not null` column would make the backfill impossible without inventing a row. The profile screen's
  `GUI_009` already specifies the null-department rendering, so nothing breaks visually.
- **Adding a column to `profiles` re-opens the A-p0 question.** The column-level
  `GRANT UPDATE (display_name, avatar_url, language)` does **not** cover a column added afterwards —
  which is correct and desirable here (a user must not set their own department), but it has to be
  stated so nobody "fixes" it later by re-granting table-wide UPDATE.

## The master list

Extracted from `mms_A_Dropdown-List`'s `description`. The CSV flattened it into one
whitespace-joined string with no delimiter, and hierarchical entries join their parts with `" - "`.
The parse below is a **heuristic** that yields exactly 50 unique entries. Recorded verbatim so a BA
can confirm or correct it — **do not re-derive it, and do not extend it.**

```
 1 CTO                        18 CEVC1 - AIE               35 GEU - DUT
 2 SPD                        19 OPDC - HRF - C&B          36 OPDC - HRD - L&D
 3 FCOV                       20 FCOV - GA                 37 OPDC - HRD - TI
 4 CEVC1                      21 FCOV - ISO                38 OPDC - HRF - TA
 5 CEVC2                      22 STVC - EE                 39 GEU - UET
 6 STVC - R&D                 23 GEU - HUST                40 STVC - R&D - SDX
 7 CEVC2 - CySS               24 CEVEC - SAPD              41 OPDC - HRD - HRBP
 8 FCOV - LRM                 25 OPDC - HRF - OD           42 PAO - PEC
 9 CEVC2 - System            26 CEVEC - GSD               43 IAV
10 OPDC - HRF                 27 GEU - TM                  44 STVC - Infra
11 CEVC1 - DSV - UI/UX 1      28 STVC - R&D - DTR          45 CPV - CGP
12 CEVC1 - DSV                29 STVC - R&D - DPS          46 GEU - UIT
13 CEVEC                      30 CEVC3                     47 OPDC - HRD
14 OPDC - HRD - C&C           31 STVC - R&D - AIR          48 BDV
15 STVC                       32 CEVC4                     49 CPV
16 FCOV - F&A                 33 PAO                       50 PAO - PAO
17 CEVC1 - DSV - UI/UX 2      34 GEU
```

**Flagged for BA confirmation** (Q2): `CEVEC` (#13, #24, #26) reads as a typo for `CEVC`;
`PAO - PAO` (#50) reads as a duplication artefact; the design's _visible_ dropdown shows `OPD` and
`Infra`, neither of which is in this list (`OPDC …` and `STVC - Infra` are the nearest); and the
live `hero_code` value `'CEVC10'` is in neither.

## Requirements

**Functional**

- FR-D101 — `public.departments(id uuid pk, name text not null unique, sort_order int not null)`
  exists with all 50 rows.
- FR-D102 — display order is the spec's list order, carried by `sort_order`; alphabetising it would
  lose the design's intent.
- FR-D103 — `profiles.department_id uuid null references public.departments(id)`, `on delete set null`.
- FR-D104 — backfill: `department_id` set where `hero_code` matches a `departments.name` exactly;
  everything else stays `NULL`.
- FR-D105 — RLS on, `for select to anon, authenticated using (true)`; **no** write policy.
- FR-D106 — explicit `revoke all … from anon, authenticated;` then `grant select … to authenticated,
anon;` and `grant all … to service_role;`.
- FR-D107 — `authenticated` must **not** hold `UPDATE (department_id)` on `profiles`.

**Non-functional**

- One migration file, idempotent-safe constructs (`if not exists`) where the project already uses
  them. Never edit an applied migration — a correction is a new file.
- The 50 rows are inserted as a single `insert … values` with `on conflict (name) do nothing`.

## Architecture

```text
public.departments
  id         uuid pk default gen_random_uuid()
  name       text not null unique          ← the master-list entry, verbatim
  sort_order integer not null              ← 1..50, the spec's list order

public.profiles
  + department_id uuid null references public.departments(id) on delete set null
  (hero_code untouched — see Q1)

backfill:  update public.profiles p
             set department_id = d.id
             from public.departments d
            where d.name = p.hero_code;

grants:    revoke all on public.departments from anon, authenticated;
           grant select on public.departments to anon, authenticated;
           grant all    on public.departments to service_role;
           -- profiles.department_id is deliberately absent from A-p0's
           -- GRANT UPDATE (display_name, avatar_url, language): a member
           -- must not set their own department.
```

**Data flow**

| In                        | Transform                                       | Out                        |
| ------------------------- | ----------------------------------------------- | -------------------------- |
| spec `description` string | the heuristic parse above (done once, recorded) | 50 named rows              |
| `profiles.hero_code`      | exact-name join                                 | `department_id` or `NULL`  |
| `departments`             | phase 02's query                                | dropdown options           |
| `profiles.department_id`  | profile-and-menus phase 02's join               | the hero's department line |

## Related Code Files

**Create**

- `supabase/migrations/20260907020000_departments.sql` (~70 lines)

**Read for context (do not modify)**

- `supabase/migrations/20260722070000_grant_table_privileges.sql` — the existing (insufficient)
  default-privileges attempt
- `supabase/migrations/20260714070000_profile_schema.sql` — the `profiles` shape and its policies
- `constants/index.ts` — the 4 rows being superseded (phase 02 retires them)

**Explicitly not modified**

- `supabase/seed.sql` — owned by
  [profile-and-menus phase 01](../260906-1903-profile-and-menus/phase-01-e2e-identity-fixtures.md)

## Implementation Steps

1. **Gate:** confirm Batch A phase 0 is applied (`\dp public.profiles` shows column-scoped UPDATE).
   Not applied → **BLOCKED**; do not re-plan it here.
2. **Gate:** Q1 and Q2 answered, or proceed on the recorded fallback with that stated in the phase
   report — never silently.
3. Write the migration in this order: `create table` → `insert` 50 rows → `alter table profiles add
column` → backfill `update` → `alter table … enable row level security` → policy → `revoke` →
   `grant`. The revoke/grant pair goes **last** so nothing between them can widen it.
4. Apply and verify every success criterion below with `docker exec … psql` before moving on.
5. Record the backfill match rate. A low rate is a **finding to report**, not a reason to loosen the
   join to `ilike` or a prefix match — a fuzzy department match is a data-integrity problem wearing
   a convenience costume.

## Todo List

- [ ] A-p0 verified applied (else BLOCKED)
- [ ] Q1/Q2 answered, or the fallback recorded in the phase report
- [ ] Migration file created; no applied migration edited
- [ ] 50 rows, all unique, `sort_order` 1..50 in the spec's order
- [ ] `profiles.department_id` nullable, FK with `on delete set null`
- [ ] Backfill run; match rate recorded
- [ ] RLS enabled; SELECT policy only; **no** write policy
- [ ] `revoke` before `grant`, both explicit, both last in the file
- [ ] `\dp public.departments` shows `anon`/`authenticated` with `r` only
- [ ] `\dp public.profiles` shows `authenticated` **without** `UPDATE (department_id)`
- [ ] `hero_code` untouched

## Success Criteria

| ID      | Criterion                    | Method                                                                                                                     |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| SC-D101 | 50 rows                      | `select count(*) from public.departments;` → `50`                                                                          |
| SC-D102 | Unique names                 | `select count(distinct name) …` → `50`                                                                                     |
| SC-D103 | Order preserved              | `select name from … order by sort_order limit 5` → `CTO, SPD, FCOV, CEVC1, CEVC2`                                          |
| SC-D104 | Column linked                | `\d public.profiles` shows the FK, nullable                                                                                |
| SC-D105 | Backfill honest              | `select count(*) filter (where department_id is null) …` recorded, `'CEVC10'` rows expected null                           |
| SC-D106 | Read-only to users           | `\dp public.departments` → `anon=r`, `authenticated=r`; no `a`/`w`/`d`                                                     |
| SC-D107 | No write policy              | `select * from pg_policies where tablename='departments'` → exactly one, `SELECT`                                          |
| SC-D108 | Department not self-writable | as an ordinary JWT, `update profiles set department_id=… where id=auth.uid()` in a rolled-back transaction → **must fail** |

## Risk Assessment

| Risk                                                                     | Likelihood                           | Impact                       | Countermeasure                                                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default ACL silently grants `anon` full privileges on the new table      | **High** (it is the project default) | **Critical**                 | Explicit `revoke`+`grant` last in the file; SC-D106 verifies with `\dp`, not by reading the DDL                                                  |
| The heuristic parse is wrong — merged or split entries                   | **High**                             | High                         | The list is printed verbatim above for BA confirmation; SC-D101/102 catch count and uniqueness but not semantics, which is exactly why Q2 exists |
| Backfill match rate near zero because `hero_code` was never a department | Medium                               | Medium                       | Recorded as a finding, not papered over. Nulls render correctly per `GUI_009`                                                                    |
| Fuzzy-matching the backfill to raise the rate                            | Medium                               | High                         | Forbidden in step 5; an exact join or nothing                                                                                                    |
| `hero_code` dropped before Q1 is answered                                | Low                                  | **Critical** (unrecoverable) | Additive-only column; the drop is explicitly out of scope                                                                                        |
| Adding `department_id` to the writable column GRANT "for consistency"    | Medium                               | High                         | SC-D108 asserts it must fail; the reason is in the migration's comment                                                                           |
| A correction edits the applied migration                                 | Medium                               | Medium                       | Project convention: corrections are new files. Stated in Non-functional                                                                          |

## Security Considerations

- The `departments` table is public read, no write policy — the master list is admin/seed-only,
  matching how `hashtags` is planned in Batch A.
- **RLS is the only real access control on this project.** The GRANTs here are asserted because the
  default ACL is wrong, not because they are the boundary.
- A department must never become a permission. Nothing in this batch reads `department_id` to make
  an authorization decision, and nothing should start.
- `department_id` stays outside the user-writable column set. Letting a member set their own
  department would be a self-service change to a field the org owns.

## Next Steps

Unblocks [phase 02](./phase-02-department-options-source.md) and
[profile-and-menus phase 02](../260906-1903-profile-and-menus/phase-02-profile-read-layer.md).
Report row count, backfill match rate, and both `\dp` outputs.

## Rollback

New down-migration (never edit the applied file):

```sql
alter table public.profiles drop column if exists department_id;
drop table if exists public.departments;
```

`hero_code` was never touched, so every existing read path keeps working and nothing cascades.
Do this **before** rolling back A-p0, if both are being undone.
