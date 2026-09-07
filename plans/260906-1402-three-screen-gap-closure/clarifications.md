# Clarifications — three-screen gap closure (FAB · Thể lệ · Profile)

Screens (fileKey `9ypp4enmFmdK3YAFJLIu6C`):
[`Sv7DFwBw1h`](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/Sv7DFwBw1h) Floating Action
Button chức năng 2 · [`b1Filzi9i6`](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6)
Thể lệ UPDATE · [`3FoIx6ALVb`](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb)
Profile bản thân.

Supersedes the TBD rows in
[`../260906-1903-profile-and-menus/clarifications.md`](../260906-1903-profile-and-menus/clarifications.md)
for the phases this batch forges. Rows marked **user** were answered by the user this session; rows
marked **evidence** were closed by reading the codebase, the schema, or the design frame — the
scout-first rule, not a guess.

## Session 2026-09-07

### Premise correction (evidence)

- Q: Are all three screens unbuilt, as the request assumed? → **A: No — two are built.**
  `Sv7DFwBw1h` ships as `components/homepage/widget-button.tsx` (all 3 spec rows, mounted on
  `/about`); `b1Filzi9i6` ships as `components/homepage/saa-rules-drawer.tsx` (all 4 spec rows).
  Only `3FoIx6ALVb` is genuinely absent — no `app/profile/`, no `lib/profile/`, no
  `components/profile/`. Two retrospective plans already recorded this
  ([FAB](../260716-0952-widgetbutton-open-state/plan.md),
  [Thể lệ](../260709-1417-saa-rules-drawer/plan.md)). _Constrains: the batch is one build plus two
  gap-closures, not three builds._

### Scope

- Q: Given two screens are built, what is in scope? → **A (user): Profile + close the real gaps on
  the two built screens.** _Constrains: three tracks, below._
- Q: Does the header dropdown work (`z4sCl3_Qtk`, `54rekaCHG1`) ride along? → **A: No — out of
  scope.** Those screens were not requested. `phase-06` of the Profile plan is therefore **not
  forged** this batch, and its gating questions (Q7/Q8/Q9 there) stay open. _Constrains: `/admin`,
  `site-header.tsx` and `user-menu.tsx` are untouched._

### Thể lệ UPDATE (`b1Filzi9i6`)

- Q: Spec B requires a disabled footer state ("Disabled là mờ và không nhận click") with two test
  cases (`TC_THELE_GUI_003`, `TC_THELE_FUN_005`), but no source states the condition. →
  **A (user, first pass): disabled while a KUDOS submit is in flight.** Then, on implementation,
  that condition proved **architecturally unreachable** (below), so →
  **A (user, final): CLOSE AS WON'T-DO.** `G1` is not implemented; `TC_THELE_GUI_003` and
  `TC_THELE_FUN_005` are recorded **N/A**.
  - _Why unreachable:_ `onWriteKudos` closes the drawer **before** the kudos form opens
    (`widget-button.tsx` → `handleWriteKudos` runs `setRulesOpen(false); setKudosOpen(true)`), and
    while closed the wrapper is `aria-hidden` + `pointer-events-none`. The footer button is
    therefore never on screen during a submit, and "disabled" has no meaning in that state.
  - _Why the tests as first written were invalid:_ they asserted `disabled` on a freshly-opened
    drawer with **no submit in flight**, which also directly contradicts `TC_THELE_FUN_004` (which
    clicks that same button and expects the modal to open). That RED could never have gone GREEN
    correctly — it was removed, not "fixed".
  - _Why won't-do is honest rather than a gap:_ the dimmed-and-unclickable behaviour spec B
    describes **already exists** where a submit actually happens —
    `components/kudos/kudos-form-modal.tsx:181` carries
    `disabled={!isValid || status === "submitting"}` with `disabled:opacity-40`. Spec row B's
    `itemSubtype` is a generic `icon_text` and its wording reads as component-library boilerplate,
    which the retro plan had already hypothesised.
  - _Constrains:_ `phase-02` of the rules retro reduces to **G2 only** (real icons). The rationale
    is also written into `e2e/rules-drawer.spec.ts` where the two tests used to sit, so a future
    reader does not "restore" them.
