import { test, expect } from "@playwright/test";

const PROTECTED_ROUTES = ["/", "/about", "/countdown", "/sun-kudos", "/award-info"];

test.describe("Auth Guard — Unauthenticated User Redirects", () => {
  test.describe.configure({ timeout: 30_000 });

  PROTECTED_ROUTES.forEach((route) => {
    test(`unauthenticated user visiting ${route} is redirected to /login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test("unauthenticated user can access /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
  });
});
