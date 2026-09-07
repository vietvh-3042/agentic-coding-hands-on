---
batch: 3
fcodes: [F011, F012, F013]
failed: 0
warnings: 0
missing: 0
---

# Feature Review — Batch 3 (F011, F012, F013)

**Standard applied:** inverted — all three document a declared-but-unconsumed database surface
(`PERM004`/`PERM011`/`PERM015`) with zero user stories, zero screens, zero routes. The job here is
not "is the feature well-specified" but "is every absence claim actually true, and is nothing
invented." All greps the specs cite were re-run against the live tree; all cited migration/test
files were read in full. **This is a re-verification pass** — a first pass found 2 Critical + 3
Medium + 1 Low; an implementer fixed all six; every fix is independently re-confirmed below, not
taken on the fix report's word.

### Scope

- Files reviewed: `features/F011_ProfileSelfService/{functional,technical}-spec.md`,
  `features/F012_InAppNotifications/{functional,technical}-spec.md`,
  `features/F013_AdminRoleGate/{functional,technical}-spec.md` (6 files)
- Lines: ~720 total (all six files re-read in full, not diffed)
- Depth: full — every citation independently re-verified against source, not sampled
- Validator pre-check: 0 criticals across all 13 specs; this batch's only reported finding is
  `func.rule_density` (WARN) on all three — judged, not just skipped (see Done Well)

### Assessment

All six fixes from the prior pass are genuinely resolved, not just line-touched. Both Criticals
(`FR-001` uncovered in F012 and F013) now have a real `SC-000` whose claimed migration content was
independently re-read and matches exactly. Both Medium grep-citation errors in F012 were re-run
verbatim and now match what the spec states. All three off-by-one citations in F011 now point at
the actual `.from("profiles")` line. F013's over-wide citation is now tight. The corpus-wide § 5.5
link rewrite (fixing the doubled `docs/` segment and the `system-overview.md`→`overview.md`
rename) resolves correctly in all three specs when simulated from the eventual
`docs/features/<slug>/` promote location. No absence claim weakened by any of these edits — the
underlying technical descriptions are untouched; only citations, grep transcripts, and the two new
`SC-###` rows changed.

### Critical

None. Both prior Criticals confirmed resolved:

1. **F012 — `FR-001` now covered.** `technical-spec.md:157-160` adds `SC-000 *(A0)*`: "`notifications`
   table exists with columns `id`, `user_id`, `title`, `body`, `read_at`, `created_at`, RLS enabled,
   and owner-scoped `SELECT`/`UPDATE` policies ... against `supabase/migrations/
20260723090000_notifications.sql:1-32` (covers FR-001)." **Re-read the full 32-line migration**:
   it creates exactly those 6 columns, runs `alter table ... enable row level security`, and defines
   `"notifications readable by self"` (SELECT) and `"notifications update by self"` (UPDATE), both
   `to authenticated`. The `SC-000` claim matches the migration exactly. All three functional FRs
   (FR-001, FR-401, FR-601) now have a `(covers ...)` back-ref in § 5.1.
2. **F013 — `FR-001` now covered.** `technical-spec.md:162-165` adds `SC-000 *(A0)*`: `profiles.role`
   exists as `text not null default 'user' check (role in ('user', 'admin'))`, citing
   `supabase/migrations/20260723091000_profiles_role.sql:5-7`. **Re-read the migration**: lines 5-7
   are exactly `alter table public.profiles add column if not exists role text not null default
'user' check (role in ('user', 'admin'));` — verbatim match to the SC-000 claim. All three
   functional FRs (FR-001, FR-601, FR-602) now have a `(covers ...)` back-ref in § 5.1.

### High

None.

### Medium

