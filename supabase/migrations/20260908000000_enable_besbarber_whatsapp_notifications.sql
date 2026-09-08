-- Enables the already implemented opt-in WhatsApp reminder only for BESBARBER.
-- Apply manually in the production Supabase SQL Editor after dispatch setup.
do $$
declare
  v_updated integer;
begin
  update public.salons
  set whatsapp_notifications_enabled = true
  where id = 'besbarber'
    and whatsapp_notifications_enabled is distinct from true;

  get diagnostics v_updated = row_count;

  if not exists (select 1 from public.salons where id = 'besbarber') then
    raise exception 'BESBARBER salon not found; nothing was enabled';
  end if;

  raise notice 'BESBARBER WhatsApp enabled; rows changed: %', v_updated;
end;
$$;
