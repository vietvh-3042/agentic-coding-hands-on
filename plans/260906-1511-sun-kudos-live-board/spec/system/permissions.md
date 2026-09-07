---
status: draft
authored_by: takumi
created: 2026-09-06
lang: en
---

# Permissions

**Project**: Sun* Annual Awards 2025 (SAA 2025)
**Generated**: 2026-09-06
**Analysis Scope**: forward-draft extension of `docs/system/permissions.md` (F001_GoogleSignIn,
implemented) to cover Batch A — F002_KudosBoardData, F003_KudoAuthoring, F004_KudoHearts,
F005_HashtagTaxonomy, F006_SecretBoxReveal — plus the phase-0 `profiles` privilege-escalation
hardening. Everything the promoted document states about the session gate stays true unchanged.

> **Draft scope:** as in the promoted document, raw `PERM###` codes are not minted yet — a matrix
> does not exist until Batch A is implemented and `permissions-matrix.md` is generated from real
> guard code. Every claim below is checked against either a technical spec, the live local schema
> (`docker exec supabase_db_mock-aidd-kudo-app psql`, 2026-09-06), or the dedicated security report
> in this plan's `reports/` folder. Anything genuinely not yet built is marked **planned**.

## Authorization System Type

**System Type**: `hybrid` — this is a change from the promoted document's `other` (pure binary
session gate). Batch A keeps the binary session gate for route access unchanged, and layers
**ownership-based** write checks on top of it: a write succeeds only when the acting row (a kudo, a
heart, a hashtag join) belongs to the caller. No route or UI element in this batch's scope branches
on `profiles.role` — that column exists and is being hardened this batch, but the admin surface that
reads it (`Dropdown-profile Admin`, screenId `54rekaCHG1`) is explicitly Batch B, out of scope here.

**Identified Roles**: `profiles.role ∈ {user, admin}` exists as a column (added
`20260723091000_profiles_role.sql`) and every signed-in Sun* member currently has one, but this
batch defines **no code path that reads or gates on it** — every Batch A action treats an
authenticated member uniformly, distinguished only by which rows they own. Role-based gating begins
in Batch B.

## Curated View

- _*Any Sun* member with a valid Google account_*, once signed in, can still reach every route the
  app exposes (unchanged) — plus, on `/sun-kudos`, they can now: submit a kudo they author
  (`kudos.sender_id = auth.uid()`), heart or un-heart any kudo they did not send, pick up to 5
  hashtags for their own kudo, and open a secret box while `boxes_unopened > 0`.
- **A member cannot heart their own kudo** — enforced both by a disabled client-side control and by
  an `auth.uid() <> kudos.sender_id` RLS check on the `kudo_hearts` INSERT policy (already live,
  confirmed by `pg_policies`).
- **A member cannot write another member's hashtag join row** — `kudo_hashtags` INSERT (planned,
  new policy) restricts the write to `auth.uid() = (select sender_id from kudos where id =
kudo_id)`, mirroring the existing `kudos insert by sender` shape.
- **No member can insert a `user_icon_unlocks` row directly, even their own.** That table has only a
  SELECT policy today (confirmed live) — the write path is reserved for the planned
  `security definer` RPC, which runs as the function owner and is not subject to the caller's RLS
  at all.
- **An unauthenticated visitor** is unchanged at the route level — `/sun-kudos` is not in
  `proxy.ts`'s `isPublicPath()` allowlist, so it still redirects to `/login` before rendering. Note
  the mismatch this creates with the data layer, below.
- **Data-layer reads are wider than route access.** `profiles`, `kudos`, `kudo_hearts`,
  `event_settings`, `secret_box_icons`, and `user_icon_unlocks` all carry a
  `for select to anon, authenticated using (true)` policy (confirmed live on every one of the 7
  existing tables) — a direct API call with no session can read all of this data even though the
  web route itself is gated. This is the same "permissive read for local dev" shape the schema
  migrations' own comments flag — it is a pre-existing condition Batch A does not change, and the
  planned `hashtags`/`kudo_hashtags` tables are designed to match it (public SELECT, restricted
  write).

## Access Boundaries

**Ownership checks — already live, unchanged by this batch (do not re-describe as new):**

| Table         | Operation | Boundary                                                                      |
| ------------- | --------- | ----------------------------------------------------------------------------- |
| `kudos`       | INSERT    | `sender_id = auth.uid()`                                                      |
| `kudo_hearts` | INSERT    | `user_id = auth.uid()` AND `auth.uid() <> kudos.sender_id` (self-heart guard) |
| `kudo_hearts` | DELETE    | own row only                                                                  |

**Ownership checks — planned, part of Batch A:**

