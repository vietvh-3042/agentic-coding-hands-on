# Open Secret Box — reveal flow

**Status:** planned (implementation owned by Batch A)
**Screen:** `J3-4YFIpMM` ("Open secret box - chưa mở")
**fileKey:** `9ypp4enmFmdK3YAFJLIu6C`
**Feature:** F006 — Secret Box Reveal
**Test policy:** `e2e-red-first`

## Why this folder has no phase files

The reveal is one server-side draw plus one modal. It is built by **Batch A phase 09**; duplicating
the blueprint here would let the two copies drift.

**Authoritative phase:** [`phase-09-f006-secret-box-reveal.md`](../260710-1511-sun-kudos-live-board/phase-09-f006-secret-box-reveal.md)
**Master plan:** [`plans/260710-1511-sun-kudos-live-board/plan.md`](../260710-1511-sun-kudos-live-board/plan.md)

## Design data in this folder

`data/J3-4YFIpMM-specs.csv` · `-testcases.csv` · `-frame.json`

## Corrected understanding — read this before implementing

An earlier clarification claimed `sidebar-gift-dialog.tsx` implements the _reveal_ modal and that the
_unopened_ state was missing. **That is backwards.** Verified in code: `sidebar-gift-dialog.tsx:104`
renders `url(/kudos/secret-box/box-closed.svg)` — it is the UNOPENED shell. The **success/reveal
modal is the missing half**, and that is what phase 09 builds.

## Scope recorded here

- Six-way **weighted** draw: Stay Gold 30 · Flow to Horizon 25 · Touch of Light 20 ·
  Beyond the Boundary 10 · Revival 10 · Root Further 5.
- The draw is **server-side** — a `security definer` RPC. Two MoMorph security test cases forbid
  client-side manipulation of the badge and the counter, so a client-side draw would fail the gate by
  construction.
- `profiles.boxes_unopened` decrements and the badge collection refreshes.
- `user_icon_unlocks` currently has a **SELECT policy only** — it needs a write path.
- **Badge artwork does not exist.** `secret_box_icons` holds placeholder rows "Icon 1".."Icon 6"
  pointing at `/profile/icons/icon-N.png`, and `public/profile/` is absent. Decision: seed the six
  real names and weights and render a **text fallback**; the draw is correct and testable now, and
  dropping artwork in later changes no code.

## Dependencies

Batch A phases 02 (toolchain + E2E harness), 03 (the `open_secret_box()` RPC and
`secret_box_icons.weight`), 04 (seed data — one identity seeded at 0 boxes for the empty-state case).
