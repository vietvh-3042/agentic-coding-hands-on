# Phase 06 — F002 board reads + page-level filter lift

## Context Links

- [`plan.md`](./plan.md) · [phase-04](./phase-04-seed-data.md) · [phase-05](./phase-05-shared-hashtag-module.md)
- [`spec/kudos-board-data/functional-spec.md`](./spec/kudos-board-data/functional-spec.md) ·
  [`technical-spec.md`](./spec/kudos-board-data/technical-spec.md) A1–A4
- [`spec/hashtag-taxonomy/technical-spec.md`](./spec/hashtag-taxonomy/technical-spec.md) A1/A2 (filter lift)
- Test cases: `data/MaZUn5xHXZ-testcases.csv` — `926d92a5`, `d662780b`, `0e56cacb`, `159fed13`,
  `d01729d4`, `81446f61`, `9e689933`, `d035e3b8`, `9dfda316`, `99ade8e6`
- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ

## Overview

- **Priority:** P0 — the headline of the batch.
- **Status:** completed (POLICY DEVIATION: not test-first)
- Mock modules replaced with server reads; hashtag filter lifted to page level so Highlight and
  All-Kudos filter together. Real e2e suite exists and caught 2 bugs (duplication, locator clash).
- **Policy: `e2e-red-first`** (DEVIATED: build-first due to unfamiliar schema discovery; deviation
  recorded in clarifications.md § "RECORDED POLICY DEVIATION")

## Key Insights

- **The filter lift is the structural change; the queries are the easy part.** Today
  `feed-list.tsx:25` owns `selectedHashtag` (feed only) and `highlight-section.tsx:20` owns a
  _second_ `hashtag` state (highlight only). Two independent filters over the same UI is the bug.
  Lift both into the page as URL search params (`?tag=`), so the filter survives a reload, is
  linkable, and lets a server component re-query instead of filtering an in-memory array.
- **`searchParams` is a `Promise` in Next 16.** `PageProps<'/sun-kudos'>` is globally available
  after typegen. Reading `searchParams` opts the page into dynamic rendering — which is what we
  want, since the board is per-viewer (`likedByMe`, `isOwnKudo`, sidebar stats).
- **Infinite scroll needs a Server Action, not a client Supabase call.** A client component cannot
  import `lib/supabase/server.ts`. Keep the existing `IntersectionObserver` sentinel
  (`feed-list.tsx:41-58`) and have it call `loadFeedPage(cursor, filter)`.
- **Keyset, not offset.** `.range()` on a live feed double-serves rows when something is inserted
  mid-scroll. Page on `(created_at, id) < cursor` — the spec's SC-001 explicitly asserts no
  duplicate across the page boundary.
- **`hearts_count` is already denormalized** and trigger-maintained. Order the Highlight by it
  directly; never aggregate `kudo_hearts` at read time.
- **The sidebar is per-viewer.** `profile_kudo_stats` (phase 03) plus `profiles.boxes_*` covers all
  five counters. The `x2` badge now has a real source: `event_settings.special_day_*` active.
- **Both leaderboards render `'Chưa có dữ liệu'` unconditionally** (BR-006, D002) — no table
  exists. Do not invent one; delete the `GIFT_LEADERBOARD`/`RISING_LEADERBOARD` mock constants and
  pass empty arrays.
- **Star tier (BR-001) is new UI**, not a rewiring — no star element exists in any person block
  today. It reads `profile_kudo_stats.kudos_received` through `starTier()` from phase 05.

## Requirements

- **FN-1 (A1)** Feed: `created_at DESC`, keyset paging, `FEED_PAGE_SIZE = 10`, `is_spam` excluded.
- **FN-2 (A2)** Highlight: top 5 by `hearts_count DESC, created_at DESC, id ASC`, event-wide,
  filter-aware; index resets to 0 on any filter change.
- **FN-3 (A3)** Spotlight: every recipient as a node + an **unfiltered** `COUNT(*)` total;
  `xPct/yPct/size/accent` stay client-computed.
- **FN-4 (A4)** Sidebar: five real counters; both leaderboards empty-state.
- **FN-5** One hashtag selection — dropdown or a chip on either card type — filters both sections
  and resets the carousel. `highlight-kudo-card.tsx` gains the chip handler it lacks today.
- **FN-6** Empty states: `'Hiện tại chưa có Kudos nào.'` (feed/highlight), `'Chưa có dữ liệu'`
  (leaderboards) — existing i18n keys, no new copy.
- **NFR-1** Every file stays under 200 lines. `highlight-section.tsx` (212) and
  `feed-kudo-post-card.tsx` (212) are already over and **must** be split as part of this work.
