# Phase 03 — Local Supabase stack + env split

## Context Links

- Plan overview: [`plan.md`](./plan.md)
- CLI invocation, ports, `config.toml` block, env-file split: [`research/researcher-260906-1503-supabase-google-oauth-next16.md`](./research/researcher-260906-1503-supabase-google-oauth-next16.md) §§ 3, 6
- Config contract: [`spec/google-sign-in/technical-spec.md`](./spec/google-sign-in/technical-spec.md) § 4.6
- Trust boundary: [`spec/system/architecture.md`](./spec/system/architecture.md) § Trust Boundaries
- Decisions: [`clarifications.md`](./clarifications.md) § Product decisions, § Verified stack facts

## Overview

**Priority:** P1
**Status:** done_with_concerns
**Effort:** 1h
**Depends on:** Phase 01
**Parallel-safe with:** Phase 02 (disjoint files, no shared imports)

Scaffold the local Supabase project, enable Google as an external auth provider reading real
credentials from a **root `.env`**, and give the Next.js app its own `.env.local`. No application
code. This phase satisfies **FR-002** and supplies the configuration Phase 04 reads at request
time.

**Premise correction:** The plan assumed `supabase/` did not exist. In fact, a full tracked project
and running stack already existed (9 migrations, config, 11 containers). `supabase init` was NOT
run. Outcome: the phase's dependencies are satisfied with adaptations only. Outstanding: real
Google credentials and stack restart to apply config changes.

## Key Insights

- **Two env files, two consumers, and they are not interchangeable.** `supabase/config.toml`'s
  `env()` substitution reads a root `.env` (sibling of `supabase/`) — not `.env.local`, not
  `supabase/.env`. Next.js reads `.env.local`. Mixing them means either the CLI cannot find the
  Google secret or `NEXT_PUBLIC_*` vars leak into the CLI's environment for no reason.
- **`GOOGLE_CLIENT_SECRET` never enters Next.js code.** GoTrue performs the Google exchange
  server-side inside the Docker stack; the app only ever exchanges GoTrue's own second-hop code.
  Any Next.js file referencing that variable is a design error, not a convenience.
- **The Google Cloud redirect URI is GoTrue's, not the app's:**
  `http://127.0.0.1:54321/auth/v1/callback`. The app's `/auth/callback` is GoTrue's `redirectTo`
  target — a _later_ hop. Use `127.0.0.1` literally; Google matches the registered URI by exact
  host and `localhost` vs `127.0.0.1` is a documented mismatch footgun.
- `.gitignore` already carries `.env*`, which covers both files. **Verify, do not re-add** —
  Phase 02 owns `.gitignore` edits and a duplicate rule invites a merge conflict.
- The anon-key _name_ is unresolved: the CLI may print legacy `anon`/`service_role` JWTs or the
  newer `sb_publishable_*`/`sb_secret_*` format. Resolve empirically from `supabase start`'s own
  stdout — do not assume from docs. The client code is identical either way; only the env var
  value differs.
- `supabase` CLI is not installed. `pnpm dlx supabase` is the lowest-footprint path for a first
  run. Add it as a devDependency only if the team ends up running it routinely — that is a
  follow-up judgement, not a requirement of this phase (YAGNI).

## Requirements

**Functional**

- `supabase/config.toml` exists with `[auth]` `site_url` / `additional_redirect_urls` and an
  `[auth.external.google]` block reading `env(GOOGLE_CLIENT_ID)` / `env(GOOGLE_SECRET)`.
- Root `.env` holds the two Google values; `.env.local` holds the app's `NEXT_PUBLIC_*` values.
- `.env.example` (committed, no real values) documents both sets so a new machine can be set up.
- `pnpm dlx supabase status` reports the stack running and prints the API URL + anon key.

**Non-functional**

- Neither `.env` nor `.env.local` may ever be staged. Both are already covered by `.gitignore`'s
  `.env*`; the `.env.example` file must be force-added (`git add -f .env.example`) or renamed to
  a non-matching name if the team prefers no `-f`.
- The Docker stack is a **developer prerequisite**, never a prerequisite of the E2E suite.

## Architecture

```text
repo root
├── .env              GOOGLE_CLIENT_ID, GOOGLE_SECRET        → read by supabase CLI only
├── .env.local        NEXT_PUBLIC_SUPABASE_URL,
│                     NEXT_PUBLIC_SUPABASE_ANON_KEY,
│                     NEXT_PUBLIC_LAUNCH_AT                  → read by Next.js only
├── .env.example      both sets, placeholder values          → committed
└── supabase/
    └── config.toml   env("GOOGLE_CLIENT_ID"), env("GOOGLE_SECRET")
```

3-hop OAuth topology this configures:

```text
browser → GoTrue /auth/v1/authorize → Google consent
        → GoTrue /auth/v1/callback  (the URI registered in Google Cloud)
        → app  /auth/callback       (config.toml's additional_redirect_urls)
```

Local ports (from `supabase start`): API `54321`, DB `54322`, Studio `54323`, Mailpit `54324`.

## Related Code Files

**Create**

- `supabase/config.toml` (CLI-scaffolded, then edited)
- `supabase/.gitignore` (CLI-scaffolded — keep as generated)
- `.env` — `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_LAUNCH_AT`
- `.env.example` — both sets, placeholders only

**Verify only**

- `.gitignore` — confirm `.env*` present; no edit

**Modify / Delete** — none.

## Implementation Steps

