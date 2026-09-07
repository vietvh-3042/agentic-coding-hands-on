---
name: nextjs16-proxy-rename
description: Next.js 16 renamed middleware.ts to proxy.ts with an exported `proxy` function, Node runtime by default, and setting the `runtime` config option throws
metadata:
  type: project
---

This repo runs Next.js 16.3.1, where the middleware file convention changed and most training
data / tutorials are still wrong about it:

- `middleware.ts` → **`proxy.ts`** (repo root or `src/`), exporting a function named `proxy` or a
  default export. Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- Runtime defaults to **Node.js**; setting the `runtime` config option **throws**.
- `config.matcher` shape is unchanged.
- `cookies()` from `next/headers` is **async** — `await cookies()`.
- Verified against https://nextjs.org/docs/app/api-reference/file-conventions/proxy (v16.3.4).

Related trap in this repo: the official `vercel/next.js` `examples/with-supabase` proxy leaves
`/` public via a `pathname !== "/"` clause. Copying it verbatim silently unprotects the homepage.

**Why:** planning an auth guard against remembered Next 15 conventions produces a file Next 16
never loads, so the guard silently does nothing and every route stays public.

**How to apply:** any plan or review touching request-level auth, redirects, or rewrites in this
repo. AGENTS.md also mandates reading `node_modules/next/dist/docs/` first — that path is blocked
by `.skignore` here, so fall back to the version-stamped nextjs.org docs. See
[[project-auth-and-testing-standards]].
