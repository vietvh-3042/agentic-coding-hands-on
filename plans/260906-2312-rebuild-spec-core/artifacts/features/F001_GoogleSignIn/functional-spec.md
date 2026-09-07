---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths -->
<!-- Contract: references/feature-spec-researcher-contract.md -->

# Functional Spec — F001_GoogleSignIn

**Priority**: P1
**Type**: mixed
**Generated**: 2026-09-07

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F001 → SCR001, SCR002, SCR004, SCR005, SCR006 → US001, US002, US004 → BL001 → ROUTE001

## 1. Overview

**Problem:** Sun\* members need a low-friction way to reach the SAA 2025 / Kudos app using an
account they already have, without managing a separate password — and the app needs to know
reliably who is asking, so every other screen stays private to that one person and the access
ends cleanly when they leave.
**Solution:** A member signs in with their Google account; Supabase Auth issues a session, and
that same session gates every other screen in the app. Ending the session (signing out) is the
reverse half of the same lifecycle, not a separate concern.
**Scope:** Google OAuth sign-in, automatic session-based protection of every other screen, and
sign-out.
**Non-Scope:** Any sign-in method other than Google (no password/email login exists); role-based
access control — an account-level admin flag exists in the data but no screen or rule reads it
yet (see § 11 Risks & Known Issues); editing the member's own profile.

**Actors**

| Actor            | Description                           | Primary goal                                       |
| ---------------- | ------------------------------------- | -------------------------------------------------- |
| Visitor          | Anyone who has not yet signed in      | Sign in with Google to reach the rest of the app   |
| Signed-in Member | A Sun\* member with an active session | Use the app, and cleanly end the session when done |

## 2. Functional Capabilities

| ID     | Capability          | What the user can do                                                                                                                                   | User Stories | Requirements                                           | Business Rules                                             | Screens                |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| CAP-01 | Sign In with Google | A visitor signs in with their Google account, lands on the right next screen automatically, and cannot re-open the Login screen once already signed in | US001, US002 | FR-001, FR-101, FR-201, FR-202, FR-203, FR-402, FR-601 | BR-001, BR-002, DEC-001, DEC-002, DEC-003, DEC-004, SM-001 | SCR001, SCR002         |
| CAP-02 | Sign Out            | A signed-in member ends their session from anywhere in the app                                                                                         | US004        | FR-401                                                 | BR-003, BR-004                                             | SCR004, SCR005, SCR006 |

## 3. Open Decisions

None — no unresolved domain confirmations.

## 4. Requirements

### Foundation (0xx)

- **FR-001** A member's account record is created automatically the first time they sign in with
  Google — nothing about using the rest of the app depends on a separate signup step.

### Navigation (1xx)

- **FR-101** Visiting the site's root address redirects the visitor straight to the Login screen.

### Login Screen (2xx)

- **FR-201** The Login screen shows a "Login With Google" button; selecting it starts the Google
  sign-in flow.
- **FR-202** If starting the Google sign-in flow fails immediately (for example, no network), an
  inline error is shown on the Login screen and the button becomes usable again.
- **FR-203** Returning from Google's consent screen completes sign-in automatically and routes the
  member onward with no manual step.

### Interaction (4xx)

- **FR-401** Signing out ends the session and returns the member to the Login screen from any
  screen in the app.
- **FR-402** Opening the Login screen while already signed in redirects the member onward instead
  of showing the login form again.

### Security (6xx)

- **FR-601** Every screen except Login and the sign-in return-trip requires an active session;
  without one, the visitor is redirected to Login.

## 5. Business Rules

- A first-time Google sign-in automatically creates the member's account record, so features that
  depend on it (such as posting a kudo) never fail for a brand-new signer. (BR-001)
- The post-sign-in destination is always decided by the server itself, never by anything the
  browser carries back from Google. (DEC-001)
- An already-signed-in member who opens the Login screen directly is sent onward automatically
  instead of seeing the login form again. (DEC-002)
- Any failure completing sign-in — a cancelled consent, an expired code, or an infrastructure
  fault — shows the same generic message, with no distinct wording per cause. (DEC-003)
- Anyone without an active session who tries to open any screen other than Login is sent to Login
  automatically. (DEC-004)
- Every request's session is re-checked against the Auth service itself on every request, rather
  than trusting a locally stored session as-is. (BR-002)
- Signing out never shows the member as signed out unless the sign-out call itself succeeded. (BR-003)
- After signing out, the app clears its local page cache so navigating back does not show a
  protected page that was cached while still signed in. (BR-004)
- The session a member moves through is: signed out → signed in (via Google) → signed out again
  (via Sign out). (SM-001)

## 6. Screens

| Screen Name                                          | SCR###                                                             | What User Sees                                                                                           | What User Can Do                               |
| ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Root                                                 | SCR001_RootRedirect                                                | Nothing — the screen never renders; it is an unconditional entry point                                   | Nothing — immediately sent to the Login screen |
| Login                                                | SCR002_LoginScreen                                                 | Key visual, "Login With Google" button, and (if returning from a failed attempt) an inline error message | Start Google sign-in                           |
| About / Award Info / Sun Kudos Board (shared chrome) | SCR004_AboutHomepage, SCR005_AwardInfoScreen, SCR006_SunKudosBoard | The account menu in the shared header (rest of each screen belongs to its own feature)                   | Sign out                                       |

### User Journey

1. A visitor arrives at the site root and is silently sent to the Login screen.
2. The visitor sees the Login screen and selects "Login With Google."
3. The visitor is taken to Google, grants consent, and is returned automatically — landing on the
   Countdown screen or the About screen depending on whether the event has started.
4. Later, from any signed-in screen, the member opens the account menu and selects "Sign out,"
   returning to the Login screen.

## 7. User Stories

