---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F007_HomepageOverview

**Priority**: P1
**Type**: ui
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F007_HomepageOverview → SCR004 → US005, US009

## 1. Overview

**Problem:** A signed-in Sun\* Kudos App member needs one landing page after logging in (or after
the prelaunch countdown ends) that orients them to SAA 2025 — what awards exist, where the kudos
board is, and how the program rules work — without already knowing where to look.
**Solution:** `/about` shows a static post-login overview: a hero key visual with a decorative
countdown to the ceremony, two call-to-action buttons, a 6-card award teaser grid, a Sun\* Kudos
promo banner, and a floating widget button that opens a read-only SAA Rules drawer.
**Scope:** Present the homepage overview shell (hero, award teaser, kudos promo, floating rules
widget) for every signed-in member, plus the shared header/footer navigation chrome.
**Non-Scope:** Does not fetch or render any live award, kudos, or notification data (see
F002/F004/F008); does not implement session gating, notifications, or the admin role itself (those
are F001/F012/F013 — described only as chrome below, where they appear on this screen); does not
host its own kudo-composer form (F003 owns the shared Kudo Composer, only opened from here).

**Actors**

| Actor                  | Description                                              | Primary goal                                                                                           |
| ---------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Signed-in Sun\* member | Any authenticated user of the SAA 2025 / Sun\* Kudos app | Land on the overview after login, browse toward Award Info or Sun\* Kudos, and learn the program rules |

_(No cross-feature process-flow exists yet for this feature — `docs/flows/` is empty this pass.)_

## 2. Functional Capabilities

| ID     | Capability                                                   | What the user can do                                                                                                       | User Stories | Requirements                                                                   | Business Rules                                    | Screens |
| ------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- | ------- |
| CAP-01 | View the SAA 2025 homepage overview and its SAA Rules widget | See the hero countdown, award teaser grid, and kudos promo, and open the read-only SAA Rules drawer from a floating widget | US005, US009 | FR-001, FR-101, FR-201, FR-202, FR-203, FR-204, FR-205, FR-401, FR-402, FR-403 | BR-001, BR-002, DEC-001, DEC-002, DEC-003, SM-001 | SCR004  |

_(Single capability — 2 declared User Stories, below the `ui` warning band of 3-4, so no
Single-capability rationale line is required.)_

## 3. Open Decisions

| D### | Decision                                                                                                                                                                                                                                                                                                                                                     | Default proposal                               | Rationale                                                                                                                                      | Blocks work |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| D001 | The homepage's decorative ceremony countdown targets 26 Dec 2026, 18:30 (ICT); the separate `/countdown` prelaunch gate targets 31 Dec 2026, 18:00 (ICT); a third, unread `event_settings.launch_at` DB column holds 21 Jul 2026 — should these share one source of truth, or are a "ceremony date" and a "site-launch date" intentionally different events? | Ship as-is — keep the three values independent | Nothing currently depends on reconciling them; the homepage widget is purely decorative and changing it risks breaking an already-working page | no          |

## 4. Requirements

### Foundation (0xx)

- **FR-001** A signed-in session is required before `/about` renders; an unauthenticated visitor is redirected to `/login`.

### Navigation (1xx)

- **FR-101** Signed-in members reach the homepage via the header's "About SAA 2025" link, the footer's matching link or its "General Standards" link, or automatically once the `/countdown` timer expires.

### Homepage (2xx)

- **FR-201** The hero section shows a full-bleed key visual, the "ROOT FURTHER" wordmark and intro copy, and two call-to-action buttons linking toward Award Information and Sun\* Kudos.
- **FR-202** A decorative "days / hours / minutes" countdown ticks toward a fixed ceremony date, independent of the site-launch gate (see BR-001, D001).
- **FR-203** A static 6-card award teaser grid (two rows of three) links each card toward its matching Award Information section.
- **FR-204** A static Sun\* Kudos promo banner links to the Sun\* Kudos board.
- **FR-205** A floating widget button offers quick access to the SAA Rules drawer and the shared Kudo Composer.

### Interaction (4xx)

