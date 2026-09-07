# Phase 02 — Profile read layer + anonymity boundary

## Context Links

- Plan overview: [`plan.md`](./plan.md) · decisions: [`clarifications.md`](./clarifications.md) (Q1, Q3, Q3b, Q6)
- Test cases served: `TC_WEB_PROFILE_FUN_001..005`, `SEC_001..004`, `GUI_001`, `GUI_004`, `GUI_009`
  in [`data/3FoIx6ALVb-testcases.csv`](./data/3FoIx6ALVb-testcases.csv)
- Batch A access model (read, do not edit):
  [`../260710-1511-sun-kudos-live-board/spec/system/permissions.md`](../260710-1511-sun-kudos-live-board/spec/system/permissions.md)
- Department schema this phase reads: [`../260713-1552-dropdown-department/phase-01-departments-schema.md`](../260713-1552-dropdown-department/phase-01-departments-schema.md)

## Overview

**Priority:** P1 · **Status:** completed · **Effort:** 4h
**Depends on:** **Batch A phase 0** (column-level GRANTs applied to the live DB) · **DD-01**
(`departments` + `profiles.department_id`)
**test_policy:** `e2e-red-first` for screen `3FoIx6ALVb`. This phase writes no UI, so it records no
RED of its own — it is the data half of phase 03's RED. Its own gate is SQL assertion (below).

Everything `/profile` renders, resolved server-side: the target profile, the five counters, the
badge collection, and the two directional Kudo feeds. The security cases (`SEC_001..003`) are
decided **here**, in the query layer, not in the components — a UI that merely hides a number is not
a boundary.

## Key Insights

- **`SEC_001` is closed by removing the surface, not by adjusting a count.** Another Sunner's _sent_
  count includes Kudos they sent anonymously, which no feed will ever show. The read layer therefore
  returns `sentCount: null` and `stats: null` for any target that is not the caller — one data-level
  branch, so the self/other distinction is decided exactly once and every component downstream
  inherits it. `FUN_006` and `FUN_008` fall out of the same branch for free.
- **`SEC_002` is the inverse trap.** Your _own_ Sent list must include your anonymous Kudos and show
  **you** as their author. A naive `sender_id = target` filter over a feed mapper that masks
  anonymous senders would silently drop them and under-report against the counter beside it. The
  sent feed must select the sender for `auth.uid()`'s own rows and mask for everyone else's — which
  is why it is a **caller-scoped `security definer` view**, whose `WHERE` clause is the boundary.
- **The anonymity boundary is currently fictitious at the data layer.** `kudos` carries
  `for select to anon, authenticated using (true)` — verified live — so `sender_id` on an anonymous
  kudo is readable by anyone through the data API no matter what the UI renders. The definer view
  closes it for _this_ screen; narrowing the base-table policy would break Batch A's board queries
  mid-flight and is deliberately **out of scope**, recorded as [Q6](./clarifications.md).
- **`FUN_004` is a 500-prevention case, not a validation nicety.** A non-UUID sent to a `uuid`
  column raises Postgres `22P02`. The id must be shape-checked against a canonical UUID pattern
  **before any query is issued**; failing that check is a `notFound()`, never an error page.
- **The default ACL is not a boundary here either.** The new view inherits
  `INSERT/SELECT/UPDATE/DELETE/…` for `anon` and `authenticated` from the postgres-owned default
  ACL on schema `public` (confirmed with `\ddp`). This phase asserts its GRANTs explicitly.
- **Two different denominators, deliberately** (`GUI_001` Note): Hero tier keys on **distinct
  senders**; hoa-thi stars key on **total received** (10/20/50). Do not collapse them into one
  count — see [Q3/Q3b](./clarifications.md), which must be answered before this phase is forged.

## Requirements

**Functional**

- FR-B201 — `resolveProfileId(searchParams)` returns `{ kind: "self" }`, `{ kind: "other", id }`, or
  `{ kind: "notFound" }`. Empty value → self (`FUN_005`). Repeated key → notFound (`FUN_005`).
  Malformed → notFound (`FUN_004`). `?id` equal to the caller → **self** (`FUN_002`).
- FR-B202 — `getProfileHeader(id)` returns avatar, display name, department label, derived tier and
  total received. Returns `null` for an unknown well-formed uuid (`FUN_003`).
- FR-B203 — `getProfileStats(id, callerId)` returns the five counters **only** when `id === callerId`;
  otherwise `null` (`SEC_001`, `GUI_004`).
- FR-B204 — `getUnlockedIcons(id)` returns the caller-visible unlock list against the 6
  `secret_box_icons` rows (`GUI_002`).
- FR-B205 — `getReceivedFeed(id, cursor)` and `getSentFeed(cursor)` page by the board's keyset
  cursor, 10 per page, `created_at DESC` (`FUN_013`).
