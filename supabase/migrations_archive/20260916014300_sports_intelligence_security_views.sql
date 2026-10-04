-- Motor de Inteligência Esportiva — RLS, grants, updated_at e integração com Elo.
begin;

create or replace function public.sports_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sports_competitions_touch before update on public.sports_competitions for each row execute function public.sports_touch_updated_at();
create trigger sports_teams_touch before update on public.sports_teams for each row execute function public.sports_touch_updated_at();
create trigger sports_fixtures_touch before update on public.sports_fixtures for each row execute function public.sports_touch_updated_at();
create trigger sports_players_touch before update on public.sports_players for each row execute function public.sports_touch_updated_at();
create trigger sports_tracking_rules_touch before update on public.sports_tracking_rules for each row execute function public.sports_touch_updated_at();
create trigger sports_match_reviews_touch before update on public.sports_match_reviews for each row execute function public.sports_touch_updated_at();
create trigger sports_sync_state_touch before update on public.sports_sync_state for each row execute function public.sports_touch_updated_at();
create trigger sports_jobs_touch before update on public.sports_jobs for each row execute function public.sports_touch_updated_at();
create trigger sports_daily_briefings_touch before update on public.sports_daily_briefings for each row execute function public.sports_touch_updated_at();

-- Dados compartilhados: leitura autenticada. Escrita apenas pelo backend/service role.
do $$
declare
  t text;
begin
  foreach t in array array[
    'sports_competitions','sports_teams','sports_fixtures','sports_fixture_team_stats',
    'sports_fixture_events','sports_match_fact_packs','sports_players','sports_team_squads',
    'sports_fixture_lineups','sports_fixture_player_stats','sports_injuries',
    'sports_broadcast_evidence','sports_tracking_rules','sports_sync_state',
    'sports_daily_briefings','sports_briefing_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_authenticated_read', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- Anotações pessoais: isolamento por owner_id.
alter table public.sports_match_reviews enable row level security;
revoke all on table public.sports_match_reviews from anon;
grant select, insert, update, delete on table public.sports_match_reviews to authenticated;
grant all on table public.sports_match_reviews to service_role;
create policy sports_match_reviews_owner_select on public.sports_match_reviews for select to authenticated using (owner_id = auth.uid());
create policy sports_match_reviews_owner_insert on public.sports_match_reviews for insert to authenticated with check (owner_id = auth.uid());
create policy sports_match_reviews_owner_update on public.sports_match_reviews for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy sports_match_reviews_owner_delete on public.sports_match_reviews for delete to authenticated using (owner_id = auth.uid());

alter table public.sports_player_personal_ratings enable row level security;
revoke all on table public.sports_player_personal_ratings from anon;
grant select, insert, update, delete on table public.sports_player_personal_ratings to authenticated;
grant all on table public.sports_player_personal_ratings to service_role;
create policy sports_player_ratings_owner_select on public.sports_player_personal_ratings for select to authenticated using (
  exists (select 1 from public.sports_match_reviews r where r.id = review_id and r.owner_id = auth.uid())
);
create policy sports_player_ratings_owner_insert on public.sports_player_personal_ratings for insert to authenticated with check (
  exists (select 1 from public.sports_match_reviews r where r.id = review_id and r.owner_id = auth.uid())
);
create policy sports_player_ratings_owner_update on public.sports_player_personal_ratings for update to authenticated using (
  exists (select 1 from public.sports_match_reviews r where r.id = review_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.sports_match_reviews r where r.id = review_id and r.owner_id = auth.uid())
);
create policy sports_player_ratings_owner_delete on public.sports_player_personal_ratings for delete to authenticated using (
  exists (select 1 from public.sports_match_reviews r where r.id = review_id and r.owner_id = auth.uid())
);

-- Fila operacional: nenhum acesso de cliente.
alter table public.sports_jobs enable row level security;
revoke all on table public.sports_jobs from anon, authenticated;
grant all on table public.sports_jobs to service_role;

-- Integração explícita do catálogo novo com o Elo preservado.
create or replace view public.sports_team_elo_current as
select
  st.id as sports_team_id,
  st.name as canonical_team_name,
  e.team_model_version,
  e.league_id,
  e.league_key,
  e.league_name,
  e.team_id as elo_team_id,
  e.team_name as elo_team_name,
  e.local_rating,
  e.league_rating,
  e.global_rating,
  e.matches_processed,
  e.first_fixture_at,
  e.last_fixture_at,
  e.updated_at
from public.sports_teams st
join public.elo_global_team_ratings e on e.team_id = st.five_dollar_team_id;

grant select on public.sports_team_elo_current to authenticated, service_role;

create or replace view public.sports_league_elo_current as
select
  sc.id as sports_competition_id,
  sc.name as canonical_competition_name,
  elr.*
from public.sports_competitions sc
join public.elo_league_ratings elr on elr.league_id = sc.five_dollar_league_id;

grant select on public.sports_league_elo_current to authenticated, service_role;

commit;
