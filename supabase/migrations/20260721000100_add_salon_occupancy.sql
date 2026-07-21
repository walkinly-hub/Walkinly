-- Tracks whether a salon chair is currently occupied without storing data
-- about a walk-in customer who did not join the digital queue.

alter table public.salons
add column if not exists current_service_started_at timestamp without time zone;

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
    (
      count(q.id)::integer +
      case when s.current_service_started_at is null then 0 else 1 end
    ) * coalesce(s.avg_duration, 0)
  from public.salons as s
  left join public.queue_entries as q
    on q.salon_id = s.id
   and q.status = 'waiting'
  where s.slug = p_salon_slug
  group by s.id, s.name, s.avg_duration, s.current_service_started_at;
$$;

create or replace function public.check_in(
  p_salon_slug text,
  p_customer_name text
)
returns table (
  entry_id uuid,
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
  returning id into v_entry_id;

  return query
  select
    v_entry_id,
    v_position,
    (
      v_position - 1 +
      case when v_salon.current_service_started_at is null then 0 else 1 end
    ) * coalesce(v_salon.avg_duration, 0);
end;
$$;

create or replace function public.set_salon_busy(
  p_salon_id text,
  p_is_busy boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.salon_members
    where salon_id = p_salon_id
      and user_id = auth.uid()
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  update public.salons
  set current_service_started_at = case when p_is_busy then now() else null end
  where id = p_salon_id;
end;
$$;

create or replace function public.serve_queue_entry(p_entry_id uuid)
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
    and status = 'waiting';

  if not found then
    raise exception 'Aktiver Queue-Eintrag nicht gefunden.';
  end if;

  if auth.uid() is null or not exists (
    select 1
    from public.salon_members
    where salon_id = v_salon_id
      and user_id = auth.uid()
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_salon_id));

  update public.queue_entries
  set status = 'done'
  where id = p_entry_id
    and status = 'waiting';

  update public.salons
  set current_service_started_at = now()
  where id = v_salon_id;

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

revoke all on function public.set_salon_busy(text, boolean) from public;
grant execute on function public.set_salon_busy(text, boolean) to authenticated;
