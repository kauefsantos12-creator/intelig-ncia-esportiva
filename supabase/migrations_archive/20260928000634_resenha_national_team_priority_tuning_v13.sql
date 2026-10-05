create or replace function public.apply_editorial_national_team_coverage(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_inserted integer := 0;
begin
  select id into v_id
  from public.sports_daily_briefings
  where briefing_date = p_date;

  if v_id is null then
    return 0;
  end if;

  with national as (
    select
      f.id as fixture_id,
      c.name as competition_name,
      f.kickoff_at,
      f.home_goals,
      f.away_goals,
      h.name as home_name,
      a.name as away_name,
      case
        when lower(h.name) in ('brazil','brasil') or lower(a.name) in ('brazil','brasil') then 600
        when lower(c.name) ~ '(nations league a|world cup|copa am|eurocopa|european championship)' then 520
        when lower(c.name) ~ '(friendl|amistoso)' then 450
        else 440
      end as scope_priority
    from public.sports_fixtures f
    join public.sports_competitions c on c.id = f.competition_id
    join public.sports_teams h on h.id = f.home_team_id
    join public.sports_teams a on a.id = f.away_team_id
    where f.status = 'FINISHED'
      and f.home_goals is not null
      and f.away_goals is not null
      and ((f.kickoff_at at time zone 'America/Sao_Paulo')::date) = p_date
      and lower(c.name) ~ '(nations league|world cup|copa am|eurocopa|european championship|euro qualif|qualification|qualifying|eliminat|friendl|africa cup|concacaf|asian cup|gold cup|international)'
      and not exists (
        select 1 from public.sports_briefing_items i
        where i.briefing_id = v_id and i.fixture_id = f.id
      )
  ), ranked as (
    select
      national.*,
      row_number() over (order by scope_priority desc, kickoff_at) as rn
    from national
  ), inserted as (
    insert into public.sports_briefing_items
      (briefing_id, fixture_id, item_kind, title, body, priority, facts, provenance)
    select
      v_id,
      fixture_id,
      'FOOTBALL_MATCH',
      home_name || ' ' || home_goals || ' × ' || away_goals || ' ' || away_name,
      competition_name || '. ' ||
        case
          when home_goals > away_goals then home_name || ' venceu por ' || home_goals || ' a ' || away_goals || '.'
          when away_goals > home_goals then away_name || ' venceu por ' || away_goals || ' a ' || home_goals || '.'
          else 'A partida terminou empatada em ' || home_goals || ' a ' || away_goals || '.'
        end,
      scope_priority * 1000 - rn,
      jsonb_build_object(
        'score', jsonb_build_object('home', home_goals, 'away', away_goals),
        'competition', competition_name,
        'kickoffAt', kickoff_at,
        'lateGame', false,
        'margin', abs(coalesce(home_goals, 0) - coalesce(away_goals, 0)),
        'nationalTeams', true
      ),
      jsonb_build_array(
        jsonb_build_object(
          'source', 'sports_fixtures',
          'fixtureId', fixture_id,
          'role', 'factual'
        )
      )
    from ranked
    returning 1
  )
  select count(*) into v_inserted from inserted;

  update public.sports_briefing_items i
  set priority = greatest(
        i.priority,
        case
          when lower(h.name) in ('brazil','brasil') or lower(a.name) in ('brazil','brasil') then 600000
          when lower(c.name) ~ '(nations league a|world cup|copa am|eurocopa|european championship)' then 520000
          else i.priority
        end - 1
      ),
      facts = i.facts || jsonb_build_object('nationalTeams', true)
  from public.sports_fixtures f
  join public.sports_competitions c on c.id = f.competition_id
  join public.sports_teams h on h.id = f.home_team_id
  join public.sports_teams a on a.id = f.away_team_id
  where i.briefing_id = v_id
    and i.fixture_id = f.id
    and lower(c.name) ~ '(nations league|world cup|copa am|eurocopa|european championship|euro qualif|qualification|qualifying|eliminat|friendl|africa cup|concacaf|asian cup|gold cup|international)';

  return v_inserted;
end
$$;

revoke all on function public.apply_editorial_national_team_coverage(date)
  from public, anon, authenticated;
grant execute on function public.apply_editorial_national_team_coverage(date) to service_role;