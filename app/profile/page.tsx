import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/homepage/site-header";
import SiteFooter from "@/components/common/site-footer";
import ProfileHero from "@/components/profile/profile-hero";
import ProfileBadgeCollection from "@/components/profile/profile-badge-collection";
import ProfileStatsCard from "@/components/profile/profile-stats-card";
import ProfileWriteBar from "@/components/profile/profile-write-bar";
import ProfileKudosSection from "@/components/profile/profile-kudos-section";
import { createClient } from "@/lib/supabase/server";
import { resolveProfileId, type ProfileSearchParams } from "@/lib/profile/resolve-target";
import { getProfileHeader, getProfileStats, getUnlockedIcons } from "@/lib/profile/queries";
import { getReceivedFeed } from "@/lib/profile/feed-queries";
import { getHashtags } from "@/lib/kudos/hashtags";

// SAA brand font, exposed as --font-montserrat (same pattern as
// app/sun-kudos/page.tsx and app/award-info/page.tsx).
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Profile — Sun* Annual Awards 2025",
  description: "A Sunner's SAA 2025 profile — keyvisual hero, badge collection and Kudos history.",
};

interface ProfilePageProps {
  // Next.js 16 — `searchParams` is a Promise (established pattern, see
  // app/login/page.tsx).
  searchParams: Promise<ProfileSearchParams>;
}

/**
 * `/profile` — MoMorph screen 3FoIx6ALVb, phase 03 (route shell, keyvisual
 * hero, badge collection). `?id` resolution, 404 handling and the header
 * read all live in `lib/profile/*` (phase 02); this file is a composition
 * root only.
 *
 * `getUser()` runs before anything else, even though `proxy.ts`'s matcher
 * already keeps a signed-out caller off this route (`TC_ACC_001`'s own Note
 * asks for this as defense in depth, not the primary gate — mirrors
 * `SunKudosPage`'s `getViewerId()` redirect).
 */
export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const target = resolveProfileId(resolvedParams, user.id);
  if (target.kind === "notFound") notFound();

  const targetId = target.kind === "self" ? user.id : target.id;
  const isSelf = targetId === user.id;

  const [header, icons, stats, hashtags, receivedFeed] = await Promise.all([
    getProfileHeader(targetId),
    getUnlockedIcons(targetId),
    getProfileStats(targetId, user.id),
    getHashtags(),
    getReceivedFeed(targetId, null),
  ]);
  if (!header) notFound();

  return (
    <div className={`${montserrat.variable} relative min-h-screen w-full bg-[#00101A]`}>
      <SiteHeader />
      <main className="flex flex-col gap-16 pt-20 pb-24">
        <ProfileHero
          displayName={header.displayName}
          avatarUrl={header.avatarUrl}
          department={header.department}
          heroTier={header.heroTier}
          starTier={header.starTier}
        />

        <div className="mx-auto w-full max-w-6xl px-6 lg:px-0">
          <ProfileBadgeCollection icons={icons} isSelf={isSelf} />
        </div>

        {/* Phase 04 slot: stats card | write-Kudo bar — one ternary on
            `getProfileStats`'s null-off-self result decides the face; no
            second `isSelf` check here (see ProfileStatsCard's doc comment). */}
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-0">
          {stats ? (
            <ProfileStatsCard stats={stats} />
          ) : (
            <ProfileWriteBar recipient={{ id: header.id, displayName: header.displayName }} />
          )}
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-0">
          <ProfileKudosSection
            targetId={header.id}
            receivedCount={header.totalReceived}
            sentCount={stats ? stats.kudosSent : null}
            initialFeed={receivedFeed}
            hashtags={hashtags}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
