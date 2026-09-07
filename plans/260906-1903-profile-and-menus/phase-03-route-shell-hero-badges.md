# Phase 03 — Route shell, keyvisual hero, badge collection

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q1, Q2, Q3, Q4, Q10, Q11)
- Specs: [`data/3FoIx6ALVb-specs.csv`](./data/3FoIx6ALVb-specs.csv) rows
  `mms_3_Keyvisual`, `mms_A_Info`, `mms_A.1_Avatar`, `mms_A.2_Name`, `mms_A.3_Huy Hiệu`,
  `mms_B2..B7_Huy hiệu`, `mms_B2.1_Ảnh Huy hiệu`
- Test cases: `ACC_001`, `ACC_002`, `FUN_001..005`, `GUI_001`, `GUI_002`, `GUI_003`, `GUI_008`, `GUI_009`
- Data layer: [`phase-02`](./phase-02-profile-read-layer.md) · fixtures: [`phase-01`](./phase-01-e2e-identity-fixtures.md)
- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 4h · **Depends on:** 01, 02
**test_policy:** **`e2e-red-first`**
**redTestFiles:** `e2e/profile-access.spec.ts`, `e2e/profile-hero.spec.ts`
**redCommand:** `pnpm test:e2e --project=profile --grep "profile-access|profile-hero"`
A valid RED here is a real non-zero exit caused by the route or the hero assertion. A failure from a
missing dependency, a config error, a browser install, or a dev-server boot does **not** count and
must be fixed before RED is recorded.

The route itself and everything above the fold: `/profile` exists, resolves its target, 404s
correctly, and renders the keyvisual hero and the six-slot badge collection.

## Key Insights

- **`/profile` is already protected — do not add a route list.** `proxy.ts`'s matcher catches every
  non-asset path and `isPublicPath()` allows only `/login` and `/auth/*`. `ACC_001` therefore passes
  the moment the route exists. Its Note asks for defense in depth, so the page **also** calls
  `getUser()` itself; that is a second check, not the first one.
- **The test cases name a repo that does not exist.** They say "absent from `PUBLIC_ROUTES` in
  `proxy.ts`" (the predicate is `isPublicPath()` in `lib/supabase/proxy.ts`), and they cite
  `app/kudos/use-board-interactions.ts -> openProfile` as the source of the `?id=` link — that file
  is absent and the board route is `/sun-kudos`. Implement against the **real** names; treat the
  linking side as Batch A's to wire.
- **`searchParams` is a `Promise`** — confirmed in this repo at `app/login/page.tsx:25-29`, not
  assumed. `notFound()` comes from `next/navigation`. Verify both against
  `node_modules/next/dist/docs/` before writing; this is Next.js 16 and the bundled docs are
  authoritative over recollection.
- **`GUI_002` says the badge artwork is _desaturated real artwork_, not blank placeholders.** The six
  `secret_box_icons` rows already exist and point at `/profile/icons/icon-{1..6}.png`. Grey them with
  a CSS filter over the real image so the slot lights up later by dropping the filter.
- **`public/profile/` does not exist.** `seed.sql` references `/profile/avatar-sample-1.png` and the
  icon paths above, and none of those files are in the tree. This phase owns closing that gap; an
  `<Image>` pointing at a missing file is a broken render, not a missing feature.
- **`GUI_003` is a two-key case, not a conditional string.** First-person heading on your own
  profile, neutral on someone else's — two distinct i18n keys in both bundles, asserted distinct.
- **`GUI_009` distinguishes "no badge" from "the lowest badge".** Zero Kudos means the tier badge and
  the stars are **absent**, not rendered at their weakest. That is a rendering branch, not a value.

## Requirements

**Functional**

- FR-B301 — `/profile` renders for a signed-in caller; signed out redirects to `/login` with no
  profile content emitted at any point (`ACC_001`, `ACC_002`).
- FR-B302 — `?id={other}` renders that Sunner (`FUN_001`); `?id={self}` canonicalizes to the self
  view (`FUN_002`); unknown uuid, malformed id and repeated key all 404 (`FUN_003..005`); empty
  value is the self view (`FUN_005`).
- FR-B303 — the hero shows the keyvisual banner (artwork only — **no** duplicated nav bar, no ghost
  avatar or name behind the live ones), then avatar, gold name, department, tier badge and hoa-thi
  stars on one row (`GUI_001`).
- FR-B304 — exactly six badge circles in the design's fixed order, each real artwork desaturated;
  none hidden, none unlocked (`GUI_002`).
- FR-B305 — badge heading is first-person on self, neutral on another profile (`GUI_003`).
- FR-B306 — a sparse profile (null avatar, null department, zero Kudos) renders with a placeholder
  avatar, no department line, no tier badge and no stars (`GUI_009`).
