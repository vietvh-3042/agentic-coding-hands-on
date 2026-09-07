# Kudos Write Form — Viết Kudo + Addlink Box

**Status:** planned (implementation owned by Batch A)
**Screens:** `ihQ26W78P2` (Viết Kudo) · `OyDLDuSGEa` (Addlink Box)
**fileKey:** `9ypp4enmFmdK3YAFJLIu6C`
**Feature:** F003 — Kudo Authoring
**Test policy:** `e2e-red-first`

## Why this folder has no phase files

This screen pair is implemented by **Batch A phase 07**, not by a separate phase set. The write
form, the recipient picker, the hashtag picker and the Addlink Box all submit through one Server
Action and share one validation path — splitting them across two plan folders would duplicate the
blueprint and let the two copies drift. This folder holds the design data and the pointer; the
executable plan lives in Batch A.

**Authoritative phase:** [`phase-07-f003-authoring-addlink.md`](../260710-1511-sun-kudos-live-board/phase-07-f003-authoring-addlink.md)
**Master plan:** [`plans/260710-1511-sun-kudos-live-board/plan.md`](../260710-1511-sun-kudos-live-board/plan.md)
**Clarifications:** [`../260710-1511-sun-kudos-live-board/clarifications.md`](../260710-1511-sun-kudos-live-board/clarifications.md)

## Design data in this folder

| File                                                           | Contents    |
| -------------------------------------------------------------- | ----------- |
| `data/ihQ26W78P2-specs.csv` · `-testcases.csv` · `-frame.json` | Viết Kudo   |
| `data/OyDLDuSGEa-specs.csv` · `-testcases.csv` · `-frame.json` | Addlink Box |

## Scope recorded here

- Recipient picker reads `profiles`; `kudos-mock-data.ts` is deleted.
- Message body capped at **500 characters**, enforced by the form counter AND re-validated inside the
  Server Action. The counter is UX, not a control.
- Up to **5 hashtags**, multi-select, check icons, disabled at 5 — sourced from the `hashtags` table
  built in Batch A phase 03, never from the retired `constants/index.ts SAA_HASHTAGS`.
- **Addlink Box is genuinely missing.** `components/kudos/kudos-content-editor.tsx` renders a link
  toolbar button with no handler and its own comment calls the toolbar presentational. Phase 07
  builds the real dialog.

## Dependencies

Batch A phases 02 (toolchain + authenticated E2E harness), 04 (seed data), 05 (shared hashtag module).

## Success criteria

Owned by Batch A phase 07 and re-asserted at phase 10. A kudo submitted through the form persists to
`kudos` + `kudo_hashtags` and appears in the feed; an over-length body is rejected server-side even
when the client counter is bypassed.
