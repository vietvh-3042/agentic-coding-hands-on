---
failed: 0
warnings: 11
missing: 0
result: PASS
fcodes: [F001, F002, F003, F004, F005, F006, F007, F008, F009, F010, F011, F012, F013]
---

# Feature Spec Review Report — merged (FS.5)

**Merged from**: feature-review-batch-1.md, feature-review-batch-2.md, feature-review-batch-3.md — 3 reviewer batches over 13 features. `result` is PASS iff `failed === 0 && missing === 0`.

Batches 2 and 3 were re-verified after their findings were applied; both re-read source rather than accepting the fix reports.

---

# Feature Spec Review — Batch 1 (F001–F005)

Reviewed both files for each of F001_GoogleSignIn, F002_KudosBoardData, F003_KudoAuthoring,
F004_KudoHearts, F005_HashtagTaxonomy under
`plans/260906-2312-rebuild-spec-core/artifacts/features/`. No `.pending` markers found for any of
the five folders. All 13 required functional-spec H2s and all 5 required technical-spec H2s
(§ 1–§ 5, action-thread shape) present and in order for every feature. `#### Polymorphic Behavior`
present and consistent with `entities.md` for all five (F001/F002 carry real DISC-001/DISC-002
tables; F003/F004/F005 correctly declare N/A, each citing the specific `entities.md` "None
assigned" note that licenses the N/A).

**`warnings: 0` in frontmatter reports MY findings count (0 new — see below), not the pre-flagged
validator WARNs, which are unchanged from the pre-check (6 across F001/F002/F003/F005, all
adjudicated below).**

## Deterministic-pass items (not re-litigated)

- F001/F002/F003/F004/F005: `FeatureSpec.required_sections`, `action_index_missing`,
  `action_unclaimed`, `rung_order`, `rung_empty_rendered`, `sysdesign_subsections`,
  `verification_subsections`, `capability_buckets_missing`, `Universal.no_placeholder`,
  `citation.*` (range/traversal), `func.missing_h2`, `func.dev_token`, `func.secret_shape`,
  `cap.code_unclaimed`, `cap.double_claimed`, `func.code_orphan`, `func.code_unsurfaced` —
  `[deterministic-pass]`, all PASS per `fs-validation-summary.json`.

## Findings

### Medium — F005 § 2 Action Index over-claims US014, contradicting F005's own § 5.5 and feature-list.md's canonical ownership

**Location:** `plans/260906-2312-rebuild-spec-core/artifacts/features/F005_HashtagTaxonomy/technical-spec.md:34`

`feature-list.md:634` and `:634` canonically map `US014_FilterHighlightKudosByDepartment` to
**F002** only — F002's spec fully owns it (own `#### US014_FilterHighlightKudosByDepartment ·
US015...` H4 block in `functional-spec.md § 7`, its own § 2 Action Index A2 row, and its own § 5.5
User Stories cell lists `US014`). F005's technical-spec § 2 Action Index row for **A1** lists
`US014` in its `Codes` column (line 34: `...BR-001, BR-002, SM-001, US013, US014 |`), but:

- F005's own A1 H4 context line (line 52) does **not** cite US014 — only `FR-101 FR-201 FR-401
FR-402 US013`.
- F005's own § 5.5 Artifact References User Stories row (line 439) lists only `US013` — not
  US014.
- F005's `functional-spec.md` never declares US014 anywhere.
- The one place US014 appears in F005's technical-spec body (line 59 prose, and the § 5.2
  Assumptions note at line 383) is an explicit disclaimer — "F002's department narrow (`US014`,
  not part of this feature)" — correctly describing it as belonging to a _different, unrelated_
  filter (department, not hashtag) that happens to share one presentational component.

This is internally inconsistent: the § 2 Action Index `Codes` column is the field the
action-thread validator's claim-tracking machinery reads (`action_unclaimed`/fan-out semantics),
and it is the one place in this pair that asserts ownership, not just a citation. Putting US014
there while the prose immediately disclaims ownership, the H4 context line excludes it, and § 5.5
excludes it, is not "traceability" — it is a stray code left in a claim-bearing field that every
other part of the same document correctly omits it from. This is the ownership-leakage the task
asked me to rule on: **not legitimate as authored.** It does not trip any wired validator rule
today (US-in-Codes isn't cross-checked against `feature-list.md`'s per-US owner the way `ROUTE###`
citations are in `validate_feature_api_link.py`), so it is real but currently invisible to the
deterministic gate — worth a fix, not a blocker.

