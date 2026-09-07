---
title: "Award system page — retrospective + gap list"
description: "What /award-info actually ships today measured against MoMorph screen zFYDgyj_pD (23 spec rows, 15 test cases), and the gaps that remain."
status: pending
priority: P2
effort: 5h
branch: develop
tags: [retrospective, gap-analysis, awards, e2e, i18n, momorph]
created: 2026-09-06
work_type: retrospective
test_policy: e2e-red-first
spec_lang: en
screen: zFYDgyj_pD
fileKey: 9ypp4enmFmdK3YAFJLIu6C
---

# Hệ thống giải (`/award-info`) — Retrospective Plan

**This screen is already built.** MoMorph ref:
<https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD> ·
design data on disk: [`data/zFYDgyj_pD-specs.csv`](./data/zFYDgyj_pD-specs.csv) (23 rows),
[`data/zFYDgyj_pD-testcases.csv`](./data/zFYDgyj_pD-testcases.csv) (15 cases).

## What was actually built

`app/award-info/page.tsx` (51 lines) composes `SiteHeader` → `KeyvisualBanner` →
(`CategoryNav` + `AwardDetailSection`) → `SunkudosSection` → `SiteFooter`.

| Spec row     | Built as                                                                                                                                                             | Verdict                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 3 Keyvisual  | `components/awards/keyvisual-banner.tsx`, `role="img"` + the spec's exact alt string                                                                                 | matches                     |
| A Title      | same file — eyebrow + gold `<h1>`, i18n `awards:keyvisual.*`                                                                                                         | matches                     |
| C, C.1–C.6   | `components/awards/category-nav.tsx` — 6 items, sticky, gold + underline active, smooth scroll, IntersectionObserver scrollspy                                       | matches                     |
| B, D.1–D.6   | `components/awards/award-detail-section.tsx` + `award-detail-card.tsx` — 6 zigzag cards, 336px image (`w-84`), quantity + prize rows, "Hoặc" separator for Signature | matches, 1 copy defect (G1) |
| D1, D2, D2.1 | `components/homepage/sunkudos-section.tsx` — reused from the homepage, `Link href="/sun-kudos"`                                                                      | matches                     |

Award values (quantities, prize amounts, image refs) are hardcoded in `AWARDS` in
`award-detail-section.tsx`. Every `databaseTable` / `databaseColumn` cell in the spec CSV is
**empty**, so hardcoding is spec-conformant here — not a gap.

## Gap list

| #   | Gap                                                                                                                                                     | Sev | Fix direction                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------------------- |
| G1  | `awards:items.top-talent.quantityUnit` is `"Cá nhân"`; spec D.1 and TC ID-6 both say **"Đơn vị"**                                                       | P1  | Correct the VI string in `lib/i18n/locales/vi/awards.json`     |
| G2  | Zero e2e coverage for a screen with 15 MoMorph test cases; ID-9/ID-11 (active state) and ID-12 (Chi tiết → `/sun-kudos`) are behavioral and automatable | P1  | [phase-02](./phase-02-award-screen-e2e-red-gate.md)            |
| G3  | Prize amounts render `"7.000.000 VND"`; spec + TCs write `"VNĐ"`                                                                                        | P2  | One-character fix per `amount` in `AWARDS`                     |
| G4  | TC ID-0/ID-2 name the route `/he-thong-giai`; the app serves `/award-info`                                                                              | P2  | **Unresolved** — see below. Do not rename on our own authority |
| G5  | `CategoryNav` anchors set `aria-current="true"`; `nav-links.tsx` correctly uses `"page"`                                                                | P2  | Change to `"page"` in `category-nav.tsx:79`                    |
| G6  | The page docblock claims a "widget button already used on the homepage"; the JSX renders none                                                           | P2  | Delete the clause — `WidgetButton` is `/about`-only (verified) |

Verified **not** gaps: ID-13 (invalid section id) — `getElementById(id)?.scrollIntoView` is
optional-chained, no throw. ID-1 (unauthenticated redirect) — `lib/supabase/proxy.ts` guards
`/award-info` and `e2e/auth-guard.spec.ts` already asserts it. ID-7 (336×336 image) — `w-84`
resolves to 336px.

## Phases

| #   | Phase                                                                                                          | Owns (files)                                                                                                                   | Depends on | Effort | Status  |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------ | ------- |
| 01  | [Authenticated storage-state fixture (shared prerequisite)](./phase-01-authenticated-storage-state-fixture.md) | `e2e/auth.setup.ts`, `playwright.config.ts`, `.gitignore`                                                                      | —          | 1.5h   | pending |
| 02  | [Award screen e2e RED gate](./phase-02-award-screen-e2e-red-gate.md)                                           | `e2e/award-system.spec.ts`                                                                                                     | 01         | 2h     | pending |
| 03  | [Copy + a11y corrections (G1, G3, G5, G6)](./phase-03-award-copy-and-a11y-corrections.md)                      | `lib/i18n/locales/{vi,en}/awards.json`, `components/awards/{award-detail-section,category-nav}.tsx`, `app/award-info/page.tsx` | 02         | 0.75h  | pending |

**Phase 01 is a prerequisite for three plan folders**, not just this one — the countdown and
rules-drawer retros both reference it rather than restating it. Build it once, here.

## Unresolved questions

1. **G4** — is `/he-thong-giai` the contractual URL, or was it illustrative when the test cases
   were authored? Renaming touches `constants/index.ts` `ROUTERS`, `proxy.ts` and `hero-cta.tsx`.
   Needs a product answer before any phase moves.
2. **G3** — "VNĐ" vs "VND": is the diacritic form mandated copy, or house style?
