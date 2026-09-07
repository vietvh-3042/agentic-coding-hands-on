# Review: Three-screen gap closure — FAB, Thể lệ, Profile

Plan: `plans/260907-1402-three-screen-gap-closure/plan.md` + `clarifications.md` (both read).
Scope: all uncommitted files per `git status --short` — new `/profile` build (Track A), FAB gap
closure (Track B), Thể lệ gap closure (Track C), plus the incidental `psql` container-name fix.
Depth: full read of the security-critical path (migration, read layer, feed queries, resolve-target,
Server Action boundary, `KudosFormModal` recipient change) + live DB verification; targeted read of
the rest (components, e2e specs, config).

## Assessment

Ready to commit. The stated priority — `SEC_001..004` and the migration's GRANT hygiene — holds up
against both the code and the live database. No critical or high finding. Two low-severity items
worth a follow-up commit, not a blocker, and one already-answered judgment call I re-verified rather
than re-litigated.

## Critical

None.

## High

None.

## Medium

**1. `loadProfileFeedPage`'s cursor validation checks shape, not format — `app/profile/actions/load-profile-feed-page.ts:28-32`.**
`isValidCursor` only checks `typeof cursor.createdAt === "string"` and `typeof cursor.id === "string"`,
then both values are interpolated unescaped into a PostgREST `.or()` filter string in
`lib/profile/feed-queries.ts:35` and `:150` (`created_at.lt.${cursor.createdAt},and(...)`). A caller
that invokes the action directly (bypassing the UI) can pass an arbitrary string for either field.

I verified this **cannot** cross the `SEC_003` boundary: `kudos_sent_for_caller`'s
`where sender_id = auth.uid()` is baked into the view definition itself, so any client-supplied
`.or()` fragment layered on top by PostgREST is evaluated _inside_ that already-restricted view, not
in place of it. The realistic failure mode is a PostgREST filter-syntax parse error surfacing as an
unhandled throw (no try/catch in the action), which — same as `getReceivedFeed`'s existing error
path — bubbles to a generic Next.js error response rather than leaking anything sensitive. Not a
security hole, but it is a genuine input-validation gap relative to the FUN_004 discipline this same
batch applied to `?id` (`lib/profile/resolve-target.ts`'s `UUID_PATTERN` gate, checked before any
query). **Pre-existing pattern, not a regression**: `app/sun-kudos/actions/load-feed-page.ts` (Batch
A, not touched this session) has the identical shape-only `isValidCursor`, and this file's own doc
comment says it deliberately mirrors that convention.