**Fix:** drop `US014` from line 34's `Codes` column (`...SM-001, US013 |`). Keep the prose mention
at line 59 and the § 5.2 Assumption at line 383 exactly as they are — those are the correct,
self-sufficient way to disclaim the shared-component, different-owner relationship without
claiming the code.

### Low — F003 ALG-001 has no populated File Schema table (already flagged WARN, adjudicated here)

**Location:** `plans/260906-2312-rebuild-spec-core/artifacts/features/F003_KudoAuthoring/technical-spec.md:331-356`

Confirmed by reading the block: "Sequential image upload with rollback" (ALG-001) describes
`Input`/`Output` inline (`File[]` → `UploadedKudoImage[]` with `path`/`publicUrl`) and the naming
pattern (`{userId}/{uuid}-{filename}`) in prose, but never renders a `**File Schema**` table. The
content is present, just not in the table shape the file-exchange vocabulary calls for — a format
gap, not a missing-information gap.

**Fix:** add directly under the `**Description:**` paragraph:

```
**File Schema:**
| Field | Type | Description |
|---|---|---|
| path | string | Storage path, `{userId}/{uuid}-{filename}` |
| publicUrl | string | Public URL returned by `getPublicUrl()` |
```

### Info — F001/F002/F005 `func.rule_density` and F002/F005 `dec_lazy_na` — both false positives, no action needed

Adjudicated per the task's specific question 1; see "Ruling on the three questions" below.

## Ruling on the three questions

**1. `dec_lazy_na` on F002 (technical-spec.md:353) and F005 (technical-spec.md:211) — cosmetic, not
skipped DEC work.**

