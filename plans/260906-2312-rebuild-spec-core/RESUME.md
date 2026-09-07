# Session Resume — 2026-09-07

Pick up here. Everything below is verified state, not intention.

## TL;DR

Batch A (the kudos data layer) is **delivered, tested and reviewed**. All 13 plan folders have
blueprints. The only work left mid-flight is the **rebuild-spec Core doc pass**: all 11 core
artifacts are now drafted and every gate through W5.6 is green, but nothing has been promoted to
`docs/` yet. W7a is the next gate.

Two critical security holes were found and fixed on 2026-09-06. Neither was in the plan; both were
found by re-running things rather than trusting a report. The 2026-09-07 doc pass repeated the
lesson twice over — see "Two traps that fired this session", both of which passed their own
validators while being wrong.

## How to resume the doc pass (the only in-flight work)

Working dir: `plans/260906-2312-rebuild-spec-core/artifacts/`

### Progress as of 2026-09-07 ~10:00

| Wave                                  | State                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| W0–W3 (scout → permissions)           | ✅ done — 11 core artifacts drafted, W1.1/W1.5/W2a.1 gates passed    |
| W4 user-stories                       | ✅ **US001–US024**, contiguity PASS                                  |
| W4.5 user-stories gate                | ✅ PASS 0/0 (failed once on US019, fixed — see below)                |
| W5 feature-list                       | ✅ **F001–F013**, contiguity PASS, renumber verified no-op           |
| W5 canonical-fcode post-step          | ✅ `_canonical-fcodes.json` + 13 `features/{slug}/.pending`          |
| W5.5 existence gate                   | ✅ PASS 0/0                                                          |
| W5.6 feature-list gate                | ✅ PASS 0/0 (failed once on 2 JSON criticals, fixed — see below)     |
| W7a core review                       | ✅ PASS after one fix round (3 crit + 2 warn + 1 sugg, all cleared)  |
| W7-merge                              | ✅ `review-report.md` — `failed: 0, warnings: 0, result: PASS`       |
| W8 fix wave                           | ✅ all findings applied, every validator re-run green                |
| W9 promote (`--scope core`)           | ✅ **12 files promoted**, exit 0                                     |
| Feature-specs pass (FS.1–FS.7)        | ✅ **13 features promoted**, 26 files. See its own section below     |
| **Flows pass (`--flows`, FL.1–FL.5)** | **← NEXT.** Prerequisites satisfied; feature specs now all 13, not 6 |

**W8 queue — all cleared.** For the record, what it contained:

- `permissions.md` by-type tally summed to 16 against a stated 15. The tally lived in two places;
  `permissions-matrix.md` already had the correct `data-permission: 10`.
- `permissions.md`'s Dev Appendix duplicated `permissions-matrix.md` — also a _checklist critical_
  (`verification-checklist-core-artifacts.md` forbids PERM### codes and raw matrix tables in the
  curated view). `permissions.md` is now 65 lines of prose, zero PERM codes; the fuller 7-query
  live-verification block was folded into the matrix, which only had 2 of them.
- `user-stories.md` claimed "35 real interactions"; the Inventory has 38 (the "8 inert" was right).
- **W7a C1 — the one that mattered.** `architecture.md` and `system-overview.md` still described the
  six-table TRUNCATE hole as "a real, currently-live gap … the most significant single finding of
  this pass", while `permissions.md`/`permissions-matrix.md` in the same review set correctly called
  it closed. Both stopped citing migrations at `20260906193500`, before the fix. Verified against the
  live database before editing — `information_schema.role_table_grants` shows no
  TRUNCATE/REFERENCES/TRIGGER for either role on any of the ten relations. Rewritten as
  `[RESOLVED 2026-09-06, re-verified live 2026-09-07]` with the grant shape quoted.
- W7a C2 — `screen-flow.md` held a raw `{POPULATED_BY_W6}` token; wrapped as an HTML comment, since
  the FS.1 pass that fills it is not part of a core run.
- W7a C3 / W1 — `route-list.md`'s `Owner F###` and `screen-list.md`'s Regions `Owner` columns were
  still `—` behind a "not available at this Wave" caveat that Wave 5.6 had invalidated. Back-filled
  programmatically from `_canonical-fcodes.json`, not retyped from prose.
- W7a W2 — F005/F006 typed `mixed` with zero BL###. **Not retyped** — `type` is frozen for F001–F006.
  Each carries a self-flagged note instead, and the reviewer ruled that closed.
