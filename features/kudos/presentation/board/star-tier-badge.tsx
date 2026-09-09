import { useTranslation } from "react-i18next";
import type { StarTier } from "@/features/kudos/domain/types";

interface StarTierBadgeProps {
  tier: Exclude<StarTier, 0>;
}

const TIER_KEYS = { 1: "tier1", 2: "tier2", 3: "tier3" } as const;

/**
 * BR-001 — a Sunner's star-tier badge (1-3 stars), shown once their
 * received-kudos count crosses the first threshold (10/20/50, `starTier()`
 * in `lib/kudos/hashtags.ts`). Tier 0 renders nothing — no star element
 * exists below the first threshold. Tooltip copy is verbatim from the
 * functional spec § 13 (native `title` attribute — no hover-state plumbing
 * needed for a one-line tooltip).
 */
export default function StarTierBadge({ tier }: StarTierBadgeProps) {
  const { t } = useTranslation();
  const tooltip = t(`kudosBoard:starTier.${TIER_KEYS[tier]}`);

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      data-testid="star-tier-badge"
      className="text-sm font-bold tracking-[0.1px] text-[#FFEA9E]"
    >
      {"★".repeat(tier)}
    </span>
  );
}
