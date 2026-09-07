---
name: shadcn-layer-not-installed
description: AGENTS.md mandates shadcn/ui + cn(), but components/ui/ and lib/utils.ts do not exist in this repo — every shipped component is hand-rolled Tailwind
metadata:
  type: project
---

Verified 2026-09-06 against the working tree:

- `components/ui/` **does not exist**; `git status` shows `components/ui/button.tsx` as deleted.
- `lib/utils.ts` **does not exist**, so `cn()` is unavailable.
- `grep -r "@/lib/utils\|@/components/ui"` over `app/`, `components/`, `lib/` returns **zero** hits.
  Every shipped component (kudos board, homepage, countdown, awards) is hand-written Tailwind with
  literal hex colors and `mm:<node-id>` comments tying it to Figma.
- The dependencies are all present though: `clsx`, `tailwind-merge`, `class-variance-authority`,
  `@base-ui/react`, the `shadcn` CLI, and a configured `components.json`
  (`style: base-nova`, `utils: @/lib/utils`, `ui: @/components/ui`).

**Why:** AGENTS.md says "reuse shadcn/ui components and `cn()` instead of creating duplicate
primitives", and a plan written against that assumption will tell an implementer to import things
that are not there — costing a round trip on every new dialog or dropdown.

**How to apply:** any plan introducing a new primitive (dialog, dropdown, popover, input) must
first restore `lib/utils.ts` and add the primitive via `pnpm dlx shadcn@latest add …`. If the
registry is unreachable, compose `@base-ui/react` directly under `components/ui/` with the same
export names — that is what the base-ui shadcn style wraps anyway. Do not hand-build another
bespoke modal shell; there are already three (`kudos-form-modal`, `sidebar-gift-dialog`,
`saa-rules-drawer`). See [[project-auth-and-testing-standards]].
