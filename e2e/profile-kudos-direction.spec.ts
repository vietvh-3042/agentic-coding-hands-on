import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import { DEMO_USER_ID, ORDINARY_USER_ID, OTHER_USER_ID, readCounts, feedKudoIds } from "./support/profile-feed-helpers";

/**
 * Direction dropdown: which options each face offers, and what switching or re-picking does. `FUN_009`, `SEC_001`, `SEC_002`, `FUN_010`, `FUN_011`.
 *
 * Part of the `/profile` KUDOS section (phase 05, MoMorph screen 3FoIx6ALVb);
 * shared fixtures/helpers live in `e2e/support/profile-feed-helpers.ts`.
 * `SEC_003` (two sessions' Sent lists are disjoint) is NOT automated — it
 * genuinely needs two live browser sessions (SC-B504, deferred to phase 07).
 *
 * Runs under `chromium-authed` (`playwright.config.ts` matches
 * `e2e/profile-*.spec.ts`). Default storageState is the seeded admin/demo
 * identity (`…0001`); tests needing the ordinary identity opt in with
 * `test.use({ storageState: "e2e/.auth/ordinary-user.json" })`.
 */

test.describe("TC_WEB_PROFILE_FUN_009 — direction dropdown (own profile)", () => {
  test("trigger reads Đã nhận (N); opening lists exactly two correctly-counted options", async ({ page }) => {
    const { received, sent } = readCounts(DEMO_USER_ID);

    await page.goto("/profile");

    const trigger = page.getByTestId("profile-direction-trigger");
    await expect(trigger).toHaveText(new RegExp(`Đã nhận \\(${received}\\)`));

    await trigger.click();
    const menu = page.getByTestId("profile-direction-menu");
    await expect(menu.getByTestId("profile-direction-option-received")).toHaveText(
      new RegExp(`Đã nhận \\(${received}\\)`),
    );
    await expect(menu.getByTestId("profile-direction-option-sent")).toHaveText(new RegExp(`Đã gửi \\(${sent}\\)`));
    await expect(menu.locator('[data-testid^="profile-direction-option-"]')).toHaveCount(2);
  });
});

