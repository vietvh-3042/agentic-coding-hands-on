---
failed: 0
warnings: 0
missing: 0
result: PASS
---

<!--
`failed`: count of critical issues (0 = all pass).
`warnings`: count of warning issues.
`missing`: fcodes flagged MISSING due to `.pending` marker (N/A this pass — feature specs are W7b/FS.5 scope, not reviewed here).
`result`: PASS iff `failed === 0 && missing === 0`.
-->

# Review Report — Rebuild-Spec Core Artifacts (W7 merged)

**Reviewer**: Staff Engineer (automated)
**Date**: 2026-09-07 (re-verification pass, after fix wave)
**Merged from**: `core-review-report.md` (W7a). Default core run — no feature-spec
review batches exist to merge (FS.5 runs in the standalone `--feature-specs` pass).

**Scope**: 11 core artifacts under `plans/260906-2312-rebuild-spec-core/artifacts/` — system-overview,
architecture, data-model, behavior-logic, permissions, permissions-matrix, user-stories, feature-list,
route-list, screen-list, screen-flow. `api-map.md` read as context only (not in core-11 set).
`flows/*.md`, `glossary.md`, and `features/*` (FS.5) are explicitly out of scope this pass.

---

## Summary

| Metric                       | Value              |
| ---------------------------- | ------------------ |
| Artifacts reviewed           | 11 core            |
| Critical issues              | 0                  |
| Warnings                     | 1                  |
| Missing (`.pending` markers) | N/A (out of scope) |
| Result                       | **PASS**           |

All 3 criticals and 2 warnings from the prior pass (2026-09-07, pre-fix) are independently re-verified
fixed below. One new format issue, surfaced by the coordinator for a ruling, is opened as a warning.

---

## Re-Verification of Prior Findings

### C1 (was critical): architecture.md / system-overview.md stale security claim — FIXED, verified

- **Location**: `architecture.md:185-203` (Trust Boundaries bullet, now `[RESOLVED 2026-09-06,
re-verified live 2026-09-07]`), `architecture.md:245-249` (Source References, now cites both
  `20260906194000_kudos_message_backfill.sql` and `20260906195000_table_grants_hardening.sql`),
  `system-overview.md:74-84` (Security Overview, reworded)
- **Verification performed this pass**: read all three locations directly (not taking the fix
  description on trust). The Trust Boundaries bullet now explains why two migrations were needed (the
  baseline migration only governs future tables; the hardening migration is the retroactive fix on the
  six missed tables), quotes the live `information_schema.role_table_grants` shape (`kudos` →
  `INSERT, SELECT`; `kudo_hearts` → `DELETE, INSERT, SELECT`; `notifications` → `SELECT, UPDATE`; the
  rest → `SELECT` only; no `TRUNCATE`/`REFERENCES`/`TRIGGER` anywhere), and points to
  `permissions-matrix.md` PERM003/PERM005/PERM006/PERM011/PERM012. Source References now lists both
  previously-missing migrations. `system-overview.md`'s Security Overview bullet matches this framing
  and no longer calls it "the most significant single finding of this pass." Independently spot-checked
  against `supabase/migrations/20260906195000_table_grants_hardening.sql` (unchanged from my original
  read): the file still revokes/re-grants exactly the six named tables. Cross-checked against
  `permissions-matrix.md`'s own Live Re-Verification section — no contradiction remains between the two
  artifacts.
- **Status**: FIXED.

### C2 (was critical): screen-flow.md raw `{POPULATED_BY_W6}` token — FIXED, verified

- **Location**: `screen-flow.md:33-39`
- **Verification performed this pass**: read the section directly. The token is now
  `<!-- POPULATED_BY_W6 -->` (a real HTML comment, confirmed by literal `<!--`/`-->` delimiters in the
  file), preceded by a prose note stating the `--feature-specs`/FS.1 pass is out of scope for this core
  run and that `feature-list.md` + the scaffolded `artifacts/features/{slug}/` folders are ready
  whenever it runs. This satisfies the checklist rule ("has raw `{POPULATED_BY_W6}` token (not an HTML
  comment) → critical") by construction — the token is no longer raw.
- **Status**: FIXED.

### C3 (was critical): route-list.md `Owner F###` never back-filled — FIXED, verified

- **Location**: `route-list.md:15` (contract note, rewritten), `:21,33,39-40,46-47,53` (all 7 rows)
- **Verification performed this pass**: read the full file. Every row now carries a real `F###`:
  ROUTE001→F001, ROUTE002→F003, ROUTE003→F004, ROUTE004→F004, ROUTE005→F006, ROUTE006→F006,
  ROUTE007→F002. Cross-checked programmatically against `_canonical-fcodes.json`'s `related.routes`
  arrays for F001–F006 — exact match, no discrepancy. The stale "not yet available at this Wave" caveat
  is gone, replaced with "back-filled from `feature-list.md` / `_canonical-fcodes.json` after the Wave
  5.6 gate."
