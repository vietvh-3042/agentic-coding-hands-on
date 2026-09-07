---
passed: true
issues: 0
warnings: 0
---

# User Stories Review — Wave 4.5 Fast Quality Gate (re-verification)

**Scope**: `plans/260906-2312-rebuild-spec-core/artifacts/user-stories.md` (1030 lines, US001–US024, post-renumber). Five scoped checks only, per `verification-checklist-quality-gates.md` § UserStories (W4.5). This is a re-run after the prior Check-1 critical on the combined pan+zoom story was fixed.

## What changed since the last pass

- The single `US019_PanZoomSpotlightBoard` story was split into `US019_ZoomSpotlightBoard` (line 778) and `US020_PanSpotlightBoard` (line 816). Each now carries its own single-verb goal, its own file:line citations, and Test Scenarios scoped to only its own behavior (zoom-only happy/error cases for US019; pan-only happy/error cases for US020, including the "ignored at 1x" boundary the old merged story never tested).
- Everything at US020 and above in the old numbering shifted by one (old US020→US021 OpenSecretBoxDialog, old US021→US022 DrawFromSecretBox, old US022→US023 ViewKudoAttachedImage, old US023→US024 LoadMoreKudosInFeed). Total is now 24 (US001–US024).
- Interaction Inventory rows 57–58 were reordered and re-pointed: `SpotlightZoomControls` → US019, `SpotlightBoard drag-to-pan` → US020 (previously both → the old combined US019), and inventory order now matches body order.
- User Story Index, Screen→US Map (SCR006, REG002, REG003, REG004 rows), and Cross-Reference tallies (total, by-type, by-priority, merge-count sentence, uniqueness line) were all updated to match.

## Passed Checks

- ✓ check_1_single_intent — the prior US019 violation is resolved: US019 ("I want to zoom the Spotlight name cloud") and US020 ("I want to drag the zoomed-in Spotlight name cloud") each now describe exactly one user action. Zoom's in/out/reset trio stays one story (same popover control, same element, analogous to the carousel's prev/next/disabled-state bundling elsewhere in this doc — not a second intent). Re-scanned all 24 stories for "and"/"as well as" joining distinct verbs or CRUD-listing goals; none found elsewhere.
- ✓ check_2_human_actor — all 24 stories, including the two new ones, name a human actor ("signed-in user" for both US019 and US020); none use "system"/"app"/"platform"
- ✓ check_3_outcome_present — all 24 stories carry a "so that …" clause; US019 ("so that I can read the names in a crowded area") and US020 ("so that I can bring an off-screen part of it into view") both have one
- ✓ check_4_overly_broad_scope — no story uses "manage"/"administer"/"handle" as a bare catch-all verb; the split didn't introduce one either
- ✓ check_5_us_code_uniqueness — US001–US024 contiguous, no gaps, no duplicates. Verified against: (a) the 24 section headers (lines 112, 148, 189, 226, 262, 298, 333, 369, 405, 441, 479, 517, 554, 591, 627, 663, 699, 742, 778, 816, 854, 890, 928, 964), (b) the User Story Index table, (c) the Cross-Reference summary line

## Stale-reference spot-check (renumbering correctness)

Traced every `Dependencies:` cross-reference that touches the shifted range to confirm it points at the right _new_ code, not the old one:

- US019 (Zoom): no dependency — correct, it's now the independent one
- US020 (Pan) → depends on "US019 (panning is inert until the user has zoomed past 1x)" — correct, points at the new Zoom story
- US021 (OpenSecretBoxDialog, was US020) → depends on "US022 (the draw action lives inside this dialog)" — correct, points at the new DrawFromSecretBox code, not the old US021
- US022 (DrawFromSecretBox, was US021) → depends on "US021 (dialog must be open)" — correct, points at the new OpenSecretBoxDialog code
- US024 (LoadMoreKudosInFeed, was US023) → depends on "US013 (shares the same hashtag filter state)" — US013 is below the shifted range, unaffected, correct as-is
- Screen→US Map rows for SCR006, REG002 (`US018, US019, US020`), REG003 (`US013, US016, US017, US023, US024`), REG004 (`US021, US022`) all match the new codes
- Cross-Reference by-priority tallies recompute correctly under the new numbering: P1 (10) = US004,005,006,007,013,015,017,021,022,024; P2 (10, up from 9 — the split added one P2 story) = US003,008,009,012,014,016,018,019,020,023

No stale references to pre-renumber codes found anywhere in the document.

## Critical / High / Medium / Low

None.

## Judgment Calls (unchanged reasoning, codes updated where renumbered)

**1. Header/footer/CTA/promo nav merges (US005, US006, US007) under the web merge exception — PASS.** Unaffected by the renumber (all below the shifted range). Same actor, same destination route counted as "same endpoint," identical no-payload data flow. US008's in-page anchor scroll correctly stays unmerged. No objection.

**2. "Open modal" vs. "the mutation inside it" kept separate — PASS.** Now US010/US011 (unaffected) and **US021/US022** (renumbered from US020/US021). The endpoint/data-flow discriminator is applied the same way post-renumber: US021 (open, `N/A`/informational read) vs. US022 (`openSecretBox()` ROUTE005 write) still fail the merge test on purpose. No objection.

**3. Heart toggle as one `destructive-action` US (US017) — PASS.** Unaffected by the renumber. Single control, state-driven backend branch, not two user-chosen verbs — same reasoning as before, and now also the model the US019/US020 split correctly did NOT follow (zoom-popover clicks and drag gestures are two separate controls, unlike the one heart button).

## Edge Cases Turned Up

- US019's zoom-in/out/reset bundling and US020's pan-only scope leave a clean seam: US020's Dependencies note ("panning is inert until the user has zoomed past 1x") captures the real coupling without re-merging the two stories. This is the right shape — coupling expressed as a dependency, not as a shared goal sentence.
- The Interaction Inventory's own "35 real interactions" tally in Cross-Reference does not match a literal row count of the table (38 data rows, unchanged before and after this fix) — this discrepancy predates the split and is a full-document accuracy question, out of scope for the W4.5 five-item gate (full artifact review is W7a's job per the checklist). Flagging only as a heads-up for W7a, not counted as a W4.5 finding.

## Done Well

- The fix is minimal and traceable: both new stories carry an explicit "split from the former combined pan+zoom story at the W4.5 gate" note in Technical Notes, so the history isn't lost.
- Test Scenarios were rewritten per-story rather than just copy-pasted and trimmed — US020 gained a genuinely new error case ("pointer-down ignored at 1x") that the old merged story never had.

## Actions In Order

None — gate holds.

## Numbers

- Checks run: 5/5, all pass
- Critical issues: 0
- Warnings: 0
- Stories reviewed: 24/24

## Still Unresolved

None.