- **F002:** the flagged pattern is not code at all — it's the § 5.4 Data Flow _text diagram_
  notation at line 644: `{?tag= search param} -> parseHashtagParam -> BoardFilter{hashtagId,
department:null}`. The regex (`\{[^}]*\?[^:]*:[^}]*\}`) coincidentally matches the `?`/`:`
  characters used as plain-English annotation inside a fenced ` ```text ` block, not a JS ternary.
  There is no missed DEC here — the validator's reported line (353, the § 4 heading) doesn't even
  match where the pattern actually fires (644), reinforcing that this is a location-agnostic
  document-wide scan, not a targeted finding.
- **F005:** re-ran the check's regex myself; because `[^}]` spans newlines, it greedily matches
  from `{filter.hashtagId ?? "all"}` (a nullish-coalescing default, not a ternary — no colon
  operator at all) all the way to an unrelated closing `}` several paragraphs later. The one
  **genuine** ternary in the file — `activeHashtagId === tag ? null : tag` (A2/A3, the
  active-hashtag toggle) — is already fully captured as **BR-002** ("Re-selecting the dropdown's
  already-active hashtag clears the filter instead of re-applying it") in both actions' Rule rungs.
  It's a single-condition UI toggle correctly phrased as a Business Rule, not a DEC-worthy gate
  (no branching _what the user sees_ beyond the already-stated BR). Nothing was skipped.

**Verdict: both N/A declarations are correct.** No DEC content is missing from either feature; the
warning is a validator false positive against inert text-diagram/nullish-coalescing syntax that
happens to satisfy a loose ternary-shaped regex. No fix needed to the specs.

**2. F005's US014 claim — illegitimate, ownership leakage.** See the Medium finding above. The
prose/Assumptions mention is fine and should stay; the § 2 Action Index `Codes`-column citation
should be removed. `feature-list.md`'s own exhaustiveness claim ("No US### is unexplained" with a
single owner per code) is the authority here, and F005's own § 5.5 table already agrees with it —
only the § 2 row is out of step.

**3. F002's `cap.promote_candidate` on CAP-02 — not warranted, correctly grouped.** CAP-02's raw
counts (3 US / 3 FR / 1 SCR) exceed the corpus median, but the split test that actually matters —
Trap 3's independence signals (distinct read surface, distinct write surface, distinct workflow)
— does not support separating it: all four of F002's capabilities read from the SAME single
server entry point (`SunKudosPage`'s 5 reads fired together via `Promise.all`, § 5.4 Data Flow),
share the same page/session gate (A0), and none of CAP-02's content performs a DB write (the
"copy a kudo's link" action is a clipboard-only client operation). Splitting CAP-02 into its own
F### would fragment one page's batched read surface without any corresponding change in
write/permission/workflow boundary — exactly the case Trap 3 says to keep merged. The heuristic's
magnitude signal is a false positive here, caused by the feature naturally batching several
UI regions behind one data fetch. Correctly grouped; no split warranted (moot for this run anyway
since F001–F006 are frozen against `docs/_canonical-fcodes.json`).

## Citation spot-checks performed (all resolved correctly)

- F001: `app/auth/callback/route.ts:64-73` (GET handler), `:52-62` (`exchangeCode`), `proxy.ts:1-14`,
  `lib/supabase/proxy.ts:44-91` (`updateSession`) — all match.
- F002: `components/kudos-board/hero-badge-type.ts:11-27` / `:16-27` (`asHeroBadgeType` /
  `heroBadgeLabel`) — matches exactly.
- F004: `supabase/migrations/20260906193000_resolve_heart_value_no_definer.sql:20-39`
  (`resolve_heart_value()` trigger function), `supabase/migrations/20260722100000_kudo_hearts.sql:41-47`
  (self-like INSERT RLS policy), `app/sun-kudos/actions/heart-kudo.ts:53-56,84-87` (auth checks in
  both `heartKudo`/`unheartKudo`) — all match precisely, including the special-day multiplier logic
  and the composite-PK double-heart guard (BR-001/BR-003/BR-004).

## Claims-of-absence verified by grep (beyond the pre-supplied known-correct list)

- `kudos.attachment_count`: only appears as a column default and in `supabase/seed.sql` fixture
  data — zero application write path. Confirms F002's claim.
- `event_settings.special_day_start/end`: only written by test/e2e scripts
  (`e2e/board/hearts-security.spec.ts`, `supabase/tests/hearts-multiplier.sql`) — zero application
  write path. Confirms F002's/F004's shared claim.
- `hero_code` generation: `upper(left(md5(new.id::text), 6))` in
  `supabase/migrations/20260722090000_create_profile_on_signup.sql:21,43` — confirms the
  never-matches-a-department claim underlying F002's D001 and F005's `HighlightFilterDropdown`
  cross-reference note.

## Cross-reference accuracy

- `feature-list.md`'s US → F### traceability table (line 629-636) checked against all five specs'
  claims — consistent except the one F005/US014 leak above.
- PERM007/PERM008 and MODEL004/MODEL005 dual-ownership (F003+F005) confirmed consistent in both
  specs' § 5.5 tables.
- All relative artifact links (`../../system/overview.md`, `../../generated/feature-list.md`, etc.)
  resolve correctly once mapped onto the existing `docs/features/{slug}/` promoted layout (spot
  checked target files exist under `docs/system/` and `docs/generated/`).

## Edge-case sufficiency

All five features' technical-spec § 3.{N+1} Edge cases tables (F001: 8, F002: 9, F003: 5, F004: 5,
F005: 8 rows) and functional-spec § 9 Edge Cases tables (F001: 5, F002: 8, F003: 6, F004: 5, F005:
5 rows) clear the ≥3-for-UI floor comfortably. Error paths (auth expiry mid-render, network
rejection, clipboard unavailable, RLS rejection, race conditions on double-click/double-scroll)
are represented, not just the happy path.

## Done well

- F004 (the one clean PASS) is genuinely the strongest of the five: every BR ties a specific code
  path to a specific enforcement layer (client toggle vs. RLS vs. DB trigger), and the
  special-day-multiplier / un-heart-revokes-original-value logic (BR-003/BR-004) is exactly
  reproduced from the actual trigger SQL, not paraphrased loosely.
- Consistent, disciplined use of the Bin 1/2/3 rule placement across all five specs — no rule
  duplication found anywhere in the batch.
- The § 5.2 Assumptions / § 5.3 Unresolved Questions sections are used as designed (e.g. F005's
  A5 composer-cap assumption, F002's D001/D002 Open Decisions) rather than silently resolved.

## Actions in order

1. Remove `US014` from F005 `technical-spec.md:34`'s § 2 Action Index `Codes` column (Medium —
   internal inconsistency / ownership leakage vs. `feature-list.md` and the spec's own § 5.5).
2. Add a `**File Schema**` table to F003 ALG-001 (`technical-spec.md:331-356`) (Low — format
   compliance, content already present in prose).
3. No action on `func.rule_density` (F001/F002/F005) or `dec_lazy_na` (F002/F005) — both
   adjudicated as pre-existing validator WARNs with no underlying content defect; leave as-is.

## Numbers

- Specs reviewed: 5 features, 10 files.
- Validator pre-check: 0 critical / 19 warnings total corpus-wide (6 within this batch: F001×1,
  F002×3, F003×1, F004×0, F005×2).
- New findings from semantic review: 1 Medium, 1 Low.
- Citations spot-checked: 8, all resolved correctly (0 fabricated/mismatched).

## Still unresolved

- None blocking. The F005 US014 leak (action 1) has no wired validator rule catching it today —
  worth a follow-up note to the checklist owner that `action_unclaimed`'s claim tracking has no
  cross-feature-ownership check comparable to `validate_feature_api_link.py`'s `ROUTE###`
  owner-set check; US/BR/DEC/SM codes get no equivalent guard.

