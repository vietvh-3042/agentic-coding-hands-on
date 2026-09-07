# Kudos data layer — schema, RLS, mock→table mapping, query patterns

> **Provenance:** the research agent returned this inline instead of writing it to disk, so four
> spec researchers started without it. Reconstructed verbatim by the orchestrator from the agent's
> own report. All schema claims were verified by that agent against the LIVE database
> (`docker exec supabase_db_mock-aidd-kudo-app psql`) — **no drift** vs the migrations, except the
> GRANT drift in §2.

## 1. Schema reference

**`public.profiles`** (`20260714070000_profile_schema.sql:7-18`; `language` added `20260716090000:6-8`; `role` added `20260723091000:5-7`)

```
id uuid PK → auth.users(id) ON DELETE CASCADE
display_name text NOT NULL
hero_code text NOT NULL                 -- free text ("CEVC3","CEVC10") — NOT a small enum
avatar_url text
hero_badge text NOT NULL DEFAULT 'new'  CHECK IN ('new','rising','legend','super')
boxes_opened integer NOT NULL DEFAULT 0
boxes_unopened integer NOT NULL DEFAULT 0
created_at timestamptz NOT NULL DEFAULT now()
language text DEFAULT 'vi' CHECK IN ('vi','en')
role text NOT NULL DEFAULT 'user' CHECK IN ('user','admin')
```

Trigger `handle_new_user()` (`20260722090000:6-32`, security definer) auto-inserts on `auth.users` insert.

**`public.kudos`** (`20260714070000:20-35`; anon+attachments `20260716100000:6-9`)

```
id uuid PK DEFAULT gen_random_uuid()
sender_id   uuid NOT NULL → profiles(id) CASCADE
receiver_id uuid NOT NULL → profiles(id) CASCADE
hashtag_title text NOT NULL DEFAULT ''
message text NOT NULL                    -- sanitized HTML wrapped in <p>
attachment_count integer NOT NULL DEFAULT 0
hashtags text NOT NULL DEFAULT ''        -- ⚠ single free-text blob, NOT structured ids
hearts_count integer NOT NULL DEFAULT 0  -- maintained by trigger
is_spam boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
is_anonymous boolean NOT NULL DEFAULT false
anonymous_name text
image_urls text[] NOT NULL DEFAULT '{}'
```

Indexes (`:34-35`): `kudos_receiver_id_created_at_idx (receiver_id, created_at desc)`, `kudos_sender_id_idx`.

**`public.kudo_hearts`** (`20260722100000:8-14`)

```
kudo_id uuid NOT NULL → kudos(id) CASCADE
user_id uuid NOT NULL → profiles(id) CASCADE
hearts_value int NOT NULL DEFAULT 1 CHECK IN (1,2)
created_at timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (kudo_id, user_id)   -- one like per user per kudo, structurally
```

Trigger `sync_kudo_hearts_count()` (`:63-85`, security definer) adjusts `kudos.hearts_count` by
`hearts_value` on INSERT/DELETE, floored at 0. **Source of truth for the count.**

**`public.notifications`** (`20260723090000:6-13`) — `user_id`, `title`, `body`, `read_at` (null=unread), `created_at`. Index `:15-16`.
**`public.event_settings`** (`20260714080000:11-15`) — singleton `id integer PK DEFAULT 1 CHECK (id=1)`, `launch_at timestamptz NOT NULL`, `updated_at`.
**`public.secret_box_icons`** / **`public.user_icon_unlocks`** (`20260714070000:37-49`) — icon catalog + `(user_id, icon_id)` composite-PK unlock table.
**Storage:** bucket `kudos-images`, public=true (`20260716100000:18-20`). Confirmed live.

## 2. RLS reality check

All 7 tables: `relrowsecurity=t`, `relforcerowsecurity=f`.

Quoted "do not ship" comments (both about READS being wide open):

- `20260714070000:51-52` — _"RLS: permissive read for local dev (anon + authenticated). Writes stay blocked (no insert/update/delete policies). Do NOT ship these to prod as-is."_
- `20260714080000:17-19` — _"RLS: permissive read for all... Writes stay blocked... Do NOT ship this to prod as-is."_

Authenticated-user capability (verified via `pg_policies`):

| Table             | SELECT   | INSERT                          | UPDATE                               | DELETE              |
| ----------------- | -------- | ------------------------------- | ------------------------------------ | ------------------- |
| profiles          | all rows | BLOCKED                         | **own row, NO column restriction** ⚠ | BLOCKED             |
| kudos             | all rows | own (`sender_id=auth.uid()`) ✅ | BLOCKED                              | BLOCKED             |
| kudo_hearts       | all rows | self, not own kudo ✅           | BLOCKED                              | own row (unlike) ✅ |
| notifications     | own rows | BLOCKED                         | own row (mark-read) ✅               | BLOCKED             |
| event_settings    | all rows | BLOCKED                         | BLOCKED                              | BLOCKED             |
| secret_box_icons  | all rows | BLOCKED                         | BLOCKED                              | BLOCKED             |
| user_icon_unlocks | all rows | **BLOCKED** ⚠                   | BLOCKED                              | BLOCKED             |

Findings:

1. **Kudo creation and hearting are NOT blocked** — policies already exist (`20260716100000:14-15`;
   `20260722100000:41-52`), including `WITH CHECK (user_id = auth.uid() AND auth.uid() <> kudos.sender_id)`.
2. **Secret-box unlock IS blocked** — `user_icon_unlocks` has only a SELECT policy. A client INSERT
   gets 42501. Needs a `security definer` RPC or service-role path.
3. **Privilege escalation** — `"profiles updatable by owner"` (`20260716090000:13-16`) is
   `USING/WITH CHECK (auth.uid() = id)` with **no column restriction**; an authenticated user can
   `update({role:'admin'})` on their own row. See the dedicated security report in this folder.
