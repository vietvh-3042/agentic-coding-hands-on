# Phase 09 — F006 Secret box reveal

## Context Links

- [`plan.md`](./plan.md) · [phase-01](./phase-01-security-profiles-column-privileges.md) ·
  [phase-03](./phase-03-schema-migrations.md) · [phase-04](./phase-04-seed-data.md)
- [`spec/secret-box-reveal/functional-spec.md`](./spec/secret-box-reveal/functional-spec.md) BR-001..BR-004
- Test cases: `plans/260713-1723-open-secretbox/data/J3-4YFIpMM-testcases.csv` —
  `84a5ba82` (access control), `d9d6e01a` (instruction hidden at 0), `56da7ec8` (badge image per
  type), `3a8ac6b5` (counter), plus the two security cases forbidding client-side manipulation of
  the badge and the counter
- Specs: `plans/260713-1723-open-secretbox/data/J3-4YFIpMM-specs.csv` row C (the six weights)
- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM

## Overview

- **Priority:** P2
- **Status:** completed (RED→GREEN)
- Box clickable, server-side draw of one badge with 6-way weighted distribution, counter decremented
  atomically, and success modal built and rendered. Concurrent opens guarded against double-grant.
- **Policy: `e2e-red-first`.** All behavioral rules and security cases passed.

## Key Insights

- **The screen states are inverted relative to `clarifications.md` and the task brief.** The code
  is authoritative: `sidebar-gift-dialog.tsx` renders `KHÁM PHÁ SECRET BOX CỦA BẠN` with
  `box-closed.svg`, `Click vào box để mở`, and the unopened-count footer — that **is** the
  unopened shell, and its own docstring says the reveal flow is out of scope. J3-4YFIpMM is the
  _Secret Box **Success** Modal_ (`MỞ SECRET BOX THÀNH CÔNG`, `Click vào box để tiếp tục mở`).
  **The reveal is the missing half.** Plan accordingly; do not rebuild the unopened shell.
- **The draw must be server-side and parameterless.** Two MoMorph security cases forbid the client
  influencing the badge or the counter. Phase 03's `open_secret_box()` takes no arguments and
  derives the user from `auth.uid()`; after phase 01 it is the _only_ thing that can move
  `boxes_*`. A service-role Server Action would work too but needs a new secret in `.env.local` —
  rejected on KISS grounds.
- **Atomicity is the row lock, not the application.** `select … for update` on the caller's
  profile serializes the double-click case (US001 "1 box, two clicks") inside the database. No
  client-side debounce can provide that guarantee, though the button should still disable while
  pending.
- **The badge artwork does not exist on disk.** `secret_box_icons.image_url` points at
  `/profile/icons/icon-N.png` and `public/profile/` is absent; `public/kudos/badges/` holds only
  the three hero badges. The design's frame JSON carries no exported asset either. Render from
  `image_url` with a name-text fallback and record the gap — do not invent artwork or copy.
- The dialog is 130 lines and gains a whole second state. Split it: a shell that owns
  open/close/scroll-lock, and two panels (unopened / revealed).

## Requirements

- **FN-1** Clicking the box when `boxes_unopened > 0` calls `openSecretBox()` and switches the
  dialog to the success state showing the drawn badge.
- **FN-2** The unopened count decrements by 1 and the opened count increments by 1, both read back
  from the server (FR-001 — never computed client-side).
- **FN-3** At `boxes_unopened = 0` the instruction line is hidden and the box is inert (BR-004),
  and the backend rejects the call regardless.
- **FN-4** Exactly one badge per click; a repeat draw of an owned badge still consumes the box and
  creates no second unlock row (BR-003).
- **FN-5** A failed call changes nothing — no box consumed, no badge granted (BR-002).
- **NFR-1** Success-state copy comes verbatim from the MoMorph spec; new i18n keys only.
- **NFR-2** Files under 200 lines.

## Architecture

```text
SidebarStats (boxes_unopened from phase 06)
  └─ SecretBoxDialog (shell: portal, Escape, scroll lock)
       ├─ state "unopened"  → existing markup, box-closed.svg, click enabled iff count > 0
       └─ state "revealed"  → NEW: title 'MỞ SECRET BOX THÀNH CÔNG',
                              instruction 'Click vào box để tiếp tục mở' (hidden at 0),
                              badge image inside the box frame, updated footer count

click → openSecretBox()  "use server"
          getUser() → supabase.rpc('open_secret_box')      [security definer, no params]
            lock profile row → reject at 0 (no_unopened_boxes)
            weighted draw over secret_box_icons.weight
            insert user_icon_unlocks on conflict do nothing
            boxes_unopened -1 / boxes_opened +1
          → { icon, boxesUnopened, boxesOpened }
       revalidatePath('/sun-kudos')
```

Clicking again from the revealed state draws again while boxes remain — that is what
`Click vào box để tiếp tục mở` means.

## Related Code Files

**Create**

- `components/kudos-board/secret-box-reveal-panel.tsx`
- `app/sun-kudos/actions/open-secret-box.ts`

**Modify**

