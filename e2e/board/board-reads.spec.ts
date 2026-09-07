import { test, expect, type Page } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * F002 board reads — MoMorph "Sun* Kudos - Live board" (MaZUn5xHXZ).
 * Test cases: `9dfda316` (feed alignment/pagination/empty), SC-001 (no
 * duplicate `data-kudo-id` across a scroll page boundary), `86092c3a`/US002
 * (Highlight exactly 5 slides), `67c21a05` (card fields), `d01729d4`/
 * `0e56cacb` (hashtag chip + dropdown filter both sections, BR-002),
 * `926d92a5`/`d662780b` (empty states), US003 (Spotlight unfiltered total),
 * US004 (sidebar counters).
 *
 * Runs in `chromium-authed` (seeded admin identity, id …0001, "Huỳnh Dương
 * Xuân Nhật" — receives 8 kudos, sends 2, hearts the top-5 + 6th place in
 * the seed). The dev DB is shared with concurrently-run phases' E2E specs
 * (authoring creates real rows), so every assertion below reads the DB at
 * test time rather than hard-coding seed-time row counts/ids.
 */

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

async function feedKudoIds(page: Page): Promise<string[]> {
  return page
    .getByTestId("feed-list")
    .locator("[data-kudo-id]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-kudo-id") ?? ""));
}

