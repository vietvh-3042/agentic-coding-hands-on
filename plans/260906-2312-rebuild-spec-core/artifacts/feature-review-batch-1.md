---
batch: 1
fcodes: [F001, F002, F003, F004, F005]
failed: 0
warnings: 0
missing: 0
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
