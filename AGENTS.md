<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Instructions

## Stack

- Next.js `16.3.1` with the App Router.
- React `19.2.8` and TypeScript `5` in strict mode.
- Tailwind CSS `4` using `app/globals.css` as the CSS configuration entrypoint.
- shadcn/ui with the Base UI primitives. Component configuration lives in
  `components.json`; generated components belong in `components/ui/`.
- pnpm `10.28.0` and Node.js `22+`. Use `.nvmrc` to select Node 22.

## Repository Layout

```text
app/                 Next.js routes, layouts, and global styles
components/ui/       shadcn/ui components
lib/                 Shared utilities, including cn()
public/              Static assets
components.json      shadcn/ui configuration
eslint.config.mjs    ESLint flat configuration
lint-staged.config.mjs  Pre-commit file checks
```

Use the existing `@/*` TypeScript alias for imports from the project root.

## Development Commands

Run commands with pnpm:

```bash
pnpm dev              # Start local development
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint and Tailwind issues, then format files
pnpm tailwind:lint    # Check Tailwind classes
pnpm format:check     # Check Prettier formatting
pnpm typecheck        # Run TypeScript without emitting files
pnpm validate         # Formatting, lint, typecheck, and production build
pnpm build            # Create a production build
```

`pnpm lint:fix` uses both ESLint and `tailwind-lint`; do not remove either step
when changing the script. `tailwind-lint` requires Node 22 or newer.

## Code and UI Rules

- Keep application code in the App Router structure under `app/`.
- Prefer server components by default. Add `"use client"` only when browser
  state, effects, or event handlers require it.
- Reuse shadcn/ui components and `cn()` instead of creating duplicate primitive
  components or ad-hoc class-merging utilities.
- Before implementing a feature, check `components/ui/` for an existing
  component that satisfies the UI requirement. If it does not exist, search the
  shadcn/ui component registry and add the closest suitable component to the
  source code before composing the feature. Do not hand-build a component that
  shadcn/ui already provides.
- Keep Tailwind classes readable and let `prettier-plugin-tailwindcss` and
  `tailwind-lint` normalize their order.
- Keep TypeScript strict and avoid `any` unless an external API makes it
  unavoidable.
- Follow the existing formatting and ESLint rules. Prettier is authoritative
  for formatting; ESLint is authoritative for code-quality rules.
- Use kebab-case for new filenames unless a framework or generated component
  convention requires another name.

## Git Hooks and Commits

- Husky runs `lint-staged` before commits.
- `lint-staged.config.mjs` runs ESLint and Prettier on staged source files and
  Prettier on staged JSON, CSS, and Markdown files.
- Commit messages are checked by commitlint using Conventional Commits, such
  as `feat: add profile card` or `fix: handle empty state`.
- Never commit secrets, `.env` files, `node_modules`, `.next`, or build output.

## Verification Expectations

After implementation, run at least:

```bash
pnpm lint
pnpm typecheck
pnpm format:check
```

For changes affecting routes, styling, dependencies, or build configuration,
also run `pnpm build`. If the default Turbopack build is blocked by the local
environment, verify with `pnpm exec next build --webpack` and report the
environment limitation.
