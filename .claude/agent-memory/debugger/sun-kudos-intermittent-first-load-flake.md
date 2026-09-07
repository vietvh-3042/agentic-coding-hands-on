---
name: sun-kudos-intermittent-first-load-flake
description: Board-reads TC 9dfda316 occasionally crashes on the very first page load after a cold `pnpm build && pnpm start` — separate from the data-kudo-id duplication bug
metadata:
  type: project
---

Observed 2026-09-06 in `/home/Workspaces/agentic-coding-hands-on`. `e2e/board/board-reads.spec.ts`
TC 9dfda316 (first test in the file) failed once in 4 clean `npx supabase db reset` + full
`board reads` grep runs, with a genuine Next.js error boundary ("A server error occurred. Reload
to try again.") — not an assertion mismatch. Isolated re-runs of the same test against a cold
server (including `--repeat-each=6`) never reproduced it; it only showed up once, embedded in the
full 9-test sequential run.

**Why it matters:** this is NOT the same root cause as [[sun-kudos-feed-dom-duplication]]. That
bug is deterministic (100% reproducible, exact 2x count) and present on every render regardless of
server warmth. This one is a low-frequency (~1-in-3 to 1-in-6) transient 500 that only appears
during/after a cold `next start` under the load of a full sequential test file — consistent with a
connection-pool or cold-cache race in the Supabase client or Next's production server warm-up, not
with anything in `feed-list.tsx`/`board-queries.ts`. Root cause not yet captured (never reproduced
with server logs attached — curl-based cookie replay against the raw server failed auth, and
direct repeat-each runs never triggered it).

**How to apply:** don't treat this test's occasional red as evidence the feed/pagination code
regressed. If it recurs, capture full `pnpm start` stdout/stderr (not just Playwright's
`[WebServer]` reporter lines, which are truncated) during a full, not isolated, board-reads run,
and grep for the Next.js error digest to get the real stack. A `test.retry` or a one-time warm-up
navigation before the suite would paper over it but wouldn't explain it.
