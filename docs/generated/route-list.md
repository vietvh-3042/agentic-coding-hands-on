# Route List

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-06

> **Verification method**: Wave 0.4 bootability probe was deliberately skipped this run — the real
> route manifest below is transcribed from an actual `pnpm build` output (stronger evidence than a
> probe), cross-checked file-by-file against `app/` (Next.js 16 App Router = file-based routing) and
> `proxy.ts` / `lib/supabase/proxy.ts` (auth guard logic, read in full).

## Backend Routes

> **Completeness Contract:** emit exactly ONE row per leaf route (HTTP method + concrete path). This project has no `app/api/**` directory — the only conventional Route Handler is the OAuth callback below. Next.js Server Actions (`"use server"` functions) are not HTTP routes with a stable path, but are captured in their own section per this run's instructions.

> **Code Column Contract:** `Code` is `ROUTE###`, contiguous and global. `Owner F###` is back-filled from `feature-list.md` / `_canonical-fcodes.json` after the Wave 5.6 gate; a route owned jointly by two features lists both, slash-separated.

### File: app/auth/callback/route.ts

| Method | Path           | Code     | Owner F### | Handler                                                                                                                                                                                                                                 | Middleware                                                                                             |
| ------ | -------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GET    | /auth/callback | ROUTE001 | F001       | default export (OAuth code-exchange: reads `code` query param, exchanges via `createClient().auth.exchangeCodeForSession`, redirects to `/countdown` or `/about` per `isBeforeLaunch()`, or `/login?error=oauth_failed` on any failure) | proxy.ts (path is `isPublicPath` — excluded from the auth-required redirect, see Frontend Routes note) |

**Summary**: 1 conventional Route Handler. No `app/api/**` directory exists in this codebase.

## Server Actions

> Not HTTP routes in the traditional sense (no stable public path — Next.js resolves them via an internal action-id POST to the originating page), but they are the RPC-style mutation entry points for this App Router project (no `app/api/**` exists) and are captured here per this run's explicit instruction.

### File: app/sun-kudos/actions/submit-kudo.ts

| Export                       | Code     | Owner F### | Purpose                                                                                                                                        | Auth                                                                                        |
| ---------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `submitKudoAction(formData)` | ROUTE002 | F003       | Validates and inserts a new kudo (`kudos` + `kudo_hashtags`), after re-validating recipient/hashtag existence and uploading images server-side | Requires session (`getUser()`); returns `{ ok: false, error: "unauthenticated" }` otherwise |

### File: app/sun-kudos/actions/heart-kudo.ts

| Export                | Code     | Owner F### | Purpose                                                                                             | Auth             |
| --------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------- | ---------------- |
| `heartKudo(kudoId)`   | ROUTE003 | F004       | Inserts one `kudo_hearts` row for the caller; `hearts_value` is never sent (DB trigger resolves it) | Requires session |
| `unheartKudo(kudoId)` | ROUTE004 | F004       | Deletes the caller's own `kudo_hearts` row                                                          | Requires session |

### File: app/sun-kudos/actions/open-secret-box.ts

| Export                 | Code     | Owner F### | Purpose                                                                             | Auth                                        |
| ---------------------- | -------- | ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| `openSecretBox()`      | ROUTE005 | F006       | Calls `open_secret_box()` RPC (parameterless, `security definer`) to draw one badge | Requires session                            |
| `getSecretBoxStatus()` | ROUTE006 | F006       | Reads the caller's own `boxes_unopened`/`boxes_opened` from `profiles`              | Requires session (returns `null` otherwise) |

### File: app/sun-kudos/actions/load-feed-page.ts

| Export                         | Code     | Owner F### | Purpose                                                                                          | Auth                                                                                                                                         |
| ------------------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `loadFeedPage(cursor, filter)` | ROUTE007 | F002       | Keyset-paginated next page of the kudos feed, called by the feed's IntersectionObserver sentinel | Requires session (falls back to an empty page, not an error, if the session expired mid-scroll — page itself sits behind the proxy.ts guard) |

### File: app/profile/actions/load-profile-feed-page.ts

| Export                                             | Code     | Owner F###                                                                                  | Purpose                                                                                                                                                                                                            | Auth                                                                                                                |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `loadProfileFeedPage(direction, targetId, cursor)` | ROUTE008 | _TBD — new Profile feature, not yet cataloged in feature-list.md; see this pass's advisory_ | Keyset-paginated next page of either the "received" or "sent" directional feed on `/profile`; `direction === "sent"` never forwards `targetId` — `getSentFeed()` takes no target parameter by design (see PERM016) | Requires session (falls back to an empty page, not an error, on an invalid/missing direction or an expired session) |

**Summary**: 5 files, 7 exported Server Actions.

## Frontend Routes/Pages

> **Auth guard rule** (`lib/supabase/proxy.ts`, read in full): every path is protected EXCEPT `/login` and anything under `/auth` (`isPublicPath`). An unauthenticated request to any other path redirects to `/login`. An authenticated request to `/login` redirects to `/countdown` (before launch) or `/about` (after launch), per `isBeforeLaunch()` (`lib/countdown-config.ts`). This is enforced once, centrally, in the proxy — not per-page.

