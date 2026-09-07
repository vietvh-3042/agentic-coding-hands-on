---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F008_AwardInformationBrowsing

**Priority**: P1
**Type**: ui
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F008 → SCR005 → US006, US008

## 1. Overview

**Problem:** Members want to know what awards exist, what each is worth, and how to find the one
they care about quickly, without asking a colleague or leaving the app.
**Solution:** A dedicated Award Information page shows all 6 award categories as detail cards
(image, description, quantity, prize value), with a nav that jumps straight to any category.
**Scope:** Viewing the 6 award categories' details, and jumping between them via a category nav or
manual scroll.
**Non-Scope:** No award data is stored in or read from a database, computed dynamically, or
personalized per member — every member sees identical, fixed content. This page does not track
which award, if any, a given member has actually received.

**Actors**

| Actor            | Description                           | Primary goal                                                                   |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| Signed-in Member | A Sun\* member with an active session | Read about the 6 award categories and jump straight to the one they care about |

## 2. Functional Capabilities

| ID     | Capability              | What the user can do                                                                               | User Stories | Requirements                   | Business Rules         | Screens                                                          |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------- | ------------ | ------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| CAP-01 | View Award Information  | Open the Award Information page and read all 6 award categories' details                           | US006        | FR-001, FR-101, FR-201, FR-601 | — (see FR-001)         | SCR005                                                           |
| CAP-02 | Browse Award Categories | Jump to a specific award category via the left nav, or have it track scroll position automatically | US008        | FR-401                         | BR-001, BR-002, SM-001 | N/A — operates on the same screen CAP-01 renders; see Note below |

**Note:** `SCR005` is claimed once here under CAP-01, the entry point that renders the Award
Information screen. CAP-02's category-nav interaction (click-to-scroll and scrollspy) runs
entirely within that already-rendered screen and produces no screen of its own — so it does not
own a screen claim independently of CAP-01's.

## 3. Open Decisions

None — no unresolved domain confirmations.

## 4. Requirements

### Foundation (0xx)

- **FR-001** All 6 award categories' names, descriptions, prize amounts, quantities, and images are
  fixed values maintained in the app's code, not stored in or read from a database.

### Navigation (1xx)

- **FR-101** A signed-in member reaches the Award Information page from the header nav link, the
  footer nav link, or the "About Awards" button on the homepage.

### Award Info Screen (2xx)

- **FR-201** The Award Information page shows a keyvisual banner followed by all 6 award
  categories, each as a detail card in a fixed alternating left/right layout.

### Interaction (4xx)

- **FR-401** Selecting a category in the left nav jumps to that category's section and marks it
  active; scrolling the page manually also updates which category is marked active.

### Security (6xx)

- **FR-601** Opening the Award Information page requires an active session; a visitor without one
  is sent to the Login screen instead.

## 5. Business Rules

- The category nav marks active whichever section is currently furthest up the visible part of the
  screen. (BR-001)
- Clicking a category holds it active for a brief window, so scrolling past other sections during
  the jump doesn't override the choice. (BR-002)
- Which category is marked active moves between the 6 categories as the member clicks or scrolls.
  (SM-001)

## 6. Screens

| Screen Name       | SCR###                 | What User Sees                                                                                                                              | What User Can Do                                                                                                                 |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Award Information | SCR005_AwardInfoScreen | Keyvisual banner, a sticky left category nav, and all 6 award categories as detail cards (image, title, description, quantity, prize value) | Jump to any category via the nav, scroll through them manually, or sign out from the shared account menu (see F001_GoogleSignIn) |

### User Journey

1. Member arrives at the Award Information page (from the header/footer nav or the homepage CTA)
   and sees the keyvisual banner and the first award category.
2. Member clicks a category in the left nav — the page jumps straight to that category's card and
   the nav highlights it.
3. Member scrolls manually through the remaining categories — the nav keeps highlighting whichever
   one is currently in view.

## 7. User Stories

### US006_ViewAwardInformation — View Award Information

