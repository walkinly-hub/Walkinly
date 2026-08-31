-- Independent of queue and WhatsApp functionality. Apply before releasing the form.
begin;

create table public.salon_feedback (
  id uuid primary key,
  salon_id text not null references public.salons(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now()
);

create index salon_feedback_salon_created_idx
  on public.salon_feedback (salon_id, created_at desc);

alter table public.salon_feedback enable row level security;
revoke all on public.salon_feedback from anon, authenticated;
grant select on public.salon_feedback to authenticated;

create policy "Salon staff can read their feedback"
on public.salon_feedback for select to authenticated
using (exists (
  select 1 from public.salon_members m
  where m.salon_id = salon_feedback.salon_id and m.user_id = auth.uid()
));

-- Only this validated function accepts public submissions; no public reads.
create function public.submit_salon_feedback(
  p_salon_slug text,
  p_rating integer,
  p_comment text,
  p_submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_salon_id text;
begin
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Bewertung muss zwischen 1 und 5 liegen.';
  end if;
  if char_length(coalesce(p_comment, '')) > 2000 then
    raise exception 'Kommentar darf höchstens 2000 Zeichen enthalten.';
  end if;
  if p_submission_id is null then
    raise exception 'Übermittlungs-ID fehlt.';
  end if;

  select id into v_salon_id from public.salons where slug = p_salon_slug;
  if not found then
    raise exception 'Salon nicht gefunden.';
  end if;

  insert into public.salon_feedback (id, salon_id, rating, comment)
  values (p_submission_id, v_salon_id, p_rating, btrim(coalesce(p_comment, '')))
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.submit_salon_feedback(text, integer, text, uuid) from public;
grant execute on function public.submit_salon_feedback(text, integer, text, uuid) to anon, authenticated;

commit;
