# Phase 03 — Header menu data wiring (G3, G4)

## Context Links

- Plan overview: [`plan.md`](./plan.md) — gap table
- Defect sites: `components/common/notification-menu.tsx:45-48`,
  `components/homepage/user-menu.tsx:57-66`
- Tables of record: `public.notifications`, `public.profiles` (schema read below)
- Must land after: [`phase-01`](./phase-01-real-sign-out.md) — same file

## Overview

**Priority:** P1
**Status:** pending
**Effort:** 2h
**Depends on:** Phase 01 (shares `user-menu.tsx`)
**Resolved `test_policy`:** `visual-contract` — no MoMorph screen and no test cases exist for
this header. No RED/TDD claim. Verified by seeded manual checks against the live database.

Two header controls currently assert things that are not true: a permanent unread badge, and two
menu items that do nothing.

## Key Insights

- **The badge lies unconditionally.** `notification-menu.tsx:45-48` renders a red 8px dot with no
  condition attached — it is present whether or not anything is unread — while the panel below it
  is a hardcoded `t("common:notifications.empty")`. A user with unread notifications and a user
  with none see the identical screen. The component docblock is honest about it ("the static
  unread badge dot is kept as-is and no real notification data is fetched"), which makes this
  known debt rather than a surprise.
- **The data is there and the access model already fits.** Verified against the running database:

  ```
  public.notifications(id uuid, user_id uuid → profiles.id, title text, body text,
                       read_at timestamptz null, created_at timestamptz)
  index notifications_user_id_created_at_idx (user_id, created_at DESC)
  RLS: "notifications readable by self"  SELECT  TO authenticated  USING (user_id = auth.uid())
       "notifications update by self"    UPDATE  TO authenticated  USING (user_id = auth.uid())
  ```

  Both a read path _and_ a mark-as-read path are already permitted, self-scoped. The index is on
  exactly the `(user_id, created_at DESC)` shape a notification list wants — **no schema work is
  needed and none should be invented here.**

- **`role` already exists on `profiles`.** `profiles.role text not null default 'user'` with
  `check (role in ('user','admin'))`, and `supabase/seed.sql` promotes the demo user to `admin`.
  So the "Admin Dashboard" item has a real gate available; what it does **not** have is a
  destination. Showing an admin-only control is only half the work — the route it points at must
  exist, and today it does not.
- **The honest minimum for G4 is subtraction, not construction.** A menu item to a route that
  does not exist is worse than no menu item. Unless `/profile` and an admin route are actually
  planned, remove them. Building two pages to justify two menu entries is exactly the invention
  this retro is supposed to avoid (YAGNI). **This is the product question in the plan; answer it
  before coding.**
- **`getUser()`, never `getSession()`** for anything that decides what an admin sees. The project
  ban is absolute, and `auth.uid()` in the RLS policies is what actually enforces scope anyway —
  the client-side check is presentation only.
- **The unread count must not become a poll.** A `setInterval` fetch on every page is the easy
  wrong answer. Fetch once on the server for the initial render; if live updates are genuinely
  wanted later, that is a Supabase Realtime subscription and a separate decision.

## Requirements

**Functional**

- The unread dot renders **only** when at least one row has `read_at is null` for the current
  user.
- The panel lists real notifications (title, body, relative time), most recent first.
- The empty state renders only when there genuinely are none.
- G4: Profile and Admin Dashboard either navigate somewhere real, or are removed.
- If Admin Dashboard survives, it is shown only when `profiles.role = 'admin'`.

**Non-functional**

- No polling. One read per page render.
- Both files stay under 200 lines (64 and 84 today).
- No new dependency.

## Architecture

```text
app/about/page.tsx (Server Component)  — and every other page mounting SiteHeader
  supabase = await createClient()                       // lib/supabase/server.ts
  → notifications: select id,title,body,read_at,created_at
                   where user_id = auth.uid() order by created_at desc limit 20
  → profile:       select role where id = auth.uid()
  <SiteHeader notifications={…} role={…} />
       ├─ NotificationMenu items={…}    → dot iff items.some(n => n.read_at === null)
       └─ UserMenu role={…}             → admin entry iff role === "admin"
```

**Ripple to name up front.** `SiteHeader` is mounted by **four** routes — `app/about/page.tsx`,
`app/award-info/page.tsx`, `app/sun-kudos/page.tsx`, `app/login/page.tsx` (verified by grep).
Threading props from each page means touching all four, and `/login` has no authenticated user at
all. Two candidate shapes:

| Shape                                                       | Cost                                | Risk                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Props from each page                                        | 4 page edits; `/login` passes empty | Prop drilling; `/login` needs an explicit "no user" path                                                 |
| `SiteHeader` becomes a Server Component fetching for itself | 1 edit                              | It is currently `"use client"` for its children; would need splitting into a server shell + client menus |

**Recommendation: the server-shell split.** It removes the `/login` special case entirely and
keeps the fetch next to its consumer (DRY). But it is a structural change to a shared component —
decide it deliberately, not mid-implementation.

**Data flow**

| In                   | Transform                             | Out                        |
| -------------------- | ------------------------------------- | -------------------------- |
| `auth.uid()` via RLS | `select … where user_id = auth.uid()` | ≤20 notification rows      |
| rows                 | `some(read_at === null)`              | dot visible or not         |
| `profiles.role`      | equality check                        | admin entry visible or not |

## Related Code Files

**Modify** — `components/common/notification-menu.tsx`, `components/homepage/user-menu.tsx`,
`components/homepage/site-header.tsx` (whichever shape is chosen), plus the page files if the
prop shape wins
**Create** — possibly `components/homepage/site-header-shell.tsx` (server) if split
**Read only** — `lib/supabase/server.ts`, `supabase/seed.sql`

**Ownership.** `user-menu.tsx` is shared with phase 01 — strictly after it. `site-header.tsx` is
not claimed by any other phase in any of the six folders (verified).

## Implementation Steps

1. **Answer G4 first**: do `/profile` and an admin route exist as planned work? If not, remove
   the two items and this phase shrinks to notifications only.
2. Choose the prop shape vs server-shell split (table above) and write the decision down.
3. Wire the notification read. Assert nothing about ordering beyond `created_at desc` — the index
   already supports it.
4. Make the dot conditional. This is the smallest, highest-value edit in the phase; land it even
   if the panel content slips.
5. Render the real list; keep the existing empty-state string for the genuinely-empty case.
6. Apply the G4 decision from step 1.
7. `pnpm format:check && lint && typecheck && build`, then verify with seeded rows.

## Todo List

- [ ] G4 answered (build vs remove) and recorded
- [ ] Prop-vs-shell decision recorded before coding
- [ ] Notifications read scoped by RLS, `limit 20`, `created_at desc`
- [ ] Dot conditional on `read_at is null`
- [ ] Empty state only when truly empty
- [ ] No `setInterval` / polling anywhere
- [ ] `grep -n "getSession" components/` → empty
- [ ] `/login` still renders its header with no authenticated user
- [ ] Both files under 200 lines
- [ ] `pnpm format:check && lint && typecheck && build` exit 0

## Success Criteria

| ID    | Criterion                                                | Method                                                                      |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| SC-01 | All read → no dot                                        | `update notifications set read_at = now() where user_id = '<demo>'`, reload |
| SC-02 | One unread → dot                                         | set one row's `read_at = null`, reload                                      |
| SC-03 | Panel shows the seeded titles in `created_at desc` order | manual                                                                      |
| SC-04 | No rows → empty state, no dot                            | `delete from notifications where user_id = '<demo>'`                        |
| SC-05 | Another user's notifications are never visible           | seed a row for a second profile; confirm absent                             |
| SC-06 | `/login` renders without error                           | manual load, signed out                                                     |
| SC-07 | One query per render, no polling                         | Supabase logs over 60 idle seconds on `/about`                              |
| SC-08 | Non-admin sees no admin entry (if kept)                  | `update profiles set role='user'`, reload                                   |

## Risk Assessment

| Risk                                                                 | Likelihood                    | Impact       | Countermeasure                                                                                                           |
| -------------------------------------------------------------------- | ----------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Two pages invented purely to justify two menu items                  | **Medium**                    | Medium       | Step 1 gate; removal is stated as the legitimate outcome                                                                 |
| `/login` breaks when the header starts expecting a user              | **High** if prop shape chosen | High         | SC-06; the server-shell option removes the case entirely                                                                 |
| Cross-user leakage through a client-side query with the wrong filter | Low                           | **Critical** | RLS enforces `user_id = auth.uid()` server-side regardless; SC-05 asserts it empirically rather than trusting the filter |
| Admin entry gated client-side and mistaken for authorization         | Medium                        | High         | Comment it as presentation-only; any real admin route needs its own server-side check                                    |
| Polling added for "live" unread counts                               | Medium                        | Medium       | Explicitly banned above; SC-07                                                                                           |
| Collides with phase 01 in `user-menu.tsx`                            | Medium                        | Medium       | Hard ordering stated in Overview and in the plan's phase table                                                           |

## Security Considerations

- `notifications` RLS is self-scoped for both `SELECT` and `UPDATE` — the correct model already.
  Do not add a service-role path to "make it easier".
- The admin menu entry is **presentation only**. Any admin route must re-check `role` server-side;
  hiding a link is not authorization.
- `profiles` is `readable by all` (`anon` included), so `role` is not secret — that is fine for
  showing a link, and precisely why it cannot be the access control.
- `getUser()` only. `getSession()` stays banned.

## Next Steps

Closes G3 and G4. If the admin route is greenlit, that is a new plan folder with its own
authorization design — not an extension of this phase.

## Rollback

`git checkout --` the touched components (and revert the shell split, if taken). No schema change
is made, so there is nothing to migrate back.
