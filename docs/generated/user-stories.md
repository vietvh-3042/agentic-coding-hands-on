# User Stories

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-07
**Analysis Scope**: All 6 SCR### in `screen-list.md` (route-view/web, JS/TS). IPE protocol (`references/user-stories-ipe-protocol.md`) run in full — Step 1 (web vocabulary) → Step 2 (Interaction Inventory below) → Step 3 (one-US-per-interaction + web merge exception) → Step 4 (anti-CRUD naming) → Step 5 (threshold check + Screen→US Map). Every interaction cites its `file:line`; none invented.

**Code Format**: All US codes follow `US###_NameSlug` format.

**US Types**:

- `ui` - User-facing stories (require Screen mapping)
- `system` - System stories: hook, event, observer, bg-job, trigger, etc. (no Screen mapping needed)

**Note**: Feature mapping is managed in FeatureList.md (Wave 5/5.6, not yet run) only. **US001 and US002 are pre-registered in `docs/_canonical-fcodes.json` against F001 Google Sign-In** — kept as the two Google sign-in stories per this run's explicit instruction, so existing cross-references stay valid.

## Interaction Inventory

> One row per interactive element. Rows sharing a merge-eligible group (same actor + same
> HTTP/client endpoint + same data flow, per the web merge exception) are bracketed together and
> collapse into ONE US — noted in the "→ US" column. Inert elements (rendered, wired to nothing)
> are listed separately below, per this run's instruction, and get NO US.

| Screen/Region      | Element                                                                                                      | Type                 | Action                                                        | Endpoint                                               | → US  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------ | ----- |
| SCR002             | GoogleLoginButton (`hero-section.tsx:32-53`)                                                                 | primary-action       | `signInWithOAuth({provider:"google"})`, redirects to Google   | N/A — redirects to Google OAuth consent                | US001 |
| SCR002             | `/auth/callback` landing (`app/auth/callback/route.ts`)                                                      | system-action        | Exchanges OAuth code for a session, routes onward             | GET /auth/callback (ROUTE001)                          | US002 |
| SCR002/004/005/006 | LanguageSelector (`language-selector.tsx:36-51`)                                                             | secondary-action     | Switches active i18next locale, persists `NEXT_LOCALE` cookie | N/A — client i18next + cookie write                    | US003 |
| SCR004/005/006     | UserMenu "Sign out" (`user-menu.tsx:53-68,104-109`)                                                          | secondary-action     | Ends Supabase session, routes to `/login`                     | N/A — `supabase.auth.signOut()` client call            | US004 |
| SCR004/005/006     | NavLinks "About SAA 2025" (`nav-links.tsx:30-38`)                                                            | navigation           | Client-side route to `/about`                                 | N/A — Next.js `<Link>`                                 | US005 |
| SCR004/005/006     | SiteFooter route link + "General Standards" (`site-footer.tsx:61-69`)                                        | navigation           | Client-side route to `/about`                                 | N/A                                                    | US005 |
| SCR004/005/006     | NavLinks "Award Information" (`nav-links.tsx:30-38`)                                                         | navigation           | Client-side route to `/award-info`                            | N/A                                                    | US006 |
| SCR004             | HeroCta "About Awards" (`hero-cta.tsx:14-20`)                                                                | navigation           | Client-side route to `/award-info`                            | N/A                                                    | US006 |
| SCR004/005/006     | NavLinks "Sun\* Kudos" (`nav-links.tsx:30-38`)                                                               | navigation           | Client-side route to `/sun-kudos`                             | N/A                                                    | US007 |
| SCR004             | HeroCta "About Kudos" (`hero-cta.tsx:23-29`)                                                                 | navigation           | Client-side route to `/sun-kudos`                             | N/A                                                    | US007 |
| SCR004/005         | SunkudosSection promo link (`sunkudos-section.tsx:54-58`)                                                    | navigation           | Client-side route to `/sun-kudos`                             | N/A                                                    | US007 |
| SCR005             | CategoryNav anchor links ×6 (`category-nav.tsx:56-64`)                                                       | navigation           | Smooth-scrolls to an award section, sets active state         | N/A — in-page anchor scroll                            | US008 |
| SCR004             | WidgetButton "Rules" pill (`widget-button.tsx:308-320`)                                                      | secondary-action     | Opens `SaaRulesDrawer`                                        | N/A                                                    | US009 |
| SCR004             | SaaRulesDrawer close/backdrop/Esc (`saa-rules-drawer.tsx:446-458,527-534`)                                   | secondary-action     | Closes the rules drawer                                       | N/A                                                    | US009 |
| SCR004             | WidgetButton "Write KUDOS" pill (`widget-button.tsx:323-335`)                                                | secondary-action     | Opens `KudosFormModal`                                        | N/A                                                    | US010 |
| SCR004             | SaaRulesDrawer's own "Write KUDOS" footer button (`saa-rules-drawer.tsx:535-542`, `widget-button.tsx:58-61`) | secondary-action     | Closes drawer, opens `KudosFormModal`                         | N/A                                                    | US010 |
| SCR006             | WriteKudosBarButton (`write-kudos-bar-button.tsx:32-47`)                                                     | secondary-action     | Opens `KudosFormModal` (with real hashtags)                   | N/A                                                    | US010 |
| SCR004/006         | KudosFormModal submit (`kudos-form-modal.tsx:108-120,178-186`)                                               | primary-action       | Validates + inserts a kudo                                    | `submitKudoAction(formData)` (ROUTE002)                | US011 |
| SCR004/006         | KudosFormModal cancel/backdrop/Esc (`kudos-form-modal.tsx:46-52,131,172`)                                    | secondary-action     | Discards the draft, closes modal                              | N/A                                                    | US011 |
| SCR004/006         | KudosContentEditor link toolbar button (`kudos-content-editor.tsx:89-97`)                                    | secondary-action     | Opens `AddlinkBox`                                            | N/A                                                    | US012 |
| SCR004/006         | AddlinkBox save (`addlink-box.tsx:52-58`)                                                                    | secondary-action     | Validates + splices `[text](url)` into the draft at the caret | N/A — client-only draft mutation                       | US012 |
| SCR006/REG001      | HighlightFilterDropdown hashtag select (`highlight-filter-dropdown.tsx:75-78`)                               | secondary-action     | Sets `?tag=` URL filter                                       | N/A — `router.replace` (`use-hashtag-filter.ts:24-36`) | US013 |
| SCR006/REG001      | HighlightKudoCard hashtag chip (`highlight-kudo-card.tsx:92-99`)                                             | secondary-action     | Same `?tag=` URL filter as above                              | N/A                                                    | US013 |
| SCR006/REG003      | KudoPostCard hashtag chip (`feed-kudo-post-card.tsx:111-119`)                                                | secondary-action     | Same `?tag=` URL filter as above                              | N/A                                                    | US013 |
| SCR006/REG003      | FeedList clear-filter chip (`feed-list.tsx:104-111`)                                                         | secondary-action     | Clears the `?tag=` URL filter                                 | N/A                                                    | US013 |
| SCR006/REG001      | HighlightFilterDropdown department select (`highlight-section.tsx:44-46,75-80`)                              | secondary-action     | Narrows the already-fetched top-5 rows, no re-query           | N/A — client-only, no URL write                        | US014 |
| SCR006/REG001      | HighlightCarousel prev/next arrows ×2 pairs (`highlight-carousel.tsx:63-69,109-115,122-140`)                 | navigation           | Steps the carousel slide index                                | N/A — client-only                                      | US015 |
| SCR006/REG001      | HighlightKudoCard "Copy link" (`highlight-kudo-card.tsx:116-130`)                                            | secondary-action     | Copies the kudo's share URL, shows a toast                    | N/A — `navigator.clipboard`                            | US016 |
| SCR006/REG003      | KudoPostCard "Copy link" (`feed-kudo-post-card.tsx:34-38,144-151`)                                           | secondary-action     | Same clipboard copy + toast                                   | N/A                                                    | US016 |
| SCR006/REG001      | HeartButton on HighlightKudoCard (`heart-button.tsx:67-88`)                                                  | destructive-action\* | Toggles a heart on/off a kudo                                 | `heartKudo`/`unheartKudo(kudoId)` (ROUTE003/ROUTE004)  | US017 |
| SCR006/REG003      | HeartButton on KudoPostCard (`heart-button.tsx:67-88`)                                                       | destructive-action\* | Same toggle                                                   | ROUTE003/ROUTE004                                      | US017 |
| SCR006/REG002      | SpotlightBoard name search (`spotlight-board.tsx:67-75`)                                                     | secondary-action     | Filters the displayed name cloud                              | N/A — client-only                                      | US018 |
| SCR006/REG002      | SpotlightZoomControls in/out/reset (`spotlight-zoom-controls.tsx:36-68`)                                     | secondary-action     | Zooms the name cloud                                          | N/A — client-only                                      | US019 |
| SCR006/REG002      | SpotlightBoard drag-to-pan (`spotlight-board.tsx:87-93`)                                                     | secondary-action     | Pans the name cloud when zoomed in                            | N/A — client-only                                      | US020 |
| SCR006/REG004      | SidebarStats "Open Secret Box" (`sidebar-stats.tsx:64-75`)                                                   | secondary-action     | Opens `SidebarGiftDialog`                                     | N/A                                                    | US021 |
| SCR006/REG004      | SidebarGiftDialog box button (`sidebar-gift-dialog.tsx:60-74,112-121`)                                       | primary-action       | Draws one badge, updates unopened count                       | `openSecretBox()` (ROUTE005)                           | US022 |
| SCR006/REG003      | KudoPostCard attachment thumbnail (`feed-kudo-post-card.tsx:88-106,154-160`)                                 | secondary-action     | Opens `FeedImageLightbox`                                     | N/A                                                    | US023 |
| SCR006/REG003      | FeedList IntersectionObserver sentinel (`feed-list.tsx:67-96`)                                               | system-action        | Fetches and appends the next feed page on scroll              | `loadFeedPage(cursor, filter)` (ROUTE007)              | US024 |