| Table               | Operation          | Boundary                                                                                                                                         | Status                                                            |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `kudo_hashtags`     | INSERT             | `auth.uid() = kudos.sender_id` for the referenced kudo                                                                                           | planned — new policy, written as part of F003's submission action |
| `hashtags`          | SELECT             | `anon, authenticated` — no write policy planned; the master list is admin/seed-only for this batch                                               | planned                                                           |
| `kudo_hashtags`     | SELECT             | `anon, authenticated`                                                                                                                            | planned                                                           |
| `user_icon_unlocks` | INSERT (effective) | via `security definer` RPC only — the RPC runs as its owner and bypasses the caller's RLS entirely; no direct-client INSERT policy is ever added | planned                                                           |
| `profiles`          | UPDATE (columns)   | narrowed from unrestricted to `display_name, avatar_url, language` only                                                                          | planned — phase-0 hardening, **not yet applied to the live DB**   |

**The pre-existing privilege-escalation hole this batch's phase-0 fixes (must be fixed before this
batch's other work per `clarifications.md`):** `profiles` has exactly one UPDATE policy
(`auth.uid() = id`), with **no column restriction** — confirmed live: any authenticated user can
today run `profiles.update({role:'admin'})` on their own row, and the same gap covers
`boxes_opened`, `boxes_unopened`, and `hero_badge`. The chosen fix is column-level GRANTs:
`REVOKE UPDATE ON profiles FROM authenticated, anon;` then `GRANT UPDATE (display_name, avatar_url,
language) ON profiles TO authenticated;`. As of 2026-09-06 this fix is **not yet applied** — the
live grant table still shows `authenticated` and `anon` both holding unrestricted `UPDATE` on
`profiles` from the schema's default ACL.

**IMPORTANT — the default ACL is not a safety boundary anywhere in this project, and this matters
more with every table Batch A adds.** A pre-existing, postgres-owned default ACL on schema `public`
grants `INSERT/SELECT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` to **both** `anon` and
`authenticated` on every table — confirmed live, e.g. `profiles` shows all seven privilege types
granted to both roles regardless of any RLS policy. RLS is therefore the **only** real access
control on this project; table GRANTs are not a second line of defense and are not safely
inherited. This must be re-checked for every table Batch A adds:

- `hashtags` — planned SELECT-only-by-design policy; the table will still carry the same wide
  default-ACL GRANT underneath it, so the SELECT/no-write policy pair is the entire boundary.
- `kudo_hashtags` — same: the planned INSERT policy (`auth.uid() = kudos.sender_id`) is the entire
  write boundary; the default ACL grants INSERT to `anon`/`authenticated` regardless.

**No field-level restriction existed anywhere in scope before this batch.** This batch introduces
the first one: `profiles`'s planned column-level GRANT (above). Every other write boundary in this
batch (kudos, kudo_hearts, kudo_hashtags) remains row-level, not column-level.

## Special Conditions

- No feature-flag, experiment, env-gate, or locale-gate condition applies to any Batch A action —
  unchanged from the promoted document.
- **New time-based condition, distinct from the existing launch-date gate:** F004's heart multiplier
  reads an admin-configured "special day" range, planned as new columns on `event_settings` (not yet
  in the live schema — confirmed absent 2026-09-06). `event_settings` is the singleton config table
  and already carries a read-only-to-all RLS shape (SELECT only, no write policy for any
  non-privileged role) — so the multiplier can never be client-supplied, only read server-side by
  the planned `heartKudo` action. This is a **value** gate (1 vs 2 hearts granted), never a
  **permission** gate — it never changes whether hearting is allowed.
- The existing `isBeforeLaunch()` time gate (affects where an authenticated member redirects after
  sign-in) is unrelated to and unaffected by the new special-day window above.
- **`profiles.role` exists but gates nothing in this batch's scope.** The column is being hardened
  (see phase-0 above) precisely so that Batch B's admin surface can rely on it, but no route,
  Server Action, or RPC in F002–F006 reads `role` to make an authorization decision. Flag this
  explicitly so a future reviewer does not assume an admin gate exists yet.

## Unresolved

- The phase-0 `profiles` hardening migration is not yet written — this document describes the
  agreed fix shape (column-level GRANT), not applied code. Confirm it lands before Batch A's other
  migrations, per `clarifications.md`.
- `event_settings`'s special-day column shape (a date range vs. a list of discrete dates) is
  undecided — affects F004's `heartKudo` implementation, not this permissions model.
- Whether `/sun-kudos` should ever be reachable by an anonymous visitor (matching the data layer's
  already-public reads) or stay fully route-gated is a product question this batch does not
  resolve — flagged here because the two layers currently disagree.
