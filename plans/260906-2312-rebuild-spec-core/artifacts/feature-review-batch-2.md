---
batch: 2
fcodes: [F006, F007, F008, F009, F010]
failed: 0
warnings: 11
missing: 0
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
