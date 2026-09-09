---
title: "Complete feature-based layered architecture migration"
description: "Finish the staged structural migration, restore all module paths, and enforce lightweight dependency direction without changing product behavior or auth boundaries."
status: pending
priority: P1
effort: 8h
branch: develop
tags: [refactor, architecture, frontend, backend, auth, tech-debt]
blockedBy: []
blocks: []
work_type: feature
created: 2026-09-09
---

# Feature-based Layered Architecture Migration

## Outcome and constraints

- Adopt `features/<feature>/{domain,application,infrastructure,presentation}` only where a feature needs that layer; keep cross-feature code in `shared/{config,hooks,i18n,infrastructure,lib,ui}`.
- Keep `app/` as Next.js composition, route-handler, and server boundary. Preserve Server Components, Server Actions, authentication, authorization, data contracts, rendering, and URLs.
- Complete the already-staged renames. No product redesign, database migration, API change, compatibility shim, barrel-file expansion, or speculative abstraction.
- Relevant ongoing plans: profile/menu and screen-gap work overlap in files but add no prerequisite; coordinate implementation against their current staged state.

## Architecture and data flow

`app route/page` → feature `application` action/use case → feature `domain` validation/types → feature `infrastructure` Supabase adapter → `shared/infrastructure/supabase` → Supabase. Server data returns through the application boundary to feature `presentation`; browser events call Server Actions/API routes. Shared UI, i18n, hooks, and config may be consumed by features; `domain` must not import `infrastructure`, `presentation`, React, Next.js, or Supabase-generated types.

## Phase 1 — Restore resolvable paths and composition boundaries (2h)

- **Depends on:** staged renames. **Owns:** `app/**`, `proxy.ts`, `components.json`, `eslint.config.mjs`, `package.json`, `e2e/**`, affected tests and import-only edits under `features/**`/`shared/**`.
- Update all stale `@/components`, `@/lib`, `@/hooks`, action, locale JSON, proxy, generated-type, shadcn alias, ESLint ignore, and script output paths. Declare the already-imported `@base-ui/react` package directly instead of relying on a transitive install. Keep server-only modules outside client import graphs.
- Inputs: route requests, UI events, test fixtures, generator/config paths. Transform: resolve to new canonical modules. Outputs: identical pages/actions and tooling with no old-path references.
- **Risk:** High likelihood / High impact — missed dynamic, JSON, or config path breaks builds/runtime. Countermove: repository-wide old-path scan plus typecheck/build and targeted route smoke tests.
- **Rollback:** revert import/config edits, then reverse staged renames as one atomic batch; do not leave mixed old/new paths.
- **Done:** `rg` finds no live references to moved paths (comments/docs may be updated separately); TypeScript and module resolution pass.

## Phase 2 — Enforce dependency direction and place shared constants (3h)

- **Depends on:** Phase 1. **Owns:** `features/kudos/domain/**`, `features/kudos/infrastructure/**`, `features/profile/domain/**`, relevant consumers, `shared/config/**`, and the existing root constants module.
- Move `FeedCursor`/`FeedPage` contracts to pure kudos domain modules; infrastructure implements/consumes them without domain re-exporting infrastructure. Extract star-tier values/types from Supabase/hashtag adapters so profile domain uses a pure feature/shared contract.
- Split the root constants by ownership: navigation/application-wide values under `shared/config`; department and kudos limits under their owning feature domain. Delete the old aggregate only after every consumer moves.
- Inputs: raw Supabase rows and shared configuration. Transform: infrastructure maps rows to domain contracts; domain computes validation/tier rules. Outputs: unchanged feed/profile view models and UI behavior.
- **Risk:** Medium likelihood / High impact — type relocation changes runtime imports or creates client bundles containing server code. Countermove: use `import type` where applicable, inspect dependency edges, test client/server compilation.
- **Rollback:** restore original type/constants exports and imports without altering persisted data or external contracts.
- **Done:** no domain→infrastructure/Supabase/Next/React imports; no duplicate constants; public action/page shapes remain identical.

## Phase 3 — Validate behavior, security, and migration completeness (3h)

- **Depends on:** Phases 1–2. **Owns:** validation fixes in files owned above; test files only when an existing path/assertion must follow the move.
- Unit/static: TypeScript strict checks, ESLint, formatting, Tailwind lint; add no test framework solely for this refactor. Integration: production build validates App Router server/client boundaries, actions, JSON, and generated aliases. E2E: existing login/auth guard, `/about`, `/award-info`, `/sun-kudos`, profile faces/feed, kudo submit/heart/secret-box flows.
- Security assertions: proxy and callback still verify sessions; every Server Action still calls `getUser()` and validates untrusted input; no Supabase server client reaches a client component.
- **Risk:** Medium likelihood / High impact — structural green checks mask auth or action regressions. Countermove: run existing Playwright coverage for auth and affected routes after build; compare action signatures and redirects before/after.
- **Rollback:** revert Phase 3-only corrections first; if behavior diverges, roll back Phases 2 then 1 atomically. No database rollback is required.
- **Done:** `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm build`, and affected Playwright suites pass; `git diff --summary` shows intended moves rather than delete/add churn; no stale moved-path imports remain.

## Dependency graph and release gate

`staged renames → Phase 1 → Phase 2 → Phase 3 → review`. Do not commit an intermediate phase: the old and new path layouts are one compatibility boundary. Release only after all gates pass; rollback is the single refactor commit/revert so routes, imports, and aliases cannot drift independently.