_\* `destructive-action` here is the closest canonical type for a reversible delete-your-own-row
toggle (RLS-enforced ownership per PERM006) — the "unlike" branch does execute a real DELETE, and
per IPE Step 1 destructive actions are always their own US; it is not merged with any other row._

### Inert Elements (rendered, no wired handler — NOT interactions, no US)

| Screen/Region  | Element                                                                                     | Reason                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCR006/REG003  | Per-kudo category-text chip (`feed-kudo-post-card.tsx:71-77`)                               | Rendered as a plain `<span>` (not `role="button"`, not focusable) — "Not wired this phase", per its own comment                                                                     |
| SCR004/005/006 | UserMenu "Profile" item (`user-menu.tsx:90-93`)                                             | No `onClick` wired                                                                                                                                                                  |
| SCR004/005/006 | UserMenu "Admin Dashboard" item (`user-menu.tsx:95-98`)                                     | No `onClick`, no `role` check — renders unconditionally for every user (data-model.md MODEL001, PERM015)                                                                            |
| SCR004/005/006 | NotificationMenu (`notification-menu.tsx:1-61`)                                             | Toggle opens a panel, but panel is presentational-only per its own source comment — always shows a hardcoded empty state; `notifications` table is live but never queried by any UI |
| SCR006         | WriteKudosBarButton search input (`write-kudos-bar-button.tsx:54-60`)                       | `keyword` state is set on change but never consumed — "a separate, not-yet-assigned piece", per its own comment                                                                     |
| SCR004/006     | KudosContentEditor bold/italic/strike/list/quote toolbar (`kudos-content-editor.tsx:79-88`) | No `onClick` — presentational/no-op per clarification #3 (no WYSIWYG lib this phase)                                                                                                |
| SCR004/006     | KudosContentEditor "community standard" link (`kudos-content-editor.tsx:99-105`)            | `event.preventDefault()` only — no-op placeholder                                                                                                                                   |
| SCR006/REG001  | HighlightKudoCard "View Detail" button (`highlight-kudo-card.tsx:131-137`)                  | No `onClick` wired                                                                                                                                                                  |

## User Story Index

| Code                                   | Title                                | Type | Priority | Screens                        |
| -------------------------------------- | ------------------------------------ | ---- | -------- | ------------------------------ |
| US001_SignInWithGoogle                 | Sign In with Google                  | ui   | P0       | SCR002                         |
| US002_CompleteGoogleSignIn             | Complete Google Sign-In              | ui   | P0       | SCR002                         |
| US003_SwitchInterfaceLanguage          | Switch Interface Language            | ui   | P2       | SCR002, SCR004, SCR005, SCR006 |
| US004_SignOut                          | Sign Out                             | ui   | P1       | SCR004, SCR005, SCR006         |
| US005_ViewHomepage                     | View Homepage                        | ui   | P1       | SCR004, SCR005, SCR006         |
| US006_ViewAwardInformation             | View Award Information               | ui   | P1       | SCR004, SCR005, SCR006         |
| US007_ViewSunKudosBoard                | View Sun\* Kudos Board               | ui   | P1       | SCR004, SCR005, SCR006         |
| US008_BrowseAwardCategories            | Browse Award Categories              | ui   | P2       | SCR005                         |
| US009_ViewSaaRules                     | View SAA Rules                       | ui   | P2       | SCR004                         |
| US010_OpenKudoComposer                 | Open Kudo Composer                   | ui   | P0       | SCR004, SCR006                 |
| US011_PostAKudo                        | Post a Kudo                          | ui   | P0       | SCR004, SCR006                 |
| US012_InsertLinkIntoKudoMessage        | Insert a Link into a Kudo Message    | ui   | P2       | SCR004, SCR006                 |
| US013_FilterKudosByHashtag             | Filter Kudos by Hashtag              | ui   | P1       | SCR006/REG001, SCR006/REG003   |
| US014_FilterHighlightKudosByDepartment | Filter Highlight Kudos by Department | ui   | P2       | SCR006/REG001                  |
| US015_BrowseHighlightCarousel          | Browse the Highlight Carousel        | ui   | P1       | SCR006/REG001                  |
| US016_CopyKudoShareLink                | Copy a Kudo's Share Link             | ui   | P2       | SCR006/REG001, SCR006/REG003   |
| US017_ReactToKudoWithHeart             | React to a Kudo with a Heart         | ui   | P1       | SCR006/REG001, SCR006/REG003   |
| US018_SearchSpotlightBoard             | Search the Spotlight Board           | ui   | P2       | SCR006/REG002                  |
| US019_ZoomSpotlightBoard               | Zoom the Spotlight Board             | ui   | P2       | SCR006/REG002                  |
| US020_PanSpotlightBoard                | Pan the Spotlight Board              | ui   | P2       | SCR006/REG002                  |
| US021_OpenSecretBoxDialog              | Open the Secret Box Dialog           | ui   | P1       | SCR006/REG004                  |
| US022_DrawFromSecretBox                | Draw From the Secret Box             | ui   | P1       | SCR006/REG004                  |
| US023_ViewKudoAttachedImage            | View a Kudo's Attached Image         | ui   | P2       | SCR006/REG003                  |
| US024_LoadMoreKudosInFeed              | Load More Kudos in the Feed          | ui   | P1       | SCR006/REG003                  |

