-- Resolves the name collision between the access_token return field and the
-- queue_entries column in the customer check-in function.

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

  insert into public.queue_entries as queue_entry (
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
  returning queue_entry.id, queue_entry.access_token into v_entry_id, v_access_token;

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
