import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Montserrat } from "next/font/google";
import SiteHeader from "@/features/homepage/presentation/site-header";
import KvBanner from "@/features/kudos/presentation/board/kv-banner";
import WriteKudosBar from "@/features/kudos/presentation/board/write-kudos-bar";
import HighlightSection from "@/features/kudos/presentation/board/highlight-section";
import SpotlightSection from "@/features/kudos/presentation/board/spotlight-section";
import AllKudosSection from "@/features/kudos/presentation/board/all-kudos-section";
import WidgetButton from "@/features/homepage/presentation/widget-button";
import SiteFooter from "@/shared/ui/site-footer";
import { getHashtags } from "@/features/kudos/infrastructure/hashtags";
import {
  getKudoFeedPage,
  getHighlightKudos,
  getSidebarOverview,
  getSpotlightBoard,
  getViewerId,
} from "@/features/kudos/infrastructure/board-queries";
import type { BoardFilter } from "@/features/kudos/domain/types";

// SAA brand font, exposed as --font-montserrat for the kudos-board components
// (same pattern as app/page.tsx and app/award-info/page.tsx).
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Sun* Kudos — Sun* Annual Awards 2025",
  description:
    "Sun* Kudos Live board — the SAA 2025 appreciation board: Highlight Kudos, Spotlight board and All Kudos.",
};

interface SunKudosPageProps {
  // Next.js 16 — `searchParams` is a Promise (established pattern, see
  // app/login/page.tsx).
  searchParams: Promise<{ tag?: string | string[] }>;
}

/** Parses the `?tag=` search param into a hashtag id, validating at the
 *  boundary — the raw value is untrusted client input. */
function parseHashtagParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

/**
 * Sun* Kudos Live board — Figma "Sun* Kudos - Live board" (2940:13431,
 * screen MaZUn5xHXZ). Server component: fetches the four board reads
 * (`lib/kudos/board-queries.ts`) plus the shared hashtag list, then hands
 * everything down as props. Reading `searchParams` opts the page into
 * dynamic rendering, which is correct here — the board is per-viewer
 * (`likedByMe`, `isOwnKudo`, sidebar stats).
 *
 * `/sun-kudos` sits behind `proxy.ts`'s auth guard (a deliberate, recorded
 * deviation from FR-101/FR-601's "no login required" — see plan.md "Known
 * deviations"), so `getViewerId()` returning `null` here means the session
 * expired between the guard's check and this render; redirecting to /login
 * is defense in depth, not the primary gate.
 */
export default async function SunKudosPage({ searchParams }: SunKudosPageProps) {
  const resolvedParams = await searchParams;
  const filter: BoardFilter = { hashtagId: parseHashtagParam(resolvedParams.tag), department: null };

  const viewerId = await getViewerId();
  if (!viewerId) {
    redirect("/login");
  }

  const [hashtags, feedPage, highlightKudos, spotlight, sidebar] = await Promise.all([
    getHashtags(),
    getKudoFeedPage({ cursor: null, filter, viewerId }),
    getHighlightKudos(filter, viewerId),
    getSpotlightBoard(),
    getSidebarOverview(viewerId),
  ]);

  return (
    <div className={`${montserrat.variable} relative min-h-screen w-full bg-[#00101A]`}>
      <SiteHeader />
      <main className="flex flex-col gap-20 pb-24">
        <KvBanner />
        <WriteKudosBar />
        <HighlightSection hashtags={hashtags} kudos={highlightKudos} />
        <SpotlightSection nodes={spotlight.nodes} totalCount={spotlight.totalCount} />
        <AllKudosSection key={filter.hashtagId ?? "all"} initialFeed={feedPage} hashtags={hashtags} sidebar={sidebar} />
      </main>
      <SiteFooter />
      <WidgetButton hashtags={hashtags} />
    </div>
  );
}
