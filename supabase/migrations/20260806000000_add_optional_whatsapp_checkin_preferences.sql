-- Adds the optional WhatsApp enrolment foundation. It is disabled for every
-- salon by default, so existing check-ins stay unchanged until a salon opts in.

alter table public.salons
add column if not exists whatsapp_notifications_enabled boolean not null default false;

create table if not exists public.customer_notification_preferences (
  queue_entry_id uuid primary key references public.queue_entries(id) on delete cascade,
  channel text not null check (channel in ('whatsapp')),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  consent_version text not null default '2026-08-06',
  consented_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

alter table public.customer_notification_preferences enable row level security;

-- Customer contact details are intentionally not readable through the anon key.
-- The security-definer check-in function below is the sole public write path.

create function public.check_in_customer(
  p_salon_slug text,
  p_customer_name text,
  p_whatsapp_phone text,
  p_whatsapp_opt_in boolean
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
  v_whatsapp_phone text;
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

  if coalesce(p_whatsapp_opt_in, false) then
    if not v_salon.whatsapp_notifications_enabled then
      raise exception 'WhatsApp-Benachrichtigungen sind für diesen Salon nicht verfügbar.';
    end if;

    v_whatsapp_phone := regexp_replace(
      btrim(coalesce(p_whatsapp_phone, '')),
      '[[:space:]()-]',
      '',
      'g'
    );

    if v_whatsapp_phone !~ '^\+[1-9][0-9]{7,14}$' then
      raise exception 'Bitte gib deine Mobilnummer im internationalen Format ein.';
    end if;
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

  if coalesce(p_whatsapp_opt_in, false) then
    insert into public.customer_notification_preferences (
      queue_entry_id,
      channel,
      phone_e164
    )
    values (
      v_entry_id,
      'whatsapp',
      v_whatsapp_phone
    );
  end if;

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

revoke all on function public.check_in_customer(text, text, text, boolean) from public;
grant execute on function public.check_in_customer(text, text, text, boolean) to anon, authenticated;
