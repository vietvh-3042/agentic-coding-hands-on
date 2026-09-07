---
status: implemented
fcode: F001
authored_by: takumi
created: 2026-09-06
---

# SCR-login_Login — Screen Spec

**Screen**: SCR-login (draft — number allocated at promote): Login
**Feature**: F001_GoogleSignIn (draft — fcode allocated at promote)
**Type**: atomic
**Route**: /login
**Generated**: 2026-09-06

## 1. Overview

**Purpose:** A Sun* member without a session lands here to sign in with their Google account
before accessing any part of SAA 2025.
**Actors:** Sun* member (unauthenticated visitor)
**Entry Conditions:** No valid Supabase session — either the route guard redirected the member
here, or they navigated to `/login` directly.
**Exit Conditions:** A successful Google sign-in exchanges to a valid session and the member is
redirected to `/countdown` or `/about`; the member may also stay on this screen after a failed
attempt and retry.

## 2. Screen Layout

### Layout Sketch

Three regions over a full-bleed hero background: a fixed top header (logo + language selector),
a centered hero/content area (key visual, subtitle copy, the Google sign-in button, and — only
after a failed attempt — an inline error message), and a fixed bottom footer (copyright). No
sidebar, no modal (`app/login/page.tsx:24-34`).

```
┌───────────────────────────────────────────────┐
│ R1: Header — logo + language (fixed-top)       │
├─────────────────────────────────────────────────┤
│                                                  │
│   R2: Hero — key visual, subtitle,              │
│       "LOGIN With Google" button,               │
│   - - (R2a: inline error, conditional) - - -    │
│                                                  │
├─────────────────────────────────────────────────┤
│ R3: Footer — copyright (fixed-bottom)           │
└───────────────────────────────────────────────┘
```

### Layout Regions

| Region ID | Name           | Position     | Scrollable | Key Components                                                                                                                   |
| --------- | -------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| R1        | Header         | fixed-top    | no         | `SiteHeader` (`components/login/site-header.tsx:5-19`)                                                                           |
| R2        | Hero / Content | static       | no         | `HeroSection`, `GoogleLoginButton` (`components/login/hero-section.tsx:18-88`, `components/login/google-login-button.tsx:19-54`) |
| R3        | Footer         | fixed-bottom | no         | `SiteFooter` (`components/login/site-footer.tsx:6-16`)                                                                           |

## 3. UI Elements

| ID  | Element                      | Type          | Required | Default             | Visibility                                     | Action                                         | Source                                           | Format | Empty Behavior | Cross-ref                                 |
| --- | ---------------------------- | ------------- | -------- | ------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ | ------ | -------------- | ----------------------------------------- |
| E01 | Sun* Annual Awards 2025 logo | image         | —        | visible             | Always                                         | —                                              | `components/login/site-header.tsx:8-15`          | raw    | —              | N/A                                       |
| E02 | Language selector (VN/EN)    | select        | —        | VN                  | Always                                         | Switches locale, persists `NEXT_LOCALE` cookie | `components/common/language-selector.tsx:28-117` | raw    | —              | N/A                                       |
| E03 | Key visual ("ROOT FURTHER")  | image         | —        | visible             | Always                                         | —                                              | `components/login/hero-section.tsx:67-74`        | raw    | —              | N/A                                       |
| E04 | Subtitle copy                | display field | —        | localized text      | Always                                         | —                                              | `components/login/hero-section.tsx:77-81`        | raw    | —              | i18n `login:hero.subtitleLine1/2`         |
| E05 | "LOGIN With Google" button   | button        | —        | idle (icon + label) | Always                                         | Starts Google sign-in                          | `components/login/google-login-button.tsx:19-54` | raw    | —              | N/A                                       |
| E06 | Loading spinner (on E05)     | display field | —        | hidden              | Conditional — while `loading` is true          | —                                              | `components/login/google-login-button.tsx:37-41` | raw    | hidden         | N/A                                       |
| E07 | Sign-in error message        | message       | —        | hidden              | Conditional — after a failed/cancelled sign-in | —                                              | TBD (draft) — not yet wired                      | raw    | hidden         | i18n `login:googleButton.error` (planned) |
| E08 | Copyright bar                | display field | —        | visible             | Always                                         | —                                              | `components/login/site-footer.tsx:9-14`          | raw    | —              | i18n `common:copyright`                   |

## 4. User Actions

### Available Actions

| Action               | Element | Trigger                     | Condition                  | Result on this screen                                                                                            | Source                                                                                             |
| -------------------- | ------- | --------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Switch language      | E02     | click + select VN/EN        | —                          | Page copy and `<html lang>` update to the chosen locale                                                          | `components/common/language-selector.tsx:36-46`                                                    |
| Start Google sign-in | E05     | click                       | button not already loading | E05 switches to its loading state (E06 spinner, disabled, `aria-busy`); browser begins the Google OAuth redirect | TBD (draft) — `onClick` is currently a no-auth stand-in, `components/login/hero-section.tsx:25-27` |
| Retry after failure  | E05     | click, after E07 is visible | —                          | Same as "Start Google sign-in" above; E07 clears                                                                 | TBD (draft)                                                                                        |

### Happy Path

