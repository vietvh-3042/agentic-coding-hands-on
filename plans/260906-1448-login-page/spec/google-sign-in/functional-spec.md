---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Functional Spec — F000_GoogleSignIn

**Priority**: P1
**Type**: mixed
**Generated**: 2026-09-06

**See also:** [`technical-spec.md`](./technical-spec.md) — endpoints, Source citations, pseudocode,
key entities, and DB writes for a Dev/QA/SA audience.

**Traceability:** F000_GoogleSignIn → SCR-login → US001, US002

## 1. Overview

**Problem:** Sun* members need a simple, low-friction way to sign in to SAA 2025 without the team
building and maintaining a separate password system.
**Solution:** Members sign in with their existing Google account; Supabase Auth handles the OAuth
exchange and issues a session that gates every other route until the member is authenticated.
**Scope:** Covers the Login screen's sign-in interaction, the Supabase browser/server client
setup, the OAuth callback exchange, session refresh, and the route guard protecting the rest of
the app.
**Non-Scope:** Does not cover signing out, storing a user profile, role-based permissions, or the
`/todo` destination named in the original design — that destination was superseded by the shipped
countdown/homepage redirect (see `clarifications.md`).

**Actors**

| Actor       | Description                                                 | Primary goal                           |
| ----------- | ----------------------------------------------------------- | -------------------------------------- |
| Sun* member | An employee with a Google account participating in SAA 2025 | Sign in and reach the rest of the site |

## 2. Functional Capabilities

| ID     | Capability     | What the user can do                                                                                                | User Stories | Requirements                                                           | Business Rules                                    | Screens   |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- | ------------------------------------------------- | --------- |
| CAP-01 | Google Sign-In | A member signs in with their Google account and is routed to the right page based on session state and event timing | US001, US002 | FR-001, FR-002, FR-101, FR-102, FR-201, FR-202, FR-203, FR-401, FR-601 | BR-001, BR-002, DEC-001, DEC-002, DEC-003, SM-001 | SCR-login |

## 3. Open Decisions

None — no unresolved domain confirmations. (Credential availability is tracked as an external
blocker in `clarifications.md` § Unresolved, not a domain decision this spec needs to make.)

## 4. Requirements

### Foundation (0xx)

- **FR-001** Supabase browser and server client factories exist so any part of the app can create
  an authenticated Supabase client via `@supabase/ssr`.
- **FR-002** Google is enabled as an external auth provider in the local Supabase config, reading
  real Google OAuth credentials from environment variables.

### Navigation (1xx)

- **FR-101** A Sun* member visiting any protected route without a valid session is redirected to
  Login.
- **FR-102** A signed-in member visiting Login is redirected away to the post-login target
  instead of seeing the form again.

### Login Screen (2xx)

- **FR-201** Clicking "LOGIN With Google" starts the Google sign-in flow and shows a loading
  state on the button until it resolves.
- **FR-202** A successful sign-in redirects the member to Countdown if the event has not started
  yet, or the Homepage once it has.
- **FR-203** A failed or cancelled sign-in shows a localized error message and returns the button
  to its idle state.

### Interaction (4xx)

- **FR-401** The member's selected language is preserved across the entire sign-in redirect chain
  and still applies after landing on the post-login page.

### Security (6xx)

- **FR-601** Every server-side authorization check re-verifies the session against the Supabase
  Auth server rather than trusting a client-supplied cookie alone.

## 5. Business Rules

- All Google accounts are permitted to sign in; no domain or email allowlist restricts access. (BR-001)
- Every route except Login and the OAuth callback route requires a valid, re-verified session;
  anything else is redirected to Login before it renders. (BR-002)
- Where the member lands after a successful sign-in depends on whether the event has started yet
  — the countdown page beforehand, the homepage after. (DEC-001)
- A successful code exchange sends the member to that target; a missing or failed exchange sends
  them back to Login with an error instead. (DEC-002, DEC-003)
- The sign-in button moves through idle, loading, and error states as the flow starts, succeeds,
  or fails. (SM-001)

## 6. Screens

| Screen Name | SCR###                                          | What User Sees                                                                                                                                                 | What User Can Do                                                            |
| ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Login       | SCR-login (draft — number allocated at promote) | Header (logo + language selector), hero visual with subtitle copy, the "LOGIN With Google" button in its idle/loading/error states, and a footer copyright bar | Switch language; click to sign in with Google; retry after a failed attempt |

### User Journey

1. Member arrives at Login and sees the Sun* Annual Awards 2025 hero visual with the "LOGIN With
   Google" button.
2. Member clicks the button — it disables and shows a loading spinner while the Google sign-in
   flow runs.
3. On success, the member is taken to Countdown (before the event starts) or the Homepage (after)
   — decided automatically, no separate step.
4. On cancellation or failure, the member is returned to Login with an inline error message and
   can retry.
5. A member who already has a session and navigates back to Login is redirected away
   automatically, without seeing the form.

## 7. User Stories

