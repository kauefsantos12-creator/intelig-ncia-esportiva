begin;

-- Operational recovery only: no schema changes or archived migrations.
-- Reuse the synchronization lock to avoid racing the temporary Elo loader.
do $recovery$
declare
  v_result jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtext('elo_sync_next_target_when_idle')) then
    raise exception 'Elo synchronization is running; retry after it finishes';
  end if;
  if not exists (select 1 from public.elo_target_leagues where active)
    or not exists (select 1 from public.elo_cross_competitions where active)
    or exists (
      select 1 from public.elo_target_leagues
      where active and (last_synced_at is null or last_sync_status is distinct from 'OK'
        or (last_synced_at at time zone 'America/Sao_Paulo')::date
          <> (now() at time zone 'America/Sao_Paulo')::date)
    ) or exists (
      select 1 from public.elo_cross_competitions
      where active and (last_synced_at is null or last_sync_status is distinct from 'OK'
        or (last_synced_at at time zone 'America/Sao_Paulo')::date
          <> (now() at time zone 'America/Sao_Paulo')::date)
    ) then
    raise exception 'Complete successful synchronization of all active Elo targets today before recovery';
  end if;

  insert into public.elo_sync_state(id, source, model_version)
  values ('main', 'five_dollar_football', 'hierarchical-elo-v1')
  on conflict (id) do nothing;

  v_result := public.elo_finalize_daily();
  if v_result->>'status' = 'PARTIAL' then
    raise exception 'Elo finalize unexpectedly returned PARTIAL: %', v_result;
  end if;
  if not exists (select 1 from public.elo_global_team_ratings) then
    raise exception 'Elo finalize produced no global ratings';
  end if;

  -- Existing competition identities and fixtures are preserved.
  update public.sports_competitions c
  set competition_kind = 'LEAGUE', country_code = t.country_code,
      region = t.region, division_level = t.division_level, updated_at = now()
  from public.elo_target_leagues t
  where t.active and c.five_dollar_league_id = t.league_id
    and (c.competition_kind, c.country_code, c.region, c.division_level)
      is distinct from ('LEAGUE', t.country_code, t.region, t.division_level);

  -- Stop the initial loader only after successful imports and a usable ranking.
  perform cron.unschedule(jobid) from cron.job where jobname = 'elo-bootstrap';
end;
$recovery$;

commit;

select jsonb_build_object(
  'global_clubs', (select count(*) from public.elo_global_team_ratings),
  'league_ratings', (select count(*) from public.elo_league_ratings),
  'snapshot', (select jsonb_build_object('status', last_status,
    'completed_at', last_completed_at, 'details', details)
    from public.elo_sync_state where id = 'main'),
  'today_tracked', (select count(*) from public.get_today_tracked_fixtures(
    ((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo'),
    (((now() at time zone 'America/Sao_Paulo')::date + 1)::timestamp at time zone 'America/Sao_Paulo'), 300)),
  'bootstrap_remaining', (select count(*) from cron.job where jobname = 'elo-bootstrap')
) as recovery_status;
