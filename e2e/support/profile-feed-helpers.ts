import { expect, type Locator, type Page } from "@playwright/test";
import { psql } from "./psql";

/**
 * Shared fixtures + feed-scrolling helpers for the `/profile` KUDOS section
 * specs (MoMorph screen 3FoIx6ALVb). Extracted so the three
 * `profile-kudos-*.spec.ts` files share one definition each instead of
 * copying them, and so no single spec file exceeds the project's 200-line
 * ceiling.
 */

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001"; // admin/demo — chromium-authed default
export const ORDINARY_USER_ID = "00000000-0000-4000-8000-000000000002"; // sender.one / Nathan Hunter
// Andrew Nelson — has received Kudos, reused from profile-access.spec.ts /
// profile-hero.spec.ts / profile-two-faces.spec.ts.
export const OTHER_USER_ID = "00000000-0000-4000-8000-000000000004";

export function readCounts(id: string): { received: number; sent: number } {
  const [received, sent] = psql(
    `select kudos_received, kudos_sent from public.profile_kudo_stats where id = '${id}';`,
  ).split("|");
  return { received: Number(received), sent: Number(sent) };
}

export async function feedKudoIds(page: Page, listTestId = "profile-feed-list"): Promise<string[]> {
  return page
    .getByTestId(listTestId)
    .locator("[data-kudo-id]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-kudo-id") ?? ""));
}

/** Scrolls the profile feed's sentinel until `kudoId` appears in the DOM —
 *  mirrors `e2e/board/hearts-toggle.spec.ts`'s own `revealFeedCard`, adapted
 *  to this section's testids. Position in the newest-first feed is not
 *  controlled by a caller, so this is genuinely sequential scrolling, not a
 *  missed `Promise.all` opportunity. */
export async function revealCard(page: Page, kudoId: string): Promise<Locator> {
  const feed = page.getByTestId("profile-feed-list");
  const card = feed.locator(`[data-kudo-id="${kudoId}"]`);

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 30; i += 1) {
    if ((await card.count()) > 0) return card;
    const sentinel = feed.getByTestId("profile-feed-sentinel");
    if ((await sentinel.count()) === 0) break;
    const before = (await feedKudoIds(page)).length;
    await sentinel.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await feedKudoIds(page)).length, { timeout: 5_000 }).toBeGreaterThan(before);
  }
  /* eslint-enable no-await-in-loop */

  throw new Error(`revealCard: kudo ${kudoId} never appeared in the feed after scrolling`);
}

/** Scrolls the profile feed's sentinel until it disappears (no more pages)
 *  or a safety cap is hit, returning the final set of loaded card ids. */
export async function scrollFeedToEnd(page: Page): Promise<string[]> {
  const feed = page.getByTestId("profile-feed-list");
  let ids = await feedKudoIds(page);

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 10; i += 1) {
    const sentinel = feed.getByTestId("profile-feed-sentinel");
    if ((await sentinel.count()) === 0) break;
    const before = ids.length;
    await sentinel.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await feedKudoIds(page)).length, { timeout: 10_000 }).toBeGreaterThan(before);
    ids = await feedKudoIds(page);
  }
  /* eslint-enable no-await-in-loop */

  return ids;
}
