import Image from "next/image";
import HeroBadge from "@/components/common/hero-badge";
import StarTierBadge from "@/components/kudos-board/star-tier-badge";
import { asHeroBadgeType, heroBadgeLabel } from "@/components/kudos-board/hero-badge-type";
import type { KudoPersonBlock, StarTier } from "@/lib/kudos/types";

/** No dedicated placeholder asset exists yet; every seeded `avatar_url` is
 *  non-null in practice, so this only guards the nullable DB column. */
const DEFAULT_AVATAR = "/kudos/feed/sender-avatar.png";

interface FeedPostPersonBlockProps {
  person: KudoPersonBlock;
  starTier?: StarTier;
}

// mm:256:4830 (componentSetId 2009:13867) — sender/receiver info block, reused
// as-is for both roles (profile pages don't exist, so it's a no-op display).
// Extracted from feed-kudo-post-card.tsx to keep that file under 200 lines.
export default function FeedPostPersonBlock({ person, starTier }: FeedPostPersonBlockProps) {
  return (
    <div className="flex w-58.75 flex-col items-center justify-center gap-3 text-center">
      <span className="relative block size-16 shrink-0 cursor-default overflow-hidden rounded-full border-[1.869px] border-white">
        <Image src={person.avatar_url ?? DEFAULT_AVATAR} alt="" fill className="object-cover" sizes="64px" />
      </span>
      <span className="flex w-full flex-col items-center gap-0.5">
        <span className="w-full cursor-default text-base font-bold tracking-[0.15px] text-[#00101A]">
          {person.display_name}
        </span>
        <span className="flex items-center justify-center gap-2.5">
          <span className="text-sm font-bold tracking-[0.1px] text-[#999]">{person.hero_code}</span>
          <HeroBadge
            type={asHeroBadgeType(person.hero_badge)}
            label={heroBadgeLabel(asHeroBadgeType(person.hero_badge))}
          />
        </span>
        {starTier ? <StarTierBadge tier={starTier} /> : null}
      </span>
    </div>
  );
}
