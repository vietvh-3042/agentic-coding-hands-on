-- Reviewer inspection High #3 (batch-a-inspection.md): resolve_heart_value()
-- was declared `security definer` without needing owner privileges. The
-- BEFORE INSERT trigger only reads public.event_settings, which is already
-- SELECT-granted to anon/authenticated (20260722070000_grant_table_privileges.sql's
-- default-privilege grant, plus the table's own "readable by all" policy) and
-- sets NEW.hearts_value — nothing here requires running as the function
-- owner. Every `security definer` function is a privilege-escalation
-- surface by definition; one that isn't load-bearing should not exist.
--
-- `CREATE OR REPLACE FUNCTION` can change the security property without
-- dropping the function (signature/return type are unchanged), so the
-- existing trigger binding (`before_kudo_hearts_insert`) keeps working
-- untouched. `set search_path = public` is kept regardless — pinning it
-- costs nothing and remains good hygiene even for a security-invoker
-- function.
--
-- No behavior change: re-run supabase/tests/hearts-multiplier.sql to confirm
-- hearts_value still resolves to 1/2 exactly as before.

create or replace function public.resolve_heart_value()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.hearts_value := case
    when exists (
      select 1
      from public.event_settings
      where id = 1
        and special_day_start is not null
        and special_day_end is not null
        and now() between special_day_start and special_day_end
    ) then 2
    else 1
  end;
  return new;
end;
$$;