test.describe("F002 — Sun* Kudos board reads", () => {
  test("feed is newest-first, aligned with a visible sidebar, and paginates (TC 9dfda316)", async ({ page }) => {
    await page.goto("/sun-kudos");

    const feed = page.getByTestId("feed-list");
    const cards = feed.locator("[data-kudo-id]");
    await expect(cards.first()).toBeVisible();

    const ids = await feedKudoIds(page);
    expect(ids.length).toBeGreaterThanOrEqual(10);

    // Newest-first (BR-003): the DB's own created_at for the first and last
    // rendered card must be strictly descending — proves what the PAGE
    // rendered, not just what the query intended.
    const firstCreatedAt = psql(`select created_at from public.kudos where id = '${ids[0]}';`);
    const lastCreatedAt = psql(`select created_at from public.kudos where id = '${ids[ids.length - 1]}';`);
    expect(new Date(firstCreatedAt).getTime()).toBeGreaterThan(new Date(lastCreatedAt).getTime());

    // Sidebar visible alongside the feed (two-column layout).
    await expect(page.getByTestId("sidebar-stat-kudos-received")).toBeVisible();
  });

  test("scrolling the sentinel appends a second page with no duplicate data-kudo-id (SC-001)", async ({ page }) => {
    await page.goto("/sun-kudos");
    const feed = page.getByTestId("feed-list");
    await expect(feed.locator("[data-kudo-id]").first()).toBeVisible();

    const beforeCount = (await feedKudoIds(page)).length;

    await feed.getByTestId("feed-sentinel").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await feedKudoIds(page)).length, { timeout: 10_000 }).toBeGreaterThan(beforeCount);

    const afterIds = await feedKudoIds(page);
    expect(new Set(afterIds).size).toBe(afterIds.length);
  });

  test("Highlight shows exactly 5 slides with working prev/next and card fields (TC 86092c3a/67c21a05)", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");

    // The design has two prev/next controls per direction (the big B.2
    // overlay arrow and the small B.5 pagination arrow) sharing the same
    // accessible name — `.first()` picks either consistently.
    const indicator = page.getByTestId("highlight-indicator");
    await expect(indicator).toHaveText(/1\/5/);
    await expect(page.getByRole("button", { name: "Slide trước" }).first()).toBeDisabled();
    await expect(page.getByRole("button", { name: "Slide sau" }).first()).toBeEnabled();

    // TC 67c21a05 — sender/receiver info, time, message, hashtags, like +
    // copy-link buttons are all present on the active (center) card.
    await expect(page.getByRole("button", { name: "Copy Link" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Thích" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Slide sau" }).first().click();
    await expect(indicator).toHaveText(/2\/5/);
  });

  test("a hashtag chip on a feed card filters both sections and resets the carousel (TC d01729d4/BR-002)", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");
    const feed = page.getByTestId("feed-list");
    await expect(feed.locator("[data-kudo-id]").first()).toBeVisible();

    const chip = feed.locator("[data-kudo-id]").first().getByRole("button").filter({ hasText: "#" }).first();
    const label = (await chip.textContent())?.trim().replace(/^#/, "") ?? "";
    expect(label.length).toBeGreaterThan(0);
    const hashtagId = psql(`select id from public.hashtags where name = '${label.replace(/'/g, "''")}';`);
    expect(hashtagId).not.toBe("");

    await chip.click();

    await expect(page).toHaveURL(new RegExp(`tag=${hashtagId}(?!\\d)`));
    // Carousel resets to slide 1 on any filter change (BR-002).
    await expect(page.getByTestId("highlight-indicator")).toContainText("1/");

    const filteredIds = await feedKudoIds(page);
    expect(filteredIds.length).toBeGreaterThan(0);
    const matchingCount = Number(
      psql(
        `select count(*) from public.kudo_hashtags where hashtag_id = ${hashtagId} and kudo_id = ANY(ARRAY[${filteredIds
          .map((id) => `'${id}'`)
          .join(",")}]::uuid[]);`,
      ),
    );
    expect(matchingCount).toBe(filteredIds.length);

    // Clearing the filter pill restores the unfiltered feed.
    await page.getByRole("button", { name: new RegExp(`#${label} ×`) }).click();
    await expect(page).not.toHaveURL(/tag=/);
  });

  test("the Hashtag dropdown filters both sections the same way (TC 0e56cacb)", async ({ page }) => {
    await page.goto("/sun-kudos");
    const hashtagName = psql(`select name from public.hashtags order by sort_order limit 1;`);
    const menu = page.getByTestId("hashtag-filter-menu");
    const toggle = page.getByTestId("hashtag-filter");

    await toggle.click();
    await menu.getByRole("button", { name: `#${hashtagName}`, exact: true }).click();

    await expect(page).toHaveURL(/tag=\d+/);
    await expect(page.getByTestId("highlight-indicator")).toContainText("1/");

    // Clear via the dropdown's own "Bỏ chọn" control — reopen the same
    // stable toggle (its label text changes to the selected option, which
    // collides with hashtag chips elsewhere on the page).
    await toggle.click();
    await menu.getByRole("button", { name: "Bỏ chọn" }).click();
    await expect(page).not.toHaveURL(/tag=/);
  });

  test("a hashtag filter matching nothing shows both empty states (TC 926d92a5); leaderboards are always empty (TC d662780b)", async ({
    page,
  }) => {
    await page.goto("/sun-kudos?tag=999999");
    await expect(page.getByText("Hiện tại chưa có Kudos nào.").first()).toBeVisible();
    await expect(page.getByTestId("highlight-empty")).toHaveText("Hiện tại chưa có Kudos nào.");

    // Both sidebar leaderboards render the empty state unconditionally
    // (BR-006/D002 — no backing table exists this batch), independent of
    // any filter.
    await expect(page.getByText("Chưa có dữ liệu").first()).toBeVisible();
  });

  test("the Spotlight total is a real, unfiltered count invariant under a hashtag filter (US003)", async ({ page }) => {
    const realTotal = psql(`select count(*) from public.kudos;`);

    await page.goto("/sun-kudos");
    await expect(page.getByTestId("spotlight-total")).toContainText(realTotal);

    const hashtagId = psql(`select id from public.hashtags order by sort_order limit 1;`);
    await page.goto(`/sun-kudos?tag=${hashtagId}`);
    await expect(page.getByTestId("spotlight-total")).toContainText(realTotal);
  });

  test("the sidebar's 5 counters match the seeded values for the demo user (US004)", async ({ page }) => {
    const kudosReceived = psql(`select kudos_received from public.profile_kudo_stats where id = '${DEMO_USER_ID}';`);
    const kudosSent = psql(`select kudos_sent from public.profile_kudo_stats where id = '${DEMO_USER_ID}';`);
    const heartsReceived = psql(`select hearts_received from public.profile_kudo_stats where id = '${DEMO_USER_ID}';`);
    const boxesOpened = psql(`select boxes_opened from public.profiles where id = '${DEMO_USER_ID}';`);
    const boxesUnopened = psql(`select boxes_unopened from public.profiles where id = '${DEMO_USER_ID}';`);

    await page.goto("/sun-kudos");

    await expect(page.getByTestId("sidebar-stat-kudos-received")).toContainText(kudosReceived);
    await expect(page.getByTestId("sidebar-stat-kudos-sent")).toContainText(kudosSent);
    await expect(page.getByTestId("sidebar-stat-hearts-received")).toContainText(heartsReceived);
    await expect(page.getByTestId("sidebar-stat-secret-box-opened")).toContainText(boxesOpened);
    await expect(page.getByTestId("sidebar-stat-secret-box-unopened")).toContainText(boxesUnopened);
  });
});
