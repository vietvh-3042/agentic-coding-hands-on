import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import viProfile from "../shared/i18n/locales/vi/profile.json";
import {
  DEMO_USER_ID,
  ORDINARY_USER_ID,
  readCounts,
  feedKudoIds,
  scrollFeedToEnd,
} from "./support/profile-feed-helpers";

/**
 * Feed paging and per-direction empty states. `FUN_012`, `FUN_013`.
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

test.describe("TC_WEB_PROFILE_FUN_012 — two distinct empty states", () => {
  test.describe("Received", () => {
    const SPARSE_ID = "00000000-0000-4000-8000-000000000098";
    const SPARSE_EMAIL = "e2e-sparse-kudos-received@sun-asterisk.com";
    const SPARSE_NAME = "Sparse Received E2E";

    // Mirrors profile-hero.spec.ts's own TC_GUI_009 fixture — a roster
    // profile with zero Kudos, provisioned rather than assumed.
    test.beforeAll(() => {
      psql(`
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          email_change_token_current, phone_change, phone_change_token, reauthentication_token
        ) values (
          '00000000-0000-0000-0000-000000000000', '${SPARSE_ID}',
          'authenticated', 'authenticated', '${SPARSE_EMAIL}', '',
          now(), jsonb_build_object('provider', 'google', 'providers', jsonb_build_array('google')),
          jsonb_build_object('full_name', '${SPARSE_NAME}'), now(), now(),
          '', '', '', '', '', '', '', ''
        );
      `);
    });

    test.afterAll(() => {
      psql(`delete from auth.users where id = '${SPARSE_ID}';`);
    });

    test("shows the board's exact empty copy", async ({ page }) => {
      await page.goto(`/profile?id=${SPARSE_ID}`);
      await expect(page.getByTestId("profile-feed-empty")).toHaveText(
        "Hiện tại chưa có Kudos nào.", // verbatim, kudos-feed.json's `feed.empty` (FUN_012)
      );
    });
  });

  test.describe("Sent", () => {
    test.use({ storageState: "e2e/.auth/ordinary-user.json" });

    // Temporarily reassigns the ordinary user's own sent rows to a parking
    // sender (not deleted, so `kudo_hashtags`/`kudo_hearts` stay intact) —
    // `workers: 1` means this describe's own tests complete, including
    // this restore, before any other spec observes the shared DB.
    let reassignedIds: string[] = [];

    test.beforeAll(() => {
      const raw = psql(`select id from public.kudos where sender_id = '${ORDINARY_USER_ID}';`);
      reassignedIds = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (reassignedIds.length > 0) {
        const idList = reassignedIds.map((id) => `'${id}'`).join(",");
        psql(`update public.kudos set sender_id = '${DEMO_USER_ID}' where id = ANY(ARRAY[${idList}]::uuid[]);`);
      }
    });

    test.afterAll(() => {
      if (reassignedIds.length > 0) {
        const idList = reassignedIds.map((id) => `'${id}'`).join(",");
        psql(`update public.kudos set sender_id = '${ORDINARY_USER_ID}' where id = ANY(ARRAY[${idList}]::uuid[]);`);
      }
    });

    test("shows the Sent-specific empty copy, distinct from Received's", async ({ page }) => {
      await page.goto("/profile");
      await page.getByTestId("profile-direction-trigger").click();
      await page.getByTestId("profile-direction-option-sent").click();

      const empty = page.getByTestId("profile-feed-empty");
      await expect(empty).toHaveText(viProfile.kudos.emptySent);
      await expect(empty).not.toHaveText("Hiện tại chưa có Kudos nào.");
    });
  });
});

test.describe("TC_WEB_PROFILE_FUN_013 — infinite scroll: 10/page, no duplicate, end-of-feed message", () => {
  test("scrolling to the end of Sent shows no duplicate card and an end-of-feed message", async ({ page }) => {
    const { sent } = readCounts(DEMO_USER_ID);
    test.skip(sent < 11, "needs more than one page of Sent Kudos to exercise pagination");

    await page.goto("/profile");
    await page.getByTestId("profile-direction-trigger").click();
    await page.getByTestId("profile-direction-option-sent").click();
    // The switch is async (a Server Action round-trip) — wait for the
    // trigger to actually reflect Sent before reading the feed, or this
    // would race and read the outgoing Received list instead (FUN_010's
    // own ordering guarantee, reused here as a synchronization point).
    await expect(page.getByTestId("profile-direction-trigger")).toHaveText(new RegExp(`Đã gửi \\(${sent}\\)`));

    const feed = page.getByTestId("profile-feed-list");
    const firstPageIds = await feedKudoIds(page);
    expect(firstPageIds).toHaveLength(10);

    const ids = await scrollFeedToEnd(page);

    expect(ids).toHaveLength(sent);
    expect(new Set(ids).size).toBe(ids.length);
    await expect(feed.getByTestId("profile-feed-sentinel")).toHaveCount(0);
    await expect(page.getByTestId("profile-feed-end")).toHaveText(viProfile.kudos.endOfFeed);
  });
});