- W7a S1 — `data-model-review.md` still read `passed: false`. **Frontmatter deliberately not flipped**
  (that would fabricate a gate result); it carries a dated SUPERSEDED banner instead.
- **Two heading-format defects the LLM review missed and the scripts caught.**
  `validate_behavior_logic.py` flagged `## BL001: Name` against the mandated `BL###_NameSlug` —
  "consumers matching `BL###_` will skip this section". All 4 renamed. Asking the reviewer whether
  the same applied to `permissions-matrix.md` surfaced the identical defect in all 15 `## PERM###:`
  headings; renamed too. **There is no `validate_permissions.py`**, so that artifact has no
  deterministic gate for its format rules — a kit-level gap worth filing.

### Two traps that fired this session — both silent, both recovered

**1. `renumber_artifact_ids.py` permuted every F### code.** It builds its map from _first appearance
in prose_, not from the Feature Hierarchy table. `feature-list.md`'s preamble opened with
"**F001–F006 are frozen**", so `F006` was the second code the scanner saw → `F006→F002`, `F002→F003`,
`F003→F006`, and so on across all 13. The template's own boilerplate (`e.g., F001_Auth,
F002_UserProfile`) contributed too. **`validate_id_contiguity.py` reported PASS throughout** — the set
stayed contiguous, only the identities moved. Had it promoted, the six `docs/features/` folders would
have been silently rebound to the wrong features.
Recovered by inverting the permutation (feature _names_ were untouched, so the map was
reconstructable). The preamble is now free of `F###` tokens, there is a warning blockquote above the
table, and renumber has been re-run against a saved copy and verified byte-identical.
→ **Never re-run renumber on an artifact whose codes are frozen without diffing the result.**
Note `renumber-map-<artifact>.json` is written next to the artifact and is `{}` on a true no-op —
that file is the cheap way to check.

**2. Slug derivation would have orphaned a promoted feature folder.** The Slug Grammar turns
`Hashtag Taxonomy & Filtering` into `F005_HashtagTaxonomyAndFiltering` (`&` → `And`), but the promoted
folder is `docs/features/F005_HashtagTaxonomy/`. The canonical post-step now **pins all six
already-promoted slugs from `docs/_canonical-fcodes.json`** and derives only F007 upward. A
"Frozen-slug warning" subsection in `feature-list.md` records this.

### Gate failures this session (both fixed, kept for the record)

- **W4.5** — US019 bundled pan and zoom: two separate controls (`spotlight-zoom-controls.tsx:36-68`
  vs the drag handler on `spotlight-board.tsx:87-93`), and its test scenarios only exercised zoom.
  Split into US019 (zoom) / US020 (pan); everything downstream shifted by one.
  _Side effect worth knowing:_ renumber rewrites **every** `US###` token including ones inside prose
  range labels — `(US001–US024, contiguous…)` silently became `US001–US020`. Hand-written range
  labels in a coded artifact are unsafe across a renumber.
- **W5.6** — 2 criticals, both in `_canonical-fcodes.json`, both from the post-step parser rather
  than the researcher's markdown: it read codes out of a bullet's _explanatory prose_
  (`- — (none owned directly; BL002/BL004 …)` yielded a phantom `bl` array) and it failed to bound
  the last feature's body, so F013 swallowed the Cross-Reference section's PERM codes. The parser now
  bounds each body at the next `### F###` or `## `, strips parenthesised asides in place, then cuts
  trailing commentary at `—` / `: `. Script kept at
  `<scratchpad>/fcode_poststep.py` — re-run it if `feature-list.md` changes.
  _Watch the fix, not just the bug:_ an earlier version cut at the first `(`, which silently dropped
  F002's `/REG002` and `/REG003` refs because a `(bare shell)` aside sat in front of them.

### W9 promote — DONE, and the old open question is answered

`promote_drafts.py` was **never broken**. Last session it ran with no `--scope`, defaulted to `all`,
hunted the `artifacts/features/F*/` layout this repo never adopted, and returned `promoted 0 file(s)`
exit 2. The correct core invocation, now run:

```
python3 $HOME/.claude/skills/rebuild-spec/scripts/promote_drafts.py \
  --plan-dir plans/260906-2312-rebuild-spec-core --mode full --scope core
```

→ `promoted 12 file(s)`, exit 0. Two warnings (`crud-matrix.md`, `db-objects.md` not found) are
expected — neither is generated in a core run. `architecture.md` and `permissions.md` were
overwritten as intended: both were forward-drafted before implementation and the code-derived
versions supersede them. A pre-promote copy of the whole `docs/` tree was taken first, and a diff
against it confirms the promote **only added files — nothing was deleted or lost**.