---

## US001_SignInWithGoogle: Sign In with Google

**Type**: ui
**Interaction**: primary-action
**Priority**: P0
**Estimate**: S

### User Story

As an unauthenticated visitor, I want to sign in with my Google account so that I can access the Sun\* Kudos app.

### Acceptance Criteria

- [ ] Clicking the "Login With Google" button (`components/login/google-login-button.tsx:19-42`) starts `supabase.auth.signInWithOAuth({ provider: "google" })` and disables the button behind a spinner (`hero-section.tsx:32-53`)
- [ ] A client-side failure (offline, GoTrue unreachable, missing env) is caught and shows the inline `role="alert"` error, re-enabling the button (`hero-section.tsx:47-51`)
- [ ] `redirectTo` is deliberately a bare `${origin}/auth/callback` with no query string — the callback (US002) computes the post-login destination itself, an open-redirect countermeasure

### Technical Notes

- **Endpoint**: N/A — client SDK call redirects the browser to Google's OAuth consent screen (no local HTTP endpoint)
- **Data Required**: None
- **Dependencies**: US002 (the OAuth round-trip is only complete once `/auth/callback` runs)

### Screens

- SCR002_LoginScreen: `components/login/hero-section.tsx:32-53`, `components/login/google-login-button.tsx`

### Test Scenarios

| Scenario   | Given                                      | When                            | Then                                                                         |
| ---------- | ------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------- |
| Happy Path | User is on `/login`, unauthenticated       | User clicks "Login With Google" | Browser navigates to Google's consent screen; button shows a spinner         |
| Error Case | Supabase client throws (offline/misconfig) | User clicks "Login With Google" | Inline `data-testid="google-login-error"` message appears; button re-enables |

---

## US002_CompleteGoogleSignIn: Complete Google Sign-In

**Type**: ui
**Interaction**: system-action
**Priority**: P0
**Estimate**: S

### User Story

As a user returning from Google's consent screen, I want my sign-in to complete automatically so that I land on the correct screen without any manual navigation.

### Acceptance Criteria

- [ ] `GET /auth/callback` exchanges the `code` query param for a session via `createClient().auth.exchangeCodeForSession` (`app/auth/callback/route.ts`)
- [ ] On success, redirects to `/countdown` (before launch) or `/about` (after launch) per `isBeforeLaunch()` (`lib/countdown-config.ts`)
- [ ] On failure, redirects to `/login?error=oauth_failed`, which SCR002 reads server-side to show the inline error (`app/login/page.tsx:27-29`)
- [ ] A brand-new Google account triggers profile provisioning (BL001) transparently — the user is never blocked waiting on it

### Technical Notes

- **Endpoint**: GET /auth/callback (ROUTE001)
- **Data Required**: OAuth `code` query param
- **Dependencies**: `lib/countdown-config.ts` (`isBeforeLaunch()`); triggers BL001 indirectly via the `auth.users` INSERT

### Screens

- SCR002_LoginScreen: `app/auth/callback/route.ts`

### Background Logic

- BL001_CreateProfileOnSignup: fires `AFTER INSERT ON auth.users`, the row this callback's session exchange creates for a first-time signer

### Test Scenarios

| Scenario   | Given                                      | When                                 | Then                                                           |
| ---------- | ------------------------------------------ | ------------------------------------ | -------------------------------------------------------------- |
| Happy Path | Valid OAuth `code`, event has not launched | Google redirects to `/auth/callback` | Session established; browser lands on `/countdown`             |
| Error Case | Code exchange fails (expired/invalid code) | Google redirects to `/auth/callback` | Browser lands on `/login?error=oauth_failed` with inline error |

---

## US003_SwitchInterfaceLanguage: Switch Interface Language

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a user, I want to switch the interface language between Vietnamese and English so that I can read the app in my preferred language.

### Acceptance Criteria

- [ ] Selecting VN or EN calls `i18n.changeLanguage(code)`, re-rendering all translated text immediately (`components/common/language-selector.tsx:36-44`)
- [ ] The choice persists to a `NEXT_LOCALE` cookie (`path=/`, 1-year `max-age`) so SSR picks it up on reload (`language-selector.tsx:48-51`)
- [ ] `<html lang>` stays in sync with the selected locale
- [ ] Default is VN when no cookie is present

### Technical Notes

- **Endpoint**: N/A — client-side i18next switch + `document.cookie` write
- **Data Required**: None
- **Dependencies**: `lib/i18n/settings.ts` (`cookieName`, `resolveLocale`)

### Screens

- SCR002_LoginScreen, SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: `components/common/language-selector.tsx`

### Test Scenarios

| Scenario   | Given                             | When                    | Then                                                            |
| ---------- | --------------------------------- | ----------------------- | --------------------------------------------------------------- |
| Happy Path | User has the VN interface visible | User selects "EN"       | Interface re-renders in English; `NEXT_LOCALE=en` cookie is set |
| Error Case | `i18n.changeLanguage` rejects     | User selects a language | Previous locale stays rendered (silent fallback, no crash)      |

---

## US004_SignOut: Sign Out

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to sign out so that my session ends and I can no longer access protected pages from this browser.

### Acceptance Criteria

- [ ] "Sign out" calls `supabase.auth.signOut()`, which clears the same auth cookies `proxy.ts` reads server-side (`components/homepage/user-menu.tsx:53-68`)
- [ ] On success, routes to `/login` and calls `router.refresh()` to clear the Router Cache, so a subsequent back-navigation re-runs the proxy's auth guard rather than serving a cached authenticated payload
- [ ] On failure, the menu stays open and the UI never optimistically claims the user is signed out

