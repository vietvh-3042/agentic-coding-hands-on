# Clarifications — Batch A: Kudos data layer

Screens: MaZUn5xHXZ (Live board) · JWpsISMAaM (Hashtag filter) · p9zO-c4a4x (Hashtag list) ·
ihQ26W78P2 (Viết Kudo) · OyDLDuSGEa (Addlink Box) · J3-4YFIpMM (Open secret box)
fileKey 9ypp4enmFmdK3YAFJLIu6C

## Session 2026-09-06 — scope

- Q: 15 screens requested, but ~12 already have UI built against mock data. What is the real goal?
  → A: **Wire the existing UI to Supabase and build the 3 genuinely missing screens.** Do NOT rebuild
  screens that already match Figma. The value is replacing the 4 mock-data files with real queries.
- Q: Sequencing? → A: **Batch by domain, one batch per run.** This is Batch A (kudos data layer).
- Q: Git state (230 uncommitted files)? → A: user handles git themselves. Proceeding on the existing tree.

## Session 2026-09-06 — security (BLOCKING, proven against the live DB)

- Q: Any authenticated user can run `profiles.update({role:'admin'})` — proven with `UPDATE 1` in a
  rolled-back transaction. When is it fixed? → A: **Now, as Batch A phase 0.** Nothing else ships on
  top of a known privilege-escalation hole, and Batch B's admin menu needs a real gate.
- Q: Which hardening shape? → A: **Column-level GRANTs** — `REVOKE UPDATE ON profiles FROM
authenticated, anon;` then `GRANT UPDATE (display_name, avatar_url, language) ON profiles TO
authenticated;`. Most precise tool for the problem. NOTE: the pre-existing postgres-owned default
  ACL on schema `public` grants ALL to anon+authenticated on every table, so this must be asserted
  explicitly and re-checked for any future table — GRANTs are not inherited safely here.
- Corrected assumption: kudo INSERT and kudo_hearts INSERT/DELETE policies ALREADY EXIST and work
  (incl. an `auth.uid() <> kudos.sender_id` guard blocking self-hearting). Only `user_icon_unlocks`
  is genuinely write-blocked (SELECT policy only) — that blocks the secret-box reveal.

## Session 2026-09-06 — data model

- Q: `kudos.hashtags` is a free-text blob (`"#Dedicated #Inspring"`) but the filter UI needs
  structured ids. → A: **Add a `kudo_hashtags(kudo_id, hashtag_id)` join table** plus a `hashtags`
  master table. Requires a migration and a backfill of existing seed rows.

## Derived from the MoMorph specs (no ask needed)

- Highlight section = top 5 by hearts, event-wide. Feed = infinite scroll. Leaderboards = 10 rows.
  Spotlight = unbounded node set + `COUNT(*)`.
- A hashtag click (from a chip on either card type, or either dropdown) must re-filter **Highlight
  AND All Kudos together** and reset the carousel to page 1. Today `feed-list.tsx` owns
  `selectedHashtag` locally and filters only the feed — this state must be lifted to the page.
- Hashtag dropdown interaction models differ legitimately: board filter = single-select + close;
  write form = multi-select, max 5, check icons, disable-at-5.
- `constants/index.ts` hardcodes `SAA_HASHTAGS` (8) and `DEPARTMENTS` (4 CEVC rows); both specs say
  these are DB queries.
- `sidebar-gift-dialog.tsx` implements the REVEAL modal ('MỞ SECRET BOX THÀNH CÔNG'), not the
  unopened state. The full flow needs a 6-way weighted draw (Stay Gold 30 / Flow to Horizon 25 /
  Touch of Light 20 / Beyond the Boundary 10 / Revival 10 / Root Further 5), a count decrement and a
  badge refresh. Two security test cases forbid client-side manipulation of badge and counter →
  **the draw must be server-side** (and `user_icon_unlocks` needs a write path).
- Heart is local `useState` today. Spec requires: sender's own kudos disables the button; one like
  per user per kudos; a like credits the SENDER +1 heart (+2 on an admin-configured special day);
  unlike revokes whichever amount was granted. `kudo_hearts.hearts_value CHECK IN (1,2)` already
  models the multiplier and the sync trigger respects it.
- Addlink Box (OyDLDuSGEa) is CONFIRMED MISSING. `kudos-content-editor.tsx` renders a link toolbar
  button with no handler; its own comment says the toolbar is presentational/no-op.
- Screens JWpsISMAaM and p9zO-c4a4x have ZERO test cases in MoMorph (`status: empty`, not an error).
  No fabricated test-case files were created.

## Unresolved — BLOCKING the hashtag table seed

