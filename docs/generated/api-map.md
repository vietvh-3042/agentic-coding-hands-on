# API Map

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-07
**Analysis Scope**: `app/auth/callback/route.ts`, `app/sun-kudos/actions/*.ts` (4 files), `open_secret_box()` RPC (`supabase/migrations/20260906192500_secret_box_draw.sql`), `lib/supabase/proxy.ts`/`proxy.ts`, direct browser-side PostgREST table access under RLS (all 9 tables + 1 view), cross-checked against `route-list.md` (gate-passed, W1) and `permissions.md`/`permissions-matrix.md` (gate-passed, W3).

> The app has one authenticated read-only `app/api/**` adapter alongside the OAuth handler. This is
> a Next.js 16 App Router project. Its full callable surface is: two Route Handlers (OAuth callback
> callback), 6 Server Actions across 4 files, one Postgres RPC, direct PostgREST table/view reads
> from the browser Supabase client (RLS-gated, not routed through any Next.js layer), and the
> request-interception proxy. Every row below is transcribed from source/live-DB, none invented.

## Endpoints by Domain

### Auth — OAuth Callback (Route Handler)

| Method | Path             | Code     | Handler                                      | Inputs                                                    | Returns                                                                                                                                               | Auth                                                                                        | Side Effects                                                                                                                                                                                                      |
| ------ | ---------------- | -------- | -------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/auth/callback` | ROUTE001 | default export, `app/auth/callback/route.ts` | Query param `code` (OAuth authorization code from Google) | HTTP redirect: `/countdown` (before launch) or `/about` (after launch) on success, per `isBeforeLaunch()`; `/login?error=oauth_failed` on any failure | Public (`isPublicPath` in `lib/supabase/proxy.ts`) — this IS the auth-establishing endpoint | Exchanges `code` for a session via `createClient().auth.exchangeCodeForSession(code)`; on first sign-in this indirectly fires the `handle_new_user()` DB trigger (BL001) that inserts the caller's `profiles` row |

**Summary**: 2 Route Handlers, 6 Server Actions, one Postgres RPC, and the request proxy.

### Kudos Board — Server Actions (`app/sun-kudos/actions/`)

> Not HTTP routes with a stable public path — Next.js resolves each via an internal action-id POST
> to the page that imported it — but they are this project's RPC-style mutation/read entry points
> (there is no `app/api/**`). Reused verbatim from `route-list.md` (gate-passed W1); inputs/returns
> read directly from source for this artifact.

| Export                         | Code     | File                 | Inputs                                                                                               | Returns                                                                                                               | Auth                                                                                                                                                      | Side Effects                                                                                                                                                                                                                                                          |
| ------------------------------ | -------- | -------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submitKudoAction(formData)`   | ROUTE002 | `submit-kudo.ts`     | `FormData`: `recipientId`, `message`, `hashtagIds[]`, `isAnonymous`, `anonymousName?`, image file(s) | `{ ok: true }` or `{ ok: false, error: "unauthenticated" \| "tooLong" \| "required" \| "notFound" \| "invalidType" }` | Requires session (`getUser()`); unauthenticated → `{ ok: false, error: "unauthenticated" }`                                                               | Re-validates recipient/hashtag existence server-side; uploads images to Supabase Storage; inserts one `kudos` row (`sender_id` forced from session, never from `formData`) + N `kudo_hashtags` rows                                                                   |
| `heartKudo(kudoId)`            | ROUTE003 | `heart-kudo.ts`      | `kudoId: string`                                                                                     | Authoritative `{ heartsCount, likedByMe }` after DB round-trip                                                        | Requires session                                                                                                                                          | Inserts one `kudo_hearts` row for the caller; `hearts_value` is never sent by the client — resolved server-side by the `resolve_heart_value()` trigger (BL004); Postgres `42501` (blocked self-heart) mapped to `"forbidden"`; `23505` (duplicate) treated as a no-op |
| `unheartKudo(kudoId)`          | ROUTE004 | `heart-kudo.ts`      | `kudoId: string`                                                                                     | Authoritative `{ heartsCount, likedByMe }` after DB round-trip                                                        | Requires session                                                                                                                                          | Deletes the caller's own `kudo_hearts` row (`user_id = auth.uid()`); `sync_kudo_hearts_count()` trigger (BL002) decrements `kudos.hearts_count` by the exact stored `hearts_value`                                                                                    |
| `openSecretBox()`              | ROUTE005 | `open-secret-box.ts` | none                                                                                                 | Drawn icon `{ id, name, image_url }` or an error (`no_unopened_boxes`, `not_authenticated`)                           | Requires session (`authenticated`-only `EXECUTE` grant on the RPC — `anon` cannot even attempt the call)                                                  | Calls `open_secret_box()` RPC — see RPC section below for its own write side effects                                                                                                                                                                                  |
| `getSecretBoxStatus()`         | ROUTE006 | `open-secret-box.ts` | none                                                                                                 | `{ boxesOpened, boxesUnopened } \| null`                                                                              | Requires session; returns `null` otherwise                                                                                                                | Read-only — direct `profiles` SELECT scoped to the caller's own row                                                                                                                                                                                                   |
| `loadFeedPage(cursor, filter)` | ROUTE007 | `load-feed-page.ts`  | `cursor: string \| null` (keyset pagination cursor), `filter: { hashtagId?: number }`                | Next page of kudos feed rows + next cursor                                                                            | Requires session; falls back to an empty page (not an error) if the session expired mid-scroll — the page itself sits behind the `proxy.ts` guard already | Read-only — no DB write; paginated `kudos` + joined `profiles`/`kudo_hashtags` read, called by REG003_AllKudosFeed's `IntersectionObserver` sentinel                                                                                                                  |

**Summary**: 4 files, 6 exported Server Actions.

## Database RPC (Postgres Function)

> Not a Server Action itself — the callable surface member is `openSecretBox()` above, which invokes
> this function via `supabase.rpc("open_secret_box")`. Documented here as its own entry because it is
> real, security-sensitive business logic reachable through the app's one RPC call, and its
> access-control shape is recorded in full in `permissions-matrix.md` (PERM014).

| Function                   | Code          | File                                                     | Inputs                                                                                          | Returns                             | Auth                                                                                                                                                                                            | Side Effects                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.open_secret_box()` | (see PERM014) | `supabase/migrations/20260906192500_secret_box_draw.sql` | none (zero-parameter by design — acted-on user is always `auth.uid()`, never client-selectable) | `table(...)` — the drawn icon's row | `authenticated` only (`EXECUTE` revoked from `anon`/`public`); `security definer`; raises `not_authenticated` if `auth.uid()` is null, `no_unopened_boxes` if the caller's `boxes_unopened = 0` | Locks the caller's `profiles` row (`FOR UPDATE`), runs a weighted random draw over `secret_box_icons.weight`, decrements `boxes_unopened`/increments `boxes_opened`, inserts (or no-ops via `ON CONFLICT ... DO NOTHING`) one `user_icon_unlocks` row — bypasses RLS on `user_icon_unlocks` (no client INSERT policy exists) and `profiles`' column-scoped UPDATE grant, by design |

## Direct PostgREST / Table Access (Browser Supabase Client, RLS-Gated)

> This is part of the callable surface: the browser Supabase client (`lib/supabase/client.ts`) reads
> most tables/views directly, under RLS, with no Next.js layer in between. A caller holding only the
> public `anon` key can issue these reads without ever going through a Server Action or the `proxy.ts`
> route guard. Live-verified 2026-09-07 (see Verification below) — 24 grant rows, 0 differences from
> the W3 `permissions.md`/`permissions-matrix.md` baseline.

| Table / View                | `anon` Read | `authenticated` Read | `authenticated` Write                                           | Notes                                                                                                                                 |
| --------------------------- | ----------- | -------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                  | Yes         | Yes                  | UPDATE (`display_name`, `avatar_url`, `language` only; own row) | No INSERT/DELETE for any role — rows created only by BL001 trigger                                                                    |
| `kudos`                     | Yes         | Yes                  | INSERT (`sender_id = auth.uid()` only)                          | No UPDATE/DELETE for any role — a kudo cannot be edited or retracted                                                                  |
| `kudo_hearts`               | Yes         | Yes                  | INSERT (not own kudo) + DELETE (own row)                        | `hearts_value` always server-resolved (BL004), never client-supplied                                                                  |
| `hashtags`                  | Yes         | Yes                  | none                                                            | Read-only catalog (13 seeded rows)                                                                                                    |
| `kudo_hashtags`             | Yes         | Yes                  | INSERT (kudo's own sender only)                                 | No UPDATE/DELETE — tags fixed after initial submit                                                                                    |
| `secret_box_icons`          | Yes         | Yes                  | none                                                            | Read-only catalog (6 seeded rows)                                                                                                     |
| `user_icon_unlocks`         | Yes         | Yes                  | none                                                            | Sole writer is `open_secret_box()` RPC, bypasses RLS entirely                                                                         |
| `notifications`             | **No**      | Yes                  | UPDATE (own row, mark-read)                                     | Only table with zero `anon` grant; no INSERT/DELETE for any role                                                                      |
| `event_settings`            | Yes         | Yes                  | none                                                            | Singleton config row; read-only for every client role                                                                                 |
| `profile_kudo_stats` (view) | Yes         | Yes                  | n/a (view)                                                      | `security_invoker=on` — runs with caller's own privileges, cannot see more than a direct `profiles`/`kudos` query would already allow |

**Recorded tension (not resolved — carried from `permissions.md`):** `/sun-kudos` (SCR006) is
route-gated twice (PERM001 + PERM002) at the web-app layer, yet every table above except
`notifications` is `anon`-readable. A direct PostgREST call with only the public `anon` key — no
session, bypassing the web app entirely — can read the same board data the guarded `/sun-kudos` page
shows. Deliberate, already recorded in `route-list.md` Discrepancy #1 and `permissions.md` Special
Conditions; restated here because it is a fact about this callable surface, not a bug found in this
pass.

## Request-Interception Entry Point (proxy.ts)

| Entrypoint                                                     | File                                                                                          | Runs On       | Inputs                               | Behavior                                                                                                                                                                                                                                                                             | Side Effects                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateSession()` (default export re-exported at project root) | `proxy.ts` → `lib/supabase/proxy.ts` (Next.js 16 App Router's renamed middleware entry point) | Every request | Incoming request (cookies, pathname) | Refreshes the Supabase session cookie (`supabase.auth.getUser()`, re-verified against the Auth server); unauthenticated + not `isPublicPath` (`/login`, `/auth/*`) → redirect to `/login`; authenticated + on `/login` → redirect to `/countdown` or `/about` per `isBeforeLaunch()` | Rewrites the session cookie on the response; is the single source of truth for the auth guard — no per-page duplicate list exists. Full detail in `permissions-matrix.md` PERM001. |

## Background Jobs

> BL### inventory restated from `behavior-logic.md` (gate-passed W2b) with trigger/schedule framing.
> All 4 items are Postgres triggers (`observer` type) — none is cron/queue-scheduled; each fires
> synchronously inside the same transaction as its triggering DML statement, so "Schedule" is
> "on-demand" (event-fired) for every row, not a cron expression.

| Code                                   | Name                                          | Type     | Trigger                                                                             | Schedule                                              |
| -------------------------------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| BL001_CreateProfileOnSignup            | CreateProfileOnSignup                         | observer | `AFTER INSERT ON auth.users`                                                        | on-demand (fires once per new Supabase Auth signup)   |
| BL002_SyncKudoHeartsCount              | SyncKudoHeartsCount                           | observer | `AFTER INSERT OR DELETE ON kudo_hearts`                                             | on-demand (fires on every heart/un-heart)             |
| BL003_ResolveHeartValueSecurityDefiner | ResolveHeartValueSecurityDefiner (superseded) | observer | `BEFORE INSERT ON kudo_hearts` (original binding, no longer executing live)         | on-demand — historical, superseded by BL004           |
| BL004_ResolveHeartValueNoDefiner       | ResolveHeartValueNoDefiner (current)          | observer | `BEFORE INSERT ON kudo_hearts` (current binding, live-verified `prosecdef = false`) | on-demand (fires on every heart insert, before BL002) |

## Webhooks / External Calls

**None found.** Exhaustive grep across `app/`, `components/`, `lib/`, `hooks/`, `constants/` for
outgoing HTTP clients (`fetch(`, `axios`, external SDK calls) and incoming webhook receivers
(`app/api/**`, additional `route.ts` files) turned up zero qualifying hits beyond the OAuth callback
already documented above and the Supabase SDK client bootstraps (`lib/supabase/client.ts`,
`server.ts` — generic SDK factories, not a distinguishing integration, per `scout-report.md`). This
app makes no outgoing calls to third-party services and exposes no incoming webhook endpoint.

## Verification

Live-reverified 2026-09-07 against the running local Supabase instance
(`docker exec supabase_db_agentic-coding-hands-on psql`): `information_schema.role_table_grants` (24 rows)
and `pg_policies` (15 rows) both match `permissions.md`/`permissions-matrix.md` exactly — zero
differences from the grant-hardening migration (`20260906195000_table_grants_hardening.sql`) already
recorded there.

## Summary

| Category                                     | Count                  |
| -------------------------------------------- | ---------------------- |
| Route Handlers                               | 1                      |
| Server Actions                               | 6                      |
| Database RPCs                                | 1                      |
| Directly-accessible tables/views (PostgREST) | 10 (9 tables + 1 view) |
| Background Jobs (DB triggers)                | 4                      |
| Webhooks / External Calls                    | 0                      |
| Request-interception entrypoints             | 1 (`proxy.ts`)         |

**`[UNVERIFIED]` carried forward** (from `route-list.md`): `kudos.attachment_count` and
`kudos.hashtag_title` columns have no confirmed write-site in the current Server Actions —
likely superseded, not in scope to remove in this pass.
