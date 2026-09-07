import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { psql } from "../support/psql";

/**
 * F006 secret-box reveal — MoMorph J3-4YFIpMM ("MỞ SECRET BOX THÀNH CÔNG"),
 * test cases 7c3c912f (click draws + decrements), 56da7ec8/3a8ac6b5 (badge +
 * counter render), d566fbeb (exactly one badge per click, BR-002/BR-004),
 * and 5cc072ad/2e7bec78 (no client-side manipulation survives a reopen).
 * Runs in `chromium-authed`, whose storageState signs in as the seeded admin
 * identity `demo.user@sun-asterisk.com` (00000000-0000-4000-8000-000000000001).
 *
 * Every test resets `boxes_unopened`/`boxes_opened` to a known value via a
 * direct SQL statement first, so the suite is deterministic and safe to
 * re-run — `open_secret_box()` permanently decrements a shared row on every
 * real draw. `test.describe.configure({ mode: "serial" })` is required:
 * `playwright.config.ts` sets `fullyParallel: true`, and these tests share
 * one profile row.
 */

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const AUTH_STATE = path.join(__dirname, "..", ".auth", "user.json");

function resetBoxCounts(unopened: number, opened: number) {
  psql(
    `update public.profiles set boxes_unopened = ${unopened}, boxes_opened = ${opened} where id = '${DEMO_USER_ID}';`,
  );
}

function countUnlocks(): number {
  return Number(psql(`select count(*) from public.user_icon_unlocks where user_id = '${DEMO_USER_ID}';`));
}

/**
 * The race test needs a draw outcome that is guaranteed to insert a NEW
 * unlock row so "exactly one badge" is verifiable without depending on which
 * of the six weighted icons gets drawn (BR-003: a repeat of an already-owned
 * icon still consumes the box but writes no second row). Clearing this
 * user's unlocks first removes that non-determinism from the assertion.
 */
function clearUnlocks() {
  psql(`delete from public.user_icon_unlocks where user_id = '${DEMO_USER_ID}';`);
}

async function openGiftDialog(page: Page) {
  await page.goto("/sun-kudos");
  await page.getByRole("button", { name: "Mở Secret Box" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("Secret Box reveal — F006", () => {
  test("clicking the box draws a badge and decrements the unopened count by exactly one", async ({ page }) => {
    resetBoxCounts(5, 10);
    await openGiftDialog(page);

    const count = page.getByTestId("secret-box-count");
    await expect(count).toHaveText("05");

    await page.getByTestId("secret-box-button").click();

    await expect(page.getByText("MỞ SECRET BOX THÀNH CÔNG")).toBeVisible();
    await expect(count).toHaveText("04");
    // The reveal panel shows the drawn badge's ARTWORK when its `image_url`
    // resolves, and falls back to `secret-box-badge-name` only when the image
    // is absent or fails to load (see secret-box-reveal-panel.tsx).
    //
    // This assertion used to target the NAME fallback, which only ever passed
    // because `secret_box_icons.image_url` points at `/profile/icons/icon-N.png`
    // and `public/profile/` did not exist — so every badge image 404'd. Those
    // six assets now ship, so the healthy image path is what renders, and
    // asserting it is the stronger check: it proves the drawn row's artwork is
    // actually reachable rather than silently degrading.
    await expect(page.getByTestId("secret-box-badge-image")).toBeVisible();
  });

  test("client-side counter tampering does not survive closing and reopening the dialog", async ({ page }) => {
    resetBoxCounts(5, 10);
    await openGiftDialog(page);

    const count = page.getByTestId("secret-box-count");
    await expect(count).toHaveText("05");

    // A genuine devtools-style tamper attempt, not an inspection-only assertion.
    await page.evaluate(() => {
      const node = document.querySelector('[data-testid="secret-box-count"]');
      if (node) node.textContent = "99";
    });
    await expect(count).toHaveText("99");

    await page.getByLabel("Đóng").click();
    await page.getByRole("button", { name: "Mở Secret Box" }).click();

    await expect(page.getByTestId("secret-box-count")).toHaveText("05");
  });

  test("two overlapping draws (separate sessions) against a single remaining box grant exactly one badge", async ({
    browser,
  }) => {
    resetBoxCounts(1, 10);
    clearUnlocks();

    const contextA = await browser.newContext({ storageState: AUTH_STATE });
    const contextB = await browser.newContext({ storageState: AUTH_STATE });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await Promise.all([openGiftDialog(pageA), openGiftDialog(pageB)]);
    await Promise.all([pageA.getByTestId("secret-box-button").click(), pageB.getByTestId("secret-box-button").click()]);

    // Whichever tab lost the race must show the server's real (unchanged)
    // rejection state, not a silently-optimistic decrement.
    await expect(pageA.getByTestId("secret-box-count")).toHaveText("00");
    await expect(pageB.getByTestId("secret-box-count")).toHaveText("00");

    expect(psql(`select boxes_unopened from public.profiles where id = '${DEMO_USER_ID}';`)).toBe("0");
    expect(countUnlocks()).toBe(1);

    await contextA.close();
    await contextB.close();
  });
});