### File: app/page.tsx

| Path | Component | Route Name    | Auth Required         | Notes                                                                                                                                       |
| ---- | --------- | ------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| /    | RootPage  | home-redirect | Yes (per proxy guard) | Server-renders a hard `redirect("/login")` — this page never actually displays; it exists only as the site-root pointer to the login screen |

### File: app/login/page.tsx

| Path   | Component | Route Name | Auth Required       | Notes                                                                                        |
| ------ | --------- | ---------- | ------------------- | -------------------------------------------------------------------------------------------- |
| /login | LoginPage | login      | No (`isPublicPath`) | Google OAuth sign-in entry; reads `?error=oauth_failed` search param to show an inline error |

### File: app/auth/callback/route.ts

(Route Handler, not a page — listed above under Backend Routes; included here for path completeness since it is the `/auth` prefix that `isPublicPath` special-cases.)

### File: app/countdown/page.tsx

| Path       | Component     | Route Name | Auth Required         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------- | ---------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /countdown | CountdownPage | countdown  | Yes (per proxy guard) | Prelaunch countdown to `LAUNCH_AT`. Page-level comment says "no auth guard... per plan clarifications" — that refers to no PAGE-level guard being coded in this file; the proxy's blanket guard still applies at the routing layer since `/countdown` is not in `isPublicPath`. `[UNVERIFIED]` whether this was an intentional discrepancy between the page comment and the shipped proxy behavior, or the page comment predates the proxy guard being added — flagged, not resolved, in this draft |

### File: app/about/page.tsx

| Path   | Component                                        | Route Name | Auth Required         | Notes                                                                                                                                                                   |
| ------ | ------------------------------------------------ | ---------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /about | AboutPage (default export, unnamed in file head) | homepage   | Yes (per proxy guard) | Post-login landing once the event has launched; same "no auth guard... per plan clarifications" page-comment pattern as `/award-info` — same proxy-guard caveat applies |

### File: app/award-info/page.tsx

| Path        | Component  | Route Name | Auth Required         | Notes                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ---------- | ---------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /award-info | AwardsPage | award-info | Yes (per proxy guard) | Page comment explicitly states "Presentational, no auth guard (matches the unguarded homepage `/`; a real guard is deferred to a later auth epic per plan clarifications)" — **this is stale relative to the shipped `proxy.ts`**, which guards every path except `/login`/`/auth/*`. The comment describes an earlier, pre-proxy-guard design state. |

### File: app/sun-kudos/page.tsx

| Path       | Component                     | Route Name      | Auth Required             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ----------------------------- | --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /sun-kudos | SunKudosPage (default export) | sun-kudos-board | **Yes** (per proxy guard) | **Feature-spec vs shipped-behavior discrepancy, called out explicitly in this run's brief:** feature spec claims "no login required" for this screen, but the shipped `proxy.ts` guards `/sun-kudos` like every other non-public path — confirmed both by reading `isPublicPath()` (only excludes `/login` and `/auth/*`) and by `e2e/auth-guard.spec.ts`, which asserts the unauthenticated redirect for this route. This is the app's actual, current, deliberate behavior — not a bug in this draft's reading. |

### File: app/profile/page.tsx

| Path     | Component   | Route Name | Auth Required                                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /profile | ProfilePage | profile    | **Yes** (per proxy guard, plus its own `getUser()`/`redirect("/login")` defense-in-depth — same pattern as `/sun-kudos`) | `?id={uuid}` shows another Sunner's profile (write-Kudo bar face); no `?id`, an empty `?id=`, or `?id=` equal to the caller's own id all resolve to the caller's own profile (statistics-card face); a malformed uuid or a repeated `?id=` key both `notFound()` (404) rather than silently picking a value — see `lib/profile/resolve-target.ts`. New this batch — not yet cataloged with its own SCR### code (see this pass's advisory on the new Profile feature). |

**Summary**: 7 App Router pages (`page.tsx`), 6 of which are guarded by the proxy (`/countdown`, `/about`, `/award-info`, `/sun-kudos`, `/profile`, and `/` which itself only redirects to the 7th, unguarded `/login`).

## Summary

| Category                        | Count |
| ------------------------------- | ----- |
| Backend Routes (Route Handlers) | 1     |
| Server Actions                  | 7     |
| Frontend Pages                  | 7     |
| Total                           | 15    |

### Discrepancies flagged (not resolved — for Wave 1.5 / feature-spec synthesis to reconcile)

1. `/sun-kudos` guarded despite feature spec claiming "no login required" (explicit instruction to record this; confirmed via `proxy.ts` + `e2e/auth-guard.spec.ts`).
2. `app/award-info/page.tsx` and `app/about/page.tsx`/`app/countdown/page.tsx` carry inline comments claiming "no auth guard" / "presentational", written before (or independent of) the current blanket `proxy.ts` guard, which protects every path except `/login` and `/auth/*`. The comments are stale; the proxy's behavior is authoritative and current.
3. `kudos.attachment_count` and `kudos.hashtag_title` columns (data-model.md) have no found write-site in the current Server Actions — `[UNVERIFIED]`, likely superseded columns, not in scope to remove in this pass.
