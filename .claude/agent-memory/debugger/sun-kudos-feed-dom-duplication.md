---
name: sun-kudos-feed-dom-duplication
description: Root cause of SC-001/BR-002 "duplicate data-kudo-id" e2e failures on the Sun* Kudos board — not a data/fetch bug, a shared DOM attribute on a nested child
metadata:
  type: project
---

Fixed 2026-09-06 in `/home/Workspaces/agentic-coding-hands-on`. `e2e/board/board-reads.spec.ts`
locates feed cards via `feed.locator("[data-kudo-id]")`. Both `feed-kudo-post-card.tsx`'s root
`<article data-kudo-id>` AND the nested `heart-button.tsx`'s `<button data-kudo-id>` carried the
same attribute, so every card matched twice — exact 2x ratio, present on the very first render
(no scroll/fetch involved). `highlight-kudo-card.tsx` had the identical nested-HeartButton shape,
so any future locator scoped to Highlight would hit the same bug.

**Why:** A prior phase-06 report claimed this exact symptom was an IntersectionObserver
re-fire/stale-cursor bug and "fixed" it with a single-mount-observer + `isFetchingRef` guard. That
fix was real (it does stop a genuine double-fetch) but was not the cause of the 2x ratio the tests
actually measured — it went green only because phase 07's tests had already grown the DB, changing
the ratio enough to hide the real bug. The actual cause was proven by a throwaway Playwright probe
spec (`page.$$eval('[data-testid="feed-list"] [data-kudo-id]', ...)`) showing 2 elements
(ARTICLE + BUTTON) per real kudo on the FIRST page load, before any scroll — which rules out
observer/cursor/hydration timing entirely.

**How to apply:** In this repo, when an e2e assertion counts elements by a shared identity
attribute (`data-kudo-id`, likely also `data-*-id` patterns elsewhere) and the count is off by an
exact integer multiple, check for the SAME attribute on a nested child component before assuming
a data-layer or fetch/pagination bug. Root-cause with a throwaway probe spec using `$$eval` to
dump `{tag, testid, id}` per match — cheap, fast, and conclusive either way. See also
[[sun-kudos-intermittent-first-load-flake]] and [[sun-kudos-missing-avatar-assets]].
