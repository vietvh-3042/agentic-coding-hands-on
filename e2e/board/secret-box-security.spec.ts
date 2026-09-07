import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { test, expect, type Page } from "@playwright/test";

/**
 * F006 secret-box security cases — MoMorph J3-4YFIpMM's two security test
 * cases (5cc072ad: no client-side counter manipulation; 2e7bec78: no
 * client-side badge manipulation) plus 84a5ba82 (access control at 0 boxes).
 * These attempt the forbidden write for real against the local Supabase
 * stack — no mock, no `service_role` key (none exists in `.env.local`;
 * phase-09's "no new secret" decision) — and assert the real rejection.
 *
 * The two direct-write tests sign in fresh as the seeded admin identity and
 * never mutate state on success (both writes are expected to fail), so they
 * are safe to run independently of `secret-box-reveal.spec.ts`, which owns
 * that same profile row's `boxes_*` values.
 */

const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo.user@sun-asterisk.com",
  password: "TestLogin123!",
};
const SENDER_ONE = { email: "sender.one@sun-asterisk.com", password: "TestLogin123!" };
const AN_ICON_ID = "10000000-0000-4000-8000-000000000001"; // Stay Gold — a real, existing row

function signedInRestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

/** Signs in as `email`/`password` against local GoTrue and returns the
 *  session cookies in Playwright's `context.addCookies` shape — the same
 *  capture technique as `e2e/support/authenticate.setup.ts`, kept local here
 *  because that file only ever signs in the seeded ADMIN identity. */
async function signInCookies(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const captured: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        captured.push(...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signInWithPassword failed for ${email}: ${error.message}`);

  return captured.map(({ name, value, options }) => ({
    name,
    value,
    domain: "127.0.0.1",
    path: (options.path as string | undefined) ?? "/",
    expires: typeof options.maxAge === "number" ? Math.floor(Date.now() / 1000) + (options.maxAge as number) : -1,
    httpOnly: Boolean(options.httpOnly),
    secure: Boolean(options.secure),
    sameSite: "Lax" as const,
  }));
}

async function openGiftDialog(page: Page) {
  await page.goto("/sun-kudos");
  await page.getByRole("button", { name: "Mở Secret Box" }).click();
}

test.describe("Secret Box security — F006", () => {
  test("a signed-in user cannot insert directly into user_icon_unlocks to grant itself a badge", async () => {
    const client = signedInRestClient();
    const { error: signInError } = await client.auth.signInWithPassword(DEMO_USER);
    expect(signInError).toBeNull();

    const { error } = await client.from("user_icon_unlocks").insert({ user_id: DEMO_USER.id, icon_id: AN_ICON_ID });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  test("a signed-in user cannot update their own boxes_unopened/boxes_opened directly", async () => {
    const client = signedInRestClient();
    const { error: signInError } = await client.auth.signInWithPassword(DEMO_USER);
    expect(signInError).toBeNull();

    const { error } = await client
      .from("profiles")
      .update({ boxes_unopened: 99, boxes_opened: 99 })
      .eq("id", DEMO_USER.id);

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  test("boxes_unopened = 0 hides the instruction and disables the box (US001 error case)", async ({ browser }) => {
    const cookies = await signInCookies(SENDER_ONE.email, SENDER_ONE.password);
    const context = await browser.newContext();
    await context.addCookies(cookies);
    const page = await context.newPage();

    await openGiftDialog(page);

    await expect(page.getByText("Click vào box để mở")).toHaveCount(0);
    await expect(page.getByTestId("secret-box-button")).toBeDisabled();

    await context.close();
  });
});
