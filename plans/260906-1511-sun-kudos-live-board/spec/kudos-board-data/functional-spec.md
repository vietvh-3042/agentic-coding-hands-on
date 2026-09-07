---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Functional Spec — F002_KudosBoardData

**Priority**: P0
**Type**: ui
**Generated**: 2026-09-06

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F002_KudosBoardData → SCR-sun-kudos-board → US001-US005 → — → — → —

## 1. Overview

**Problem:** the public Sun* Kudos board (`/sun-kudos`) currently renders every section from four
hardcoded mock-data modules, so no visitor sees a real kudos, a real like count, or a real
Sunner — the board looks live but is not.
**Solution:** replace the mock-data reads behind the All-Kudos feed, the Highlight carousel, the
Spotlight name cloud, and the sidebar (stats + two leaderboards) with real queries against
`kudos`, `profiles`, and `kudo_hearts`, leaving every existing client component's rendering
untouched — only its data source changes.
**Scope:** reading and displaying real kudos data across the four sections named above; applying
the board-wide hashtag/department filter to the feed and the highlight carousel together.
**Non-Scope:** writing a kudos (F003), liking/unliking a kudos (F004), the hashtag master list and
its two picker UIs (F005), opening a secret box (F006), and the Spotlight name-cloud's own
`xPct`/`yPct`/`size`/`accent` layout math — those stay client-computed and decorative, with no DB
source, by design.

**Actors**

| Actor  | Description                                                              | Primary goal                                                                                          |
| ------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Sunner | Any Sun* employee viewing the public Kudos board, signed in or anonymous | See who is thanking whom right now, who is leading, and filter the board down to what matters to them |

This feature is part of the Sun* Annual Awards 2025 Kudos board; no cross-feature process-flow
file exists for it yet in this batch.

## 2. Functional Capabilities

| ID     | Capability                   | What the user can do                                                                               | User Stories | Requirements                           | Business Rules | Screens             |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------- | -------------- | ------------------- |
| CAP-01 | All-Kudos Feed               | Browse the full kudos feed, newest first, with infinite scroll                                     | US001        | FR-001, FR-101, FR-201, FR-402, FR-601 | BR-001, BR-003 | SCR-sun-kudos-board |
| CAP-02 | Highlight Carousel           | Browse the top 5 most-hearted kudos, event-wide                                                    | US002        | FR-202                                 | BR-004         | SCR-sun-kudos-board |
| CAP-03 | Spotlight Board              | Browse and search a name cloud of kudos recipients, and see the total kudos count                  | US003        | FR-203                                 | BR-005         | SCR-sun-kudos-board |
| CAP-04 | Sidebar Stats & Leaderboards | See personal stats and two 10-row leaderboards                                                     | US004        | FR-204                                 | BR-006         | SCR-sun-kudos-board |
| CAP-05 | Board-Wide Hashtag Filtering | Filter the Highlight carousel and All-Kudos feed together, from either the dropdown or a card chip | US005        | FR-401                                 | BR-002         | SCR-sun-kudos-board |

## 3. Open Decisions

| D### | Decision                                                                                                                                                                             | Default proposal                                                                                                             | Rationale                                                                                                                      | Blocks work |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| D001 | The department filter has no confirmed data source — no `department` column or table exists anywhere in the schema; today's `DEPARTMENTS` list is hardcoded in `constants/index.ts`. | Keep the hardcoded 4-row `DEPARTMENTS` list for this batch; defer a real department directory to a later batch.              | Unblocks Batch A; department filtering stays decorative until `profiles` (or a lookup table) actually carries department data. | no          |
| D002 | Both sidebar leaderboards ("rank-up" and "gift/prize") have no backing table this batch — no rank-up event log and no prize-draw results table exist.                                | Ship both leaderboards in their empty state (`'Chưa có dữ liệu'`) this batch; add real queries once those tables exist.      | Matches the scope note already recorded in `feature-list.md`; avoids inventing a schema no clarification approved.             | no          |
| D003 | The Spotlight empty-state copy (zero search matches) and the board-wide filter-empty-state copy are not given verbatim in any source spec.                                           | Reuse the existing `'Hiện tại chưa có Kudos nào.'` wording pending a BA-provided string for the Spotlight case specifically. | Keeps one empty-state voice across the board instead of inventing new copy.                                                    | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** The board's kudos data joins `profiles` twice — once for the sender, once for the
  receiver — so every kudos entry can display both people's identity, department badge, and star
  tier.

### Navigation (1xx)

- **FR-101** A visitor reaches the board by opening `/sun-kudos` directly; no login is required to
  view it.

### Sun* Kudos Board (2xx)

- **FR-201** The All-Kudos feed loads newest-first and supports infinite scroll, appending older
  kudos as the visitor scrolls.
- **FR-202** The Highlight carousel shows exactly the top 5 kudos by heart count, across the whole
  event, honoring the active hashtag/department filter.
- **FR-203** The Spotlight board renders a name cloud of every kudos recipient plus the total
  system-wide kudos count.