### Technical Notes

- **Endpoint**: N/A — `supabase.auth.signOut()` client call (browser cookie clear)
- **Data Required**: None
- **Dependencies**: PERM001_GlobalSessionGate (the guard this sign-out ultimately re-triggers on next navigation)

### Screens

- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: `components/homepage/user-menu.tsx`

### Test Scenarios

| Scenario   | Given                        | When                   | Then                                                                         |
| ---------- | ---------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Happy Path | User is signed in, menu open | User clicks "Sign out" | Session cookies cleared; browser routes to `/login`                          |
| Error Case | `signOut()` throws/errors    | User clicks "Sign out" | Menu stays open; error is logged; no navigation, no false "signed out" state |

---

## US005_ViewHomepage: View Homepage

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to navigate back to the homepage from anywhere in the app so that I can see the award and kudos overview again.

### Acceptance Criteria

- [ ] Clicking "About SAA 2025" in the header nav routes to `/about` (`components/common/nav-links.tsx:30-38`, `constants/index.ts:30-34`)
- [ ] Clicking the equivalent footer link, or the footer's "General Standards" link (both point to `/about`), routes to `/about` (`components/common/site-footer.tsx:27-30,61-69`)
- [ ] The active nav item is visually highlighted when already on `/about`

### Technical Notes

- **Endpoint**: N/A — Next.js `<Link>` client-side navigation
- **Data Required**: None
- **Dependencies**: None

### Screens

- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: `components/common/nav-links.tsx`, `components/common/site-footer.tsx`

### Test Scenarios

| Scenario   | Given                                                                  | When                                   | Then                       |
| ---------- | ---------------------------------------------------------------------- | -------------------------------------- | -------------------------- |
| Happy Path | User is on `/award-info`                                               | User clicks "About SAA 2025" in header | Browser routes to `/about` |
| Error Case | N/A — client-side Link navigation has no failure path in this codebase | —                                      | —                          |

---

## US006_ViewAwardInformation: View Award Information

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to open the Award Information page so that I can read about the 6 award categories.

### Acceptance Criteria

- [ ] Clicking "Award Information" in the header or footer nav routes to `/award-info` (`nav-links.tsx:30-38`, `site-footer.tsx:61-69`)
- [ ] Clicking the "About Awards" CTA on the homepage hero routes to `/award-info` (`components/homepage/hero-cta.tsx:14-20`)

### Technical Notes

- **Endpoint**: N/A — Next.js `<Link>` / anchor navigation
- **Data Required**: None
- **Dependencies**: None

### Screens

- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: `components/common/nav-links.tsx`, `components/homepage/hero-cta.tsx`

### Test Scenarios

| Scenario   | Given                        | When                               | Then                            |
| ---------- | ---------------------------- | ---------------------------------- | ------------------------------- |
| Happy Path | User is on `/about`          | User clicks the "About Awards" CTA | Browser routes to `/award-info` |
| Error Case | N/A — client-side navigation | —                                  | —                               |

---

## US007_ViewSunKudosBoard: View Sun\* Kudos Board

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to open the Sun\* Kudos live board so that I can see and give kudos.

### Acceptance Criteria

- [ ] Clicking "Sun\* Kudos" in the header or footer nav routes to `/sun-kudos` (`nav-links.tsx:30-38`, `site-footer.tsx:61-69`)
- [ ] Clicking the "About Kudos" CTA on the homepage hero routes to `/sun-kudos` (`components/homepage/hero-cta.tsx:23-29`)
- [ ] Clicking the Kudos promo banner (present on both `/about` and `/award-info`) routes to `/sun-kudos` (`components/homepage/sunkudos-section.tsx:54-58`)

### Technical Notes

- **Endpoint**: N/A — Next.js `<Link>` / anchor navigation
- **Data Required**: None
- **Dependencies**: None

### Screens

- SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard: `components/common/nav-links.tsx`, `components/homepage/hero-cta.tsx`, `components/homepage/sunkudos-section.tsx`

### Test Scenarios

| Scenario   | Given                        | When                               | Then                           |
| ---------- | ---------------------------- | ---------------------------------- | ------------------------------ |
| Happy Path | User is on `/award-info`     | User clicks the Kudos promo banner | Browser routes to `/sun-kudos` |
| Error Case | N/A — client-side navigation | —                                  | —                              |

---

## US008_BrowseAwardCategories: Browse Award Categories

**Type**: ui
**Interaction**: navigation
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to jump to a specific award category so that I can read its details without manually scrolling.

### Acceptance Criteria

- [ ] Clicking a category in the sticky left nav smooth-scrolls to the matching `<section>` and marks it active (`components/awards/category-nav.tsx:56-64`)
- [ ] The observer-driven scrollspy is suppressed for 800ms after a click so it doesn't override the clicked target mid-scroll (`category-nav.tsx:60-63`)
- [ ] Scrolling manually (no click) still updates the active category via `IntersectionObserver` (`category-nav.tsx:36-54`)

### Technical Notes

- **Endpoint**: N/A — in-page anchor scroll (`scrollIntoView`)
- **Data Required**: None
- **Dependencies**: None

### Screens

- SCR005_AwardInfoScreen: `components/awards/category-nav.tsx`

### Test Scenarios

| Scenario   | Given                                     | When                                  | Then                                                        |
| ---------- | ----------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Happy Path | User is on `/award-info`                  | User clicks "MVP" in the category nav | Page smooth-scrolls to the MVP section; nav item highlights |
| Error Case | N/A — client-only scroll, no failure path | —                                     | —                                                           |

---

## US009_ViewSaaRules: View SAA Rules

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to view the SAA rules (hero-tier badges, collectible icons, national-kudos rules) so that I understand how the kudos/awards program works.

### Acceptance Criteria

- [ ] Clicking the floating widget's "Rules" pill opens the `SaaRulesDrawer` slide-in panel (`components/homepage/widget-button.tsx:308-320`)
- [ ] The drawer closes on backdrop click, Esc, or its own close button (`components/homepage/saa-rules-drawer.tsx:446-458,527-534`)
- [ ] Content is static/read-only (hero-tier badges, 6 collectible icons, national-kudos copy) — no API call

### Technical Notes

