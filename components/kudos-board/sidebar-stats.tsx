"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomSvgIcon from "@/components/common/custom-svg-icon";
import SidebarGiftDialog from "@/components/kudos-board/sidebar-gift-dialog";
import type { SidebarOverview } from "@/lib/kudos/board-queries";

interface SidebarStatsProps {
  overview: SidebarOverview;
}

function StatRow({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    // mm:256:6756 D.1.x_Số ... (shared row instance)
    <div className="flex w-full items-center justify-between gap-2" data-testid={testId}>
      <span className="text-base font-bold text-white">{label}</span>
      <span className="text-[32px] leading-10 font-bold text-[#FFEA9E]">{value}</span>
    </div>
  );
}

/** `D.1_Thống kê tổng quat` (node 2940:13489) — the top stats box in the sidebar. */
export default function SidebarStats({ overview }: SidebarStatsProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-[17px] border border-[#998C5F] bg-[#00070C] p-6 font-(family-name:--font-montserrat)">
      <StatRow
        label={t("kudosFeed:stats.kudosReceived")}
        value={overview.kudosReceived}
        testId="sidebar-stat-kudos-received"
      />
      <StatRow label={t("kudosFeed:stats.kudosSent")} value={overview.kudosSent} testId="sidebar-stat-kudos-sent" />

      {/* mm:3241:14882 D.1.4_Số tim — the "x2" badge's real source is
          `event_settings.special_day_*` being active right now. */}
      <div className="flex w-full items-center justify-between gap-2" data-testid="sidebar-stat-hearts-received">
        <span className="text-base font-bold text-white">{t("kudosFeed:stats.heartsReceived")}</span>
        <span className="flex items-center gap-2">
          {overview.heartsMultiplierActive && (
            <span className="text-lg font-bold text-white [-webkit-text-stroke:1px_#000]">x2</span>
          )}
          <span className="text-[32px] leading-10 font-bold text-[#FFEA9E]">{overview.heartsReceived}</span>
        </span>
      </div>

      {/* mm:2940:13494 D.1.5_phân cách nội dung */}
      <div className="h-px w-full bg-[#2E3940]" />

      <StatRow
        label={t("kudosFeed:stats.secretBoxOpened")}
        value={overview.secretBoxOpened}
        testId="sidebar-stat-secret-box-opened"
      />
      <StatRow
        label={t("kudosFeed:stats.secretBoxUnopened")}
        value={overview.secretBoxUnopened}
        testId="sidebar-stat-secret-box-unopened"
      />

      {/* mm:2940:13497 D.1.8_Button mở quà */}
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#FFEA9E] p-4 text-[22px] leading-7 font-bold text-[#00101A]"
      >
        {t("kudosFeed:stats.openSecretBox")}
        <CustomSvgIcon src="/kudos/icons/gift.svg" className="size-6" />
      </button>

      {dialogOpen && (
        <SidebarGiftDialog unopenedCount={overview.secretBoxUnopened} onClose={() => setDialogOpen(false)} />
      )}
    </div>
  );
}
