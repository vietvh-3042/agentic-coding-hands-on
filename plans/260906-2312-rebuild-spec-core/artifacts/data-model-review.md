---
passed: false
issues: 3
warnings: 2
---

> **SUPERSEDED — 2026-09-07.** The `passed: false` above is the verdict of the W1.5 round that
> produced this file, kept as the historical record. All three criticals it raised (missing
> `MODEL###` headings, an unjustified `DISC-003`, and a wrong "no read reference" claim on
> `kudos.hashtag_title`) were fixed in `data-model.md` afterwards. The W7a core review
> (`core-review-report.md`, 2026-09-07) re-read `data-model.md` against the full core checklist and
> raised **no finding** against it. This file is not a live blocker.

# Wave 1.5 Review — DataModel Structural Gate

Artifact: `plans/260906-2312-rebuild-spec-core/artifacts/data-model.md` (396 lines, 9 tables + 1 view)
Verified against: live schema (`docker exec supabase_db_mock-aidd-kudo-app psql`), `supabase/migrations/*.sql`, and consuming source under `app/`, `lib/`, `components/`.

## Critical

### C1 — No `MODEL###` entity IDs anywhere in the document

`plans/260906-2312-rebuild-spec-core/artifacts/data-model.md:100,137,177,202,222,243,264,284,308`

Every entity heading is a bare table name (`### PROFILES`, `### KUDOS`, `### KUDO_HEARTS`, …) — none uses the required `MODEL###_EntityName` form (`code-formats.md:21`: `Data Model Entity | MODEL###_EntityName | MODEL001_User | project`). This is not cosmetic: `estimate_artifact_loc.py:25` matches entity headings with `MODEL_HEADING_RE = re.compile(r"^###\s+MODEL\d{3}")`, `artifact-sharding.md:104` requires "entity `### MODEL###` blocks", and `_id_schemes_lib.py`'s `SIBLING_MATRIX["MODEL"]` names `feature-list.md`/`api-contracts.md` as consumers that cross-reference `Backed by MODEL###`. With zero `MODEL###` headings present, the automated heading count resolves to 0, the ID-contiguity script has nothing to validate, and every downstream artifact (feature-list, api-contracts, screen-spec) that needs to write "Backed by MODEL00N" has no valid target.
**Fix:** rename every entity heading to `### MODEL001_PROFILES`, `### MODEL002_KUDOS`, … `### MODEL009_EVENT_SETTINGS` (contiguous 001–009, one per entity in document order); leave the view's own heading un-prefixed per its own "not a table" callout, consistent with the document's existing treatment.

### C2 — DISC-003 (`profiles.role`) is not a real discriminator — the code never reads it

`plans/260906-2312-rebuild-spec-core/artifacts/data-model.md:115,133`

The doc claims `role` "Gates the 'Admin Dashboard' account-menu item" and that "`admin` sees an extra menu item, `user` does not" (line 133). Verified false: `components/homepage/user-menu.tsx:90-99` renders the "Admin Dashboard" `<li>` unconditionally, with no `role` check, no prop, and no server-side gate. An exhaustive grep of `app/`, `lib/`, `components/` for any code-level use of `profiles.role` (`.role ===`, conditional on `role`, anything beyond the DB column and its CHECK constraint) returns zero hits outside `database.types.ts`. `role` exists purely as a schema column with a CHECK constraint; it drives no branching anywhere in this codebase today. Per `code-formats.md`'s DISC-### rule ("Does NOT qualify: … fields used only for display labels with no behavioral branching" — here there isn't even a display use) and this gate's explicit critical-severity instruction on unverifiable confident claims, DISC-003 must not stand as written.
**Fix:** either drop DISC-003 entirely (role has zero behavioral consumers) and move `role` to a plain attribute note ("schema-only placeholder, gates nothing yet — no code path reads it"), or if the "Admin Dashboard" gating is genuinely intended future behavior, mark it `[UNVERIFIED — no consuming code found]` rather than asserting it as current behavior.

### C3 — `kudos.hashtag_title` "no read reference found" is factually wrong

`plans/260906-2312-rebuild-spec-core/artifacts/data-model.md:146`

