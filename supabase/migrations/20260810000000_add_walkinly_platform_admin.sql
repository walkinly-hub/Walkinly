-- Grants info@walkinly.ch platform-wide operational access after its first
-- successful authentication. Salon membership remains the normal access path.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.grant_reserved_platform_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'info@walkinly.ch' then
    insert into public.platform_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists grant_reserved_platform_admin_on_user_created on auth.users;

create trigger grant_reserved_platform_admin_on_user_created
after insert on auth.users
for each row
execute function public.grant_reserved_platform_admin();

-- Also grants access immediately if the authentication user already exists.
insert into public.platform_admins (user_id)
select id
from auth.users
where lower(email) = 'info@walkinly.ch'
on conflict (user_id) do nothing;

create or replace function public.get_dashboard_salons()
returns table (
  salon_id text,
  salon_name text,
  salon_slug text,
  current_service_started_at timestamp without time zone
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet.';
  end if;

  if exists (
    select 1
    from public.platform_admins
    where user_id = auth.uid()
  ) then
    return query
    select s.id, s.name, s.slug, s.current_service_started_at
    from public.salons as s
    order by s.name;
  end if;

  return query
  select s.id, s.name, s.slug, s.current_service_started_at
  from public.salons as s
  join public.salon_members as member on member.salon_id = s.id
  where member.user_id = auth.uid()
  order by s.name;
end;
$$;

create or replace function public.get_staff_queue(p_salon_id text)
returns table (
  entry_id uuid,
  customer_name text,
  queue_position integer,
  checked_in_at timestamp without time zone
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not (
    exists (
      select 1
      from public.salon_members
      where salon_id = p_salon_id
        and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.platform_admins
      where user_id = auth.uid()
    )
  ) then
    raise exception 'Kein Zugriff auf diesen Salon.';
  end if;

  return query
  select
    queue_entry.id,
    queue_entry.name,
    queue_entry.position,
    queue_entry.created_at
  from public.queue_entries as queue_entry
  where queue_entry.salon_id = p_salon_id
    and queue_entry.status = 'waiting'
  order by queue_entry.position;
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
  if auth.uid() is null or not (
    exists (
      select 1
      from public.salon_members
      where salon_id = p_salon_id
        and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.platform_admins
      where user_id = auth.uid()
    )
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

  if auth.uid() is null or not (
    exists (
      select 1
      from public.salon_members
      where salon_id = v_salon_id
        and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.platform_admins
      where user_id = auth.uid()
    )
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

revoke all on function public.get_dashboard_salons() from public;
grant execute on function public.get_dashboard_salons() to authenticated;
