"use client";

import { useTranslation } from "react-i18next";
import SidebarStats from "@/components/kudos-board/sidebar-stats";
import SidebarLeaderboard from "@/components/kudos-board/sidebar-leaderboard";
import type { SidebarOverview } from "@/lib/kudos/board-queries";

interface SidebarPanelProps {
  overview: SidebarOverview;
}

/**
 * `D_Thống menu phải` (node 2940:13488) — the right sidebar column: stats box
 * + the two leaderboards. Sticky so it stays visible while the (much taller)
 * feed column scrolls, matching the common "sidebar shorter than main
 * content" layout seen in the design. Both leaderboards render their empty
 * state (BR-006/D002) — no backing table exists this batch.
 */
export default function SidebarPanel({ overview }: SidebarPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="flex w-105.5 shrink-0 flex-col items-start gap-6">
      <SidebarStats overview={overview} />
      <SidebarLeaderboard
        title={t("kudosFeed:leaderboard.risingTitle")}
        entries={[]}
        emptyLabel={t("kudosFeed:leaderboard.empty")}
      />
      <SidebarLeaderboard
        title={t("kudosFeed:leaderboard.giftTitle")}
        entries={[]}
        emptyLabel={t("kudosFeed:leaderboard.empty")}
      />
    </aside>
  );
}
