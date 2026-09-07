---
name: eslint-airbnb-typescript-callback-param-names
description: This repo's eslint config (airbnb-base spread after eslint-config-next/typescript) flags callback parameter names inside TS type/interface declarations as no-unused-vars false positives
metadata:
  type: project
---

In `agentic-coding-hands-on`, `eslint.config.mjs` spreads `compat.extends("airbnb-base")`
AFTER `eslint-config-next/typescript`. airbnb-base's core (non-TS-aware) `no-unused-vars`
rule ends up active, and it flags parameter names inside TS callback-type declarations as
"unused" — e.g. `onChange: (tags: number[]) => void;` — because `@typescript-eslint/parser`'s
AST still gives eslint-scope a real function-scope binding for `tags`, and the base rule
doesn't know TS function-type positions aren't real declarations.

**Why:** confirmed via `kudos-hashtag-input.tsx`'s own pre-existing comment + working
`/* eslint-disable no-unused-vars */` wrap around its props interface. Reproduced the same
error on ~6 new interfaces I wrote with named callback params and fixed it the same way.

**How to apply:** whenever writing a TS interface/type with a named callback parameter
(`onX: (someName: T) => void`), wrap it in `/* eslint-disable no-unused-vars */` /
`/* eslint-enable no-unused-vars */` with a one-line comment pointing at this precedent,
rather than renaming params to `_` or restructuring the type. Also true of `no-use-before-define`
for helper function declarations used above their definition (airbnb does NOT exempt function
hoisting here) — move the helper above its first use instead of suppressing.
