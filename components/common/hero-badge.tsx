import Image from "next/image";

/**
 * Hero-tier badge — Figma "danh hiệu" (componentSet 3007:17505): a 109×19,
 * fully-rounded pill with a 0.5px #FFEA9E border. The exported artwork already
 * bakes in each tier's gradient + label text, so it renders as-is — no color
 * overlay and no re-drawn text (doing either darkens/duplicates the design).
 * Shared by the Highlight carousel and the All-Kudos feed.
 *
 * "New Hero" has no exported artwork (figma-media lookup returned null), so it
 * falls back to a navy pill with the label — still correctly sized and bordered.
 */
export type HeroBadgeType = "new" | "rising" | "super" | "legend";

const BADGE_IMAGE: Partial<Record<HeroBadgeType, string>> = {
  rising: "/kudos/badges/rising-hero.png",
  super: "/kudos/badges/super-hero.png",
  legend: "/kudos/badges/legend-hero.png",
};

interface HeroBadgeProps {
  type: HeroBadgeType;
  /** Visible text on the "new" fallback; image alt text for the other tiers. */
  label: string;
}

export default function HeroBadge({ type, label }: HeroBadgeProps) {
  const image = BADGE_IMAGE[type];

  // mm:3106:17694 danh hiệu
  return (
    <span className="relative inline-flex h-[19px] w-[109px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[0.5px] border-[#FFEA9E]">
      {image ? (
        <Image src={image} alt={label} fill className="object-cover" sizes="109px" />
      ) : (
        <>
          <span className="absolute inset-0 bg-[#092432]" />
          <span className="relative text-[11px] leading-4 font-bold tracking-[0.08px] text-white">{label}</span>
        </>
      )}
    </span>
  );
}