- **FR-401** Selecting the floating widget's trigger expands two labelled action pills ("Rules", "Write KUDOS") above a close control.
- **FR-402** Selecting "Rules" opens the SAA Rules drawer, showing static hero-tier badges, 6 collectible icons, and national-kudos copy; it closes on backdrop click, the Escape key, or its own close button.
- **FR-403** Selecting "Write KUDOS" — from the widget directly, or from the Rules drawer's own footer button — hands off to the shared Kudo Composer (owned by F003).

### Security (6xx)

N/A — covered by FR-001 (Foundation); this feature enforces no additional access rule of its own.

## 5. Business Rules

- The hero's ceremony countdown ticks toward a fixed date (26 Dec 2026, 18:30 ICT) that is independent of the separate site-launch gate driving `/countdown` (BR-001)
- The award teaser grid and Sun\* Kudos promo banner render only static/mock content — no database is read to build this screen (BR-002)
- Selecting "Rules" on the floating widget opens the SAA Rules drawer and collapses the widget (DEC-001)
- Selecting "Write KUDOS" on the floating widget opens the shared Kudo Composer and collapses the widget (DEC-002)
- Selecting "Write KUDOS" inside the open Rules drawer closes the drawer and opens the shared Kudo Composer (DEC-003)
- Tracks whether the floating widget's action pills are expanded or collapsed (SM-001)

## 6. Screens

| Screen Name      | SCR###               | What User Sees                                                                                                                                                                      | What User Can Do                                                                                                                    |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| About / Homepage | SCR004_AboutHomepage | Hero key visual with ceremony countdown, intro copy, and CTA buttons; a 6-card award teaser grid; a Sun\* Kudos promo banner; shared header/footer chrome; a floating widget button | Navigate to Award Information or Sun\* Kudos, open the SAA Rules drawer, and (from the widget or the drawer) open the Kudo Composer |

### User Journey

1. A signed-in member arrives at the homepage — from the header/footer nav, from `/countdown` expiring, or right after sign-in — and sees the hero, award grid, and kudos promo.
2. The member clicks a hero CTA, an award card, or the kudos promo link, and is taken toward Award Information or Sun\* Kudos.
3. Alternatively, the member opens the floating widget and selects "Rules" — the SAA Rules drawer slides in with static program rules.
4. From the drawer's own footer, or directly from the widget, the member selects "Write KUDOS" and is handed off to the shared Kudo Composer.

## 7. User Stories

### US005_ViewHomepage — View Homepage

**Actor:** Signed-in Sun\* member
**Goal:** Navigate back to the homepage from anywhere in the app
**Business value:** Lets a member re-orient to the award and kudos overview at any point, instead of being stranded on a sub-page.

**Acceptance Criteria:**

- [ ] Clicking "About SAA 2025" in the header routes to the homepage.
- [ ] Clicking the matching footer link, or the footer's "General Standards" link, also routes to the homepage.
- [ ] The active nav item is visually highlighted when already on the homepage.

### US009_ViewSaaRules — View SAA Rules

**Actor:** Signed-in Sun\* member
**Goal:** View the SAA rules (hero-tier badges, collectible icons, national-kudos rules)
**Business value:** Helps the member understand how the kudos/awards program works before they participate.

**Acceptance Criteria:**

- [ ] Clicking the floating widget's "Rules" pill opens the SAA Rules drawer.
- [ ] The drawer closes on backdrop click, the Escape key, or its own close button.
- [ ] The drawer's content (hero-tier badges, 6 collectible icons, national-kudos copy) is static and read-only — no data is fetched to show it.

## 8. Scenarios

### US005_ViewHomepage — Happy Path

**Given** an authenticated session on `/award-info`, **When** the member clicks "About SAA 2025" in the header, **Then** the browser routes to the homepage and the nav item highlights active.

### US005_ViewHomepage — Error: navigation cannot complete

**Given** an authenticated session, **When** the browser fails to load the homepage route (e.g. a client-side chunk load error), **Then** Next.js's own default error handling applies — this feature defines no bespoke error state of its own.

### US009_ViewSaaRules — Happy Path