- FR-B206 — `getSentFeed` is caller-scoped: it takes **no** target parameter and can only ever
  return `auth.uid()`'s rows (`SEC_003`).
- FR-B207 — no email address and no `auth.users` id is present in any returned shape (`SEC_004`).

**Non-functional**

- Every file under `lib/profile/` stays below 200 lines; the module is split by concern, not by size.
- The feed row shape is the **same shape and same column list** the board mapper emits, imported
  from Batch A rather than re-declared (`GUI_006`, DRY).
- A typed `status` field rides on the card shape so the deferred Spam chip can be enabled later with
  no reshaping (`GUI_007`) — the field exists, nothing renders it.

## Architecture

```text
app/profile/page.tsx  (phase 03)
      │  await searchParams  →  resolveProfileId()
      ▼
lib/profile/resolve-target.ts     pure; UUID shape gate; no DB access
      │
      ▼
lib/profile/queries.ts            server-only; createClient() from @/lib/supabase/server
      ├── getProfileHeader(id)          profiles ⟕ departments
      ├── getProfileStats(id, caller)   → null unless id === caller
      ├── getUnlockedIcons(id)          secret_box_icons ⟕ user_icon_unlocks
      ├── getReceivedFeed(id, cursor)   kudos where receiver_id = id      (masks anonymous senders)
      └── getSentFeed(cursor)           kudos_sent_for_caller  ← definer view, no target param
      │
      ▼
lib/profile/hero-tier.ts          distinct-sender count → tier; total received → star count
lib/profile/types.ts              ProfileHeader | ProfileStats | ProfileFeedPage
```

**The definer view (new migration).**

```text
create view public.kudos_sent_for_caller with (security_invoker = off) as
  select <the board's exact column list>, sender_id as author_id
  from public.kudos
  where sender_id = auth.uid();      ←  THIS clause is the security boundary

revoke all on public.kudos_sent_for_caller from anon, authenticated;
grant select on public.kudos_sent_for_caller to authenticated;
```

`security_invoker = off` (the definer default) is what lets the view read rows the caller could
otherwise only reach through the permissive base policy, while the `WHERE` clause pins it to the
caller. The explicit `revoke` is mandatory — the default ACL would otherwise hand `anon` full
privileges on the view. `anon` gets nothing: an unauthenticated `auth.uid()` is `null`, so the view
would return zero rows anyway, but the GRANT is the boundary that is actually enforced.

**Data flow — one request**

| In                       | Transform                                                            | Out                                  |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------ |
| `searchParams` (Promise) | `await` → `resolveProfileId`                                         | `self` \| `other:{id}` \| `notFound` |
| `notFound`               | `notFound()` from `next/navigation`                                  | Next 404 page, never a 500           |
| `{id}` + `auth.uid()`    | parallel `getProfileHeader` / `getProfileStats` / `getUnlockedIcons` | header + `stats \| null` + icons     |
| direction + cursor       | `getReceivedFeed` \| `getSentFeed`                                   | 10 rows + next cursor + `hasMore`    |

## Related Code Files

**Create**

- `lib/profile/resolve-target.ts` (~50) · `lib/profile/queries.ts` (~130) ·
  `lib/profile/hero-tier.ts` (~40) · `lib/profile/types.ts` (~50)
- `supabase/migrations/20260907010000_profile_read_layer.sql` — the definer view + its GRANTs

**Read for context (do not modify)**

- `lib/supabase/server.ts` — `createClient()`, `await cookies()`
- Batch A's board mapper and cursor helper — imported, never copied (`GUI_006`)
- `supabase/migrations/20260714070000_profile_schema.sql` — the existing permissive policies

**Modify** — none. `queries.ts` must not be imported from a client component; keep the
`server-only` marker on it.

## Implementation Steps

1. **Gate:** confirm Batch A phase 0 is applied —
   `psql -c "\dp public.profiles"` must show column-scoped `UPDATE` for `authenticated`. If it still
   shows unrestricted UPDATE, **stop and report BLOCKED**; do not re-plan or re-apply the fix here.
2. `types.ts` — declare the four shapes. Import the board's card type; do not re-declare it.
3. `resolve-target.ts` — pure function over the awaited `searchParams` object. Handle in this order:
   key absent → self; value `""` → self; value is `string[]` → notFound; fails the UUID pattern →
   notFound; equals caller → **self**; otherwise other.
4. `hero-tier.ts` — two functions, two denominators. **Blocked on [Q3b](./clarifications.md)** for
   the tier thresholds; the star thresholds (10/20/50) are given by `GUI_001`.
5. Write the migration. `revoke` before `grant`, both explicit. Verify with `\dp` that `anon` holds
   nothing on the view.