- Q: Spec A lists "danh sách thưởng" among required elements (restated by `TC_THELE_GUI_001`). The
  drawer renders no section that plainly _is_ a prize list — is one missing? → **A (evidence): not
  missing; G4 is closed, not a gap.** The frame (`3204:6051`, read this session) contains exactly:
  title "Thể lệ", three sections (NGƯỜI NHẬN KUDOS with 4 hero tiers · NGƯỜI GỬI KUDOS with the 6
  icons · KUDOS QUỐC DÂN), then the two footer buttons. The rewards are stated in the section prose,
  not as a separate list. The implementation matches the frame 1:1. _Constrains: no new section is
  to be added — doing so would deviate from the design._
- Q: Footer icons? → **A (evidence): real gap.** Code renders the text glyphs `✕` and `✎`; the frame
  shows a real X icon and a real pen icon. _Constrains: use `CustomSvgIcon` +
  the shared pen icon; assets already in `public/icons/`._

### Floating Action Button (`Sv7DFwBw1h`)

- Q: The FAB mounts only on `/about`; `/award-info` and `/sun-kudos` have none, and
  `app/award-info/page.tsx:29` claims one it does not render. → **A (user): mount on `/award-info`
  and `/sun-kudos` too, and fix the false docblock.** _Constrains: the FAB becomes a site-wide
  quick action; three mount sites._
- Q: Is the 149×64px width of the "Thể lệ" pill binding? → **A (evidence): height binds, width does
  not.** `h-16` = 64px is exact. Width is content-driven (`px-4` + label) and must stay so: a fixed
  149px truncates the English label "SAA Rules". _Constrains: G2 is closed as
  by-design — no fixed width._

### Profile bản thân (`3FoIx6ALVb`)

- Q3b: The distinct-sender thresholds for `new → rising → super → legend` were recorded as "stated
  nowhere". → **A (evidence): they are stated — in the shipped rules drawer.**
  `lib/i18n/locales/vi/rules.json` and the `b1Filzi9i6` frame both give: **1–4 New Hero · 5–9 Rising
  Hero · 10–20 Super Hero · >20 Legend Hero**. _Constrains: unblocks phase 02; the rules drawer is
  the authoritative source, so the tier logic and the drawer copy must not drift._
- Q3: Is the Hero tier derived at read time or is `profiles.hero_badge` the source of truth? →
  **A (evidence): derive at read time from distinct senders.** The frame says "Dựa trên số lượng
  đồng đội gửi trao Kudos" — teammates who sent, i.e. distinct senders, matching
  `TC_GUI_001`'s Note. Nothing computes the stored column and `PERM004` makes it non-user-writable,
  so it is inert. _Constrains: ignore `hero_badge` on this screen; do not add a trigger/job._
- Q1/Q2: Does `department_id` replace `hero_code`, and what about unmatched department values? →
  **A (evidence): moot this batch — no `departments` table and no `department_id` column exist**
  (`grep department supabase/migrations/` returns nothing). DD-01 has not landed. The hero renders
  the department from `hero_code`, which today holds the department string. _Constrains: phase 02
  loses its DD-01 dependency and needs no schema change for department; `TC_GUI_009`'s
  null-department rendering still applies to empty values._
- Q10: Restore the shadcn baseline or follow the hand-rolled pattern? → **A (evidence): the baseline
  is already restored.** `lib/utils.ts` exports `cn()`, and `components/ui/` holds `button`,
  `dialog`, `dropdown-menu`, `input`, `label` on Base UI primitives. _Constrains: per `AGENTS.md`,
  the KUDOS direction dropdown MUST use `components/ui/dropdown-menu.tsx` — not a hand-built menu._
- Q4: Should the badge collection light up from `user_icon_unlocks` now that F006 ships the Secret
  Box? → **A (evidence-backed fallback): render data-driven from `user_icon_unlocks`.** Satisfies
  `TC_GUI_002` today (the list is empty for a fresh user, so all 6 slots grey) and lights up later
  with no reshaping. _Constrains: 6 slots always rendered, in fixed order, real artwork desaturated._
