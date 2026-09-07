import { getHashtags } from "@/lib/kudos/hashtags";
import WriteKudosBarButton from "@/components/kudos/write-kudos-bar-button";

/**
 * Give-kudos pill — Figma "A.1_Button ghi nhận" (2940:13449). An async server
 * component: it resolves the 13 canonical hashtag rows once (`getHashtags()`
 * is server-only — it transitively imports `next/headers`) and hands them to
 * the interactive client piece. `WriteKudosBar` itself keeps zero props, so
 * `app/sun-kudos/page.tsx` (owned by phase 06) needs no wiring change to pick
 * up the real hashtag picker — one fetch, two consumers (the board's filter
 * dropdown fetches the same rows separately).
 */
export default async function WriteKudosBar() {
  const hashtags = await getHashtags();
  return <WriteKudosBarButton hashtags={hashtags} />;
}
