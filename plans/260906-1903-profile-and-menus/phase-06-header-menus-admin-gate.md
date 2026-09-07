# Phase 06 — Header menus + server-side admin gate

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q7, Q8, Q9, Q10, Q12)
- Specs: [`data/z4sCl3_Qtk-specs.csv`](./data/z4sCl3_Qtk-specs.csv) (3 rows, all `completed`) ·
  [`data/54rekaCHG1-specs.csv`](./data/54rekaCHG1-specs.csv) (4 rows, all `completed`)
- MoMorph: [Dropdown-profile](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/z4sCl3_Qtk) ·
  [Dropdown-profile Admin](https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/54rekaCHG1)
- Batch A access model: [`../260710-1511-sun-kudos-live-board/spec/system/permissions.md`](../260710-1511-sun-kudos-live-board/spec/system/permissions.md)

## Overview

**Priority:** P1 · **Status:** deferred · **Effort:** 2.5h · **Note:** out of scope this session
(screens `z4sCl3_Qtk` / `54rekaCHG1` not requested)
**Depends on:** 03 (so the Profile item has a real destination) · **Batch A phase 0**
**test_policy:** **`visual-contract`** for both screens — **zero** test cases exist in MoMorph for
either. No RED is claimed, no TDD is claimed, and no test case is fabricated. The screens are
static/presentational mapping plus one authorization decision, and that decision is proved by a
**SQL-level assertion in the success criteria** — which is evidence, not a policy upgrade.
[Q9](./clarifications.md) raises whether the admin screen deserves `e2e-red-first`; it is
**not** silently upgraded here.

Today's `components/homepage/user-menu.tsx` shows Profile / Admin Dashboard / Sign out to **every**
visitor, wired to nothing but `router.push("/login")`. This phase makes it the two designed menus,
picked by a role the server resolved.

## Key Insights

- **A client-side role check is not a gate.** Anything the browser can read, the browser can lie
  about; `role` arriving as a prop only decides what to _paint_. The actual boundary is (a) the
  `/admin` route re-checking `role` server-side on every request, and (b) `role` not being
  self-writable — which is Batch A phase 0's column-level GRANT. **Batch B depends on that fix and
  does not re-plan it.** If `\dp public.profiles` still shows unrestricted `UPDATE` for
  `authenticated` when this phase starts, report **BLOCKED**: painting an admin menu on top of a
  live privilege-escalation hole is worse than shipping nothing.
- **`site-header.tsx` can become a server component with almost no cost.** It is marked
  `"use client"` but holds no state, effect or handler — only `next/font`, `Link` and `Image`
  (verified). A server component may render its existing client children (`NavLinks`,
  `LanguageSelector`, `NotificationMenu`, `UserMenu`) unchanged. That is what makes a server-resolved
  role reachable without prop-drilling through all five pages that mount the header. Every page that
  mounts it (`about`, `sun-kudos`, `award-info`, `countdown`, `profile`) is already a server
  component — verified; none carries `"use client"`.
- **The seed already makes the demo user an admin** (`supabase/seed.sql:127`, `role = 'admin'` live).
  So the _ordinary_-user path is the one that has never been exercised. Phase 01's `user.json`
  fixture is what proves the Dashboard item is absent for a non-admin.
- **The two specs disagree about Logout's destination.** `z4sCl3_Qtk` says "thực hiện logout";
  `54rekaCHG1` says "gọi API logout; xóa session/token; … chuyển hướng về màn hình 'Homepage SAA'"
  with no confirmation dialog. There is no real sign-out anywhere in the app today. Implement one
  sign-out path (`supabase.auth.signOut()` then redirect), and note that the proxy guard will bounce
  an unauthenticated visitor off the SAA homepage to `/login` anyway — so the two specs converge in
  practice.
- **`54rekaCHG1`'s own spec text defers the Dashboard**: `TODO: Route/màn hình Admin Dashboard chưa
được xác định`, and its Profile row says `TODO: Trang Profile chưa được triển khai` — which this
  batch's phase 03 has just made false. The Profile item now navigates for real. The Dashboard item
  is [Q7](./clarifications.md).
- **Visual values available:** the specs carry `119x56 px` for the Profile item, a dark background,
  Profile with a user icon and an active glow, Dashboard with a grid/dots icon, Logout with a right
  chevron, hover highlight, click-outside closes, and **no open/close animation**. Everything else —
  exact colours, spacing, the icon artwork — must be pulled through the MoMorph MCP. The
  `*-frame.json` files carry metadata only. **Do not invent a value.**

## Requirements

**Functional**

- FR-B601 — the base menu is exactly two items, Profile and Logout, in that order (`z4sCl3_Qtk` A.1/A.2).
- FR-B602 — when the server-resolved role is `admin`, a third item, Dashboard, sits between them
  (`54rekaCHG1` A.1/A.2/A.3 order: Profile, Dashboard, Logout).
- FR-B603 — a non-admin never receives the Dashboard item in the HTML payload, not merely hidden.
- FR-B604 — Profile navigates to `/profile` and closes the menu.
- FR-B605 — Logout signs the session out and redirects; no confirmation dialog.
- FR-B606 — clicking the avatar toggles the menu; clicking outside closes it; no open/close animation.
- FR-B607 — the Admin Dashboard route (subject to [Q7](./clarifications.md)) re-checks `role`
  server-side and returns 404/redirect for a non-admin, independently of the menu.
- FR-B608 — both locales carry every label (`common` namespace, existing `userMenu.*` keys extended).

**Non-functional**

- `user-menu.tsx` stays under 200 lines and stays the only client component here.
- `lib/auth/current-profile.ts` is the single place `role` is read; no component queries it directly.

## Architecture

```text
app/{about,sun-kudos,award-info,countdown,profile}/page.tsx   (server, unchanged)
        │
        ▼
