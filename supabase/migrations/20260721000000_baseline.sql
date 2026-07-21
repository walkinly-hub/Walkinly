-- Baseline of the production schema as of 2026-07-21.
-- For new Supabase environments only. Do not run this file against the
-- existing Walkinly project because its objects already exist there.

create extension if not exists "pgcrypto";

create table public.salons (
  id text primary key,
  name text not null,
  avg_duration integer default 20,
  created_at timestamp without time zone default now(),
  slug text not null
);

create unique index salons_slug_key on public.salons (slug);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  salon_id text references public.salons(id),
  name text not null,
  position integer,
  status text default 'waiting'::text
    check (status = any (array['waiting'::text, 'active'::text, 'done'::text, 'removed'::text])),
  created_at timestamp without time zone default now()
);

create index queue_entries_waiting_by_salon_idx
  on public.queue_entries (salon_id, created_at)
  where status = 'waiting'::text;

create table public.salon_members (
  salon_id text not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff'::text
    check (role = any (array['owner'::text, 'staff'::text])),
  created_at timestamp with time zone not null default now(),
  primary key (salon_id, user_id)
);

alter table public.salons enable row level security;
alter table public.queue_entries enable row level security;
alter table public.salon_members enable row level security;

create policy "Public can read salons"
on public.salons
for select
to anon, authenticated
using (true);

create policy "Users can view their own salon memberships"
on public.salon_members
for select
to authenticated
using (user_id = auth.uid());

create function public.get_queue_summary(p_salon_slug text)
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
    (count(q.id) * coalesce(s.avg_duration, 0))::integer
  from public.salons as s
  left join public.queue_entries as q
    on q.salon_id = s.id
   and q.status = 'waiting'
  where s.slug = p_salon_slug
  group by s.id, s.name, s.avg_duration;
$$;

create function public.check_in(
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
    ((v_position - 1) * coalesce(v_salon.avg_duration, 0))::integer;
end;
$$;

create function public.get_staff_queue(p_salon_id text)
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
  if auth.uid() is null or not exists (
    select 1
    from public.salon_members
    where salon_id = p_salon_id
      and user_id = auth.uid()
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

create function public.serve_queue_entry(p_entry_id uuid)
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

revoke all on function public.get_queue_summary(text) from public;
revoke all on function public.check_in(text, text) from public;
revoke all on function public.get_staff_queue(text) from public;
revoke all on function public.serve_queue_entry(uuid) from public;

grant execute on function public.get_queue_summary(text) to anon, authenticated;
grant execute on function public.check_in(text, text) to anon, authenticated;
grant execute on function public.get_staff_queue(text) to authenticated;
grant execute on function public.serve_queue_entry(uuid) to authenticated;
