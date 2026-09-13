-- Lets authorized dashboard users add, remove and reorder waiting customers.
begin;

create function public.add_staff_queue_entry(p_salon_id text, p_customer_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_position integer;
begin
  if auth.uid() is null or not (
    exists (select 1 from public.salon_members where salon_id = p_salon_id and user_id = auth.uid())
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then raise exception 'Kein Zugriff auf diesen Salon.'; end if;

  if char_length(btrim(coalesce(p_customer_name, ''))) not between 1 and 80 then
    raise exception 'Bitte gib einen Namen mit 1 bis 80 Zeichen ein.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_salon_id));
  if not exists (select 1 from public.salons where id = p_salon_id) then
    raise exception 'Salon nicht gefunden.';
  end if;

  select count(*)::integer + 1 into v_position
  from public.queue_entries where salon_id = p_salon_id and status = 'waiting';

  insert into public.queue_entries (salon_id, name, position, status)
  values (p_salon_id, btrim(p_customer_name), v_position, 'waiting')
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

create function public.remove_staff_queue_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id text;
begin
  select salon_id into v_salon_id
  from public.queue_entries where id = p_entry_id and status = 'waiting';
  if not found then raise exception 'Wartender Eintrag nicht gefunden.'; end if;

  if auth.uid() is null or not (
    exists (select 1 from public.salon_members where salon_id = v_salon_id and user_id = auth.uid())
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then raise exception 'Kein Zugriff auf diesen Salon.'; end if;

  perform pg_advisory_xact_lock(hashtext(v_salon_id));
  update public.queue_entries set status = 'removed'
  where id = p_entry_id and status = 'waiting';
  if not found then raise exception 'Wartender Eintrag nicht gefunden.'; end if;

  with ordered_entries as (
    select id, row_number() over (order by position, created_at, id)::integer as new_position
    from public.queue_entries where salon_id = v_salon_id and status = 'waiting'
  )
  update public.queue_entries q set position = ordered_entries.new_position
  from ordered_entries where q.id = ordered_entries.id;
end;
$$;

create function public.move_staff_queue_entry(p_entry_id uuid, p_direction integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id text;
  v_position integer;
  v_target_id uuid;
begin
  if p_direction not in (-1, 1) then raise exception 'Ungültige Verschieberichtung.'; end if;

  select salon_id into v_salon_id
  from public.queue_entries where id = p_entry_id and status = 'waiting';
  if not found then raise exception 'Wartender Eintrag nicht gefunden.'; end if;

  if auth.uid() is null or not (
    exists (select 1 from public.salon_members where salon_id = v_salon_id and user_id = auth.uid())
    or exists (select 1 from public.platform_admins where user_id = auth.uid())
  ) then raise exception 'Kein Zugriff auf diesen Salon.'; end if;

  perform pg_advisory_xact_lock(hashtext(v_salon_id));

  with ordered_entries as (
    select id, row_number() over (order by position, created_at, id)::integer as new_position
    from public.queue_entries where salon_id = v_salon_id and status = 'waiting'
  )
  update public.queue_entries q set position = ordered_entries.new_position
  from ordered_entries where q.id = ordered_entries.id;

  select position into v_position from public.queue_entries
  where id = p_entry_id and status = 'waiting' for update;
  if not found then raise exception 'Wartender Eintrag nicht gefunden.'; end if;

  select id into v_target_id from public.queue_entries
  where salon_id = v_salon_id and status = 'waiting' and position = v_position + p_direction
  for update;
  if not found then return; end if;

  update public.queue_entries
  set position = case when id = p_entry_id then v_position + p_direction else v_position end
  where id in (p_entry_id, v_target_id);
end;
$$;

revoke all on function public.add_staff_queue_entry(text, text) from public;
revoke all on function public.remove_staff_queue_entry(uuid) from public;
revoke all on function public.move_staff_queue_entry(uuid, integer) from public;
grant execute on function public.add_staff_queue_entry(text, text) to authenticated;
grant execute on function public.remove_staff_queue_entry(uuid) to authenticated;
grant execute on function public.move_staff_queue_entry(uuid, integer) to authenticated;

commit;