Promoted tree: `docs/system/{overview,architecture,permissions}.md` +
`docs/generated/{entities,route-list,screen-list,screen-flow,behavior-logic,permissions-matrix,user-stories,feature-list,api-map}.md`.
`data-model.md` → `entities.md` on promote, as documented.

### Two states that look wrong but are correct — do NOT "fix" them

1. **`docs/_canonical-fcodes.json` still lists 6 features while `docs/generated/feature-list.md`
   declares 13.** This is right. `--scope core` deliberately excludes the features scope, and
   `docs/features/` holds spec folders for F001–F006 only. Promoting a 13-feature registry now would
   make it claim seven folders that do not exist. The 13-feature registry lives at
   `plans/260906-2312-rebuild-spec-core/artifacts/_canonical-fcodes.json`, which is what the FS.1
   pass actually reads; it reaches `docs/` when the features scope promotes.
2. **`check_promotion_gate.py` returns FAIL with 26 criticals.** All 26 are `.pending` markers under
   `artifacts/features/*/`. That script gates a FULL promotion including feature specs — it is not
   the gate for `--scope core`, and its failure here says only that the `--feature-specs` pass has
   not run yet.

`docs/features/.stale` was created by the promote, reading
"source changed — run `/tkm:rebuild-spec --feature-specs` to refresh". F001–F006's specs were written
against the older artifacts and F007–F013 have none, so that pass is genuinely owed.

### Feature-specs pass — DONE 2026-09-07

All 13 features have `technical-spec.md` + `functional-spec.md` in `docs/features/`, plus a
per-feature `README.md` and a `confidence-report_technical-spec.md` sidecar. `docs/features/.stale`
is cleared and `docs/_canonical-fcodes.json` now carries all 13 (it was left at 6 during the core
promote, correctly, because only 6 spec folders existed then).

Gate results: FS.2 validators **0 critical / 13 of 13 specs PASS** (19 non-blocking warnings);
FS.5 review **failed 0 / missing 0** across three batches, both non-clean batches re-verified after
their fixes by re-reading source rather than trusting the fix report; FS.7 pre-flight PASS.
`check_promotion_gate.py` is now PASS too — its earlier 26 criticals were purely `.pending` markers.

**The `--force` decision, recorded.** `docs/features/F002`–`F006` carried `authored_by: takumi,
status: draft` — forward-drafted during implementation — and the promoter deliberately refuses to
clobber those. The user chose to overwrite: the rebuild-spec versions are code-derived and carry
3–4× the `file:line` citation density (F002: 123 vs 31; F006: 35 vs 12), and the core pass had
already set the same precedent for `architecture.md` / `permissions.md`. A pre-promote copy of
`docs/` was taken and diffed afterwards — the only deletion was `features/.stale`, which is intended.

### Three defects this pass surfaced in the CODE (not the docs)

Each was found by a researcher reading source, and each is recorded in the relevant spec rather than
fixed — this was a documentation pass:

1. **The department filter can never match.** It compares against `hero_code`, generated as
   `upper(left(md5(id),6))`, against `"CEVC1"`-shaped values (F002).
2. **`event_settings.special_day_start` / `special_day_end` have no write path** — no RLS policy,
   no admin screen (F004).
3. **Nothing increments `profiles.boxes_unopened`** beyond the one-time seed, so the secret-box
   reward mechanic has no supply (F006).

Plus a recurring smell worth naming: **three separate comments contradict their own code** — the
`kudo_hearts` migration claims the Server Action rejects self-likes (it does not; RLS alone does),
`/award-info` says it has no auth guard (PERM001 gates it), and `notifications` seed rows imply a
kudo-received trigger that does not exist.

### A kit-level bug to report upstream

`$HOME/.claude/skills/rebuild-spec/templates/technical-spec-template.md:554-563` ships broken example
paths for § 5.5 Artifact References: `../../docs/system/...` doubles the `docs/` segment (from
`docs/features/F0XX/`, `../../` is already `docs/`), and it cites `system-overview.md`, which does not
exist — the promoted file is `overview.md`. 8 of 13 specs inherited it verbatim, including one
`../../../docs/` triple-dot variant. Fixed across this corpus and every link verified to resolve
against the real tree, but **the template itself is still broken**, no validator checks § 5.5 link
targets, and the next project to run this skill will regenerate the same defect silently. The FS.5
batch-2 reviewer's written recommendation is to fix the generator, not just the output.

