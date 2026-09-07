---
name: sun-kudos-missing-avatar-assets
description: supabase/seed.sql references /profile/avatar-sample-1.png and /profile/icons/icon-*.png that were never added under public/ — cosmetic broken image, not a test/rendering failure
metadata:
  type: project
---

Confirmed 2026-09-06. `supabase/seed.sql:113-116` sets the DEMO admin profile's (id
`...0001`, "Huỳnh Dương Xuân Nhật") `avatar_url` to `/profile/avatar-sample-1.png`; every other
seeded profile uses `/kudos/feed/*.png` or `/kudos/highlight/*.png`, which DO exist under
`public/`. `public/profile/` does not exist at all in this repo (also affects
`secret_box_icons.icon_url = '/profile/icons/icon-N.png'`, seed.sql:426+).

**Why:** `components/kudos-board/feed-post-person-block.tsx:23` renders this via `next/image`
with no `onError` fallback, so Next's image optimizer 404s server-side (logs `⨯ The requested
resource isn't a valid image for /profile/avatar-sample-1.png received null` on every request that
renders the demo admin's avatar — i.e. most board-reads test runs). This is purely a broken-image
icon in place of that one avatar; no e2e test asserts on avatar `src` or load success, so it never
fails a test and does not crash rendering.

**How to apply:** don't fabricate a placeholder PNG to silence the log — flag it for whoever owns
asset delivery to either add the real `public/profile/` assets or repoint the seed data at an
existing path. Not a blocker for feed/pagination work.
