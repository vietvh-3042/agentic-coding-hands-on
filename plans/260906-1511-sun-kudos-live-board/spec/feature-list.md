# Feature List

**Project**: SAA 2025 — Sun* Annual Awards
**Generated**: 2026-09-06
**Analysis Scope**: Batch A — kudos data layer. Screens MaZUn5xHXZ, JWpsISMAaM, p9zO-c4a4x, ihQ26W78P2, OyDLDuSGEa, J3-4YFIpMM.

Codes F002–F006 are **PROVISIONAL** — real allocation happens at promote. F001_GoogleSignIn is
already registered and is not part of this batch.

## Feature Hierarchy

| Code                 | Name                         | Type  | Language   | Workspace | Priority |
| -------------------- | ---------------------------- | ----- | ---------- | --------- | -------- |
| F002_KudosBoardData  | Kudos Board Data             | ui    | TypeScript | web       | P0       |
| F003_KudoAuthoring   | Kudo Authoring               | ui    | TypeScript | web       | P0       |
| F004_KudoHearts      | Kudo Hearts                  | mixed | TypeScript | web       | P1       |
| F005_HashtagTaxonomy | Hashtag Taxonomy & Filtering | mixed | TypeScript | web       | P1       |
| F006_SecretBoxReveal | Secret Box Reveal            | mixed | TypeScript | web       | P2       |

## Feature Details

### F002_KudosBoardData — Kudos Board Data

**Intent:** A member opens `/sun-kudos` and sees real data — the All-Kudos feed (infinite scroll,
`created_at DESC`), the Highlight carousel (top 5 by hearts, event-wide), the Spotlight name cloud
(+ total count), and the sidebar stats and 10-row leaderboard.
**Replaces:** `feed-mock-data.ts`, `highlight-mock-data.ts`, `spotlight-mock-data.ts`.
**Reads:** `kudos` joined to `profiles` on both sender and receiver; aggregate counts.
**Writes:** none.
**Related Screens:** SCR-sun-kudos-board (MaZUn5xHXZ)
**Related User Stories:** TBD (draft) · **APIs:** TBD (draft) · **Data Models:** kudos, profiles
**Notes:** Spotlight `xPct/yPct/size/accent` are decorative and stay client-computed — no DB source.
`GIFT_LEADERBOARD` descriptions ("Received 1 SAA T-shirt") have NO table; out of scope this batch.

### F003_KudoAuthoring — Kudo Authoring

**Intent:** A member writes a kudo to a colleague: recipient picker, rich-ish message (max 500
chars), up to 5 hashtags, images, and an inserted link. Submits via a Server Action that re-validates
server-side.
**Replaces:** `kudos-mock-data.ts`.
**Builds NEW:** Addlink Box (OyDLDuSGEa) — confirmed absent; `kudos-content-editor.tsx` has a link
toolbar button with no handler.
**Reads:** `profiles` (recipient autocomplete), `hashtags` (via F005).
**Writes:** `kudos` INSERT — policy already exists (`sender_id = auth.uid()`).
**Related Screens:** SCR-write-kudo (ihQ26W78P2), SCR-addlink-box (OyDLDuSGEa)
**Related User Stories:** TBD (draft) · **APIs:** TBD (draft) · **Data Models:** kudos, profiles

### F004_KudoHearts — Kudo Hearts

**Intent:** A member hearts or un-hearts a kudo. One heart per user per kudo; the sender's own kudos
disable the control; a heart credits the SENDER +1, or +2 on an admin-configured special day; unlike
revokes whichever amount was granted.
**Reads:** `kudo_hearts` (has this user hearted?), `kudos.hearts_count`.
**Writes:** `kudo_hearts` INSERT/DELETE — policies already exist, including an
`auth.uid() <> kudos.sender_id` self-heart guard. `kudo_hearts.hearts_value CHECK IN (1,2)` already
models the multiplier and the sync trigger respects it.
**Related Screens:** SCR-sun-kudos-board (MaZUn5xHXZ)
**Related User Stories:** TBD (draft) · **APIs:** TBD (draft) · **Data Models:** kudo_hearts, kudos
**Notes:** Where the "special day" multiplier is configured is UNRESOLVED — no column exists for it.

### F005_HashtagTaxonomy — Hashtag Taxonomy & Filtering

**Intent:** One master hashtag list (13 Vietnamese, per clarification) drives both dropdowns — the
board filter (single-select, closes on pick) and the write-form picker (multi-select, max 5, check
icons, disabled at 5). Selecting a hashtag anywhere — either dropdown, or a chip on any card —
re-filters Highlight AND All Kudos together and resets the carousel to page 1.
**Schema:** NEW `hashtags` master table + NEW `kudo_hashtags(kudo_id, hashtag_id)` join table, with a
backfill of the existing free-text `kudos.hashtags` seed rows.
**Retires:** the hardcoded `SAA_HASHTAGS` in `constants/index.ts`.
**Writes:** `kudo_hashtags` INSERT (as part of F003 submission) — needs a NEW policy.
**Related Screens:** SCR-hashtag-filter (JWpsISMAaM), SCR-hashtag-picker (p9zO-c4a4x)
**Related User Stories:** TBD (draft) · **APIs:** TBD (draft) · **Data Models:** hashtags, kudo_hashtags
**Notes:** Filter state currently lives in `feed-list.tsx` and must be lifted to the page so both
sections share it.

### F006_SecretBoxReveal — Secret Box Reveal

**Intent:** A member opens an unopened secret box and receives a randomly drawn icon (Stay Gold 30 /
Flow to Horizon 25 / Touch of Light 20 / Beyond the Boundary 10 / Revival 10 / Root Further 5), the
unopened count decrements, and the new badge appears.
**Reads:** `secret_box_icons`, `user_icon_unlocks`, `profiles.boxes_opened/boxes_unopened`.
**Writes:** `user_icon_unlocks` INSERT — **currently BLOCKED, only a SELECT policy exists**; plus a
`profiles` counter update, which the phase-0 hardening will make non-user-writable.
**Related Screens:** SCR-secret-box (J3-4YFIpMM)
**Related User Stories:** TBD (draft) · **APIs:** TBD (draft) · **Data Models:** secret_box_icons, user_icon_unlocks, profiles
**Notes:** Two MoMorph security test cases forbid client-side manipulation of the badge and the
counter → the draw MUST be server-side (`security definer` RPC or service-role Server Action).
`sidebar-gift-dialog.tsx` today implements the REVEAL modal, not the unopened state.

## Out of this batch

Profiles privilege-escalation hardening is a **plan phase (phase 0)**, not a feature — it corrects an
existing table's policy rather than adding product behavior. Gift/prize leaderboard has no table and
is deferred. Realtime subscriptions are NOT adopted (no table is in the `supabase_realtime`
publication; server-fetch is sufficient).
