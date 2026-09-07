# Clarifications — Batch B: Profile & Menus

Screens: 3FoIx6ALVb (Profile bản thân) · z4sCl3_Qtk (Dropdown-profile) · 54rekaCHG1 (Dropdown-profile
Admin) · WXK5AYB_rG (Dropdown Phòng ban, planned in `../260713-1552-dropdown-department/`).
fileKey `9ypp4enmFmdK3YAFJLIu6C`.

## Session 2026-09-07 — decisions (Batch B phases forged this session)

**Resolved** 2026-09-07. All decisions below were resolved this session and recorded in the
session plan's [`clarifications.md`](../260907-1402-three-screen-gap-closure/clarifications.md).
Rather than duplicate the rationale, each question is cross-referenced there. Phases 01–05, 07 are
**DONE**; phase 06 is **DEFERRED** (out of scope this session).

- **Q1/Q2:** `department_id` — **moot**, no `departments` table exists. The hero renders department
  from `hero_code`. See session plan
  [`Q1/Q2`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q3/Q3b:** Hero tier derivation — **resolved, derive at read time from distinct senders**. See
  session plan [`Q3/Q3b`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q4:** Badge slots light-up — **resolved, render data-driven from `user_icon_unlocks`**. See
  session plan [`Q4`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q5:** Secret Box counters — **resolved, render real counters; button disabled**. See session
  plan [`Q5`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q6:** Anonymity boundary — **resolved, definer view only; base-table hole remains separate item**.
  See session plan [`Q6`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q10:** shadcn restoration — **resolved, baseline IS restored** (`components/ui/dropdown-menu.tsx`
  exists). See session plan [`Q10`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q11:** Repeated `?id=` — **resolved, 404 as test case states**. See session plan
  [`Q11`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).
- **Q12:** Ordinary-user fixture — **resolved, password added to `sender.one@sun-asterisk.com`**.
  See session plan [`Q12`](../260907-1402-three-screen-gap-closure/clarifications.md#profilebanlhn-3froix6alvb).

## Session 2026-09-06 — deferred questions (Q7/Q8/Q9)

Phase 06 is **out of scope this session** and remains to be forged. These three questions stay open:

- Q7: Admin Dashboard route — not forged; **deferred**.
- Q8: Admin/user menu split — not forged; **deferred**.
- Q9: Admin gate test policy — not forged; **deferred**.

See session plan [`Scope`](../260907-1402-three-screen-gap-closure/clarifications.md#scope).

## Verified against the live system (no ask needed)

- `/profile` is protected **for free**: `proxy.ts`'s matcher catches every non-asset path and
  `isPublicPath()` allows only `/login` and `/auth/*`. TC_ACC_001 needs no new route-list entry —
  only the defense-in-depth page-level `getUser()` its Note asks for.
- `searchParams` is a `Promise` in this codebase — confirmed at `app/login/page.tsx:25-29`, not
  assumed from training data.
- `secret_box_icons` already holds exactly **6** rows (`/profile/icons/icon-{1..6}.png`), matching
  the design's 6 badge slots B2–B7. No new master data is needed for the collection.
- `public/profile/` **does not exist** — `seed.sql` references `/profile/avatar-sample-1.png` and
  `secret_box_icons.image_url` references `/profile/icons/icon-N.png`, and none of those files are
  in the tree. An asset gap, not a schema gap; phase 03 owns it.
- The postgres-owned default ACL on schema `public` grants all seven privilege types to **both**
  `anon` and `authenticated` on every table (confirmed with `\ddp` and against `profiles`). Any
  table or view Batch B adds must assert its own `REVOKE`/`GRANT` explicitly.
- `components/homepage/site-header.tsx` is marked `"use client"` but holds **no state, effect or
  handler** — only `next/font`, `Link` and `Image`. It can become a server component that renders
  its existing client children, which is what makes a server-resolved role reachable without
  prop-drilling from five pages.
- `feed-kudo-post-card.tsx` (212), `highlight-section.tsx` (212) and `kudos-form-modal.tsx` (263)
  already exceed the 200-line guidance. Pre-existing; Batch B neither inherits nor worsens it.
