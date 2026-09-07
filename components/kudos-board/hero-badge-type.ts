import type { HeroBadgeType } from "@/components/common/hero-badge";

const VALID_TYPES: readonly string[] = ["new", "rising", "super", "legend"];

/**
 * Narrows a `profiles.hero_badge` DB value (plain `text`, no CHECK
 * constraint) to `HeroBadge`'s known tier set. Falls back to `"new"` for any
 * unexpected value — a defensive boundary check on data arriving from the
 * database, mirroring `hashtags.ts`'s row-shape validation.
 */
export function asHeroBadgeType(value: string): HeroBadgeType {
  return VALID_TYPES.includes(value) ? (value as HeroBadgeType) : "new";
}

/** Human label shown as the badge's fallback text / image alt. */
export function heroBadgeLabel(type: HeroBadgeType): string {
  switch (type) {
    case "rising":
      return "Rising Hero";
    case "super":
      return "Super Hero";
    case "legend":
      return "Legend Hero";
    case "new":
    default:
      return "New Hero";
  }
}
