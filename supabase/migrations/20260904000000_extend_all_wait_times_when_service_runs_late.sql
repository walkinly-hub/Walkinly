-- When an active service exceeds its average duration, the repeating five
-- minute extension applies to every person in the queue. Only position one is
-- flagged separately so the UI can show the explanatory message just there.

drop function if exists public.check_in_customer(text, text, text, boolean);

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
  estimated_wait_minutes integer,
  is_chair_available_immediately boolean
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
  v_overdue_extension_minutes integer := 0;
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

  if v_salon.current_service_started_at is not null
    and coalesce(v_salon.avg_duration, 0) > 0
    and now()::timestamp >= v_salon.current_service_started_at
      + make_interval(mins => coalesce(v_salon.avg_duration, 0)) then
    v_overdue_extension_minutes := 5 - (
      floor(
        extract(
          epoch from now()::timestamp - (
            v_salon.current_service_started_at
            + make_interval(mins => coalesce(v_salon.avg_duration, 0))
          )
        ) / 60.0
      )::integer % 5
    );
  end if;

  return query
  select
    v_entry_id,
    v_access_token,
    v_position,
    (
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
      )::integer + v_overdue_extension_minutes
    )::integer,
    v_position = 1 and v_salon.current_service_started_at is null;
end;
$$;

revoke all on function public.check_in_customer(text, text, text, boolean) from public;
grant execute on function public.check_in_customer(text, text, text, boolean) to anon, authenticated;

drop function if exists public.get_customer_queue_entry(uuid, uuid);

create function public.get_customer_queue_entry(
  p_entry_id uuid,
  p_access_token uuid
)
returns table (
  queue_position integer,
  estimated_wait_minutes integer,
  is_chair_available_immediately boolean,
  is_wait_taking_longer_than_expected boolean,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    q.position,
    (
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
      )::integer +
      case
        when s.current_service_started_at is not null
          and coalesce(s.avg_duration, 0) > 0
          and now()::timestamp >= s.current_service_started_at
            + make_interval(mins => coalesce(s.avg_duration, 0))
        then 5 - (
          floor(
            extract(
              epoch from now()::timestamp - (
                s.current_service_started_at
                + make_interval(mins => coalesce(s.avg_duration, 0))
              )
            ) / 60.0
          )::integer % 5
        )
        else 0
      end
    )::integer,
    q.position = 1 and s.current_service_started_at is null,
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