- FR-B307 — every string translated in `vi` and `en`, key-set parity asserted (`GUI_008`).

**Non-functional**

- The page is a **server component**. Only genuinely interactive leaves carry `"use client"`; the
  hero and the badge row carry none.
- Every component file under 200 lines; the page is a composition root, not a container of markup.
- New i18n namespace `profile`, registered in `lib/i18n/settings.ts` and `lib/i18n/i18n.ts`
  alongside the existing eleven.

## Architecture

```text
app/profile/page.tsx                      server component, ~70 lines
  ├─ const supabase = await createClient(); const { data:{ user } } = await supabase.auth.getUser()
  ├─ if (!user) redirect("/login")                       ← defense in depth (ACC_001 Note)
  ├─ const target = resolveProfileId(await searchParams, user.id)
  ├─ if (target.kind === "notFound") notFound()
  ├─ const header = await getProfileHeader(target.id); if (!header) notFound()
  ├─ <SiteHeader />                                      ← existing chrome, unchanged
  ├─ <ProfileHero {...header} />                         server
  ├─ <ProfileBadgeCollection icons={…} isSelf={…} />     server
  ├─ [phase 04 slot]  stats card | write bar
  ├─ [phase 05 slot]  KUDOS section
  └─ <SiteFooter />
```

**Data flow**

| In                                       | Transform                                    | Out                                                 |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| session cookie                           | `getUser()`                                  | `user` or redirect                                  |
| `await searchParams`                     | `resolveProfileId` (phase 02)                | self \| other \| notFound                           |
| target id                                | `getProfileHeader`                           | avatar, name, department label, tier, totalReceived |
| `totalReceived`                          | 10/20/50 thresholds                          | 0–3 hoa-thi stars                                   |
| distinct senders                         | tier thresholds ([Q3b](./clarifications.md)) | tier \| **none** when zero Kudos                    |
| `secret_box_icons` × `user_icon_unlocks` | 6 slots, unlocked flag                       | badge row                                           |

**Visual values.** The three dropdown screens carry pixel sizes in their spec text; `3FoIx6ALVb`'s
28 spec rows are almost entirely `spec_progress: draft` with **empty** description fields, and the
`*-frame.json` files hold metadata only — no geometry, no colours. **Do not invent any visual
value.** Pull the frame through the MoMorph MCP at implementation time for every measurement, and
reuse existing tokens where the design reuses them: `HeroBadge` (`components/common/hero-badge.tsx`,
109×19 pill, `#FFEA9E` 0.5px border) and the `#00101A` / `#998C5F` / `#FFEA9E` palette the board
already uses.

## Related Code Files

**Create**

- `app/profile/page.tsx` (~70) · `components/profile/profile-hero.tsx` (~90) ·
  `components/profile/profile-badge-collection.tsx` (~70)
- `lib/i18n/locales/vi/profile.json`, `lib/i18n/locales/en/profile.json`
- `e2e/profile-access.spec.ts` (`ACC_001/002`, `FUN_001..005`), `e2e/profile-hero.spec.ts`
  (`GUI_001/002/003/009`)
- `public/profile/` assets — avatar placeholder, `avatar-sample-*.png`, `icons/icon-{1..6}.png`,
  keyvisual banner

**Modify**

- `lib/i18n/settings.ts` — add `"profile"` to `namespaces`
- `lib/i18n/i18n.ts` — import and register both `profile.json` bundles

**Read for context (do not modify)**

- `components/common/hero-badge.tsx` — **reuse**, do not re-implement the tier pill
- `components/awards/keyvisual-banner.tsx`, `components/kudos-board/kv-banner.tsx` — the existing
  banner renderings; reuse whichever matches the design rather than adding a third
- `components/homepage/site-header.tsx`, `components/common/site-footer.tsx` — chrome
- `app/sun-kudos/page.tsx` — the page-shell pattern (Montserrat variable, `#00101A` background)

## Implementation Steps

1. **RED first.** Write both specs against the `profile` project from phase 01 and run
   `redCommand`. `/profile` does not exist, so `ACC_002` fails on a 404 — a real assertion failure.
   Record `redExitCode` and the failure text.
2. Register the `profile` namespace; author both bundles with the two heading variants (`GUI_003`)
   and the sparse-profile copy. Add the key-parity assertion (`GUI_008`).
3. Add the assets. Verify every `image_url` in `secret_box_icons` and every `avatar_url` in
   `seed.sql` resolves to a real file — `psql` the values, then `ls` them.
4. `app/profile/page.tsx` as drawn. `getUser()` before anything else; `notFound()` before any render.
5. `profile-hero.tsx` — reuse `HeroBadge`. Branch on "no tier / no stars" for zero Kudos
   (`GUI_009`), and on absent department. Banner is artwork only (`GUI_001`).