6. `queries.ts` — one exported function per bullet in the architecture. `getSentFeed` takes **no**
   target id; that absence is the `SEC_003` guarantee and must be stated in a comment so no future
   edit adds one "for symmetry".
7. Select an explicit column list everywhere. No `select *` — that is how `SEC_004` regresses.
8. Verify `SEC_002` by hand against the seed: sign in as the demo user, call the view, confirm the
   anonymous row is present and attributed to the caller.
9. `pnpm typecheck && pnpm lint`.

## Todo List

- [ ] Batch A phase 0 verified applied (or phase reported BLOCKED)
- [ ] `resolveProfileId` handles absent / empty / repeated / malformed / self-id / other
- [ ] Malformed id never reaches a query (no `22P02` reachable)
- [ ] Migration `revoke`s from `anon, authenticated` before granting
- [ ] `\dp` shows `anon` with no privilege on `kudos_sent_for_caller`
- [ ] `getSentFeed` has no target parameter, with the comment explaining why
- [ ] `getProfileStats` returns `null` for a non-caller target
- [ ] No `select *`; no email or `auth.users` id in any returned shape
- [ ] Board card type imported, not re-declared
- [ ] `status` field present on the card shape, unrendered
- [ ] Every `lib/profile/*.ts` under 200 lines

## Success Criteria

| ID      | Criterion                                   | Method                                                                |
| ------- | ------------------------------------------- | --------------------------------------------------------------------- |
| SC-B201 | Malformed ids resolve to notFound           | unit-shaped assertion in phase 03's spec: 4 malformed ids → 404       |
| SC-B202 | View is caller-scoped                       | `psql` as two different JWTs; row sets disjoint                       |
| SC-B203 | View GRANTs asserted                        | `\dp public.kudos_sent_for_caller` → `authenticated=r`, `anon` absent |
| SC-B204 | No leaked identifiers                       | `grep -rn "email\|auth\.users" lib/profile/` → zero hits              |
| SC-B205 | Own anonymous kudo present in own Sent list | manual check, step 8                                                  |
| SC-B206 | Sent count never rendered for a non-caller  | `getProfileStats` returns `null`; asserted in phase 04                |
| Size    | `wc -l lib/profile/*.ts`                    | every file < 200                                                      |

## Risk Assessment

| Risk                                                                                                         | Likelihood                           | Impact                   | Countermeasure                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Definer view created with `security_invoker = on` → returns nothing, or with no `WHERE` → returns everything | Medium                               | **Critical**             | SC-B202 tests it with two real JWTs, not by reading the DDL                                                   |
| Default ACL silently grants `anon` full privileges on the new view                                           | **High** (it is the project default) | **Critical**             | Explicit `revoke` is step 5 and a success criterion, not a review note                                        |
| A later edit adds a target parameter to `getSentFeed` "for symmetry"                                         | Medium                               | **Critical** (`SEC_003`) | The absence is documented in-code as the boundary; SC-B202 catches it                                         |
| `hero_badge` column used instead of the derived tier                                                         | Medium                               | Medium                   | [Q3](./clarifications.md) blocks the phase; the column is inert after A-p0                                    |
| Board mapper not yet merged (A-F002) → phase can't import the card type                                      | Medium                               | Medium                   | Declared a hard dependency; if absent, report BLOCKED rather than fork a second mapper                        |
| Feed pages duplicate/skip rows under concurrent inserts                                                      | Medium                               | Low                      | Reuse the board's keyset cursor unchanged; offset paging is forbidden (`FUN_013`)                             |
| Department join fails because DD-01 has not landed                                                           | Medium                               | Medium                   | Hard dependency in the table above; header falls back to no-department (`GUI_009`) if `department_id` is null |

## Security Considerations

- **The view's `WHERE` clause is the entire boundary.** A reviewer must read it first, before any
  component code in this batch.
- The base `kudos` SELECT policy stays `using (true)` — the anonymity leak at the data API is
  **not** closed by this phase, and [Q6](./clarifications.md) records that consciously. Do not claim
  anonymity is enforced project-wide.
- `getSession()` is banned project-wide; the caller identity comes from `getUser()`.
- No RLS policy is weakened anywhere in this phase. If a test needs a row it cannot see, the fixture
  changes, not the policy.
- Explicit column lists are the `SEC_004` control; `select *` reintroduces the leak the moment a
  column is added to `profiles`.

## Next Steps

Unblocks **phase 03** (route shell) and, through it, 04 and 05. Report the `\dp` output for the new
view and the two-JWT disjointness check as phase evidence.

## Rollback

`drop view if exists public.kudos_sent_for_caller;` (a new down-migration — never edit the applied
file) and `rm -rf lib/profile`. Nothing else reads either. No data is written by this phase, so
there is nothing to reconcile and no cascade.
