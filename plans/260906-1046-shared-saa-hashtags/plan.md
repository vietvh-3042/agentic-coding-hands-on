# Shared SAA Hashtags — taxonomy + both dropdowns

**Status:** planned (implementation owned by Batch A)
**Screens:** `JWpsISMAaM` (Dropdown Hashtag filter) · `p9zO-c4a4x` (Dropdown list hashtag)
**fileKey:** `9ypp4enmFmdK3YAFJLIu6C`
**Feature:** F005 — Hashtag Taxonomy & Filtering
**Test policy:** `visual-contract` for the two dropdown screens (**both have ZERO test cases in
MoMorph** — none were fabricated). The filtering _behaviour_ they drive is covered `e2e-red-first`
by Batch A phase 06.

## Why this folder has no phase files

One hashtag list feeds both dropdowns and the board filter. The taxonomy is a schema change (Batch A
phase 03), the shared reader is a module (phase 05), and the filter lift is a page change (phase 06).
Restating that here would create a second, drifting copy of the same blueprint.

**Authoritative phases:**
[`phase-03-schema-migrations.md`](../260710-1511-sun-kudos-live-board/phase-03-schema-migrations.md) ·
[`phase-05-shared-hashtag-module.md`](../260710-1511-sun-kudos-live-board/phase-05-shared-hashtag-module.md) ·
[`phase-06-f002-board-reads.md`](../260710-1511-sun-kudos-live-board/phase-06-f002-board-reads.md)
**Master plan:** [`plans/260710-1511-sun-kudos-live-board/plan.md`](../260710-1511-sun-kudos-live-board/plan.md)

## Design data in this folder

`data/JWpsISMAaM-*` (13 Vietnamese entries) · `data/p9zO-c4a4x-*` (8 English entries)

## Settled decisions this folder depends on

- The two dropdowns shipped **disjoint master lists with zero overlap** — 13 Vietnamese vs 8 English.
  Resolved: **the 13 Vietnamese list wins**, and both dropdowns read the same rows. The write form's
  English list is superseded, so its `#High-perorming` typo is moot and must not be carried forward.
- NEW `hashtags` master table + NEW `kudo_hashtags(kudo_id, hashtag_id)` join table.
- Backfilling the legacy free-text `kudos.hashtags` matches **nothing** — the seeded values share no
  token with the 13. Logged as a no-match; no mapping was invented.
- The legacy `kudos.hashtags` column is **kept** this batch, not dropped.
- Interaction models legitimately differ: board filter = single-select, closes on pick; write form =
  multi-select, max 5, check icons, disabled at 5.
- A hashtag click anywhere — either dropdown, or a chip on any card — re-filters **Highlight AND All
  Kudos together** and resets the carousel to page 1. Today `feed-list.tsx` owns `selectedHashtag`
  locally and filters only the feed; phase 06 lifts that state to the page.

## Open cross-batch conflict

`plans/260713-1552-dropdown-department` phase DD-03 edits `highlight-section.tsx` and
`app/sun-kudos/page.tsx` — the same two files as Batch A phase 06. **Sequence them; never run both
concurrently.**
