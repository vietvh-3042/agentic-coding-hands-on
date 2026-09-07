"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import KudosFormModal from "@/components/kudos/kudos-form-modal";

export interface ProfileWriteBarRecipient {
  id: string;
  displayName: string;
}

interface ProfileWriteBarProps {
  /** The Sunner being viewed — named in the bar's copy (`FUN_006`). */
  recipient: ProfileWriteBarRecipient;
}

/**
 * Write-Kudo bar — FR-B402/403, `TC_FUN_006`/`TC_FUN_007`. Fills the exact
 * page slot `ProfileStatsCard` fills on the caller's own profile; the two are
 * mutually exclusive (`app/profile/page.tsx`'s ternary on `getProfileStats`'s
 * result is the only branch — never a second `isSelf` check here). Narrower
 * sibling of `components/kudos/write-kudos-bar-button.tsx`: no search input,
 * because the recipient is already fixed to the Sunner being viewed.
 *
 * `TC_FUN_007` — opens the modal with this Sunner already selected as
 * recipient, via `KudosFormModalProps.recipient` (optional, `null` by
 * default, so the homepage and board compose flows are untouched). The field
 * stays editable and no suggestion list is popped open over it.
 */
export default function ProfileWriteBar({ recipient }: ProfileWriteBarProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-testid="profile-write-kudo-bar"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-[68px] border border-[#998C5F] bg-[#FFEA9E]/10 p-6 text-left transition-colors hover:bg-[#FFEA9E]/20"
      >
        <CustomSvgIcon src="/kudos/highlight/pen.svg" className="size-8 shrink-0 text-white" />
        <span className="font-(family-name:--font-montserrat) text-base leading-6 font-bold tracking-[0.15px] text-white">
          {t("profile:writeBar.label", { name: recipient.displayName })}
        </span>
      </button>

      <KudosFormModal open={open} onClose={() => setOpen(false)} recipient={recipient} />
    </>
  );
}