- The two hashtag dropdowns disagree on the master list, with **zero overlap**:
  JWpsISMAaM lists 13 in Vietnamese (Toàn diện, Giỏi chuyên môn, Hiệu suất cao, Truyền cảm hứng,
  Cống hiến, Aim High, Be Agile, Wasshoi, Hướng mục tiêu, Hướng khách hàng, Chuẩn quy trình,
  Giải pháp sáng tạo, Quản lý xuất sắc); p9zO-c4a4x lists 8 in English (#High-perorming [sic],
  #BE PROFESSIONAL, #BE OPTIMISTIC, #Be A Team, #THINK OUTSIDE THE BOX, #GET RISKY, #GO FAST,
  #WASSHOI). Needs a designer/BA decision.
- Feed sort order is **never stated in any spec**.
- Message body has no length limit despite a spec field named "Gợi ý và bộ đếm ký tự" (character counter).

## Session 2026-09-06 — gap resolution (all previously BLOCKING items closed)

- Q: Which hashtag list seeds the table (13 VI vs 8 EN, zero overlap)? → A: **The 13 Vietnamese list.**
  Both dropdowns read the same 13 rows. The write form's 8-item English list is superseded, so its
  `#High-perorming` typo is moot — do not carry it forward. `constants/index.ts SAA_HASHTAGS` becomes
  a DB query and its hardcoded 8 entries are retired.
- Q: Feed sort order (never stated in any spec)? → A: **Newest first — `created_at DESC`.** Already
  backed by `kudos_receiver_id_created_at_idx`. `is_spam` stays unused for ordering this pass.
- Q: Message body length limit (spec has a character-counter field but no maximum)? → A: **500
  characters.** Enforced by the form counter AND re-validated server-side in the Server Action —
  the client counter is UX, not a control.

## Session 2026-09-06 — Rest Point 1.5a (feature decomposition)

- Q: Approve the 5-feature decomposition (F002 board data, F003 authoring, F004 hearts, F005 hashtag
  taxonomy, F006 secret box) plus phase-0 security hardening? → A: **Approved as presented.**
- Q: The heart multiplier doubles on an "admin-configured special day" but no column stores that.
  Where does it live? → A: **Add special-day columns to `event_settings`** — it is already the
  singleton config table (holds `launch_at`) and its RLS is read-only for users, so the multiplier
  cannot be tampered with client-side. F004 reads it server-side when granting hearts.

## Session 2026-09-06 (run 2) — scope of this run

- Q: 15 screens in one run? → A: **Plans for every folder + forge Batch A only.** Forging all 15
  in one continuous run was rejected as unrealistic at quality. Batch A (F002–F006 + phase-0
  security + seed) is the only forge scope this run; every other folder receives a blueprint.
- Q: What goes in the folders of screens ALREADY implemented (countdown, award system, i18n
  dropdown, rules drawer, widget button, homepage)? → A: **Retrospective plan + gap list.** Describe
  what was actually built and enumerate the remaining gaps (e.g. countdown reads a hardcoded config
  instead of `event_settings`). Not a fictional forward plan.
- Q: Seed-data depth for local Supabase? → A: **Enough to exercise every UI path** — ~15 profiles,
  ~40 kudos, hearts, the 13 hashtags + join rows, notifications, secret-box unlocks. Sized so
  infinite scroll, top-5 highlight, the 10-row leaderboard and the spotlight cloud all render real.
- Q: The 3 screens with no plan folder (Dropdown-profile z4sCl3_Qtk, Dropdown-profile Admin
  54rekaCHG1, Profile bản thân 3FoIx6ALVb)? → A: **Create one new folder** for them, planned as
  Batch B (blueprint only this run).

## Session 2026-09-06 (run 2) — CORRECTION to an earlier entry

- **Earlier claim, now proven FALSE:** the line above stating "`sidebar-gift-dialog.tsx` implements the
  REVEAL modal ('MỞ SECRET BOX THÀNH CÔNG'), not the unopened state." The states are **inverted**.
  Verified in code: `sidebar-gift-dialog.tsx:104` renders `url(/kudos/secret-box/box-closed.svg)` —
  it is the UNOPENED shell. The **success/reveal modal is the half that is missing**, and that is
  what screen J3-4YFIpMM specifies. F006's build target changes accordingly; the plan's phase 09
  builds the reveal, not the unopened state.
- **Badge artwork is absent.** `secret_box_icons` holds six placeholder rows named "Icon 1".."Icon 6"
  pointing at `/profile/icons/icon-N.png`; `public/profile/` does not exist. The six real names
  (Stay Gold / Flow to Horizon / Touch of Light / Beyond the Boundary / Revival / Root Further) are
  NOT in the table. Until artwork and names are supplied, F006 renders a name-text fallback.
- **`hearts_value` was forgeable.** The existing RLS permits a client to insert `hearts_value=2` on
  any day. Moved to a BEFORE INSERT trigger that reads `event_settings` server-side — the multiplier
  is no longer client-supplied.
- **`/sun-kudos` is route-gated** by `proxy.ts`, contradicting F002 FR-101/FR-601 ("no login
  required"). Kept guarded: `e2e/auth-guard.spec.ts` asserts the redirect. Recorded as a deliberate
  deviation from the spec, not an oversight.

## Session 2026-09-06 (run 2) — Rest Point 2 decisions

- Q: Batch A's E2E needs a seeded DB and a real GoTrue session, which breaks the standing
  "Docker-free E2E" convention. → A: **Accept the amendment; isolate it in its own Playwright
  project.** Board specs run in a project that requires Supabase local; the existing suite
  (`auth-guard`, `login-*`) stays Docker-free. The RED gate stays real — heart, filter and the two
  secret-box security cases are all provable.
- Q: The six secret-box badges have no artwork (`secret_box_icons` holds placeholder rows "Icon 1".."Icon 6"
  pointing at a non-existent `/profile/icons/`). → A: **Seed the six real names and weights, render a
  text fallback.** Stay Gold 30 / Flow to Horizon 25 / Touch of Light 20 / Beyond the Boundary 10 /
  Revival 10 / Root Further 5. The server-side draw is correct and testable now; dropping artwork in
  later changes no code.
- Q: Drop the legacy free-text `kudos.hashtags` column once `kudo_hashtags` exists? → A: **Keep it
  this batch.** Backfill into the join table, do not drop. Cleanup happens in a later batch once
  nothing reads it.

## Session 2026-09-06 (run 2) — recorded gap: category-text filtering (D.4)

- MoMorph spec row **D.4** of MaZUn5xHXZ shows the feed card's category chip (free-text
  `hashtag_title` label + pen icon) as ONE clickable element, with the function "Click: filter the
  list to show only Kudos belonging to '<category>'".
- This is a **second, separate filter axis** from the structured per-hashtag chips (C.3.7) that drive
  the lifted `?tag=` filter built in phase 06. It filters on the free-text category label, not on the
  `hashtags` taxonomy.
- **NOT implemented this batch.** It appears in no functional requirement (FN-1..FN-6), is backed by
  none of the 10 test-case IDs phase 06 scoped for RED-first coverage, and is absent from every
  clarification. Building it would have been undiscussed scope creep with no test to prove it.
- Phase 06 keeps the element **visually** (category text + pen icon, per the design) but renders it as
  a non-interactive `<span>` — no `role="button"`, not focusable, not in the tab order — rather than a
  `<button>` that silently no-ops and traps keyboard users.
- The pre-existing pencil→`KudosFormModal` "edit" wiring was removed outright: there is **no UPDATE
  policy on `kudos`**, so a pre-filled edit submit would have created a NEW row. It was mock-only by
  construction and could never have worked against the real schema.
- **Open question for the product owner:** should category-text filtering exist at all, given the
  taxonomy filter already covers hashtag filtering? If yes it needs its own requirement and test cases.

## Session 2026-09-06 (run 2) — RECORDED POLICY DEVIATION: phase 06 was not test-first

- Batch A's declared test policy is `e2e-red-first`. **Phase 06 (F002 board reads) did NOT follow it.**
  The implementer built first and tested after, and disclosed this rather than fabricating a RED.
- Its stated reason: the phase required deep discovery of an unfamiliar schema (real column shapes,
  FK embed rules, seed content) before any test could be written that meant anything.
- **Accepted, with the deviation recorded rather than waved through.** Do not describe phase 06 as
  RED-first anywhere. What exists is a real e2e suite that demonstrably CAN fail: it caught two
  genuine defects, one of them serious —
  - `highlight-filter-dropdown` locators collided with page-wide hashtag chips (test-only), and
  - a real **infinite-scroll duplication bug**: the `IntersectionObserver` was recreated on every
    `cursor` change and re-fired immediately against a still-visible sentinel, double-appending a
    page (`Set size 20 ≠ array length 30`). Fixed with a single mount-time observer plus an
    `isFetchingRef` guard.
- Every other phase in Batch A (01, 03, 07, 08, 09) is genuinely RED-first with captured failures.
- **Reviewer must weigh this explicitly.** The value of RED-first is proof that a test can fail;
  here that proof is indirect (real bugs found) rather than sequential (failure captured first).
- Also recorded from phase 06: two transient e2e failures (`getSpotlightBoard count failed`,
  `JWT issued at future`) appeared ONLY under cold-start 8-way parallel load against local Supabase
  and did not reproduce across 3 warm reruns. Logged as environment flakiness, NOT proven a code
  defect — phase 10 should watch for recurrence rather than assume it is settled.
