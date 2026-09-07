import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import viProfile from "../lib/i18n/locales/vi/profile.json";
import viKudos from "../lib/i18n/locales/vi/kudos.json";

/**
 * The two faces of `/profile`'s statistics slot (phase 04, MoMorph screen
 * 3FoIx6ALVb) — `TC_WEB_PROFILE_GUI_004/005`, `TC_WEB_PROFILE_FUN_006/007/008`.
 *
 * Runs under `chromium-authed` (`playwright.config.ts` already matches
 * `e2e/profile-*.spec.ts` — no config change needed). Default storageState is
 * the seeded admin/demo identity (`00000000-0000-4000-8000-000000000001`).
 *
 * `TC_WEB_PROFILE_FUN_007`'s recipient-pre-selection requirement is BLOCKED:
 * FUN_007 is asserted in full: the modal opens with the viewed Sunner already
 * selected as recipient, the field stays editable, and no suggestion list is
 * popped open over the pre-filled value. `KudosFormModal` takes an optional
 * `recipient` prop (`null` by default), so the homepage and board compose
 * flows are unchanged.
 */

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
// Andrew Nelson — a second Sunner with received Kudos (reused from profile-access.spec.ts).
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000004";

const STAT_LABELS_VI = [
  viProfile.stats.kudosReceived,
  viProfile.stats.kudosSent,
  viProfile.stats.heartsReceived,
  viProfile.stats.secretBoxOpened,
  viProfile.stats.secretBoxUnopened,
  viProfile.stats.openSecretBox,
];

test.describe("TC_WEB_PROFILE_GUI_004 — statistics card (own profile)", () => {
  test("five rows read the caller's real counters; no write bar", async ({ page }) => {
    const [kudosReceived, kudosSent, heartsReceived] = psql(
      `select kudos_received, kudos_sent, hearts_received from public.profile_kudo_stats where id = '${DEMO_USER_ID}';`,
    ).split("|");
    const [boxesOpened, boxesUnopened] = psql(
      `select boxes_opened, boxes_unopened from public.profiles where id = '${DEMO_USER_ID}';`,
    ).split("|");

    await page.goto("/profile");

    await expect(page.getByTestId("profile-stats-card")).toBeVisible();
    await expect(page.getByTestId("profile-stat-kudos-received")).toContainText(kudosReceived);
    await expect(page.getByTestId("profile-stat-kudos-sent")).toContainText(kudosSent);
    await expect(page.getByTestId("profile-stat-hearts-received")).toContainText(heartsReceived);
    await expect(page.getByTestId("profile-stat-secret-box-opened")).toContainText(boxesOpened);
    await expect(page.getByTestId("profile-stat-secret-box-unopened")).toContainText(boxesUnopened);

    await expect(page.getByTestId("profile-write-kudo-bar")).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_GUI_005 — Secret Box rows + disabled button (own profile)", () => {
  test("button is disabled; a forced click opens no dialog and navigates nowhere", async ({ page }) => {
    await page.goto("/profile");
    const button = page.getByTestId("profile-open-secret-box");

    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();

    const urlBefore = page.url();
    // Disabled buttons refuse Playwright's normal actionability check
    // (element must be enabled), so force the click to prove there is truly
    // no handler wired up, rather than only proving Playwright can't click it.
    await button.click({ force: true });

    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(page.url()).toBe(urlBefore);
  });
});

test.describe("TC_WEB_PROFILE_FUN_006 — write bar replaces the whole card (another Sunner's profile)", () => {
  test("bar names the Sunner; zero counter labels anywhere, including the raw HTML payload", async ({ page }) => {
    const otherName = psql(`select display_name from public.profiles where id = '${OTHER_USER_ID}';`);

    const response = await page.goto(`/profile?id=${OTHER_USER_ID}`);
    const html = (await response?.text()) ?? "";

    const bar = page.getByTestId("profile-write-kudo-bar");
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(otherName);

    await expect(page.getByTestId("profile-stats-card")).toHaveCount(0);
    await expect(page.getByTestId("profile-open-secret-box")).toHaveCount(0);

    STAT_LABELS_VI.forEach((label) => {
      expect(html).not.toContain(label);
    });
  });
});

test.describe("TC_WEB_PROFILE_FUN_007 — the bar opens the write-Kudo modal", () => {
  test("modal opens, recipient field stays editable, suggestion list stays closed", async ({ page }) => {
    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    await page.getByTestId("profile-write-kudo-bar").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const recipientInput = dialog.getByPlaceholder(viKudos.recipient.placeholder);
    await expect(recipientInput).toBeEditable();
    await expect(dialog.getByRole("listbox")).toHaveCount(0);
  });

  test("recipient field is pre-selected with the viewed Sunner's name", async ({ page }) => {
    const otherName = psql(`select display_name from public.profiles where id = '${OTHER_USER_ID}';`);
    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    await page.getByTestId("profile-write-kudo-bar").click();

    const recipientInput = page.getByRole("dialog").getByPlaceholder(viKudos.recipient.placeholder);
    await expect(recipientInput).toHaveValue(otherName);
  });
});

test.describe("TC_WEB_PROFILE_FUN_008 — no write-Kudo bar on own profile", () => {
  test("self view offers no write bar", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByTestId("profile-write-kudo-bar")).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_SEC_004 — no edit affordance on either face", () => {
  test("neither the stats card nor the write bar renders an edit control", async ({ page }) => {
    await page.goto("/profile");
    const statsCard = page.getByTestId("profile-stats-card");
    await expect(statsCard.locator('input, [contenteditable="true"], button[aria-label*="edit" i]')).toHaveCount(0);

    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    const bar = page.getByTestId("profile-write-kudo-bar");
    await expect(bar.locator('input, [contenteditable="true"]')).toHaveCount(0);
  });
});
