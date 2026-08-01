-- Keeps the internal salon ID stable while using a shorter public URL.
-- Running all migrations in order results in /checkin/ambiente-coiffeur.

update public.salons
set slug = 'ambiente-coiffeur'
where id = 'ambiente-coiffeur-wettingen';