- Q5: Real Secret Box counters, or the deferred `0`/disabled rendering the test case describes? →
  **A (fallback): render the real counters; keep the "Mở Secret Box" button disabled on `/profile`.**
  _Constrains: no second entry point into F006's reveal flow this batch;
  `TC_GUI_005`'s disabled-button assertion holds, its "both show 0" clause is superseded by real data._
- Q6: Close the base-table anonymity hole, or scope it to a definer view? → **A (fallback): definer
  view only.** Phase 02 routes profile feeds through a caller-scoped `security definer` view;
  narrowing `kudos`' base-table SELECT would break the live board mid-flight. _Constrains: the
  base-table hole remains a recorded, separate security item — `SEC_001..003` are closed for this
  screen only._
- Q11: Should a repeated `?id=` 404 rather than pick a value? → **A (fallback): yes, as
  `TC_FUN_005` states.** One array check. _Constrains: cheap and explicit._
- Q12: Is there an ordinary-role password fixture? → **A (evidence + fallback): no, one must be
  added.** `supabase/seed.sql:127` promotes `demo.user@sun-asterisk.com` to `admin`, and it is the
  only identity with a real bcrypt password. Add a password to `sender.one@sun-asterisk.com`
  (ordinary role) rather than demoting the demo user. _Constrains: phase 01 owns the seed edit._
- Q: Do the Playwright project names from the Profile plan's phase 01 still apply? → **A (evidence):
  adopt the landed names.** `playwright.config.ts` already defines `setup` +
  `chromium-authed` (`testMatch: "e2e/board/**"`, `dependencies: ["setup"]`). Batch A landed first,
  so its names win — phase 01 extends `testMatch`, it does not invent a `profile` project.
  _Constrains: no competing authed project._

### Asset + component reuse (evidence — resolved 2026-09-07, do not re-derive)

The Profile plan recorded `public/profile/` as "an asset gap, not a schema gap". Scouted this
session — the artwork **already exists in the tree** under different names, so nothing needs
sourcing from Figma:

- `secret_box_icons.image_url` points at `/profile/icons/icon-{1..6}.png`, and `public/profile/`
  does not exist. But all six are present in `public/rules/`. The seed's own names give the mapping:
  `icon-1` Stay Gold → `stay-gold.png` · `icon-2` Flow to Horizon → `flow-to-horizon.png` ·
  `icon-3` Touch of Light → `touch-of-light.png` · `icon-4` Beyond the Boundary →
  `beyond-the-boundary.png` · `icon-5` Revival → `revival.png` · `icon-6` Root Further →
  `root-further.png`. _Constrains: phase 03 satisfies the path by placing these six under
  `public/profile/icons/`; it must NOT invent placeholder artwork._
- `/profile/avatar-sample-1.png` (referenced by `seed.sql:116`) is also absent — a placeholder
  avatar is needed, and `TC_GUI_009` already requires a placeholder-avatar rendering for a sparse
  profile. _Constrains: one placeholder asset covers both._
- **Reuse `components/common/hero-badge.tsx` — do not rebuild the tier badge.** It already renders
  all four tiers at the correct 109×19 with the gold border, and already handles the fact that
  "New Hero" has **no exported artwork** (`public/kudos/badges/` holds only `rising-hero.png`,
  `super-hero.png`, `legend-hero.png`) by falling back to a navy pill with the label.
  _Constrains: the profile hero imports this component; no fourth badge asset is missing._

### Batch A reuse contract (evidence — verified present 2026-09-07)

Phase 02 requires the feed shape be "imported from Batch A rather than re-declared". Confirmed
available, so no re-declaration is excusable:

- `lib/kudos/types.ts` → `KudoCardData`, `KudoPersonBlock`, `StarTier` · `lib/kudos/board-queries.ts`
  → `FeedCursor`, `FeedPage`, `getKudoFeedPage` · `lib/kudos/hashtags.ts` → `starTier()`.
- **The deferred Spam `status` field must NOT be added to `KudoCardData`.** That type is Batch A's
  and is consumed by the live board; widening it edits a file this batch does not own. Declare
  `ProfileFeedCard = KudoCardData & { status: … }` in `lib/profile/types.ts` instead. _Constrains:
  `GUI_007` is satisfied (the field exists, nothing renders it) with zero Batch A churn._
