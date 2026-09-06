-- Exposes privacy-preserving dashboard statistics from existing queue and feedback data.
begin;

create index if not exists queue_entries_salon_created_idx
  on public.queue_entries (salon_id, created_at desc);

create function public.get_dashboard_statistics(
  p_salon_id text,
  p_days integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_queue_since timestamp without time zone;
  v_feedback_since timestamp with time zone;
begin
  if p_days not in (7, 30, 90) then
    raise exception 'Ungültiger Statistikzeitraum.';
  end if;

  if auth.uid() is null or not (
    exists (
      select 1 from public.salon_members
      where salon_id = p_salon_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.platform_admins where user_id = auth.uid()
    )
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  if not exists (select 1 from public.salons where id = p_salon_id) then
    raise exception 'Salon nicht gefunden.';
  end if;

  v_queue_since := (now() at time zone 'Europe/Zurich') - make_interval(days => p_days);
  v_feedback_since := now() - make_interval(days => p_days);

  select jsonb_build_object(
    'check_ins', (
      select count(*) from public.queue_entries
      where salon_id = p_salon_id and created_at >= v_queue_since
    ),
    'served', (
      select count(*) from public.queue_entries
      where salon_id = p_salon_id and created_at >= v_queue_since and status = 'done'
    ),
    'removed', (
      select count(*) from public.queue_entries
      where salon_id = p_salon_id and created_at >= v_queue_since and status = 'removed'
    ),
    'feedback_count', (
      select count(*) from public.salon_feedback
      where salon_id = p_salon_id and created_at >= v_feedback_since
    ),
    'average_rating', (
      select round(avg(rating), 1) from public.salon_feedback
      where salon_id = p_salon_id and created_at >= v_feedback_since
    ),
    'rating_distribution', jsonb_build_object(
      '1', (select count(*) from public.salon_feedback where salon_id = p_salon_id and created_at >= v_feedback_since and rating = 1),
      '2', (select count(*) from public.salon_feedback where salon_id = p_salon_id and created_at >= v_feedback_since and rating = 2),
      '3', (select count(*) from public.salon_feedback where salon_id = p_salon_id and created_at >= v_feedback_since and rating = 3),
      '4', (select count(*) from public.salon_feedback where salon_id = p_salon_id and created_at >= v_feedback_since and rating = 4),
      '5', (select count(*) from public.salon_feedback where salon_id = p_salon_id and created_at >= v_feedback_since and rating = 5)
    ),
    'daily_check_ins', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', days.day::date, 'count', coalesce(entries.entry_count, 0))
        order by days.day
      )
      from generate_series(
        (now() at time zone 'Europe/Zurich')::date - (p_days - 1),
        (now() at time zone 'Europe/Zurich')::date,
        interval '1 day'
      ) as days(day)
      left join (
        select created_at::date as day, count(*) as entry_count
        from public.queue_entries
        where salon_id = p_salon_id and created_at >= v_queue_since
        group by created_at::date
      ) entries on entries.day = days.day::date
    ), '[]'::jsonb),
    'recent_feedback', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', recent.id,
        'rating', recent.rating,
        'comment', recent.comment,
        'created_at', recent.created_at
      ) order by recent.created_at desc)
      from (
        select id, rating, comment, created_at
        from public.salon_feedback
        where salon_id = p_salon_id and created_at >= v_feedback_since
        order by created_at desc
        limit 5
      ) recent
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_dashboard_statistics(text, integer) from public;
grant execute on function public.get_dashboard_statistics(text, integer) to authenticated;

commit;
