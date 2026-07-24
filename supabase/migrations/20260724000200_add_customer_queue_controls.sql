-- Gives each customer a private capability token for their own queue entry.
-- The token is stored only in that customer's browser and is required to read
-- the live position or to leave the queue without a customer account.

alter table public.queue_entries
add column if not exists access_token uuid not null default gen_random_uuid();

create or replace function public.check_in_customer(
  p_salon_slug text,
  p_customer_name text
)
returns table (
  entry_id uuid,
  access_token uuid,
  queue_position integer,
  estimated_wait_minutes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon public.salons%rowtype;
  v_position integer;
  v_entry_id uuid;
  v_access_token uuid;
begin
  if char_length(btrim(coalesce(p_customer_name, ''))) not between 1 and 80 then
    raise exception 'Bitte gib einen Namen mit 1 bis 80 Zeichen ein.';
  end if;

  select *
  into v_salon
  from public.salons
  where slug = p_salon_slug;

  if not found then
    raise exception 'Salon nicht gefunden.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_salon.id));

  with ordered_entries as (
    select
      id,
      row_number() over (order by created_at, id)::integer as new_position
    from public.queue_entries
    where salon_id = v_salon.id
      and status = 'waiting'
  )
  update public.queue_entries as queue_entry
  set position = ordered_entries.new_position
  from ordered_entries
  where queue_entry.id = ordered_entries.id;

  select count(*)::integer + 1
  into v_position
  from public.queue_entries
  where salon_id = v_salon.id
    and status = 'waiting';

  insert into public.queue_entries (
    salon_id,
    name,
    position,
    status
  )
  values (
    v_salon.id,
    btrim(p_customer_name),
    v_position,
    'waiting'
  )
  returning id, access_token into v_entry_id, v_access_token;

  return query
  select
    v_entry_id,
    v_access_token,
    v_position,
    (
      v_position - 1 +
      case when v_salon.current_service_started_at is null then 0 else 1 end
    ) * coalesce(v_salon.avg_duration, 0);
end;
$$;

create or replace function public.get_customer_queue_entry(
  p_entry_id uuid,
  p_access_token uuid
)
returns table (
  queue_position integer,
  estimated_wait_minutes integer,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    q.position,
    (
      q.position - 1 +
      case when s.current_service_started_at is null then 0 else 1 end
    ) * coalesce(s.avg_duration, 0),
    q.status
  from public.queue_entries as q
  join public.salons as s on s.id = q.salon_id
  where q.id = p_entry_id
    and q.access_token = p_access_token;
$$;

create or replace function public.leave_queue_entry(
  p_entry_id uuid,
  p_access_token uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id text;
begin
  select salon_id
  into v_salon_id
  from public.queue_entries
  where id = p_entry_id
    and access_token = p_access_token
    and status = 'waiting';

  if not found then
    raise exception 'Der wartende Eintrag wurde nicht gefunden.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_salon_id));

  update public.queue_entries
  set status = 'removed'
  where id = p_entry_id
    and access_token = p_access_token
    and status = 'waiting';

  if not found then
    raise exception 'Der wartende Eintrag wurde nicht gefunden.';
  end if;

  with ordered_entries as (
    select
      id,
      row_number() over (order by created_at, id)::integer as new_position
    from public.queue_entries
    where salon_id = v_salon_id
      and status = 'waiting'
  )
  update public.queue_entries as queue_entry
  set position = ordered_entries.new_position
  from ordered_entries
  where queue_entry.id = ordered_entries.id;
end;
$$;

revoke all on function public.check_in_customer(text, text) from public;
revoke all on function public.get_customer_queue_entry(uuid, uuid) from public;
revoke all on function public.leave_queue_entry(uuid, uuid) from public;

grant execute on function public.check_in_customer(text, text) to anon, authenticated;
grant execute on function public.get_customer_queue_entry(uuid, uuid) to anon, authenticated;
grant execute on function public.leave_queue_entry(uuid, uuid) to anon, authenticated;
