# Phase 08 — F004 Kudo hearts

## Context Links

- [`plan.md`](./plan.md) · [phase-03](./phase-03-schema-migrations.md) · [phase-06](./phase-06-f002-board-reads.md)
- [`spec/kudo-hearts/functional-spec.md`](./spec/kudo-hearts/functional-spec.md) ·
  [`technical-spec.md`](./spec/kudo-hearts/technical-spec.md) A1/A2
- Test cases: `data/MaZUn5xHXZ-testcases.csv` — `63645b03` (sender cannot like own),
  `91e102ba` (one like per user per kudo), `31936b72` (special day, 2 hearts),
  `7a7ec63e` (toggle updates count)
- Existing DB enforcement: `supabase/migrations/20260722100000_kudo_hearts.sql:8-14,41-52,63-85`

## Overview

- **Priority:** P1
- **Status:** completed (RED→GREEN, with duplicate data-attribute fix)
- Local `useState` toggles replaced with persistent mutations crediting sender 1 heart (or 2 on
  special day). Duplicate `data-kudo-id` found and fixed post-spec.
- **Policy: `e2e-red-first`.** All four test cases passed.
- **Sequential after 06** — edited `feed-kudo-post-card.tsx` and `highlight-kudo-card.tsx`.

## Key Insights

- **Most of this feature is already in the database.** The composite PK gives one-heart-per-user
  structurally; the RLS `with check (user_id = auth.uid() and auth.uid() <> kudos.sender_id)`
  blocks self-hearting even from a tampered client; `sync_kudo_hearts_count()` owns
  `kudos.hearts_count`. The application must not re-implement any of it — and must never write
  `hearts_count` directly, or the two will drift.
- **Phase 03's BEFORE INSERT trigger already resolves the multiplier.** So `heartKudo` does _not_
  read `event_settings` to decide the value — it just inserts, and the trigger decides. That
  closes the hole where a client with the anon key inserts `hearts_value = 2` on an ordinary day.
- **Un-hearting is a plain delete.** The stored `hearts_value` travels with the row, so the sync
  trigger revokes exactly the amount granted (BR-004) with no application arithmetic — even after
  the special day has ended. Deleting an already-deleted row is a no-op, not an error, which is
  what makes the raced double-click safe.
- **The disabled state has two independent reasons** — not signed in, or you are the sender —
  and phase 06 already supplies `isOwnKudo` and `likedByMe` server-side. Rendering from those
  flags rather than local state is what makes a reload show the truth.
- The heart control is duplicated in two card components today. Extract it once
  (`heart-button.tsx`) rather than patching both — DRY, and it gives the tests one selector.

## Requirements

- **FN-1 (A1)** `heartKudo(kudoId)` inserts one `kudo_hearts` row for `auth.uid()`.
- **FN-2 (A2)** `unheartKudo(kudoId)` deletes the caller's row for that kudo.
- **FN-3** The control renders disabled with no active state on the viewer's own kudos (FR-203).
- **FN-4** The control reflects `likedByMe` on load and toggles without a page reload (FR-204).
- **FN-5** Optimistic update with rollback on failure, and a generic retry message.
- **FN-6** Rapid toggling never yields more than one active heart, nor a count that desyncs
  (FR-402).
- **NFR-1** No direct write to `kudos.hearts_count` anywhere in the app.

## Architecture

```text
HeartButton (client)
  click → useOptimistic(fill, count ± value) → heartKudo|unheartKudo(kudoId)   "use server"
      getUser()  → 401-equivalent error if absent
      insert kudo_hearts (kudo_id, user_id)   ← hearts_value set by BEFORE trigger
        │                                       ← RLS rejects self-heart
        └─ AFTER trigger → kudos.hearts_count += hearts_value
      or delete kudo_hearts where (kudo_id, user_id)
        └─ AFTER trigger → kudos.hearts_count -= that row's hearts_value (floored at 0)
      revalidatePath('/sun-kudos')
  server error → rollback optimistic state + retry toast
```

The action returns the authoritative `{ heartsCount, likedByMe }` so the optimistic guess is
reconciled rather than trusted.

## Related Code Files

**Create**

- `components/kudos-board/heart-button.tsx`
- `app/sun-kudos/actions/heart-kudo.ts` (both actions)

**Modify**

- `components/kudos-board/feed-kudo-post-card.tsx` — swap the inline heart for `<HeartButton/>`
- `components/kudos-board/highlight-kudo-card.tsx` — same; delete the `likedIds` set that
  `highlight-section.tsx` lifts today

