import { test, expect, type Locator, type Page } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * F004 kudo hearts — behavioral UI coverage (phase 08). Test cases:
 * `63645b03` (sender cannot like own kudos), `7a7ec63e` (like/unlike toggle
 * persists across reload), FR-402 (rapid clicks never desync). One-per-user
 * and the special-day multiplier are proven at the DB layer in
 * `hearts-security.spec.ts` instead, since those are RLS/trigger properties
 * a browser click can't exercise directly.
 *
 * Runs as the seeded admin identity (id …0001, `chromium-authed`). Target
 * kudos are picked at test time by excluding whatever this viewer has
 * already hearted — never a hardcoded row — so a dirtied dev DB (earlier
 * phases' e2e runs write real rows) can't desync this spec. `serial` mode
 * plus an explicit cleanup step around each test keeps two tests in this
 * file from racing onto the same target kudo.
 */

const ADMIN_USER_ID = "00000000-0000-4000-8000-000000000001";

function heartCountOf(kudoId: string): number {
  return Number(psql(`select hearts_count from public.kudos where id = '${kudoId}';`));
}

function heartRowCount(kudoId: string, userId: string): number {
  return Number(psql(`select count(*) from public.kudo_hearts where kudo_id = '${kudoId}' and user_id = '${userId}';`));
}

function ensureNotHearted(kudoId: string, userId: string): void {
  psql(`delete from public.kudo_hearts where kudo_id = '${kudoId}' and user_id = '${userId}';`);
}

/** Any kudo NOT sent by `userId` and not already hearted by them — picked
 *  fresh per call so a prior failed run's leftover heart just shifts the
 *  pick to the next eligible row instead of desyncing the test. */
function pickHeartableKudoId(userId: string, offset: number): string {
  const id = psql(`
    select k.id from public.kudos k
    where k.sender_id <> '${userId}'
    and k.is_spam = false
    and not exists (select 1 from public.kudo_hearts h where h.kudo_id = k.id and h.user_id = '${userId}')
    order by k.id
    limit 1 offset ${offset};
  `);
  if (!id) throw new Error(`pickHeartableKudoId: no eligible kudo found at offset ${offset}`);
  return id;
}

async function feedKudoIds(page: Page): Promise<string[]> {
  return page
    .getByTestId("feed-list")
    .locator("[data-kudo-id]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-kudo-id") ?? ""));
}

/** Scrolls the feed's infinite-scroll sentinel until the target kudo card is
 *  in the DOM (position in the newest-first feed is not controlled by this
 *  spec), then returns a locator scoped to that one card. */
async function revealFeedCard(page: Page, kudoId: string): Promise<Locator> {
  const feed = page.getByTestId("feed-list");
  const card = feed.locator(`[data-kudo-id="${kudoId}"]`);

  // Each iteration must wait for the previous page's append before deciding
  // whether to scroll for another — genuinely sequential, not a missed
  // `Promise.all` opportunity.
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < 30; i += 1) {
    if ((await card.count()) > 0) return card;
    const sentinel = feed.getByTestId("feed-sentinel");
    if ((await sentinel.count()) === 0) break;
    const before = (await feedKudoIds(page)).length;
    await sentinel.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await feedKudoIds(page)).length, { timeout: 5_000 }).toBeGreaterThan(before);
  }
  /* eslint-enable no-await-in-loop */

  throw new Error(`revealFeedCard: kudo ${kudoId} never appeared in the feed after scrolling`);
}

function parseCount(text: string | null): number {
  return Number((text ?? "").replace(/\D/g, ""));
}

test.describe.configure({ mode: "serial" });

test.describe("F004 — kudo hearts (UI)", () => {
  test("TC 63645b03 — the heart control is disabled on a kudo the viewer sent, and a click does nothing", async ({
    page,
  }) => {
    const ownKudoId = psql(
      `select id from public.kudos where sender_id = '${ADMIN_USER_ID}' order by created_at desc limit 1;`,
    );
    expect(ownKudoId).not.toBe("");

    await page.goto("/sun-kudos");
    const card = await revealFeedCard(page, ownKudoId);
    const heart = card.getByTestId("heart-button");

    await expect(heart).toBeDisabled();

    const before = heartRowCount(ownKudoId, ADMIN_USER_ID);
    await heart.click({ force: true }).catch(() => {
      // Expected: a disabled control may refuse the synthetic click outright.
    });
    expect(heartRowCount(ownKudoId, ADMIN_USER_ID)).toBe(before);
  });

  test("TC 7a7ec63e — hearting a kudo persists across reload, and unhearting reverts it", async ({ page }) => {
    const kudoId = pickHeartableKudoId(ADMIN_USER_ID, 0);
    ensureNotHearted(kudoId, ADMIN_USER_ID);
    const originalCount = heartCountOf(kudoId);

    try {
      await page.goto("/sun-kudos");
      let card = await revealFeedCard(page, kudoId);
      let heart = card.getByTestId("heart-button");

      await expect(heart).toHaveAttribute("aria-pressed", "false");
      await heart.click();
      await expect(heart).toHaveAttribute("aria-pressed", "true");
      // The optimistic update alone would already satisfy the two
      // assertions above before the write lands — wait for the control to
      // re-enable (the transition settling) so the reload below reads the
      // committed row, not a still-in-flight request.
      await expect(heart).toBeEnabled();
      expect(parseCount(await card.getByTestId("heart-count").textContent())).toBe(originalCount + 1);

      // Reload proves the DB write, not local component state.
      await page.reload();
      card = await revealFeedCard(page, kudoId);
      heart = card.getByTestId("heart-button");
      await expect(heart).toHaveAttribute("aria-pressed", "true");
      expect(parseCount(await card.getByTestId("heart-count").textContent())).toBe(originalCount + 1);

      await heart.click();
      await expect(heart).toHaveAttribute("aria-pressed", "false");
      await expect(heart).toBeEnabled();
      expect(parseCount(await card.getByTestId("heart-count").textContent())).toBe(originalCount);

      await page.reload();
      card = await revealFeedCard(page, kudoId);
      heart = card.getByTestId("heart-button");
      await expect(heart).toHaveAttribute("aria-pressed", "false");
      expect(parseCount(await card.getByTestId("heart-count").textContent())).toBe(originalCount);
    } finally {
      ensureNotHearted(kudoId, ADMIN_USER_ID);
    }
  });

  test("FR-402 — rapid clicks settle on one toggle, never a desynced count", async ({ page }) => {
    const kudoId = pickHeartableKudoId(ADMIN_USER_ID, 1);
    ensureNotHearted(kudoId, ADMIN_USER_ID);
    const originalCount = heartCountOf(kudoId);

    try {
      await page.goto("/sun-kudos");
      const card = await revealFeedCard(page, kudoId);
      const heart = card.getByTestId("heart-button");

      // Fired back-to-back without awaiting settlement — the 2nd/3rd clicks
      // land while the control is disabled mid-transition and are expected
      // to no-op rather than queue a second write.
      await heart.click();
      await heart.click({ force: true }).catch(() => {});
      await heart.click({ force: true }).catch(() => {});

      await expect(heart).toBeEnabled();
      await expect(heart).toHaveAttribute("aria-pressed", "true");
      expect(parseCount(await card.getByTestId("heart-count").textContent())).toBe(originalCount + 1);
      expect(heartRowCount(kudoId, ADMIN_USER_ID)).toBe(1);
    } finally {
      ensureNotHearted(kudoId, ADMIN_USER_ID);
    }
  });
});
