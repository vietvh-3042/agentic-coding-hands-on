# Google OAuth + Local Supabase on Next.js 16 App Router — Implementation Reference

Date: 2026-09-06. Stack: next 16.3.1, react 19.2.8, ts5 strict, @supabase/ssr ^0.12.6, @supabase/supabase-js ^2.115.0, pnpm 10.28.0.

Sources weighted: (1) official Next.js docs (nextjs.org, version-stamped `16.3.4`, highest trust), (2) official Vercel `vercel/next.js` `canary` branch example `examples/with-supabase` (highest trust for _current_ code shape — this is the ecosystem's own reference impl, fetched directly via `curl` raw.githubusercontent.com, verbatim), (3) official Supabase docs (supabase.com/docs — authoritative for Supabase-specific behavior but historically lags Next.js major renames, per prior research), (4) supabase/ssr GitHub CHANGELOG, (5) GitHub Discussions for known footguns. Cross-checked (2) against (3)+(4) — code matches described API shape.

---

## 0. Two must-know Next.js 16 facts (govern everything below)

- **`middleware.ts` → `proxy.ts`, function `middleware` → `proxy`.** Deprecated as of Next 16.0.0, codemod `npx @next/codemod@canary middleware-to-proxy .`. File still lives at **project root** (or `src/`), same level as `app/`. Runtime defaults to **Node.js** (not Edge) as of 16.0.0. `config.matcher` shape unchanged. [nextjs.org/docs/messages/middleware-to-proxy](https://nextjs.org/docs/messages/middleware-to-proxy), [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) (v16.3.4, fetched 2026-09-06).
  - Official doc explicitly still endorses auth in Proxy: _"Proxy executes before routes are rendered. It's particularly useful for implementing custom server-side logic like authentication, logging, or handling redirects."_ — an earlier web-search summary I pulled claimed proxy is "NOT for Authentication"; that summary does **not** match the primary-source text I fetched directly — treat that claim as WRONG, superseded by the quote above.
  - BUT the same doc adds a real caveat: _"A matcher change or a refactor that moves a Server Function to a different route can silently remove Proxy coverage. Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone."_ → Proxy-level redirect is a UX convenience, not your only authorization boundary. Confirms defense-in-depth (matches prior memory note on this pattern).
- **`cookies()` from `next/headers` is `async`** (`await cookies()`), a change from Next 15 that carries into 16. Route Handlers must be `async` functions and `await cookies()`. [nextjs.org/docs/messages/sync-dynamic-apis](https://nextjs.org/docs/messages/sync-dynamic-apis).

---

## 1. `@supabase/ssr` v0.12 client factories

Version history relevant to you (package.json pins `^0.12.6`):

- **v0.4.0 (2024-06-24)**: full rewrite, `get/set/remove` cookie API → **`getAll`/`setAll`**. This is the only cookie-adapter breaking change between "old" and "current" API; `^0.12.6` only ever supports `getAll`/`setAll` — `get/set/remove` will throw/is unsupported. [github.com/supabase/ssr CHANGELOG](https://github.com/supabase/ssr/blob/main/CHANGELOG.md)
- v0.6.1: cookie-chunking reverted (was briefly broken).
- **v0.12.4**: PKCE verifier slot cleanup fixed (server flush) — relevant to OAuth reliability.
- **v0.12.5**: warns if `auth.storage` config is ignored.
- v0.12.0: cookie `encode` option for smaller cookies + cache-header passthrough to `setAll` to stop CDN caching auth responses.

None of this changes the code shape you write; get/set/remove → getAll/setAll (2024) is the only adapter-shape breaking change in the whole 0.4→0.12 range.

### 1a. Browser client (`"use client"` components)

Verified verbatim from `vercel/next.js` `examples/with-supabase/lib/supabase/client.ts` (canary, current):

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
```

Call `createClient()` fresh inside the component/handler that needs it — do not hoist to a module-level singleton if you might run on Fluid Compute / serverless (comment in source: "Always create a new client within each function when using it").

### 1b. Server client (Server Components / Route Handlers / Server Actions)

Verbatim from `lib/supabase/server.ts` in the same example:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // MUST await — Next 15/16 async cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // setAll called from a Server Component — safe to ignore
          // IF proxy.ts is refreshing sessions (see 1c).
        }
      },
    },
  });
}
```

The try/catch exists because Server Components cannot write cookies (Next constraint, not a Supabase quirk) — the swallow is safe only because `proxy.ts` (below) already refreshes the session cookie on every request.

### 1c. Proxy (middleware) client — refresh session, propagate cookies both ways

Verbatim from `lib/supabase/proxy.ts` + root `proxy.ts` in the same example — this is the exact "correctly propagates cookies to both request and NextResponse" pattern you asked for:

```ts
// lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. write to the *request* so downstream code in this same
          //    invocation sees fresh cookies
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 2. rebuild the response from the mutated request, THEN
          //    write the same cookies onto the *response* so the browser gets them
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient() and getClaims()/getUser().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse; // MUST return this exact object (see footgun below)
}
```

```ts
// proxy.ts (project root — renamed from middleware.ts in Next 16)
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Footgun (explicit warning, matches your ask):** if you build your own `NextResponse` instead of returning `supabaseResponse` as-is, you MUST (a) pass `{ request }` into `NextResponse.next()`, (b) copy `supabaseResponse.cookies.getAll()` onto your new response, before changing anything else — otherwise browser and server auth state desync and users get randomly logged out. This is called out verbatim in the source comment.

---

## 2. Google OAuth flow mechanics

1. Browser client call:

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${location.origin}/auth/callback` },
});
```

[supabase.com/docs/guides/auth/social-login/auth-google](https://supabase.com/docs/guides/auth/social-login/auth-google) (fetched 2026-09-06). 2. Supabase JS redirects the browser to **Supabase's own GoTrue authorize endpoint** (`<supabase_url>/auth/v1/authorize?provider=google&...`), which redirects again to Google's real OAuth consent screen. Google's registered `redirect_uri` is **GoTrue's** callback (`<supabase_url>/auth/v1/callback`), never your app's route — **confirmed in prior verified research** (memory: `nextjs16-supabase-research-notes.md`), consistent with the docs fetched here. Real flow is 3-hop: Google → GoTrue callback → your app's `redirectTo` URL (with GoTrue's own `code` param appended, PKCE flow). 3. Your callback route (`app/auth/callback/route.ts`) exchanges that code:

```ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/error`);
}
```

Route Handler signature: plain `(request: Request | NextRequest)`, no dynamic segment — `searchParams`/`origin` come from `new URL(request.url)`. Verified against the actual `vercel/next.js` canary example's sibling OTP-confirm route (`app/auth/confirm/route.ts`, same repo, fetched verbatim via curl) which uses the identical `(request: NextRequest) { const { searchParams } = new URL(request.url) ... }` shape — that example additionally shows `redirect()` from `next/navigation` working directly inside a Route Handler (an alternative to `NextResponse.redirect`), so both are valid; `NextResponse.redirect` requires an absolute URL, `redirect()` accepts a relative path. 4. **PKCE state**: the code-verifier is stored in a cookie by `signInWithOAuth`, GoTrue does the code exchange with Google server-side, your app's `exchangeCodeForSession` exchanges GoTrue's own code for a session using the same PKCE verifier cookie. All of this is internal to `@supabase/ssr`/`gotrue-js` — you never touch the verifier directly. 5. **Errors on cancel/deny**: Google appends standard OAuth2 `error=access_denied` (+ `error_description`) to whatever URL it redirects to (GoTrue's callback). GoTrue then forwards failure as query params on your `redirectTo` URL — expect `error`, `error_code`, `error_description` params on your callback route in the failure case; `exchangeCodeForSession` will also return a non-null `error` if the code param itself is bad/missing/expired. UNVERIFIED exact param name set forwarded by GoTrue on provider-denial (community reports agree on `error`/`error_description`, but I did not find an official Supabase reference enumerating the full forwarded param set) — defensive code should treat "no `code` param" as the general failure case, which the example route above already does.

