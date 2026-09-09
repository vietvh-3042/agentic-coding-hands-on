import type { ResolveTargetResult } from "@/features/profile/domain/types";

/** Canonical UUID shape gate (`TC_FUN_004`) — a non-UUID sent to a `uuid`
 *  column raises Postgres `22P02`, which would otherwise surface as a 500.
 *  This check runs before any query is issued, version-agnostic (accepts
 *  any of Postgres's own accepted UUID forms, not just v4).
 *
 *  Exported so every boundary that forwards a caller-supplied id into a query
 *  applies the SAME gate — `app/profile/actions/load-profile-feed-page.ts`
 *  validates its `targetId` and cursor id with it too, rather than carrying a
 *  second copy of this pattern that could drift from this one. */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The awaited shape of a Next.js App Router page's `searchParams` prop. */
export type ProfileSearchParams = Record<string, string | string[] | undefined>;

/**
 * Resolves `?id` against the signed-in caller's own id (FR-B201). Pure — no
 * DB access, so a malformed or repeated id never reaches a query.
 *
 * Order of checks (`plans/260906-1903-profile-and-menus/phase-02-profile-read-layer.md`
 * step 3):
 *   1. key absent -> self
 *   2. value is a `string[]` (repeated key, `?id=a&id=b`) -> notFound
 *      (`TC_FUN_005`) — checked before the empty-string case so a repeated
 *      key with an empty value is still refused, not silently treated as
 *      empty.
 *   3. value `""` -> self (a cleared query string is not an error)
 *   4. fails the UUID pattern -> notFound (`TC_FUN_004`)
 *   5. equals the caller's own id -> self (`TC_FUN_002`, canonicalization)
 *   6. otherwise -> other, with that id
 */
export function resolveProfileId(searchParams: ProfileSearchParams, callerId: string): ResolveTargetResult {
  const raw = searchParams.id;

  if (raw === undefined) return { kind: "self" };
  if (Array.isArray(raw)) return { kind: "notFound" };
  if (raw === "") return { kind: "self" };
  if (!UUID_PATTERN.test(raw)) return { kind: "notFound" };
  if (raw === callerId) return { kind: "self" };

  return { kind: "other", id: raw };
}