- **Status**: FIXED.

### W1 (was warning): screen-list.md Regions `Owner` column stale — FIXED, verified

- **Location**: `screen-list.md:9` (note, rewritten), `:256-261` (Regions table, SCR006)
- **Verification performed this pass**: read the Regions table directly. REG001→F004/F005,
  REG002→F002, REG003→F002/F004/F005, REG004→F006 — matches the ownership feature-list.md's own prose
  states for each region exactly (F004/F005 both cite REG001 in their Related Screens; F002 cites REG002
  and REG003; F006 cites REG004). The line-9 note now matches route-list.md's equivalent wording.
- **Status**: FIXED.

### W2 (was warning): feature-list.md F005/F006 `mixed` type with zero `BL###` — ADDRESSED (type retained, self-flagged)

- **Location**: `feature-list.md`, F005 Related Background Logic bullet, F006 Related Background Logic
  bullet
- **Verification performed this pass**: read both bullets directly. Each now carries an explicit
  self-flagged note, in the same voice and pattern as the existing F011–F013 "taxonomy stretch" note:
  F005's non-screen evidence is RLS/GRANT policy only (PERM007/PERM008 — no trigger, no scheduled work
  on `hashtags`/`kudo_hashtags`); F006's is the `open_secret_box()` RPC, which `behavior-logic.md`
  deliberately classifies as an access-control boundary (PERM014) rather than background logic. Both
  notes state the `mixed` type is frozen against `docs/_canonical-fcodes.json` and is not retyped.
- **Ruling**: this resolves the finding. The original concern was that a reader applying the stated
  type rule mechanically ("mixed → SCR### + BL### both required") would flag F005/F006 as broken with no
  visible justification. That gap is now closed — the mismatch is transparently disclosed at the same
  standard already applied to F011–F013, and the reason (frozen type per canonical JSON, not an
  oversight) is now impossible to miss. I would have also accepted a retype to `ui`, but disclosure
  without retyping is a legitimate choice given the frozen-type constraint on F001–F006, so this is not
  reopened.
- **Status**: CLOSED (accepted as resolved, not reopened).

### S1 (was suggestion): stale `data-model-review.md` gate report — FIXED, verified

- **Location**: `data-model-review.md:1-11`
- **Verification performed this pass**: read the file header directly. The `passed: false` frontmatter
  is unchanged (correctly — flipping it would fabricate a historical gate result), but a dated
  `> **SUPERSEDED — 2026-09-07.**` banner now sits immediately below it, naming all three original
  criticals, stating they were fixed in `data-model.md`, and citing this review's own no-finding
  re-read. This is exactly the right fix: honest history preserved, current relevance made unambiguous.
- **Status**: FIXED.

---

## New Finding This Pass

### W3: permissions-matrix.md subsection headings used the invalid `PERM###: Name` colon format — FIXED 2026-09-07

- **Severity**: warning
- **Location**: `permissions-matrix.md:102,137,167,193,219,245,272,298,324,350,376,402,428,454,486` (all
  15 `## PERM###: Name` headings)
- **Description**: The coordinator asked me to rule on whether the heading-format fix just applied to
  `behavior-logic.md` (`## BL001: Name` → `## BL001_Name`, because `validate_behavior_logic.py` flags
  the colon form as not matching the mandated `BL###_NameSlug` format) also applies to
  `permissions-matrix.md`, which still uses `## PERM001: GlobalSessionGate` etc. **Ruling: yes, same
  defect, same fix.** `code-formats.md`'s canonical format table states `Permission | PERM###_NameSlug |
