---
authored_by: rebuild-spec
---

<!-- layout-exempt: rebuild-spec owns all docs/system|features|generated|flows paths — all references here are output targets or internal definitions -->

# Behavior Logic

**Project**: Sun\* Annual Awards 2025 / Sun\* Kudos App
**Generated**: 2026-09-06
**Analysis Scope**: JS/TS (`app/`, `components/`, `lib/`, `hooks/`, `constants/`) — zero qualifying hits, per scout `## Background Logic Source Inventory`. SQL/PL-pgSQL (`supabase/migrations/*.sql`) — 4 trigger-defining migrations, all `[SIGNAL_INFERRED]` (Postgres triggers have no per-stack row in `bl-source-patterns.md`). Verified against the LIVE local Supabase instance (`docker exec supabase_db_mock-aidd-kudo-app psql`) — trigger bindings, function `security`/`volatility` flags, and RLS-adjacent grants cross-checked, not just migration source.

**Code Format**: All codes MUST follow `BL###_NameSlug` format (e.g., BL001_ScheduledReport, BL002_EventListener)

**Behavior Logic Types** (canonical 10 — language-neutral): only `observer` is populated this run; the other 9 (scheduled-job, queue-worker, event-listener, mail, notification, middleware, custom-command, integration, webhook) have zero qualifying entries in either stack per the scout report — sections omitted below rather than emitted empty.

**Note**: Auth/permission middleware is NOT included — see `permissions.md` / `permissions-matrix.md`.

**Note**: Feature and UserStory mapping is managed in FeatureList.md and UserStories.md (both Wave 5/4 — not yet run this session). This document contains behavior logic items without direct feature/story references.

## Scope Decisions (this run)

Three categories of "looks like BL" code were deliberately excluded — recorded here so the exclusion reads as a decision, not an oversight:

1. **Next.js Server Actions** (`app/sun-kudos/actions/{submit-kudo,heart-kudo,open-secret-box,load-feed-page}.ts`) — already documented as ROUTE002–ROUTE007 in `route-list.md`. They are RPC-style mutation entry points (this project has no `app/api/**`), not background/async logic — no canonical BL type fits an on-demand, request-scoped Server Action. Referenced below only as **Related Routes** on the triggers they indirectly fire.
2. **`lib/supabase/proxy.ts` / `proxy.ts`** — session refresh + route gating on every request. Tagged `permission` in the scout inventory; per `bl-source-patterns.md`, "auth/permission middleware is excluded — see `permissions-template.md`." Documented as a `route-guard` PERM item in `permissions.md` instead.
3. **`public.open_secret_box()` RPC** (`supabase/migrations/20260906192500_secret_box_draw.sql`) — see the classification decision below.

### `open_secret_box()` classification decision

The scout flagged this RPC as fitting no canonical BL type and pointed it at Permissions. **I agree with that call and do not add a BL### for it.** Reasoning, checked against all 10 canonical types:

- Not `observer` — it is not a lifecycle hook on insert/update/delete; it is invoked directly, on-demand, via `supabase.rpc("open_secret_box")` from `openSecretBox()` (ROUTE005).
- Not `queue-worker`/`scheduled-job` — synchronous, request-scoped, no queue or schedule.
- Not `event-listener`/`webhook`/`integration`/`mail`/`notification`/`middleware`/`custom-command` — none match on inspection of the function body (verified live: `security definer`, `volatile`, zero arguments, `returns table(...)`).

It IS real, security-sensitive business logic (weighted random draw over `secret_box_icons.weight`, row-locked atomic counter update, idempotent re-draw via `ON CONFLICT ... DO NOTHING`) — but per the Inclusion/Exclusion Matrix below, a file not in the scout's `## Background Logic Source Inventory` does not get a BL### (the researcher does not add entries the scout excluded). Rather than drop the finding, its **access-control shape** — `security definer` (bypasses caller's own grants/RLS), zero parameters (the acted-on user is always `auth.uid()`, never client-selectable), `EXECUTE` revoked from `anon`/`public` and granted only to `authenticated` — is documented as **PERM008 (action-permission)** in `permissions.md`, which is the correct home for an authorization-boundary property. The draw _algorithm_ itself (weighted roll, `ON CONFLICT` idempotency) is documented as prose under PERM008's entry since there is no BL home for it — this is the "entries in both artifacts, each from its own angle" case the brief anticipated, except the BL-side angle turned out empty rather than a second entry: the algorithm has no async/scheduled/lifecycle trigger to hang a BL### on, only an authorization boundary to hang a PERM### on.

