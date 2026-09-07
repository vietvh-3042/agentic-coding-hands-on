---
name: project-auth-and-testing-standards
description: Standing project decisions for SAA 2025 — Spec-Driven Development is ON, spec prose is English, server auth uses getUser() (getSession banned), and E2E is e2e-red-first with Playwright
metadata:
  type: project
---

Standing decisions made 2026-09-06 during the `/login` Google-OAuth planning session
(`plans/260702-1448-login-page/clarifications.md` is the authoritative record):

- **Spec-Driven Development mode is ON** for this project, persisted to `.tkm.json`. A feature
  spec is drafted before planning and promoted to `docs/features/` at implement-start. There is
  no `docs/` directory in the repo yet — it gets created at the first promotion.
- **Spec/doc prose language is English (`spec_lang: en`).** UI copy stays bilingual via the
  react-i18next `login`/`common`/etc. namespaces.
- **`getUser()` is the server-side auth standard. `getSession()` is BANNED** for any
  authorization decision — it is not re-verified against the Auth server.
- **Test policy is `e2e-red-first` with `@playwright/test`.** A screen-level assertion must
  produce a real non-zero-exit RED before implementation. A RED from a missing module, a missing
  browser binary, or a `webServer` boot failure does NOT satisfy the gate.
- **The E2E suite must stay Docker-free.** Consequence worth remembering: any test needing a
  genuine GoTrue-issued session (e.g. "authenticated user bounced off /login") cannot be
  automated under this constraint and is verified manually instead.
  **OPEN TENSION (raised 2026-09-06, awaiting the user):** Batch A cannot honor this. Every
  `/sun-kudos` assertion needs seeded rows _and_ a session `getUser()` accepts, i.e. a live
  GoTrue. The Batch A plan proposes containing it in a separate Playwright project
  (`chromium-authed`, `dependsOn: setup`) so the three existing auth specs still run with the
  stack down. Do not treat the amendment as accepted until the user says so.
  Harness note: never hand-encode the `sb-<ref>-auth-token` cookie — run `createServerClient` in
  the setup with a `setAll` capture adapter, call `signInWithPassword`, and write whatever
  `@supabase/ssr` emits into `storageState`.

**Why:** these were settled through a grill-style interview and are not re-litigable per feature;
re-opening them costs a round trip with the user for no new information.

**How to apply:** when planning any auth-touching or test-touching work in this repo, treat these
as given. Check `clarifications.md` in the active plan dir for feature-specific additions rather
than asking again. See [[nextjs16-proxy-rename]].