- **Endpoint**: N/A — client-only drawer open/close state
- **Data Required**: None
- **Dependencies**: US010 (the drawer's own footer "Write KUDOS" button hands off into the Kudo Composer)

### Screens

- SCR004_AboutHomepage: `components/homepage/widget-button.tsx`, `components/homepage/saa-rules-drawer.tsx`

### Test Scenarios

| Scenario   | Given                                 | When                         | Then                                      |
| ---------- | ------------------------------------- | ---------------------------- | ----------------------------------------- |
| Happy Path | User is on `/about`                   | User clicks the "Rules" pill | SAA rules drawer slides in from the right |
| Error Case | N/A — static content, no failure path | —                            | —                                         |

---

## US010_OpenKudoComposer: Open Kudo Composer

**Type**: ui
**Interaction**: secondary-action
**Priority**: P0
**Estimate**: S

### User Story

As a signed-in user, I want to open the write-a-kudo form so that I can begin composing a kudo for a colleague.

### Acceptance Criteria

- [ ] On `/about`, clicking the widget's "Write KUDOS" pill opens `KudosFormModal` with no hashtags pre-loaded (`widget-button.tsx:323-335`)
- [ ] On `/about`, clicking "Write KUDOS" inside the open rules drawer closes the drawer and opens the same modal (`saa-rules-drawer.tsx:535-542`, `widget-button.tsx:58-61`)
- [ ] On `/sun-kudos`, clicking the give-kudos pill opens `KudosFormModal` with the 13 canonical hashtags loaded (`components/kudos/write-kudos-bar-button.tsx:32-47`)
- [ ] The modal always resets to a blank draft on open — no pre-filled "edit" flow exists (`kudos-form-modal.tsx:93-101`)

### Technical Notes

- **Endpoint**: N/A — client-only modal open state
- **Data Required**: 13 canonical hashtags (SCR006 instance only; SCR004 instance defaults to `[]`)
- **Dependencies**: US011 (submitting), US012 (inserting a link inside the open composer)

### Screens

- SCR004_AboutHomepage: `components/homepage/widget-button.tsx`
- SCR006_SunKudosBoard: `components/kudos/write-kudos-bar-button.tsx`

### Test Scenarios

| Scenario   | Given                       | When                            | Then                                                     |
| ---------- | --------------------------- | ------------------------------- | -------------------------------------------------------- |
| Happy Path | User is on `/sun-kudos`     | User clicks the give-kudos pill | `KudosFormModal` opens with the hashtag picker populated |
| Error Case | N/A — no async call on open | —                               | —                                                        |

---

## US011_PostAKudo: Post a Kudo

**Type**: ui
**Interaction**: primary-action
**Priority**: P0
**Estimate**: M

### User Story

As a signed-in user, I want to submit a kudo message to a colleague so that they are publicly recognized on the board.

### Acceptance Criteria

- [ ] The submit button is disabled until recipient, non-empty content, and ≥1 hashtag are set (and anonymous name is filled when posting anonymously) (`kudos-form-modal.tsx:54-61`)
- [ ] Submitting calls `submitKudoAction(formData)`, which re-validates recipient/hashtag existence server-side and uploads any attached images before inserting `kudos` + `kudo_hashtags` (ROUTE002, `route-list.md`)
- [ ] `sender_id` is never client-supplied — the Server Action always resolves it from the caller's own session (PERM005)
- [ ] On success, shows a success state for ~1.2s then closes and refreshes the board (`kudos-form-modal.tsx:117-119`)
- [ ] On a field-level validation error, the specific field's error message renders inline; on a generic failure, a fallback error message renders

### Technical Notes

- **Endpoint**: `submitKudoAction(formData)` (ROUTE002)
- **Data Required**: recipient, message content (≤500 chars, server-enforced), ≥1 hashtag, optional images (≤5), optional anonymous flag + name
- **Dependencies**: US010 (composer must be open); PERM005_KudosReadAllInsertOwn, PERM008_KudoHashtagsReadInsertBySender

### Screens

- SCR004_AboutHomepage, SCR006_SunKudosBoard: `components/kudos/kudos-form-modal.tsx`

### Test Scenarios

| Scenario   | Given                                     | When                 | Then                                                          |
| ---------- | ----------------------------------------- | -------------------- | ------------------------------------------------------------- |
| Happy Path | Composer open, all required fields filled | User clicks "Submit" | Kudo is inserted; success state shows; modal auto-closes      |
| Error Case | Message exceeds the 500-char server cap   | User clicks "Submit" | Server rejects; the message-length field error renders inline |

---

## US012_InsertLinkIntoKudoMessage: Insert a Link into a Kudo Message

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user composing a kudo, I want to insert a labeled link into my message so that I can reference an external page.

### Acceptance Criteria

- [ ] Clicking the editor's link toolbar icon opens the Addlink Box (`components/kudos/kudos-content-editor.tsx:89-97`)
- [ ] Saving with valid text + URL splices `[text](url)` into the draft at the caret position and refocuses the textarea (`kudos-content-editor.tsx:52-67`, `components/kudos/addlink-box.tsx:52-58`)
- [ ] Invalid text/URL (per `validateAddlinkFields`) blocks the save and shows inline field errors (`addlink-box.tsx:48-55`)
- [ ] Cancel/Escape/backdrop discards the draft link without touching the message (`addlink-box.tsx`, shadcn `Dialog` built-in dismissal)

### Technical Notes

- **Endpoint**: N/A — client-only draft mutation, no API call
- **Data Required**: link text (≤100 chars), URL
- **Dependencies**: US010 (composer must be open); US011 (the link ships as part of the eventual submit)

### Screens

- SCR004_AboutHomepage, SCR006_SunKudosBoard: `components/kudos/addlink-box.tsx`

### Test Scenarios

| Scenario   | Given                        | When                              | Then                                                           |
| ---------- | ---------------------------- | --------------------------------- | -------------------------------------------------------------- |
| Happy Path | Composer open, link box open | User fills text+URL, clicks "Lưu" | `[text](url)` markdown is inserted into the draft at the caret |
| Error Case | Text field left empty        | User clicks "Lưu"                 | Inline validation error renders; nothing is inserted           |

---

## US013_FilterKudosByHashtag: Filter Kudos by Hashtag

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: M

### User Story

As a signed-in user, I want to filter the kudos board by hashtag so that I can see only the kudos in a category I care about.

### Acceptance Criteria

- [ ] Selecting a hashtag from the Highlight section's dropdown sets `?tag=<id>` in the URL (`components/kudos-board/highlight-filter-dropdown.tsx:75-78`, `use-hashtag-filter.ts:24-36`)
- [ ] Clicking a hashtag chip on a Highlight card or a Feed card applies the same filter (`highlight-kudo-card.tsx:92-99`, `feed-kudo-post-card.tsx:111-119`)
- [ ] The filter is shared: changing it re-fetches/remounts BOTH the Highlight carousel (resets to slide 1) and the All-Kudos feed (`app/sun-kudos/page.tsx:89`, `screen-list.md` REG001/REG003 notes)
- [ ] The active filter survives a page reload (URL-persisted) and shows a clearable chip in the feed (`feed-list.tsx:104-111`)

### Technical Notes

- **Endpoint**: N/A — `router.replace` mutates the `?tag=` search param, which both regions re-render from
- **Data Required**: 13 canonical hashtags (`getHashtags()`)
- **Dependencies**: PERM007_HashtagsReadOnly, PERM008_KudoHashtagsReadInsertBySender

### Screens

- SCR006_SunKudosBoard/REG001, SCR006_SunKudosBoard/REG003: `components/kudos-board/use-hashtag-filter.ts`

### Test Scenarios

| Scenario   | Given                                            | When                                       | Then                                                                |
| ---------- | ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| Happy Path | Board shows all kudos                            | User selects "#Teamwork" from the dropdown | URL becomes `?tag=<id>`; both Highlight and Feed re-render filtered |
| Error Case | N/A — client router param write, no failure path | —                                          | —                                                                   |

---

## US014_FilterHighlightKudosByDepartment: Filter Highlight Kudos by Department

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to narrow the Highlight carousel to a department so that I can see standout kudos from a specific team.

### Acceptance Criteria

- [ ] Selecting a department narrows the already-fetched top-5 Highlight rows client-side (`components/kudos-board/highlight-section.tsx:44-46`)
- [ ] No re-query happens — this filter has no confirmed data source and stays local/decorative (`highlight-section.tsx:25-28`, D001)
- [ ] Choosing "Clear" resets to showing all 5 rows

### Technical Notes

- **Endpoint**: N/A — client-only array filter, no URL write, no re-query
- **Data Required**: None (hardcoded `DEPARTMENTS` constant)
- **Dependencies**: None

### Screens

- SCR006_SunKudosBoard/REG001: `components/kudos-board/highlight-section.tsx`

### Test Scenarios

| Scenario   | Given                                     | When                 | Then                                                     |
| ---------- | ----------------------------------------- | -------------------- | -------------------------------------------------------- |
| Happy Path | Highlight shows all 5 top kudos           | User selects "CEVC1" | Carousel narrows to kudos matching that department label |
| Error Case | N/A — client-only filter, no failure path | —                    | —                                                        |

---

## US015_BrowseHighlightCarousel: Browse the Highlight Carousel

**Type**: ui
**Interaction**: navigation
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to step through the Highlight carousel so that I can see each top-hearted kudo in turn.

### Acceptance Criteria

- [ ] Clicking the prev/next arrows (large slide arrows or the small pagination arrows) advances/retreats the slide index (`components/kudos-board/highlight-carousel.tsx:63-69,109-115,122-140`)
- [ ] Arrows disable at the first/last slide (`atFirst`/`atLast`)
- [ ] The slide indicator shows `current/total`

### Technical Notes

- **Endpoint**: N/A — client-only index state
- **Data Required**: `getHighlightKudos()` result (server-fetched by the page)
- **Dependencies**: US013 (a hashtag/department filter change remounts and resets this to slide 1)

### Screens

- SCR006_SunKudosBoard/REG001: `components/kudos-board/highlight-carousel.tsx`

### Test Scenarios

| Scenario   | Given                      | When                       | Then                              |
| ---------- | -------------------------- | -------------------------- | --------------------------------- |
| Happy Path | Carousel on slide 1 of 5   | User clicks the next arrow | Carousel advances to slide 2 of 5 |
| Error Case | Carousel on the last slide | User views the next arrow  | Next arrow renders disabled       |

---

## US016_CopyKudoShareLink: Copy a Kudo's Share Link

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to copy a direct link to a specific kudo so that I can share it with someone else.

### Acceptance Criteria

- [ ] Clicking "Copy link" on a Highlight card or a Feed card writes `{origin}/sun-kudos#{kudo.id}` to the clipboard (`highlight-kudo-card.tsx:116-130`, `feed-kudo-post-card.tsx:34-38,144-151`)
- [ ] A confirmation toast ("Link copied — ready to share!") shows for 2.5s regardless of clipboard-write success (`components/kudos-board/use-copy-link-toast.tsx:12-38`)
- [ ] A clipboard-unavailable environment (permissions/insecure context) still shows the toast — the write failure is swallowed silently

### Technical Notes

- **Endpoint**: N/A — `navigator.clipboard.writeText`
- **Data Required**: kudo id
- **Dependencies**: None

### Screens

- SCR006_SunKudosBoard/REG001, SCR006_SunKudosBoard/REG003: `components/kudos-board/use-copy-link-toast.tsx`

### Test Scenarios

| Scenario   | Given                     | When                    | Then                                                          |
| ---------- | ------------------------- | ----------------------- | ------------------------------------------------------------- |
| Happy Path | User views a kudo card    | User clicks "Copy link" | URL is on the clipboard; "Link copied" toast appears          |
| Error Case | Clipboard API unavailable | User clicks "Copy link" | Toast still appears (per spec); no error surfaces to the user |

---

## US017_ReactToKudoWithHeart: React to a Kudo with a Heart

**Type**: ui
**Interaction**: destructive-action
**Priority**: P1
**Estimate**: M

### User Story

As a signed-in user, I want to heart (and un-heart) a kudo so that I can show appreciation for it.

### Acceptance Criteria

- [ ] Clicking the heart on a kudo (not the viewer's own) immediately flips liked/unliked with an optimistic ±1 guess, then reconciles to the server's authoritative count (`components/kudos-board/heart-button.tsx:63-88`)
- [ ] A first heart calls `heartKudo(kudoId)` (INSERT); an active heart calls `unheartKudo(kudoId)` (DELETE) (ROUTE003/ROUTE004)
- [ ] The control disables itself on the viewer's own kudos and while a request is pending, so rapid repeat clicks never queue a second write (FR-402)
- [ ] A special-day window resolves a 2x heart grant server-side (BL004) — the optimistic guess is corrected to the real value once the Server Action resolves
- [ ] A failed write leaves `serverState` untouched (silent rollback to pre-click truth) and shows an inline error

### Technical Notes

- **Endpoint**: `heartKudo(kudoId)` (ROUTE003) / `unheartKudo(kudoId)` (ROUTE004)
- **Data Required**: kudo id
- **Dependencies**: PERM006_KudoHeartsOwnershipCrud (self-heart blocked by RLS)

### Background Logic

- BL002_SyncKudoHeartsCount: keeps `kudos.hearts_count` in sync with every insert/delete this action causes
- BL004_ResolveHeartValueNoDefiner: resolves whether this heart is worth 1 or 2 (special-day window)

### Screens

- SCR006_SunKudosBoard/REG001, SCR006_SunKudosBoard/REG003: `components/kudos-board/heart-button.tsx`

### Test Scenarios

| Scenario   | Given                              | When                       | Then                                                                    |
| ---------- | ---------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| Happy Path | Kudo not yet hearted by viewer     | User clicks the heart icon | Count optimistically +1, then reconciles to the server's real count     |
| Error Case | `heartKudo` rejects (e.g. network) | User clicks the heart icon | Optimistic guess rolls back to the pre-click state; error message shows |

---

## US018_SearchSpotlightBoard: Search the Spotlight Board

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to search for a name on the Spotlight board so that I can quickly find a specific colleague's node.

### Acceptance Criteria

- [ ] Typing in the search box filters the displayed name cloud to matches (case-insensitive substring), client-side (`components/kudos-board/spotlight-board.tsx:67-75,46-50`)
- [ ] An empty result set shows the board's empty-state copy
- [ ] Clearing the search restores the full name cloud

### Technical Notes

- **Endpoint**: N/A — client-only array filter over `getSpotlightBoard()`'s already-fetched nodes
- **Data Required**: `getSpotlightBoard()` result (server-fetched by the page)
- **Dependencies**: None

### Screens

- SCR006_SunKudosBoard/REG002: `components/kudos-board/spotlight-board.tsx`

### Test Scenarios

| Scenario   | Given                           | When                          | Then                                      |
| ---------- | ------------------------------- | ----------------------------- | ----------------------------------------- |
| Happy Path | Spotlight board fully populated | User types a colleague's name | Name cloud narrows to matching nodes only |
| Error Case | No node matches the typed text  | User finishes typing          | Board shows its empty-state message       |

---

## US019_ZoomSpotlightBoard: Zoom the Spotlight Board

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to zoom the Spotlight name cloud so that I can read the names in a crowded area.

### Acceptance Criteria

- [ ] Clicking the zoom toggle opens a popover with zoom-in, zoom-out and reset controls (`components/kudos-board/spotlight-zoom-controls.tsx:36-68`)
- [ ] Zoom is clamped to 0.5x–2x and moves in 0.25 steps (`components/kudos-board/use-spotlight-pan-zoom.ts:5-7,50-54`)
- [ ] "Reset" returns zoom to 1x and pan to origin (`use-spotlight-pan-zoom.ts:50-54`)
- [ ] Changing zoom re-clamps any existing pan offset so the content cannot be left off-screen (`use-spotlight-pan-zoom.ts:52-53`)

### Technical Notes

- **Endpoint**: N/A — client-only CSS transform state
- **Data Required**: None
- **Dependencies**: None
- **Note**: split from the former combined pan+zoom story at the W4.5 gate — zoom is a discrete button control (`spotlight-zoom-controls.tsx`), panning is a drag gesture on a different element (`spotlight-board.tsx`), so they are two separate interactions.

### Screens

- SCR006_SunKudosBoard/REG002: `components/kudos-board/spotlight-zoom-controls.tsx`, `components/kudos-board/use-spotlight-pan-zoom.ts`

### Test Scenarios

| Scenario   | Given                   | When                      | Then                                          |
| ---------- | ----------------------- | ------------------------- | --------------------------------------------- |
| Happy Path | Board at 1x zoom        | User clicks zoom-in twice | Board zooms to 1.5x                           |
| Error Case | Board already at 2x max | User clicks zoom-in again | Zoom stays clamped at 2x, no further increase |

---

## US020_PanSpotlightBoard: Pan the Spotlight Board

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to drag the zoomed-in Spotlight name cloud so that I can bring an off-screen part of it into view.

### Acceptance Criteria

- [ ] Dragging the name cloud pans it, but only while zoom is above 1x — a pointer-down at 1x or below is ignored (`components/kudos-board/use-spotlight-pan-zoom.ts:32-36`)
- [ ] The pan offset is clamped to ±((zoom − 1) / 2) × board dimension on each axis, so the content cannot be dragged fully off-screen (`use-spotlight-pan-zoom.ts:23-30`)
- [ ] While zoomed in, the cursor shows grab/grabbing affordance over the cloud (`components/kudos-board/spotlight-board.tsx:88`)
- [ ] Releasing the pointer, or moving it off the board, ends the drag (`spotlight-board.tsx:92-93`)

### Technical Notes

- **Endpoint**: N/A — client-only CSS transform state
- **Data Required**: None
- **Dependencies**: US019 (panning is inert until the user has zoomed past 1x)
- **Note**: split from the former combined pan+zoom story at the W4.5 gate.

### Screens

- SCR006_SunKudosBoard/REG002: `components/kudos-board/spotlight-board.tsx`, `components/kudos-board/use-spotlight-pan-zoom.ts`

### Test Scenarios

| Scenario   | Given                | When                           | Then                                          |
| ---------- | -------------------- | ------------------------------ | --------------------------------------------- |
| Happy Path | Board zoomed to 1.5x | User drags the name cloud left | Cloud pans left, clamped at the axis limit    |
| Error Case | Board at 1x zoom     | User drags the name cloud      | Nothing moves — pointer-down is ignored at 1x |

---

## US021_OpenSecretBoxDialog: Open the Secret Box Dialog

**Type**: ui
**Interaction**: secondary-action
**Priority**: P1
**Estimate**: S

### User Story

As a signed-in user, I want to open the secret box dialog so that I can see how many boxes I have left before drawing one.

### Acceptance Criteria

- [ ] Clicking "Open Secret Box" in the sidebar stats opens `SidebarGiftDialog` (`components/kudos-board/sidebar-stats.tsx:64-75`)
- [ ] On open, the dialog re-reads the authoritative unopened count via `getSecretBoxStatus()`, overriding the stale prop value (`sidebar-gift-dialog.tsx:48-56`)
- [ ] The dialog shows the "unopened" view when the count is >0

### Technical Notes

- **Endpoint**: N/A to open; internally reads `getSecretBoxStatus()` (ROUTE006) on mount
- **Data Required**: `overview.secretBoxUnopened` (initial paint only)
- **Dependencies**: US022 (the draw action lives inside this dialog)

### Screens

- SCR006_SunKudosBoard/REG004: `components/kudos-board/sidebar-stats.tsx`

### Test Scenarios

| Scenario   | Given                                                   | When                          | Then                                                  |
| ---------- | ------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| Happy Path | User has 2 unopened boxes                               | User clicks "Open Secret Box" | Dialog opens showing the "unopened" state, count 02   |
| Error Case | `getSecretBoxStatus()` returns `null` (session expired) | Dialog mounts                 | Dialog keeps showing the stale prop count as fallback |

---

## US022_DrawFromSecretBox: Draw From the Secret Box

**Type**: ui
**Interaction**: primary-action
**Priority**: P1
**Estimate**: M

### User Story

As a signed-in user, I want to draw a badge from my secret box so that I receive a random collectible reward.

### Acceptance Criteria

- [ ] Clicking the box image calls `openSecretBox()`, disabled while pending or when the count is 0 (`components/kudos-board/sidebar-gift-dialog.tsx:60-74,112-121`)
- [ ] On success, shows the drawn badge in the "revealed" view and decrements the unopened count (`sidebar-gift-dialog.tsx:65-69`)
- [ ] Drawing with zero boxes left raises `no_unopened_boxes` and shows the dialog's error message, without crashing (`sidebar-gift-dialog.tsx:71-72`)
- [ ] The draw is row-locked and atomic server-side — a double-click can never over-draw (PERM014)
- [ ] Only `authenticated` callers may execute the RPC at all — `anon` has `EXECUTE` revoked (PERM014)

### Technical Notes

- **Endpoint**: `openSecretBox()` (ROUTE005) — calls the `open_secret_box()` RPC
- **Data Required**: None (caller is always `auth.uid()`, zero-parameter RPC)
- **Dependencies**: US021 (dialog must be open); PERM014_OpenSecretBoxRpcBoundary

### Screens

- SCR006_SunKudosBoard/REG004: `components/kudos-board/sidebar-gift-dialog.tsx`, `app/sun-kudos/actions/open-secret-box.ts`

### Test Scenarios

| Scenario   | Given                     | When                                                                 | Then                                                         |
| ---------- | ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Happy Path | User has 1 unopened box   | User clicks the box image                                            | A badge is drawn and shown; unopened count drops to 0        |
| Error Case | User has 0 unopened boxes | User clicks the (disabled) box image, or a race leaves 0 server-side | `no_unopened_boxes` error message renders; no badge is drawn |

---

## US023_ViewKudoAttachedImage: View a Kudo's Attached Image

**Type**: ui
**Interaction**: secondary-action
**Priority**: P2
**Estimate**: S

### User Story

As a signed-in user, I want to view a kudo's attached image at full size so that I can see it clearly.

### Acceptance Criteria

- [ ] Clicking an attachment thumbnail on a feed kudo opens `FeedImageLightbox` full-size (`components/kudos-board/feed-kudo-post-card.tsx:88-106,154-160`)
- [ ] The lightbox closes on its close button, Esc, or clicking the backdrop (`components/kudos-board/feed-image-lightbox.tsx:22-28,30-46`)
- [ ] Clicking the image itself does not close the lightbox (event propagation stopped, `feed-image-lightbox.tsx:39`)

### Technical Notes

- **Endpoint**: N/A — client-only image viewer, no API call
- **Data Required**: attachment image URL (already loaded with the feed page)
- **Dependencies**: None

### Screens

- SCR006_SunKudosBoard/REG003: `components/kudos-board/feed-image-lightbox.tsx`

### Test Scenarios

| Scenario   | Given                                | When                      | Then                                       |
| ---------- | ------------------------------------ | ------------------------- | ------------------------------------------ |
| Happy Path | Feed kudo has an attached image      | User clicks the thumbnail | Lightbox opens showing the full-size image |
| Error Case | N/A — no async call, no failure path | —                         | —                                          |

---

## US024_LoadMoreKudosInFeed: Load More Kudos in the Feed

**Type**: ui
**Interaction**: system-action
**Priority**: P1
**Estimate**: M

### User Story

As a signed-in user, I want the kudos feed to load more posts as I scroll so that I can keep browsing without pagination clicks.

### Acceptance Criteria

- [ ] Scrolling the sentinel into view fetches the next keyset-paginated page via `loadFeedPage(cursor, filter)` and appends it to the list (`components/kudos-board/feed-list.tsx:67-96`)
- [ ] A fetch already in flight, or no `nextCursor` left, is guarded against (`isFetchingRef`, `cursorRef`) so the same page is never double-appended
- [ ] A failed page fetch stops appending silently — the sentinel stays mounted so scrolling further retries on the next intersection (`feed-list.tsx:82-89`)
- [ ] An expired session mid-scroll returns an empty page rather than an error (`route-list.md` ROUTE007 note)

### Technical Notes

- **Endpoint**: `loadFeedPage(cursor, filter)` (ROUTE007)
- **Data Required**: current cursor, active hashtag filter
- **Dependencies**: US013 (shares the same hashtag filter state)

### Screens

- SCR006_SunKudosBoard/REG003: `components/kudos-board/feed-list.tsx`, `app/sun-kudos/actions/load-feed-page.ts`

### Test Scenarios

| Scenario   | Given                            | When                                | Then                                                               |
| ---------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| Happy Path | Feed has more pages (`hasMore`)  | User scrolls the sentinel into view | Next page's items append to the feed list                          |
| Error Case | `loadFeedPage` rejects (network) | User scrolls the sentinel into view | No items appended; sentinel stays mounted for retry on next scroll |

---

## Screen → US Map

| Screen                      | US Codes                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SCR001_RootRedirect         | `[IPE_ZERO]` — stub screen, unconditional server `redirect("/login")`, no interactive elements                                                                     |
| SCR002_LoginScreen          | US001, US002, US003                                                                                                                                                |
| SCR003_CountdownScreen      | `[IPE_ZERO]` — no interactive elements found; the auto-`router.replace("/about")` on expiry is passive, non-user-triggered, so it is not counted as an interaction |
| SCR004_AboutHomepage        | US003, US004, US005, US006, US007, US009, US010, US011, US012                                                                                                      |
| SCR005_AwardInfoScreen      | US003, US004, US005, US006, US007, US008                                                                                                                           |
| SCR006_SunKudosBoard        | US003, US004, US005, US006, US007, US010, US011, US012, US013, US014, US015, US016, US017, US018, US019, US020, US021, US022, US023, US024                         |
| SCR006_SunKudosBoard/REG001 | US013, US014, US015, US016, US017                                                                                                                                  |
| SCR006_SunKudosBoard/REG002 | US018, US019, US020                                                                                                                                                |
| SCR006_SunKudosBoard/REG003 | US013, US016, US017, US023, US024                                                                                                                                  |
| SCR006_SunKudosBoard/REG004 | US021, US022                                                                                                                                                       |

## Cross-Reference

- **Total User Stories**: 24 (US001–US024, contiguous, no gaps, no duplicates)
- **By Type**: `ui`: 24, `system`: 0 (US002 and US024 use interaction-type `system-action`/`system-action` but are still `ui`-typed per US Types legend, since both map to a real SCR###)
- **By Priority**: P0: 4 (US001, US002, US010, US011), P1: 10 (US004, US005, US006, US007, US013, US015, US017, US021, US022, US024), P2: 10 (US003, US008, US009, US012, US014, US016, US018, US019, US020, US023)
- **Interaction Inventory rows**: 38 real interactions + 8 inert elements documented, collapsed into 24 US via the web merge exception (same actor + same endpoint + same data flow) — every merge is noted inline in the Inventory table's `→ US` column and in each US's Acceptance Criteria
- All US### codes are unique (US001–US024)
- All acceptance criteria are testable and cite `file:line`
- All technical notes carry an Endpoint (or an explicit `N/A` reason)
- All US### codes will be referenced in FeatureList.md — N/A this wave, FeatureList.md does not exist until W5/W5.6
- All `ui` US### are mapped to a valid SCR### or SCR###/REG### (parent SCR exists in screen-list.md, gate-passed)
- No `system`-typed US### exist this run, so the "≥1 BL### mapped" requirement for that type is vacuously satisfied; US002 and US017 (both `ui`-typed) additionally cite BL001/BL002/BL004 informatively under **Background Logic**, which is permitted but not required for `ui` stories
- No orphaned US### references
- Every screen (including the 2 `[IPE_ZERO]` screens) is accounted for in the Screen→US Map
