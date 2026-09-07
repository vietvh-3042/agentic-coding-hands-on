import HeroBadge from "@/components/common/hero-badge";
import StarTierBadge from "@/components/kudos-board/star-tier-badge";
import { asHeroBadgeType, heroBadgeLabel } from "@/components/kudos-board/hero-badge-type";
import type { KudoPersonBlock, StarTier } from "@/lib/kudos/types";

const DEFAULT_AVATAR = "/kudos/feed/sender-avatar.png";

interface HighlightPersonInfoProps {
  person: KudoPersonBlock;
  starTier?: StarTier;
}

/**
 * Sender/receiver block — Figma "Infor" instance (256:4830). Extracted from
 * highlight-kudo-card.tsx to keep that file under 200 lines. Profile pages
 * don't exist yet, so avatar/name are non-interactive spans (matches
 * `FeedPostPersonBlock`; avoids dead tab stops).
 */
export default function HighlightPersonInfo({ person, starTier }: HighlightPersonInfoProps) {
  return (
    <div className="flex w-58.75 shrink-0 flex-col items-center gap-3.25">
      {/* mm:I2940:13465;335:9443;256:4734 MM_MEDIA_Avatar */}
      <span
        role="img"
        className="size-16 shrink-0 overflow-hidden rounded-full border-[1.869px] border-white bg-[#EEE] bg-cover bg-center"
        style={{ backgroundImage: `url(${person.avatar_url ?? DEFAULT_AVATAR})` }}
        aria-label={person.display_name}
      />
      <div className="flex flex-col items-center gap-0.5">
        {/* mm:I2940:13465;335:9443;256:4735 */}
        <span className="w-58.75 cursor-default text-center font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-[#00101A]">
          {person.display_name}
        </span>
        {/* mm:I2940:13465;335:9443;256:4741 Huy hiệu + Sao */}
        <div className="flex items-center justify-center gap-2.5">
          <span className="font-(family-name:--font-montserrat) text-sm leading-5 font-bold tracking-[0.1px] text-[#999999]">
            {person.hero_code}
          </span>
          <span aria-hidden className="size-1 rounded-full bg-[#999999] opacity-40" />
          {/* mm:I2940:13465;335:9443;3106:17694 danh hiệu badge */}
          <HeroBadge
            type={asHeroBadgeType(person.hero_badge)}
            label={heroBadgeLabel(asHeroBadgeType(person.hero_badge))}
          />
        </div>
        {starTier ? <StarTierBadge tier={starTier} /> : null}
      </div>
    </div>
  );
}