1. `pnpm dlx supabase init` — scaffolds `supabase/config.toml` and `supabase/.gitignore`.
2. Edit `supabase/config.toml`:
   ```toml
   [auth]
   site_url = "http://localhost:3000"
   additional_redirect_urls = ["http://localhost:3000/auth/callback", "http://127.0.0.1:3000/auth/callback"]

   [auth.external.google]
   enabled = true
   client_id = "env(GOOGLE_CLIENT_ID)"
   secret = "env(GOOGLE_SECRET)"
   ```
   Both `localhost` and `127.0.0.1` app origins are listed because Playwright's `baseURL` is
   `127.0.0.1:3000` while `pnpm dev` serves `localhost:3000`; a missing entry rejects the
   redirect at GoTrue with an opaque error.
3. Create root `.env` with the real `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET` supplied by the user.
   If credentials are not yet available, write placeholders and mark the phase
   `DONE_WITH_CONCERNS` — everything downstream except the manual happy-path check still runs.
4. `pnpm dlx supabase start`. Capture stdout.
5. **Resolve the anon-key format from that stdout** (unresolved question § 5.3.3 of the technical
   spec). Record the actual printed key name in the phase report.
6. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, the anon key from
   step 5, and an explicit far-future `NEXT_PUBLIC_LAUNCH_AT` (see risk table).
7. Create `.env.example` mirroring both files with placeholder values and a comment naming each
   file's consumer.
8. In Google Cloud Console, register the authorized redirect URI
   `http://127.0.0.1:54321/auth/v1/callback` on the OAuth client. Nothing else.
9. `git status --short` — assert neither `.env` nor `.env.local` appears as staged or untracked-
   to-be-added.

## Todo List

- [x] `supabase/config.toml` present (pre-existing)
- [x] `[auth.external.google]` enabled with `env()` references (no literal secrets)
- [x] `additional_redirect_urls` corrected to cover both `localhost:3000` and `127.0.0.1:3000`
- [x] Root `.env` created with placeholder Google pair
- [x] Running stack confirmed; anon-key format recorded (legacy JWT, 153 chars)
- [x] `.env.local` created with URL + anon key + explicit `NEXT_PUBLIC_LAUNCH_AT`
- [x] `.env.example` created with placeholders only
- [ ] Real Google Cloud credentials supplied (user-side)
- [ ] `pnpm dlx supabase stop && supabase start` run to apply config changes (user-side)
- [x] `git status` clean of both secret files

## Success Criteria

| Check                       | Command                                                          | Expected                                           |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Stack up                    | `pnpm dlx supabase status`                                       | API `http://127.0.0.1:54321`, all services healthy |
| Google provider enabled     | `curl -s http://127.0.0.1:54321/auth/v1/settings \| grep google` | `"google":true` under `external`                   |
| No literal secret in config | `grep -E "client_id                                              | secret" supabase/config.toml`                      | only `env(...)` forms |
| Secrets not tracked         | `git check-ignore -v .env .env.local`                            | both matched by `.env*`                            |
| Redirect URI correct        | manual, Google Cloud Console                                     | `http://127.0.0.1:54321/auth/v1/callback`          |

## Risk Assessment

| Risk                                     | Likelihood | Impact       | Countermeasure                                                                                                                                                                                                           |
| ---------------------------------------- | ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A secret is committed                    | Low        | **Critical** | `.env*` already in `.gitignore`; step 9 verifies with `git check-ignore`; `config.toml` uses `env()` only, never literals                                                                                                |
| Google credentials not yet supplied      | High       | Medium       | Placeholders + `DONE_WITH_CONCERNS`; only the manual happy-path check in Phase 06 is blocked, and it is already flagged as an external blocker in `clarifications.md`                                                    |
| `redirect_uri_mismatch` at Google        | Medium     | Medium       | Register `127.0.0.1` **exactly** as the CLI prints it; the `localhost`/`127.0.0.1` mismatch is a documented footgun                                                                                                      |
| Redirect rejected by GoTrue during E2E   | Medium     | Medium       | Both app origins listed in `additional_redirect_urls` (step 2)                                                                                                                                                           |
| `NEXT_PUBLIC_LAUNCH_AT` left unset       | **High**   | High         | `lib/countdown-config.ts` silently defaults to _module-load + 8s_, making `isBeforeLaunch()` flip mid-session and every post-login-target assertion nondeterministic. Setting it explicitly is a hard step, not a nicety |
| Docker unavailable or image pull fails   | Medium     | Medium       | The E2E suite is deliberately Docker-free; only the manual happy-path check is blocked. Report the failure, do not stub the provider                                                                                     |
| Anon key format differs from expectation | Medium     | Low          | Resolved empirically in step 5; the client code accepts either — it is a string                                                                                                                                          |

## Security Considerations

- `GOOGLE_SECRET` lives only in the root `.env`, consumed entirely inside the Supabase CLI's
  Docker stack. It must never appear in `.env.local`, in any `NEXT_PUBLIC_*` var, in
  `config.toml` as a literal, or in any file under `app/`, `lib/`, or `components/`.
- The anon/publishable key **is** public by design and belongs in `.env.local` behind
  `NEXT_PUBLIC_`. Do not introduce `SUPABASE_SERVICE_ROLE_KEY` — nothing in this feature needs
  RLS bypass, and adding it creates an exfiltration target for no benefit.
- `.env.example` carries placeholders only. Review it before committing.

## Next Steps

Unblocks **Phase 04**. Report the resolved anon-key format and the exact API URL to Phase 04 and
into Phase 06's verification record. If credentials are still pending, carry that forward as an
open blocker on Phase 06's manual checklist only.

## Rollback

`pnpm dlx supabase stop && rm -rf supabase .env .env.local .env.example`. Nothing in the
application reads these until Phase 04, so rollback before Phase 04 is total; after Phase 04, a
rollback here breaks every guarded route until the env is restored.