4. **GRANT drift** — `20260722070000:10-14` intends narrow grants; live reality is every table grants
   `arwdDxtm` to BOTH `anon` and `authenticated` from a pre-existing postgres-owned default ACL.
   **RLS is therefore the ONLY access control on this project.** Every new table needs explicit
   policies from creation; no GRANT will catch a policy mistake.

## 3. Mock → table mapping

`feed-mock-data.ts` → `KudoPost { id, sender, receiver, time, category, message, attachments[], hashtags: number[], likeCount }`

```ts
supabase
  .from("kudos")
  .select(
    `
  id, hashtag_title, message, image_urls, hearts_count, created_at, is_anonymous, anonymous_name,
  sender:profiles!kudos_sender_id_fkey(id, display_name, hero_code, avatar_url, hero_badge),
  receiver:profiles!kudos_receiver_id_fkey(id, display_name, hero_code, avatar_url, hero_badge)
`,
  )
  .order("created_at", { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);
```

Gaps with NO backing column:

- `hashtags: number[]` — `kudos.hashtags` is a free-text blob (seed `"#Dedicated #Inspring …"`). Needs the join table.
- `HighlightPerson.department: number` — `profiles.hero_code` is free text, not the 4-value `DEPARTMENTS` enum.
- `badgeLabel` — derive client-side from `hero_badge` via i18n.
- `OverviewStats.heartsMultiplier` ("x2") — no column.
- `GIFT_LEADERBOARD.description` ("Received 1 SAA T-shirt") — **no gifts/prizes table exists at all.**

`highlight-mock-data.ts` — same shape; real data = top N by hearts (business rule).
`spotlight-mock-data.ts` — `xPct/yPct/size/accent` are decorative, no DB source, stay client-computed. `name`+`receivedAt` from `kudos.receiver → profiles`. `SPOTLIGHT_TOTAL_KUDOS` → `count(*)`.
`kudos-mock-data.ts` — `Sunner {id,name}` → `select id, display_name from profiles`.

Aggregates: `select("*", {count:"exact", head:true})` filtered by `receiver_id` / `sender_id`;
`boxes_opened`/`boxes_unopened` read straight off `profiles`.

## 4. Query patterns (Next 16)

`app/sun-kudos/page.tsx` is already a server component — fetch there, pass as props. Pagination via
`.range(offset, offset+size-1)`, matching the existing `getKudoPostsPage(page)` mock signature.
Infinite scroll: the existing `IntersectionObserver` sentinel (`feed-list.tsx:41-58`) must call a
Server Action / route handler — a client component cannot import `lib/supabase/server.ts`.

**Realtime verdict: premature.** `select * from pg_publication_tables where pubname='supabase_realtime'`
returns **0 rows** — no table is published. Adopting it needs a migration plus subscription code.
Start server-fetched; add realtime only against a concrete requirement.

## 5. Where each read belongs

| Component                                           | Today                      | Recommendation                                  |
| --------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| `app/sun-kudos/page.tsx`                            | server                     | fetch here, pass down                           |
| `all-kudos-section.tsx`                             | client (toast only)        | accept `initialPosts` prop                      |
| `feed-list.tsx`                                     | client (pagination/filter) | keep client; swap mock call for a Server Action |
| `feed-kudo-post-card.tsx`                           | client (like, lightbox)    | presentational + one mutation                   |
| `highlight-section.tsx` / `highlight-kudo-card.tsx` | client (carousel)          | accept fetched data as prop                     |
| `sidebar-panel/-stats`                              | client (dialog state)      | fetch server-side, pass as props                |
| `sidebar-leaderboard.tsx`                           | **no** `"use client"`      | fetch server-side                               |
| `spotlight-board.tsx`                               | client (pan/zoom)          | accept node list as prop                        |
| `kudos-form-modal.tsx` / `write-kudos-bar.tsx`      | client                     | stays client; submit via Server Action          |

## 6. Mutations — ranked

1. **Server Actions (recommended)** — `"use server"` + `lib/supabase/server.ts`; cookie-bound, runs as
   the caller's `authenticated` role so RLS applies unchanged. `getUser()` first.
2. Route Handlers — same security, more boilerplate.
3. Direct client insert — RLS still enforced, but skips server-side validation/sanitization and
   rate-limiting. Acceptable only for the heart toggle; not for kudo creation.

## 7. Typegen

Worth it (TS strict, `any` discouraged). No types file exists today.

```bash
pnpm dlx supabase gen types typescript --local > lib/supabase/database.types.ts
```

Then `createBrowserClient<Database>` / `createServerClient<Database>`. Regenerate after each migration.

## 8. Seeded identities

`seed.sql:14-35` — only **`demo.user@sun-asterisk.com` / `TestLogin123!`** has a real bcrypt password
(id `00000000-0000-4000-8000-000000000001`, `role='admin'`, `seed.sql:127-128`).
`sender.one@` / `sender.two@` are Google-only (empty `encrypted_password`) — unusable locally without
real Google credentials. The login UI has NO password form, so local sign-in for verification must go
through the token endpoint:

```bash
curl -s "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: <anon-key>" -H "Content-Type: application/json" \
  -d '{"email":"demo.user@sun-asterisk.com","password":"TestLogin123!"}'
```

## Unresolved (product decisions)

1. `kudos.hashtags` free text → structured ids. **RESOLVED in clarifications.md: add a `kudo_hashtags` join table.**
2. `HighlightPerson.department` has no real column.
3. Gift/prize leaderboard has no table — out of scope this batch.
4. The `profiles` column-update gap — **RESOLVED: phase-0 fix via column-level GRANTs.**