- **`starTier()` — RESOLVED 2026-09-07: no divergence exists, only a stale docstring.** The
  docstring reads "hearts-received count (ALG-001: 10/20/50)", which is what raised the alarm, but
  the board's own call site already passes the right number: `fetchStarTiers` in
  `lib/kudos/board-query-helpers.ts:147` selects `profile_kudo_stats.kudos_received` (total Kudos
  received) and feeds it to `starTier()` at line 138 — exactly what `TC_GUI_001` specifies. The
  profile therefore reuses the function as-is; nothing needs reconciling. The stale comment sits in
  a Batch A file and was deliberately left unedited. _Constrains: two denominators stay distinct —
  Hero tier on distinct senders, stars on total received._

## Test policy per screen

| Screen               | MoMorph cases    | Policy                | Basis                                                                                                                                |
| -------------------- | ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `3FoIx6ALVb` Profile | 30               | **`e2e-red-first`**   | Route resolution, direction switching, access control — behavioral. Runner exists (`@playwright/test` 1.63.0, `pnpm test:e2e`), web. |
| `b1Filzi9i6` Thể lệ  | 9 (5 behavioral) | **`e2e-red-first`**   | Close, open-form, scroll, disabled-rejects-click are state transitions. Same runner.                                                 |
| `Sv7DFwBw1h` FAB     | **0**            | **`visual-contract`** | MoMorph holds zero cases; the gaps are hover, menu semantics and mount coverage. No RED claimed, none fabricated.                    |

`--no-test` was not selected, so no strict-policy conflict arises.

## Incidental defect fixed en route (orchestrator-owned, verified)

The fixtures phase's full-suite run surfaced 9 failing board tests that had nothing to do with this
batch. Root cause: six specs each inlined a byte-identical `psql()` helper hardcoding
`docker exec supabase_db_mock-aidd-kudo-app` — **a container name belonging to a different
project**. The real container is `supabase_db_agentic-coding-hands-on` (`project_id` in
`supabase/config.toml`), so every DB-backed board assertion died with "No such container".

Fixed by extracting `e2e/support/psql.ts`, which **derives** the name from `supabase/config.toml`
(overridable via `E2E_DB_CONTAINER`) instead of hardcoding it, and replacing all six copies with an
import. This kills the duplication and makes a future repo rename unable to reintroduce the break.

**Evidence:** `pnpm exec playwright test --project=chromium-authed` → **42 passed, exit 0** (was 33
passed / 9 failed). `pnpm typecheck` exit 0; `pnpm exec eslint e2e/` exit 0 (0 errors); prettier
clean on all seven touched files.

Files: `e2e/support/psql.ts` (new) · `e2e/board/{authoring-kudo-form,board-reads,hearts-security,hearts-toggle,kudo-message-rendering,secret-box-reveal}.spec.ts`.

Note: the `/profile/avatar-sample-1.png` image warning still logs during those runs — it is the
asset gap above, and Track A phase 03 closes it. It is a warning, not a failing assertion.

### A test that was only passing because of the bug it tested around (fixed, verified)

Placing the six `public/profile/icons/icon-{1..6}.png` assets (phase 03) broke
`e2e/board/secret-box-reveal.spec.ts:64` — and the break is _evidence the asset gap was real_.

`components/kudos-board/secret-box-reveal-panel.tsx` renders the drawn badge's **artwork**
(`secret-box-badge-image`) when its `image_url` resolves, and falls back to
`secret-box-badge-name` only when the image is absent or errors. `secret_box_icons.image_url`
points at `/profile/icons/icon-N.png`, and `public/profile/` did not exist — so every badge image
404'd and the panel _always_ degraded to the name. The spec asserted that fallback, i.e. it had
encoded the broken state as its expectation. Once the assets shipped, the healthy image path
rendered and the assertion failed.

Fixed by asserting `secret-box-badge-image` instead, which is the stronger check: it proves the
drawn row's artwork is actually reachable rather than silently degrading. Rationale is written into
the spec at that line.

