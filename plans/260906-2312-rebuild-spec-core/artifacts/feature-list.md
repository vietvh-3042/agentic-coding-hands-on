# Feature List

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-07
**Analysis Scope**: All artifacts under this plan's `artifacts/` — `user-stories.md` (US001–US024,
gate-passed), `screen-list.md` (SCR001–SCR006, REG001–REG004), `behavior-logic.md` (BL001–BL004),
`permissions-matrix.md` (PERM001–PERM015), `route-list.md`/`api-map.md` (ROUTE001–ROUTE007),
`data-model.md` (MODEL001–MODEL009 + `PROFILE_KUDO_STATS` view). Clustered per the Feature Clustering
Rule (`references/code-formats.md`) — grouped by PRIMARY BUSINESS INTENT, never by screen, artifact
volume, or implementation layer.

**The six already-promoted features are frozen** (already promoted to `docs/features/F00{1..6}_*/`, cross-referenced from
`docs/_canonical-fcodes.json`) — carried forward verbatim on code/name/priority/type, with their
Related-refs refreshed against this run's richer artifacts (this run's SCR/US/ROUTE/MODEL/BL/PERM
codes replace the prior pass's Figma-ID-style references; nothing renumbered).

**Workspace**: single-package repo — root `package.json`, no monorepo. Stated once here, applied
consistently as `agentic-coding-hands-on (repo root)` for every row below.

**Code Format**: All codes MUST follow `F###_NameSlug` format (e.g. `F###_Auth`, `F###_UserProfile`)
**Screen Code Format**: All screen codes MUST follow `SCR###_NameSlug` format (e.g., SCR001_LoginForm)
**User Story Code Format**: All US codes MUST follow `US###_NameSlug` format (e.g., US001_Login)
**Background Logic Code Format**: All BL codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport)
**Permission Code Format**: All PERM codes MUST follow `PERM###_NameSlug` format (e.g., PERM001_ViewReports)

**Feature Types**:

- `ui` - Feature has UI screens (SCR###)
- `background` - Feature only has background logic (BL###, no SCR###) — extended this run to also
  cover a feature whose only evidence is PERM###/MODEL### (no SCR###, no BL### either): the three
  Not-Implemented features at the foot of the hierarchy table are declared-but-unimplemented surfaces with zero UI and zero trigger/RPC logic; `background`
  is the closer of the two labels (non-UI), not a perfect taxonomy fit — flagged in Cross-Reference.
- `mixed` - Feature has both UI screens and background logic

**Related Screens column format**: Accepts `SCR###`, `SCR###/REG###`, or mixed comma-separated. A
screen referenced by more than one Feature (e.g. `SCR004_AboutHomepage` under Google Sign-In, Kudo
Authoring, Homepage Overview and Interface Localization)
is expected here — shared header/footer/dialog chrome genuinely carries distinct business logic for
each owning Feature, not a clustering error.

**Note on this run's judgment calls** (see Cross-Reference for full rationale):

1. Client-side navigation stories (US005/US006/US007) are folded into the FEATURE whose content the
   navigation leads to, not kept as a standalone "navigation" feature — same reasoning IPE Wave 4
   applied at the US level, one level up.
2. US004 (Sign Out) folds into Google Sign-In — same actor, same Supabase Auth session lifecycle,
   opposite end of the same outcome that feature's own description already names ("the resulting
   session gates every other route").
3. Three new features — Profile Self-Service, In-App Notifications and Admin Role Gate — register
   PERM###/MODEL### items that have zero consuming UI/BL —
   `profiles.role` (admin gate), `notifications` (in-app notification center), and the
   `display_name`/`avatar_url`/`language` owner-update RLS policy — each marked **Not Implemented**
   in its own Type/Description per this run's explicit instruction, rather than silently omitted or
   force-fit into an unrelated feature.

## Feature Hierarchy

**Note**: Ordered by F### code, NOT by priority — the first six codes are frozen against
`docs/_canonical-fcodes.json` and the already-promoted `docs/features/` folders.

> **Do not reintroduce an `F###` token anywhere above this table.** `renumber_artifact_ids.py`
> builds its map from first appearance in prose, so a code cited in the preamble — even inside a
> range like the frozen set, or a format example — reorders the whole set and silently renames the
> promoted features.

| Code | Name                         | Type       | Language             | Workspace                           | Priority |
| ---- | ---------------------------- | ---------- | -------------------- | ----------------------------------- | -------- |
| F001 | Google Sign-In               | mixed      | TypeScript, PL/pgSQL | agentic-coding-hands-on (repo root) | P1       |
| F002 | Kudos Board Data             | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P0       |
| F003 | Kudo Authoring               | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P0       |
| F004 | Kudo Hearts                  | mixed      | TypeScript, PL/pgSQL | agentic-coding-hands-on (repo root) | P1       |
| F005 | Hashtag Taxonomy & Filtering | mixed      | TypeScript           | agentic-coding-hands-on (repo root) | P1       |
| F006 | Secret Box Reveal            | mixed      | TypeScript, PL/pgSQL | agentic-coding-hands-on (repo root) | P2       |
| F007 | Homepage Overview            | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P1       |
| F008 | Award Information Browsing   | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P1       |
| F009 | Interface Localization       | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P2       |
| F010 | Prelaunch Countdown Gate     | ui         | TypeScript           | agentic-coding-hands-on (repo root) | P2       |
| F011 | Profile Self-Service         | background | TypeScript           | agentic-coding-hands-on (repo root) | P3       |
| F012 | In-App Notifications         | background | TypeScript           | agentic-coding-hands-on (repo root) | P3       |
| F013 | Admin Role Gate              | background | TypeScript           | agentic-coding-hands-on (repo root) | P3       |

## Feature Details

### F001: Google Sign-In

**Type**: mixed
**Priority**: P1
**Description**: Sun\* members sign in to SAA 2025 with a Google account via Supabase Auth; the
resulting session gates every other route. Includes the reverse of the same session lifecycle — Sign
Out (US004) — since ending a session is the same business outcome's counterpart, not a distinct one.
`/` (SCR001) is the unconditional server-redirect entry point into this flow.

**Related Screens**:

- SCR001_RootRedirect: unconditional `redirect("/login")` entry point (`[IPE_ZERO]`, no US)
- SCR002_LoginScreen: Google OAuth button + inline error state
- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: "Sign out" in shared `UserMenu` chrome (US004)

**Related User Stories**:

- US001_SignInWithGoogle
- US002_CompleteGoogleSignIn
- US004_SignOut

**Related APIs/Routes**:

- (GET) /auth/callback — ROUTE001

**Related Data Models**:

- MODEL001_PROFILES (row created by BL001 on first sign-in)

**Related Background Logic**:

- BL001_CreateProfileOnSignup

**Related Permissions**:

- PERM001_GlobalSessionGate

---

### F002: Kudos Board Data

**Type**: ui
**Priority**: P0
**Description**: A member opens `/sun-kudos` and sees real data — the All-Kudos feed (infinite scroll,
`created_at DESC`), the Highlight carousel (top 5 by hearts, event-wide, with a client-only
department narrow), the Spotlight name cloud (search/zoom/pan) plus its total count, the sidebar
stats read-model, per-kudo share-link copy, and the attached-image lightbox. The sidebar
leaderboards are NOT part of this — they have no backing table this batch and always render
their empty state (`sidebar-panel.tsx:25-34`, screen-list REG004 / BR-006 / D002). Owns the bare
`SCR006_SunKudosBoard` shell and the REG002 (Spotlight)/REG003 (Feed) regions outright; shares
REG001 (Highlight) with F005 (filtering) and REG003 with F004 (hearts)/F005. Retires
`feed-mock-data.ts`, `highlight-mock-data.ts` and `spotlight-mock-data.ts`.

**Related Screens**:

- SCR006_SunKudosBoard (bare shell), SCR006_SunKudosBoard/REG002, SCR006_SunKudosBoard/REG003
- SCR004_AboutHomepage, SCR005_AwardInfoScreen: nav link / promo banner entry point (US007)

**Related User Stories**:

- US007_ViewSunKudosBoard
- US014_FilterHighlightKudosByDepartment
- US015_BrowseHighlightCarousel
- US016_CopyKudoShareLink
- US018_SearchSpotlightBoard
- US019_ZoomSpotlightBoard
- US020_PanSpotlightBoard
- US023_ViewKudoAttachedImage
- US024_LoadMoreKudosInFeed

**Related APIs/Routes**:

- (Server Action) loadFeedPage(cursor, filter) — ROUTE007

**Related Data Models**:

- MODEL001_PROFILES (sender/receiver display data)
- MODEL002_KUDOS
- PROFILE_KUDO_STATS (view; sidebar stats/leaderboard read-model — no MODEL### code assigned, see data-model.md)

**Related Background Logic**:

- — (none owned directly; BL002/BL004, owned by F004, keep `kudos.hearts_count` accurate for the counts this feature displays)

**Related Permissions**:

- PERM002_SunKudosDefenseInDepthGate
- PERM003_ProfilesReadAll
- PERM013_ProfileKudoStatsViewReadAll

---

### F003: Kudo Authoring

**Type**: ui
**Priority**: P0
**Description**: A member writes a kudo to a colleague: recipient picker, message body capped at 500
characters and re-validated server-side, up to 5 hashtags, images, and an inserted link. Includes the
Addlink Box. Reused on both `/about` (no hashtags preloaded) and `/sun-kudos` (13 canonical hashtags
preloaded) — same modal component, two trigger points. Retires `kudos-mock-data.ts`.

**Related Screens**:

- SCR004_AboutHomepage, SCR006_SunKudosBoard

**Related User Stories**:

- US010_OpenKudoComposer
- US011_PostAKudo
- US012_InsertLinkIntoKudoMessage

**Related APIs/Routes**:

- (Server Action) submitKudoAction(formData) — ROUTE002

**Related Data Models**:

- MODEL002_KUDOS
- MODEL004_HASHTAGS
- MODEL005_KUDO_HASHTAGS

**Related Background Logic**:

- —

**Related Permissions**:

- PERM005_KudosReadAllInsertOwn
- PERM007_HashtagsReadOnly
- PERM008_KudoHashtagsReadInsertBySender

---

### F004: Kudo Hearts

**Type**: mixed
**Priority**: P1
**Description**: A member hearts or un-hearts a kudo. One heart per user per kudo; a member's own
kudos disable the control; a heart credits the SENDER +1, or +2 on an admin-configured special day;
un-hearting revokes whichever amount was granted. The multiplier is resolved server-side from
`event_settings` by a BEFORE INSERT trigger, so it can never be client-supplied.

**Related Screens**:

- SCR006_SunKudosBoard/REG001, SCR006_SunKudosBoard/REG003

**Related User Stories**:

- US017_ReactToKudoWithHeart

**Related APIs/Routes**:

- (Server Action) heartKudo(kudoId) — ROUTE003
- (Server Action) unheartKudo(kudoId) — ROUTE004

**Related Data Models**:

- MODEL002_KUDOS (`hearts_count`, denormalized)
- MODEL003_KUDO_HEARTS
- MODEL009_EVENT_SETTINGS (`special_day_start`/`special_day_end`)

**Related Background Logic**:

- BL002_SyncKudoHeartsCount
- BL003_ResolveHeartValueSecurityDefiner (superseded, kept per BL Rule C1)
- BL004_ResolveHeartValueNoDefiner (current)

**Related Permissions**:

- PERM006_KudoHeartsOwnershipCrud
- PERM012_EventSettingsReadOnly

---

### F005: Hashtag Taxonomy & Filtering

**Type**: mixed
**Priority**: P1
**Description**: One master hashtag list (13 Vietnamese entries) drives both dropdowns — the board
filter (single-select, closes on pick) and the write-form picker (shared with F003, max 5, disabled
at 5). Selecting a hashtag anywhere re-filters the Highlight carousel and the All-Kudos feed together
and resets the carousel to page 1. Retires the hardcoded `SAA_HASHTAGS` in `constants/index.ts`.

**Related Screens**:

- SCR006_SunKudosBoard/REG001, SCR006_SunKudosBoard/REG003

**Related User Stories**:

- US013_FilterKudosByHashtag

**Related APIs/Routes**:

- — (client `router.replace` on the `?tag=` search param; no Server Action)

**Related Data Models**:

- MODEL004_HASHTAGS
- MODEL005_KUDO_HASHTAGS

**Related Background Logic**:

- — (none. **Type is `mixed` with zero BL###** — flagged here the same way the Not-Implemented features flag their `background` type. F005's non-screen evidence is RLS/GRANT policy (PERM007, PERM008), not a trigger or job — `hashtags` and `kudo_hashtags` carry no trigger and no scheduled work, so there is nothing for BehaviorLogic to own. The `mixed` type is frozen against `docs/_canonical-fcodes.json` and is not retyped.)

**Related Permissions**:

- PERM007_HashtagsReadOnly
- PERM008_KudoHashtagsReadInsertBySender

---

### F006: Secret Box Reveal

**Type**: mixed
**Priority**: P2
**Description**: A member opens an unopened secret box and receives a randomly drawn icon (Stay Gold
30 / Flow to Horizon 25 / Touch of Light 20 / Beyond the Boundary 10 / Revival 10 / Root Further 5);
the unopened count decrements and the new badge appears. The draw runs server-side in a
`security definer` RPC — row-locked and atomic, idempotent on an already-owned icon. Badge artwork
does not yet exist, so the reveal renders a name-text fallback.

**Related Screens**:

- SCR006_SunKudosBoard/REG004

**Related User Stories**:

- US021_OpenSecretBoxDialog
- US022_DrawFromSecretBox

**Related APIs/Routes**:

- (Server Action) openSecretBox() — ROUTE005
- (Server Action) getSecretBoxStatus() — ROUTE006

**Related Data Models**:

- MODEL001_PROFILES (`boxes_opened`/`boxes_unopened` counters)
- MODEL006_SECRET_BOX_ICONS
- MODEL007_USER_ICON_UNLOCKS

**Related Background Logic**:

- — (none. **Type is `mixed` with zero BL###** — flagged here the same way the Not-Implemented features flag their `background` type. F006's non-screen evidence is the `open_secret_box()` `security definer` RPC, which `behavior-logic.md` deliberately classifies as an access-control boundary (PERM014) rather than background logic — a caller-invoked RPC is not a trigger or a job. The `mixed` type is frozen against `docs/_canonical-fcodes.json` and is not retyped.) (the `open_secret_box()` RPC fits no canonical BL type; its access-control shape is documented under PERM014 instead — see `behavior-logic.md`'s own classification decision)

**Related Permissions**:

- PERM009_SecretBoxIconsReadOnly
- PERM010_UserIconUnlocksReadOnly
- PERM014_OpenSecretBoxRpcBoundary

---

### F007: Homepage Overview

**Type**: ui
**Priority**: P1
**Description**: Signed-in members land on `/about` (after login, or after the `/countdown` timer
expires) and see the post-login overview: a hero key visual with a decorative, hardcoded "days to
ceremony" widget (independent of the countdown's own launch date), a static 6-award teaser grid, a
Sun\* Kudos promo banner, and a floating widget button that opens the read-only SAA Rules drawer
(hero-tier badges, 6 collectible icons, national-kudos copy). All content is static/mock — zero DB
reads back this screen. A distinct business outcome from F008 (award category detail) and F002
(live kudos data), even though all three share the same header/footer chrome.

**Related Screens**:

- SCR004_AboutHomepage

**Related User Stories**:

- US005_ViewHomepage
- US009_ViewSaaRules

**Related APIs/Routes**:

- —

**Related Data Models**:

- —

**Related Background Logic**:

- —

**Related Permissions**:

- —

---

### F008: Award Information Browsing

**Type**: ui
**Priority**: P1
**Description**: A member reads the Award Information page — 6 hardcoded award categories (prize
amount/quantity/images) presented as zigzag detail cards behind a sticky, scrollspy category nav that
smooth-scrolls to and highlights each section on click or manual scroll. All content is static; zero
DB reads.

**Related Screens**:

- SCR005_AwardInfoScreen

**Related User Stories**:

- US006_ViewAwardInformation
- US008_BrowseAwardCategories

**Related APIs/Routes**:

- —

**Related Data Models**:

- —

**Related Background Logic**:

- —

**Related Permissions**:

- —

---

### F009: Interface Localization

**Type**: ui
**Priority**: P2
**Description**: Every screen exposes a VN/EN language selector in the shared header chrome; switching
calls `i18n.changeLanguage()` (immediate re-render of all translated text) and persists the choice to
a `NEXT_LOCALE` cookie (1-year `max-age`, `path=/`) so SSR reads it back on reload; `<html lang>` stays
in sync. Default is VN when no cookie is present. **Note**: despite `profiles.language` existing as a
column with an owner-scoped UPDATE RLS policy (PERM004), this component writes ONLY the cookie —
grep-confirmed no `profiles` table write anywhere in `language-selector.tsx`. See F011 for the
unconsumed DB-write path.

**Related Screens**:

- SCR002_LoginScreen, SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard

**Related User Stories**:

- US003_SwitchInterfaceLanguage

**Related APIs/Routes**:

- —

**Related Data Models**:

- —

**Related Background Logic**:

- —

**Related Permissions**:

- —

---

### F010: Prelaunch Countdown Gate

**Type**: ui
**Priority**: P2
**Description**: Before the event launches, `/countdown` renders a full-bleed, client-ticking
DAYS/HOURS/MINUTES/SECONDS countdown to `NEXT_PUBLIC_LAUNCH_AT`; the moment all four units reach zero,
the page client-side `router.replace("/about")`s. Zero interactive elements — the only "interaction"
is the automatic expiry redirect, so no US### maps here (`[IPE_ZERO]` per `user-stories.md`'s Screen→US
Map). Still guarded by `proxy.ts`'s blanket session gate (owned by F001) despite the page's own stale
comment claiming otherwise.

**Related Screens**:

- SCR003_CountdownScreen

**Related User Stories**:

- — (none; `[IPE_ZERO]`)

**Related APIs/Routes**:

- —

**Related Data Models**:

- —

**Related Background Logic**:

- —

**Related Permissions**:

- —

---

### F011: Profile Self-Service

**Type**: background
**Priority**: P3
**Status**: **Not implemented.** The schema already supports a signed-in user updating exactly three
columns on their own `profiles` row — `display_name`, `avatar_url`, `language` — column-level RLS +
GRANT are live, but no profile-edit screen, form, or Server Action exists anywhere in `app/` or
`components/`. The only observed write attempt at any of these three columns is `language`, and that
happens client-side to a cookie only (F009) — zero code paths write to the `profiles` table today.
Registered here per this run's instruction to mark a declared-but-unimplemented surface plainly,
rather than silently drop `PERM004` or force it into an unrelated feature.

**Related Screens**:

- — (none; no profile-edit screen exists)

**Related User Stories**:

- —

**Related APIs/Routes**:

- —

**Related Data Models**:

- MODEL001_PROFILES (`display_name`, `avatar_url`, `language` columns)

**Related Background Logic**:

- —

**Related Permissions**:

- PERM004_ProfilesOwnerColumnUpdate

---

### F012: In-App Notifications

**Type**: background
**Priority**: P3
**Status**: **Scaffolded, not implemented.** `notifications` is a live, RLS-protected table (self-
scoped SELECT/UPDATE, zero `anon` access — the only table with no anonymous grant at all), but
`NotificationMenu` — the only UI surface that could consume it — always renders a hardcoded empty
state per its own source comment; no query against this table exists anywhere in `app/`,
`components/`, or `lib/`.

**Related Screens**:

- — (`NotificationMenu` is inert shell chrome on `SiteHeader`, not its own SCR/REG per `screen-list.md`; carries no US per `user-stories.md`'s Inert Elements table)

**Related User Stories**:

- —

**Related APIs/Routes**:

- —

**Related Data Models**:

- MODEL008_NOTIFICATIONS

**Related Background Logic**:

- —

**Related Permissions**:

- PERM011_NotificationsOwnerOnly

---

### F013: Admin Role Gate

**Type**: background
**Priority**: P3
**Status**: **Planned, not implemented.** `profiles.role` (CHECK IN `user`,`admin`) is a real, live
column, but no RLS policy, route, or screen branches on it anywhere in the codebase —
`UserMenu`'s "Admin Dashboard" menu item renders unconditionally for every signed-in user, with no
role check and no `onClick` handler wired. Tracked as planned work
(`plans/260906-1903-profile-and-menus` phase 06, Batch B, per `permissions-matrix.md` PERM015).

**Related Screens**:

- — (the inert "Admin Dashboard" menu item is shared `UserMenu` chrome, not its own SCR/REG; carries no US per `user-stories.md`'s Inert Elements table)

**Related User Stories**:

- —

**Related APIs/Routes**:

- —

**Related Data Models**:

- MODEL001_PROFILES (`role` column)

**Related Background Logic**:

- —

**Related Permissions**:

- PERM015_AdminRoleGate

---

## Summary

- **Total Features**: 13 (F001–F013, contiguous, no gaps, no duplicates; F001–F006 frozen per this run's hard constraint)
- **Total Screens**: 6 (SCR001–SCR006) + 4 regions (REG001–REG004, all under SCR006)
- **Total User Stories**: 24 (US001–US024)
- **Total Routes**: 7 (ROUTE001–ROUTE007: 1 Route Handler + 6 Server Actions)
- **Total Data Models**: 9 tables (MODEL001–MODEL009) + 1 view (`PROFILE_KUDO_STATS`, no MODEL### code assigned per `data-model.md`)
- **Total Background Logic**: 4 (BL001–BL004)
- **Total Permissions**: 15 (PERM001–PERM015)
- **Languages Detected**: TypeScript (primary), PL/pgSQL (F001/F004/F006 core trigger/RPC logic only)

## Cross-Reference Validation

- [x] All F### codes are unique (F001–F013, contiguous)
- [x] F001–F006 unchanged from `docs/generated/feature-list.md` on code/name/priority/type; first 6 rows, in order
- [x] Every US001–US024 assigned to exactly ONE F### (verified below)
- [x] Every SCR### (SCR001–SCR006) and REG### (REG001–REG004) explained by some feature's stated intent
- [x] Every BL### (BL001–BL004) explained by some feature's stated intent
- [x] Every PERM### (PERM001–PERM015) explained by some feature's stated intent
- [x] Every MODEL### (MODEL001–MODEL009) and the uncoded `PROFILE_KUDO_STATS` view maps to ≥1 feature
- [x] Every ROUTE### (ROUTE001–ROUTE007) maps to exactly one feature
- [x] All screen references are valid (SCR### or SCR###/REG### in `screen-list.md`, gate-passed)
- [x] All user story references are valid (US### in `user-stories.md`, gate-passed)
- [x] All route references are valid (ROUTE### in `route-list.md`/`api-map.md`, gate-passed)
- [x] All data model references are valid (MODEL### in `data-model.md`, gate-passed)
- [x] All behavior logic references are valid (BL### in `behavior-logic.md`, gate-passed)
- [x] All permission references are valid (PERM### in `permissions-matrix.md`, gate-passed)

### US → F### assignment table (completeness check)

| US    | F### | US    | F### | US    | F### |
| ----- | ---- | ----- | ---- | ----- | ---- |
| US001 | F001 | US009 | F007 | US017 | F004 |
| US002 | F001 | US010 | F003 | US018 | F002 |
| US003 | F009 | US011 | F003 | US019 | F002 |
| US004 | F001 | US012 | F003 | US020 | F002 |
| US005 | F007 | US013 | F005 | US021 | F006 |
| US006 | F008 | US014 | F002 | US022 | F006 |
| US007 | F002 | US015 | F002 | US023 | F002 |
| US008 | F008 | US016 | F002 | US024 | F002 |

### Frozen-slug warning

`F005`'s canonical slug is **`F005_HashtagTaxonomy`**, pinned from `docs/_canonical-fcodes.json`
and the already-promoted `docs/features/F005_HashtagTaxonomy/` folder. The Slug Grammar in
`references/canonical-fcode-schema.md` applied to this feature's name would instead derive
`F005_HashtagTaxonomyAndFiltering` (`&` → `And`). Any tooling that re-derives a slug from `name`
rather than reading the frozen value in `_canonical-fcodes.json` will fork a second, empty feature
folder and orphan the promoted one. Read the JSON; never re-derive for the already-promoted set.

### Orphan check (explicit, per this run's instruction)

- No SCR###/REG### is unexplained: SCR001→F001, SCR002→F001, SCR003→F010,
  SCR004→F001/F002/F003/F007/F009, SCR005→F001/F002/F008/F009,
  SCR006 (+REG001–004)→F001–F006/F009 as detailed per feature above.
- No BL### is unexplained: BL001→F001; BL002, BL003, BL004→F004.
- No PERM### is unexplained: PERM001→F001; PERM002, PERM003, PERM013→F002; PERM005, PERM007, PERM008→F003
  (PERM007/PERM008 shared with F005); PERM006, PERM012→F004; PERM009, PERM010, PERM014→F006; PERM004→F011;
  PERM011→F012; PERM015→F013.
- No MODEL### is unexplained: MODEL001→F001/F002/F004/F006/F011/F013; MODEL002→F002/F003/F004;
  MODEL003→F004; MODEL004, MODEL005→F003/F005; MODEL006, MODEL007→F006; MODEL008→F012; MODEL009→F004;
  `PROFILE_KUDO_STATS`→F002.
- No ROUTE### is unexplained: ROUTE001→F001; ROUTE002→F003; ROUTE003, ROUTE004→F004; ROUTE005,
  ROUTE006→F006; ROUTE007→F002.
- **No undeclared outcome found** beyond the three already-registered not-implemented surfaces
  (F011/F012/F013) — no additional invented features for unbuilt behavior.

### Judgment calls flagged for reviewer

1. **F011–F013 type=`background` is a taxonomy stretch.** Neither has a BL### (the canonical
   trigger for `background`) — their only evidence is PERM###/MODEL###. `background` was chosen as
   the closer of the two labels (non-UI) over `ui` (no SCR### exists for any of them). Flagging
   for reviewer cross-check rather than silently picking one.
2. **US004 (Sign Out) folded into F001**, not kept as a separate "Session Management" feature —
   same actor, same Supabase Auth session lifecycle F001's own frozen description already names.
3. **Navigation-only US (US005, US006, US007) folded into their destination content feature**
   (F007, F008, F002 respectively) rather than kept as a standalone navigation feature — mirrors the
   IPE Wave 4 merge exception one level up, applied to Feature clustering instead of US clustering.
4. **PERM007/PERM008 and MODEL004/MODEL005 are dual-owned by F003 and F005** — the same hashtag
   catalog and join table back both "compose with hashtags" (F003) and "filter by hashtag" (F005);
   this is intentional, not a clustering error — two distinct business outcomes over the same data.
5. **F009's Related Data Models is empty** — `profiles.language` exists as a column with a live RLS
   UPDATE policy (PERM004), but the actual `LanguageSelector` code path never writes it (cookie-only,
   grep-confirmed). Not attaching MODEL001 to F009 to avoid overclaiming a write path that doesn't
   exist; the column is instead attached to F011 (Profile Self-Service, Not Implemented), which is
   the more accurate home for "a DB write path nothing currently exercises."

No US/SCR/BL/PERM/MODEL/ROUTE could not be placed.