- **FR-204** The sidebar shows the current viewer's personal stats and two 10-row leaderboards.

### Interaction (4xx)

- **FR-401** Selecting a hashtag — from either dropdown, or a chip on either card type — re-filters
  the Highlight carousel and the All-Kudos feed together, and resets the carousel to slide 1.
- **FR-402** Each section renders its own literal empty-state message when it has zero matching
  results.

### Security (6xx)

- **FR-601** Board reads require no authentication; all four sections are visible to anonymous and
  signed-in visitors alike.

## 5. Business Rules

- A person block's star tier (1/2/3) is derived from the receiver's total received-kudos count
  against fixed thresholds (10 / 20 / 50 kudos) (BR-001)
- An active hashtag/department filter is AND-composed and applies to the Highlight carousel and the
  All-Kudos feed together, resetting the carousel to slide 1 whenever it changes (BR-002)
- The All-Kudos feed sorts newest-first by `created_at` (BR-003)
- The Highlight carousel shows exactly the top 5 kudos by heart count, event-wide, honoring the
  active filter (BR-004)
- The Spotlight total count is a single unfiltered count over all kudos; the name cloud includes
  every recipient with no stated limit (BR-005)
- Both sidebar leaderboards show exactly 10 rows when data exists; neither has a backing table this
  batch, so both render their empty state (BR-006)

## 6. Screens

| Screen Name           | SCR###              | What User Sees                                                                                                                           | What User Can Do                                                                                                            |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sun* Kudos Live Board | SCR-sun-kudos-board | The KV banner, write-kudos bar, Highlight carousel, Spotlight name cloud, and the All-Kudos feed + sidebar, all populated with real data | Scroll the feed, browse the carousel, search the Spotlight board, filter by hashtag, and view personal stats + leaderboards |

### User Journey

1. A Sunner opens Sun* Kudos Live Board and sees the Highlight carousel, the Spotlight board, and
   the All-Kudos feed with sidebar, all showing real kudos.
2. The Sunner scrolls the All-Kudos feed; more posts load automatically as they near the bottom.
3. The Sunner clicks a hashtag chip on a card; the Highlight carousel and the All-Kudos feed both
   re-filter to that tag, and the carousel jumps back to slide 1.
4. The Sunner types a name into the Spotlight search box; the name cloud narrows to matching
   Sunners.

## 7. User Stories

### US001 — Browse the All-Kudos feed

**Actor:** Sunner
**Goal:** see every kudos posted on the board, newest first, without a page-load wall.
**Business value:** the board only feels "live" if it shows real, current activity — this is the
feature's core read.

**Acceptance Criteria:**

- [ ] The feed shows real kudos, newest first.
- [ ] Scrolling near the bottom loads more kudos automatically.
- [ ] An empty feed shows `'Hiện tại chưa có Kudos nào.'`.

### US002 — Browse the Highlight carousel

**Actor:** Sunner
**Goal:** see the 5 most-hearted kudos across the whole event.
**Business value:** surfaces the board's most-appreciated moments without the visitor having to
scroll the full feed.

**Acceptance Criteria:**

- [ ] The carousel shows exactly 5 kudos, ordered by heart count descending.
- [ ] The pagination indicator reads `n/5`.
- [ ] An empty result shows `'Hiện tại chưa có Kudos nào.'` and resets to slide 1.

### US003 — Browse and search the Spotlight board

**Actor:** Sunner
**Goal:** see a name cloud of everyone who has received a kudos, and the running total kudos count.
**Business value:** gives every recipient visibility on the board, not just the most-hearted ones.

**Acceptance Criteria:**

- [ ] The total kudos count matches the real number of kudos posted.
- [ ] The name cloud includes every recipient.
- [ ] Searching narrows the cloud to matching names.

### US004 — View personal stats and leaderboards

