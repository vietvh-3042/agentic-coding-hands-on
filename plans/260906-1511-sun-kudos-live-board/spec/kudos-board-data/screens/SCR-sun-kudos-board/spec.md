---
status: draft
authored_by: takumi
created: 2026-09-06
---

# SCR-sun-kudos-board — Screen Spec

**Screen**: SCR-sun-kudos-board: Sun* Kudos Live Board
**Feature**: F002_KudosBoardData
**Type**: composite
**Route**: /sun-kudos
**Generated**: 2026-09-06

**Scope note:** this screen is shared across F002-F006. This draft documents the whole layout for
context, but its `## 3` onward content is scoped strictly to **F002's read/display concerns**
(All-Kudos feed, Highlight carousel, Spotlight board, sidebar stats + leaderboards). The write bar
(F003), the hashtag dropdowns' own interaction (F005), the heart mutation (F004), and the secret
box modal (F006) are owned by sibling drafts and referenced here by code only — never
re-specified.

## 1. Overview

**Purpose:** the public event board where any Sun* employee reads real-time-feeling recognition —
who thanked whom, which kudos are most appreciated, and their own personal stats — and can narrow
the board to one hashtag.
**Actors:** Sunner (signed in or anonymous)
**Entry Conditions:** none — the route is public; no login is required to view it.
**Exit Conditions:** the visitor navigates away (nav link, browser back), or clicks a card/name/node
that leaves this screen for the kudos-detail or Sunner-profile route (no spec for either in this
batch).

## 2. Screen Layout

### Layout Sketch

The page is a single vertical column: a KV banner, a write-kudos entry bar (F003), the Highlight
carousel with its two filter dropdowns, the Spotlight name-cloud board, and the All-Kudos section
(a two-column row: the feed on the left, a sticky stats+leaderboard sidebar on the right).
(`app/sun-kudos/page.tsx:32-48`)

```
┌───────────────────────────────────────────────────┐
│  R1: KV Banner (static)                            │
├─────────────────────────────────────────────────────┤
│  R2: Write-Kudos Bar (static) — F003                │
├─────────────────────────────────────────────────────┤
│  R3: Highlight Carousel (static, internal scroll)   │
├─────────────────────────────────────────────────────┤
│  R4: Spotlight Board (static)                       │
├──────────────────────────┬──────────────────────────┤
│  R5: All-Kudos Feed       │ R6: Sidebar (sticky)     │
│  (scrollable, infinite)   │  (stats + 2 leaderboards)│
└──────────────────────────┴──────────────────────────┘
```

### Layout Regions

| Region ID | Name               | Position              | Scrollable                | Key Components                                                        |
| --------- | ------------------ | --------------------- | ------------------------- | --------------------------------------------------------------------- |
| R3        | Highlight Carousel | static                | no (internal slide nav)   | `HighlightSection`, `HighlightFilterDropdown` ×2, `HighlightKudoCard` |
| R4        | Spotlight Board    | static                | no (internal pan/zoom)    | `SpotlightBoard`, `SpotlightNameNode`, `SpotlightZoomControls`        |
| R5        | All-Kudos Feed     | static (page scrolls) | yes, infinite             | `FeedList`, `KudoPostCard`                                            |
| R6        | Sidebar            | sticky                | yes, if content overflows | `SidebarPanel`, `SidebarStats`, `SidebarLeaderboard` ×2               |

## 3. UI Elements

