-- Corrects the already-applied MVP branding configuration for BESBARBER.
-- The public logo asset is black and needs an inverted treatment on dark pages.

update public.salons
set branding = branding || jsonb_build_object(
  'logo_inverted', true,
  'primary_color', '#D7A042',
  'primary_hover_color', '#BD8728',
  'primary_foreground_color', '#111111'
)
where id = 'besbarber';
