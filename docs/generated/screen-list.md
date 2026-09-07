# Screen List

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-06
**Analysis Scope**: All 6 App Router pages (`app/**/page.tsx`) per route-list.md (W1, gate-passed). `app/auth/callback/route.ts` is a Route Handler, not a screen — excluded here, documented in route-list.md.

**Code Format**: All codes MUST follow `SCR###_NameSlug` format | `SCR###/REG###` for region-scoped references within a composite screen

**Note**: `feature-list.md` (Wave 5/5.6) is the only document that maps features to other artifacts. The `Owner` column in each Regions table below is back-filled from it after that gate passes — same convention as route-list.md's `Owner F###` column. A region owned jointly by several features lists them slash-separated.

**Region Guidance**: Declare a Region only when it has ≥1 independence signal (distinct API endpoint, independent loading state, independent scroll container, independent auth/permission gate, distinct business workflow, distinct mutation surface, distinct validation/action path). Shared initial payload does NOT disqualify a REG.

## Composite-Screen Detection Method (applied to every screen file)

Execution order per `composite-screen-detection.md`: H6 → H4 → H5 → H2 → H3 → H1 → 2-of-3 gate. Stack = JS/TS (React 19, Next.js 16 App Router).

| Screen        | H6 (router outlet) | H4 (tabs)                                                                                                                                                                                                                                                                                                        | H5 (wizard)      | H2 (≥2 domain modules)                                                                                      | H3 (≥3 region wrappers)                                                                                                                                                                                                                                                  | H1 (≥3 feature refs)                                                                                                                                                                                                                                                                                                                          | 2-of-3 gate                      | Verdict       |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------- |
| `/`           | N/A — no outlet    | N/A                                                                                                                                                                                                                                                                                                              | N/A              | fail (0 imports beyond `next/navigation`)                                                                   | fail (no wrappers, single `redirect()` call)                                                                                                                                                                                                                             | fail                                                                                                                                                                                                                                                                                                                                          | fail                             | atomic        |
| `/login`      | N/A                | N/A                                                                                                                                                                                                                                                                                                              | N/A              | fail (imports only `components/login/*`, one screen-scoped module)                                          | fail (3 static wrappers: header/hero/footer, all one domain)                                                                                                                                                                                                             | fail                                                                                                                                                                                                                                                                                                                                          | fail                             | atomic        |
| `/countdown`  | N/A                | N/A                                                                                                                                                                                                                                                                                                              | N/A              | fail (only `lib/countdown-config`, `components/countdown/*`)                                                | fail (1 wrapper: `<main>`)                                                                                                                                                                                                                                               | fail                                                                                                                                                                                                                                                                                                                                          | fail                             | atomic        |
| `/about`      | N/A                | N/A                                                                                                                                                                                                                                                                                                              | N/A              | fail (all imports are `components/homepage/*` / `components/common/*`, one domain: static homepage content) | pass-candidate (4 `<section>`s: Hero, Award, Kudos-promo, plus header/footer) but no independent API/mutation behind any of them — all static/mock data, so signal doesn't reflect real independence                                                                     | fail (no distinct business-logic query calls in the page file itself — zero DB reads)                                                                                                                                                                                                                                                         | fail (H3 alone insufficient)     | atomic        |
| `/award-info` | N/A                | N/A (CategoryNav is an anchor-link scrollspy via `IntersectionObserver`, not ARIA `tab`/`tabpanel` mutually-exclusive panels — ruled out explicitly, ≥1 award section is visible simultaneously, ties broken by scroll position, ties broken by scroll position; see `components/awards/category-nav.tsx:36-54`) | N/A              | fail (`components/awards/*`, `components/homepage/sunkudos-section` — one domain: static award content)     | pass-candidate (6 anchor `<section>`s in `AwardDetailSection`) but zero independent API/mutation/loading-state per section — all static, same `AWARDS` array rendered client-side                                                                                        | fail (zero DB reads in the page file)                                                                                                                                                                                                                                                                                                         | fail                             | atomic        |
| `/sun-kudos`  | N/A — no outlet    | N/A — no tab/tabpanel component anywhere in the component tree                                                                                                                                                                                                                                                   | N/A — no stepper | **fail** — all imports resolve to the single `lib/kudos/*` domain (no 2nd distinct domain module)           | **pass** — 5 distinct `<section>`/`<aside>` region wrappers at the page's direct-child level: `KvBanner`(section), `HighlightSection`(section), `SpotlightSection`(section), `AllKudosSection`(section, itself wrapping a `FeedList` `<div>` + `SidebarPanel` `<aside>`) | **pass** — page file (`app/sun-kudos/page.tsx:73-78`) directly calls 5 distinct business-logic query functions (`getHashtags`, `getKudoFeedPage`, `getHighlightKudos`, `getSpotlightBoard`, `getSidebarOverview`), each backing a functionally distinct future feature area (hashtag catalog, feed, highlight, spotlight, sidebar/secret-box) | **(H1∧H3) = true** → gate PASSES | **composite** |

