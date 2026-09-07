import { defineConfig, devices } from "@playwright/test";

// Loads NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (and E2E_USER_*, when overridden)
// from .env.local for the Node process running this config and the "setup"
// project below. No `.env.local` in CI is fine — those values are expected
// to already be in the environment there. `loadEnvFile` is a Node 22+
// built-in (no `dotenv` dependency needed).
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional — CI provides these vars directly.
}

/**
 * "board" carries every spec that needs seeded rows and a real GoTrue
 * session (Batch A's amendment to the Docker-free E2E convention — see
 * plans/260710-1511-sun-kudos-live-board/phase-02-foundation-ui-types-e2e-harness.md).
 * Keeping these specs in their own directory, rather than a filename
 * pattern, means later phases add files under `e2e/board/` with no config
 * change and no risk of an authed spec silently running Docker-free.
 *
 * `chromium-authed`'s `testMatch` was broadened in phase-01 of the
 * profile-and-menus batch to also cover `e2e/profile-*.spec.ts` and
 * `e2e/rules-drawer.spec.ts` — later phases add those files with no further
 * config change. `chromium`'s `testIgnore` mirrors the same patterns so a
 * spec never runs twice under two projects.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Always 1, locally as well as in CI. The `chromium-authed` specs all share a
  // SINGLE local Supabase database and mutate it (hearts, secret-box draws, kudo
  // submissions), so running them concurrently makes them race: a heart asserted
  // by one worker is toggled by another mid-flight. Observed directly — the full
  // suite is 37/37 serially and intermittently red in parallel, on the same
  // commit and the same freshly reset database.
  //
  // The suite runs in ~33s serially, so parallelism buys nothing worth a flaky
  // gate. Per-worker database isolation would be the alternative; it is not worth
  // the machinery at this size.
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["e2e/board/**", "e2e/profile-*.spec.ts", "e2e/rules-drawer.spec.ts"],
    },
    {
      name: "setup",
      testMatch: "e2e/support/*.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Broadened beyond the board specs (phase-01, profile-and-menus batch)
      // so later profile/menu specs share the same authenticated project and
      // setup dependency instead of a differently-named duplicate.
      name: "chromium-authed",
      testMatch: ["e2e/board/**", "e2e/profile-*.spec.ts", "e2e/rules-drawer.spec.ts"],
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
