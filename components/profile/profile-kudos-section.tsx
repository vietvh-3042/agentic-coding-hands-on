"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ProfileDirectionDropdown, { type ProfileFeedDirection } from "@/components/profile/profile-direction-dropdown";
import ProfileFeed from "@/components/profile/profile-feed";
import { useCopyLinkToast } from "@/components/kudos-board/use-copy-link-toast";
import { loadProfileFeedPage } from "@/app/profile/actions/load-profile-feed-page";
import type { Hashtag } from "@/lib/kudos/types";
import type { ProfileFeedPage } from "@/lib/profile/types";

interface ProfileKudosSectionProps {
  /** The profile being viewed — feeds `getReceivedFeed`'s `id` param only.
   *  Never forwarded for the Sent direction (`SEC_003` — see the Server
   *  Action's own doc comment). */
  targetId: string;
  /** Public regardless of self/other (`header.totalReceived`) — the board
   *  already shows anyone's received Kudos. */
  receivedCount: number;
  /** `null` off-self (`stats === null`, the SAME branch `ProfileStatsCard`/
   *  `ProfileWriteBar` key off in `app/profile/page.tsx`) — the single
   *  source of truth for `SEC_001`: no Sent option, no Sent count, anywhere
   *  in the render tree. */
  sentCount: number | null;
  /** Server-fetched page 1 of the default (Received) direction —
   *  `FUN_009` starts every viewer on Received. */
  initialFeed: ProfileFeedPage;
  hashtags: readonly Hashtag[];
}

/**
 * KUDOS section — FR-B501..512. Owns ALL of this screen's direction/paging
 * state (`direction`, the active page's `items`/`nextCursor`, in-flight
 * flags); `ProfileDirectionDropdown` and `ProfileFeed` are both purely
 * presentational and report back through callbacks.
 *
 * A monotonic `switchGenerationRef` is the single source of truth for "is
 * this the newest direction switch": every switch increments it, and a
 * resolving fetch (switch OR load-more) discards its result if the
 * generation has moved on since it was issued. This is what makes rapid
 * re-clicking (`FUN_011`) and a load-more that resolves after a switch both
 * safe without a second, parallel guard.
 */
export default function ProfileKudosSection({
  targetId,
  receivedCount,
  sentCount,
  initialFeed,
  hashtags,
}: ProfileKudosSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { copyLink, toast } = useCopyLinkToast();

  const [direction, setDirection] = useState<ProfileFeedDirection>("received");
  const [page, setPage] = useState<ProfileFeedPage>(initialFeed);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const switchGenerationRef = useRef(0);
  const isFetchingMoreRef = useRef(false);

  const options = [
    { value: "received" as const, label: t("profile:kudos.direction.received", { count: receivedCount }) },
    ...(sentCount !== null
      ? [{ value: "sent" as const, label: t("profile:kudos.direction.sent", { count: sentCount }) }]
      : []),
  ];

  const handleSelectDirection = useCallback(
    (next: ProfileFeedDirection) => {
      if (next === direction) return; // FUN_011 — re-picking the active option is a no-op.

      switchGenerationRef.current += 1;
      const generation = switchGenerationRef.current;
      setIsLoadingMore(true);

      loadProfileFeedPage(next, targetId, null)
        .then((result) => {
          if (switchGenerationRef.current !== generation) return; // a newer switch already won
          setDirection(next); // label updates only once the new page has actually loaded (FUN_010)
          setPage(result); // discards whatever pages the previous direction had accumulated
        })
        .catch(() => {
          // Best-effort: stay on the current direction rather than leaving
          // the trigger label and the feed disagreeing with each other.
        })
        .finally(() => {
          if (switchGenerationRef.current === generation) setIsLoadingMore(false);
        });
    },
    [direction, targetId],
  );

  const handleLoadMore = useCallback(() => {
    if (page.nextCursor === null || isFetchingMoreRef.current) return;
    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);

    const generation = switchGenerationRef.current;
    const cursor = page.nextCursor;

    loadProfileFeedPage(direction, targetId, cursor)
      .then((result) => {
        if (switchGenerationRef.current !== generation) return; // a direction switch discarded this page
        setPage((current) => ({ items: [...current.items, ...result.items], nextCursor: result.nextCursor }));
      })
      .catch(() => {
        // Best-effort infinite scroll (matches feed-list.tsx's own
        // convention): a failed page fetch just stops appending, the
        // sentinel stays mounted, and the next intersection retries.
      })
      .finally(() => {
        isFetchingMoreRef.current = false;
        if (switchGenerationRef.current === generation) setIsLoadingMore(false);
      });
  }, [direction, targetId, page.nextCursor]);

  const handleHashtagClick = useCallback(
    (tag: number) => {
      router.push(`/sun-kudos?tag=${tag}`);
    },
    [router],
  );

  const emptyMessage = direction === "received" ? t("kudosFeed:feed.empty") : t("profile:kudos.emptySent");

  return (
    <section
      className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 lg:px-0"
      data-testid="profile-kudos-section"
    >
      <ProfileDirectionDropdown options={options} active={direction} onSelect={handleSelectDirection} />

      <ProfileFeed
        key={direction}
        items={page.items}
        hashtags={hashtags}
        hasMore={page.nextCursor !== null}
        isLoadingMore={isLoadingMore}
        emptyMessage={emptyMessage}
        loadingMoreMessage={t("profile:kudos.loadingMore")}
        endOfFeedMessage={t("profile:kudos.endOfFeed")}
        onLoadMore={handleLoadMore}
        onHashtagClick={handleHashtagClick}
        onCopyLink={copyLink}
      />

      {toast}
    </section>
  );
}
