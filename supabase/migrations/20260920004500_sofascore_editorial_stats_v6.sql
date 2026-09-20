-- Resenha v6 — evidência SofaScore persistida e sincronização automática antes do fechamento.
begin;

create table if not exists public.sports_editorial_source_evidence (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references public.sports_fixtures(id) on delete cascade,
  briefing_date date not null,
  source_kind text not null check (source_kind in ('SOFASCORE','JOURNALISM')),
  source_name text not null,
  source_url text not null,
  source_event_id text,
  evidence_type text not null check (evidence_type in ('MATCH_STATS','MATCH_CONTEXT','OTHER_SPORT','SCHEDULE')),
  title text,
  body text,
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  fetched_at timestamptz not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sports_editorial_source_evidence_match_uidx
  on public.sports_editorial_source_evidence(fixture_id,source_kind,evidence_type,source_event_id);

create index if not exists sports_editorial_source_evidence_date_idx
  on public.sports_editorial_source_evidence(briefing_date,source_kind,evidence_type,fetched_at desc);

alter table public.sports_editorial_source_evidence enable row level security;
revoke all on public.sports_editorial_source_evidence from public,anon,authenticated;
grant all on public.sports_editorial_source_evidence to service_role;

create or replace function public.apply_sports_editorial_evidence(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  with source_rows as (
    select distinct on (e.fixture_id)
      e.fixture_id,
      e.source_name,
      e.source_url,
      e.source_event_id,
      e.fetched_at,
      e.confidence,
      e.payload->'curated' as curated
    from public.sports_editorial_source_evidence e
    where e.briefing_date=p_date
      and e.source_kind='SOFASCORE'
      and e.evidence_type='MATCH_STATS'
      and e.fixture_id is not null
    order by e.fixture_id,e.fetched_at desc
  ),
  updates as (
    select
      i.id,
      s.*,
      concat_ws(' · ',
        case
          when s.curated#>>'{expectedGoals,home}' is not null and s.curated#>>'{expectedGoals,away}' is not null
          then 'xG '||
            trim(to_char((s.curated#>>'{expectedGoals,home}')::numeric,'FM999990.00'))||'–'||
            trim(to_char((s.curated#>>'{expectedGoals,away}')::numeric,'FM999990.00'))
        end,
        case
          when s.curated#>>'{shotsOnTarget,home}' is not null and s.curated#>>'{shotsOnTarget,away}' is not null
          then 'finalizações no alvo '||
            trim(to_char((s.curated#>>'{shotsOnTarget,home}')::numeric,'FM999990.##'))||'–'||
            trim(to_char((s.curated#>>'{shotsOnTarget,away}')::numeric,'FM999990.##'))
        end,
        case
          when s.curated#>>'{possession,home}' is not null and s.curated#>>'{possession,away}' is not null
          then 'posse '||
            trim(to_char((s.curated#>>'{possession,home}')::numeric,'FM999990.##'))||'%–'||
            trim(to_char((s.curated#>>'{possession,away}')::numeric,'FM999990.##'))||'%'
        end,
        case
          when s.curated#>>'{corners,home}' is not null and s.curated#>>'{corners,away}' is not null
          then 'escanteios '||
            trim(to_char((s.curated#>>'{corners,home}')::numeric,'FM999990.##'))||'–'||
            trim(to_char((s.curated#>>'{corners,away}')::numeric,'FM999990.##'))
        end,
        case
          when s.curated#>>'{totalShots,home}' is not null and s.curated#>>'{totalShots,away}' is not null
          then 'finalizações '||
            trim(to_char((s.curated#>>'{totalShots,home}')::numeric,'FM999990.##'))||'–'||
            trim(to_char((s.curated#>>'{totalShots,away}')::numeric,'FM999990.##'))
        end
      ) as stat_line
    from public.sports_briefing_items i
    join public.sports_daily_briefings b on b.id=i.briefing_id
    join source_rows s on s.fixture_id=i.fixture_id
    where b.briefing_date=p_date
      and i.item_kind='FOOTBALL_MATCH'
      and not exists (
        select 1
        from jsonb_array_elements(i.provenance) p
        where p->>'source'='SofaScore'
      )
  )
  update public.sports_briefing_items i
  set
    body=i.body||
      case when nullif(u.stat_line,'') is null then '' else ' SofaScore: '||u.stat_line||'.' end,
    facts=jsonb_set(
      i.facts,
      '{editorialStats}',
      jsonb_build_object(
        'source','SofaScore',
        'values',coalesce(u.curated,'{}'::jsonb),
        'sourceUrl',u.source_url,
        'fetchedAt',u.fetched_at
      ),
      true
    ),
    provenance=i.provenance||jsonb_build_array(
      jsonb_build_object(
        'source','SofaScore',
        'sourceUrl',u.source_url,
        'sourceEventId',u.source_event_id,
        'fetchedAt',u.fetched_at,
        'confidence',u.confidence,
        'role','editorial_statistics'
      )
    )
  from updates u
  where i.id=u.id;

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke all on function public.apply_sports_editorial_evidence(date) from public,anon,authenticated;
grant execute on function public.apply_sports_editorial_evidence(date) to service_role;

do $$
begin
  if to_regprocedure('public.publish_sports_daily_briefing_base_v4(date)') is null
     and to_regprocedure('public.publish_sports_daily_briefing(date)') is not null then
    alter function public.publish_sports_daily_briefing(date)
      rename to publish_sports_daily_briefing_base_v4;
  end if;
end
$$;

create or replace function public.publish_sports_daily_briefing(
  p_date date default (((now() at time zone 'America/Sao_Paulo')::date) - 1)
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  v_id:=public.publish_sports_daily_briefing_base_v4(p_date);
  perform public.apply_sports_editorial_evidence(p_date);
  return v_id;
end
$$;

revoke all on function public.publish_sports_daily_briefing(date) from public,anon,authenticated;
grant execute on function public.publish_sports_daily_briefing(date) to service_role;

create or replace function public.kick_sofascore_editorial_sync(p_day_offset integer default -1)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_base_url text;
  v_sync_date date;
  v_request_id bigint;
begin
  if p_day_offset < -2 or p_day_offset > 0 then
    raise exception 'SofaScore editorial sync offset fora do intervalo permitido';
  end if;

  v_sync_date:=((now() at time zone 'America/Sao_Paulo')::date+p_day_offset);

  if not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('kick_sofascore_editorial_sync:'||v_sync_date::text)
  ) then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','already_running','date',v_sync_date);
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name='sports_worker_cron_secret'
  limit 1;

  select decrypted_secret into v_base_url
  from vault.decrypted_secrets
  where name='sports_worker_base_url'
  limit 1;

  if nullif(v_secret,'') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_secret','date',v_sync_date);
  end if;
  if nullif(v_base_url,'') is null then
    return pg_catalog.jsonb_build_object('status','SKIPPED','reason','missing_worker_base_url','date',v_sync_date);
  end if;

  select net.http_post(
    url:=pg_catalog.rtrim(v_base_url,'/')||'/api/sofascore-editorial-sync',
    body:=pg_catalog.jsonb_build_object('date',v_sync_date::text),
    params:='{}'::jsonb,
    headers:=pg_catalog.jsonb_build_object(
      'Authorization','Bearer '||v_secret,
      'Content-Type','application/json'
    ),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return pg_catalog.jsonb_build_object(
    'status','QUEUED',
    'request_id',v_request_id,
    'date',v_sync_date,
    'queued_at',pg_catalog.now()
  );
end
$$;

revoke all on function public.kick_sofascore_editorial_sync(integer) from public,anon,authenticated;
grant execute on function public.kick_sofascore_editorial_sync(integer) to service_role;

do $$
declare r record;
begin
  if to_regclass('cron.job') is not null then
    for r in select jobid from cron.job where jobname='sports-sofascore-editorial-yesterday' loop
      perform cron.unschedule(r.jobid);
    end loop;
    -- 04:42 America/Sao_Paulo (07:42 UTC), after yesterday's canonical sync and before 05:05 briefing.
    perform cron.schedule(
      'sports-sofascore-editorial-yesterday',
      '42 7 * * *',
      'select public.kick_sofascore_editorial_sync(-1);'
    );
  end if;
end
$$;

commit;
