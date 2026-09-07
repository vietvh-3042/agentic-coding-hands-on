# Reviewer Inspection — Batch A: Kudos Data Layer

**Date:** 2026-09-06 · **Scope:** working tree (uncommitted), phases 01–09 of
`plans/260710-1511-sun-kudos-live-board/` · **Depth:** full read of all new SQL
migrations/tests, all Server Actions, all `lib/kudos/**`, board/authoring/hearts/
secret-box components, sign-out, e2e specs, i18n, playwright config.

## Scope

- Files reviewed: 5 migrations, 5 SQL test files, 4 Server Actions, 7 `lib/kudos/**`
  modules, ~25 `components/kudos-board/**` + `components/kudos/**` files, `user-menu.tsx`,
  `page.tsx`, 7 `e2e/board/**` specs, `playwright.config.ts`, i18n locale pairs
  (`kudos`, `kudos-board`, `kudos-feed`, `kudos-spotlight`).
- Lines: ~4,500 in `lib/kudos` + `components/kudos*` + `app/sun-kudos` (all files
  individually under 200 lines, largest is `board-query-helpers.ts` at 184).
- Depth: full read, not diff-only — cross-checked render paths against what the
  DB actually stores, not just what the plan says it stores.

## Assessment

The security work (phase 01/03) is the strongest part of this batch and is
genuinely production-grade: column-scoped GRANTs, a real live-DB RED/GREEN proof,
a BEFORE INSERT trigger that makes the heart multiplier unforgeable, and a
parameterless `security definer` RPC with a row lock for the secret-box draw.
Every Server Action re-derives identity from `getUser()`, re-validates input
server-side, and never trusts a client-supplied `sender_id`/`hearts_value`/badge
choice. The SQL test suite is unusually thorough — it tests grants via
`has_table_privilege`/`has_column_privilege`, not just behavior.

However, I found one defect the known-issues list does not mention, and it's a
real one: **every kudo message renders its own HTML markup literally on screen**,
for both seeded rows and brand-new submissions. This is a functional/display bug
that will be visible to every user looking at the board — see Critical #1. The
recorded known issues (duplication bug, RED-first deviation, workers=1, ownership
deviations, `public/profile/`, category span, e2e flake) all check out as claimed
on inspection; I did not have to re-litigate any of them as new.

## Critical

**1. Every kudo message displays raw HTML tags/entities on the board — a new,
unrecorded defect.**
`submitKudoAction` stores `<p>${htmlEscaped(message)}</p>` (`app/sun-kudos/actions/submit-kudo.ts:19-27,122`),
matching the pre-existing seed convention (`supabase/seed.sql:181` etc. — every
seeded message is literally `'<p>Cảm ơn... &lt;3...</p>'`). But the render path
never parses that HTML back out: `components/kudos-board/feed-kudo-post-card.tsx:81`
and `components/kudos-board/highlight-kudo-card.tsx:81-82` both do
`<p>{kudo.message}</p>` — a plain React text node. There is no
`dangerouslySetInnerHTML`, no HTML-stripping step in `lib/kudos/board-query-helpers.ts`'s
`mapKudoRow` (it passes `row.message` straight through, line 132), and no markdown/
HTML rendering library anywhere in the project (`grep -rn "react-markdown\|marked\|remark"`
returns nothing relevant). The result: **every card on the live board shows
`<p>Cảm ơn người em... &lt;3 và cuộc sống...</p>` as literal text**, tags and
double-escaped entities included, for all 40 seeded rows and for any kudo
submitted through the new form.

- Cost: this is not cosmetic-and-rare — it is the default rendering of the
  headline feature ("the board renders real rows") for 100% of cards.
- Why CI/e2e didn't catch it: Playwright's `getByText(...)` does substring
  matching by default, so an assertion like `getByText("Cảm ơn")` still matches
  inside `<p>Cảm ơn...</p>` even though the tags are visible in a real browser.
  Screenshots were not part of this batch's e2e assertions.
