import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import { DEMO_USER_ID, OTHER_USER_ID, revealCard } from "./support/profile-feed-helpers";

/**
 * Card rendering and per-card interactions. `GUI_006`, `GUI_007`, `FUN_014`, `FUN_015`.
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

test.describe("TC_WEB_PROFILE_GUI_006 — cards match the board's shape; anonymous sender masked on Received", () => {
  test("an anonymously-sent Kudo received by another Sunner masks the sender to Ẩn danh", async ({ page }) => {
    // Seeded anonymous row: sender …0005 -> receiver …0004 (OTHER_USER_ID).
    const anonymousKudoId = "20000000-0000-4000-8000-000000000004";

    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    const card = await revealCard(page, anonymousKudoId);

    await expect(card.getByText("Ẩn danh", { exact: true })).toBeVisible();
    // Same card structure as the board's `feed-kudo-post-card.tsx` — reused,
    // not forked (GUI_006).
    await expect(card.getByTestId("kudo-message")).toBeVisible();
    await expect(card.getByTestId("heart-button")).toBeVisible();
  });
});

test.describe("TC_WEB_PROFILE_GUI_007 — no Spam chip in either direction", () => {
  test("neither Received nor Sent renders a Spam chip", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByTestId("kudo-spam-chip")).toHaveCount(0);
    await expect(page.getByText("Spam", { exact: true })).toHaveCount(0);

    await page.getByTestId("profile-direction-trigger").click();
    await page.getByTestId("profile-direction-option-sent").click();
    await expect(page.getByTestId("kudo-spam-chip")).toHaveCount(0);
    await expect(page.getByText("Spam", { exact: true })).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_FUN_014 — hearts use the board's existing server action", () => {
  test("a heart click on a profile card increments the server-reported count", async ({ page }) => {
    const kudoId = psql(`
      select k.id from public.kudos k
      where k.sender_id <> '${DEMO_USER_ID}' and k.receiver_id = '${DEMO_USER_ID}' and k.is_spam = false
      and not exists (select 1 from public.kudo_hearts h where h.kudo_id = k.id and h.user_id = '${DEMO_USER_ID}')
      order by k.id limit 1;
    `);
    expect(kudoId).not.toBe("");
    const originalCount = Number(psql(`select hearts_count from public.kudos where id = '${kudoId}';`));

    try {
      await page.goto("/profile");
      const card = await revealCard(page, kudoId);
      const heart = card.getByTestId("heart-button");
      await expect(heart).toHaveAttribute("aria-pressed", "false");

      await heart.click();
      await expect(heart).toHaveAttribute("aria-pressed", "true");
      await expect(heart).toBeEnabled();

      const shownCount = Number(((await card.getByTestId("heart-count").textContent()) ?? "").replace(/\D/g, ""));
      expect(shownCount).toBe(originalCount + 1);
      expect(Number(psql(`select hearts_count from public.kudos where id = '${kudoId}';`))).toBe(originalCount + 1);
    } finally {
      psql(`delete from public.kudo_hearts where kudo_id = '${kudoId}' and user_id = '${DEMO_USER_ID}';`);
    }
  });
});

test.describe("TC_WEB_PROFILE_FUN_015 — hashtag navigates to the board; Copy Link shows its toast", () => {
  test("clicking a hashtag chip lands on /sun-kudos filtered by that tag", async ({ page }) => {
    await page.goto("/profile");
    const firstCard = page.getByTestId("profile-feed-list").locator("[data-kudo-id]").first();
    await expect(firstCard).toBeVisible();

    const chip = firstCard.getByRole("button").filter({ hasText: "#" }).first();
    test.skip((await chip.count()) === 0, "the first card on this run carries no hashtag chip");

    const label = (await chip.textContent())?.trim().replace(/^#/, "") ?? "";
    const hashtagId = psql(`select id from public.hashtags where name = '${label.replace(/'/g, "''")}';`);
    expect(hashtagId).not.toBe("");

    await chip.click();
    await expect(page).toHaveURL(new RegExp(`/sun-kudos\\?tag=${hashtagId}(?!\\d)`));
  });

  test("Copy Link shows the board's confirmation toast", async ({ page }) => {
    await page.goto("/profile");
    const firstCard = page.getByTestId("profile-feed-list").locator("[data-kudo-id]").first();
    await expect(firstCard).toBeVisible();

    await firstCard.getByRole("button", { name: "Copy Link" }).click();
    await expect(page.getByRole("status")).toHaveText("Link copied — ready to share!");
  });
});
