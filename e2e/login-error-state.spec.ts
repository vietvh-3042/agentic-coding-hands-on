import { test, expect } from "@playwright/test";

test.describe("Login Error State", () => {
  test("error region renders when /login?error=oauth_failed is visited", async ({ page }) => {
    await page.goto("/login?error=oauth_failed");

    const errorRegion = page.getByTestId("google-login-error");

    // Verify the error region is visible
    await expect(errorRegion).toBeVisible();
  });

  test("error region has role=alert for accessibility", async ({ page }) => {
    await page.goto("/login?error=oauth_failed");

    const errorRegion = page.getByTestId("google-login-error");

    // Verify the error region has role=alert
    await expect(errorRegion).toHaveAttribute("role", "alert");
  });
});