| ID  | Element                                                                        | Type          | Required | Default | Visibility                          | Action                                                                          | Source                          | Format | Empty Behavior            | Cross-ref                                  |
| --- | ------------------------------------------------------------------------------ | ------------- | -------- | ------- | ----------------------------------- | ------------------------------------------------------------------------------- | ------------------------------- | ------ | ------------------------- | ------------------------------------------ |
| E01 | Highlight card content (sender/receiver, message, hashtags, heart count, time) | display field | —        | —       | Always                              | Click card/"Xem chi tiết" → kudos detail _(out of scope this batch)_            | API field                       | raw    | dash                      | MODEL:Kudo, MODEL:Profile                  |
| E02 | Highlight pagination indicator ("n/5")                                         | display field | —        | —       | Always                              | —                                                                               | computed                        | raw    | —                         | N/A                                        |
| E03 | All-Kudos feed post card content                                               | display field | —        | —       | Always                              | Click content → kudos detail _(out of scope this batch)_                        | API field                       | raw    | dash                      | MODEL:Kudo, MODEL:Profile                  |
| E04 | All-Kudos infinite-scroll sentinel                                             | region label  | —        | —       | Conditional (`hasMore`)             | Loads the next page when it intersects the viewport                             | computed                        | —      | hidden when no more pages | N/A                                        |
| E05 | Spotlight name-cloud node                                                      | display field | —        | —       | Conditional (matches active search) | Hover → tooltip (name + time); click → kudos detail _(out of scope this batch)_ | API field                       | raw    | hidden (filtered out)     | MODEL:Kudo, MODEL:Profile                  |
| E06 | Spotlight total kudos count ("388 KUDOS")                                      | display field | —        | —       | Always                              | —                                                                               | API field (`COUNT(*)`)          | raw    | —                         | N/A                                        |
| E07 | Spotlight Sunner search input                                                  | text input    | no       | Empty   | Always                              | Filters visible name nodes client-side                                          | —                               | raw    | —                         | N/A                                        |
| E08 | Sidebar stat rows (5 counters)                                                 | display field | —        | —       | Always                              | —                                                                               | API field                       | raw    | dash                      | MODEL:Profile, MODEL:Kudo, MODEL:KudoHeart |
| E09 | "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" leaderboard                              | list          | —        | —       | Always                              | —                                                                               | — _(no data source this batch)_ | —      | placeholder text          | N/A — no backing table this batch          |
| E10 | "10 SUNNER NHẬN QUÀ MỚI NHẤT" leaderboard                                      | list          | —        | —       | Always                              | —                                                                               | — _(no data source this batch)_ | —      | placeholder text          | N/A — no backing table this batch          |
| E11 | Hashtag chip on a card (E01/E03)                                               | button        | —        | —       | Always                              | Sets the board-wide hashtag filter (CAP-05, jointly with F005)                  | —                               | raw    | —                         | cross-ref: F005                            |

## 4. User Actions

> **Scope:** within-screen F002 interactions only. Card-click navigation to a kudos-detail or
> profile route leaves the screen with no destination spec in this batch — see `## 8. Navigation`.

### Available Actions

| Action                                     | Element | Trigger | Condition                     | Result on this screen                                                                 | Source                                                |
| ------------------------------------------ | ------- | ------- | ----------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Scroll to the bottom of the All-Kudos list | E04     | scroll  | more pages remain (`hasMore`) | loads and appends the next page of kudos                                              | `components/kudos-board/feed-list.tsx:41-58`          |
| Search the Spotlight name cloud            | E07     | type    | ≤100 chars                    | narrows the visible node set to matching names                                        | `components/kudos-board/spotlight-board.tsx:42-48`    |
| Click a hashtag chip on any card           | E11     | click   | —                             | re-filters Highlight + All-Kudos to that tag, resets the carousel to slide 1 (CAP-05) | TBD (draft) — filter state not yet lifted to the page |

### Happy Path

1. Visitor opens `/sun-kudos` and sees the Highlight carousel, Spotlight board, and All-Kudos feed
   with sidebar, all populated with real data.
2. Visitor scrolls the All-Kudos list in R5; more posts load automatically as the sentinel (E04)
   comes into view.
3. Visitor clicks a hashtag chip (E11) on a card; the Highlight carousel (R3) and the All-Kudos
   feed (R5) both re-filter to that tag and the carousel resets to slide 1.
4. Visitor types into the Spotlight search box (E07); the name cloud (R4) narrows to matching
   Sunners.

### Branches

| Decision point   | Condition                                          | Outcome on this screen                                                              | Source                                               |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Filter applied   | the selected hashtag/department matches zero kudos | Highlight and All-Kudos both show their empty-state message                         | TBD (draft)                                          |
| Spotlight search | the search term matches no name                    | the name-cloud area shows an empty-state block (exact copy not specified in source) | `components/kudos-board/spotlight-board.tsx:131-139` |

