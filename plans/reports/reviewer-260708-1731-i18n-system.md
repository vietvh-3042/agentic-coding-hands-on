# Review: multi-language (i18n) system

Scope: lib/i18n/*, components/common/i18n-provider.tsx, language-selector.tsx, app/layout.tsx, all 22 wired components, 18 locale JSON files.

## Critical

**C1. Shared i18next singleton mutated during SSR render → cross-request locale leakage.**
`lib/i18n/i18n.ts` exports a module-level `i18n` singleton. `components/common/i18n-provider.tsx` calls `initI18n(locale)` (which calls `i18n.changeLanguage(locale)` when already initialized) directly in the component _render body_, not in an effect. `app/layout.tsx` calls `cookies()`, which forces this route into per-request dynamic SSR (confirmed: no `output: "export"`, no middleware, plain `next start` Node server — not static). Client components are still executed server-side for the initial HTML.

Consequence: in a Node server handling concurrent requests (the normal case), two requests with different `NEXT_LOCALE` cookies (e.g. one EN, one JA) share the same `i18n` module instance across the whole process. `i18n.changeLanguage()` mutates global state; nothing scopes it per-request. If React's SSR yields between components (streaming, scheduler slicing) while another request's render also calls `changeLanguage`, request A's later `t()` calls can resolve against request B's language — users get mixed-language HTML. This directly contradicts the plan's own claim ("no flash/hydration mismatch") and is invisible in a sequential/manual test (VI→EN→JA one at a time), which is why it passed the already-completed browser verification.

Also produces the exact hydration-mismatch risk item 1 asked about: if the corrupted SSR HTML doesn't match what the client's own (separate, per-browser) i18next instance renders on hydration, React logs a hydration mismatch / briefly flashes wrong content.

Fix direction (not prescriptive): don't mutate a shared i18next instance during SSR. Either (a) create a fresh i18next instance per request on the server (`i18next.createInstance()`) instead of importing the shared default export, or (b) skip server-side translation entirely for the "use client" tree (guard init behind `typeof window !== "undefined"`) and accept a client-only first paint, or (c) move to a translation approach that doesn't rely on mutable global state per request (e.g. resolve strings server-side into props rather than rendering `t()` inside a shared-context provider that's also SSR'd).

## High

**H1. `npm run lint` fails because of this change — `components/common/language-selector.tsx:36-37`.**
`eslint-plugin-react-hooks`'s immutability rule flags `document.cookie = ...` and `document.documentElement.lang = ...` inside `changeLanguage` as "Modifying a variable defined outside a component or hook." 2 errors, plus an unused-var warning for the imported `locales` (imported from settings.ts but `LANGUAGES` array is hand-written instead of derived from it). Project rule requires "run linting before commit" / "DO NOT ignore failing tests just to pass the build" — this is a real lint failure introduced by the i18n work, not pre-existing (verified: no other wired component has lint errors; unrelated errors elsewhere are in `.claude/skills/*.cjs` tooling scripts, out of scope).

**H2. Content bug: 3 of 6 homepage award summaries share identical (wrong) description text, in all three locales.**
`lib/i18n/locales/{vi,en,ja}/home.json` → `awards.items.best-manager.description`, `signature-2025.description`, and `mvp.description` are byte-identical copy-paste of the best-manager blurb (verified for vi/en/ja). This is user-visible on the homepage award cards (`components/homepage/award-card.tsx` via `award-section.tsx`). Not an i18n-plumbing bug — the keys resolve correctly — but a real content defect baked into all three dictionaries. (The full award-detail-section.tsx descriptions in `awards.json` are correctly unique per award, so this is isolated to the homepage summary namespace.)

## Medium

**M1. Side-effecting `initI18n`/`changeLanguage` call during render, not in an effect.**
`I18nProvider` calls `initI18n(locale)` unconditionally on every render (component body, not `useEffect`/lazy-init). The `isInitialized` guard makes repeat calls a no-op for init, but the `else if (i18n.language !== locale) changeLanguage()` branch is an impure side effect during render — works today because it's idempotent and React doesn't currently break on it, but it's fragile under React's stricter concurrent rendering assumptions (this is also the mechanism that makes C1 possible — a pure-render component wouldn't be mutating shared state at all). Recommend wrapping this in `useState(() => initI18n(locale))` (lazy initializer) or a top-level effect, independent of fixing C1.

**M2. Accessibility strings left hardcoded/untranslated across most interactive components.**
Spot-checked and confirmed hardcoded (English only, all 3 locales render the same text): `aria-label="User profile"` / `"User menu"` (user-menu.tsx), `aria-label="Notifications"` ×2 (notification-menu.tsx), `aria-label="Change language"` / `"Language"` (language-selector.tsx), `aria-label="Sun* Annual Awards 2025 home"` (site-footer.tsx), `aria-label="Keyvisual Sun* Annual Award 2025"` (keyvisual-banner.tsx). Plan scope said "every visible UI string" — these are screen-reader-visible, not screen-visible, so arguably out of the literal scope, but it's a systemic gap worth a decision (intentional exclusion vs. oversight) rather than 6 independent misses.

## Low

**L1. `locales` imported but unused in `language-selector.tsx`** (flagged by lint as warning) — `LANGUAGES` is hand-maintained instead of derived from `settings.ts`'s `locales` array, so adding a locale requires updating two places.

**L2. `nav:aboutSaa` = "About SAA 2025" left in English for the `vi` locale** while `generalStandards` is translated ("Tiêu chuẩn chung"). Likely intentional (brand/event name), but inconsistent with `awardInformation`/`sunKudos` also being brand-adjacent yet still following the pattern — flag for content owner to confirm, not a code bug.

## Verified clean

- Key parity: scripted a full flatten-and-diff of all 6 namespaces × 3 locales — zero missing/extra keys anywhere. All literal `t("ns:key")` call sites and all dynamic `t(\`ns:${var}.x\`)` call sites (nav-links, category-nav, award-detail-section, award-section) resolve against real keys for every id used (`top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025`, `mvp`).
- `"use client"` boundaries: correct on every component using `useTranslation()`; `app/layout.tsx` correctly stays a server component and only awaits `cookies()` there.
- Convention adherence (`useTranslation()` with no ns arg, `t("ns:key")`) followed consistently across all 22 wired components — no stray `useTranslation("ns")` or bare unnamespaced keys found.
- `resolveLocale` fallback is sound (`locales.includes` narrows correctly, defaults to `vi` for garbage cookie values).

## Verdict

Core plumbing (dictionaries, key wiring, conventions) is solid — no missing keys, no orphaned strings beyond the aria-label gaps. But the SSR architecture has a real concurrency bug (C1) that the single-user/sequential manual verification could not have caught, plus a lint-breaking change (H1) and a content copy-paste bug (H2). Not production-ready until C1 is addressed; H1/H2 are quick fixes.

**Status:** DONE_WITH_CONCERNS
**Summary:** i18n wiring/keys/conventions are correct and complete, but the shared i18next singleton is mutated during SSR render, which is a genuine cross-request locale-leakage risk under concurrent load (Next.js server, `cookies()` forces dynamic per-request rendering). `npm run lint` also currently fails on the new `language-selector.tsx` (react-hooks/immutability), and 3 of 6 homepage award blurbs have duplicated/wrong copy in all three locales.
**Concerns/Blockers:** C1 (SSR singleton race) should block production deploy until resolved or consciously accepted as a low-traffic-risk tradeoff; H1 blocks a clean CI lint gate; H2 is a content fix, not code.
