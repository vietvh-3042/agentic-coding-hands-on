# Phase 03 evidence — local Supabase + env split

Executed 2026-09-06. **The phase plan was written against a wrong premise and was corrected mid-execution.**

## Premise correction (user-approved: "Adapt to it — minimal edits only")

The plan said "no `supabase/` directory exists; run `supabase init`". FALSE. The session-start
`git status` was truncated at 2KB, hiding it. Ground truth:

- `supabase/` **is tracked in git** (staged, not yet in HEAD): `config.toml`, `.gitignore`,
  **9 migrations**, `seed.sql`. `project_id = "mock-aidd-kudo-app"`.
- A **full local stack is already running** for this project: 11 containers
  (`supabase_*_agentic-coding-hands-on`). GoTrue **v2.195.0 healthy** on `http://127.0.0.1:54321`
  (`/auth/v1/health` → 200).
- `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true` already.
- Migration `20260722090000_create_profile_on_signup.sql` installs a `handle_new_user` trigger that
  auto-creates a `public.profiles` row on every new `auth.users` insert — so a Google sign-in
  provisions a profile automatically. Not anticipated by the spec; no action needed, but it means
  the first real Google login has a **database side effect**.

`supabase init` was NOT run. No reset, no reinitialize, no container restart.

## Deviation 1 — env var names

Plan assumed `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET`. The existing `supabase/config.toml:341-342`
actually reads:

```toml
client_id = "env(SUPABASE_AUTH_GOOGLE_CLIENT_ID)"
secret    = "env(SUPABASE_AUTH_GOOGLE_SECRET)"
skip_nonce_check = true
```

The existing names are used. The running container confirms both are currently `PLACEH…` values.

## Deviation 2 — redirect allow-list was broken (fixed)

Before:

```toml
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:3000/auth/callback"]
```

Two defects: the first entry is **https** against a local http server AND carries no `/auth/callback`
path; neither entry covers `http://127.0.0.1:3000/auth/callback`, which is exactly what Playwright's
`baseURL` (`http://127.0.0.1:3000`) produces. GoTrue would have rejected the final hop.

After (user-approved):

```toml
additional_redirect_urls = ["http://127.0.0.1:3000/auth/callback", "http://localhost:3000/auth/callback"]
```

## Files written

| File                   | Contents                                                                             | Git                                               |
| ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `.env`                 | `SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET` — **placeholders**   | ignored (`.gitignore:38 .env*`)                   |
| `.env.local`           | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_LAUNCH_AT` | ignored                                           |
| `.env.example`         | both sets, placeholders + the Google Cloud redirect-URI instruction                  | ignored by `.env*` — needs `git add -f` to commit |
| `supabase/config.toml` | one line changed (allow-list)                                                        | already staged                                    |

Anon key was read from the **running stack**, not assumed: format is the **legacy JWT**
(JWT header prefix, 153 chars — value not reproduced here), not the newer `sb_publishable_*`. This resolves UNVERIFIED item #1
in the Supabase research report.

`NEXT_PUBLIC_LAUNCH_AT` pinned to `2026-12-31T18:00:00+07:00` (future ⇒ `isBeforeLaunch()` true
⇒ post-login target `/countdown`, deterministic). Without it `lib/countdown-config.ts` defaults to
module-load + 8s and the destination flips mid-run.

## OUTSTANDING — required before the real Google hop works

1. User supplies real Google OAuth credentials into `.env` (replacing both placeholders).
   Google Cloud authorized redirect URI must be `http://127.0.0.1:54321/auth/v1/callback`.
2. **The running stack must then be restarted** (`pnpm dlx supabase stop && pnpm dlx supabase start`)
   — the live GoTrue container still holds the OLD config: `GOTRUE_URI_ALLOW_LIST=https://127.0.0.1:3000`
   and placeholder Google creds. The `config.toml` edit above does NOT take effect until restart.
   Deliberately NOT restarted now: with placeholder credentials a restart buys nothing, and one
   restart after the real creds land applies both changes together.

Neither blocks Phases 02, 04, 05, or the automated E2E suite — none of which need a real Google hop.

**Status:** DONE_WITH_CONCERNS (credentials + restart outstanding; both are user-side)
