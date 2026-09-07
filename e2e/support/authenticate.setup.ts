import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServerClient } from "@supabase/ssr";
import { test as setup } from "@playwright/test";
import { E2E_ADMIN_IDENTITY, E2E_ORDINARY_IDENTITY } from "./test-identities";

const ADMIN_AUTH_FILE = path.join(__dirname, "..", ".auth", "user.json");
const ORDINARY_AUTH_FILE = path.join(__dirname, "..", ".auth", "ordinary-user.json");

/**
 * A single captured `setAll` cookie, in the shape `@supabase/ssr` emits it.
 * Kept local (not imported from the package) because `@supabase/ssr` does not
 * export this shape as a named type.
 */
type CapturedCookie = {
  name: string;
  value: string;
  options: {
    path?: string;
    domain?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
  };
};

function toPlaywrightSameSite(sameSite: CapturedCookie["options"]["sameSite"]): "Strict" | "Lax" | "None" {
  if (sameSite === "strict") return "Strict";
  if (sameSite === "none") return "None";
  return "Lax";
}

/**
 * Maps a captured Supabase cookie onto the shape Playwright's `storageState`
 * expects. Domain/path are pinned to `127.0.0.1`/`/` explicitly rather than
 * trusted from `options` — GoTrue's cookie options do not always set a
 * domain for `127.0.0.1`, and an unset domain makes Playwright reject the
 * cookie at load time.
 */
function toStorageStateCookie({ name, value, options }: CapturedCookie) {
  return {
    name,
    value,
    domain: "127.0.0.1",
    path: options.path ?? "/",
    expires: typeof options.maxAge === "number" ? Math.floor(Date.now() / 1000) + options.maxAge : -1,
    httpOnly: options.httpOnly ?? false,
    secure: options.secure ?? false,
    sameSite: toPlaywrightSameSite(options.sameSite),
  };
}

/**
 * Signs in `identity` against local GoTrue via `signInWithPassword` and
 * writes the resulting session cookies to `authFile` as a Playwright
 * `storageState` fixture.
 *
 * Deliberately does NOT hand-encode the `sb-<ref>-auth-token` cookie format —
 * `createServerClient`'s cookie adapter is the only thing that knows the
 * current chunking/encoding rules, so this captures whatever it emits.
 *
 * Throws (fails the "setup" project, not a spec) on any sign-in failure, so a
 * stopped Supabase stack reads as a setup failure rather than a false RED. A
 * state file is only ever written from a successful, asserted sign-in.
 */
async function authenticateAndSaveState(
  identity: { email: string; password: string },
  authFile: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<void> {
  const capturedCookies: CapturedCookie[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        capturedCookies.push(...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword(identity);

  if (error) {
    throw new Error(
      `e2e/support/authenticate.setup.ts: signInWithPassword failed for ` +
        `${identity.email} — is Supabase local running ` +
        `("npx supabase status")? (${error.message})`,
    );
  }

  if (capturedCookies.length === 0) {
    throw new Error(
      "e2e/support/authenticate.setup.ts: signInWithPassword succeeded but " +
        "no session cookie was captured — check the @supabase/ssr cookie adapter.",
    );
  }

  // Let the freshly-minted access token age past its own `iat` before any spec
  // uses it. GoTrue stamps `iat` from its clock at whole-second granularity,
  // and the token is validated against Postgres's clock — so for a fraction of
  // the first second after sign-in, `iat` can read as *ahead* of "now" and the
  // first authenticated query fails with "JWT issued at future". That surfaced
  // as a ~1-in-3 flake on the first run after setup (a server error taking down
  // the whole page render, e.g. `getUnlockedIcons: JWT issued at future`), and
  // it vanished on reruns that reused an already-aged storage state.
  //
  // This is not a retry papering over an unknown: the window is bounded by the
  // one-second `iat` granularity, so settling past it removes the cause.
  await new Promise((resolve) => {
    setTimeout(resolve, 1500);
  });

  await mkdir(path.dirname(authFile), { recursive: true });
  await writeFile(
    authFile,
    JSON.stringify({ cookies: capturedCookies.map(toStorageStateCookie), origins: [] }, null, 2),
  );
}

function requireSupabaseEnv(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "e2e/support/authenticate.setup.ts: NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (.env.local) to run the " +
        "authenticated E2E project.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Signs in the seeded admin identity and writes `e2e/.auth/user.json` — the
 * `chromium-authed` project's default storage state. Every `e2e/board/**`
 * spec depends on this identity (`demo.user@sun-asterisk.com`, `role =
 * 'admin'`) and this file name; both are kept stable here.
 */
setup("authenticate as seeded admin identity", async () => {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();
  await authenticateAndSaveState(E2E_ADMIN_IDENTITY, ADMIN_AUTH_FILE, supabaseUrl, supabaseAnonKey);
});

/**
 * Signs in the seeded ordinary-role identity (`sender.one@sun-asterisk.com`,
 * `role = 'user'`) and writes `e2e/.auth/ordinary-user.json`. Not the
 * `chromium-authed` project default — a spec opts in explicitly with
 * `test.use({ storageState: "e2e/.auth/ordinary-user.json" })` when it must
 * exercise a non-admin path.
 */
setup("authenticate as seeded ordinary identity", async () => {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseEnv();
  await authenticateAndSaveState(E2E_ORDINARY_IDENTITY, ORDINARY_AUTH_FILE, supabaseUrl, supabaseAnonKey);
});