None. Both prior Medium findings (F012's two grep citations) confirmed resolved — re-ran both
commands verbatim:

1. `grep -rniI "notification" app/ components/ lib/ -l` → **5 files**, matching the corrected
   § 5.3 text exactly: `notification-menu.tsx`, `site-header.tsx`, `lib/supabase/database.types.ts`,
   `lib/i18n/locales/en/common.json`, `lib/i18n/locales/vi/common.json`.
2. `grep -rn "INSERT INTO notifications" supabase/` → **zero matches** (exit 1), matching the
   spec's now-correct statement that this exact command "matches nothing." The corrected form
   `grep -rni "insert into.*notifications" supabase/` → matches only `supabase/seed.sql:453`,
   exactly as the spec now states.

The prior Medium on F011 (3 off-by-one citations) also confirmed resolved — see Low-adjacent note
below; folded into "Done Well" since it's a clean fix with nothing left to flag.

### Low

None outstanding. F011's citation fix and F013's citation-narrowing fix both independently
re-verified:

- **F011 `technical-spec.md:50-53`**: `kudos-recipient-select.tsx:74`, `open-secret-box.ts:104`,
  `submit-kudo.ts:70` — all three now point at the actual `.from("profiles")` line (confirmed by
  direct read of each file); `board-aggregates.ts:80` was already correct and correctly left alone.
- **F013 `technical-spec.md:66` and `:207`**: Source citation narrowed from `:90-99` to `:95-99` in
  both the § 3.1 Source line and the § 5.4 Source References table — confirmed lines 95-99 are
  exactly the "Admin Dashboard" `<li>`/`<button>` (lines 90-94 are the unrelated "Profile" item).

### § 5.5 Artifact References link rewrite — verified, not trusted

Simulated resolution of every `../../...` link in all three specs' § 5.5 from the eventual
`docs/features/<slug>/technical-spec.md` promote path: `../../system/overview.md`,
`../../generated/feature-list.md`, `../../generated/entities.md`,
`../../generated/permissions-matrix.md`, `../../generated/behavior-logic.md`,
`../../generated/user-stories.md`, `../../system/architecture.md` (F013 only),
`../../generated/api-map.md` (F013 only) — every target file exists in the real `docs/` tree
(`docs/system/overview.md`, `docs/system/architecture.md`, `docs/generated/{feature-list,entities,
permissions-matrix,behavior-logic,user-stories,api-map}.md`, all confirmed present). No doubled
`docs/docs/` segment remains, and `overview.md` (not the old `system-overview.md`) is the correct
real filename. Self-references (`./functional-spec.md`) are directory-relative and unaffected by
promote location. All links resolve correctly.

### Edge Cases Turned Up

(Unchanged from the prior pass — no new edge-case gaps introduced by the fixes.)

- F012's edge case citing the two Vietnamese seed-row titles that thematically imply a
  kudo-received/secret-box-opened trigger (`supabase/seed.sql:453-464`) remains a sharp catch,
  independently re-confirmed: no such trigger exists in any `supabase/migrations/*.sql` file.

### Done Well

- **Fixes were real fixes, not cosmetic.** Both `SC-000` additions cite specific, re-readable
  migration content that matches verbatim — not a bare "(covers FR-001)" tag bolted onto an
  unrelated existing SC.
- **The grep corrections in F012 § 5.3 are now self-consistent**: the spec explicitly shows the
  wrong command failing ("matches nothing... the actual seed statement is lowercase and
  schema-qualified") before giving the corrected command and its real result — more transparent
  than simply replacing the wrong number silently.
- **`rule_density` still fires WARN on all three** (F011 3.5, F012 ~3.2, F013 ~2.9 lines/rule,
  slightly up from the SC-000 additions) — re-judged, still genuine evidentiary content, not
  padding; unaffected by this round of fixes.
- **No absence claim was weakened by any edit.** Every technical conclusion (zero writes to
  `profiles` in F011, zero query layer / zero notification trigger in F012, zero code reading
  `profiles.role` in F013, self-promotion hole genuinely closed in F011/F013) is unchanged and
  re-independently-confirmed true.

### Actions In Order

None outstanding — batch is clean.

### Numbers

- Findings: 0 Critical, 0 High, 0 Medium, 0 Low
- All 6 prior findings (2 Critical, 3 Medium, 1 Low) independently re-verified as genuinely fixed
  by re-reading source, not by trusting the fix report
- Deterministic-pass items (validator-confirmed, unaffected by these edits): required-section
  order, F### code/name/priority match, action-index structure, rung order/non-empty rendering,
  cross-ref code existence, no forbidden dev-tokens/secrets, `.pending` markers absent

### Still Unresolved

None.

---

## Re-verification notes (this pass)

- **Criticals check:** confirmed not just "a line was added" — read both cited migrations in full
  and compared their exact SQL against each `SC-000` claim. Both match verbatim.
- **F012 greps:** re-ran both corrected commands myself; both now reproduce exactly what the spec
  states (5 files; zero matches for the case-sensitive form; `seed.sql:453` for the corrected form).
- **F011 line corrections:** re-read all three files at the corrected line numbers; all three are
  the real `.from("profiles")` line, not adjacent lines.
- **Absence claims:** re-checked all three feature's core claims (F011 zero writes to `profiles`;
  F012 zero query layer + zero notification-generating trigger; F013 zero code reading
  `profiles.role` + self-promotion hole closed) — none weakened, all still independently true.
- **§ 5.5 links:** simulated resolution against the real `docs/` tree from the post-promote path;
  all resolve, not asserted on the fix-report's word alone.

**Status:** DONE
**Failed / Warnings / Missing:** 0 / 0 / 0
