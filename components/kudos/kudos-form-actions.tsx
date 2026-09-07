"use client";

import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";

export interface KudosFormActionsProps {
  /** False while any required field (FN-7) is still empty — gates "Gửi" only. */
  canSubmit: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * Modal footer — Figma mms_H_Frame 538 (I520:11647;520:9905): "Hủy" then the
 * primary "Gửi", 24px apart. The two buttons do NOT share a type scale in the
 * design — "Hủy" is 16px/24 with a 4px radius, "Gửi" is 22px/28 with an 8px
 * radius and fills the remaining width (502px at design width).
 */
export default function KudosFormActions({ canSubmit, submitting, onCancel, onSubmit }: KudosFormActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-stretch gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 rounded border border-[#998C5F] bg-[#FFEA9E]/10 px-10 py-4 text-base leading-6 font-bold tracking-[0.15px] text-[#00101A] hover:bg-[#FFEA9E]/20"
      >
        {t("kudos:cancel")}
        <CustomSvgIcon src="/icons/widget-close.svg" className="size-6" />
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFEA9E] p-4 text-[22px] leading-7 font-bold text-[#00101A] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,234,158,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {submitting ? t("kudos:submitting") : t("kudos:submit")}
        <CustomSvgIcon src="/kudos/icons/send.svg" className="size-6" />
      </button>
    </div>
  );
}
