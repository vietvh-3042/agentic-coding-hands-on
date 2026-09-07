-- Reviewer inspection Critical #1 (batch-a-inspection.md): every kudo
-- message was stored as `<p>${htmlEscaped(message)}</p>` (the removed
-- `escapeAndWrapMessage` in app/sun-kudos/actions/submit-kudo.ts, matching
-- the pre-existing seed convention), but rendered as plain React text with
-- no unwrap step, so the literal `<p>...&lt;3...</p>` markup showed up on
-- every card. `submitKudoAction` now stores plain trimmed text and
-- `supabase/seed.sql` has been rewritten to match — this migration corrects
-- any row already written under the old convention (a real deployment's
-- existing data; on a fresh `supabase db reset`, this runs BEFORE
-- `seed.sql` inserts any rows, so it is a no-op here).
--
-- Reverses the escaping in the exact opposite order it was applied
-- (', ", >, <, & last) so a literal "&" in the original message round-trips
-- correctly instead of being double-unescaped.

update public.kudos
set message = replace(
  replace(
    replace(
      replace(
        replace(
          regexp_replace(message, '^<p>(.*)</p>$', '\1'),
          '&#39;', ''''
        ),
        '&quot;', '"'
      ),
      '&gt;', '>'
    ),
    '&lt;', '<'
  ),
  '&amp;', '&'
)
where message ~ '^<p>.*</p>$';
