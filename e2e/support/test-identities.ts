/**
 * Seeded local-dev identities the authenticated E2E project signs in as.
 *
 * Two seeded identities carry a real bcrypt password (`supabase/seed.sql`);
 * the other thirteen are Google-only and cannot complete
 * `signInWithPassword`:
 *
 * - `demo.user@sun-asterisk.com` (…0001) — promoted to `role = 'admin'` in
 *   `supabase/seed.sql`. Used by `e2e/.auth/user.json` (the `chromium-authed`
 *   project's default storage state — every `e2e/board/**` spec asserts
 *   against this identity's seeded rows).
 * - `sender.one@sun-asterisk.com` (…0002) — left at the column default
 *   `role = 'user'`, the ordinary-role identity every non-admin-path
 *   assertion needs (e.g. the heart control's "own kudos disable" rule, or
 *   the header menu's base — no Dashboard item — shape). Written to
 *   `e2e/.auth/ordinary-user.json`, a second fixture a spec opts into with
 *   `test.use({ storageState: "e2e/.auth/ordinary-user.json" })` — it is
 *   never the project default, so existing admin-identity specs are
 *   unaffected.
 *
 * Passwords are a documented local-dev fixture already committed in
 * `supabase/seed.sql`'s comments — never a production credential. Reading
 * each from the environment first still lets CI inject its own value
 * without a code change.
 */
export const E2E_ADMIN_IDENTITY = {
  email: process.env.E2E_USER_EMAIL ?? "demo.user@sun-asterisk.com",
  password: process.env.E2E_USER_PASSWORD ?? "TestLogin123!",
} as const;

export const E2E_ORDINARY_IDENTITY = {
  email: process.env.E2E_ORDINARY_USER_EMAIL ?? "sender.one@sun-asterisk.com",
  password: process.env.E2E_ORDINARY_USER_PASSWORD ?? "TestLogin123!",
} as const;