### Interaction Notes

- **Hovering a person block's star count shows a fixed tier tooltip (10/20/50-kudos thresholds).**
  — source: TBD (draft), a new display element for this feature.
- **Hovering a Spotlight name-cloud node shows the recipient's name and received time.** — source:
  TBD (draft) for the real data binding; the hover/tooltip mechanism itself already exists in
  `components/kudos-board/spotlight-name-node.tsx`.

## 5. UI States

| State                    | Trigger                                    | Visual Behavior                                                           | User Action Available | Source                                                 |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| loading                  | initial page load / scroll-triggered fetch | TBD (draft) — no loading UI exists yet for the real data path             | none                  | TBD (draft)                                            |
| empty (feed)             | zero kudos, or active filter matches none  | literal `'Hiện tại chưa có Kudos nào.'`                                   | none                  | `components/kudos-board/feed-list.tsx:76-79`           |
| empty (highlight)        | active filter matches no kudos             | literal `'Hiện tại chưa có Kudos nào.'`                                   | none                  | `components/kudos-board/highlight-section.tsx:107-110` |
| empty (leaderboard)      | no backing table this batch (always true)  | literal `'Chưa có dữ liệu'`                                               | none                  | `components/kudos-board/sidebar-leaderboard.tsx:25-27` |
| empty (Spotlight search) | search term matches nothing                | existing empty-state block; exact copy `[UNVERIFIED]`                     | none                  | `components/kudos-board/spotlight-board.tsx:131-139`   |
| error                    | a real data fetch fails                    | TBD (draft) — no error UI exists yet for any of this feature's read paths | retry — TBD (draft)   | TBD (draft)                                            |
| success                  | data loads                                 | populated cards / nodes / rows render                                     | none                  | N/A                                                    |

## 6. Validation & Feedback

| Element | Rule               | Feedback                                                                                      | Trigger |
| ------- | ------------------ | --------------------------------------------------------------------------------------------- | ------- |
| E07     | Max 100 characters | none — the input silently stops accepting further characters at the HTML `maxLength` boundary | change  |

## 7. Conditional UI

| Condition                      | Type          | Element(s) | Visible when     | Hidden when       | Notes                                                                                                                                     |
| ------------------------------ | ------------- | ---------- | ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Rising / gift leaderboard rows | configuration | E09, E10   | never this batch | always this batch | no backing table exists yet — both render the literal empty state unconditionally until a future batch adds one (functional-spec.md § 12) |

## 8. Navigation

### Entry Points

| From                 | Trigger there                                       | Condition | Source      |
| -------------------- | --------------------------------------------------- | --------- | ----------- |
| external \| nav link | direct URL, or clicking "Sun Kudos" in the site nav | —         | TBD (draft) |

### Exits

| Action                                                      | Element       | Condition | Destination          | Result   | Source                                     |
| ----------------------------------------------------------- | ------------- | --------- | -------------------- | -------- | ------------------------------------------ |
| Click a highlight/feed card, its content, or "Xem chi tiết" | E01, E03      | —         | kudos-detail route   | redirect | N/A — no detail-screen spec in this batch  |
| Click a person block's name or avatar                       | E01, E03, E05 | —         | Sunner-profile route | redirect | N/A — no profile-screen spec in this batch |

## 9. Accessibility

| Aspect                      | Status     | Notes                                                                                                                                 |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | [EXPECTED] | search input (E07) should carry an `aria-label`; name-cloud nodes (E05) should be reachable by assistive tech, not only pointer hover |
| Keyboard navigation         | [EXPECTED] | the infinite-scroll sentinel (E04) and hashtag chips (E11) should be operable without a pointer                                       |
| Focus management            | [EXPECTED] | no modal/drawer in this feature's own scope; nothing to trap focus in                                                                 |
| Screen reader compatibility | [EXPECTED] | empty-state messages should be announced when a filter or search changes the visible set                                              |
| Error announcement          | [EXPECTED] | a failed data fetch should be announced, once an error UI exists (see `## 5. UI States`)                                              |

## 10. Responsive Behavior

N/A — no responsive behavior decided yet for this batch.