### US001_SignInWithGoogle — Sign In with Google

**Actor:** Visitor
**Goal:** Sign in with a Google account so I can access the Sun\* Kudos app.
**Business value:** Removes the need for a separate password, using an account members already
have.

**Acceptance Criteria:**

- [ ] Selecting "Login With Google" starts the Google sign-in flow and shows the button as busy.
- [ ] A failure starting the flow shows an inline error and lets the visitor try again.
- [ ] The next screen after Google is always decided by the app itself, never by the address the
      browser brings back.

### US002_CompleteGoogleSignIn — Complete Google Sign-In

**Actor:** Visitor (returning from Google)
**Goal:** Have my sign-in finish automatically so I land on the correct screen without any manual
navigation.
**Business value:** A returning-from-Google visitor is never left stranded or forced to retry
manually.

**Acceptance Criteria:**

- [ ] Returning from Google with a successful consent lands the member on the Countdown screen (if
      the event has not started) or the About screen (if it has).
- [ ] Any failure — cancelled, expired, or otherwise — lands the visitor back on the Login screen
      with an inline error.
- [ ] A brand-new Google account gets its member record created automatically, with no visible
      wait or extra step.

### US004_SignOut — Sign Out

**Actor:** Signed-in Member
**Goal:** Sign out so my session ends and I can no longer reach protected screens from this
browser.
**Business value:** Lets a member end their access deliberately, for example on a shared device.

**Acceptance Criteria:**

- [ ] Selecting "Sign out" ends the session and returns the member to the Login screen.
- [ ] If sign-out fails, the account menu stays open and nothing is shown as changed.

## 8. Scenarios

### US001_SignInWithGoogle — Happy Path

**Given** the visitor is on the Login screen, unauthenticated, **When** the visitor selects
"Login With Google," **Then** the browser navigates to Google's consent screen and the button
shows as busy.

### US001_SignInWithGoogle — Error: sign-in flow fails to start

**Given** the visitor is on the Login screen and the Google sign-in client cannot start (for
example, offline), **When** the visitor selects "Login With Google," **Then** an inline error
message appears and the button becomes usable again.

### US002_CompleteGoogleSignIn — Happy Path

**Given** the visitor has granted consent on Google and the event has not yet started, **When**
Google returns the visitor to the app, **Then** the session is established and the browser lands
on the Countdown screen.

### US002_CompleteGoogleSignIn — Error: sign-in cannot be completed

**Given** Google returns the visitor to the app without a usable result (cancelled, expired, or an
infrastructure fault), **When** the app tries to complete the sign-in, **Then** the browser lands
on the Login screen with an inline error message.

### US004_SignOut — Happy Path

**Given** the member is signed in with the account menu open, **When** the member selects
"Sign out," **Then** the session ends and the browser returns to the Login screen.

### US004_SignOut — Error: sign-out fails

**Given** the member is signed in with the account menu open and the sign-out call fails, **When**
the member selects "Sign out," **Then** the menu stays open and nothing is shown as changed.

## 9. Edge Cases

| Scenario                                                                                                 | What Happens                                                                  | User-Facing Message                                      |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| The Google sign-in client cannot start (offline, misconfigured)                                          | The button re-enables; nothing is sent to Google                              | "Something went wrong signing you in. Please try again." |
| Returning from Google without a usable result, for any reason (cancelled, expired, infrastructure fault) | The visitor lands back on the Login screen; the specific cause is never shown | "Something went wrong signing you in. Please try again." |
| An already-signed-in member opens the Login screen directly                                              | Redirected onward instead of seeing the login form again                      | "None — silent handling"                                 |
| Anyone without an active session opens any other screen directly by address                              | Redirected to the Login screen                                                | "None — silent handling"                                 |
| Sign-out fails                                                                                           | The account menu stays open; nothing changes visibly                          | "None — silent handling (logged internally only)"        |

## 10. Edge Behaviours to Verify

- **FR-203** → Confirm that returning from a successful Google sign-in always lands on the correct
  next screen (Countdown vs. About) for both event-timing states.
- **FR-601** → Confirm that a direct address to any protected screen, while signed out, always
  lands on Login instead of the requested screen.
- **FR-401** → Confirm that after signing out, going back in the browser does not show a protected
  screen that was cached while still signed in.

## 11. Risks & Known Issues

| ID      | Type        | Description                                                                                                                                                                                                                                                                                                   | Impact                                                                                                                  | Status       |
| ------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| RISK-01 | known-issue | The account record carries an admin/user flag, but no screen or rule reads it yet — the "Admin Dashboard" item in the account menu shows for every signed-in member regardless of that flag's value                                                                                                           | Any signed-in member sees a menu entry implying admin access they may not actually have                                 | confirmed    |
| RISK-02 | risk        | If the app is ever reachable on more than one hostname at once (for example both a bare IP and a domain name), a member could complete Google sign-in but silently fail to stay signed in, because the app deliberately returns the browser to the same host it was already using rather than a fixed address | A returning member could bounce back to the Login screen with no visible error after apparently signing in successfully | [UNVERIFIED] |

## 12. Dependencies

| Dependency                | Type             | Why this feature needs it                                                                      | Evidence            |
| ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- | ------------------- |
| Google OAuth              | external-service | Sign-in cannot complete without Google's consent screen being reachable                        | US001               |
| Supabase Auth             | external-service | Issues, refreshes, and clears the session behind sign-in, route protection, and sign-out alike | US001, US002, US004 |
| Launch-time configuration | config           | Decides whether a freshly signed-in member lands on Countdown or About                         | US002               |

## 13. Configuration

```text
NEXT_PUBLIC_LAUNCH_AT = <ISO 8601 datetime>   # when the event goes live; decides Countdown vs. About right after sign-in
```
