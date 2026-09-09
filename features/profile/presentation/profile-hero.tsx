"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import HeroBadge from "@/shared/ui/hero-badge";
import StarTierBadge from "@/features/kudos/presentation/board/star-tier-badge";
import { heroBadgeLabel } from "@/features/kudos/presentation/board/hero-badge-type";
import type { HeroTier } from "@/features/profile/domain/hero-tier";
import type { StarTier } from "@/features/kudos/domain/types";

/**
 * Fallback shown when a roster profile has no `avatar_url` (`TC_GUI_009`) —
 * the same file `supabase/seed.sql` seeds as the demo user's own
 * `avatar_url`, so one asset covers both the real seeded value and the
 * null-avatar placeholder (this phase's asset-gap note; no second
 * placeholder graphic was introduced).
 */
const PLACEHOLDER_AVATAR = "/profile/avatar-sample-1.png";

interface ProfileHeroProps {
  displayName: string;
  avatarUrl: string | null;
  department: string | null;
  /** `null` when the profile has zero distinct senders — no badge at all,
   *  which differs from the lowest tier (`TC_GUI_009`). */
  heroTier: HeroTier | null;
  /** `0` renders no stars (`StarTierBadge` itself renders nothing for 0). */
  starTier: StarTier;
}

/**
 * The keyvisual hero (FR-B303, `TC_GUI_001`/`TC_GUI_009`) — full-bleed
 * banner art, then an avatar/name/department/tier row pulled up over its
 * bottom edge. The banner is decorative artwork only: no nav bar and no
 * second name/avatar baked into it, unlike `KvBanner` (which bakes in its
 * own title lockup) — that is why this is a new component rather than a
 * reuse of `KvBanner`/`KeyvisualBanner`, both of which own screen-specific
 * text in the same slot. Reuses the board's existing keyvisual photograph
 * (no new art sourced for this screen) and the shared `HeroBadge` /
 * `StarTierBadge` (never re-implemented).
 *
 * Client component: this codebase's only translation mechanism is the
 * `react-i18next` hook (every existing presentational banner — `KvBanner`,
 * `KeyvisualBanner`, `StarTierBadge` — is `"use client"` for exactly this
 * reason); there is no server-side `t()` helper to call instead.
 */
export default function ProfileHero({ displayName, avatarUrl, department, heroTier, starTier }: ProfileHeroProps) {
  const { t } = useTranslation();

  return (
    <section className="relative flex w-full flex-col items-center">
      {/* mm:3_Keyvisual — decorative background art only. */}
      <div
        data-testid="profile-hero-banner"
        role="img"
        aria-label={t("profile:hero.bannerLabel")}
        className="h-64 w-full"
        style={{ background: "url(/kudos/kv/kv-background.png) center top / cover no-repeat" }}
      />

      {/* mm:A_Info — avatar/name/department/tier row, pulled up over the banner's bottom edge. */}
      <div className="relative z-10 -mt-12 flex flex-col items-center gap-2 px-6 text-center">
        <span
          data-testid="profile-avatar"
          className="relative block size-24 shrink-0 overflow-hidden rounded-full border-2 border-[#FFEA9E]"
        >
          <Image src={avatarUrl ?? PLACEHOLDER_AVATAR} alt={displayName} fill sizes="96px" className="object-cover" />
        </span>

        {/* Carries a testid because the viewed Sunner's name is NOT unique on
            this page — the write-Kudo bar names them, and every KUDOS feed card
            renders them in its person block (GUI_006). Specs must scope to the
            hero rather than match the name text page-wide. */}
        <p data-testid="profile-name" className="font-(family-name:--font-montserrat) text-xl font-bold text-[#FFEA9E]">
          {displayName}
        </p>

        {department && (
          <p data-testid="profile-department" className="text-sm text-white/70">
            {department}
          </p>
        )}

        {/* Testid for the same reason as the name above: `HeroBadge` and
            `StarTierBadge` are shared with the board's cards, so every KUDOS
            feed card renders its own copy (GUI_006). Specs must scope tier and
            star assertions to this row rather than match by alt text or badge
            testid page-wide — including the negative assertions, where an
            unscoped count would pick up feed cards' badges. */}
        <div data-testid="profile-hero-tiers" className="flex items-center gap-3">
          {heroTier && <HeroBadge type={heroTier} label={heroBadgeLabel(heroTier)} />}
          {starTier !== 0 && <StarTierBadge tier={starTier} />}
        </div>
      </div>
    </section>
  );
}
