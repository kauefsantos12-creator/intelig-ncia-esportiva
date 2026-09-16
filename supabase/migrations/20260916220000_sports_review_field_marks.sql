-- Motor de Inteligência Esportiva — marcações pessoais do campinho por review.
begin;

create table public.sports_review_field_marks (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.sports_match_reviews(id) on delete cascade,
  player_id uuid references public.sports_players(id) on delete set null,
  x_percent numeric not null check (x_percent >= 0 and x_percent <= 100),
  y_percent numeric not null check (y_percent >= 0 and y_percent <= 100),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sports_review_field_marks_review_idx
  on public.sports_review_field_marks(review_id, created_at);

create trigger sports_review_field_marks_touch
before update on public.sports_review_field_marks
for each row execute function public.sports_touch_updated_at();

alter table public.sports_review_field_marks enable row level security;
revoke all on table public.sports_review_field_marks from anon;
grant select, insert, update, delete on table public.sports_review_field_marks to authenticated;
grant all on table public.sports_review_field_marks to service_role;

create policy sports_review_field_marks_owner_select
on public.sports_review_field_marks for select to authenticated
using (
  exists (
    select 1 from public.sports_match_reviews r
    where r.id = review_id and r.owner_id = auth.uid()
  )
);

create policy sports_review_field_marks_owner_insert
on public.sports_review_field_marks for insert to authenticated
with check (
  exists (
    select 1 from public.sports_match_reviews r
    where r.id = review_id and r.owner_id = auth.uid()
  )
);

create policy sports_review_field_marks_owner_update
on public.sports_review_field_marks for update to authenticated
using (
  exists (
    select 1 from public.sports_match_reviews r
    where r.id = review_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sports_match_reviews r
    where r.id = review_id and r.owner_id = auth.uid()
  )
);

create policy sports_review_field_marks_owner_delete
on public.sports_review_field_marks for delete to authenticated
using (
  exists (
    select 1 from public.sports_match_reviews r
    where r.id = review_id and r.owner_id = auth.uid()
  )
);

commit;