`/sun-kudos` is the only composite screen. Full H1/H2/H3 evidence and REG assignment below.

## Screen Index

| Code                   | Name                     | Type          | Components               | Data Displayed                                                                                     |
| ---------------------- | ------------------------ | ------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| SCR001_RootRedirect    | Root Redirect            | atomic (stub) | 0 (server redirect only) | none                                                                                               |
| SCR002_LoginScreen     | Login                    | atomic        | 3 (header, hero, footer) | none (OAuth entry only)                                                                            |
| SCR003_CountdownScreen | Countdown (Prelaunch)    | atomic        | 2 (timer, digit box)     | Countdown units derived from `NEXT_PUBLIC_LAUNCH_AT`                                               |
| SCR004_AboutHomepage   | About / Homepage         | atomic        | 8                        | Static award + kudos-promo mock content; decorative hardcoded countdown (see Notes)                |
| SCR005_AwardInfoScreen | Award Information        | atomic        | 5                        | Static 6-category award detail content                                                             |
| SCR006_SunKudosBoard   | Sun\* Kudos — Live Board | composite     | 9 top-level + 4 regions  | Hashtags, feed page, highlight kudos, spotlight nodes/count, sidebar overview (all server-fetched) |

**Total Screens**: 6

---

## SCR001_RootRedirect

**Type**: atomic (stub — never renders)

### Description

Site root. `app/page.tsx` performs a hard server-side `redirect("/login")` and returns nothing else — this screen exists only as the `/` pointer to the Login screen. Post-login routing (countdown vs. about) is decided later, by `/auth/callback` (`isBeforeLaunch()`), not by this file.

### Components

| Component                                 | Type             | Purpose                            |
| ----------------------------------------- | ---------------- | ---------------------------------- |
| RootPage (default export, `app/page.tsx`) | server component | Unconditional `redirect("/login")` |

### Data Displayed

- None.

### Routes/URLs

- `/`

### Related Screens

- SCR002_LoginScreen (unconditional redirect target)

---

## SCR002_LoginScreen

**Type**: atomic

### Description

Google OAuth sign-in entry point (`app/login/page.tsx`). Public path (`isPublicPath` in `lib/supabase/proxy.ts`). Reads the `?error=oauth_failed` search param server-side and passes it down as `initialError` so a failed OAuth round-trip shows an inline error without a client-side param read. Uses its own `components/login/*` header/footer, distinct from the shared `components/homepage/site-header.tsx` used everywhere else (no nav links, no notification/user menu — unauthenticated context).

### Components

