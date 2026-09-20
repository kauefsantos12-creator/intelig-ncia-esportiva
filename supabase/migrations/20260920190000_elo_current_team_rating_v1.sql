-- Elo current-team ranking v1
-- Keep league-local Elo rows for history/audit, but expose exactly one current
-- global rating per team: the rating from the league of the most recent fixture.
begin;

create or replace view public.elo_global_team_ratings
with (security_invoker = true)
as
with ranked_team_ratings as (
  select
    t.model_version as team_model_version,
    t.league_id,
    t.league_key,
    t.league_name,
    t.team_id,
    t.team_name,
    t.rating as local_rating,
    t.matches_processed,
    t.first_fixture_at,
    t.last_fixture_at,
    t.updated_at,
    row_number() over (
      partition by t.team_id
      order by
        t.last_fixture_at desc nulls last,
        t.updated_at desc,
        t.league_id desc
    ) as current_rank
  from public.elo_team_ratings t
  where t.model_version='elo-v1-w020'
)
select
  t.team_model_version,
  t.league_id,
  t.league_key,
  t.league_name,
  t.team_id,
  t.team_name,
  t.local_rating,
  l.rating as league_rating,
  l.rating + (t.local_rating - 1500::numeric) as global_rating,
  t.matches_processed,
  t.first_fixture_at,
  t.last_fixture_at,
  t.updated_at
from ranked_team_ratings t
join public.elo_league_ratings l
  on l.model_version='league-elo-v1'
 and l.league_id=t.league_id
where t.current_rank=1;

commit;