**Actor:** Sunner
**Goal:** see their own kudos/hearts/secret-box counts and the board's leaderboards.
**Business value:** personal recognition (my own numbers) alongside social proof (who's leading).

**Acceptance Criteria:**

- [ ] All 5 stat counters match the signed-in viewer's real counts.
- [ ] Both leaderboards show real rows once a backing table exists; until then they show
      `'Chưa có dữ liệu'`.

### US005 — Filter the board by hashtag

**Actor:** Sunner
**Goal:** narrow both the Highlight carousel and the All-Kudos feed to one hashtag at a time.
**Business value:** lets a visitor jump straight to the kind of recognition they care about (e.g.
one value/behavior tag) instead of scanning everything.

**Acceptance Criteria:**

- [ ] Selecting a hashtag (dropdown or chip) re-filters both sections identically.
- [ ] The carousel resets to slide 1 whenever the filter changes.
- [ ] Clearing the filter returns both sections to unfiltered data.

## 8. Scenarios

### US001 — Happy Path

**Given** more than one page of kudos exist, **When** the Sunner scrolls the feed to the bottom,
**Then** the next page of kudos appends below the last one shown.

### US001 — Error: no kudos exist

**Given** zero kudos exist yet, **When** the Sunner opens the board, **Then** the feed shows
`'Hiện tại chưa có Kudos nào.'`.

### US002 — Happy Path

**Given** more than 5 kudos exist with varying heart counts, **When** the Highlight carousel loads,
**Then** it shows exactly the top 5 by heart count, in descending order.

### US002 — Error: filter matches nothing

**Given** an active hashtag filter matches zero kudos, **When** the filter is applied, **Then** the
carousel shows `'Hiện tại chưa có Kudos nào.'` and resets to slide 1.

### US005 — Happy Path

**Given** the board is showing unfiltered data, **When** the Sunner clicks a hashtag chip on any
card, **Then** both the Highlight carousel and the All-Kudos feed re-filter to that tag and the
carousel resets to slide 1.

### US005 — Error: no shared match

**Given** a hashtag has kudos in the feed but none in the top-5-by-hearts window, **When** that
hashtag is selected, **Then** the feed shows matching kudos while the Highlight carousel shows its
empty state — the two sections are not required to both be non-empty.

## 9. Edge Cases

| Scenario                                                          | What Happens                                                                                              | User-Facing Message                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| The All-Kudos feed has no kudos yet                               | The feed renders its empty state instead of any post cards                                                | "Hiện tại chưa có Kudos nào."                                          |
| A hashtag/department filter matches no kudos                      | Both the Highlight carousel and the All-Kudos feed show their empty state; the carousel resets to slide 1 | "Hiện tại chưa có Kudos nào."                                          |
| A sidebar leaderboard has zero rows (no backing table this batch) | The leaderboard box shows its empty state unconditionally                                                 | "Chưa có dữ liệu"                                                      |
| The Spotlight search matches no Sunner name                       | The name-cloud area shows an empty-state block                                                            | [UNVERIFIED] exact wording not given in any source spec — see § 3 D003 |

## 10. Edge Behaviours to Verify

- **FR-201** → Confirm the feed never renders the same kudos twice across two consecutive
  scroll-triggered loads.
- **FR-202** → Confirm the Highlight carousel never shows more than 5 slides, even when more than 5
  kudos share the highest heart count.
- **FR-203** → Confirm the Spotlight total count changes only when a new kudos is created, never
  when a filter or search term changes.
- **FR-401** → Confirm selecting a hashtag from the dropdown produces the same filtered result as
  clicking the equivalent chip on a card.

## 11. Risks & Known Issues

N/A — none found. This is a greenfield read-only feature; the mismatches between today's mock data
and the real intended data model (e.g. `GIFT_LEADERBOARD`'s 5 fabricated rows, `RISING_LEADERBOARD`
already empty) are recorded as Dependencies (§ 12) and Open Decisions (§ 3) rather than as defects,
since no real read code has shipped yet to misbehave.

## 12. Dependencies

| Dependency           | Type    | Why this feature needs it                                                                                                                                                      | Evidence                                 |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| F005_HashtagTaxonomy | feature | The board's hashtag filter and hashtag chips need F005's master `hashtags` table and `kudo_hashtags` join to resolve real ids instead of `constants/index.ts`'s hardcoded list | F005_HashtagTaxonomy                     |
| F004_KudoHearts      | feature | The heart count and the per-viewer `liked_by_me` / `is_own_kudos` flags this feature reads are only meaningful once F004's like/unlike mutation exists                         | F004_KudoHearts                          |
| Department directory | data    | The Highlight/feed department filter has no confirmed source column or table                                                                                                   | Open Decision D001                       |
| Rank-up event log    | data    | The "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" leaderboard has no backing table this batch; renders empty                                                                           | feature-list.md note; Open Decision D002 |
| Prize-draw results   | data    | The "10 SUNNER NHẬN QUÀ MỚI NHẤT" leaderboard has no backing table this batch; renders empty                                                                                   | feature-list.md note; Open Decision D002 |

## 13. Configuration

```text
HIGHLIGHT_CAROUSEL_SIZE = 5      # exactly 5 slides in the Highlight carousel, event-wide
LEADERBOARD_ROW_COUNT = 10       # exactly 10 rows in each sidebar leaderboard
SPOTLIGHT_SEARCH_MAX_LEN = 100   # max characters in the Spotlight Sunner-name search box
STAR_TIER_THRESHOLDS = 10, 20, 50  # received-kudos counts that unlock 1 / 2 / 3 stars
STAR_TIER_1_TEXT = "Sunner đã nhận được 10 Kudos và bắt đầu lan tỏa năng lượng ấm áp đến mọi người xung quanh."
STAR_TIER_2_TEXT = "Sunner đã nhận được 20 Kudos và chứng minh sức ảnh hưởng của mình qua những hành động lan tỏa tích cực mỗi ngày."
STAR_TIER_3_TEXT = "Sunner đã nhận được 50 Kudos và trở thành hình mẫu của sự công nhận, sẻ chia và lan tỏa tinh thần Sun*."
```