- `components/kudos-board/sidebar-gift-dialog.tsx` — becomes the shell + state switch
- `lib/i18n/locales/{en,vi}/kudos-feed.json` — `giftDialog.successTitle`,
  `giftDialog.continueSubtitle`, `giftDialog.badgeAlt`, `giftDialog.error`

**Delete** — none.

## Implementation Steps

1. **RED first.** `e2e/secret-box.spec.ts`, project `chromium-authed`:
   - open the dialog from `Mở Secret Box` (TC `43b54c29`);
   - with `boxes_unopened > 0` (seeded), click the box → the title becomes
     `MỞ SECRET BOX THÀNH CÔNG`, a badge is shown, and the footer count is exactly one lower
     (TC `56da7ec8`, `3a8ac6b5`);
   - as the identity seeded at 0 boxes, the instruction is hidden and clicking does nothing
     (TC `d9d6e01a`, US001 error case);
   - **security**: overwrite the rendered counter via `page.evaluate` then reopen the dialog — the
     server value returns (FR-601 / FR-201 verify list);
   - **race**: two clicks in the same tick against a single remaining box grant exactly one badge
     and land the counter at 0.
     Record the assertion-caused RED.
2. `app/sun-kudos/actions/open-secret-box.ts` — `"use server"`, `getUser()`, `supabase.rpc(
"open_secret_box")`, map `no_unopened_boxes` to `{ error: "empty" }`, return the icon and both
   counts, `revalidatePath('/sun-kudos')`.
3. Split `sidebar-gift-dialog.tsx`: keep the portal/Escape/scroll-lock shell and the unopened
   markup; move the revealed markup into `secret-box-reveal-panel.tsx`. Add
   `useState<"unopened"|"revealed">` plus the drawn icon and a `useTransition` pending flag.
4. Make the box art a real `<button>` (it is a `role="img"` div today) so it is keyboard
   reachable, disabled at 0 and while pending. Keep the existing `pointer-events-none` styling
   path for the inert state.
5. Add the four i18n keys in both locales, copy verbatim from the MoMorph spec.
6. Render the badge from `icon.image_url` with an `alt` of `icon.name`; on a missing asset fall
   back to the badge name over the open-box frame, and log the missing-artwork gap in the phase
   report.
7. `pnpm validate` + `pnpm test:e2e --project=chromium-authed -g "secret box"` → GREEN.

## Todo List

- [x] `e2e/secret-box.spec.ts` written; assertion-caused RED recorded
- [x] `openSecretBox` Server Action over the parameterless RPC
- [x] Dialog split into shell + reveal panel, both under 200 lines
- [x] Box art is a real disabled-able button, keyboard reachable
- [x] Success-state copy added to `en` and `vi`
- [x] Counter always server-sourced; client tampering proven ineffective
- [x] Double-click race grants exactly one badge
- [x] Missing badge artwork recorded as a gap, fallback rendering in place
- [x] `pnpm validate` green

## Success Criteria

- After one click: `user_icon_unlocks` holds ≤ one row per `(user, icon)`, `boxes_unopened` is
  exactly one lower and `boxes_opened` exactly one higher.
- Calling `open_secret_box()` as a user at 0 raises `no_unopened_boxes` and mutates nothing.
- A direct `update profiles set boxes_unopened = 99` as `authenticated` fails with `42501`
  (phase 01's guarantee, re-asserted here because this feature is what depends on it).
- Two concurrent RPC calls against a single box produce exactly one new unlock.
- The rendered counter after reopening always equals the DB value, whatever the client did to it.

## Risk Assessment

| Risk                                                                     | L×I     | Countermeasure                                                                                                                  |
| ------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Badge artwork missing → an empty box in the success state                | **H×M** | Name-text fallback over the box frame; gap recorded with the exact six filenames needed. Not a blocker for the data layer       |
| A repeat draw of an owned badge looks like a bug ("I already have this") | M×L     | BR-003 / D001 say show it again and consume the box — expected behavior, called out in the phase report                         |
| `revalidatePath` re-renders the board and closes the dialog mid-reveal   | M×M     | Update the panel from the action's return value; revalidate for the _next_ navigation, and do not remount the dialog on it      |
| The RPC's `security definer` becomes a privilege-escalation vector       | L×**H** | No parameters, `auth.uid()` only, `set search_path = public`, `execute` granted to `authenticated` alone — asserted in phase 03 |
| The e2e race test is flaky under a single-worker CI run                  | M×M     | Fire both clicks with `Promise.all` on two contexts of the same identity; assert the _count_, not the timing                    |
| Seed drift leaves the demo user at 0 and the happy path unreachable      | M×M     | Phase 04 pins demo `boxes_unopened = 25` and one identity at 0; the spec reads the value before asserting                       |

## Security Considerations

The two MoMorph security cases are the acceptance bar: nothing the client sends may choose the
badge or change the counter. The chain that makes that true is phase 01 (users cannot write
`boxes_*`) + phase 03 (a parameterless definer RPC is the only writer) + this phase (the UI merely
displays what the server returned). Breaking any one link silently re-opens it, so the direct
`update profiles` rejection is re-asserted here rather than assumed from phase 01.

## Next Steps

Runs in parallel with 06 and 07. Feeds phase 10.
