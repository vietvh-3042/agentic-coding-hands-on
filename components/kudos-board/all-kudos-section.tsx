"use client";

import { useCopyLinkToast } from "@/components/kudos-board/use-copy-link-toast";
import FeedHeader from "@/components/kudos-board/feed-header";
import FeedList from "@/components/kudos-board/feed-list";
import SidebarPanel from "@/components/kudos-board/sidebar-panel";
import type { FeedPage, SidebarOverview } from "@/lib/kudos/board-queries";
import type { Hashtag } from "@/lib/kudos/types";

interface AllKudosSectionProps {
  initialFeed: FeedPage;
  hashtags: readonly Hashtag[];
  sidebar: SidebarOverview;
}

/**
 * `C_All kudos` (node 2940:13475) — section header + two-column layout: the
 * `C.2_Danh sách lời cảm ơn` feed on the left and `D_Thống menu phải`
 * sidebar on the right (node 2940:13481, gap:80px between the two columns).
 * Data is server-fetched by `app/sun-kudos/page.tsx` and handed down as
 * props; only the copy-link toast + infinite scroll stay client-side.
 */
export default function AllKudosSection({ initialFeed, hashtags, sidebar }: AllKudosSectionProps) {
  const { copyLink, toast } = useCopyLinkToast();

  return (
    // mm:2940:13475
    <section className="flex w-full flex-col items-center gap-10" aria-label="All Kudos">
      <FeedHeader />

      {/* mm:2940:13481 Frame 502 */}
      <div className="mx-auto flex w-full max-w-306 items-start gap-20 px-6">
        <div className="min-w-0 flex-1">
          <FeedList initialPage={initialFeed} hashtags={hashtags} onCopyLink={copyLink} />
        </div>
        <SidebarPanel overview={sidebar} />
      </div>

      {toast}
    </section>
  );
}