6. `profile-badge-collection.tsx` — six slots from `secret_box_icons` ordered by `sort_order`,
   greyed via CSS filter; heading key chosen by `isSelf`.
7. Re-run `redCommand` → GREEN. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm build`.

## Todo List

- [ ] RED recorded before any product code; failure is assertion-caused
- [ ] `profile` namespace registered in both i18n files
- [ ] `vi` / `en` key sets identical; parity asserted
- [ ] `public/profile/**` assets present; every seeded path resolves
- [ ] Page is a server component; `getUser()` runs before any data read
- [ ] `notFound()` for unknown, malformed, and repeated `?id`
- [ ] `?id={self}` renders the self view
- [ ] Six badge slots, real artwork desaturated, fixed order
- [ ] Two badge headings, distinct in both locales
- [ ] Sparse profile: placeholder avatar, no department line, no tier, no stars
- [ ] `HeroBadge` reused, not re-implemented
- [ ] No invented visual values; every measurement traced to MoMorph
- [ ] Every new file < 200 lines
- [ ] `pnpm validate` exits 0

## Success Criteria

| ID      | Criterion                | Method                                                                                |
| ------- | ------------------------ | ------------------------------------------------------------------------------------- |
| SC-B301 | `ACC_001`                | signed-out context → `/profile` lands on `/login`; page HTML contains no display name |
| SC-B302 | `ACC_002`, `FUN_001/002` | `profile` project, 3 navigations, hero content asserted                               |
| SC-B303 | `FUN_003/004/005`        | 7 bad ids → 404 page; **zero** 500s in the server log                                 |
| SC-B304 | `GUI_002`                | `page.getByTestId("badge-slot")` → exactly 6, all in the locked style                 |
| SC-B305 | `GUI_003`                | headings differ between `/profile` and `/profile?id={other}`                          |
| SC-B306 | `GUI_009`                | sparse fixture → no department line, no tier pill, no star row                        |
| SC-B307 | `GUI_008`                | key-parity assertion green in both bundles                                            |
| GREEN   | `redCommand`             | exit 0 after implementation; same command as RED                                      |
| Build   | `pnpm validate`          | exit 0                                                                                |

## Risk Assessment

| Risk                                                                                    | Likelihood                       | Impact | Countermeasure                                                                                                   |
| --------------------------------------------------------------------------------------- | -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Visual values invented because the specs are `draft` and the frames carry no geometry   | **High**                         | High   | Named as a hard rule above and as a todo item; MCP fetch is mandatory per measurement                            |
| Malformed `?id` reaches Postgres → `22P02` surfaces as a 500                            | Medium                           | High   | Shape gate lives in phase 02 and is asserted by SC-B303 against the server log, not just the status code         |
| `?id={self}` renders the "other" face — a stranger's version of your own page           | Medium                           | Medium | `FUN_002` is explicit; canonicalization happens in `resolveProfileId`, one place                                 |
| Keyvisual banner ships with the duplicated nav bar / ghost avatar baked into the export | Medium                           | Medium | `GUI_001` calls it out verbatim; SC-B302 asserts a single avatar and a single name node                          |
| Missing `public/profile/**` assets → broken images pass the DOM assertions              | **High** (they are absent today) | Medium | Step 3 resolves every seeded path with `ls`; it is a todo item                                                   |
| Adding `"use client"` to the page to reach `useTranslation`                             | Medium                           | Medium | Server strings come through the server i18n path the other pages already use; only interactive leaves are client |
| shadcn baseline restored here unilaterally, diverging from Batch A                      | Medium                           | High   | [Q10](./clarifications.md): follow the hand-rolled pattern; if Batch A restores it, Batch B follows Batch A      |

## Security Considerations

- The page re-verifies with `getUser()`; `getSession()` is banned project-wide.
- `?id` is used **only** after passing the canonical-UUID shape gate. It is never interpolated into
  SQL and never reflected into a redirect target.
- `SEC_004` starts here: no edit affordance is rendered on the name, avatar or department on either
  face of the route. After Batch A phase 0 only `display_name`, `avatar_url` and `language` are
  user-writable at all — **anything the design lets a user edit beyond those three is a conflict to
  raise, never a reason to widen the GRANT.**
- The 404 for an unknown id must be indistinguishable from the 404 for a malformed one; a
  differentiated error would turn the route into a profile-id oracle.

## Next Steps

Unblocks **phase 04** (the two faces), **phase 05** (KUDOS section) and **phase 06** (the menu's
Profile item now has a real destination). Report `redExitCode`, `redFailure` and the GREEN rerun.

## Rollback

`rm -rf app/profile components/profile e2e/profile-*.spec.ts public/profile` and revert the two
i18n registration files. The route disappears; no schema, no data, no cookie residue. Phase 06's
menu item would then link to a 404, so roll 06 back first if both are being undone.
