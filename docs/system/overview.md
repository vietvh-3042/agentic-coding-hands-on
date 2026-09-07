**Project**: Sun* Annual Awards 2025 (SAA 2025) — Sun* Kudos
**Generated**: 2026-09-06
**Architecture Type**: Server-rendered monolith — Next.js 16 App Router (single Node.js process) as
the only application tier, talking directly to a Supabase (Postgres + Auth + Storage) BaaS backend.
No custom API server, no separate backend service, no message queue.

## Executive Summary

Sun* Kudos is the employee-facing web app for Sun* Annual Awards 2025: a countdown/landing
experience gated behind Google sign-in, and a "Kudos" appreciation board where signed-in Sun*
members post, browse, hashtag-filter, and heart short messages of recognition for each other, plus a
gamified "secret box" badge draw. There is no custom backend tier — the Next.js server directly
calls Supabase Auth (GoTrue), Postgres (via PostgREST/RLS), and Storage. All authorization-sensitive
logic (session validation, RLS policies, table/column GRANTs, and two pieces of business logic that
must never be client-forgeable — the heart-value multiplier and the secret-box draw) lives in the
database layer, not in application code.

Routes (verified via `pnpm build`; `/profile` added 2026-09-07 — see `route-list.md`): `/` (home),
`/about`, `/award-info`, `/countdown`, `/login`, `/profile`, `/sun-kudos`, `/auth/callback` (route
handler), plus the framework's `/_not-found`. Every route except `/login` and `/auth/**` is gated
by `proxy.ts` (Next.js 16's renamed `middleware.ts`) — unauthenticated visitors are redirected to
`/login`. `/profile` additionally supports `?id={uuid}` to view another Sunner's profile; a
malformed or repeated id 404s rather than falling back silently.

For architecture diagrams and tech stack details, see [architecture.md](architecture.md).

## Key Design Decisions

### Decision 1: BaaS-only backend — no custom API/server tier

**Context**: The app needs auth, a relational data store, and file storage, but has no requirement
for custom backend business logic beyond validation, a weighted random draw, and a hearts-counter
sync.

**Decision**: Use Supabase directly from the Next.js server (Server Components + Server Actions) via
`@supabase/ssr`. No `app/api/**` routes exist in this codebase — the only `route.ts` is the OAuth
`auth/callback` handler. Mutations go through Next.js Server Actions
(`app/sun-kudos/actions/*.ts`), which call PostgREST-backed Supabase client calls, not a
hand-rolled REST layer.

**Rationale**: The dataset and access patterns (CRUD + row-level filtering) map cleanly onto
Postgres RLS; adding a bespoke API layer would duplicate authorization logic the database can
already enforce declaratively (`[UNVERIFIED]` whether this was an explicit team decision — inferred
from the absence of any API-layer scaffolding in the repo).

### Decision 2: Security-sensitive writes are pushed into the database, not trusted to the client or even the Server Action

**Context**: Two operations must never be client-forgeable: (a) how many hearts a like is worth (1
vs 2, on a "special day"), and (b) which secret-box badge a draw returns and whether a user has any
draws left.

**Decision**: (a) A `BEFORE INSERT` trigger, `resolve_heart_value()` on `kudo_hearts`, unconditionally
overwrites whatever `hearts_value` the client/Server Action sent, computing it itself from
`event_settings.special_day_start/end`. (b) `open_secret_box()` is a parameterless `security definer`
RPC that locks the caller's own `profiles` row (`FOR UPDATE`), performs the weighted draw with
compile-time-constant weights, writes `user_icon_unlocks` and `profiles.boxes_*` and returns the
result — all inside one Postgres transaction the client cannot see partway through.

**Rationale**: `supabase/migrations/20260906192000_heart_multiplier.sql`'s own commit message states
the original design (Server Action resolves and writes the multiplier) was client-forgeable — a
direct PostgREST call with the anon key could set `hearts_value=2` on any day, because the existing
RLS `INSERT` policy on `kudo_hearts` never constrained that column's value. The secret-box RPC
sidesteps the same problem for a two-step counter+insert write that the Supabase JS client cannot
express as one atomic multi-statement transaction — a network failure mid-sequence in a plain
Server Action could decrement `boxes_unopened` with no badge granted.

## Security Overview

- **Authentication**: Supabase Auth (GoTrue) + Google OAuth. `proxy.ts` → `lib/supabase/proxy.ts`
  refreshes the session cookie and re-verifies it with `supabase.auth.getUser()` (never trusts the
  cookie payload alone) on every request matched by the proxy's matcher. `app/auth/callback/route.ts`
  performs the OAuth code exchange; every redirect it issues is a relative `redirect()` from
  `next/navigation` (no reflected `next=` param — deliberate open-redirect countermeasure), and a
  missing/invalid code and any exchange failure both collapse to the same
  `/login?error=oauth_failed` outcome.
- **Authorization**: Postgres Row-Level Security is the primary access boundary, layered with
  explicit table/column `GRANT`s because a pre-existing, postgres-owned default ACL on schema
  `public` otherwise grants `ALL` privileges to both `anon` and `authenticated` on every new table —
  RLS alone is not the full picture. That GRANT layer was applied inconsistently for a time — six
  tables kept the default `ALL` grant, and RLS does not govern `TRUNCATE` — but
  `20260906195000_table_grants_hardening.sql` closed it, **re-verified live 2026-09-07**: no
  `TRUNCATE`/`REFERENCES`/`TRIGGER` grant remains for either role on any table (see architecture.md
  § Trust Boundaries). `profiles` UPDATE is column-scoped
  (`display_name, avatar_url, language` only) since 2026-09-06, closing a real
  privilege-escalation hole where any signed-in user could previously set their own `role='admin'`
  or forge their own box counters.
- **Data Encryption**: `[UNVERIFIED]` — no encryption-at-rest/in-transit configuration is visible in
  application code; this is delegated entirely to the Supabase/Postgres platform and local Docker
  stack, out of this repo's scope.
- **API Security**: No custom API surface exists (`app/api/**` is absent). The only non-Server-Action
  HTTP entry point is `app/auth/callback/route.ts`. All other server-side mutation entry points are
  Next.js Server Actions (`"use server"` functions), each independently re-validating the session
  (`getUser()`) and every client-supplied field — none trust `formData` or an argument as
  pre-validated, per the boundary-check comments throughout `app/sun-kudos/actions/*.ts`.

## Scalability

- **Current Capacity**: `[UNVERIFIED]` — no load-testing artifacts or capacity figures exist in the
  repository. The board's `/sun-kudos` route is dynamic (`ƒ` in the build output, per-viewer data via
  `searchParams` + `getViewerId()`), so every request is server-rendered fresh, not statically cached.