---

## Behavior Logic Index

BA-first summary — one row per `BL###` item, banded by **Type**. `Payload` and `File Schema` are the
two columns BAs ask about most; both are `N/A` for every item below — none of these triggers is an
async/event/notification channel or a file-exchange format, so both columns are structurally empty
this run, not omitted by oversight.

### Type: observer

| Code  | Name                                          | Trigger                                                                 | Payload                              | File Schema                    |
| ----- | --------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------ | ------------------------------ |
| BL001 | CreateProfileOnSignup                         | `AFTER INSERT ON auth.users` (new Supabase Auth user)                   | N/A — not an event/notification type | N/A — not a file-exchange type |
| BL002 | SyncKudoHeartsCount                           | `AFTER INSERT OR DELETE ON kudo_hearts`                                 | N/A                                  | N/A                            |
| BL003 | ResolveHeartValueSecurityDefiner (superseded) | `BEFORE INSERT ON kudo_hearts` — original `security definer` version    | N/A                                  | N/A                            |
| BL004 | ResolveHeartValueNoDefiner (current)          | `BEFORE INSERT ON kudo_hearts` — redefinition, drops `security definer` | N/A                                  | N/A                            |

---

## Dev Appendix

Source citations, module/route/data-model links, and the deterministic rules `validate_behavior_logic.py`
enforces. Every `BL###` heading below carries the same code as its Index row above.

### Cardinality Contract

Rules enforced by Wave 2b researcher and Wave 7a reviewer. Violations are critical.

- **Rule C1 — 1 BL per inventory entry**: applied here as 1 migration file = 1 BL. `resolve_heart_value()` was redefined once (`20260906192000_heart_multiplier.sql` → `20260906193000_resolve_heart_value_no_definer.sql`); both files are separate scout inventory entries, so both get separate BL codes (BL003, BL004) rather than being collapsed into one — collapsing them would violate C1 by aggregating two source files into one item. BL003 is documented as historically superseded, not deleted from the record.
- **Rule C2 — Source fields mandatory, single-valued**: every item below carries exactly one `**Source File**` and one `**Source Symbol**`.
- **Rule C3 — Unmatched BL warning**: N/A — all 4 items match a scout inventory entry 1-to-1 (see scout-report.md § Background Logic Source Inventory → SQL/PL-pgSQL).

### Inclusion/Exclusion Matrix (scout-side filter)

| Include                                                                                                      | Exclude                                                                                |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| All files/symbols in scout `## Background Logic Source Inventory`                                            | Abstract base classes, traits, interfaces                                              |
| `[SIGNAL_INFERRED]`-tagged inventory entries (with justification) — all 4 items here are `[SIGNAL_INFERRED]` | Vendor overrides and third-party library subclasses                                    |
|                                                                                                              | `supabase/tests/*.sql` (pgTAP assertion suites — test files)                           |
|                                                                                                              | Files < 10 LOC (scaffolding/stubs)                                                     |
|                                                                                                              | Auth/ACL/OAuth/JWT middleware (→ `permissions.md`) — `proxy.ts` excluded on this basis |

### Anti-Patterns: Aggregation Forbidden

Aggregating multiple source files into a single BL item violates Rule C1. Not applicable here in the negative sense — flagged only to confirm BL003/BL004 were deliberately kept SEPARATE (not aggregated into one "ResolveHeartValue" item) precisely because Rule C1 forbids merging two source files into one code, even when they define "the same" logical trigger across its edit history.

---

## BL001_CreateProfileOnSignup

**Type**: observer
**Trigger**: `AFTER INSERT ON auth.users` → `on_auth_user_created` trigger
**Source File**: supabase/migrations/20260722090000_create_profile_on_signup.sql
**Source Symbol**: `handle_new_user`

### Description

`security definer` function, fires once per new Supabase Auth user (any sign-up path — Google OAuth via `/auth/callback`, or a future email flow). Inserts one `profiles` row: `display_name` resolved from `raw_user_meta_data.full_name` → `.name` → the email's local-part (first non-empty wins); `hero_code` is a placeholder (`upper(left(md5(id),6))` — "no real assignment flow exists yet", per `data-model.md` MODEL001); `avatar_url` from OAuth metadata if present. `ON CONFLICT (id) DO NOTHING` makes it idempotent against a re-fired trigger. The same migration also ran a one-time backfill `INSERT ... SELECT` for any pre-existing `auth.users` row with no matching `profiles` row (fixing the exact gap this trigger closes going forward: "any real sign-in... had no profile row and kudos inserts failed on the `kudos_sender_id_fkey`").

