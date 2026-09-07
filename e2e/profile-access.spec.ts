import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import viProfile from "../lib/i18n/locales/vi/profile.json";

/**
 * `/profile` route resolution (phase 03, MoMorph screen 3FoIx6ALVb) —
 * `TC_WEB_PROFILE_ACC_001/002`, `FUN_001..005`.
 *
 * Runs under the `chromium-authed` project (see playwright.config.ts), whose
 * default storageState signs in as the seeded admin/demo identity
 * (`00000000-0000-4000-8000-000000000001`). The signed-out case overrides
 * storageState to none, per this phase's own instructions — `/profile` is
 * NOT in `chromium-authed`'s testMatch by name alone; it also needs no
 * session for that one describe block.
 */

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
// Andrew Nelson — a second Sunner with received Kudos (FUN_001's precondition).
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000004";
const UNKNOWN_UUID = "99999999-9999-4999-8999-999999999999";
// Verbatim from the test case's own Test_Data column (TC_WEB_PROFILE_FUN_004).
const MALFORMED_IDS = ["banana", "' or 1=1", "42", "11111111-1111-4111-8111"];

// The badge-collection heading (GUI_003) doubles as the self/other content
// signal here — reading it directly off the shipped locale file rather than
// hardcoding a duplicate literal that could drift from lib/i18n.

test.describe("TC_WEB_PROFILE_ACC_001 — unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects to /login with no profile content ever rendered", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("profile-avatar")).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_ACC_002 / FUN_001..005 — route resolution", () => {
  test("ACC_002 — no query string renders the caller's own profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByTestId("profile-avatar")).toBeVisible();
    await expect(page.getByRole("heading", { name: viProfile.badges.headingSelf, exact: true })).toBeVisible();
  });

  test("FUN_001 — ?id={other} renders that Sunner's profile", async ({ page }) => {
    const otherName = psql(`select display_name from public.profiles where id = '${OTHER_USER_ID}';`);
    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    // Scoped to the hero: the name is not unique on the page (write-Kudo bar +
    // every KUDOS feed card's person block per GUI_006).
    await expect(page.getByTestId("profile-name")).toHaveText(otherName);
    await expect(page.getByRole("heading", { name: viProfile.badges.headingOther, exact: true })).toBeVisible();
  });

  test("FUN_002 — ?id={self} canonicalizes to the self view", async ({ page }) => {
    await page.goto(`/profile?id=${DEMO_USER_ID}`);
    await expect(page.getByRole("heading", { name: viProfile.badges.headingSelf, exact: true })).toBeVisible();
  });

  test("FUN_003 — a well-formed but unknown uuid 404s, not a 500", async ({ page }) => {
    const response = await page.goto(`/profile?id=${UNKNOWN_UUID}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("profile-avatar")).toHaveCount(0);
  });

  MALFORMED_IDS.forEach((badId) => {
    test(`FUN_004 — malformed id "${badId}" 404s before reaching the database`, async ({ page }) => {
      const response = await page.goto(`/profile?id=${encodeURIComponent(badId)}`);
      expect(response?.status()).toBe(404);
    });
  });

  test("FUN_005 — an empty ?id means self", async ({ page }) => {
    await page.goto("/profile?id=");
    await expect(page.getByRole("heading", { name: viProfile.badges.headingSelf, exact: true })).toBeVisible();
  });

  test("FUN_005 — a repeated ?id is refused (404), not silently resolved", async ({ page }) => {
    const response = await page.goto(`/profile?id=${DEMO_USER_ID}&id=${OTHER_USER_ID}`);
    expect(response?.status()).toBe(404);
  });
});

test.describe("Header entry point — the user menu reaches /profile", () => {
  /**
   * The route was built before anything linked to it: the header user menu's
   * "Profile" item was a bare `<button>` with no handler and no href, so
   * `/profile` was reachable only by typing the URL. This asserts the entry
   * point exists, from a page that is NOT already /profile.
   */
  test("clicking Profile in the header menu navigates to /profile", async ({ page }) => {
    await page.goto("/about");

    await page.getByRole("button", { name: "User profile" }).click();
    await page.getByRole("menuitem", { name: "Profile", exact: true }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByTestId("profile-name")).toBeVisible();
  });

  /**
   * "Admin Dashboard" is deliberately left inert: it needs the server-resolved
   * `profiles.role` gate and an `/admin` route, both of which belong to the
   * deferred phase 06. Wiring it now would link to a 404, so this pins it as
   * intentionally not-a-link until that phase lands.
   */
  test("Admin Dashboard stays inert (no /admin route exists yet)", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "User profile" }).click();

    const adminItem = page.getByRole("menuitem", { name: "Admin Dashboard", exact: true });
    await expect(adminItem).toBeVisible();
    await expect(adminItem).not.toHaveAttribute("href", /./);
  });
});
