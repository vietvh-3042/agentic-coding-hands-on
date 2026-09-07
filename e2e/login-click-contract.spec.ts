import { test, expect } from "@playwright/test";

test.describe("Login Click Contract — Google OAuth", () => {
  test("clicking Google login button requests /auth/v1/authorize with provider=google", async ({ page }) => {
    // Set up route interception to abort the authorize request (prevent actual navigation)
    await page.route("**/auth/v1/authorize*", (route) => {
      route.abort();
    });

    await page.goto("/login");

    const googleButton = page.getByTestId("google-login-button");

    // Capture the request URL directly from the awaited request object
    const requestPromise = page.waitForRequest("**/auth/v1/authorize*");
    googleButton.click().catch(() => {
      // Navigation may fail due to route abort, which is expected
    });
    const capturedAuthorizeUrl = (await requestPromise).url();

    // Verify the authorize URL was called with provider=google
    expect(capturedAuthorizeUrl).toContain("provider=google");
  });

  test("authorize URL redirect_to parameter is base URL /auth/callback (no query string)", async ({ page }) => {
    // Set up route interception to abort the authorize request (prevent actual navigation)
    await page.route("**/auth/v1/authorize*", (route) => {
      route.abort();
    });

    await page.goto("/login");

    const googleButton = page.getByTestId("google-login-button");

    // Capture the request URL directly from the awaited request object
    const requestPromise = page.waitForRequest("**/auth/v1/authorize*");
    googleButton.click().catch(() => {
      // Navigation may fail due to route abort, which is expected
    });
    const capturedAuthorizeUrl = (await requestPromise).url();

    // Extract redirect_to param from URL
    const url = new URL(capturedAuthorizeUrl);
    const redirectTo = url.searchParams.get("redirect_to");

    // Verify redirect_to is exactly http://127.0.0.1:3000/auth/callback (no query string)
    expect(redirectTo).toBe("http://127.0.0.1:3000/auth/callback");
  });

  test("Google login button is disabled with aria-busy=true while authenticating", async ({ page }) => {
    let routeHandlerCalled = false;

    // Set up the route handler to intercept and IMMEDIATELY abort
    // This prevents the browser from navigating away
    await page.route("**/auth/v1/authorize*", (route) => {
      routeHandlerCalled = true;
      // Abort immediately to prevent navigation
      route.abort();
    });

    await page.goto("/login");

    const googleButton = page.getByTestId("google-login-button");

    // Click the button and handle the expected navigation error
    const clickPromise = googleButton.click().catch(() => {});

    // Wait for the button to become disabled AND aria-busy="true" (React sets loading=true and renders)
    // Return true only when BOTH conditions are met - this also verifies the state
    const buttonStateConfirmed = await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="google-login-button"]') as HTMLButtonElement | null;
        if (!button) return false;
        // Return true only when BOTH conditions are met
        return button.disabled && button.getAttribute("aria-busy") === "true";
      },
      { timeout: 5000 },
    );

    // Verify the button state confirmation
    expect(await buttonStateConfirmed.jsonValue()).toBe(true);

    // Verify the authorize route was actually called
    expect(routeHandlerCalled).toBe(true);

    // Wait for the click to settle
    await clickPromise;
  });
});
