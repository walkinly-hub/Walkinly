-- Identifies the first waiting customer when the current service has exceeded
-- the salon's configured average duration. The client uses this signal to show
-- a repeating five-minute estimate until staff completes the current service.

drop function if exists public.get_customer_queue_entry(uuid, uuid);

create function public.get_customer_queue_entry(
  p_entry_id uuid,
  p_access_token uuid
)
returns table (
  queue_position integer,
  estimated_wait_minutes integer,
  is_wait_taking_longer_than_expected boolean,
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
    (
      q.position = 1
      and s.current_service_started_at is not null
      and coalesce(s.avg_duration, 0) > 0
      and now()::timestamp >= s.current_service_started_at
        + make_interval(mins => coalesce(s.avg_duration, 0))
    ),
    q.status
  from public.queue_entries as q
  join public.salons as s on s.id = q.salon_id
  where q.id = p_entry_id
    and q.access_token = p_access_token;
$$;

revoke all on function public.get_customer_queue_entry(uuid, uuid) from public;
grant execute on function public.get_customer_queue_entry(uuid, uuid) to anon, authenticated;