### Related Modules

- `app/auth/callback/route.ts` (the OAuth code-exchange that, via Supabase Auth internals, causes the `auth.users` insert this trigger reacts to)

### Related Routes

- (GET) /auth/callback — ROUTE001

### Related Data Models

- MODEL001_PROFILES

---

## BL002_SyncKudoHeartsCount

**Type**: observer
**Trigger**: `AFTER INSERT OR DELETE ON kudo_hearts` → `on_kudo_hearts_change` trigger
**Source File**: supabase/migrations/20260722100000_kudo_hearts.sql
**Source Symbol**: `sync_kudo_hearts_count`

### Description

`security definer` function keeping `kudos.hearts_count` (a denormalized counter) exactly in sync with `kudo_hearts` rows, so a direct PostgREST write can never drift the two. INSERT branch: `hearts_count = greatest(hearts_count + NEW.hearts_value, 0)`. DELETE branch: `hearts_count = greatest(hearts_count - OLD.hearts_value, 0)` — subtracts whichever value was actually stored on the deleted row (not a hardcoded 1), so un-hearting a kudo that was hearted during a special-day 2x window correctly revokes 2, even after the window closed. `greatest(...,0)` floors the counter defensively even though the `kudo_hearts_value_check` CHECK constraint already blocks negative values. This migration file also creates the `kudo_hearts` table itself and its RLS policies — the trigger-function definition is its dominant/BL-qualifying content per the scout's tagging rule.

### Related Modules

- `app/sun-kudos/actions/heart-kudo.ts` (`heartKudo`/`unheartKudo` — the only INSERT/DELETE paths against `kudo_hearts`)

### Related Routes

- `heartKudo(kudoId)` — ROUTE003
- `unheartKudo(kudoId)` — ROUTE004

### Related Data Models

