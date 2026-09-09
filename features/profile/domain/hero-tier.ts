export type { StarTier } from "@/features/kudos/domain/types";

/** Hero tier badges rendered on the profile keyvisual (matches the UI's
 *  `HeroBadgeVariant` union — see `components/common/hero-badge.tsx`). */
export type HeroTier = "new" | "rising" | "super" | "legend";

/**
 * Hero tier, derived at READ TIME from DISTINCT SENDERS (Q3/Q3b,
 * `plans/260907-1402-three-screen-gap-closure/clarifications.md`):
 * 1-4 -> new, 5-9 -> rising, 10-20 -> super, >20 -> legend. `null` for zero
 * senders — a Sunner with no Kudos has no badge at all, which differs from
 * the lowest tier (`TC_GUI_009`).
 *
 * The thresholds are copied from `lib/i18n/locales/vi/rules.json` (the
 * shipped rules drawer), the authoritative source — do not let this drift
 * from that copy. `profiles.hero_badge` is NOT read here: nothing computes
 * it, and it is non-user-writable (`PERM004`), so it is inert on this
 * screen.
 */
export function heroTierFromDistinctSenders(distinctSenderCount: number): HeroTier | null {
  if (distinctSenderCount > 20) return "legend";
  if (distinctSenderCount >= 10) return "super";
  if (distinctSenderCount >= 5) return "rising";
  if (distinctSenderCount >= 1) return "new";
  return null;
}

/**
 * Hoa-thi star tier, keyed on TOTAL Kudos received (10/20/50) — a distinct
 * denominator from the Hero tier above (`TC_GUI_001` Note: two different
 * denominators, deliberately). Re-exported from `lib/kudos/hashtags.ts`
 * rather than reimplemented (DRY).
 *
 * FLAG (not silently fixed): `starTier()`'s own docstring says "hearts-
 * received count (ALG-001: 10/20/50)", but the board's own call site
 * (`lib/kudos/board-query-helpers.ts` `fetchStarTiers`) already feeds it
 * `profile_kudo_stats.kudos_received` — a COUNT of Kudos received, not a SUM
 * of hearts — which is exactly what `TC_WEB_PROFILE_GUI_001` specifies for
 * this screen too. There is no behavioral divergence to reconcile between
 * the board and this profile read layer; the docstring on `starTier()` is
 * stale against its own call site. Reported here per clarifications.md
 * rather than edited, since `hashtags.ts` is a Batch A file this phase does
 * not own.
 */
export function starTierFromTotalReceived(receivedCount: number): 0 | 1 | 2 | 3 {
  if (receivedCount >= 50) return 3;
  if (receivedCount >= 20) return 2;
  if (receivedCount >= 10) return 1;
  return 0;
}
