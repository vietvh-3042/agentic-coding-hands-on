# Scout — Repo baseline before login/auth work

Date: 2026-09-06 · Branch: develop

## Verdict: baseline is RED. Must be repaired before any e2e-red-first gate is meaningful.

## 1. Missing runtime dependencies (BLOCKER)

`i18next` and `react-i18next` are imported by ~30 files but appear in **neither `package.json` nor `pnpm-lock.yaml`**.

```
pnpm typecheck  → exit 2 · TS2307 "Cannot find module 'react-i18next'" x ~30
pnpm lint       → exit 1 · 80 errors / 364 warnings (many are import/no-unresolved on the same modules)
```

Affected login files: `components/login/{google-login-button,hero-section,site-footer}.tsx`, `lib/i18n/i18n.ts`.

`next-intl@^4.14.2` IS a declared dependency but **zero files import it** — the codebase standardized on
react-i18next instead. Fix = add the two missing packages, not migrate to next-intl.

Consequence for test policy: the selected `e2e-red-first` gate requires a RED caused by a _screen assertion_.
A RED caused by an unresolvable module is a dependency failure and does NOT satisfy the gate. Baseline
repair is therefore phase 0, ahead of the tester's RED.

## 2. Supabase: declared, entirely unwired

- `@supabase/ssr@^0.12.6` + `@supabase/supabase-js@^2.115.0` in dependencies; **zero imports repo-wide**.
- No `supabase/` dir, no `config.toml`, no `.env*` file, no `middleware.ts`.
- `supabase` CLI not on PATH. `docker` IS available at /usr/bin/docker → local stack is feasible via `pnpm dlx supabase`.

## 3. Login screen: UI complete, auth absent

| File                                       | State                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `app/login/page.tsx`                       | Server component; composes header/hero/footer; Montserrat fonts scoped here                        |
| `components/login/site-header.tsx`         | Server component; logo + `LanguageSelector`                                                        |
| `components/login/hero-section.tsx`        | Client; **`handleLogin` just `router.push(isBeforeLaunch() ? "/countdown" : "/about")`** — no auth |
| `components/login/google-login-button.tsx` | Client; already accepts `loading` + renders spinner and `aria-busy`. `onClick` defaults to a no-op |
| `components/login/site-footer.tsx`         | Client; copyright bar                                                                              |

Assets present: `public/login/{google-icon,header-logo,root-further-bg,root-further-logo}.png`.

`GoogleLoginButton` is already shaped for the real flow — it needs `onClick` + `loading` wired, plus a new
error slot. No visual rework required.

## 4. i18n architecture (constrains the middleware design)

- Client-side i18next. `app/layout.tsx` (async server component) reads the `NEXT_LOCALE` cookie via
  `await cookies()` and passes `initialLocale` into `I18nProvider`.
- `LanguageSelector` writes `NEXT_LOCALE` from the browser via `document.cookie`.
- Namespaces are a closed list in `lib/i18n/settings.ts`; `login` already exists with `hero.*` + `googleButton.*`.
- **Middleware must not drop or overwrite `NEXT_LOCALE`** when it rewrites the response for Supabase
  cookie refresh — the classic `@supabase/ssr` footgun of constructing a fresh `NextResponse` applies.
- Error copy must land in `lib/i18n/locales/{en,vi}/login.json`, not be hard-coded.

## 5. Routes to guard

`/` · `/about` · `/countdown` · `/sun-kudos` · `/award-info` — all currently public server components.
`/login` is the only route that must stay reachable unauthenticated.
There are **no route handlers** anywhere yet (`app/**/route.ts` = none), so `app/auth/callback/route.ts` is net-new.

## 6. Toolchain facts for the plan

- No test runner of any kind. `pnpm validate` = format:check && lint && typecheck && build.
- eslint flat config extends `airbnb-base` + `eslint-plugin-tailwindcss`; `import/no-extraneous-dependencies` is OFF.
- `tsconfig.json` `include` is `**/*.ts`/`**/*.tsx` with `exclude: ["node_modules"]` → any new `e2e/` dir is
  type-checked automatically; Playwright types must therefore resolve or `pnpm typecheck` breaks.
- Path alias `@/*` → repo root.
- husky + lint-staged on commit; commitlint Conventional Commits.

## Unresolved

- Whether the 80 pre-existing lint errors should be fixed wholesale in this plan or only the ones this
  feature touches. Recommendation: fix only the blocking module-resolution errors + anything the new code
  introduces; leave unrelated `consistent-return`/`no-void` style errors to a separate cleanup.
- `node_modules/` is blocked by `.skignore`, so the Next.js 16 docs bundled at `node_modules/next/dist/docs/`
  (which AGENTS.md mandates reading) are unreadable from this session. Research fell back to context7.