### Next: the flows pass

Both prerequisites are now satisfied — `docs/generated/entities.md` exists (promoted this run) and
all six `docs/features/*/technical-spec.md` are present. Run `--flows` (FL.1–FL.5).

### Pipeline gotchas already discovered — do not rediscover these

- **THE TOOLCHAIN IS NOT ON THE DEFAULT PATH after a session resume.** The default `node` is v18 and
  `pnpm` is absent, but this project needs Node 22+ (`.nvmrc` = 22). Every shell that runs a node or
  pnpm command must first do:
  `export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"`
  → Node 22.23.2 + pnpm 10.28.0. **Pass this to every subagent prompt**, or they hit
  `pnpm: command not found` and may silently mis-diagnose it as a broken script.

- **The kit venv python does not exist.** Use plain `python3`; the skill documents this fallback.
- **`graphify` is unavailable and its install fails** → the pass runs "vanilla". No `graph.json`, so
  the cheap machine-derived scout is not available; W0 is the full LLM scan.
- **The stack detector is WRONG for this repo.** It recommends `oracle-plsql` at **0.96** confidence
  because `supabase/**/*.sql` uses PL/pgSQL `do $$ … end $$` blocks. Always pin:
  `python3 …/detect_stack_profile.py --root . --profile web-js-ts`
  Left unpinned it fires Delphi/Oracle extractors and produces confidently wrong docs.
- **`validate_route_list.py`** takes `--plan-dir` OR `--route-list-file`, never both.
- **`promote_drafts.py` targets an `artifacts/features/F*/` layout this repo never adopted.** It
  returned `promoted 0 file(s)` with exit 2. F001 was originally promoted by mirroring
  `spec/<slug>/` into `docs/features/`, which is what I did for F002–F006. Decide deliberately
  whether to fix the invocation or continue mirroring — do NOT hand-author a doc subset and call the
  gate satisfied.

### Promote warning

W9 will overwrite `docs/system/architecture.md` and `docs/system/permissions.md`. That is intended —
those were **forward-drafted before implementation**, and the code-derived versions supersede them.
The W1 researcher already found the old architecture doc contained a false claim (that
`app/sun-kudos/page.tsx` has no independent `getUser()` check — it does).

## What was delivered this session (complete, do not redo)

**Batch A — `plans/260710-1511-sun-kudos-live-board/`, all 10 phases delivered:**
security hardening → toolchain + authenticated E2E harness → 4 schema migrations → seed data →
shared hashtag module → board reads → authoring + Addlink Box → hearts → secret-box reveal → green gate.

**Final verified gate state:**

```
pnpm validate                       exit 0   (format:check + lint + typecheck + build)
e2e chromium-authed                 41/41    from a clean `npx supabase db reset`
e2e chromium (Docker-free)          11/11
supabase/tests/*.sql (6 suites)     all exit 0, order-independent
```

Seed: 15 profiles · 44 kudos · 48 hearts · 105 kudo_hashtags · 13 hashtags · 6 icons.

**Two critical security fixes:**

1. **Privilege escalation** — any authenticated user could set their own `profiles.role='admin'`.
   RLS constrained the row, not the column. Fixed with column-scoped GRANTs (phase 01).
2. **Board wipe** — `event_settings`, `kudos`, `kudo_hearts`, `notifications`, `secret_box_icons`,
   `user_icon_unlocks` still carried the default ACL granting **TRUNCATE + DELETE** to `anon` AND
   `authenticated`. **RLS does not cover TRUNCATE.** Proven exploitable (truncated `kudo_hearts` to 0
   rows as an ordinary member in a rolled-back transaction), then fixed by
   `20260906195000_table_grants_hardening.sql` with a **blanket** assertion enumerating `pg_tables`
   dynamically. This survived phase 01, phase 03 and a full adversarial review **because every check
   had been scoped to "new tables"** — the six inherited tables fell through every framing.

**One P0 product fix:** sign-out was a no-op. `signOut` existed only as an i18n key; the button
pushed to `/login` and `proxy.ts` bounced the still-authenticated user back. There was no way to end
a session. Fixed in `components/homepage/user-menu.tsx`.

**Inspection Critical, fixed:** every kudo message rendered literal `<p>`/`</p>` on screen — stored
wrapped, rendered as plain React text, no renderer anywhere in the repo. 37/37 e2e was green twice
over this, because Playwright's `getByText` matches substrings. Fixed with plain-text storage +
`lib/kudos/render-kudo-message.tsx` (React elements only, `http:`/`https:` schemes only, never
`dangerouslySetInnerHTML`), plus a backfill migration and an XSS regression test.

