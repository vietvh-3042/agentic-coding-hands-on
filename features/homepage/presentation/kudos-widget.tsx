import { getHashtags } from "@/features/kudos/infrastructure/hashtags";
import WidgetButton from "./widget-button";

/**
 * Server wrapper that resolves the hashtag master list for `WidgetButton`'s
 * write-Kudo modal. Same split as `components/kudos-board/write-kudos-bar.tsx`:
 * `getHashtags()` is server-only (it reads cookies through the Supabase
 * server client), while the widget itself is a client component.
 *
 * Use this on pages that don't already fetch the list; a page that has it in
 * hand (`app/sun-kudos/page.tsx`) renders `WidgetButton` directly rather than
 * paying for a second identical query.
 *
 * NOTE: reading cookies makes the host route dynamically rendered.
 */
export default async function KudosWidget() {
  const hashtags = await getHashtags();
  return <WidgetButton hashtags={hashtags} />;
}