---

# Feature Review — Batch 2 (F006, F007, F008, F009, F010)

Semantic-depth pass only. Deterministic checks already PASS/WARN per validator; not
re-litigated except where the WARN needed a human judgment call (noted explicitly below).

**Update:** re-verified after the coordinator's corpus-wide fix to § 5.5 links and the F007
`.env.local` citation. Re-checked against the real `docs/` tree rather than trusting the fix —
findings below.

## RESOLVED since first pass

### 1. `§ 5.5 Artifact References` broken links — FIXED, verified

Re-pulled the § 5.5 table from all five specs and resolved every link against the real
`docs/system/` and `docs/generated/` contents:

| Spec | System Overview                                                     | Architecture                                      | Feature List                         | generated/* rows | Self-ref (Screens)                  |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ | ---------------- | ----------------------------------- |
| F006 | `../../system/overview.md` ✅                                       | `../../system/architecture.md` ✅                 | `../../generated/feature-list.md` ✅ | ✅ all 6 resolve | `./functional-spec.md#6-screens` ✅ |
| F007 | `../../system/overview.md` ✅                                       | _(no row — pre-existing, unaffected by this fix)_ | `../../generated/feature-list.md` ✅ | ✅ all 6 resolve | `./functional-spec.md#6-screens` ✅ |
| F008 | `../../system/overview.md` ✅                                       | `../../system/architecture.md` ✅                 | `../../generated/feature-list.md` ✅ | ✅ all 6 resolve | `functional-spec.md#6-screens` ✅   |
| F009 | `../../system/overview.md` ✅                                       | `../../system/architecture.md` ✅                 | `../../generated/feature-list.md` ✅ | ✅ all 6 resolve | `functional-spec.md#6-screens` ✅   |
| F010 | `../../system/overview.md` ✅ (was `system-overview.md`, now fixed) | `../../system/architecture.md` ✅                 | `../../generated/feature-list.md` ✅ | ✅ all 6 resolve | `functional-spec.md#6-screens` ✅   |

Confirmed by direct `-f` file-existence check against `docs/system/{overview,architecture}.md`
and all 8 cited `docs/generated/*.md` files — every target exists. Also confirmed no `../../../`
or `../../docs/` remnants remain anywhere in these five specs (`grep` clean).

The only links that do not resolve _right now_ are the F007/F008/F009/F010 self-references to
their own `functional-spec.md` — because `docs/features/` currently holds only F001–F006
(confirmed: `ls docs/features/`), and these four haven't been promoted yet. That's an artifact of
promotion timing, not a link defect: it's a same-directory reference, so once FS.7 promotes each
pair together, it resolves automatically. Matches the coordinator's characterization exactly.

F011 (outside my batch) spot-checked too, for sanity: also fixed, same pattern.

**Status: no longer a finding.** Root-cause template question addressed in "Judgment call" below.

### 2. F007's `.env.local:3` citation — FIXED, verified

`technical-spec.md:90` now reads `NEXT_PUBLIC_LAUNCH_AT` (`.env.example:20` = ...)`, matching
F010's citation. Re-confirmed: `.env.example:20`is exactly`NEXT_PUBLIC_LAUNCH_AT=2026-12-31T18:00:00+07:00`; `.env.local` remains git-ignored
(`.gitignore:38`) and unversioned. Correct fix — the tracked file is now cited by both specs for
the same fact.

**Status: no longer a finding.**

## Still open (re-checked, unaffected by the fix — the fix only touched § 5.5 and the one citation)

### F006_SecretBoxReveal

- **[Medium]** `technical-spec.md` § 5.5 — API Map/Entities/Screens/Behavior Logic/Permissions
  Matrix/User Stories rows still `Reviewed: [ ]` (template-default, never checked off). Codes
  independently verified correct (ROUTE005/006, MODEL001/006/007, SCR006/REG004, PERM009/010/014,
  US021/022 all resolve). **Fix:** check the six boxes.
- **[Low]** `func.rule_density` 2.4 — mechanical average over terse one-liners; not a content gap.

### F007_HomepageOverview

- **[Low, false-positive]** `crosscutting_unlabelled` (now at `technical-spec.md:299`, line
  shifted after the § 5.5 rewrite, same text) — still the Bin 2 "None" sentence naming
  BR-001/BR-002 only to say they're NOT here. Not a real defect.
- **[Low]** "5 days apart" vs. actual 4d23h30m gap — cosmetic rounding, consistent with F010.
- **[Low]** § 5.5 still has no Architecture row (F006/F008/F009/F010 all have one) — outside the
  mandatory 9-artifact subset per the checklist, so a batch-consistency nit, not a defect.

### F008_AwardInformationBrowsing

- **[Medium]** Same unchecked-`Reviewed`-box pattern as F006 (API Map/Entities/Screens/Behavior
  Logic/Permissions Matrix/User Stories). Codes verified correct. **Fix:** check the boxes.
- **[Low, false-positive]** `crosscutting_unlabelled` (now at `technical-spec.md:168`) — same
  "Bin 2 None" pattern as F007.
- **[Low]** `func.rule_density` 2.6 — non-issue on manual read.

### F009_InterfaceLocalization

- **[Medium]** Same unchecked-box pattern. Codes verified correct. **Fix:** check the boxes.
- **[Low, false-positive]** `crosscutting_unlabelled` (`technical-spec.md:214`, unchanged) — this
  line is still inside an HTML comment (`<!-- BR-002, BR-003, BR-006 are Bin 1 ... -->`); the
  validator regex is matching text inside a comment, a validator gap worth reporting upstream,
  not a spec defect.
- **[Low]** `func.rule_density` 2.1 — non-issue.

### F010_PrelaunchCountdownGate

- No open findings. Both prior items (System Overview filename, three-date citations) are now
  correct. Cleanest spec in the batch, confirmed again on this pass.

## Three specific questions — verdict unchanged, re-confirmed

1. **Three-date documentation:** all three values and citations verified byte-exact
   (`event_settings.launch_at` = 2026-07-21 09:00:00+07 @
   `supabase/migrations/20260714080000_event_settings.sql:28`, unread by app code;
   `NEXT_PUBLIC_LAUNCH_AT` = 2026-12-31T18:00:00+07:00, now correctly cited via `.env.example:20`
   in both F007 and F010; hardcoded `EVENT_DATE` = 2026-12-26T18:30:00+07:00 @
   `hero-info-block.tsx:11`; fallback `Date.now() + 8_000` @ `lib/countdown-config.ts:17`). The
   one inconsistency (`.env.local` vs `.env.example`) is now resolved.
2. **F007/F010 consistency:** still consistent with each other; both round the ~4d23.5h gap to
   "5 days apart" (harmless, unchanged by the fix).
3. **F010's zero user stories:** unchanged, still correct — no interactive elements exist on
   `/countdown`, the homepage hand-off fires from a `useEffect` on computed state, never a click.

## Judgment call: is the per-corpus fix sufficient, or does the template need flagging?

**My read: the per-corpus fix is necessary but not sufficient — this should also go to the kit
owner as a template bug.**

The corpus-wide fix correctly unblocks _this_ project: every F00x spec now resolves against the
real `docs/` tree, which is what the FS.7 gate and any future navigation actually need. But the
defect's origin, `$HOME/.claude/skills/rebuild-spec/templates/technical-spec-template.md:554-563`,
is unchanged and lives outside this repo, in the user's global kit. Three things make this worth
surfacing rather than treating as closed:

1. **It's the template, not the data.** Every one of the 8-of-13 affected specs in this corpus
   got the wrong path because they followed the template's own worked example
   (`../../docs/system/system-overview.md`) — F008/F009 copied it verbatim, F007/F011 invented
   their own broken variants nearby it. The fix here edits the _output_; the _generator_ still
   emits the wrong example to whoever reads it next.
2. **Nothing catches it automatically.** I confirmed during the first pass that no `rule_id` in
   `validate_feature_spec.py` checks that a § 5.5 `File` column target actually resolves — this
   class of defect is invisible to CI and to the deterministic gate, so it will not surface again
   as a WARN/FAIL the next time the skill runs; it will just quietly ship broken links until a
   human reviewer happens to click through, as I did here.
3. **Blast radius is every future project, not just this one.** The next team that runs
   `rebuild-spec` from a clean kit checkout inherits the identical broken example paths and wrong
   filename, with no local fix to inherit from this repo's history.

So: treat the corpus fix as closing the finding _for this batch and this corpus_, but separately
flag `technical-spec-template.md:554-563` to the kit owner — replace
`../../docs/system/system-overview.md` / `../../docs/system/architecture.md` /
`../../docs/generated/*.md` with `../../system/overview.md` / `../../system/architecture.md` /
`../../generated/*.md` in the template's own worked example, matching what this corpus now
actually has. I have not touched that file — it's outside this repo and outside my read scope
here — this is a recommendation for the user to action, not something I applied.

## Summary

| FCode | Failed | Open warnings                                                    | Resolved this pass                    |
| ----- | ------ | ---------------------------------------------------------------- | ------------------------------------- |
| F006  | 0      | 2 (unchecked review boxes, rule_density)                         | —                                     |
| F007  | 0      | 3 (crosscutting FP, "5 days" rounding, missing Architecture row) | `.env.local` citation                 |
| F008  | 0      | 3 (unchecked review boxes, crosscutting FP, rule_density)        | § 5.5 links                           |
| F009  | 0      | 3 (unchecked review boxes, crosscutting FP, rule_density)        | § 5.5 links                           |
| F010  | 0      | 0                                                                | § 5.5 links, System Overview filename |

No fabricated or wrong `file:line` source citations found anywhere in this batch (~60 sampled
across 10 files, all resolved to source that supports the claim) — unchanged from the first
pass. `failed: 0` holds; the FS.7 gate is clear.

## Unresolved Questions

- None from my own review, beyond the template-flagging recommendation above, which is a
  decision for the user/kit owner, not an open technical question.

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