### US001 — Sign In With Google

**Actor:** Sun* member
**Goal:** Sign in to SAA 2025 using an existing Google account, without creating a new password.
**Business value:** Removes the friction and support burden of a separate credential system, using
an identity the member already trusts.

**Acceptance Criteria:**

- [ ] Clicking "LOGIN With Google" shows a loading state and starts the Google consent flow.
- [ ] A successful sign-in lands the member on Countdown or the Homepage depending on whether the
      event has started.
- [ ] A cancelled, denied, or failed sign-in returns the member to Login with a clear error
      message and lets them retry.

### US002 — Guarded Navigation

**Actor:** Sun* member
**Goal:** Be sent to Login automatically when visiting any part of the site without a session, and
be sent past Login automatically once already signed in.
**Business value:** Keeps the rest of the app private without the member having to remember to
sign in first or manually navigate around an already-completed sign-in.

**Acceptance Criteria:**

- [ ] Visiting `/`, `/about`, `/countdown`, `/sun-kudos`, or `/award-info` without a session
      redirects to Login.
- [ ] Visiting Login while already signed in redirects away to the post-login target instead of
      showing the form.

## 8. Scenarios

### US001 — Happy Path

**Given** an unauthenticated member is on the Login screen, **When** they click "LOGIN With
Google" and complete Google's consent successfully, **Then** they are redirected to Countdown
(before the event starts) or the Homepage (after).

### US001 — Error: Sign-in cancelled or denied

**Given** an unauthenticated member is on the Login screen, **When** they click "LOGIN With
Google" and cancel or deny consent on Google's screen, **Then** they are returned to Login with
the message "Đăng nhập không thành công. Vui lòng thử lại." and can retry.

### US002 — Happy Path

**Given** a member has no valid session, **When** they navigate directly to a protected route
such as `/about`, **Then** they are redirected to Login instead of seeing the page.

### US002 — Error: Already signed in

**Given** a member already has a valid session, **When** they navigate to Login, **Then** they
are redirected away to the post-login target instead of seeing the login form.

## 9. Edge Cases

| Scenario                                                                                   | What Happens                                                                                                                                                                 | User-Facing Message                                                                         |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Member cancels or denies Google consent                                                    | The callback treats this as a failed sign-in and redirects to Login with the failure flag, without attempting an exchange                                                    | "Đăng nhập không thành công. Vui lòng thử lại."                                             |
| Auth code is expired or already used                                                       | The callback's exchange fails and redirects to Login with the same failure flag rather than exposing the raw error                                                           | "Đăng nhập không thành công. Vui lòng thử lại."                                             |
| Callback is reached with no code at all (e.g. a bookmarked or directly-typed callback URL) | No exchange is attempted; redirects straight to Login with the failure flag                                                                                                  | "Đăng nhập không thành công. Vui lòng thử lại."                                             |
| Session refresh fails mid-navigation (e.g. the auth server is unreachable)                 | The guard treats an unrefreshable session as unauthenticated and redirects to Login rather than letting a stale session through                                              | "None — silent redirect; the message above only appears if the member then retries sign-in" |
| Member switches language right before signing in                                           | The chosen language cookie must still be present after the guard rebuilds the response for session refresh, so it still applies once the member lands on the post-login page | "None — silent, the UI simply renders in the previously selected language"                  |

## 10. Edge Behaviours to Verify

- **FR-201** → Confirm the button shows a loading spinner and is disabled from the moment it's
  clicked until the flow resolves one way or the other.
- **FR-202** → Confirm a successful sign-in lands on Countdown before the configured launch time
  and on the Homepage after it, matching the same predicate the pre-auth stand-in used.
- **FR-203** → Confirm a cancelled/denied/expired sign-in shows the exact localized error message
  and returns the button to its clickable idle state.
- **FR-101** → Confirm each of `/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info` redirects
  to Login when there is no valid session.
- **FR-102** → Confirm visiting Login while already signed in redirects away without showing the
  form.
- **FR-401** → Confirm the selected language is unchanged after the full sign-in redirect round
  trip.

## 11. Risks & Known Issues

N/A — none found.

## 12. Dependencies

| Dependency                                   | Type             | Why this feature needs it                                                                              | Evidence                                      |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Local Supabase stack (Docker)                | infrastructure   | Auth requires a running Supabase Auth (GoTrue) service to issue sessions                               | research report — Supabase/Google OAuth setup |
| Google Cloud OAuth client (Client ID/Secret) | external-service | Google is the identity provider; without real credentials the happy path can't be exercised end to end | `clarifications.md` § Unresolved              |
| `@supabase/ssr` / `@supabase/supabase-js`    | external-service | Provides the browser/server client factories and cookie adapter this feature is built on               | `package.json` (already a dependency)         |
| i18n `login` namespace                       | data             | Error and button copy must be added to the localized login files, not hard-coded                       | `clarifications.md`                           |

## 13. Configuration

N/A — no user-facing configuration constants for this feature.