- **NFR-2** Server components by default; `"use client"` only where carousel/observer/pan-zoom
  state demands it.

## Architecture

```text
GET /sun-kudos?tag=7            (server component, dynamic)
  ├─ getHashtags()                          → 13 rows  (phase 05)
  ├─ getKudoFeedPage({cursor:null, filter}) → 10 rows + nextCursor
  ├─ getHighlightKudos(filter)              → 5 rows
  ├─ getSpotlightBoard()                    → nodes[] + totalCount (unfiltered)
  └─ getSidebarOverview(userId)             → 5 counters + x2 flag
        ↓ props
  HighlightSection · SpotlightSection · AllKudosSection(FeedList, SidebarPanel)
        ↓ sentinel intersects
  loadFeedPage(cursor, filter)  "use server"  → next 10 rows
        ↓ hashtag click anywhere
  router.replace(`?tag=<id>`)  → server re-render, carousel index resets on the new key
```

Selecting a tag rewrites the URL; the page re-renders from the server with both sections already
filtered. That is why the carousel reset is free — the section remounts on a changed key rather
than needing a `useEffect` to chase the filter.

## Related Code Files

**Create**

- `lib/kudos/board-queries.ts` — A1–A4 (split into `feed-query.ts` / `board-aggregates.ts` if it nears 200 lines)
- `app/sun-kudos/actions/load-feed-page.ts` — `"use server"`
- `components/kudos-board/board-filter-bar.tsx` — the two dropdowns, now URL-driven
- `components/kudos-board/feed-post-person-block.tsx` — extracted from the oversized card
- `components/kudos-board/highlight-carousel.tsx` — extracted from the oversized section

**Modify**

- `app/sun-kudos/page.tsx` (server fetches + `searchParams`)
- `components/kudos-board/{all-kudos-section,feed-list,feed-kudo-post-card,highlight-section,highlight-kudo-card,highlight-filter-dropdown,spotlight-section,spotlight-board,sidebar-panel,sidebar-stats,sidebar-leaderboard}.tsx`

**Delete**

- `components/kudos-board/feed-mock-data.ts`, `highlight-mock-data.ts`, `spotlight-mock-data.ts`
  (keep the ticker/pan-zoom constants — move them into `spotlight-board.tsx`, they are decorative
  layout data with no DB source)

## Implementation Steps

