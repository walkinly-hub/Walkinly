-- Adds a 30-second, concurrency-safe undo window for dashboard chair actions.
begin;

create table public.dashboard_undo_actions (
  id uuid primary key default gen_random_uuid(),
  salon_id text not null references public.salons(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('serve_queue_entry', 'set_chair_status')),
  queue_entry_id uuid references public.queue_entries(id) on delete cascade,
  previous_chair_started_at timestamp without time zone,
  applied_chair_started_at timestamp without time zone,
  created_at timestamp with time zone not null default now(),
  undone_at timestamp with time zone
);

create index dashboard_undo_actions_latest_idx
  on public.dashboard_undo_actions (salon_id, created_at desc);

alter table public.dashboard_undo_actions enable row level security;
revoke all on public.dashboard_undo_actions from anon, authenticated;

create function public.set_salon_busy_with_undo(
  p_salon_id text,
  p_is_busy boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action_id uuid;
  v_previous_started_at timestamp without time zone;
  v_applied_started_at timestamp without time zone;
begin
  if auth.uid() is null or not (
    exists (select 1 from public.salon_members where salon_id = p_salon_id and user_id = auth.uid())
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_salon_id));

  select current_service_started_at into v_previous_started_at
  from public.salons where id = p_salon_id for update;
  if not found then raise exception 'Salon nicht gefunden.'; end if;

  v_applied_started_at := case when p_is_busy then clock_timestamp()::timestamp else null end;

  insert into public.dashboard_undo_actions (
    salon_id, actor_user_id, action_type,
    previous_chair_started_at, applied_chair_started_at
  ) values (
    p_salon_id, auth.uid(), 'set_chair_status',
    v_previous_started_at, v_applied_started_at
  ) returning id into v_action_id;

  update public.salons set current_service_started_at = v_applied_started_at
  where id = p_salon_id;

  return v_action_id;
end;
$$;

create function public.serve_queue_entry_with_undo(p_entry_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action_id uuid;
  v_salon_id text;
  v_previous_started_at timestamp without time zone;
  v_applied_started_at timestamp without time zone := clock_timestamp()::timestamp;
begin
  select salon_id into v_salon_id
  from public.queue_entries where id = p_entry_id and status = 'waiting';
  if not found then raise exception 'Aktiver Queue-Eintrag nicht gefunden.'; end if;

  if auth.uid() is null or not (
    exists (select 1 from public.salon_members where salon_id = v_salon_id and user_id = auth.uid())
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_salon_id));

  perform 1 from public.queue_entries where id = p_entry_id and status = 'waiting' for update;
  if not found then raise exception 'Aktiver Queue-Eintrag nicht gefunden.'; end if;

  select current_service_started_at into v_previous_started_at
  from public.salons where id = v_salon_id for update;

  insert into public.dashboard_undo_actions (
    salon_id, actor_user_id, action_type, queue_entry_id,
    previous_chair_started_at, applied_chair_started_at
  ) values (
    v_salon_id, auth.uid(), 'serve_queue_entry', p_entry_id,
    v_previous_started_at, v_applied_started_at
  ) returning id into v_action_id;

  update public.queue_entries set status = 'done' where id = p_entry_id;
  update public.salons set current_service_started_at = v_applied_started_at where id = v_salon_id;

  with ordered_entries as (
    select id, row_number() over (order by created_at, id)::integer as new_position
    from public.queue_entries where salon_id = v_salon_id and status = 'waiting'
  )
  update public.queue_entries q set position = ordered_entries.new_position
  from ordered_entries where q.id = ordered_entries.id;

  return v_action_id;
end;
$$;

create function public.undo_dashboard_action(p_action_id uuid)
returns table (action_type text, is_chair_occupied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action public.dashboard_undo_actions%rowtype;
  v_current_started_at timestamp without time zone;
begin
  select * into v_action from public.dashboard_undo_actions
  where id = p_action_id and actor_user_id = auth.uid() and undone_at is null
  for update;

  if not found or v_action.created_at < now() - interval '30 seconds' then
    raise exception 'Diese Aktion kann nicht mehr rückgängig gemacht werden.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_action.salon_id));

  if exists (
    select 1 from public.dashboard_undo_actions
    where salon_id = v_action.salon_id and created_at > v_action.created_at and undone_at is null
  ) then
    raise exception 'Seitdem wurde bereits eine weitere Dashboard-Aktion ausgeführt.';
  end if;

  select current_service_started_at into v_current_started_at
  from public.salons where id = v_action.salon_id for update;

  if v_current_started_at is distinct from v_action.applied_chair_started_at then
    raise exception 'Der Stuhlstatus wurde inzwischen verändert.';
  end if;

  if v_action.action_type = 'serve_queue_entry' then
    perform 1 from public.queue_entries
    where id = v_action.queue_entry_id and status = 'done' for update;
    if not found then raise exception 'Der Warteschlangeneintrag wurde inzwischen verändert.'; end if;

    update public.queue_entries set status = 'waiting' where id = v_action.queue_entry_id;

    with ordered_entries as (
      select id, row_number() over (order by created_at, id)::integer as new_position
      from public.queue_entries where salon_id = v_action.salon_id and status = 'waiting'
    )
    update public.queue_entries q set position = ordered_entries.new_position
    from ordered_entries where q.id = ordered_entries.id;
  end if;

  update public.salons set current_service_started_at = v_action.previous_chair_started_at
  where id = v_action.salon_id;
  update public.dashboard_undo_actions set undone_at = now() where id = v_action.id;

  return query select v_action.action_type, v_action.previous_chair_started_at is not null;
end;
$$;

revoke all on function public.set_salon_busy_with_undo(text, boolean) from public;
revoke all on function public.serve_queue_entry_with_undo(uuid) from public;
revoke all on function public.undo_dashboard_action(uuid) from public;
grant execute on function public.set_salon_busy_with_undo(text, boolean) to authenticated;
grant execute on function public.serve_queue_entry_with_undo(uuid) to authenticated;
grant execute on function public.undo_dashboard_action(uuid) to authenticated;

commit;