**Two hypotheses were tested and rejected first, rather than assumed:** (1) a parallel-worker race
from phase 03's `psql` fixtures — ruled out, `playwright.config.ts` sets `workers: 1`; (2)
`user_icon_unlocks` accumulating across runs until a draw hit an already-owned icon — ruled out by
clearing the table and reproducing the failure at zero unlocks.

Also observed once and **not** reproducible: `e2e/board/authoring-addlink-box.spec.ts:24` failed a
single full-suite run with a server-side `getSpotlightBoard: count failed`, then passed in isolation
and on the next full run. Recorded as flaky, not fixed — no evidence of a real defect.

**Evidence:** full suite `pnpm test:e2e` → **76 passed, exit 0**.

### Orchestrator calls made on phase 04's escalations (both resolved)

Phase 04 correctly refused to edit files outside its ownership and escalated instead. Both calls
were mine to make:

1. **`FUN_007` recipient pre-fill — unblocked by adding the prop, not by forking.** Phase 04
   reported `KudosFormModal` has no `recipient` prop and left the pre-selection as `test.fixme`. It
   was right not to reach into `components/kudos/**`, but the prop is exactly what
   `TC_WEB_PROFILE_FUN_007`'s Note prescribes ("an optional prop defaulting to null, so the homepage
   and board compose flows are unchanged"), so it belongs in this batch. Added
   `KudosFormModalProps.recipient?: KudosRecipient | null` (default `null`) plus an
   `initialFormWithRecipient()` helper used by the initial state **and both reset paths**, so a
   reopened modal cannot lose the preselection. `KudosFormState.recipient` already existed, so this
   is purely additive — every existing call site behaves identically. The `fixme` is lifted and the
   test passes. Note: `kudos-form-modal.tsx` is **193 lines**, under the ceiling — the "263 lines"
   figure in the older retro plans is stale.
2. **Strict-mode collision from the write bar — fixed with `{ exact: true }`.** The write bar's copy
   ("Gửi lời cảm ơn và ghi nhận đến {name}") puts the viewed Sunner's name on the page a second
   time, so the non-exact `getByText(name)` in `e2e/profile-access.spec.ts` (`FUN_001`) and
   `e2e/profile-hero.spec.ts` (`GUI_009`) began resolving to two nodes. The hero's element is
   exactly the name, so `exact: true` disambiguates and is strictly more correct than the previous
   assertion. Two one-word changes, each with a comment saying why.

### A flake root-caused rather than retried away (fixed, verified)

A ~1-in-3 failure on the first run after `setup` showed a server error taking down the whole page
render: `getUnlockedIcons: JWT issued at future`.

**Diagnosis:** GoTrue stamps the access token's `iat` from its own clock at whole-second
granularity, and the token is validated against Postgres's clock. For a fraction of the first second
after sign-in, `iat` can read as _ahead_ of "now" and the first authenticated query fails. Evidence:
the failure only ever occurred on runs that re-minted storage state (14.5s runs), never on reruns
that reused an aged state (9.3s runs); host↔container clock skew measured **0s**, so this is
sub-second, not drift; and a decoded token 30s old showed `iat - now = -30s`, i.e. healthy once aged.

**Two other hypotheses were tested and rejected first:** the project's documented
`sun-kudos-intermittent-first-load-flake` (that one is an unexplained cold-start 500 with no error
string — this one names its cause), and `user_icon_unlocks` accumulating across runs (disproved by
clearing the table and still reproducing at zero unlocks).

**Fix:** `e2e/support/authenticate.setup.ts` now settles 1.5s after sign-in before writing the
storage state, so the token has aged past its own `iat` before any spec uses it. This is not a retry
masking an unknown — the window is bounded by the one-second `iat` granularity, so settling past it
removes the cause.

**Evidence:** 3/3 forced fresh-mint runs clean with zero `JWT issued at future` occurrences (was
~1-in-3); full suite from a cold mint → **83 passed, exit 0**.

### Orchestrator calls on phase 05's escalations (all resolved)