---

## 3. Local Supabase setup

### CLI invocation (not globally installed)

Since `supabase` CLI is not a devDependency in this repo and not installed globally, use pnpm's one-off runner:

```bash
pnpm dlx supabase init    # scaffolds supabase/config.toml, supabase/.gitignore etc.
pnpm dlx supabase start   # pulls docker images, starts full local stack
```

Official docs show `npx supabase init`/`start` (npm) and, for repeated use, installing as a devDependency (`pnpm add supabase --save-dev --allow-build=supabase`, then `pnpm supabase start`) — [supabase.com/docs/guides/local-development](https://supabase.com/docs/guides/local-development). Given the project currently has neither, `pnpm dlx` is the lowest-footprint choice for a first run; recommend adding as devDependency afterward if the team will run this often (repeated `pnpm dlx` re-resolves the package each time — minor perf cost, not a correctness issue).

### Default local ports / anon key (from `supabase start` output)

- API URL: `http://127.0.0.1:54321` (also reachable at `localhost:54321`)
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
- Inbucket/Mailpit (test email capture): `http://127.0.0.1:54324`
- CLI prints `anon key` / `service_role key` (legacy JWTs) directly to stdout after `start` — copy those into your env file. UNVERIFIED whether your installed CLI version now emits the newer `sb_publishable_*`/`sb_secret_*` key format by default instead of legacy `anon`/`service_role` JWTs — Supabase is mid-migration (legacy keys deprecated end of 2026, both formats work simultaneously) — [supabase.com/docs/guides/getting-started/migrating-to-new-api-keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys). Practical action: run `pnpm dlx supabase start` and copy whatever key name it actually prints — the client code is identical either way (just a string value in `createBrowserClient`/`createServerClient`'s second arg).

### `config.toml` — Google external auth + site URL

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
# redirect_uri is optional to set explicitly; GoTrue's own callback
# (http://127.0.0.1:54321/auth/v1/callback) is what you register with Google,
# NOT the value you put here.
```

[supabase.com/docs/guides/local-development/cli/config](https://supabase.com/docs/guides/local-development/cli/config) confirms field names `enabled`/`client_id`/`secret`/`redirect_uri`/`skip_nonce_check` and the `env(VAR_NAME)` substitution syntax — **any** var name works, it is not hardcoded to `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`; docs' own worked example uses `env(GITHUB_CLIENT_ID)`/`env(GITHUB_SECRET)` for GitHub, so `env(GOOGLE_CLIENT_ID)` as asked is correct syntax.

**`env()` reads `.env` at the _project root_** (sibling of `supabase/`, NOT inside `supabase/`, NOT `.env.local`) — confirmed via [supabase.com/docs/guides/local-development/managing-config](https://supabase.com/docs/guides/local-development/managing-config), which shows the tree `./.env`, `./.env.example`, `./supabase/config.toml`. Practical implication for this repo: you need a root `.env` (gitignored) with `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — this is separate from whatever `.env.local` you use for the Next.js app's own `NEXT_PUBLIC_*` vars (Next.js does not read plain `.env` by default the same way, and mixing app-public vars into the CLI's `.env` is unnecessary — keep them in separate files, both gitignored).

### Google Cloud Console redirect URI (the one you actually register)

Register **GoTrue's own callback**, not your Next.js route:

```
http://127.0.0.1:54321/auth/v1/callback
```

Confirmed by multiple community sources cross-checked against the architecture in memory note (`nextjs16-supabase-research-notes.md`): the app's `/auth/callback` route is GoTrue's `redirectTo` target, a second hop after Google. Use `127.0.0.1` exactly (not `localhost`) if you hit an "Invalid OAuth Callback"/redirect_uri mismatch — Google's registered URI must match the incoming request's host exactly, and reports of `localhost`/`127.0.0.1` mismatches are a common footgun ([github.com/orgs/supabase/discussions/38063](https://github.com/orgs/supabase/discussions/38063), related threads). Confirm the exact host your local API URL prints and register that.

---

## 4. Middleware/proxy auth-guard pattern (canonical)

Already shown in full in §1c. Summary of the three behaviors you asked to confirm, each present in the verbatim source:

- (a) refresh session every request → `supabase.auth.getClaims()` called unconditionally before any branching (comment: _"Do not run code between createServerClient and getClaims(). A simple mistake could make it very hard to debug issues with users being randomly logged out."_)
- (b) unauthenticated → redirect to `/auth/login` (adjust path to this repo's `/login` route) — done via the `if (... !user ...)` block.
- (c) **NOT shown** in the vercel example (it does not redirect logged-in users away from the login page) — you must add this yourself:

```ts
if (user && request.nextUrl.pathname.startsWith("/login")) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
}
```

Add this alongside the existing unauthenticated-redirect block, still before `return supabaseResponse`.

`matcher` excluding `_next/static`, `_next/image`, favicon, and image assets — verbatim from the same example (already shown in §1c):

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Official proxy.js docs add one more caveat worth carrying forward: _"Even when `_next/data` is excluded in a negative matcher pattern, proxy will still be invoked for `_next/data` routes. This is intentional... to prevent accidental security issues."_ — i.e. you cannot accidentally leak protected data routes by excluding them from the matcher.

**Footgun already covered above (§1c)**: dropping refreshed cookies by building a fresh `NextResponse` without copying `supabaseResponse`'s cookies onto it.

---

## 5. `getUser()` vs `getSession()` vs `getClaims()` in Server Components

- **`getSession()` server-side is NOT trustworthy.** It reads session data directly from the cookie/storage attached to the client without re-verifying it against Supabase's Auth server — a warning is now emitted by `supabase-js` when this is detected server-side. [supabase.com/docs/reference/javascript/auth-getsession](https://supabase.com/docs/reference/javascript/auth-getsession), cross-checked against [github.com/supabase/auth-js/issues/898](https://github.com/supabase/auth-js/issues/898).
- **`getUser()` is trustworthy** — it round-trips to the Supabase Auth server to verify the token before returning the user. This is the historically-recommended call for any server-side "is this user real" check.
- **`getClaims()`** (used in the current `vercel/next.js` example, §1c) is the newest (v0.12-era) recommended call — it verifies the JWT locally (asymmetric signing keys) or against the Auth server as needed, giving `getUser()`-equivalent trust with lower latency when asymmetric JWT signing keys are configured on the project. Treat `getClaims()` as the current best practice per the official example repo; `getUser()` remains valid and is what most existing Supabase docs/tutorials still show.
- Rule of thumb for this project: in Server Components / Route Handlers / Server Actions, always call `getUser()` or `getClaims()` (never trust `getSession()`'s `user` for any authorization decision) — `getSession()` is fine only for reading non-sensitive session metadata client-side.

---

## 6. Env var naming

| Var                                                                                                                                        | Public?                                                                        | Consumer                                    | Notes                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                                                                                                 | **Yes** — `NEXT_PUBLIC_*`                                                      | Next app (browser + server client)          | Safe to expose — it's just the API host.                                                                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (current naming in official example) / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy naming, still valid) | **Yes**                                                                        | Next app (browser + server client)          | Whichever key your `supabase start` output actually prints — see §3. Both are designed to be public (RLS is the real guard). |
| `SUPABASE_SERVICE_ROLE_KEY` (or new `SUPABASE_SECRET_KEY` / `sb_secret_*`)                                                                 | **Never** — no `NEXT_PUBLIC_` prefix                                           | Server-only, if you ever need to bypass RLS | Not needed for the OAuth flow itself; do not introduce it unless a specific admin task requires it.                          |
| `GOOGLE_CLIENT_ID`                                                                                                                         | No prefix needed either way — read by Supabase CLI only, never by Next.js code | Supabase CLI (`config.toml` `env()`)        | Lives in root `.env` (see §3), not `.env.local`.                                                                             |
| `GOOGLE_CLIENT_SECRET`                                                                                                                     | **No** — never public                                                          | Supabase CLI only                           | Same file as above; never reference from any client or server Next.js code — GoTrue holds it, your app never sees it.        |

`.gitignore` must exclude the root `.env` (Supabase CLI) in addition to whatever `.env.local` Next.js already ignores by default via `create-next-app`'s generated `.gitignore`.

---

## Confidence / verification summary

- **HIGH confidence, primary-sourced, code verbatim**: §1a/1b/1c client factories, §2 callback route shape, §4 matcher pattern — all pulled byte-for-byte via `curl` from `vercel/next.js` canary example and cross-checked against official `nextjs.org` docs (dated 16.3.4, 2026-08-25 lastUpdated) and `supabase.com/docs`.
- **HIGH confidence**: proxy.ts rename mechanics, async `cookies()`, `getUser()`/`getSession()` trust distinction, `config.toml` `env()` file location.
- **MEDIUM confidence (community-sourced, not an official enumerated list)**: exact set of query params GoTrue forwards on Google-side denial (§2 step 5).
- **UNVERIFIED, flagged explicitly**: whether the currently-installed local `supabase` CLI version prints legacy `anon`/`service_role` keys or new `sb_publishable_*`/`sb_secret_*` keys by default (§3) — resolve by actually running `pnpm dlx supabase start` once and reading its own output; do not assume from docs, they are mid-migration and inconsistent.

## Unresolved questions

1. Confirm on this machine, after `supabase start`, which anon-key format is actually printed (see UNVERIFIED above) — 30-second check, blocks nothing else.
2. Confirm exact GoTrue-forwarded error query-param names by triggering a real "Cancel" on Google's consent screen against a local stack — no official doc enumerates them; current callback code already degrades safely (falls to `/auth/error`) without knowing the exact names, so this is a nice-to-have for a richer error page, not a blocker.
3. Whether this project wants `getClaims()` (newer, matches the current official example) or `getUser()` (older, more widely documented) as the standard call — functionally equivalent for this use case; pick one and use it consistently in both `proxy.ts` and any Server Component that needs the user.

**Status:** DONE
**Summary:** Full copy-ready @supabase/ssr v0.12 client/proxy/callback code verified verbatim against the official `vercel/next.js` canary example (already Next-16 `proxy.ts`-shaped), cross-checked against official Next.js 16.3.4 and Supabase docs; local `config.toml` Google OAuth block, CLI invocation, ports, and env-var split fully specified with sources.
**Concerns/Blockers:** None blocking. Three minor unresolved items listed above (anon-key format, exact OAuth-denial error params, getClaims vs getUser choice) — none prevents implementation from proceeding.