1. **RED first.** Write `e2e/kudos-board.spec.ts` (project `chromium-authed`) covering:
   - TC `9dfda316` — the feed renders ≥ 10 seeded cards, newest first (assert the first card's
     timestamp is later than the last's);
   - SC-001 — scrolling to the sentinel appends a second page with no duplicate `data-kudo-id`;
   - TC `86092c3a`/US002 — the Highlight shows exactly 5 slides, indicator reads `n/5`;
   - TC `d01729d4`/`0e56cacb` — clicking a hashtag chip filters **both** sections and the
     indicator returns to `1/…`;
   - TC `926d92a5`/`d662780b` — the two empty-state strings;
   - US003 — the Spotlight total equals the unfiltered kudos count and does not move when a tag is
     applied;
   - US004 — the five sidebar counters match the seeded values for the demo user.
     Run `pnpm test:e2e --project=chromium-authed`. Record `redCommand`, `redExitCode`, and a
     `redFailure` that is an **assertion** message — if it is a redirect to `/login` or a module
     error, phase 02 is not finished and this phase must stop.
2. Add stable hooks the tests can bind to: `data-kudo-id`, `data-testid="feed-list"`,
   `"highlight-indicator"`, `"spotlight-total"`, `"sidebar-stat-<key>"`. Prefer roles/text where
   the design already gives one.
3. Build `lib/kudos/board-queries.ts`. Feed select shape:
   ```ts
   .select(`id, hashtag_title, message, image_urls, hearts_count, created_at, is_anonymous,
     anonymous_name,
     sender:profiles!kudos_sender_id_fkey(id, display_name, hero_code, avatar_url, hero_badge),
     receiver:profiles!kudos_receiver_id_fkey(id, display_name, hero_code, avatar_url, hero_badge),
     kudo_hashtags(hashtag_id),
     kudo_hearts!left(user_id)`)
   .eq("is_spam", false)
   .order("created_at", { ascending: false }).order("id", { ascending: false })
   .limit(FEED_PAGE_SIZE)
   ```
   with `.or("created_at.lt.<c>,and(created_at.eq.<c>,id.lt.<id>)")` for the cursor. Derive
   `likedByMe` from the embedded `kudo_hearts` rows filtered to the viewer, and `isOwnKudo` from
   `sender.id === viewerId`. Filtering by tag: `.filter("kudo_hashtags.hashtag_id", "eq", tag)`
   with an inner join hint (`kudo_hashtags!inner(hashtag_id)`).
4. Highlight: same shape, `.order("hearts_count", {ascending:false})` then the tie-breaks,
   `.limit(5)`.
5. Spotlight: node set from `kudos → receiver` (distinct receiver, latest `created_at`); total from
   `.select("*", { count: "exact", head: true })` with **no** filter. Keep the client-side scatter
   math exactly as it is.
6. Sidebar: one read of `profile_kudo_stats` for the viewer + `profiles.boxes_*` + the special-day
   flag. Pass empty arrays to both `SidebarLeaderboard`s.
7. Rewrite `app/sun-kudos/page.tsx` as an `async` server component taking
   `PageProps<'/sun-kudos'>`, awaiting `searchParams`, and passing everything down as props.
8. Convert the two dropdowns and every chip to `router.replace()` on `?tag=`; delete
   `selectedHashtag` from `feed-list.tsx` and `hashtag` from `highlight-section.tsx`. Add the
   missing chip handler in `highlight-kudo-card.tsx`.
9. Add the star-tier element to each person block using `starTier()`; tooltip copy comes verbatim
   from the functional spec § 13.
10. Split the two oversized files; delete the three mock modules.
11. `pnpm validate` + `pnpm test:e2e --project=chromium-authed` → GREEN.

## Todo List

- [x] `e2e/kudos-board.spec.ts` written; real bugs found (duplication, locators)
- [x] `board-queries.ts` — A1 keyset, A2 top-5, A3 nodes+count, A4 sidebar
- [x] `loadFeedPage` Server Action wired to the existing sentinel
- [x] Filter lifted to `?tag=`; both sections + both dropdowns + both chip types share it
- [x] `highlight-kudo-card.tsx` chip handler added
- [x] Star tier rendered in every person block
- [x] Leaderboards forced to empty state; mock leaderboard constants deleted
- [x] Three mock modules deleted; decorative constants relocated
- [x] `highlight-section.tsx` and `feed-kudo-post-card.tsx` under 200 lines
- [x] `pnpm validate` + authed E2E green

## Success Criteria

- `pnpm test:e2e --project=chromium-authed -g "board"` exits 0 with every TC above asserted.
- No `data-kudo-id` appears twice after two sentinel-triggered loads.
- The Highlight never renders a 6th slide, even with seeded ties below the cut.
- `?tag=<id>` reload restores the filtered board (both sections) with the carousel at slide 1.
- The Spotlight total is invariant under any `?tag=`.
- `grep -rn "mock-data" components/kudos-board/` returns nothing.
- `pnpm validate` exits 0; no file in the phase exceeds 200 lines.

## Risk Assessment

| Risk                                                                                                                         | L×I     | Countermeasure                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgREST `!inner` filter on an embedded table also truncates the embedded `kudo_hashtags` array, so chips render incomplete | **H×M** | Query tag-filtered ids in a first pass (`kudo_hashtags.hashtag_id = tag → kudo_id[]`), then fetch those kudos with the full embed. Two round trips, correct chips           |
| `created_at DESC` full-feed scan is unindexed — the only composite leads on `receiver_id`                                    | M×M     | Add `create index kudos_created_at_id_idx on kudos (created_at desc, id desc)` as a phase-03 follow-up migration; at 40 rows it is invisible, at scale it is the difference |
| Turning the page dynamic slows first paint                                                                                   | M×L     | The board is inherently per-viewer; wrap the feed in `Suspense` with the existing skeleton if measured latency justifies it, not before                                     |
| Deleting the mock modules breaks an unrelated importer                                                                       | M×M     | `grep` for each module before deleting; `spotlight-name-node.tsx` imports `SpotlightNameNodeData` — re-home that type in `lib/kudos/types.ts`                               |
| The filter lift regresses the shipped carousel/pan-zoom interactions                                                         | M×M     | Those stay local client state; only the _filter_ moves. Phase 10 re-checks arrows and pan/zoom manually (TC `81446f61`, `cac4b7a3`)                                         |
| Star tier needs a per-row aggregate → N+1                                                                                    | M×M     | `profile_kudo_stats` view is joined once per query, not per row                                                                                                             |

## Security Considerations

- Read-only phase; no new write path.
- `likedByMe` and `isOwnKudo` must be derived **server-side** from `auth.uid()`, never from a
  client-supplied id — phase 08's heart control renders its disabled state from these flags and
  the DB policy is the backstop.
- The board is `authenticated`-only in this build (see plan → Known deviations); FR-601's
  anonymous-visitor scenarios are not implemented and must not be asserted.

## Next Steps

Unblocks 08 (hearts, which edits the two card files this phase owns). Feeds phase 10.