1. **`app/profile/actions/load-profile-feed-page.ts` — new file outside the assigned list: APPROVED.**
   A client component cannot import `lib/profile/feed-queries.ts` (it pulls in `next/headers`), so a
   Server Action wrapper is structurally required, not a convenience. It mirrors the existing
   `app/sun-kudos/actions/load-feed-page.ts` convention and touched nothing under `lib/**`. Correct
   call; the agent was right to flag rather than block.
2. **The 417-line spec — SPLIT.** The project rule is "hold each code file under 200 lines" and specs
   are code. Split by concern into `e2e/profile-kudos-direction.spec.ts` (163),
   `profile-kudos-feed.spec.ts` (128) and `profile-kudos-cards.spec.ts` (103), with shared fixtures
   and the feed-scrolling helpers extracted to `e2e/support/profile-feed-helpers.ts` (73) so the
   three share one definition each rather than copying them. Imports pruned per file; `testMatch`
   needed no change (all three still match `e2e/profile-*.spec.ts`).
3. **The recurring strict-mode breakage — fixed at the root with testids, not `.first()`.** Phase 05
   proposed appending `.first()`, which would make the assertions depend on DOM order. The real
   problem is that the viewed Sunner's name, Hero badge and star badge are **not unique on the page**:
   the write-Kudo bar names them, and `GUI_006` _requires_ every feed card to render the same shared
   `HeroBadge`/`StarTierBadge` in its person block. So `profile-hero.tsx` gained
   `data-testid="profile-name"` and `data-testid="profile-hero-tiers"`, and five assertions across
   `profile-hero.spec.ts` / `profile-access.spec.ts` were scoped to them. This also fixes the
   **negative** assertions in `GUI_009`, where an unscoped `toHaveCount(0)` would have counted feed
   cards' badges and passed or failed for the wrong reason.

### Defects the orchestrator introduced and fixed before delivery

Recorded because the gate must reflect what actually happened, not what was intended:

- `pnpm lint` exit 1 — my `await new Promise((resolve) => setTimeout(resolve, 1500))` in
  `authenticate.setup.ts` tripped `no-promise-executor-return` (the executor returns the timer id).
  Fixed with a block body. Phase 05 had reported this as "pre-existing in a file I don't own"; it was
  neither — it was mine, from earlier this session.