components/homepage/site-header.tsx        ← "use client" REMOVED; now async server component
        │  const { isAdmin } = await getCurrentProfileRole()
        ▼
components/homepage/user-menu.tsx (client) ← receives isAdmin: boolean
        └─ items = [Profile, ...(isAdmin ? [Dashboard] : []), Logout]
                     ▲ the array is built on the SERVER'S answer; a false value simply omits the node

lib/auth/current-profile.ts (server-only)
        getUser() → select role from profiles where id = user.id → { userId, role, isAdmin }

app/admin/page.tsx (Q7)
        getCurrentProfileRole() → !isAdmin → notFound()      ← THE gate; the menu is not
```

**Data flow**

| In             | Transform                                     | Out                                                 |
| -------------- | --------------------------------------------- | --------------------------------------------------- |
| session cookie | `getUser()` in `lib/auth/current-profile.ts`  | `user.id`                                           |
| `user.id`      | `select role from profiles` (explicit column) | `role`, `isAdmin`                                   |
| `isAdmin`      | array construction in `user-menu.tsx`         | 2 or 3 menu nodes                                   |
| click Logout   | `supabase.auth.signOut()`                     | session cleared → redirect → proxy guard → `/login` |
| GET `/admin`   | server-side `isAdmin` re-check                | page, or `notFound()`                               |

**Trust boundary.** The menu is a _hint_. `/admin`'s own check is the gate, and it holds even if a
user hand-crafts the URL, edits the DOM, or replays a stale payload.

## Related Code Files

**Create**

- `lib/auth/current-profile.ts` (~35, `server-only`)
- `app/admin/page.tsx` (~40) — placeholder content, real gate — subject to [Q7](./clarifications.md)

**Modify**

- `components/homepage/site-header.tsx` — drop `"use client"`, become `async`, resolve the role
- `components/homepage/user-menu.tsx` — accept `isAdmin`, build the item list, wire Profile and a
  real sign-out
- `lib/i18n/locales/{vi,en}/common.json` — `userMenu.*` labels (rename `adminDashboard` → the
  spec's `Dashboard` wording; keep `profile` and `signOut`)

**Read for context (do not modify)**

- `components/common/notification-menu.tsx`, `components/common/language-selector.tsx` — the two
  sibling header dropdowns; match their open/close and `aria` conventions exactly
- `hooks/use-click-outside.ts` — reuse (`FR-B606`)
- `lib/supabase/{server,client,proxy}.ts` — session handling
- `supabase/migrations/20260723091000_profiles_role.sql` — the `role` column and its CHECK

## Implementation Steps

1. **Gate:** `docker exec … psql -c "\dp public.profiles"`. `authenticated` must hold
   column-scoped `UPDATE` only. Otherwise **BLOCKED** — stop, do not re-plan A-p0 here.
2. `lib/auth/current-profile.ts` — `getUser()`, then an explicit `select("role")`. No `select *`.
   Returns `{ userId, role, isAdmin }`; `isAdmin` is computed here so no caller re-derives it.
3. `site-header.tsx` — remove `"use client"`, make the default export `async`, await the role, pass
   `isAdmin` to `UserMenu`. Change nothing else in the file. Run `pnpm build` immediately: a page
   that unexpectedly needs a client header will fail here, loudly and early.
4. `user-menu.tsx` — build the array conditionally so a non-admin's payload has **no Dashboard
   node**. Profile → `Link href="/profile"`. Logout → `createBrowserClient().auth.signOut()` then
   redirect. Keep `useClickOutside`; add no animation.
5. i18n both bundles.
6. `/admin` placeholder with its own `getCurrentProfileRole()` check → `notFound()` for non-admins.
7. Visual contract: pull both frames through the MoMorph MCP; map item sizing (`119×56`), icon
   placement, hover highlight and the active glow. Then `pnpm lint && pnpm typecheck &&