_Fix_: add a `UUID_PATTERN`-style check on `cursor.id` and an ISO-timestamp parse check on
`cursor.createdAt` in both `isValidCursor` implementations (this file and Batch A's), and wrap the
query calls to return an empty page on a caught DB error instead of throwing — consistent with how
`getSentFeed` already fails safe (empty page) when `viewerId` is absent. Worth doing once across both
files rather than only here, so raise it as a shared follow-up rather than blocking this commit on it.

## Low

**2. `countDistinctSenders` fetches every `kudos.sender_id` row for a receiver to count in JS — `lib/profile/queries.ts:25-35`.**
No `LIMIT`, and Postgres can't express `COUNT(DISTINCT sender_id)` through PostgREST's query builder
without an RPC or a view, which the code's own comment explains is a deliberate trade-off for "a
single derived number" rather than a new migration. For an internal-tool award count this is bounded
and fine today; it stops scaling if any single Sunner's received-Kudos count grows into the thousands.
Flagging as a documented, accepted trade-off — not asking for a fix now, just recording it so it's not
rediscovered as a surprise later. A future fix would be a `count(distinct sender_id)` RPC or extending
`profile_kudo_stats`.

**3. `e2e/support/profile-feed-helpers.ts:20` (`readCounts`) and several specs build raw SQL via string
interpolation** (e.g. `where id = '${id}'`, `where message = '${FIXTURE_TAG}'`). Test-only code, and
every interpolated value in this batch is a hardcoded constant (`DEMO_USER_ID` et al.) or a
test-generated fixture tag — not attacker input — so there's no real injection surface. Noting only
because "SQL built with string concatenation" is a standing red flag; it's fine here because nothing
in the interpolated set is externally controlled.

## Security boundary verification (the stated priority)

- **`SEC_001`** — `getProfileStats(id, callerId)` (`lib/profile/queries.ts:78-79`) returns `null` on
  `id !== callerId` as its very first line, before any query runs. `app/profile/page.tsx:64,90-95`
  branches render on that one `stats` value — `ProfileStatsCard` vs `ProfileWriteBar` — and
  `ProfileKudosSection`'s `sentCount` prop (`page.tsx:100`) is the same `stats ? stats.kudosSent : null`
  value, so the "no Sent count anywhere" guarantee traces to one data-level branch, not parallel UI
  checks. Confirmed via the `SEC_001` e2e spec (`profile-kudos-direction.spec.ts:38-54`), which asserts
  against the raw HTML payload (`response.text()`), not just the rendered DOM — so a client-side hide
  would have failed this test. **Holds.**
- **`SEC_002`** — `getSentFeed` (`lib/profile/feed-queries.ts:129-195`) attributes every row to
  `callerBlock`, the caller's own real profile fetched once — never masked, even for
  `sentAnonymously: row.is_anonymous === true` rows. Verified live by the `SEC_002` e2e spec
  (`profile-kudos-direction.spec.ts:56-93`), which inserts a real anonymous row, asserts the caller's
  own name renders on that card, and asserts `"Ẩn danh"` (the masked-name string) appears zero times.
  **Holds.**
- **`SEC_003`** — `getSentFeed(cursor)` takes no target parameter (`feed-queries.ts:129`); the entire
  boundary is the view's own `WHERE sender_id = auth.uid()`. Confirmed at the Server Action layer too:
  `loadProfileFeedPage` (`load-profile-feed-page.ts:54-56`) never forwards `targetId` on the `"sent"`
  branch — even a forged request naming another Sunner's `targetId` alongside `direction: "sent"` gets
  ignored, since `getSentFeed` has no parameter to receive it. **Holds**, with the residual gap already
  named in clarifications.md: the two-live-session cross-check (`SEC_003`'s "two sessions' lists are
  disjoint") is not automated. That's an acceptable gap for this batch — it needs real concurrent
  sessions, which Playwright's single-worker setup doesn't exercise — but it should stay a named,
  tracked item rather than quietly forgotten; the clarifications file already does this
  ("deferred to phase 07" / SC-B504), so I'd call the residual risk **acceptable as recorded**, not
  closed.
- **`SEC_004`** — grepped every new `lib/profile/*`, `app/profile/actions/*`, `components/profile/*`
  file for `email` and `auth.users`: zero matches. The migration's own column list
  (`supabase/migrations/20260907010000_profile_read_layer.sql:27-38`) is a literal enumeration, no
  `select *`. **Holds.**

## Migration GRANT verification (live DB)

Ran `\dp public.kudos_sent_for_caller` against the running stack:

```
authenticated=r/postgres   -- SELECT only
-- no row for anon
```

Matches the migration's `revoke all ... from anon, authenticated; grant select ... to authenticated;`
sequence exactly — the default-ACL hole (postgres-owned default privileges on schema `public` handing
`anon`/`authenticated` full rights to any newly created relation) is closed the same way the six prior
migrations closed it for `profiles`/`profile_kudo_stats`/etc. `security_invoker=off` confirmed via
`pg_class.reloptions`, and it's the correct choice here: `security_invoker=on` would make the view
re-check RLS as the _caller_, and since the base `kudos` table's own RLS already permits
`anon,authenticated` to read everything (`kudos readable by all`, `USING (true)` — confirmed live via
`pg_policy`), the view's `WHERE sender_id = auth.uid()` is what actually confines it, exactly as the
migration's own comment states. For a signed-out caller, `auth.uid()` is `NULL`, so the `WHERE` clause
alone already yields zero rows even before the GRANT is considered — the GRANT is the second,
independent layer. Both hold. The base-table anonymity hole (any authenticated/anon caller can read
`kudos.sender_id` directly, bypassing the view) is real, confirmed live, and correctly left
out-of-scope per Q6 — narrowing it would break Batch A's live board, which is explicitly not this
phase's job.

## `FUN_004` malformed-`?id` verification

`lib/profile/resolve-target.ts:28-38` is pure (no import touches the DB) and runs entirely before
`app/profile/page.tsx:61-67`'s `Promise.all` of DB calls — confirmed by reading the call order in
`page.tsx:54-58`. The UUID regex is checked ahead of the caller-id-equality check, so a malformed value
never reaches a query regardless of whether it happens to equal the caller's id. Order of the six
cases in the doc comment matches the implementation line-for-line. The e2e spec's own
`MALFORMED_IDS` array (`profile-access.spec.ts:22`) is lifted verbatim from the MoMorph test case's
`Test_Data` column per its comment — good practice, not a hardcoded guess.

## Read-layer correctness

- **Keyset pagination**: both `getReceivedFeed` and `getSentFeed` order by `(created_at desc, id desc)`
  and use the same `or(created_at.lt.X, and(created_at.eq.X, id.lt.Y))` tie-break shape Batch A's board
  already uses — the `id` tiebreak is what prevents a dropped/duplicated row when two Kudos share a
  timestamp. `nextCursorFrom` (`feed-queries.ts:12-17`) only returns a cursor when the page was full
  (`rows.length === FEED_PAGE_SIZE`), so it can't manufacture a phantom next page. `FUN_013`'s e2e spec
  explicitly asserts `new Set(ids).size === ids.length` after scrolling to the end — a real
  no-duplicate check, not just a count check.
- **Two denominators**: `heroTierFromDistinctSenders` (distinct senders, 1-4/5-9/10-20/>20) and
  `starTierFromTotalReceived` (re-exported `starTier`, keyed on `profile_kudo_stats.kudos_received`,
  10/20/50) are genuinely different functions fed genuinely different numbers
  (`countDistinctSenders` vs `statsRow.kudos_received`) — not the same value rendered through two
  labels. `hero-tier.ts`'s docstring correctly flags `starTier()`'s own stale docstring rather than
  silently "fixing" a Batch A file this phase doesn't own — good discipline.
- **`hero_badge` correctly ignored**: grepped `lib/profile/**` — no reference to `profiles.hero_badge`
  anywhere in the read path; the hero tier is derived at read time as clarifications.md specifies.

## The `KudosFormModal.recipient` judgment call — second opinion

Traced the full lifecycle: `initialFormWithRecipient(recipient)` (`kudos-form-fields.tsx:33-35`) is
used at (a) the lazy `useState` initializer, (b) `handleClose`, and (c) the render-time
`prevOpen !== open` transition guard (`kudos-form-modal.tsx:98-106`) — which recomputes from
whatever the **current** `recipient` prop is at the moment `open` flips `false → true`. Since a
profile-to-profile navigation happens through `ProfileWriteBar`'s parent (a fresh server render
passing a new `recipient` object each time), and the guard re-derives on every open transition rather
than only at mount, a reopened modal cannot carry a stale recipient from a previously-viewed profile —
confirmed there's no code path where `open` stays `true` across a `recipient` prop change without an
intervening close/reopen that would refresh it. Existing call sites verified unaffected: `grep` for
`<KudosFormModal` shows exactly three call sites — `write-kudos-bar-button.tsx:64` and
`widget-button.tsx:161` both omit `recipient` (defaults to `null`, `initialFormWithRecipient(null)` ==
`INITIAL_KUDOS_FORM`, byte-identical to pre-change behavior), and `profile-write-bar.tsx:49` is the new
one. **Judgment call holds — no fork, no leak, no regression to the two existing entry points.**

## Test integrity

Read all six new `e2e/profile-*.spec.ts` files plus `rules-drawer.spec.ts`. No vacuous or
over-broad locators found — the specs consistently scope assertions to `data-testid`s rather than
text content where the same text also appears elsewhere on the page (`profile-hero.spec.ts`'s
`exact: true` fix, this batch's own fix for the `FUN_001`/`GUI_009` strict-mode collision, is
correctly applied). `SEC_001`'s test reads `response.text()` directly rather than trusting
Playwright's DOM assertions alone — the stronger check, since it can't be fooled by a CSS-only hide.
`profile-kudos-direction.spec.ts:56-93`'s `SEC_002` fixture inserts then deletes its own row in
`beforeAll`/`afterAll` with a unique `FIXTURE_TAG` filter on delete — clean, no residue risk assuming
`afterAll` actually runs (Playwright guarantees this barring a process kill mid-suite, which is the
same residual risk every other fixture in this codebase already accepts).
`profile-kudos-feed.spec.ts`'s Sent-empty-state test temporarily reassigns (not deletes) the ordinary
user's sent rows to a parking sender and restores them in `afterAll` — correct call given
`workers: 1` in `playwright.config.ts`, verified.

No instance found of the "asserting the broken state" failure mode the clarifications.md flagged for
`secret-box-reveal.spec.ts` (already fixed, per that file). The `test.skip()` calls flagged by
`pnpm lint` (`profile-kudos-cards.spec.ts:85`, `profile-kudos-direction.spec.ts:116`,
`profile-kudos-feed.spec.ts:106`) are all guarded by a data-dependent precondition
(`test.skip(sent < 11, ...)`) rather than an unconditional skip masking a known failure — legitimate
use of conditional skip for "this fixture doesn't have enough rows to prove pagination", not a hidden
XFAIL.

## `app/profile/actions/load-profile-feed-page.ts` — Server-Action boundary

Validates `direction` against a closed union, `targetId` against non-empty-string, and `cursor`
against a shape check (see Medium finding #1 above for the one gap). Confirmed it cannot be used to
page another user's Sent feed: the `"sent"` branch never reads `targetId` at all (line 54-56), so
there is no parameter an attacker could supply to redirect `getSentFeed` at anyone but the
cookie-authenticated caller.

## `AGENTS.md` adherence

- Server components by default: `ProfileStatsCard` is explicitly a server component with a doc comment
  explaining why (`"deliberately no 'use client'"`); client components (`ProfileHero`,
  `ProfileBadgeCollection`, `ProfileKudosSection`, etc.) all have a stated reason (`react-i18next`
  hook, interactivity). No unnecessary `"use client"` found.
- shadcn reuse: `ProfileDirectionDropdown` builds on `components/ui/dropdown-menu.tsx` per Q10,
  confirmed by reading the file — no hand-rolled menu.
- TypeScript strict / no `any`: `tsc --noEmit` exits 0. Spot-checked the profile files for `any` —
  none found; unknown DB rows are narrowed via `Record<string, unknown>` + typeof guards throughout
  (`parsePersonBlock`, `countDistinctSenders`, etc.), which is the same discipline Batch A's
  `board-query-helpers.ts` already uses.
- 200-line ceiling: every file this batch creates is under it (`feed-queries.ts` is the largest at
  195). `components/ui/dropdown-menu.tsx` (253) and `lib/supabase/database.types.ts` (530) are both
  over 200 but are pre-existing/generated artifacts (shadcn scaffold, Supabase type generation) not
  authored by this batch — not a violation of this batch's own success criterion #5, which scopes the
  ceiling to files it creates.
- Kebab-case: all new files follow it.

## Live checks re-run

- `pnpm typecheck` → exit 0.
- `pnpm lint` → **0 errors**, 220 warnings (pre-existing Tailwind class-order / Playwright style
  warnings across the whole repo, none in files unique to this batch's core logic beyond a few
  `no-force-option`/`no-skipped-test` warnings already addressed above as legitimate, not bugs).
- Live DB: `kudos_sent_for_caller` ACL and `security_invoker` option confirmed as documented above;
  `kudos`/`profiles`/`user_icon_unlocks`/`secret_box_icons` RLS policies read and consistent with the
  code's assumptions.

## Done well

- The migration's own comment block explains _why_ `security_invoker=off` plus a `WHERE` clause is the
  actual boundary, not just _what_ the SQL does — this is the right level of documentation for a
  security-bearing artifact, and it made this review faster and more confident, not slower.
- `SEC_001`'s implementation is genuinely a single branch point (`getProfileStats`'s early return), and
  every downstream consumer (page composition, the KUDOS section's option list) derives from that one
  `null`, rather than three places independently deciding "is this self." That's the right shape for a
  security-relevant condition — one place to audit, not three to keep in sync.
- The clarifications file records _why_ each judgment call was made, including the two invalidated
  test cases for Thể lệ's won't-do closure — a future reader won't "restore" tests that were correctly
  removed for being architecturally incoherent.
- Reusing `KudoCardData`/`getKudoFeedPage`'s mapper and `HeroBadge`/`StarTierBadge` rather than
  re-declaring board types for the profile screen is real DRY discipline, and the one place a type
  needed widening (`ProfileFeedCard`) was done via intersection in the profile's own file rather than
  editing Batch A's type.

## Actions in order

1. (Medium, non-blocking) Add UUID/ISO-timestamp format validation to `isValidCursor` in
   `app/profile/actions/load-profile-feed-page.ts` (and, ideally, its Batch A twin
   `app/sun-kudos/actions/load-feed-page.ts`), and have both actions catch a DB error and return an
   empty page rather than throwing. Worth a small follow-up commit; does not block this one.
2. (Low, no action needed now) `countDistinctSenders`'s full-table-scan-per-request is an accepted,
   documented trade-off — revisit only if a receiver's Kudos count grows large enough to matter.

## Numbers

- Type coverage: `tsc --noEmit` exit 0 (strict mode, no `any` introduced).
- Test coverage: 96 e2e tests passing per the prompt's verified state (re-verification of lint/
  typecheck done fresh in this review; full e2e suite not rerun here since it's already verified and
  unrelated to the read-only review).
- Lint findings: 0 errors, 220 warnings (pre-existing repo-wide, not newly introduced by this batch's
  core logic).

## Still unresolved

- `SEC_003`'s two-concurrent-session assertion remains manual/unautomated — recorded in
  clarifications.md as deferred, which I consider an acceptable, explicitly-tracked gap rather than a
  silent one. Flagging again here so it surfaces in review, not just in the plan file.
- The cursor-validation gap (Medium #1) is shared with pre-existing Batch A code; fixing it only in
  the new profile action would leave the same class of gap on the live board's `loadFeedPage`. Worth
  deciding whether to fix both together or file it as a tracked follow-up.

**Verdict: safe to commit.** No critical or high finding; the two medium/low items are follow-up
material, not blockers, and one of them predates this batch.

**Status:** DONE
