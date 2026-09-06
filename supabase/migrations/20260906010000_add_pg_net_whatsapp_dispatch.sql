-- Fallback for hosted projects where the Dashboard's internal
-- supabase_functions.http_request() helper is missing.
-- Prerequisites: pg_net enabled and a Supabase Vault secret named
-- walkinly_whatsapp_dispatch_secret. The secret value is never stored here.

do $$
begin
  if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    raise exception 'pg_net is not enabled';
  end if;
  if to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Supabase Vault is not enabled';
  end if;
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'walkinly_whatsapp_dispatch_secret'
      and char_length(decrypted_secret) >= 32
  ) then
    raise exception 'Vault secret walkinly_whatsapp_dispatch_secret is missing or too short';
  end if;
end;
$$;

create or replace function public.dispatch_whatsapp_reminder_via_pg_net()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'walkinly_whatsapp_dispatch_secret';

  if v_secret is null or char_length(v_secret) < 32 then
    -- Preserve the reminder as pending. Do not block the queue transaction.
    return new;
  end if;

  perform net.http_post(
    url := 'https://www.walkinly.ch/api/whatsapp/reminder',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(new),
      'old_record', null
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  -- A notification failure must never roll back a customer's queue update.
  return new;
end;
$$;

revoke all on function public.dispatch_whatsapp_reminder_via_pg_net() from public;

drop trigger if exists whatsapp_position_one_pg_net on public.whatsapp_reminders;
create trigger whatsapp_position_one_pg_net
after insert on public.whatsapp_reminders
for each row execute function public.dispatch_whatsapp_reminder_via_pg_net();

comment on function public.dispatch_whatsapp_reminder_via_pg_net() is
  'Dispatches a PII-minimal reminder event using pg_net and an encrypted Vault secret.';