pnpm format:check && pnpm build`, and hand to `tester` for browser/visual validation — this phase
   owns no browser evidence itself.

## Todo List

- [ ] A-p0 verified applied (else BLOCKED)
- [ ] `current-profile.ts` is the only reader of `role`; explicit column select
- [ ] `site-header.tsx` no longer `"use client"`; `pnpm build` green across all five mounting pages
- [ ] Non-admin payload contains **no** Dashboard node (raw HTML check, not DOM)
- [ ] Admin payload has three items in the order Profile, Dashboard, Logout
- [ ] Profile navigates to `/profile`; menu closes
- [ ] Logout clears the session, no confirmation dialog
- [ ] Click-outside closes; no open/close animation
- [ ] `/admin` 404s for a non-admin even when reached by direct URL
- [ ] Both locales complete
- [ ] `user-menu.tsx` < 200 lines
- [ ] MoMorph frames consulted for every visual value; nothing invented
- [ ] `tester` has produced visual validation for both screens

## Success Criteria

| ID          | Criterion                                                      | Method                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC-B601     | Base menu shape                                                | `user.json` fixture: menu items == `["Profile","Logout"]`                                                                                                                                                  |
| SC-B602     | Admin menu shape                                               | `admin.json` fixture: `["Profile","Dashboard","Logout"]`                                                                                                                                                   |
| SC-B603     | Not merely hidden                                              | non-admin page HTML: `grep -c "Dashboard"` == 0                                                                                                                                                            |
| SC-B604     | Gate is server-side                                            | as the non-admin fixture, `GET /admin` → 404/redirect                                                                                                                                                      |
| **SC-B605** | **`role` is not self-writable** — the SQL-level gate assertion | as an ordinary authenticated JWT: `update profiles set role='admin' where id = auth.uid()` inside a rolled-back transaction → **must fail**. This is the assertion [Q9](./clarifications.md) stands in for |
| SC-B606     | Logout works                                                   | session cookie cleared; a following guarded request lands on `/login`                                                                                                                                      |
| SC-B607     | Visual contract                                                | `tester` MCP capture vs. both MoMorph frames                                                                                                                                                               |
| Build       | `pnpm validate`                                                | exit 0                                                                                                                                                                                                     |

## Risk Assessment

| Risk                                                                                     | Likelihood                                    | Impact       | Countermeasure                                                                                                 |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| Menu treated as the gate; `/admin` ships with no server check                            | Medium                                        | **Critical** | FR-B607 + SC-B604 test the route directly by URL, bypassing the menu entirely                                  |
| A-p0 not applied → admin menu painted over a live escalation hole                        | Medium                                        | **Critical** | Step 1 is a hard BLOCK; SC-B605 re-proves it with a real rolled-back `UPDATE`                                  |
| Dashboard node rendered then CSS-hidden for non-admins                                   | Medium                                        | High         | SC-B603 greps the raw HTML, not the DOM                                                                        |
| Removing `"use client"` from `site-header.tsx` breaks a page that needed a client header | Low (all five mounting pages verified server) | High         | Step 3 runs `pnpm build` immediately after the single-line change, before anything else is written             |
| Role read per-component, diverging across the header                                     | Medium                                        | Medium       | `current-profile.ts` is the single reader; a todo item                                                         |
| `Dashboard` links to a route that does not exist (Q7 unanswered)                         | Medium                                        | Medium       | Gated on [Q7](./clarifications.md); the fallback ships a gated placeholder so the item never 404s for an admin |
| The `visual-contract` policy is mistaken for proof the gate works                        | Medium                                        | High         | Stated at the top of this file and again in SC-B605; the gate's evidence is SQL, not a screenshot              |
| shadcn `DropdownMenu` introduced here, diverging from Batch A                            | Medium                                        | High         | [Q10](./clarifications.md): follow the hand-rolled pattern the two sibling header dropdowns already use        |

## Security Considerations

- **An admin gate must be enforced server-side.** A client-side role check is not a gate — it is a
  rendering hint. Stated here because it is the single most important sentence in this phase.
- Defense in depth is two layers, both server-side: `/admin`'s own `getCurrentProfileRole()` check,
  and `role` being non-writable by its owner (A-p0). Neither substitutes for the other.
- `profiles.role` is read with an explicit column select — never `select *`, which would put every
  profile column into a payload rendered for every page (`SEC_004`'s spirit).
- Adding `/admin` to `isPublicPath()` would expose it — it must stay outside that list so the proxy
  guard applies before the role check even runs.
- If a future requirement wants a user to change their own role, that is a **privileged** operation
  and belongs behind a `security definer` RPC. It is never a reason to widen the column GRANT.

## Next Steps

Unblocks **phase 07**. Report the SC-B605 rolled-back `UPDATE` output verbatim and the `tester`
visual verdict for both screens.

## Rollback

`git checkout components/homepage/site-header.tsx components/homepage/user-menu.tsx
lib/i18n/locales/{vi,en}/common.json && rm -rf lib/auth app/admin`. The header returns to the
presentational three-item menu. Nothing persists — no schema change, no migration, no stored state —
so the rollback cannot cascade. Note that rolling back **only** this phase leaves `/profile`
reachable by URL but unlinked from the chrome.