**Actor:** Signed-in Member
**Goal:** Open the Award Information page so I can read about the 6 award categories.
**Business value:** Lets a member learn what's up for grabs without asking a colleague or checking
outside the app.

**Acceptance Criteria:**

- [ ] Selecting "Award Information" in the header or footer, or "About Awards" on the homepage,
      opens the Award Information page.
- [ ] The page shows the keyvisual banner and all 6 award categories.
- [ ] Opening the page while signed out sends the visitor to the Login screen instead.

### US008_BrowseAwardCategories — Browse Award Categories

**Actor:** Signed-in Member
**Goal:** Jump to a specific award category so I can read its details without manually scrolling.
**Business value:** Saves time finding the one category a member actually cares about, out of 6.

**Acceptance Criteria:**

- [ ] Clicking a category in the left nav jumps to that category and marks it active.
- [ ] Scrolling manually (no click) also updates which category is marked active.
- [ ] Clicking a category holds it active briefly, so scrolling past other sections mid-jump
      doesn't override the choice.

## 8. Scenarios

### US006_ViewAwardInformation — Happy Path

**Given** the member is signed in, **When** they select "Award Information" from the header nav,
**Then** the browser opens the Award Information page and the keyvisual banner plus all 6 award
categories render.

### US006_ViewAwardInformation — Error: not signed in

**Given** the visitor has no active session, **When** they request the Award Information page
directly, **Then** they are sent to the Login screen instead of seeing any award content.

### US008_BrowseAwardCategories — Happy Path

**Given** the member is on the Award Information page with a category off-screen, **When** they
click that category in the left nav, **Then** the page jumps to that category's card and the nav
marks it active immediately.

### US008_BrowseAwardCategories — Edge: manual scroll right after a click

**Given** the member has just clicked a category, **When** they also scroll manually within the
same instant, **Then** the clicked category stays marked active until a brief hold window passes,
rather than flickering to whatever section the manual scroll passes through.

## 9. Edge Cases

| Scenario                                                                         | What Happens                                                                                        | User-Facing Message               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------- |
| A visitor without an active session requests the Award Information page directly | Sent to the Login screen before any award content renders                                           | "None — silent redirect"          |
| Member scrolls quickly past several categories without clicking                  | The nav updates continuously to whichever category is currently furthest up the visible screen area | "None — silent handling"          |
| Member clicks a category, then scrolls manually within less than a second        | The clicked category stays marked active until the brief hold window elapses                        | "None — silent handling"          |
| An award's image fails to load (e.g. a missing file)                             | The image area shows the browser's built-in broken-image fallback; no custom placeholder or message | "None — no custom fallback shown" |

## 10. Edge Behaviours to Verify

- **FR-601** → Confirm a signed-out visitor requesting the Award Information page directly lands on
  the Login screen, never on award content.
- **FR-401** → Confirm the category nav's active highlight always matches either the last-clicked
  category or the section currently in view — never both, never neither.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                | Impact                                                                                                                                     | Status    |
| ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| RISK-01 | known-issue | The page's own source comment claims "Presentational, no auth guard... a real guard is deferred to a later auth epic," but the shipped app-wide session gate actually protects this page like every other non-public route | A developer reading only this page's comment could wrongly assume the page is unprotected, and skip re-checking the guard when changing it | confirmed |

## 12. Dependencies

| Dependency                    | Type    | Why this feature needs it                                                                                                                  | Evidence |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Google Sign-In (F001)         | feature | The app-wide session gate this screen relies on to require sign-in, plus the shared account-menu "Sign out" control in the header chrome   | FR-601   |
| Kudos Board Data (F002)       | feature | The shared Sun\* Kudos promo banner at the bottom of this page links onward to the Sun\* Kudos board                                       | SCR005   |
| Interface Localization (F009) | feature | Every visible string on this page (category names, descriptions, prize notes, labels) resolves through the i18n system, not hardcoded text | SCR005   |

## 13. Configuration

`N/A — no user-facing configuration constants for this feature.`