## Open decisions — yours, deliberately not made for you

1. **Three competing event dates are live simultaneously.** Recorded in
   `plans/260708-1519-countdown-prelaunch-page/plan.md` (Addendum).
   `event_settings.launch_at` = 2026-07-21 (read by nothing) · `NEXT_PUBLIC_LAUNCH_AT` = 2026-12-31
   (used by `/countdown`) · hardcoded `EVENT_DATE` = 2026-12-26 (used by `/about`).
   **`/countdown` and `/about` display dates five days apart right now.**
   Also `lib/countdown-config.ts:17` falls back to `Date.now() + 8_000` — a missing env var yields a
   countdown that expires 8 seconds after load. Suggested fix: make `event_settings.launch_at` the
   single source (RLS read-only, tamper-resistant), retire the other two. That changes two shipped
   screens, so it needs sign-off.
2. **`profiles.role` is declared but read nowhere**, and the Admin Dashboard menu item renders for
   **every** user (inert). The server-side gate is Batch B phase 06 — planned, not built.
3. **Category-text filtering** (MoMorph spec row D.4) deliberately unimplemented; element rendered
   inert. Should it exist at all, given the taxonomy filter covers hashtag filtering?
4. **Badge artwork missing** — `public/profile/` does not exist; `secret_box_icons.image_url` and the
   demo admin's `avatar_url` both point into it. Secret-box badges use a name-text fallback.
5. **Commit `9f9007b`** was created by an agent even though you said you'd handle git yourself. It is
   scoped to only the 2 security files, and your 230 staged files were verified restored
   byte-for-byte — but keep/amend/reset is your call.

## Other carried-forward open items

- `<Database>` generic never threaded through `lib/supabase/{client,server,proxy}.ts` (phase 02 gap).
- Legacy free-text `kudos.hashtags` column deliberately retained alongside the join table.
- Intermittent cold-start flake, `board-reads.spec.ts` TC 9dfda316 (~1-in-4 to 1-in-6, a Next.js
  crash page). Root cause never captured. Not reproducible in isolation.
- `NotificationMenu` is presentational only — the `notifications` table is live and RLS-protected.
- Playwright `workers` pinned to **1**: the authed specs share one mutable database. 37/37 serially,
  intermittently red in parallel on the same commit.
- Phase 06 (board reads) was **not** test-first — a recorded policy deviation, see that plan's
  `clarifications.md`. Every other phase captured a real RED.

## Batch B — blueprinted, not started

`plans/260906-1903-profile-and-menus/` (7 phases) + `plans/260713-1552-dropdown-department/` (3).
`/profile` does not exist; it is the largest unbuilt screen (28 spec rows, 30 test cases).
Batch B phase 02 is **blocked** on hero-tier thresholds (Q3b in its `clarifications.md`).
Hard dependency: Batch B's admin gate needs phase 01's hardening, which is now done.

## Git state at save

```
HEAD      9f9007b  fix: revoke default-ACL grants on six unhardened tables
staged    230 files      unstaged 2      untracked 60
```

Untracked includes all the rebuild-spec drafts and the new plan folders. Nothing is lost; nothing
except `9f9007b` is committed.

## 2026-09-07 resume — collateral found and cleared

The security-fix agent's staging dance on 2026-09-06 (unstage 230 → commit `9f9007b` → re-stage)
**resurrected the 4 mock-data modules** that phases 06/07 had deleted, restoring them from the git
index. Verified before removing: **nothing imported them** anywhere in `app/`, `components/`, `lib/`
or `e2e/`, and every piece of phase 06/07/09's real work was intact (`lib/kudos/*`,
`heart-button.tsx`, `secret-box-reveal-panel.tsx`, `addlink-box.tsx`, all 4 Server Actions).
So it was 4 dead files, not lost work. Deleted from disk and from the index.

Post-cleanup state re-verified from a clean `npx supabase db reset`:

```
pnpm validate                    exit 0
e2e chromium-authed              41/41
e2e chromium (Docker-free)       11/11
supabase/tests/*.sql (6 suites)  all exit 0
```

**Lesson worth keeping:** an agent that manipulates the shared git index to scope its own commit can
silently revert deletions made by other phases. If that manoeuvre happens again, diff the working
tree against the expected file set afterwards — a green test suite did NOT catch this, because the
resurrected files were unreferenced.