- **Scaling Strategy**: `[UNVERIFIED]` — no infrastructure-as-code, container orchestration, or
  deployment manifest exists in the repository (see architecture.md § Deployment View — degrades to
  N/A). Realtime is deliberately not adopted (`select * from pg_publication_tables where
pubname='supabase_realtime'` returns 0 rows, confirmed live 2026-09-06): every board read is a
  plain per-request server-fetch, not a persistent subscription, which keeps the app horizontally
  scalable at the Next.js tier with no server-side connection state to shard.
- **Performance Targets**: `[UNVERIFIED]` — none stated in the repository.

## Notes (verification trail, not part of the template)

- `docs/system/architecture.md` and `docs/system/permissions.md` are explicitly forward-drafted
  (frontmatter `status: draft`, body says "planned, not yet implemented") for what they call "Batch
  A" — kudos board data, kudo authoring, hearts, hashtag taxonomy, secret-box reveal. **The code has
  since shipped all of it**: `app/sun-kudos/page.tsx` performs real data fetches (not planned
  stubs), all four Server Actions in `app/sun-kudos/actions/` exist and are wired, and every
  migration those drafts describe as "planned" (`kudo_hashtags`, `heart_multiplier`,
  `secret_box_draw`, `profiles_column_privileges`) is applied live. This pass treats the code as
  ground truth and does not carry forward the "planned" framing.
- One correction beyond "planned → shipped": the old draft's Trust Boundaries section claims
  `app/sun-kudos/page.tsx` has "no independent `getUser()` check of its own" (relies entirely on
  `proxy.ts`). The shipped code contradicts this: `SunKudosPage` calls `getViewerId()` and
  `redirect("/login")` itself when no viewer is resolved — a real, if redundant, second gate (the
  page's own comment calls it "defense in depth, not the primary gate").
