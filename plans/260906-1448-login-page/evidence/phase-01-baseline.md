# Phase 01 evidence — baseline repair

Executed 2026-09-06 by takumi orchestrator (direct; no subagent — dependency install with objective pass criteria).

## Changes

- `pnpm add i18next@26.4.2 react-i18next@17.0.13` (dependencies)
- `pnpm add -D @playwright/test@1.63.0 eslint-plugin-playwright@2.11.0` (devDependencies)
- `next.config.ts` — removed `import createNextIntlPlugin from "next-intl/plugin"`, the
  `withNextIntl` wrapper, and `createNextIntlPlugin("./i18n/request.ts")` (pointed at a
  non-existent file). `images.remotePatterns` kept verbatim. Now `export default nextConfig`.
- `.gitignore` — verified only, unchanged (`.env*` already present at line 34).

## Results

| Gate                                 | Before                                                                   | After                                           |
| ------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `pnpm typecheck`                     | **exit 2** — ~30 × TS2307 "Cannot find module 'react-i18next'/'i18next'" | **exit 0**                                      |
| `pnpm build`                         | **failed** — next.config.ts resolved `./i18n/request.ts`, missing        | **exit 0** — 7 routes compiled, Turbopack, 2.8s |
| `pnpm lint` — `import/no-unresolved` | ~30                                                                      | **0**                                           |
| `pnpm lint` — total errors           | 80                                                                       | 34                                              |

## Remaining 34 lint errors — deliberately NOT fixed (out of scope per phase Non-functional)

Pre-existing style errors in files unrelated to this feature: `consistent-return` (6),
`no-unused-vars` (10), `no-use-before-define` (6), `no-void` (3), `import/order` (4),
`arrow-body-style` (1), a React `setState`-in-effect warning-as-error (1),
`tailwindcss/no-contradicting-classname` (2).

Owning files: components/kudos-board/_, components/kudos/_, components/common/language-selector.tsx,
components/homepage/saa-rules-drawer.tsx, hooks/use-click-outside.ts, lib/i18n/i18n.ts.

**Exception:** the 2 `tailwindcss/no-contradicting-classname` errors are in
`components/login/google-login-button.tsx:32` (`focus-visible:outline` conflicts with
`focus-visible:outline-2`). That file is owned by Phase 05, which fixes it there — in scope.

## Consequence for `pnpm validate`

`validate` = `format:check && lint && typecheck && build`. It still exits non-zero because
`lint` exits 1 on the 34 pre-existing errors. This is a CONFLICT inside phase-01's own spec:
its Overview says "prove `pnpm validate` exits 0" while its Non-functional section says
"do not touch the ~80 pre-existing unrelated lint errors". The three measurable Functional
criteria (typecheck 0, build 0, zero module-resolution errors) are all MET. Escalated to the
user at the forge rest point rather than resolved unilaterally in either direction.