- `components/kudos/kudos-form-modal.tsx` went 193 → 210 lines, over the ceiling, from my `recipient`
  prop. Fixed properly rather than by deleting comments: `initialFormWithRecipient()` moved to
  `kudos-form-fields.tsx` beside `INITIAL_KUDOS_FORM` (its natural home — every "what does a blank
  draft look like" answer now lives in one file), the prop typed as `KudosFormState["recipient"]` so
  the `KudosRecipient` import could go, and my own verbose comments trimmed. Now **198**.

## Final verification (orchestrator-run, cold JWT mint)

| Gate                                                                                                  | Result                                                                    |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm test:e2e`                                                                                       | **96 passed, exit 0**                                                     |
| `pnpm lint`                                                                                           | exit 0 (0 errors; 220 pre-existing warnings repo-wide)                    |
| `pnpm typecheck`                                                                                      | exit 0                                                                    |
| `pnpm build`                                                                                          | exit 0                                                                    |
| `pnpm exec prettier --check` (all touched code files)                                                 | exit 0                                                                    |
| 200-line rule                                                                                         | every file this batch created/changed is under 200; the only two over are |
| `lib/supabase/database.types.ts` (generated) and `components/ui/dropdown-menu.tsx` (shadcn primitive) |
| DB residue                                                                                            | clean — 0 `e2e-fixture%` kudos rows, 0 sparse test profiles               |

## Follow-up: the route had no entry point (user-reported, fixed)

The user asked "how do I get to the profile screen" — and the honest answer was that they couldn't.
Two separate defects, both found by chasing that one question:

1. **The header's "Profile" item was a dead `<button>`** (`user-menu.tsx`) — no `onClick`, no
   `href`. `/profile` was reachable only by typing the URL. The cause was my own scope call: phase 06
   owns `user-menu.tsx` and I deferred it because the two dropdown _design_ screens weren't
   requested. Deferring the redesign was right; shipping a page with no way in was not, and I should
   have surfaced it rather than letting the user discover it. Fixed by making that item a
   `Link href="/profile"` that closes the menu on navigate. **"Admin Dashboard" is deliberately left
   inert** — it needs the server-resolved `profiles.role` gate and an `/admin` route, both phase 06;
   wiring it now would point at a 404 and imply a gate that doesn't exist.
2. **`proxy.ts`'s matcher broke ALL client hydration under `pnpm dev`.** It excluded only
   `_next/static` and `_next/image`, so Next's dev-only endpoints were inside the auth guard:
   `/_next/hmr` answered **307 → /login**, which fails the WebSocket handshake
   (`ERR_INVALID_HTTP_RESPONSE`) and takes HMR and the error overlay with it. The visible symptom is
   much worse than a missing refresh — the page renders but never hydrates, so **every** menu,
   dropdown and modal is inert in dev. Fixed by excluding all of `_next` and `__nextjs`. This
   widens access to nothing: no application route lives under `_next`, and App Router client
   navigations fetch their RSC payload from the route path itself (`/profile?_rsc=…`), still matched.

**Why the E2E suite never caught #2:** `playwright.config.ts`'s `webServer` runs
`pnpm build && pnpm start`, so the suite only ever exercises a **production** server, where those
dev endpoints don't exist. Worth knowing as a standing blind spot: _no_ dev-only regression can fail
this gate.

**A trap in the same config, worth recording:** `reuseExistingServer: !CI` means the suite silently
adopts whatever already listens on `:3000`. Mid-session that became the user's `next dev`, whose
chunks were 403-ing — so tests that had passed against a production server began failing for
environment reasons that looked like product bugs. Diagnosing this took three rejected hypotheses
(a `useClickOutside` race, the proxy matcher alone, and a UserMenu-specific fault — disproved when
the FAB, which passes in `rules-drawer.spec.ts`, also failed to open in the same run).

**Evidence:** RED — `pnpm exec playwright test … e2e/profile-access.spec.ts` exit **1**, 2 failed
(`waiting for getByRole('menuitem', { name: 'Profile' })`). GREEN — full suite `pnpm test:e2e`
**98 passed, exit 0** (was 96; the 2 new header-entry-point tests are the delta). `pnpm lint` 0 ·
`pnpm typecheck` 0 · prettier clean.

## Still open (not blocking this batch)

1. FAB G3 — how far should menu semantics go (`role="menu"` + roving focus)? Now that
   `components/ui/` exists, a primitive may supply it; hand-rolling twice is the risk.
2. Thể lệ G5 — the hand-rolled dialog has no focus trap/restore. `components/ui/dialog.tsx` would
   give all three, but reshaping the drawer is wider than a gap fix.
3. MoMorph housekeeping — all three frames report `dev_status: "none"` for shipped screens.
4. Profile plan Q7/Q8/Q9 stay open with `phase-06` deferred (header dropdowns out of scope).
   4b. **Storage-state naming disagreement — must be settled before `phase-06` is ever forged.**
   `phase-06-header-menus-admin-gate.md` (lines 44, 177–178) assumes `user.json` is the **ordinary**
   identity and `admin.json` the admin, so it can assert "no Dashboard item" against `user.json`.
   The landed reality is the **opposite**: `e2e/.auth/user.json` is the **admin/demo-user** state
   (many `e2e/board/**` specs hardcode `…0001`/admin assumptions against it) and the ordinary
   fixture is the separately-named `e2e/.auth/ordinary-user.json`. Renaming would break the passing
   board suite, so it was deliberately not renamed. Whoever forges phase 06 must either use
   `ordinary-user.json` or update that phase file first.
   4c. Two board specs (`e2e/board/hearts-security.spec.ts`, `e2e/board/secret-box-security.spec.ts`)
   hand-code `sender.one`'s email/password locally instead of importing `E2E_ORDINARY_IDENTITY`
   from `e2e/support/test-identities.ts`. Pre-existing; a cheap DRY cleanup for a later pass.
5. `kudos-form-modal.tsx` is 263 lines, over the 200-line ceiling — pre-existing, owned by
   `../260709-1540-kudos-write-form/`.
