-- Makes wait estimates dynamic while a chair is occupied.
-- The client already refreshes the relevant RPCs regularly, so it can display
-- the decreasing estimate without writing a new value to the database each minute.

create or replace function public.get_queue_summary(p_salon_slug text)
returns table (
  salon_id text,
  salon_name text,
  avg_duration integer,
  waiting_count integer,
  estimated_wait_minutes integer
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    coalesce(s.avg_duration, 0),
    count(q.id)::integer,
    ceil(
      greatest(
        0::double precision,
        (
          case
            when s.current_service_started_at is null then 0
            else greatest(
              0::double precision,
              coalesce(s.avg_duration, 0)::double precision -
                extract(
                  epoch from (now()::timestamp - s.current_service_started_at)
                ) / 60.0
            )
          end
        ) + (count(q.id)::integer * coalesce(s.avg_duration, 0))
      )
    )::integer
  from public.salons as s
  left join public.queue_entries as q
    on q.salon_id = s.id
   and q.status = 'waiting'
  where s.slug = p_salon_slug
  group by s.id, s.name, s.avg_duration, s.current_service_started_at;
$$;

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
    ceil(
      greatest(
        0::double precision,
        ((v_position - 1) * coalesce(v_salon.avg_duration, 0))::double precision +
          case
            when v_salon.current_service_started_at is null then 0
            else greatest(
              0::double precision,
              coalesce(v_salon.avg_duration, 0)::double precision -
                extract(
                  epoch from (now()::timestamp - v_salon.current_service_started_at)
                ) / 60.0
            )
          end
      )
    )::integer;
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
    ceil(
      greatest(
        0::double precision,
        ((q.position - 1) * coalesce(s.avg_duration, 0))::double precision +
          case
            when s.current_service_started_at is null then 0
            else greatest(
              0::double precision,
              coalesce(s.avg_duration, 0)::double precision -
                extract(
                  epoch from (now()::timestamp - s.current_service_started_at)
                ) / 60.0
            )
          end
      )
    )::integer,
    q.status
  from public.queue_entries as q
  join public.salons as s on s.id = q.salon_id
  where q.id = p_entry_id
    and q.access_token = p_access_token;
$$;
