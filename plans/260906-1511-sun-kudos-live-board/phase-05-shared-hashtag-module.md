# Phase 05 — Shared hashtag module + retire `SAA_HASHTAGS`

## Context Links

- [`plan.md`](./plan.md) · [phase-03](./phase-03-schema-migrations.md)
- [`spec/hashtag-taxonomy/technical-spec.md`](./spec/hashtag-taxonomy/technical-spec.md) A1/A3 `getHashtags()`
- [`clarifications.md`](./clarifications.md) § "gap resolution" — the 13 VI list supersedes the 8 EN list
- Current: `constants/index.ts:6-15,24-27`, imported by `feed-list.tsx:11`,
  `highlight-section.tsx:11`, `kudos-hashtag-input.tsx:7`

## Overview

- **Priority:** P1 — small, but it is the wedge that lets 06 and 07 run in parallel.
- **Status:** completed
- Hashtag module owns the DB read and shared types. `SAA_HASHTAGS` and `saaHashtagLabel` deleted;
  `DEPARTMENTS`/`departmentLabel` remain (D001 — no data source).
- **Policy: infrastructure.** Behavior unchanged until 06/07 consume it; typecheck gate passed.

## Key Insights

- Both 06 and 07 need the hashtag list _and_ would both edit `constants/index.ts`. Isolating that
  single edit here is what makes the two feature phases file-disjoint and therefore parallel.
- The write-form's 8-item English list is superseded, so its `#High-perorming` typo dies with it —
  do not carry it into the new module under any spelling.
- `getHashtags()` is called from a server component (board) _and_ a client component (the picker
  inside a modal). Give it one server implementation and pass the resolved list down as props;
  do not create a second browser-side copy. Thirteen rows change roughly never — fetching them
  once per page render is correct and needs no cache layer (YAGNI).
- Label lookup must not stay a synchronous pure function over a constant — chips need a label from
  an id, so ship a `Map` built from the fetched rows and pass it down, rather than re-querying per
  chip.

## Requirements

- **FN-1** `getHashtags(): Promise<Hashtag[]>` — server-side, ordered by `sort_order`.
- **FN-2** `Hashtag = { id: number; name: string }`; `hashtagLabelMap(rows): Map<number, string>`.
- **FN-3** Shared board row types (`KudoCardData`, `BoardFilter`) live in `lib/kudos/types.ts` so
  06, 07 and 08 agree on one shape.
- **FN-4** `SAA_HASHTAGS` and `saaHashtagLabel` removed from `constants/index.ts`.
- **NFR-1** `pnpm typecheck` fails loudly at every stale import site — that failure list _is_ the
  handover contract to 06 and 07.

## Architecture

```text
lib/kudos/hashtags.ts   getHashtags() → supabase.from('hashtags').select('id,name').order('sort_order')
lib/kudos/types.ts      KudoCardData | BoardFilter | Hashtag | StarTier
        ↑                              ↑
   phase 06 (board)              phase 07 (write form)
```

## Related Code Files

**Create** — `lib/kudos/hashtags.ts`, `lib/kudos/types.ts`
**Modify** — `constants/index.ts` (remove `SAA_HASHTAGS`, `saaHashtagLabel`; keep `DEPARTMENTS`,
`departmentLabel`, `ROUTERS`, `KUDOS_MAX_*`)
**Delete** — none (the three call sites are fixed by 06/07, which own those files)

## Implementation Steps

1. `lib/kudos/types.ts` — declare `Hashtag`, `BoardFilter { hashtagId: number | null; department:
number | null }`, `KudoCardData` (id, sender/receiver person blocks, createdAt, category,
   message, imageUrls, hashtagIds, heartsCount, likedByMe, isOwnKudo, starTier), `StarTier = 0|1|2|3`.
2. `lib/kudos/hashtags.ts` — `getHashtags()` using `createClient()` from `lib/supabase/server.ts`;
   plus `hashtagLabelMap()` and `starTier(receivedCount)` (10/20/50 thresholds, ALG-001) as pure
   helpers. Keep the file under 60 lines.
3. Delete `SAA_HASHTAGS` / `saaHashtagLabel` from `constants/index.ts`.
4. Run `pnpm typecheck` and **record the broken import list** in the phase report — it is exactly
   `feed-list.tsx`, `highlight-section.tsx`, `kudos-hashtag-input.tsx`. Do **not** fix them here;
   they belong to 06 and 07.

## Todo List

- [x] `lib/kudos/types.ts` with the shared shapes
- [x] `lib/kudos/hashtags.ts` — `getHashtags`, `hashtagLabelMap`, `starTier`
- [x] `SAA_HASHTAGS` / `saaHashtagLabel` deleted
- [x] Broken-import list recorded and handed to 06/07
- [x] `pnpm lint` clean on the new files

## Success Criteria

- `getHashtags()` returns 13 rows in `sort_order` against the local stack.
- `grep -r "SAA_HASHTAGS" --include=*.ts*` returns only the three files 06/07 own.
- `starTier(9)=0, starTier(10)=1, starTier(20)=2, starTier(50)=3`.
- `pnpm lint` passes; `pnpm typecheck` fails _only_ on the three expected import sites.

## Risk Assessment

| Risk                                                                     | L×I | Countermeasure                                                                                                                                        |
| ------------------------------------------------------------------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leaving the repo un-typecheckable between phases                         | H×M | Accepted and bounded: 06 and 07 both start from the recorded list and neither may be merged alone. Phase 10 is the gate that proves it green          |
| A client component tries to import `lib/kudos/hashtags.ts` (server-only) | M×M | The module imports `next/headers` transitively, so Next fails the build immediately — an obvious error, not a silent one. Props are the intended path |
| `DEPARTMENTS` removed by mistake                                         | L×M | Explicitly out of scope here; D001 keeps it hardcoded this batch                                                                                      |

## Security Considerations

None new. `hashtags` is public-readable by policy; the module performs no writes.

## Next Steps

Unblocks the parallel window 06 ∥ 07 ∥ 09.
