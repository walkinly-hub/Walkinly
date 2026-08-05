-- Adds Ambiente Coiffeur as a separate Walkinly tenant.
-- The current owner is intentionally the existing test user only.

insert into public.salons (
  id,
  name,
  slug,
  avg_duration,
  branding
)
values (
  'ambiente-coiffeur-wettingen',
  'Ambiente Coiffeur',
  'ambiente-coiffeur-wettingen',
  20,
  jsonb_build_object(
    'logo_url', 'https://www.walkinly.ch/salons/ambiente-coiffeur-logo.png',
    'logo_inverted', false,
    'background_color', '#F4F3EC',
    'surface_color', '#FFFFFF',
    'foreground_color', '#0D1712',
    'muted_foreground_color', '#5E665E',
    'primary_color', '#3E755D',
    'primary_hover_color', '#2E5B47',
    'primary_foreground_color', '#FFFFFF',
    'border_color', '#D8D8CC'
  )
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  avg_duration = excluded.avg_duration,
  branding = excluded.branding;

do $$
declare
  v_test_user_id uuid;
begin
  select id
  into v_test_user_id
  from auth.users
  where email = 'neyminojr2000@gmail.com';

  if v_test_user_id is null then
    raise exception 'Der Walkinly-Testbenutzer wurde nicht gefunden.';
  end if;

  insert into public.salon_members (salon_id, user_id, role)
  values ('ambiente-coiffeur-wettingen', v_test_user_id, 'owner')
  on conflict (salon_id, user_id) do update
  set role = excluded.role;
end;
$$;