## Implementation Steps

1. **RED first.** `e2e/kudo-hearts.spec.ts`, project `chromium-authed`:
   - TC `63645b03` — on a kudo the demo user sent (seeded), the heart control is `disabled` and
     clicking changes nothing;
   - TC `7a7ec63e` — on someone else's kudo, click fills the heart and the count increases by 1;
     reload shows the same state (proving persistence, not local state);
   - TC `91e102ba` — clicking twice returns to the original count, and `kudo_hearts` holds at most
     one row for that pair;
   - US002 — un-hearting a kudo hearted at `hearts_value = 2` reduces the count by 2 (set the
     special-day window, heart, clear the window, un-heart);
   - FR-402 — three rapid clicks settle on the state the last click requested.
     Record the assertion-caused RED.
2. Build `heart-button.tsx`: props `{ kudoId, heartsCount, likedByMe, disabled }`, `useOptimistic`
   for the fill + count, `useTransition` for the pending state, `aria-pressed`, and a
   `data-testid="heart-button"` + `data-kudo-id` so both card types share one selector.
3. `app/sun-kudos/actions/heart-kudo.ts` — `heartKudo` / `unheartKudo`. `getUser()` first
   (`getSession()` is banned project-wide). Insert/delete only; read back `hearts_count` and
   return it. Map the RLS rejection (`42501` / policy violation) to a typed
   `{ error: "forbidden" }`, and a foreign-key violation (kudo deleted mid-click) to
   `{ error: "gone" }`.
4. Replace the inline heart markup in both cards; delete `likedIds` from `highlight-section.tsx`
   and stop threading `toggleLike` through the carousel.
5. Wire the `x2` sidebar badge to the real special-day flag phase 06 already fetches.
6. `pnpm validate` + `pnpm test:e2e --project=chromium-authed -g "heart"` → GREEN.

## Todo List

- [x] `e2e/kudo-hearts.spec.ts` written; assertion-caused RED recorded
- [x] `heart-button.tsx` shared by both card types
- [x] `heartKudo` / `unheartKudo` on `getUser()`, no `hearts_count` write
- [x] `likedIds` local state removed from `highlight-section.tsx`
- [x] Optimistic update + rollback + retry message
- [x] Special-day ×2 grant and ×2 revoke both asserted
- [x] `pnpm validate` green

## Success Criteria

- After a heart: exactly one `kudo_hearts` row for `(kudo, user)` and `kudos.hearts_count` moved by
  that row's `hearts_value`; after an un-heart, zero rows and the count restored.
- `insert into kudo_hearts (…, hearts_value) values (…, 2)` as `authenticated` on a normal day
  still stores `1` — the trigger, not the client, decides.
- Hearting one's own kudo through a direct action call returns `forbidden` and writes nothing.
- Reloading the board preserves the hearted state (no local-only state left).
- `grep -rn "hearts_count" app/ components/ | grep -i "update\|insert"` returns nothing.

## Risk Assessment

| Risk                                                                       | L×I     | Countermeasure                                                                                                                                    |
| -------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Optimistic UI diverges from the server after a rejected click              | M×M     | The action returns the authoritative count; the client reconciles rather than keeping its guess                                                   |
| `revalidatePath` on every heart re-renders the whole board and feels heavy | M×M     | Return the count and update in place; revalidate only so a _later_ navigation is fresh                                                            |
| The special-day test leaves `event_settings` dirty and poisons later specs | **H×M** | The spec sets and clears the window inside the same test with a `finally`; phase 10 re-asserts `special_day_start is null` before the full run    |
| Two rapid clicks race into a duplicate insert                              | M×M     | The composite PK makes the second insert a constraint violation, mapped to a no-op; the button is also `disabled` while the transition is pending |
| Editing card files phase 06 owns causes a merge conflict                   | M×M     | Strict sequencing — 08 starts only after 06 is merged; declared in the plan's parallel-window note                                                |

## Security Considerations

- The multiplier is a database decision, never a client input — this is the phase's main security
  property and the `hearts_value = 2` forgery test is what proves it.
- Self-hearting is blocked at three layers: the disabled control, the action's own check, and the
  RLS policy. Only the third is trustworthy; the test must exercise it directly.
- No new grant is needed — phase 01 already granted `insert, delete on kudo_hearts` to
  `authenticated`.

## Next Steps

Feeds phase 10.
