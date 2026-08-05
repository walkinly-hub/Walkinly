-- The updated Ambiente logo has a dark circular mark and must not be inverted.
-- This only changes Ambiente's visual configuration; no queue or customer data
-- is affected.

update public.salons
set branding = jsonb_set(
  coalesce(branding, '{}'::jsonb),
  '{logo_inverted}',
  'false'::jsonb,
  true
)
where id = 'ambiente-coiffeur-wettingen';