1. Member arrives at Login and sees the header, hero visual, subtitle, and the "LOGIN With
   Google" button (E05) in its idle state.
2. Member clicks E05 — it disables and shows the loading spinner (E06) while the Google consent
   screen and sign-in exchange run off-screen.
3. On success, the browser navigates away from Login entirely, to `/countdown` or `/about`
   depending on whether the event has started.

### Branches

| Decision point | Condition                                                           | Outcome on this screen                                                                                | Source      |
| -------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------- |
| Step 2         | Member cancels or denies Google consent, or the code exchange fails | Browser returns to Login; E05 resets to idle and E07 becomes visible with the localized error message | TBD (draft) |

## 5. UI States

| State   | Trigger                                                           | Visual Behavior                                                                                            | User Action Available | Source                                           |
| ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| idle    | initial render, or after a failed attempt is dismissed by a retry | E05 shows icon + "LOGIN With Google" label                                                                 | click E05             | `components/login/google-login-button.tsx:34-51` |
| loading | E05 clicked                                                       | E05 disabled, `aria-busy="true"`, spinner (E06) replaces the icon, label switches to the "signing in" copy | none                  | `components/login/google-login-button.tsx:30-41` |
| error   | sign-in failed, cancelled, or code exchange rejected              | E07 becomes visible with the localized failure message; E05 returns to idle                                | click E05 to retry    | TBD (draft)                                      |
| success | sign-in exchange succeeded                                        | screen is left entirely — no success state renders on Login itself                                         | none                  | TBD (draft)                                      |

## 6. Validation & Feedback

| Element | Rule                                                                                                      | Feedback                                                                                                   | Trigger         |
| ------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------- |
| E05     | Sign-in must complete via a real Google account; no domain allowlist restricts which accounts may sign in | none — a permitted sign-in simply redirects away                                                           | server response |
| E07     | Any cancellation, denial, or failed code exchange shows the same message                                  | "Đăng nhập không thành công. Vui lòng thử lại." (localized; English copy TBD — see Gaps for Clarification) | server response |

## 7. Conditional UI

| Condition                                               | Type          | Element(s) | Visible when                                                         | Hidden when                                          | Notes                                                      |
| ------------------------------------------------------- | ------------- | ---------- | -------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Sign-in error message only shows after a failed attempt | configuration | E07        | a sign-in attempt has failed/been cancelled since the last page load | on initial load, and once dismissed by a new attempt | no auth/feature-flag gate — purely local UI state (SM-001) |

## 8. Navigation

### Entry Points

| From                                                                           | Trigger there                     | Condition                  | Source                                   |
| ------------------------------------------------------------------------------ | --------------------------------- | -------------------------- | ---------------------------------------- |
| any protected route (`/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info`) | member has no valid session       | route guard redirects here | TBD (draft) — `proxy.ts` not yet written |
| external                                                                       | direct URL navigation to `/login` | —                          | N/A                                      |

### Exits

| Action                                | Element                     | Condition                              | Destination                     | Result   | Source                                   |
| ------------------------------------- | --------------------------- | -------------------------------------- | ------------------------------- | -------- | ---------------------------------------- |
| Successful sign-in, event not started | E05                         | `isBeforeLaunch()` true at click time  | `/countdown` (external screen)  | redirect | `lib/countdown-config.ts:27-30`          |
| Successful sign-in, event started     | E05                         | `isBeforeLaunch()` false at click time | `/about` (external screen)      | redirect | `lib/countdown-config.ts:27-30`          |
| Already-authenticated visit to Login  | — (guard-level, no element) | member already has a valid session     | same post-login target as above | redirect | TBD (draft) — `proxy.ts` not yet written |

## 9. Accessibility

| Aspect                      | Status     | Notes                                                                                                                                              |
| --------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARIA roles/labels           | [EXPECTED] | E05 already carries `aria-busy` (`components/login/google-login-button.tsx:31`); E07's `role="alert"`/`aria-live` wiring is planned, not yet built |
| Keyboard navigation         | [EXPECTED] | E05 and E02 are native `<button>` elements, keyboard-operable by default; no custom tab order planned                                              |
| Focus management            | [EXPECTED] | No modal/drawer on this screen; focus stays on E05 through the loading state                                                                       |
| Screen reader compatibility | [EXPECTED] | Relies on E05's existing `aria-busy` plus the planned `role="alert"` on E07                                                                        |
| Error announcement          | [EXPECTED] | E07 is planned to use `aria-live`/`role="alert"` so a screen reader announces the failure without the member needing to find it visually           |

## 10. Responsive Behavior

| Breakpoint      | Region / Element                | Behavior                                                     | Source                                                                                                              |
| --------------- | ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| mobile (`< sm`) | R2 / E03 key visual             | shrinks to `w-64`                                            | `components/login/hero-section.tsx:73`                                                                              |
| tablet (`sm`)   | R2 / E03                        | grows to `w-80`                                              | `components/login/hero-section.tsx:73`                                                                              |
| desktop (`lg`)  | R2 / E03, header/footer padding | key visual reaches `w-[451px]`; header/footer padding widens | `components/login/hero-section.tsx:73`, `components/login/site-header.tsx:7`, `components/login/site-footer.tsx:10` |