| Component                                                      | Type   | Purpose                                                                                                                                           |
| -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SiteHeader (`components/login/site-header.tsx`)                | header | Brand logo + `LanguageSelector` only (no nav links, no notif/user menu — unauthenticated)                                                         |
| HeroSection (`components/login/hero-section.tsx`)              | hero   | Key visual, subtitle, `GoogleLoginButton`, inline `?error=oauth_failed` message                                                                   |
| GoogleLoginButton (`components/login/google-login-button.tsx`) | button | Presentational; `onClick` wired by `HeroSection` to `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: "{origin}/auth/callback" })` |
| SiteFooter (`components/login/site-footer.tsx`)                | footer | Screen-scoped footer (not read in detail this pass — file inventoried as `screen-embedded`)                                                       |

### Data Displayed

- None (no DB reads). `?error=oauth_failed` search param drives a boolean inline-error state only.

### Routes/URLs

- `/login`

### Related Screens

- SCR001_RootRedirect (entry, redirect source)
- SCR003_CountdownScreen / SCR004_AboutHomepage (post-login destination, decided by `app/auth/callback/route.ts`'s `isBeforeLaunch()`, or by the proxy's authenticated-hits-`/login` branch — see screen-flow.md Guard Logic)
- External: Google OAuth consent screen (not part of this codebase)

---

## SCR003_CountdownScreen

**Type**: atomic

### Description

Prelaunch countdown page (`app/countdown/page.tsx`). Full-bleed background art + a client-ticking DAYS/HOURS/MINUTES/SECONDS countdown to `LAUNCH_AT` (`lib/countdown-config.ts`, sourced from `NEXT_PUBLIC_LAUNCH_AT`). No `SiteHeader`/`SiteFooter` at all — fully custom full-screen layout. **Auth discrepancy** (carried forward from route-list.md): the file's own comment claims "no auth guard... per plan clarifications", but `proxy.ts`'s blanket guard protects `/countdown` like every non-public path — `[UNVERIFIED]` whether the comment is stale or intentionally describes only page-level (not proxy-level) guarding.

**Client-side auto-navigation** (new finding, not in route-list.md): `CountdownTimer` (`components/countdown/countdown-timer.tsx:47-50`) calls `router.replace("/about")` the moment its ticking `useCountdown(LAUNCH_AT)` hook reports all four units at `0` — this fires client-side, post-mount only, independent of the server-side proxy guard.

### Components

| Component                                                          | Type       | Purpose                                                                                     |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| CountdownTimer (`components/countdown/countdown-timer.tsx`)        | timer      | Ticks every second via `useCountdown(LAUNCH_AT)`; auto-`router.replace("/about")` on expiry |
| CountdownDigitBox (`components/countdown/countdown-digit-box.tsx`) | digit tile | One digit glyph, 2 per unit                                                                 |

### Data Displayed

- Days/Hours/Minutes/Seconds remaining until `LAUNCH_AT` (env-derived, not read from `event_settings.launch_at` — confirmed no query against that column exists in `app/`/`lib/`, per data-model.md MODEL009 note).

### Routes/URLs

- `/countdown`

### Related Screens

- SCR004_AboutHomepage (client-side auto-redirect on countdown expiry, `countdown-timer.tsx:49`)
- SCR002_LoginScreen (reachable if session expires mid-countdown — proxy guard)

---

## SCR004_AboutHomepage

**Type**: atomic

### Description

Post-login landing page once the event has launched (`app/about/page.tsx`, route name `homepage` in route-list.md). Composes a hero (key visual + a **second, independent, hardcoded countdown** — see Notes), a static award-system teaser, a static Sun\* Kudos promo, and a floating action-button widget that opens two modals. **Auth discrepancy** (carried forward): page comment says "Homepage lives at /about... users reach this page after login" with no explicit guard claim of its own, but `award-info/page.tsx`'s comment explicitly (and incorrectly, relative to shipped `proxy.ts`) calls `/` "unguarded" — the proxy in fact guards every one of these paths.