**Given** the floating widget is closed, **When** the member clicks the trigger then "Rules", **Then** the SAA Rules drawer slides in showing the 4 hero-tier badges, 6 collectibles, and national-kudos copy.

### US009_ViewSaaRules — Error: no JavaScript

**Given** JavaScript fails to load or is disabled in the browser, **When** the member tries to click the floating widget, **Then** nothing opens — the widget, drawer, and countdown are all client-only and have no non-JS fallback.

## 9. Edge Cases

| Scenario                                                                                              | What Happens                                                                                                                                                                                         | User-Facing Message                                                                |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| The ceremony countdown reaches zero while the member is on the homepage                               | The "days/hours/minutes" digits show 00 for every unit and the "coming soon" banner disappears; nothing else changes — unlike the separate `/countdown` page, this widget never redirects or reloads | "None — the countdown simply stops, no message shown"                              |
| Member reopens the floating widget and selects "Write KUDOS" while the SAA Rules drawer is still open | Both the SAA Rules drawer and the Kudo Composer can end up open at the same time — the two panels are independent client states with no mutual-exclusion guard (see RISK-02)                         | "None — no warning message; the two panels may visually overlap"                   |
| Member clicks a Hero CTA button or an award card's "See details" link                                 | The browser does a full page reload to Award Information or Sun\* Kudos, instead of the in-app transition every other same-purpose link on this screen uses (see RISK-01)                            | "None — the destination page loads normally, just with a full reload"              |
| JavaScript fails to load or is disabled in the browser                                                | The floating widget, its Rules drawer, and the countdown digits never become interactive — the static hero, award grid, and kudos promo markup still show                                            | "None — no error message; the interactive widget/countdown simply never activates" |

## 10. Edge Behaviours to Verify

- **FR-202** → Confirm the hero countdown ticks down toward the fixed ceremony date and freezes at 00:00 without navigating away, independent of whether `/countdown`'s own gate is still open.
- **FR-402** → Confirm the SAA Rules drawer opens from the widget and closes via backdrop click, Escape, and its own close button.
- **FR-403** → Confirm selecting "Write KUDOS" from either the widget or the Rules drawer's footer opens the shared Kudo Composer.
- **FR-101** → Confirm every nav path (header, footer, footer's "General Standards" link, and the `/countdown` auto-redirect) lands on the homepage.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                                         | Impact                                                                                                                                                           | Status    |
| ------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| RISK-01 | known-issue | The hero CTA buttons and the award card "See details" links use plain anchor tags that trigger a full page reload, unlike every other same-purpose link on this screen (header nav, footer nav, kudos promo link), which use client-side navigation | Member loses client-side transition performance and any in-memory UI state when clicking these specific links                                                    | confirmed |
| RISK-02 | risk        | The floating widget's "Rules" and "Write KUDOS" states are independent booleans with no mutual-exclusion guard                                                                                                                                      | Reopening the widget while the Rules drawer is still open and selecting "Write KUDOS" can leave both the Rules drawer and the Kudo Composer open/visible at once | confirmed |

## 12. Dependencies

| Dependency                  | Type    | Why this feature needs it                                                                                                                   | Evidence         |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| F003 (Kudo Composer)        | feature | The floating widget's "Write KUDOS" pill, and the Rules drawer's own footer button, both open the shared Kudo Composer modal that F003 owns | DEC-002, DEC-003 |
| F001 (Google Sign-In)       | feature | The whole screen requires an active session (FR-001), and the header's "Sign out" chrome (owned by F001/US004) renders here                 | FR-001           |
| F012 (In-App Notifications) | feature | The header's notification bell renders on this screen but is presentational-only chrome owned by F012                                       | —                |
| F013 (Admin Role Gate)      | feature | The header's "Admin Dashboard" menu item renders on this screen but the gate itself is unimplemented and owned by F013                      | —                |

## 13. Configuration

```text
HERO_EVENT_DATE = 26 Dec 2026, 18:30 (ICT)   # decorative "days to ceremony" hero widget target;
                                              # independent of the separate site-launch gate (D001)
```
