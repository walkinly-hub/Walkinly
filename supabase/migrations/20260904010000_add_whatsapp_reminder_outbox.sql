-- Apply manually in Supabase. No existing customers are backfilled.
create table public.whatsapp_reminders (
  queue_entry_id uuid primary key references public.queue_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  state text not null default 'pending' check (state in ('pending', 'sending', 'accepted', 'failed', 'skipped')),
  reference text
);
alter table public.whatsapp_reminders enable row level security;
revoke all on public.whatsapp_reminders from anon, authenticated;
grant select, update on public.whatsapp_reminders to service_role;

create function public.enqueue_whatsapp_reminder()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if TG_TABLE_NAME = 'customer_notification_preferences' then
    v_id := NEW.queue_entry_id;
  else
    v_id := NEW.id;
  end if;
  insert into public.whatsapp_reminders(queue_entry_id)
    select q.id from public.queue_entries q
    join public.salons s on s.id = q.salon_id
    join public.customer_notification_preferences p on p.queue_entry_id = q.id
    where q.id = v_id and q.status = 'waiting' and q.position = 1
      and s.whatsapp_notifications_enabled and p.channel = 'whatsapp'
    on conflict do nothing;
  return NEW;
end;
$$;
revoke all on function public.enqueue_whatsapp_reminder() from public;

-- Preference INSERT covers check-in directly at position one: preferences are
-- inserted AFTER the queue row in the existing check-in transaction.
create trigger whatsapp_reminder_on_consent after insert on public.customer_notification_preferences
  for each row execute function public.enqueue_whatsapp_reminder();
create trigger whatsapp_reminder_on_position after update of position, status on public.queue_entries
  for each row when (NEW.position = 1 and NEW.status = 'waiting'
    and (OLD.position is distinct from NEW.position or OLD.status is distinct from NEW.status))
  execute function public.enqueue_whatsapp_reminder();

-- Atomic claim prevents duplicate webhook deliveries/concurrent requests from
-- sending twice. Never automatically retry a claimed send: Meta may have accepted
-- it even if our process timed out. Only service_role can obtain contact data.
create function public.claim_whatsapp_reminder(p_entry_id uuid)
returns table (recipient_phone text, customer_name text, salon_name text)
language plpgsql security definer set search_path = public as $$
declare v_salon_id text;
begin
  select salon_id into v_salon_id from public.queue_entries where id = p_entry_id;
  if v_salon_id is null then return; end if;
  perform pg_advisory_xact_lock(hashtext(v_salon_id));
  update public.whatsapp_reminders set state = 'sending', claimed_at = now()
    where queue_entry_id = p_entry_id and state = 'pending';
  if not found then return; end if;
  return query
    select p.phone_e164, q.name, s.name
    from public.queue_entries q
    join public.salons s on s.id = q.salon_id
    join public.customer_notification_preferences p on p.queue_entry_id = q.id
    join public.whatsapp_reminders r on r.queue_entry_id = q.id
    where q.id = p_entry_id and q.status = 'waiting' and q.position = 1
      and s.whatsapp_notifications_enabled and p.channel = 'whatsapp'
      and r.created_at > now() - interval '5 minutes';
  if not found then
    update public.whatsapp_reminders set state = 'skipped' where queue_entry_id = p_entry_id;
  end if;
end;
$$;
revoke all on function public.claim_whatsapp_reminder(uuid) from public, anon, authenticated;
grant execute on function public.claim_whatsapp_reminder(uuid) to service_role;
