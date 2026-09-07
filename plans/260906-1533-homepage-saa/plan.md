---
title: "SAA homepage — retrospective + gap list (code-derived only)"
description: "What /about actually ships today, derived purely from the code because no MoMorph screenId or design data exists for this screen."
status: pending
priority: P1
effort: 5h
branch: develop
tags: [retrospective, gap-analysis, homepage, auth, shadcn, momorph-absent]
created: 2026-09-06
work_type: retrospective
test_policy: visual-contract
spec_lang: en
screen: none-supplied
---

# SAA Homepage (`/about`) — Retrospective Plan

> **No design data exists for this screen.** No `screenId` was supplied and this folder's
> `data/` directory is empty — no frame JSON, no specs CSV, no test cases. Every statement below
> is derived from **reading the code only**. Nothing here is measured against a MoMorph spec,
> because there is none on disk to measure against. Where a design intent is guessed, it is
> marked _(inference)_. `test_policy` is therefore `visual-contract`, and **no RED/TDD claim is
> made or implied.**

## What was actually built

The site root is not the homepage. `app/page.tsx` (9 lines) does `redirect("/login")`; the
homepage lives at **`/about`** (`app/about/page.tsx`, 54 lines), which composes:

| Component                                                         | Lines        | What it does                                                                            |
| ----------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `homepage/site-header.tsx`                                        | 55           | Fixed 80px header: logo, `NavLinks`, `NotificationMenu`, `LanguageSelector`, `UserMenu` |
| `common/nav-links.tsx`                                            | 43           | 3 route links from `ROUTERS` (`constants/index.ts`), `aria-current="page"` on match     |
| `homepage/hero-section.tsx` + `hero-cta.tsx` + `hero-content.tsx` | 78 + 32 + 56 | Keyvisual, scrim, logo, CTAs → `/award-info` and `/sun-kudos`, theme copy               |
| `homepage/hero-info-block.tsx`                                    | **201**      | Event date/venue **and a second countdown** (`useSyncExternalStore`)                    |
| `homepage/award-section.tsx` + `award-card.tsx`                   | 124 + 89     | The 6 award cards in two rows                                                           |
| `homepage/sunkudos-section.tsx`                                   | 89           | Kudos promo band (also reused by `/award-info`)                                         |
| `homepage/widget-button.tsx`                                      | 167          | The floating action button — **only mounted here**                                      |
| `common/site-footer.tsx`                                          | 96           | Footer                                                                                  |

All copy runs through i18n. vi/en key counts match exactly across all 11 namespaces (32/32 for
`home`), so there is no missing-translation gap.

## Gap list

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Sev              | Fix direction                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | ~~**Sign out does not sign out.** `user-menu.tsx:73` calls `router.push("/login")` and never `supabase.auth.signOut()`. The session survives, so `proxy.ts:83-85` bounces the user straight back to `/about`. The menu item is a no-op loop~~ **CLOSED (Batch A):** `user-menu.tsx` now calls `supabase.auth.signOut()` correctly.                                                                                                                                | **P0**           | ✓ Fixed in Batch A session 2026-09-06                                                                                                                               |
| G2  | **A third event datetime.** `hero-info-block.tsx:11` hardcodes `2026-12-26T18:30:00+07:00`. `lib/countdown-config.ts` uses an env var or `now+8s`. `event_settings.launch_at` holds `2026-07-21`. Three sources, three different answers, one event                                                                                                                                                                                                               | P1               | [phase-02](./phase-02-hero-event-date-single-source.md) — consumes the countdown retro's phase 01                                                                   |
| G3  | `notification-menu.tsx` renders a permanently-lit red unread dot (`:45-48`) over a hardcoded empty panel, while a seeded `public.notifications` table exists. The badge is decoration that asserts something false                                                                                                                                                                                                                                                | P1               | [phase-03](./phase-03-header-menu-data-wiring.md)                                                                                                                   |
| G4  | `user-menu.tsx` "Profile" and "Admin Dashboard" are `<button>`s with no handler and no destination — dead controls                                                                                                                                                                                                                                                                                                                                                | P1               | [phase-03](./phase-03-header-menu-data-wiring.md)                                                                                                                   |
| G5  | `hero-info-block.tsx` is **201 lines** — over the project's 200-line ceiling. (Neighbours also over, owned elsewhere: `kudos-form-modal.tsx` 263, `feed-kudo-post-card.tsx` 212, `highlight-section.tsx` 212)                                                                                                                                                                                                                                                     | P2               | Extract the countdown store into `hooks/`; phase 02 touches this file anyway                                                                                        |
| G6  | **Standing divergence from `AGENTS.md`, recorded once here for the whole repo:** `components/ui/` and `lib/utils.ts` do not exist, yet `components.json` still aliases `@/components/ui` and `@/lib/utils`, and `@base-ui/react` + `class-variance-authority` are installed dependencies. Nothing imports `cn()`. Consequence: menus, dropdowns and dialogs are hand-rolled repo-wide — `user-menu`, `notification-menu`, `language-selector`, `saa-rules-drawer` | P2               | One decision, repo-wide: install the shadcn/Base UI primitives and migrate, or delete the dead aliases and drop the unused deps. Do **not** decide it per-component |
| G7  | An authenticated user hitting `/` double-redirects: `/` → `/login` → `/about`                                                                                                                                                                                                                                                                                                                                                                                     | P2               | Have `app/page.tsx` redirect to `/about` and let the guard handle the anonymous case                                                                                |
| G8  | `WidgetButton` mounts only on `/about`; `/award-info` and `/sun-kudos` have none. Whether the FAB is homepage-only or site-wide is undocumented                                                                                                                                                                                                                                                                                                                   | P2 _(inference)_ | Product question — see below                                                                                                                                        |

Verified **not** gaps: nav active state uses the correct `aria-current` token; every CTA target
route exists; the hero countdown is hydration-safe (`useSyncExternalStore` + stable server
snapshot); `NEXT_LOCALE` survives the proxy response rebuild.

## Phases

| #   | Phase                                                                          | Owns (files)                                                                    | Depends on                                                                                                          | Effort | Status  |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| 01  | [Real sign-out](./phase-01-real-sign-out.md)                                   | `components/homepage/user-menu.tsx`                                             | —                                                                                                                   | 1h     | pending |
| 02  | [Hero event date — single source](./phase-02-hero-event-date-single-source.md) | `components/homepage/hero-info-block.tsx`, `hooks/use-event-countdown.ts` (new) | countdown retro [phase-01](../260708-1519-countdown-prelaunch-page/phase-01-launch-datetime-from-event-settings.md) | 2h     | pending |
| 03  | [Header menu data wiring](./phase-03-header-menu-data-wiring.md)               | `components/common/notification-menu.tsx`, `components/homepage/user-menu.tsx`  | 01                                                                                                                  | 2h     | pending |

01 and 02 are file-disjoint and may run in parallel. **03 shares `user-menu.tsx` with 01** and
must wait for it. No phase touches `lib/supabase/proxy.ts` — that file belongs to the countdown
retro.

## Unresolved questions

1. **G8** — is the floating action button homepage-only by design, or missing from the other two
   pages?
2. **G4** — do `/profile` and an admin dashboard exist as planned routes, or should those two
   menu items simply be removed until they do? (`seed.sql` promotes the demo user to admin, which
   hints the admin entry is intended.)
3. **G6** — shadcn/ui adoption or removal of the dead configuration. This is a repo-wide call and
   is deliberately not made inside a single screen's retro.
4. Which event datetime is authoritative — `2026-12-26T18:30`, or `event_settings.launch_at`?
   G2 cannot be closed until someone says.