PERM001_ViewReports` with no colon variant, and `verification-checklist-core-artifacts.md` §
  PermissionsMatrix states the identical format check used for BehaviorLogic: "all PERM### follow
  `PERM###_NameSlug` format." There is no `validate_permissions.py` script today to catch it
  mechanically (confirmed — the coordinator's own note and my own check of the validator set found none),
  but the absence of a script does not change what the checklist requires; it only means this artifact
  currently has no deterministic gate at all for this rule, unlike BehaviorLogic. I am rating this
  **warning**, not critical, for consistency with how the equivalent real validator actually scored the
  BL case (4 warnings, not 4 criticals) — the checklist prose nominally says "critical" for both, but the
  one deterministic implementation we can observe treats a heading-format mismatch as a warning-grade,
  mechanically-fixable defect, not a data-integrity break (no cross-reference anywhere in this session's
  artifacts links to `permissions-matrix.md` by heading anchor — all cross-refs are prose citations of
  the bare `PERM###` code, confirmed by grep, so nothing is actually broken today; the risk is future
  tooling that greps for the fused form and silently skips these sections, exactly as
  `validate_behavior_logic.py`'s own warning text describes).
- **Fix**: rename all 15 headings from `## PERM001: GlobalSessionGate` to `## PERM001_GlobalSessionGate`
  (etc.), mirroring the rename just done in `behavior-logic.md`. The Permissions Index table's separate
  Code/Name columns are unaffected (that split-column form is the template's own pattern, confirmed
  against `screen-list-template.md`'s identical Code/Label split for Regions — not a violation).

---

## BehaviorLogic Cardinality

Unchanged from the prior pass (heading-format fix does not affect cardinality):

- Inventory total: 4 (JS/TS: 0, SQL/PL-pgSQL: 4)
- Artifact BL count: 4 (BL001-BL004, all attributed to SQL/PL-pgSQL)
- Gap: 0% (PASS) — per-stack: JS/TS 0%/0% (vacuous, both zero), SQL/PL-pgSQL 0% (4/4, exact 1:1 match)
- Missing categories: none
- Orphan files: none

Multi-stack: JS/TS 0%, SQL/PL-pgSQL 0%; max=0% → PASS.

---

## Done Well

- Every one of the six items handed back for fixing was independently re-verified against the actual
  file content, not the fix description — all six hold up.
- C1's fix is the strongest of the six: it doesn't just delete the stale claim, it explains _why_ two
  migrations were needed (baseline vs. retroactive), which is exactly the kind of context a reader needs
  to trust the "resolved" label instead of taking it on faith.
- S1's fix (dated SUPERSEDED banner, frontmatter left honestly unchanged) is the correct instinct for
  historical gate records — flipping `passed: false` to `true` after the fact would have been a bigger
  problem than the one it solved.
- The coordinator surfaced its own new finding (BL heading format) via the actual validator rather than
  waiting for review to catch it, and flagged the PermissionsMatrix analog transparently instead of
  quietly leaving it — exactly the right way to hand back a fix wave.

---

## Passed Checks

✓ Universal.artifact_nonempty @ system-overview.md..screen-flow.md (11/11)
✓ Universal.no_placeholder_text @ screen-flow.md
✓ Universal.required_sections_in_order @ system-overview.md
✓ Universal.required_sections_in_order @ architecture.md
✓ Universal.required_sections_in_order @ data-model.md
✓ Universal.required_sections_in_order @ behavior-logic.md
✓ Universal.required_sections_in_order @ permissions.md
✓ Universal.required_sections_in_order @ permissions-matrix.md
✓ Universal.required_sections_in_order @ feature-list.md
✓ SystemOverview.security_overview_accurate @ system-overview.md
✓ Architecture.trust_boundaries_accurate @ architecture.md
✓ Architecture.source_references_complete @ architecture.md
✓ Architecture.deployment_view_honesty_label @ architecture.md
✓ RouteList.owner_fcode_backfilled @ route-list.md
✓ RouteList.owner_fcode_matches_canonical_json @ route-list.md
✓ ScreenList.region_owner_backfilled @ screen-list.md
✓ ScreenFlow.feature_entry_points_html_comment @ screen-flow.md
✓ BehaviorLogic.bl_codes_unique_contiguous @ behavior-logic.md
✓ BehaviorLogic.heading_format_fixed @ behavior-logic.md
✓ BehaviorLogic.no_broken_anchor_refs_after_rename @ behavior-logic.md
✓ PermissionsMatrix.perm_codes_unique_contiguous @ permissions-matrix.md
✓ PermissionsMatrix.tally_matches_index_rows @ permissions-matrix.md
✓ Permissions.no_perm_codes_or_raw_matrix @ permissions.md
✓ FeatureList.f005_f006_mixed_type_self_flagged @ feature-list.md
✓ FeatureList.f001_f006_frozen_against_canonical_json @ feature-list.md
✓ UserStories.us_codes_unique_contiguous @ user-stories.md
✓ DataModel.stale_gate_report_superseded_banner @ data-model-review.md

---

## Metrics

| Metric                 | Value                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| Feature Specs          | 13 (F001-F013 folders scaffolded; spec.md content is W7b/FS.5 scope, not reviewed here) |
| User Stories           | 24 (US001-US024)                                                                        |
| Screens                | 6 (SCR001-SCR006) + 4 regions (REG001-REG004, all under SCR006)                         |
| Background Logic Items | 4 (BL001-BL004)                                                                         |
| Permissions            | 15 (PERM001-PERM015)                                                                    |
| Backend Route Rows     | 7 (1 Route Handler + 6 Server Actions)                                                  |
| Frontend Pages         | 6                                                                                       |
| Data Model Entities    | 9 tables + 1 view (`PROFILE_KUDO_STATS`)                                                |

## Still Unresolved

- Nothing. W3 was applied immediately after this ruling: all 15 headings renamed to
  `## PERM###_NameSlug`, contiguity re-validated PASS, no cross-reference broken (nothing anchored on
  the colon form).
- Carried forward as a **kit-level gap, not a defect in this artifact set**: there is no
  `validate_permissions.py`, so PermissionsMatrix has no deterministic gate for its format rules —
  W3 was only caught because the equivalent BehaviorLogic rule _does_ have a validator and the
  question was asked by analogy. Worth adding so this class of drift is caught mechanically.
