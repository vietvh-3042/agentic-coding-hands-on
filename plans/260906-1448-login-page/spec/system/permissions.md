---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Permissions

**Project**: Sun* Annual Awards 2025 (SAA 2025)
**Generated**: 2026-09-06
**Analysis Scope**: Google Sign-In (F000_GoogleSignIn, draft) — session-gated route access. No
role model exists yet; this document describes a binary authenticated/unauthenticated gate only.

> **Draft scope:** raw `PERM###` codes are not minted yet — a matrix does not exist until this
> feature is promoted and `permissions-matrix.md` is generated from real guard code. Any code
> reference below is `TBD (draft)`, never fabricated.

## Authorization System Type

**System Type**: `other` — a single binary gate (has a valid Supabase session, or does not); no
roles, no attributes, no ownership checks. `rbac`/`abac`/`acl`/`ownership`/`hybrid` all assume a
dimension of differentiation this feature does not have.

**Identified Roles**: None — every signed-in Sun* member has identical access. There is no
admin/member distinction anywhere in this feature's scope.

## Curated View

- _*Any Sun* member with a valid Google account_* can sign in and, once authenticated, reach
  every route the app exposes (`/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info`) — no
  domain allowlist restricts which Google accounts may sign in.
- **An unauthenticated visitor** can only reach `/login` and the `/auth/*` OAuth routes; every
  other route redirects them to `/login` before it renders.
- **An already-authenticated member** who navigates to `/login` is redirected away to the
  post-login target instead of seeing the login form again.

## Access Boundaries

The only boundary is session presence, checked on every request. There is no per-resource
ownership, no per-route role check, and no field-level restriction anywhere in this feature's
scope — a route-guard type gate is the sole access-control mechanism this document currently
describes (raw `PERM###` code TBD (draft) until promote mints it from real guard source).

## Special Conditions

- No feature-flag, experiment, env-gate, or locale-gate conditions apply to sign-in or route
  access — the login screen's language selector changes display language only, not access.
- No time-based access restriction exists in this feature; the event-start predicate
  (`isBeforeLaunch()`) affects _where_ an authenticated member is redirected after sign-in, never
  _whether_ they may sign in or access a route.