**Notable finding (new this pass):** `components/homepage/hero-info-block.tsx:11` hardcodes its own `EVENT_DATE = new Date("2026-12-26T18:30:00+07:00")` for a decorative "days/hours/minutes to the ceremony" widget — this is a **third, separate** date value from `NEXT_PUBLIC_LAUNCH_AT` (drives `/countdown` + the post-login routing gate) and from `event_settings.launch_at` (unread, per data-model.md). All three are independent and none derive from another. `[UNVERIFIED]` whether this is intentional (ceremony date vs. site-launch date are genuinely different real-world events) or an unreconciled duplication — flagged, not resolved, in this draft.

### Components

| Component                                                    | Type                   | Purpose                                                                           |
| ------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------- |
| SiteHeader (`components/homepage/site-header.tsx`)           | header                 | Full header: logo, `NavLinks`, `NotificationMenu`, `LanguageSelector`, `UserMenu` |
| HeroSection (`components/homepage/hero-section.tsx`)         | hero                   | Key visual + `HeroInfoBlock` (hardcoded-date countdown) + `HeroCta`               |
| HeroInfoBlock (`components/homepage/hero-info-block.tsx`)    | countdown widget       | Ticks once/minute toward hardcoded `EVENT_DATE` (see Notes)                       |
| HeroCta (`components/homepage/hero-cta.tsx`)                 | CTA row                | Links to `/award-info` and `/sun-kudos`                                           |
| AwardSection (`components/homepage/award-section.tsx`)       | static list            | 6 award cards (2 rows of 3), all mock/static data                                 |
| SunkudosSection (`components/homepage/sunkudos-section.tsx`) | promo banner           | Static promo image + link to `/sun-kudos`                                         |
| SiteFooter (`components/common/site-footer.tsx`)             | footer                 | Shared footer, `ROUTERS`-driven nav                                               |
| WidgetButton (`components/homepage/widget-button.tsx`)       | floating action button | Toggles `SaaRulesDrawer` and `KudosFormModal` (see Modals below)                  |

### Data Displayed

- None from the database — award content, hero countdown, and kudos-promo are all static/mock (verbatim Figma extraction per source comments).

### Routes/URLs

- `/about`

### Related Screens

- SCR005_AwardInfoScreen (nav link, footer link, `HeroCta`)
- SCR006_SunKudosBoard (nav link, footer link, `HeroCta`, `SunkudosSection` promo link)
- SCR002_LoginScreen (session-expired path via proxy)

### Modals owned by this screen (not their own SCR/REG — see rationale in Notes section at end of document)

- **SaaRulesDrawer** (`components/homepage/saa-rules-drawer.tsx`) — slide-in drawer, opened from `WidgetButton`. Static/read-only rules content (hero-badge tiers + collectible icons + national-kudos copy). Its own "Write KUDOS" footer button closes the drawer and opens `KudosFormModal` (`widget-button.tsx:57-61`).
- **KudosFormModal** (`components/kudos/kudos-form-modal.tsx`) — same shared component as SCR006's write-kudos modal; here it is opened with no `hashtags` prop (defaults to `[]` — `kudos-form-modal.tsx:38`), so the hashtag picker on this instance has no rows, unlike the SCR006 instance. Submits via `submitKudoAction` (ROUTE002).

---

## SCR005_AwardInfoScreen

**Type**: atomic

### Description

Static award-system detail page (`app/award-info/page.tsx`). Sticky left category nav (anchor-link scrollspy, `IntersectionObserver`-driven — explicitly NOT an H4 tab pattern, since all 6 award sections render simultaneously and scrolling reveals them, no mutually-exclusive panel switching) alongside the 6 award detail cards. **Auth discrepancy** (carried forward): page comment explicitly claims "Presentational, no auth guard... a real guard is deferred to a later auth epic" — stale relative to the shipped blanket `proxy.ts` guard.

### Components

