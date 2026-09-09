import { cookies } from "next/headers";
import CustomSvgIcon from "@/shared/ui/custom-svg-icon";
import { cookieName, resolveLocale } from "@/shared/i18n/settings";
import type { ProfileStats } from "@/features/profile/domain/types";
import viProfile from "@/shared/i18n/locales/vi/profile.json";
import enProfile from "@/shared/i18n/locales/en/profile.json";

const STRINGS = { vi: viProfile, en: enProfile };

interface ProfileStatsCardProps {
  stats: ProfileStats;
}

function StatRow({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-2" data-testid={testId}>
      <span className="text-base font-bold text-white">{label}</span>
      <span className="text-[32px] leading-10 font-bold text-[#FFEA9E]">{value}</span>
    </div>
  );
}

/**
 * Self-only statistics card — FR-B401, `TC_GUI_004`/`TC_GUI_005`. The five
 * counters plus the divider mirror `components/kudos-board/sidebar-stats.tsx`'s
 * row shape and label wording (`GUI_008` parity) but are NOT that component:
 * labels here are SECOND-PERSON ("bạn"/"you"), which is exactly why this card
 * can never be reused on another Sunner's profile — see `getProfileStats`'s
 * null-off-self guard in `lib/profile/queries.ts`, the single source of truth
 * `app/profile/page.tsx` branches on to choose this card over
 * `ProfileWriteBar`. Do not "generalise" this component for reuse elsewhere.
 *
 * Server component, deliberately no `"use client"` — this card has zero
 * interactivity (the Secret Box button below is permanently disabled on this
 * screen, Q5 in clarifications.md; F006's one reveal entry point stays on the
 * board sidebar). Labels are read directly off the same locale JSON the
 * client i18next instance loads, since this codebase has no server-side
 * `t()` helper yet (see `profile-hero.tsx`'s note on the same gap).
 */
export default async function ProfileStatsCard({ stats }: ProfileStatsCardProps) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(cookieName)?.value);
  const t = STRINGS[locale].stats;

  return (
    <div
      data-testid="profile-stats-card"
      className="flex w-full flex-col items-start gap-4 rounded-[17px] border border-[#998C5F] bg-[#00070C] p-6 font-(family-name:--font-montserrat)"
    >
      <StatRow label={t.kudosReceived} value={stats.kudosReceived} testId="profile-stat-kudos-received" />
      <StatRow label={t.kudosSent} value={stats.kudosSent} testId="profile-stat-kudos-sent" />
      <StatRow label={t.heartsReceived} value={stats.heartsReceived} testId="profile-stat-hearts-received" />

      <div className="h-px w-full bg-[#2E3940]" />

      <StatRow label={t.secretBoxOpened} value={stats.boxesOpened} testId="profile-stat-secret-box-opened" />
      <StatRow label={t.secretBoxUnopened} value={stats.boxesUnopened} testId="profile-stat-secret-box-unopened" />

      {/* Q5 fallback (clarifications.md) — real counters above, but this
          entry point stays disabled: no second way into F006's reveal flow
          this batch. No onClick handler at all, so a click is a true no-op
          regardless of `disabled` support in the test runner. */}
      <button
        type="button"
        disabled
        data-testid="profile-open-secret-box"
        className="flex w-full cursor-not-allowed items-center justify-center gap-1 rounded-lg bg-[#FFEA9E] p-4 text-[22px] leading-7 font-bold text-[#00101A] opacity-40"
      >
        {t.openSecretBox}
        <CustomSvgIcon src="/kudos/icons/gift.svg" className="size-6" />
      </button>
    </div>
  );
}
