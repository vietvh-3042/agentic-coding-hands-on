"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { ProfileIconSlot } from "@/features/profile/domain/types";

interface ProfileBadgeCollectionProps {
  /** Always exactly 6 rows, in `sort_order` — `getUnlockedIcons` never
   *  returns a partial or reordered list (`TC_GUI_002`). */
  icons: ProfileIconSlot[];
  /** Picks the heading copy — first-person on the caller's own profile,
   *  neutral on someone else's (`TC_GUI_003`). */
  isSelf: boolean;
}

/**
 * The six-slot badge collection (FR-B304/305, `TC_GUI_002`/`003`). Every
 * slot renders the real `secret_box_icons` artwork; a locked slot is
 * greyed via CSS filter over that same image rather than a blank
 * placeholder, so it lights up later with no reshaping once
 * `user_icon_unlocks` gains a row for it.
 *
 * Client component for the same reason as `ProfileHero` — `react-i18next`'s
 * hook is this codebase's only translation mechanism.
 */
export default function ProfileBadgeCollection({ icons, isSelf }: ProfileBadgeCollectionProps) {
  const { t } = useTranslation();
  const heading = t(isSelf ? "profile:badges.headingSelf" : "profile:badges.headingOther");

  return (
    <section aria-label={heading} className="w-full overflow-x-auto">
      <div className="mx-auto grid max-w-230 min-w-210 grid-cols-6 gap-4 px-1">
        {icons.map((icon) => (
          <figure
            key={icon.id}
            data-testid="badge-slot"
            data-locked={!icon.unlocked}
            className="flex min-w-0 flex-col items-center gap-3 text-center"
          >
            <div className={`relative size-25 shrink-0 overflow-hidden rounded-full border-[3px] border-white`}>
              <Image src={icon.imageUrl} alt="" fill sizes="100px" className="object-cover" />
            </div>

            <figcaption className="max-w-31 font-(family-name:--font-montserrat) text-[18px] leading-6 font-bold tracking-[0.02em] text-white uppercase">
              {icon.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