- MODEL002_KUDOS (writes `hearts_count`)
- MODEL003_KUDO_HEARTS (fires on this table's INSERT/DELETE)

---

## BL003_ResolveHeartValueSecurityDefiner (superseded)

**Type**: observer
**Trigger**: `BEFORE INSERT ON kudo_hearts` → `before_kudo_hearts_insert` trigger (original binding)
**Source File**: supabase/migrations/20260906192000_heart_multiplier.sql
**Source Symbol**: `resolve_heart_value`

### Description

**Superseded by BL004** — kept as its own item per Rule C1 (separate source file), not deleted from the record. This migration first introduced `resolve_heart_value()` as a `security definer` function and bound it to `before_kudo_hearts_insert`. Logic: unconditionally overwrites `NEW.hearts_value` to `2` when `now()` falls inside `event_settings.special_day_start`/`special_day_end` (both required non-null), else `1`. The `security definer` property here was later found unnecessary (see BL004) — the function only ever reads `event_settings`, a table already SELECT-granted to `anon`/`authenticated`, so no elevated privilege was load-bearing. This closes a real forgeability gap: the `kudo_hearts` INSERT RLS policy only checks `user_id`/self-heart, never `hearts_value`, so without this trigger a direct PostgREST call could set `hearts_value = 2` on any day.

### Related Modules

- `app/sun-kudos/actions/heart-kudo.ts` (`heartKudo` — never sends `hearts_value` itself; relies entirely on this trigger)

### Related Routes

- `heartKudo(kudoId)` — ROUTE003

### Related Data Models

- MODEL003_KUDO_HEARTS (writes `hearts_value`)
- MODEL009_EVENT_SETTINGS (reads `special_day_start`/`special_day_end`)

---

## BL004_ResolveHeartValueNoDefiner (current)

**Type**: observer
**Trigger**: `BEFORE INSERT ON kudo_hearts` → `before_kudo_hearts_insert` trigger (current binding, verified live: `prosecdef = false`)
**Source File**: supabase/migrations/20260906193000_resolve_heart_value_no_definer.sql
**Source Symbol**: `resolve_heart_value`

### Description

`CREATE OR REPLACE FUNCTION` redefinition of BL003's function — same signature, same trigger binding (rebinding was unnecessary; `CREATE OR REPLACE` swaps the body in place), same 1/2 resolution logic (special-day window → 2, else 1) — but **drops `security definer`**, per a reviewer finding ("batch-a-inspection.md High #3": _"a `security definer` function... that isn't load-bearing should not exist"_). `set search_path = public` is kept regardless, as hygiene against search-path hijacking. Verified live via `pg_proc.prosecdef = false` for `resolve_heart_value` — this is the function actually executing on every `kudo_hearts` insert today. Because this is a BEFORE trigger, it always runs before BL002's AFTER trigger, guaranteeing BL002 always reads the DB-resolved `hearts_value`, never a forged one.

### Related Modules

- `app/sun-kudos/actions/heart-kudo.ts` (`heartKudo` — never sends `hearts_value` itself; relies entirely on this trigger)

### Related Data Models

- MODEL003_KUDO_HEARTS (writes `hearts_value`)
- MODEL009_EVENT_SETTINGS (reads `special_day_start`/`special_day_end`)

### Related Routes

- `heartKudo(kudoId)` — ROUTE003

---

## Summary

- **Total Behavior Logic Items**: 4
- **By Type**: custom-command: 0, event-listener: 0, integration: 0, mail: 0, middleware: 0, notification: 0, observer: 4, queue-worker: 0, scheduled-job: 0, webhook: 0

---

## Cross-Reference Validation

- [x] All BL### codes are unique (BL001–BL004, contiguous)
- [ ] All BL### codes are referenced in UserStories.md (type=system) — N/A this wave, UserStories.md does not exist until W4
- [ ] All BL### codes are referenced in FeatureList.md — N/A this wave, FeatureList.md does not exist until W5/W5.6
- [x] All related route references are valid (ROUTE001, ROUTE003, ROUTE004 all exist in route-list.md, gate-passed)
- [x] All related data model references are valid (MODEL001, MODEL002, MODEL003, MODEL009 all exist in data-model.md, gate-passed)
- [x] No orphaned behavior logic references
- [x] All BL items have Source File + Source Symbol fields (Rule C2)
- [x] All Source File paths match scout Background Logic Source Inventory entries (Rule C2/C3) — cross-checked against scout-report.md § Background Logic Source Inventory → SQL/PL-pgSQL, all 4 `[SIGNAL_INFERRED]` observer rows accounted for 1:1

---

## Client-Side Logic

Document client-side patterns found in the codebase, per exhaustive grep across `app/`, `components/`, `lib/`, `hooks/`.

### Debounce / Throttle

```
BL-C01 — KudosRecipientSelect search debounce
pattern: debounce
source: components/kudos/kudos-recipient-select.tsx:25,68,94 (SEARCH_DEBOUNCE_MS = 250)
trigger: user types a recipient name in the write-kudo recipient picker
delay: 250ms
description: Delays the `profiles.display_name` ilike search query (via `createClient()` direct table read, not a Server Action) until the user pauses typing, avoiding a query per keystroke.
```

Other `window.setTimeout` hits found (`category-nav.tsx:61` smooth-scroll observer suppression, `use-copy-link-toast.tsx:17` toast auto-dismiss, `kudos-form-modal.tsx:119` post-submit close delay) are one-shot UI timers, not debounce/throttle over a handler — excluded per the pattern's extraction signature.

### Optimistic UI

```
BL-C02 — HeartButton optimistic like/unlike
pattern: optimistic-ui
source: components/kudos-board/heart-button.tsx:63 (useOptimistic(serverState, reduceHeart))
trigger: user clicks the heart icon on a kudo card (feed or highlight)
optimistic-action: immediately flips liked/unliked and applies a ±1 guess to the displayed count
rollback: once ROUTE003/ROUTE004 resolves, serverState is set from the Server Action's own returned heartsCount/likedByMe — the authoritative value (BL004 may have resolved a special-day 2x grant the ±1 guess did not anticipate) — reconciling any mismatch, not a hard rollback-on-error path specifically but the same "trust the server's answer" mechanism
```

### Polling

`N/A — no polling patterns detected.` (`hero-info-block.tsx:76-84` and `hooks/use-countdown.ts:45` use `setInterval`, but both are pure client-side clock ticks toward a fixed date — no recurring API call — so neither qualifies as polling per the pattern's extraction signature: "recurring API call".)

### Upload Progress

`N/A — no upload progress patterns detected.` (`lib/kudos/upload-kudo-images.ts` uploads via the Supabase Storage SDK with no `onUploadProgress`/`onprogress` callback wired — grep for both across `app/`, `components/`, `lib/`, `hooks/` returned zero hits.)

### Realtime (WebSocket / SSE / EventSource)

`N/A — no realtime patterns detected.` (Grep for `WebSocket`, `EventSource`, `useWebSocket`, `.channel(` across `app/`, `components/`, `lib/`, `hooks/` returned zero hits — the feed/highlight/spotlight/sidebar regions on SCR006 all re-fetch via `revalidatePath`/Server Action round-trip, not a persistent connection.)
