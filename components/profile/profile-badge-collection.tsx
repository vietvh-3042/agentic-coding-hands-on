"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import type { ProfileIconSlot } from "@/lib/profile/types";

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
    <section aria-label={heading} className="flex flex-col gap-4">
      <h2 className="font-(family-name:--font-montserrat) text-lg font-bold text-[#FFEA9E]">{heading}</h2>
      <div className="flex flex-wrap gap-4">
        {icons.map((icon) => (
          <div
            key={icon.id}
            data-testid="badge-slot"
            data-locked={!icon.unlocked}
            className="relative size-16 shrink-0 overflow-hidden rounded-full border border-[#998C5F]"
          >
            <Image
              src={icon.imageUrl}
              alt={icon.name}
              fill
              sizes="64px"
              className={icon.unlocked ? "object-cover" : "object-cover opacity-40 grayscale"}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