- Fix: pick one convention and make both ends agree. Simplest: stop
  wrapping/escaping in `submitKudoAction` — store the raw trimmed message as
  plain text (React already escapes it on render, per the function's own
  code comment admitting "today's board cards render it as plain React text").
  Then either (a) also strip the legacy `<p>...</p>` wrapper + unescape
  entities for the seeded rows at read time in `mapKudoRow`, or (b) leave a
  one-time follow-up migration to unwrap `kudos.message` for the 40 seeded rows.
  Do **not** switch to `dangerouslySetInnerHTML` to "fix" the display — that
  reopens exactly the stored-XSS risk `escapeAndWrapMessage`'s own comment
  says it's defending against.
- Location: `app/sun-kudos/actions/submit-kudo.ts:19-27`,
  `lib/kudos/board-query-helpers.ts:132`,
  `components/kudos-board/feed-kudo-post-card.tsx:81`,
  `components/kudos-board/highlight-kudo-card.tsx:81-82`.

## High

**2. Addlink Box's inserted link never renders as a link — the phase's
headline new feature is cosmetically inert.**
`insertLink` in `components/kudos-content-editor.tsx:52-57` splices literal
markdown `[text](url)` into the plain `<textarea>` value. That string is then
escaped and wrapped as plain text by `escapeAndWrapMessage` and rendered as
plain text by the two card components (same render path as Critical #1) — there
is no markdown parser anywhere in this project. So a user who successfully uses
the one truly-new toolbar button this phase built sees literal
`[my link text](https://example.com)` on the public board, never a clickable
anchor. The data layer (validation, storage) is correct; the promised
user-visible outcome is not delivered.

- Fix: either render `message` through a minimal safe markdown-link parser
  (e.g. detect `[text](https?://...)` and emit a real `<a>` with
  `rel="noopener noreferrer"`, escaping everything else) at the two card
  render sites, or drop the markdown-splice approach in favor of storing a
  small structured `links` array alongside the message. Whichever is chosen,
  it should be resolved together with Critical #1 since both touch the same
  render path.
- Location: `components/kudos/kudos-content-editor.tsx:52-57`; render sites as above.

**3. `hearts_value` trigger security is correct, but `resolve_heart_value()` is
declared `security definer` when it doesn't need to be — needless privilege escalation surface.**
`supabase/migrations/20260906192000_heart_multiplier.sql:31-51` marks the BEFORE
INSERT trigger function `security definer`. The function only reads
`event_settings` (which is `SELECT`-granted to `anon`/`authenticated` per the
pre-existing `20260722100000_kudo_hearts.sql`/notifications-era migrations — worth
confirming, but nothing here suggests it's admin-only) and sets `NEW.hearts_value`.
A BEFORE INSERT trigger already runs in the same transaction as the triggering
statement; it does not need owner privileges to read a publicly-readable table.
Every `security definer` function is a privilege-escalation surface by
definition (the migration's own comment acknowledges this pattern's general
risk for `open_secret_box()`) — one that isn't load-bearing here should not
exist. This is not an exploitable hole today (the function does nothing an
`authenticated` caller couldn't already do directly), but it's an unnecessary
attack-surface increase that a future edit to this function could turn into a
real one without anyone questioring why it's definer in the first place.

- Fix: drop `security definer` from `resolve_heart_value()` (keep `set
search_path = public` regardless — pinning it costs nothing). Re-run
  `supabase/tests/hearts-multiplier.sql` to confirm no behavior change (it
  shouldn't, since `event_settings` SELECT is already granted to `authenticated`).
- Location: `supabase/migrations/20260906192000_heart_multiplier.sql:31-35`.

## Medium

**4. Phase 01's migration silently narrowed scope vs. its own plan file —
worth flagging even though the net security posture is fine today.**
`phase-01-security-profiles-column-privileges.md:82-100` (Implementation Step 3)
specifies killing the schema-level default ACL
(`alter default privileges for role postgres in schema public revoke all on
tables from anon, authenticated`) plus re-asserting grants on every
pre-existing table (`kudos`, `kudo_hearts`, `notifications`). The migration that
actually landed, `supabase/migrations/20260906190000_profiles_column_privileges.sql`,
only touches `profiles` — no `ALTER DEFAULT PRIVILEGES` statement exists
anywhere in the five new migrations. The mitigation that did land instead is
per-table: `20260906191000_kudo_hashtags.sql` and `20260906191500_profile_stats_view.sql`
each do their own explicit `revoke all … / grant select …` on the tables/view
they create, and both are tested for it (`hashtags.sql` Part 4,
`profile-stats-view.sql` Part 3). That is a valid, working substitute — I
verified every table this batch adds is properly locked down — but it is
**fragile as a standing discipline**: nothing stops the next migration after
this batch from forgetting to revoke/grant its own new table, and the
default ACL that would otherwise catch that omission was never actually
removed. `kudos`, `kudo_hearts`, and `notifications` (pre-existing tables named
in the plan's own step 3) were also never re-verified against the
default-ACL leak by this batch — they rely entirely on their own older
migrations having gotten it right.

- Fix: add the `ALTER DEFAULT PRIVILEGES` statement from the plan as a small
  follow-up migration — belt-and-suspenders, not urgent, but it is the
  documented countermeasure and it's cheap to add.
- Location: `supabase/migrations/20260906190000_profiles_column_privileges.sql`
  (missing the default-ACL statement the plan calls for at
  `phase-01-security-profiles-column-privileges.md:86-90`).

**5. `getSpotlightBoard()` is a genuinely unbounded full-table scan (accepted
by spec, but worth naming as a scaling limit, not silently accepted forever).**
`lib/kudos/board-aggregates.ts:48-51` selects `created_at, receiver:...` for
**every row** in `kudos` with no `.limit()`, then dedupes receivers in JS. This
is explicitly what clarifications.md calls for ("Spotlight = unbounded node set

- COUNT(*)"), so it's not a defect against this batch's acceptance criteria —
  at 40 seed rows it's invisible. Flagging because "every recipient as a node"
  will not stay O(rows) cheap once the event runs for real; a
  `select distinct on (receiver_id) receiver_id, created_at order by receiver_id,
created_at desc` pushed into Postgres would scale far better than fetching
  every row to dedupe client-side.

* Fix: not blocking this batch; worth a follow-up ticket once real kudo volume
  is known.
* Location: `lib/kudos/board-aggregates.ts:42-62`.

## Low

**6. Demo admin's avatar renders broken — `next/image` has no fallback here
(unlike the secret-box badge image, which does).**
`supabase/seed.sql:114-115` seeds the demo admin
(`00000000-...-0001`) with `avatar_url = '/profile/avatar-sample-1.png'`, and
`public/profile/` does not exist on disk (confirmed — recorded issue #5). This
avatar renders via `components/kudos-board/feed-post-person-block.tsx:23`
using Next's `<Image>` component with no `onError` handling, unlike
`secret-box-reveal-panel.tsx:37-53`, which explicitly catches the same class of
missing-asset problem for badge art. Since the demo admin is the seed's most
frequent receiver (8 of 40 kudos per the seed's own comment), this shows a
visibly broken avatar on a large fraction of feed cards. Confirmed genuinely
cosmetic — no crash, no SSR error, just a broken-image icon in the browser —
so the "cosmetic" classification in the known issues holds.

- Fix (optional, not blocking): give `FeedPostPersonBlock` the same `onError`→
  text-initial-fallback pattern `SecretBoxRevealPanel` already uses, or simply
  point the seed's `avatar_url` at an asset that exists (e.g. the same
  `/kudos/feed/sender-avatar.png` other seed rows already use).
- Location: `components/kudos-board/feed-post-person-block.tsx:22-24`,
  `supabase/seed.sql:114-115`.

**7. `privileges.sql`'s "grant baseline" is per-table `has_table_privilege`
assertions, not the single cross-table query the phase-01 plan specified —
functionally equivalent today, less future-proof.**
Phase 01's plan (`phase-01-security-profiles-column-privileges.md:103-106`)
called for "a query over `information_schema.role_table_grants` proving no
`anon`/`authenticated` row holds `INSERT|UPDATE|DELETE` on a table not in the
allow-list" — a blanket check that would automatically flag any _new_ table
nobody remembered to test. What was built instead is `has_table_privilege`
checks hand-written per table, once in `privileges.sql` (profiles) and once
in `hashtags.sql` (hashtags, kudo_hashtags) and `profile-stats-view.sql`
(the view). Coverage is complete for every table this batch actually
touches — I verified each one — but the assertion doesn't generalize: a
future table added without its own explicit test would pass silently even if
it inherited the wide-open default ACL (compounds finding #4).

- Fix: not blocking; consider adding the blanket `role_table_grants` query
  as a supplementary check in a later batch, so a forgotten table fails loud
  instead of never being asked about.
- Location: `supabase/tests/privileges.sql` (no blanket query present).

## Edge Cases Turned Up

- **Verified, not a bug:** `open_secret_box()`'s row lock (`for update`) makes
  the double-click race safe — confirmed both by reading the function and by
  the 10,000-draw distribution test in `supabase/tests/secret-box.sql`.
- **Verified, not a bug:** un-hearting after a special-day window closes still
  revokes the originally-granted amount (reads the stored `hearts_value`, never
  a hardcoded 1) — confirmed in both the SQL test and the e2e DB-layer test
  (`e2e/board/hearts-security.spec.ts:156-192`).
- **Verified, not a bug:** the `data-kudo-id` duplication (recorded issue #2)
  is fixed — grepped every `components/kudos-board/*.tsx` for `data-kudo-id`;
  it appears exactly once per card component (`feed-kudo-post-card.tsx:45`,
  `highlight-kudo-card.tsx:44`), and the heart control now carries only
  `data-testid="heart-button"`, no second `data-kudo-id`.
- **Verified, not a bug:** the infinite-scroll duplication fix (recorded issue,
  same session) holds up — `feed-list.tsx:67-96` creates the
  `IntersectionObserver` exactly once per mount (`[]` deps) with a ref-based
  guard, not recreated per `cursor` change.
- **Verified, not a bug:** the category chip (spec D.4) is a genuinely inert
  `<span>` in both `feed-kudo-post-card.tsx:66-73` and
  `highlight-kudo-card.tsx:72-76` — no `role="button"`, no `onClick`, not
  focusable, confirmed by reading both render sites directly.
- **Verified, not a bug:** sign-out clears the actual session cookie, not just
  client state — `lib/supabase/client.ts` uses `createBrowserClient` from
  `@supabase/ssr` (cookie-backed, read by `lib/supabase/proxy.ts`'s server-side
  guard), and `user-menu.tsx`'s `handleSignOut` calls the real `auth.signOut()`
  and only navigates away on success.
- **New edge case, not exploitable today but worth naming:** `submitKudoAction`
  (`app/sun-kudos/actions/submit-kudo.ts:134-143`) logs and continues if the
  `kudo_hashtags` insert fails after the `kudos` row is already committed —
  documented and intentional (an untagged-but-visible kudo), correctly
  matches phase-07's own risk register. Not a defect.
- **New edge case, worth confirming later:** `heartKudo`/`unheartKudo`
  (`app/sun-kudos/actions/heart-kudo.ts`) read back `hearts_count` with a
  separate `SELECT` after the write rather than inside the same transaction —
  under `workers: 1` e2e this is invisible, but at real concurrency two rapid
  hearts from different users on the same kudo could each read a
  slightly-stale count between their own write and their own read-back. This
  self-corrects on the next page load/`revalidatePath` and never desyncs the
  stored value (the DB trigger is still the only writer), so it's a rendering
  staleness window, not a data-integrity bug — noting it, not blocking on it.

## Done Well

- The privilege-escalation fix (phase 01) is textbook: RLS for row-scoping,
  GRANT for column-scoping, a real live-DB RED before the fix and a real GREEN
  after, plus a positive case proving the language switcher still works.
- The heart multiplier and secret-box draw are both correctly moved
  server-side specifically to close a forgery path a spec draft had left
  open — and both are proven closed by an e2e test that attempts the forgery
  for real against local Supabase (no mocks), not just by code inspection.
- The SQL test suite systematically pairs a positive assertion with a negative
  one (e.g., `display_name` succeeds / `role` fails) rather than only testing
  the forbidden path — this is exactly the shape that keeps a security fix
  from silently breaking a legitimate use case.
- Every Server Action treats itself as a public HTTP endpoint regardless of
  which UI calls it — validating `cursor`/`filter`/`kudoId` shape at the
  boundary rather than trusting a same-origin caller.
- File-size discipline held up under audit: every touched file is under 200
  lines, and the splits I read (`board-queries.ts`/`board-aggregates.ts`/
  `board-query-helpers.ts`; `kudos-form-modal.tsx`/`kudos-form-fields.tsx`;
  `sidebar-gift-dialog.tsx`/`secret-box-reveal-panel.tsx`) are coherent
  seams along real responsibility boundaries, not arbitrary cuts.
- i18n key parity between `en`/`vi` is complete across all four touched
  namespaces, and the Vietnamese diacritics I spot-checked are correct.

## Actions In Order

1. Fix Critical #1 (message HTML double-encoding/literal-tag display) — this
   is visible on every single kudo card and should block sign-off until
   resolved.
2. Resolve High #2 (Addlink Box markdown never renders as a link) alongside #1,
   since both touch the same message-render path — cheapest to fix together.
3. Drop `security definer` from `resolve_heart_value()` (High #3) — small,
   low-risk change, re-run `hearts-multiplier.sql` to confirm no regression.
4. Add the `ALTER DEFAULT PRIVILEGES` statement from the phase-01 plan as a
   follow-up migration (Medium #4) — cheap defense-in-depth, not urgent.
5. Everything else (Medium #5, Low #6/#7) is a follow-up-ticket item, not a
   blocker for this batch.

## Numbers

- Type coverage: not separately measured; `pnpm typecheck` reported clean by
  the orchestrator (re-verified no new `any` introduced in any file I read).
- Test coverage: no unit runner exists project-wide (YAGNI, per plan) — 37 E2E
  assertions + 5 SQL assertion suites are the only test layer, all reported
  green by the orchestrator.
- Lint findings: none observed in the files read; `pnpm validate` reported
  exit 0 by the orchestrator.

## Still Unresolved

- Whether Critical #1 was ever actually seen in a real browser during this
  batch's manual verification pass, or only through Playwright's substring
  text assertions — worth asking the implementer directly, since the fix is
  small but the fact that it shipped past `pnpm test:e2e` twice (chromium-authed
  33/33 + chromium 11/11) both times is itself worth a retro note about
  screenshot-based assertions for any future text-rendering work.
- Product-owner question already on record (clarifications.md) about whether
  category-text filtering (D.4) should exist at all — unchanged by this review,
  just re-flagging that it's still open.

---

```json
{
  "score": 6,
  "criticalCount": 1,
  "decision": "REWORK",
  "acceptanceCovered": [
    "Phase 01 FN-1/FN-2/FN-3 (profiles column privileges) — verified via privileges.sql and direct code read",
    "Phase 03 FN-1..FN-7 (hashtags, stats view, heart multiplier, secret-box draw) — verified via migrations + SQL tests",
    "Phase 06 board reads (feed/highlight/spotlight/sidebar, filter lift, star tier) — verified via board-queries.ts/board-aggregates.ts and page.tsx wiring",
    "Phase 07 FN-1..FN-7 authoring validation/upload/rollback (data layer) — verified via kudo-validation.ts, upload-kudo-images.ts, submit-kudo.ts",
    "Phase 08 hearts FN-1..FN-6 (server-side multiplier, self-heart block, optimistic UI) — verified via heart-kudo.ts, heart-button.tsx, hearts-security.spec.ts",
    "Phase 09 secret-box FN-1..FN-5 (parameterless RPC, atomicity, counter integrity) — verified via open-secret-box.ts, secret_box_draw migration, secret-box-security.spec.ts",
    "Sign-out clears server-side session cookie, not just client state",
    "200-line file budget held across all touched files",
    "i18n en/vi key parity across kudos/kudos-board/kudos-feed/kudos-spotlight"
  ],
  "regressionChecked": [
    "data-kudo-id duplication (recorded issue) — fixed, verified no duplicate identity attribute remains",
    "infinite-scroll double-fetch (recorded issue) — fixed, verified single mount-time IntersectionObserver",
    "category-text span (recorded issue) — verified genuinely non-focusable, no role=button",
    "public/profile/ missing asset (recorded issue) — verified cosmetic, no crash, secret-box has onError fallback",
    "phase 07/08 ownership deviations (i18n files, upload-kudo-images.ts, highlight-carousel.tsx) — no collateral damage found in the files as they exist now"
  ],
  "contractStatus": "OK",
  "refuted": [],
  "unproven": [],
  "reachableRegressions": [],
  "findings": [
    {
      "severity": "Critical",
      "category": "Logic",
      "location": "app/sun-kudos/actions/submit-kudo.ts:19-27",
      "summary": "Message is stored HTML-escaped and <p>-wrapped but rendered as plain React text with no unwrap step, so every kudo card (seeded and new) shows literal <p>...&lt;3...</p> markup on screen",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Logic",
      "location": "components/kudos/kudos-content-editor.tsx:52-57",
      "summary": "Addlink Box inserts literal markdown [text](url) into the message with no markdown renderer anywhere in the app, so the inserted link never becomes clickable on the board",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Security",
      "location": "supabase/migrations/20260906192000_heart_multiplier.sql:31-35",
      "summary": "resolve_heart_value() BEFORE INSERT trigger is declared security definer without needing owner privileges (only reads a publicly-SELECT-granted table), an avoidable privilege-escalation surface",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Security",
      "location": "supabase/migrations/20260906190000_profiles_column_privileges.sql:53-57",
      "summary": "Plan's ALTER DEFAULT PRIVILEGES step (kill the schema-level default ACL) was dropped in favor of per-table explicit revoke/grant; every current table is covered but the discipline is not self-enforcing for future tables",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Performance",
      "location": "lib/kudos/board-aggregates.ts:42-62",
      "summary": "getSpotlightBoard() fetches every kudos row unfiltered to dedupe receivers client-side; deliberate per spec at current scale but will not stay cheap at real event volume",
      "disposition": "Defer"
    },
    {
      "severity": "Low",
      "category": "Logic",
      "location": "components/kudos-board/feed-post-person-block.tsx:22-24",
      "summary": "Demo admin's seeded avatar_url points at a nonexistent /profile/ asset and next/image has no onError fallback here (unlike secret-box-reveal-panel.tsx), so the demo admin's avatar renders broken on ~8 of 40 seeded cards",
      "disposition": "Accept"
    },
    {
      "severity": "Low",
      "category": "Structure",
      "location": "supabase/tests/privileges.sql",
      "summary": "Grant-baseline assertions are hand-written per table rather than the single cross-table information_schema query the phase-01 plan specified; complete today but not self-extending to future tables",
      "disposition": "Defer"
    }
  ]
}
```
