-- Stores customer-facing branding per salon. The JSON structure can grow
-- without requiring a schema change for every additional visual option.

alter table public.salons
add column if not exists branding jsonb not null default '{}'::jsonb;

update public.salons
set branding = jsonb_build_object(
  'logo_url', 'https://besbarber.com/assets/logo-DWk6noCi.png',
  'background_color', '#000000',
  'surface_color', '#171717',
  'foreground_color', '#ffffff',
  'muted_foreground_color', '#d1d5db',
  'primary_color', '#dc2626',
  'primary_hover_color', '#b91c1c',
  'border_color', '#3f3f46'
)
where id = 'besbarber';
