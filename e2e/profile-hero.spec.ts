import { test, expect } from "@playwright/test";
import { psql } from "./support/psql";
import viProfile from "../shared/i18n/locales/vi/profile.json";
import enProfile from "../shared/i18n/locales/en/profile.json";

/**
 * Keyvisual hero + badge collection (phase 03, MoMorph screen 3FoIx6ALVb) —
 * `TC_WEB_PROFILE_GUI_001/002/003/008/009`.
 *
 * Runs under `chromium-authed` (default storageState = the seeded admin/demo
 * identity, `00000000-0000-4000-8000-000000000001`), except `GUI_002`, which
 * opts into the seeded ordinary identity (`e2e/.auth/ordinary-user.json`) —
 * that identity has ZERO `user_icon_unlocks` rows, unlike the demo user, who
 * already has 3 unlocked from the live seed. Both fixtures exist today;
 * neither test case name assumed a specific one, so each picks the identity
 * that actually matches its own expected result.
 */

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
// Andrew Nelson.
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000004";

const SELF_HEADING_VI = "Bộ sưu tập icon của tôi";
const OTHER_HEADING_VI = "Bộ sưu tập icon";

test.describe("TC_WEB_PROFILE_GUI_001 — keyvisual hero (own profile)", () => {
  // The demo user seeds at kudos_received = 8 / distinct_senders = 8 — under
  // GUI_001's own precondition ("at least 10 received Kudos"). Top up by 2
  // Kudos from already-seeded senders so the hoa-thi star row actually has
  // something to assert, without adding a 9th distinct sender (which would
  // change the Hero tier this test also asserts).
  const FIXTURE_TAG = "e2e-fixture:profile-hero-gui-001";

  test.beforeAll(() => {
    psql(`
      insert into public.kudos (sender_id, receiver_id, message)
      values
        ('00000000-0000-4000-8000-000000000002', '${DEMO_USER_ID}', '${FIXTURE_TAG}'),
        ('00000000-0000-4000-8000-000000000003', '${DEMO_USER_ID}', '${FIXTURE_TAG}');
    `);
  });

  test.afterAll(() => {
    psql(`delete from public.kudos where message = '${FIXTURE_TAG}';`);
  });

  test("renders banner, avatar, gold name, department, tier badge and stars", async ({ page }) => {
    const displayName = psql(`select display_name from public.profiles where id = '${DEMO_USER_ID}';`);
    const department = psql(`select hero_code from public.profiles where id = '${DEMO_USER_ID}';`);

    await page.goto("/profile");

    await expect(page.getByTestId("profile-hero-banner")).toBeVisible();
    await expect(page.getByTestId("profile-avatar")).toBeVisible();
    await expect(page.getByTestId("profile-name")).toHaveText(displayName);
    await expect(page.getByTestId("profile-department")).toHaveText(department);
    // Hero tier: 8 distinct senders -> "rising" (5-9 band). The exported
    // artwork bakes the label into the image, exposed as its alt text.
    await expect(page.getByTestId("profile-hero-tiers").getByAltText("Rising Hero")).toBeVisible();
    // Hoa-thi stars: 10 total received (8 seeded + 2 fixture) crosses the
    // first (10/20/50) threshold -> exactly 1 star, via the shared
    // StarTierBadge (reused, not re-implemented).
    await expect(page.getByTestId("profile-hero-tiers").getByTestId("star-tier-badge")).toBeVisible();
  });
});

test.describe("TC_WEB_PROFILE_GUI_002 — badge collection, all slots locked", () => {
  test.use({ storageState: "e2e/.auth/ordinary-user.json" });

  test("exactly 6 badge slots, every one locked/greyed", async ({ page }) => {
    await page.goto("/profile");

    const slots = page.getByTestId("badge-slot");
    await expect(slots).toHaveCount(6);
    const lockedStates = await slots.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-locked")));
    expect(lockedStates).toEqual(["true", "true", "true", "true", "true", "true"]);
  });
});

test.describe("TC_WEB_PROFILE_GUI_003 — badge heading differs per view", () => {
  test("first-person on own profile, neutral on another Sunner's", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: SELF_HEADING_VI, exact: true })).toBeVisible();

    await page.goto(`/profile?id=${OTHER_USER_ID}`);
    await expect(page.getByRole("heading", { name: OTHER_HEADING_VI, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: SELF_HEADING_VI, exact: true })).toHaveCount(0);
  });
});

test.describe("TC_WEB_PROFILE_GUI_009 — sparse profile", () => {
  const SPARSE_ID = "00000000-0000-4000-8000-000000000099";
  const SPARSE_EMAIL = "e2e-sparse-profile@sun-asterisk.com";
  const SPARSE_NAME = "Sparse Profile E2E";

  test.beforeAll(() => {
    // A roster profile with no avatar, no department and zero Kudos — none of
    // the 15 live-seeded profiles is sparse on all three axes at once, so this
    // phase provisions one test-only row rather than mutating a seeded one.
    // `handle_new_user()` (20260722090000_create_profile_on_signup.sql) fires
    // on this INSERT and creates the matching `profiles` row; hero_code is
    // then cleared to '' (its trigger default is a random placeholder, not
    // empty) and avatar_url is already null (no avatar_url in the metadata).
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
    psql(`update public.profiles set hero_code = '' where id = '${SPARSE_ID}';`);
  });

  test.afterAll(() => {
    // Cascades to public.profiles (on delete cascade, profile_schema.sql).
    psql(`delete from auth.users where id = '${SPARSE_ID}';`);
  });

  test("placeholder avatar, no department, no tier badge, no stars, 6 greyed slots", async ({ page }) => {
    await page.goto(`/profile?id=${SPARSE_ID}`);

    // Scoped to the hero: the name is not unique on the page (write-Kudo bar +
    // every KUDOS feed card's person block per GUI_006).
    await expect(page.getByTestId("profile-name")).toHaveText(SPARSE_NAME);
    await expect(page.getByTestId("profile-department")).toHaveCount(0);
    await expect(page.getByTestId("profile-hero-tiers").getByAltText(/Hero$/)).toHaveCount(0);
    await expect(page.getByTestId("profile-hero-tiers").getByTestId("star-tier-badge")).toHaveCount(0);

    const avatarImg = page.getByTestId("profile-avatar").locator("img");
    await expect(avatarImg).toHaveAttribute("src", /avatar-sample-1/);

    await expect(page.getByTestId("badge-slot")).toHaveCount(6);
  });
});

test("TC_WEB_PROFILE_GUI_008 — vi/en profile.json key sets are identical", () => {
  function collectKeyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value && typeof value === "object" && !Array.isArray(value)
        ? collectKeyPaths(value as Record<string, unknown>, path)
        : [path];
    });
  }

  expect(collectKeyPaths(viProfile).sort()).toEqual(collectKeyPaths(enProfile).sort());
});