test.describe("TC_WEB_PROFILE_SEC_001 — direction dropdown (another Sunner's profile)", () => {
  test("exactly one option; 'Đã gửi'/'Sent (' is absent from the whole page payload", async ({ page }) => {
    const { received } = readCounts(OTHER_USER_ID);

    const response = await page.goto(`/profile?id=${OTHER_USER_ID}`);
    const html = (await response?.text()) ?? "";
    expect(html).not.toMatch(/Đã gửi|Sent \(/);

    const trigger = page.getByTestId("profile-direction-trigger");
    await expect(trigger).toHaveText(new RegExp(`Đã nhận \\(${received}\\)`));
    await trigger.click();

    const menu = page.getByTestId("profile-direction-menu");
    await expect(menu.locator('[data-testid^="profile-direction-option-"]')).toHaveCount(1);
    await expect(menu.getByTestId("profile-direction-option-sent")).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_SEC_002 — own Sent list includes an anonymous send, attributed to the caller", () => {
  test.use({ storageState: "e2e/.auth/ordinary-user.json" });

  const RECEIVER_ID = OTHER_USER_ID;
  const FIXTURE_TAG = "e2e-fixture:profile-kudos-sec-002";

  test.beforeAll(() => {
    psql(`
      insert into public.kudos (sender_id, receiver_id, message, is_anonymous)
      values ('${ORDINARY_USER_ID}', '${RECEIVER_ID}', '${FIXTURE_TAG}', true);
    `);
  });

  test.afterAll(() => {
    psql(`delete from public.kudos where message = '${FIXTURE_TAG}';`);
  });

  test("the anonymous send shows the caller's real name; card count equals the label count", async ({ page }) => {
    const senderName = psql(`select display_name from public.profiles where id = '${ORDINARY_USER_ID}';`);
    const { sent } = readCounts(ORDINARY_USER_ID);
    expect(sent).toBeLessThanOrEqual(10); // keeps this a single-page assertion, no scrolling needed

    await page.goto("/profile");
    await page.getByTestId("profile-direction-trigger").click();
    await page.getByTestId("profile-direction-option-sent").click();
    await expect(page.getByTestId("profile-direction-trigger")).toHaveText(new RegExp(`Đã gửi \\(${sent}\\)`));

    const feed = page.getByTestId("profile-feed-list");
    const cards = feed.locator("[data-kudo-id]");
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(sent);

    const fixtureCard = feed.locator("[data-kudo-id]").filter({ hasText: FIXTURE_TAG });
    await expect(fixtureCard).toHaveCount(1);
    await expect(fixtureCard.getByText(senderName, { exact: true })).toBeVisible();
    await expect(page.getByText("Ẩn danh", { exact: true })).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_FUN_010 — switching direction discards pages and defers the label", () => {
  const FIXTURE_TAG = "e2e-fixture:profile-kudos-fun-010";
  const EXTRA_SENDER_IDS = [
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000003",
    "00000000-0000-4000-8000-000000000004",
    "00000000-0000-4000-8000-000000000005",
    "00000000-0000-4000-8000-000000000006",
  ];

  test.beforeAll(() => {
    const values = EXTRA_SENDER_IDS.map((id) => `('${id}', '${DEMO_USER_ID}', '${FIXTURE_TAG}')`).join(",\n");
    psql(`insert into public.kudos (sender_id, receiver_id, message) values ${values};`);
  });

  test.afterAll(() => {
    psql(`delete from public.kudos where message = '${FIXTURE_TAG}';`);
  });

  test("scrolling Received to page 2, then switching to Sent, replaces it with a fresh page 1", async ({ page }) => {
    const { sent } = readCounts(DEMO_USER_ID);
    test.skip(sent < 11, "needs more than one page of Sent Kudos to prove the old pages were discarded");

    await page.goto("/profile");
    const feed = page.getByTestId("profile-feed-list");
    const beforeCount = (await feedKudoIds(page)).length;
    expect(beforeCount).toBe(10);

    await feed.getByTestId("profile-feed-sentinel").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await feedKudoIds(page)).length, { timeout: 10_000 }).toBeGreaterThan(beforeCount);
    expect((await feedKudoIds(page)).length).toBeGreaterThan(10);

    await page.getByTestId("profile-direction-trigger").click();
    await page.getByTestId("profile-direction-option-sent").click();

    // The label reflects the switch only once settled — asserting the
    // FINAL state (not a mid-flight snapshot, which would be racy) still
    // proves it never got stuck on the stale value.
    await expect(page.getByTestId("profile-direction-trigger")).toHaveText(new RegExp(`Đã gửi \\(${sent}\\)`));
    const finalIds = await feedKudoIds(page);
    expect(finalIds).toHaveLength(10);
    expect(new Set(finalIds).size).toBe(finalIds.length);
  });
});

test.describe("TC_WEB_PROFILE_FUN_011 — re-picking the active option is a no-op", () => {
  test("no request is issued; the feed and label are untouched", async ({ page }) => {
    await page.goto("/profile");
    const feed = page.getByTestId("profile-feed-list");
    await expect(feed.locator("[data-kudo-id]").first()).toBeVisible();
    const beforeIds = await feedKudoIds(page);
    const beforeLabel = await page.getByTestId("profile-direction-trigger").textContent();

    let postRequestCount = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") postRequestCount += 1;
    });

    await page.getByTestId("profile-direction-trigger").click();
    const menu = page.getByTestId("profile-direction-menu");
    await expect(menu).toBeVisible();
    await page.getByTestId("profile-direction-option-received").click();
    await expect(menu).toBeHidden();

    expect(postRequestCount).toBe(0);
    expect(await feedKudoIds(page)).toEqual(beforeIds);
    await expect(page.getByTestId("profile-direction-trigger")).toHaveText(beforeLabel ?? "");
  });
});
