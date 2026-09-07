# Clarifications — Login Page (/login) with Supabase Auth

MoMorph screen: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
Frame: `Login` (figma node 662:14387) · 8 specs · 17 test cases · design_status: done

## Session 2026-09-06

### Pipeline gates

- Q: Enable Spec-Driven Development mode for this project? → A: **On** — spec drafted per feature before planning, promoted to `docs/features/` at implement-start. Persisted to project `$HOME/.claude/.tkm.json`.
- Q: Spec/doc prose language (no `primary_lang` yet)? → A: **English (en)** — matches existing code comments and AGENTS.md. UI copy stays bilingual via i18n.
- Q: No `@playwright/test` runner exists but specs are behavioral — how does test policy resolve? → A: **Install `@playwright/test` → `e2e-red-first`.** A screen-level E2E test must fail on the auth assertions (real non-zero exit, assertion-caused) before any implementation lands.

### Product decisions

- Q: Post-login redirect target? MoMorph spec 2.2.1 says `/todo`. → A: **Keep the shipped `isBeforeLaunch()` branch** — `/countdown` before `LAUNCH_AT`, `/about` after. `/todo` in the spec is a placeholder and is NOT implemented.
- Q: Google OAuth against a local Supabase project — how? → A: **Real Google credentials via env.** `supabase/config.toml` enables `[auth.external.google]` reading `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET` from `.env.local`. No mock provider in production code.
- Q: Which routes are protected? → A: **All app routes except `/login`** (`/`, `/about`, `/countdown`, `/sun-kudos`, `/award-info`). `middleware.ts` refreshes the session and redirects unauthenticated users to `/login`; authenticated users hitting `/login` bounce to the post-login target. Covers TC `f62b0c97` and `45278c06`.
- Q: Scope beyond the login screen? → A: **Login + session + guard.** Supabase browser/server clients, OAuth callback route, error handling, middleware guard. **Logout UI is out of scope** — left to the existing `components/homepage/user-menu.tsx` work.

### Derived from specs (no ask needed)

- Login failure / user-cancel copy (spec 2.2.1 `validationNote`): `"Đăng nhập không thành công. Vui lòng thử lại."` — must be added to `lib/i18n/locales/{en,vi}/login.json`, not hard-coded.
- All Google accounts are permitted — no domain allowlist (spec 2.2.1 `transitionNote`).
- Button shows a loading state and is disabled while authenticating (TC `37eae882`) — the existing `GoogleLoginButton` already accepts `loading`.
- Language selector default `VN`, persisted to the `NEXT_LOCALE` cookie (spec 1.2) — already implemented; must survive the auth redirect.
- Header logo, footer, hero visual are static and non-interactive — already implemented, visual-contract only.

## Unresolved

- Google Cloud OAuth client ID/secret are supplied by the user; until then the real-provider path cannot be exercised end to end. The E2E suite must therefore assert the guard/redirect/error behavior it can drive deterministically, and the credential-dependent happy path is validated manually.
- `node_modules/` is blocked by `.skignore`, so the bundled Next.js 16 docs (`node_modules/next/dist/docs/`) required by AGENTS.md cannot be read directly. Research falls back to context7.

### Post-study technical decisions (2026-09-06)

- Q: Server-side auth call standard? → A: **`getUser()`** — round-trips to the auth server on every check; widely documented. Use it consistently in `proxy.ts` and any server component. `getSession()` is BANNED for authorization decisions (not re-verified server-side).
- Q: Playwright `webServer` command for the canonical `test:e2e`? → A: **`pnpm build && pnpm start`** — exercises the production request pipeline the proxy guard actually runs on. No separate dev-server script.
- Q: E2E suite scope? → A: **Guard/redirect + click-contract only.** No Docker, no `supabase start` needed to run the suite: unauthenticated redirect, authenticated bounce off `/login`, click issues a well-formed `/auth/v1/authorize` URL, loading state, error message. Real seeded-session tests are explicitly OUT of scope.

### Verified stack facts (primary-sourced, govern the blueprint)

- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** (v16.0.0). Root-level file, exports a function named `proxy` (or default). Defaults to the Node.js runtime; the `runtime` config option THROWS if set. Verified at https://nextjs.org/docs/app/api-reference/file-conventions/proxy (v16.3.4). Docs explicitly endorse Proxy for authentication.
- `cookies()` from `next/headers` is **async** — `await cookies()`.
- `@supabase/ssr` ^0.12 uses the **`getAll`/`setAll`** cookie adapter. `get`/`set`/`remove` was removed in v0.4.0 and is unsupported.
- Google Cloud Console redirect URI = **GoTrue's** callback `http://127.0.0.1:54321/auth/v1/callback`, NOT the app's `/auth/callback`. 3-hop flow.
- `config.toml` `env()` reads a **root `.env`** (sibling of `supabase/`), NOT `.env.local` and NOT `supabase/.env`. Next.js app vars stay in `.env.local`. Both gitignored.
- Proxy-level redirect is a UX convenience, not the only authorization boundary — the Next docs warn a matcher change can silently drop Proxy coverage. Server components must still verify.

### Spec-stage gap resolution (2026-09-06, Rest Point 1.5)

- Q: How is the post-login redirect target carried through the 3-hop OAuth round-trip? → A: **The callback route recomputes `isBeforeLaunch()` itself and ignores any inbound hint.** No client-supplied `next` param is accepted or reflected — this removes the open-redirect surface entirely rather than mitigating it with allowlist validation. `redirectTo` passed to `signInWithOAuth` is a fixed `${origin}/auth/callback` with no query string.
- Q: Where does the failed-login error render? → A: **Inline, adjacent to the Google button**, in a `role="alert"` region so it is announced without stealing focus. Copy comes from the `login` i18n namespace (new key), never hard-coded. Gives the E2E suite a stable, locale-neutral anchor via `data-testid`.

### Blueprint rest-point decisions (2026-09-06)

- Q: Approve the 6-phase blueprint? → A: **Approved** — forge proceeds 01→06.
- Q: How is SC-002 (authenticated user bounced off `/login`) verified? → A: **Manual checklist in Phase 06.** It cannot be automated under the settled "no Docker in the E2E suite" constraint: `proxy.ts` calls `getUser()`, which round-trips to GoTrue, so a hand-seeded cookie yields `user = null` and the bounce never fires. Downgrading the guard to `getSession()` to make it testable is explicitly REJECTED — that would trade real security for test convenience.
- Q: English copy for the login failure message? → A: **"Sign-in failed. Please try again."** (`login:googleButton.error`), paired with the spec's Vietnamese "Đăng nhập không thành công. Vui lòng thử lại."
