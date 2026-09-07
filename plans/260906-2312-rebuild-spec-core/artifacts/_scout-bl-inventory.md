## Background Logic Source Inventory

### JS/TS

- custom-command: _(none found)_
- event-listener: _(none found)_
- integration: _(none found)_
- mail: _(none found)_
- middleware: _(none found)_
- notification: _(none found)_
- observer: _(none found)_
- queue-worker: _(none found)_
- scheduled-job: _(none found)_
- webhook: _(none found)_

<!-- Next.js is not a row in bl-source-patterns.md's per-stack table. Applied
     the [SIGNAL_INFERRED] search protocol (Mode-B grep marker set + manual
     folder-convention check for app/api/**, app/**/route.ts beyond the known
     routes, cron/queue/mail/webhook libraries) across app/, components/,
     lib/, hooks/, constants/ — zero qualifying hits. No app/api/ directory
     exists; the only route.ts is app/auth/callback/route.ts (OAuth code
     exchange, already tagged `route` in File Inventory, not a webhook
     receiver). lib/supabase/client.ts and server.ts are plain SDK client
     factories (bootstrap, not a distinguishing integration pattern) and were
     deliberately NOT force-fit into `integration` — see Notes. -->

### SQL/PL-pgSQL

- custom-command: _(none found)_
- event-listener: _(none found)_
- integration: _(none found)_
- mail: _(none found)_
- middleware: _(none found)_
- notification: _(none found)_
- observer: supabase/migrations/20260722090000_create_profile_on_signup.sql [SIGNAL_INFERRED]
  - Intent matched: observer — model lifecycle hook (row-created hook on `auth.users`)
  - No-row reason: stack=Postgres/PL-pgSQL trigger, no per-stack row in bl-source-patterns.md (table only covers app-framework stacks)
  - Observed pattern: `create or replace function public.handle_new_user() ... security definer` + `create trigger on_auth_user_created ... after insert on auth.users`
- observer: supabase/migrations/20260722100000_kudo_hearts.sql [SIGNAL_INFERRED]
  - Intent matched: observer — model lifecycle hook (recount on heart insert/delete)
  - No-row reason: same as above (Postgres trigger, no per-stack row)
  - Observed pattern: `create or replace function public.sync_kudo_hearts_count()` + `create trigger on_kudo_hearts_change`
- observer: supabase/migrations/20260906192000_heart_multiplier.sql [SIGNAL_INFERRED]
  - Intent matched: observer — model lifecycle hook (computes heart value pre-insert)
  - No-row reason: same as above
  - Observed pattern: `create or replace function public.resolve_heart_value() ... security definer` + `create trigger before_kudo_hearts_insert`
- observer: supabase/migrations/20260906193000_resolve_heart_value_no_definer.sql [SIGNAL_INFERRED]
  - Intent matched: observer — same trigger function, redefined
  - No-row reason: same as above
  - Observed pattern: `create or replace function public.resolve_heart_value()` (drops `security definer`; trigger binding from heart_multiplier.sql unchanged)
- queue-worker: _(none found)_
- scheduled-job: _(none found)_
- webhook: _(none found)_

<!-- supabase/migrations/20260906192500_secret_box_draw.sql defines
     `public.open_secret_box()` — a `security definer` RPC holding real
     business logic (randomized draw, unlock write, counter increment),
     called explicitly from app/sun-kudos/actions/open-secret-box.ts. It is
     NOT a trigger/lifecycle hook and does not match any of the 10 canonical
     BL types (closest candidates — integration, custom-command — both
     wrong: it's neither an external client nor a CLI command). Left out of
     this section per the "do not force-fit" rule; flagged here and in Notes
     for the permissions/RLS synthesis instead. -->