| Component                                                         | Type                   | Purpose                                                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SiteHeader (`components/homepage/site-header.tsx`)                | header                 | Same shared full header as SCR004/SCR006                                                                                                                                                                                               |
| KeyvisualBanner (`components/awards/keyvisual-banner.tsx`)        | hero banner            | Static keyvisual art                                                                                                                                                                                                                   |
| CategoryNav (`components/awards/category-nav.tsx`)                | scrollspy nav          | Anchor links to the 6 award sections; `IntersectionObserver` sets active state, click suppresses the observer for 800ms during smooth-scroll                                                                                           |
| AwardDetailSection (`components/awards/award-detail-section.tsx`) | static list            | 6 anchored `<section>`s, each an `AwardDetailCard`, zigzag layout                                                                                                                                                                      |
| SunkudosSection (`components/homepage/sunkudos-section.tsx`)      | promo banner           | Same shared promo as SCR004                                                                                                                                                                                                            |
| SiteFooter (`components/common/site-footer.tsx`)                  | footer                 | Shared footer                                                                                                                                                                                                                          |
| WidgetButton (`components/homepage/widget-button.tsx`)            | floating action button | **Added 2026-09-07** (previously mounted only on SCR004; the page's own docblock claimed it here before the code actually rendered it — now true). Toggles `SaaRulesDrawer` and `KudosFormModal`, same as on SCR004 — see Modals below |

### Data Displayed

- None from the database — all 6 award categories' prize amounts/quantities/images are hardcoded in `award-detail-section.tsx`'s `AWARDS` array; only i18n-resolved text is dynamic (locale, not DB).

### Routes/URLs

- `/award-info`

### Related Screens

- SCR004_AboutHomepage (nav link, footer link)
- SCR006_SunKudosBoard (nav link, footer link, `SunkudosSection` promo)

### Modals owned by this screen (not their own SCR/REG — see rationale in Notes section at end of document)

- **SaaRulesDrawer** (`components/homepage/saa-rules-drawer.tsx`) — same shared drawer as SCR004's, opened from this screen's own `WidgetButton` instance.
- **KudosFormModal** (`components/kudos/kudos-form-modal.tsx`) — opened with no `hashtags` prop (defaults to `[]`), same as the SCR004 instance. Submits via `submitKudoAction` (ROUTE002).

---

## SCR006_SunKudosBoard

**Type**: composite

### Description

`app/sun-kudos/page.tsx` — Sun\* Kudos "Live board". Server component: fetches 5 distinct read queries (`getHashtags`, `getKudoFeedPage`, `getHighlightKudos`, `getSpotlightBoard`, `getSidebarOverview`) plus a viewer-id gate, then renders 4 independently-signaled content regions (see Regions table) inside a shared page shell. **Auth reality** (carried forward from route-list.md, re-confirmed by reading the page source in full): guarded TWICE — once by `proxy.ts`'s blanket guard (like every non-public path) and again by this page's own `getViewerId()` + `redirect("/login")` (`app/sun-kudos/page.tsx:68-71`), explicitly commented as "defense in depth, not the primary gate." This contradicts an earlier feature-spec claim of "no login required" (FR-101/FR-601, per the page's own comment) — the shipped behavior is guarded, deliberately, not a bug.

### Components

| Component                                                                                                                          | Type                   | Purpose                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SiteHeader (`components/homepage/site-header.tsx`)                                                                                 | header                 | Shared full header                                                                                                                                                                            |
| KvBanner (`components/kudos-board/kv-banner.tsx`)                                                                                  | hero banner            | Decorative, read-only, no independence signals — NOT a region (see Notes)                                                                                                                     |
| WriteKudosBar (`components/kudos-board/write-kudos-bar.tsx`) → WriteKudosBarButton (`components/kudos/write-kudos-bar-button.tsx`) | action bar             | Give-kudos CTA pill; own server-side `getHashtags()` fetch, own client `open` state; opens `KudosFormModal`. NOT a region (see Notes)                                                         |
| HighlightSection (`components/kudos-board/highlight-section.tsx`) → HighlightCarousel                                              | **REG001**             | See Regions                                                                                                                                                                                   |
| SpotlightSection (`components/kudos-board/spotlight-section.tsx`) → SpotlightBoard                                                 | **REG002**             | See Regions                                                                                                                                                                                   |
| AllKudosSection (`components/kudos-board/all-kudos-section.tsx`) → FeedList                                                        | **REG003**             | See Regions                                                                                                                                                                                   |
| AllKudosSection → SidebarPanel                                                                                                     | **REG004**             | See Regions                                                                                                                                                                                   |
| SiteFooter (`components/common/site-footer.tsx`)                                                                                   | footer                 | Shared footer                                                                                                                                                                                 |
| WidgetButton (`components/homepage/widget-button.tsx`)                                                                             | floating action button | **Added 2026-09-07** (previously mounted only on SCR004). A second, independent entry point into `SaaRulesDrawer`/`KudosFormModal` alongside `WriteKudosBar`'s own trigger — see Modals below |

### Data Displayed

- Hashtags (13 canonical rows, `getHashtags()`)
- Kudos feed page (`getKudoFeedPage`, keyset-paginated)
- Highlight kudos (`getHighlightKudos`, top 5 by hearts, hashtag-filtered)
- Spotlight nodes + unfiltered total count (`getSpotlightBoard`, BR-005)
- Sidebar overview (`getSidebarOverview`: kudos received/sent, hearts received + special-day x2 flag, secret-box opened/unopened counts)

### Routes/URLs

- `/sun-kudos`
- `/sun-kudos?tag={hashtagId}` — deep-link filter state, see screen-flow.md § Deep-Link State Restoration

### Related Screens

- SCR004_AboutHomepage (nav link, footer link, entry from promo)
- SCR005_AwardInfoScreen (nav link, footer link)
- SCR002_LoginScreen (both guard paths redirect here on no session)

### Regions

| Code   | Label              | Owner          | Independence Signals                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REG001 | HighlightCarousel  | F004/F005      | Distinct server read `getHighlightKudos()` (`app/sun-kudos/page.tsx:76`, top-5-by-hearts, already hashtag-filtered); own client slide-index state (`highlight-carousel.tsx:32`); the whole carousel remounts (and resets to slide 1) on any filter change via a `key` prop (`highlight-section.tsx:90`); an independent, client-only `department` filter local to this region (`highlight-section.tsx:34`, narrows only the already-fetched 5 rows, no re-query)           |
| REG002 | SpotlightNameCloud | F002           | Distinct server read `getSpotlightBoard()` (`app/sun-kudos/page.tsx:77`, every distinct recipient + an unfiltered `COUNT(*)`, BR-005 — invariant under the hashtag filter, unlike REG001/REG003); own pan/zoom + search client state via `useSpotlightPanZoom` (`spotlight-board.tsx:36-44`); does not consume the shared hashtag URL filter at all                                                                                                                        |
| REG003 | AllKudosFeed       | F002/F004/F005 | Distinct read via Server Action `loadFeedPage()` (ROUTE007, `feed-list.tsx:77`) for every page after the first; independent scroll container via its own `IntersectionObserver` sentinel (`feed-list.tsx:93-95`); independent loading state (`isFetchingRef`/`useTransition`, `feed-list.tsx:41,49`); shares the hashtag URL filter with REG001 (allowed — shared initial payload/filter state does not disqualify a REG when mutation/loading/scroll independence exists) |
| REG004 | Sidebar            | F006           | Distinct mutation surface: `openSecretBox()` / `getSecretBoxStatus()` (ROUTE005/ROUTE006, `sidebar-gift-dialog.tsx:50,64`) — a business workflow (secret-box draw) entirely separate from feed/highlight/spotlight reads; own client dialog-open state (`sidebar-stats.tsx:26`); currently-empty leaderboards (`sidebar-panel.tsx:25-34`, no backing table this batch, BR-006/D002 — always renders empty state)                                                           |

### Modals owned by this screen or its regions (not their own SCR/REG — see rationale below)

- **KudosFormModal** (`components/kudos/kudos-form-modal.tsx`) — opened from `WriteKudosBarButton` (a screen-level action bar, not a region). Submits via `submitKudoAction` (ROUTE002). Same component reused on SCR004 (see that screen's Modals note) — distinct props each time (this instance receives real `hashtags`).
  - **AddlinkBox** (`components/kudos/addlink-box.tsx`) — nested modal-on-modal, rendered only while `KudosFormModal`'s content editor has it open (`kudos-form-modal.tsx:44,156-157`). Pure client-state (inserts `{text, url}` into the parent form's message field via `onInsert`); makes no API call of its own.
- **SaaRulesDrawer + a second `KudosFormModal` instance** — opened from this screen's own `WidgetButton` (added 2026-09-07, same component/behavior as SCR004's — that instance receives no `hashtags` prop, unlike `WriteKudosBar`'s).
- **SidebarGiftDialog + SecretBoxRevealPanel** (`components/kudos-board/sidebar-gift-dialog.tsx`, `secret-box-reveal-panel.tsx`) — owned by **REG004_Sidebar**, opened from `SidebarStats` (`sidebar-stats.tsx:73-75`). Two-state shell ("unopened" / "revealed") over the `openSecretBox()`/`getSecretBoxStatus()` mutation surface already counted as REG004's independence signal.
- **FeedImageLightbox** (`components/kudos-board/feed-image-lightbox.tsx`) — owned by **REG003_AllKudosFeed**, opened per-attachment from `KudoPostCard` (`feed-kudo-post-card.tsx:90-93,154-159`). Pure client-state full-size image viewer, no API call.

---

## Notes — Modal / Dialog / Header-Dropdown Classification (project-wide)

Applied uniformly, not per-screen, since several of these components are shared across screens:

1. **Write-Kudo modal (`KudosFormModal`) — classified as a screen-owned modal, not a SCR or REG.** It is a transient, centered overlay with no persistent on-page footprint when closed, instantiated from **four** trigger points as of 2026-09-07 (`WidgetButton` on SCR004/SCR005/SCR006, plus SCR006's own `WriteKudosBar` — `WidgetButton` was previously mounted only on SCR004; see each screen's Modals note). A modal is not "content the screen renders" in the sense the Region Guidance table means (no independent scroll container, no independent loading state visible while closed) — its one real independence signal (a distinct mutation surface, `submitKudoAction`/ROUTE002) is a property of the _action_, not of a persistent content zone, so it is documented under each owning screen instead of numbered.
2. **Addlink Box (`AddlinkBox`) — classified as a nested modal, not a SCR or REG.** It is modal-on-modal (only ever rendered while `KudosFormModal` is open), makes zero API calls, and only ever mutates the parent form's local draft state. No independence signal at all beyond "different popup" — visual separation alone is explicitly insufficient per the Region Guidance rule.
3. **Secret-box dialog + reveal panel (`SidebarGiftDialog`, `SecretBoxRevealPanel`) — classified as owned by REG004_Sidebar, not its own REG.** It does carry a real mutation surface (ROUTE005/006), but that signal is already what makes REG004 (the persistent Sidebar panel it is triggered from) independent — promoting the modal itself to a second REG would double-count the same signal and violate REG nesting (forbidden per the Composite Hard Guard). The Sidebar panel's "Open Secret Box" button is the on-page footprint; the dialog is its transient detail view.
4. **SAA rules drawer (`SaaRulesDrawer`) — classified as a screen-owned drawer wherever `WidgetButton` mounts, not a SCR or REG.** Originally SCR004-only; as of 2026-09-07 `WidgetButton` (and with it, this drawer) also mounts on SCR005 and SCR006 (see each screen's own Modals note). SCR004/SCR005 are atomic (no other region to nest under); SCR006 is composite, but the drawer still fails every independence signal in the Region Guidance table on its own merits regardless of the host screen — entirely static/read-only content (badge tiers, collectible icons) with zero API calls.
5. **Feed image lightbox (`FeedImageLightbox`) — classified as owned by REG003_AllKudosFeed, not its own REG.** Pure client-state image viewer (no fetch, no mutation, no independent scroll), opened per-attachment from a card already inside REG003. No independence signal beyond visual separation.
6. **Header dropdowns (`LanguageSelector`, `NotificationMenu`, `UserMenu`) — classified as shared shell-chrome elements attached to `SiteHeader`, not SCR/REG on any individual screen.** All three render inside the persistent, fixed header present on SCR004/SCR005/SCR006 (`SiteHeader` full variant) or a reduced form on SCR002 (`SiteHeader` login variant: `LanguageSelector` only, no notif/user menu — correct, unauthenticated). None occupies independent scroll/loading page real estate; each is a small popover with its own local `open` boolean.
   - `LanguageSelector` has real behavior: switches the active i18next locale and persists a `NEXT_LOCALE` cookie (`language-selector.tsx:36-51`).
   - `UserMenu` has real behavior: "Sign Out" calls `supabase.auth.signOut()` then `router.push("/login")` + `router.refresh()` (`user-menu.tsx:53-68`); "Profile" and "Admin Dashboard" menu items render but have no click handler wired (`user-menu.tsx:90-99` — the "Admin Dashboard" item in particular renders unconditionally for every user with no role check, per data-model.md MODEL001_PROFILES note on the unconsumed `profiles.role` column).
   - `NotificationMenu` is **presentational only** by its own source comment ("no real notification data is fetched") — it always shows an empty-state panel, despite `MODEL008_NOTIFICATIONS` existing as a live, RLS-protected table in the schema. `[UNVERIFIED]` whether this is a known, deferred gap or an oversight — flagged, not resolved, in this draft.
7. **KvBanner and WriteKudosBar on SCR006 — explicitly evaluated and rejected as regions.** `KvBanner` is purely decorative (a title + background image + logo lockup) with zero independence signals. `WriteKudosBar` does have one thin signal (its own server-side `getHashtags()` fetch, independent of the page-level one passed to REG001/REG003) but no independent _display_ — it is a single action row, not a content panel, and its only meaningful behavior (opening `KudosFormModal`) is already documented under Modals above.

## Summary

- **Total Screens**: 6 (5 atomic, 1 composite)
- **Total Regions**: 4 (all under SCR006_SunKudosBoard)
- **Total Modals/Dialogs documented**: 6 (KudosFormModal ×4 instantiation sites as of 2026-09-07 — SCR004/SCR005/SCR006's `WidgetButton` plus SCR006's `WriteKudosBar`, AddlinkBox, SidebarGiftDialog+SecretBoxRevealPanel, SaaRulesDrawer ×3 instantiation sites — same three `WidgetButton` mounts, FeedImageLightbox)
- **Header dropdowns documented**: 3 (LanguageSelector, NotificationMenu, UserMenu) — shell-chrome, not SCR/REG

---

## Cross-Reference Validation

- [x] All SCR### codes are unique (SCR001–SCR006, contiguous)
- [x] All SCR### codes are referenced in ScreenFlow.md
- [x] All related screen references are valid (no dangling SCR### refs)
- [x] All route URLs are properly formatted
- [ ] All SCR### codes are referenced in FeatureList.md — N/A this wave, FeatureList.md does not exist until W5
- [x] No orphaned screen references
- [x] All 4 REG### codes (REG001–REG004) are contiguous within their parent SCR006, no gaps, no duplicates
- [x] No REG### nesting (all 4 regions are flat siblings under SCR006, including Feed/Sidebar which sit side-by-side inside `AllKudosSection` but are never nested inside a parent "AllKudosSection" REG)