The doc states: "`[UNVERIFIED]` whether any current UI path still reads this column (no read reference found in `lib/kudos/*` or `components/kudos*` during this pass)." This is disproven by the very directory it claims to have searched: `lib/kudos/board-query-helpers.ts:34` selects `hashtag_title` in `KUDO_SELECT` (the shared query used by both the feed, A1, and the Highlight carousel, A2), and line 131 maps it into `category`, which `lib/kudos/types.ts:38` documents as "the free-text category chip, e.g. 'YOUTH IDOL'" — an actively rendered field on every kudo card. The "superseded by hashtags/kudo_hashtags below" framing (line 149) is also misleading in this light: `hashtag_title` is not dead — it drives the single category chip, a distinct concern from the structured tags (which drive filter chips). (The "no write-site found" half of the same finding, and the identical claim for `attachment_count`, were independently re-verified here and ARE correct — confirmed no write or read site for either column beyond `database.types.ts`.)
**Fix:** correct line 146 to state plainly that `hashtag_title` is actively read (cite `board-query-helpers.ts:34,131`) and drives the category-chip UI; keep `attachment_count`'s `[UNVERIFIED]` as-is (confirmed accurate).

## Warnings

### W1 — Duplicate "Discriminator Fields" section for KUDOS

`plans/260906-2312-rebuild-spec-core/artifacts/data-model.md:167,173`

KUDOS carries two consecutive `**Discriminator Fields**:` labels (one with a placeholder `—/—/—/—` explanatory row at line 171, one with the actual `None.` fallback at line 173). The template (`data-model-template.md:48,58`) expects exactly one such section per entity, either a populated table or the `None.` fallback — not both. Content is not wrong, but the duplicate heading is a structural deviation an automated section-parser would trip on.
**Fix:** collapse to one `**Discriminator Fields**: None.` line, moving the explanatory prose about the deliberate boolean exclusion into the entity's `**Description**` or a footnote.

### W2 — Relationship count off by one in Summary

`plans/260906-2312-rebuild-spec-core/artifacts/data-model.md:394`

"Total Relationships: 11 FK relationships" — the itemized list on the same line totals 10 (PROFILES→KUDOS ×2 + 8 singles), and the live schema confirms exactly 10 FK constraints (`profiles_id_fkey`, `kudos_sender_id_fkey`, `kudos_receiver_id_fkey`, `kudo_hearts_kudo_id_fkey`, `kudo_hearts_user_id_fkey`, `kudo_hashtags_kudo_id_fkey`, `kudo_hashtags_hashtag_id_fkey`, `user_icon_unlocks_user_id_fkey`, `user_icon_unlocks_icon_id_fkey`, `notifications_user_id_fkey`).
**Fix:** change "11" to "10".

## Confirmed Correct (spot-checked, no drift)

- All 9 table schemas (columns, types, nullability, defaults, PKs, FKs, CHECKs, indexes) match `\d public.<table>` exactly.
- `profile_kudo_stats` view definition and `security_invoker=on` — confirmed via `pg_get_viewdef`.
- Grants post-`20260906195000_table_grants_hardening.sql`: doc's RLS/grant narrative (e.g. `notifications` has no `anon` grant at all, `event_settings`/`profiles`/`hashtags`/`secret_box_icons`/`user_icon_unlocks` are anon+authenticated SELECT-only) matches live `information_schema.role_table_grants` for all six hardened tables.
- `resolve_heart_value()` confirmed NOT `security definer` (`prosecdef=f`); `sync_kudo_hearts_count()` and `open_secret_box()` confirmed `security definer` (`prosecdef=t`); `open_secret_box()` confirmed zero input parameters.
- DISC-001 (`hero_badge`, 4 values) and DISC-002 (`language`, vi/en) are genuine, code-verified discriminators — `components/kudos-board/hero-badge-type.ts` mirrors the exact 4-value CHECK set with distinct `heroBadgeLabel()` branching; `language-selector.tsx`/`i18n-provider.tsx` genuinely branch on locale.
- `is_spam`, `is_anonymous`, `read_at` correctly excluded from DISC-### (booleans / state-transition, per this run's explicit rule).
- `event_settings.launch_at` "possibly unread at runtime" — confirmed correct: only `special_day_start`/`special_day_end` are ever selected from `event_settings` in app code; `launch_at` has zero read sites, and `NEXT_PUBLIC_LAUNCH_AT` is the live countdown source.
- Seeded row counts (profiles 15, kudos 44, kudo_hearts 48, kudo_hashtags 105, hashtags 13, secret_box_icons 6, notifications 4, user_icon_unlocks 1, event_settings 1) — all match live `count(*)` exactly.
- Mermaid ERD — balanced brackets/braces/quotes, v11-safe.

## Verdict

**passed: false** — 3 critical, 2 warnings. Wave 2 must not start until C1–C3 are fixed and re-reviewed.
