import Image from "next/image";

/** No backing table exists this batch (BR-006/D002) — both leaderboards
 *  always render their empty state, so this shape only matters if/when a
 *  later batch adds the real query. Defined here (not in a shared types
 *  file) since this is now its only consumer. */
export interface LeaderboardEntry {
  name: string;
  description: string;
  avatar: string;
}

interface SidebarLeaderboardProps {
  title: string;
  entries: readonly LeaderboardEntry[];
  emptyLabel: string;
}

/**
 * `D.3_10 SUNNER nhận quà` (node 2940:13510) — reusable leaderboard box, used
 * for both the "10 SUNNER NHẬN QUÀ MỚI NHẤT" list (populated from the design)
 * and the "10 SUNNER CÓ SỰ THĂNG HẠNG MỚI NHẤT" list (no matching box exists
 * in this frame of the design, so it renders the empty state per the task
 * brief instead of invented entries).
 */
export default function SidebarLeaderboard({ title, entries, emptyLabel }: SidebarLeaderboardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[17px] border border-[#998C5F] bg-[#00070C] py-6 pr-4 pl-6 font-(family-name:--font-montserrat)">
      {/* mm:2940:13513 D.3.1_title */}
      <h3 className="w-full text-center text-[22px] leading-7 font-bold whitespace-pre-line text-[#FFEA9E]">{title}</h3>

      {entries.length === 0 ? (
        <p className="w-full py-6 text-center text-sm text-[#999]">{emptyLabel}</p>
      ) : (
        <ul className="flex w-full flex-col items-start gap-4">
          {entries.map((entry, index) => (
            <li
              key={`${entry.name}-${index}`}
              // mm:256:7474 D.3.x_Thông tin Sunner nhận quà
              className="flex w-full items-center gap-2"
            >
              <span className="relative block size-16 shrink-0 overflow-hidden rounded-full border-[1.869px] border-white">
                <Image src={entry.avatar} alt="" fill className="object-cover" sizes="64px" />
              </span>
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="w-full truncate text-[22px] leading-7 font-bold text-[#FFEA9E]">{entry.name}</span>
                <span className="w-full truncate text-base font-bold text-white">{entry.description}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
