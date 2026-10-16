-- Operação de dados autorizada pelo envio de escalação por Kauê (16/10/2026).
-- Fonte: quatro screenshots do ge enviados pelo usuário; não é coleta da API.
-- PRIMARY hefuvmocohhpmnhwpkac / Lovable 428fa571-e363-4bbf-ab2c-058451eba7dc.
-- Para ensaio, substituir apenas o COMMIT final por ROLLBACK.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $lineup$
declare
  d jsonb := $snapshot${"fixture_id":"0f822af1-42d1-4b27-8bd6-b236ee65d52a","operation":"mirassol-inter-ge-lineup-2026-10-16-v1","source":"manual","definition_version":"user-ge-lineup-v1","fetched_at":"2026-10-16T22:50:32.851573+00:00","capture_window_brt":"2026-10-16 19:45–19:47 -03:00","files_sha256":{"IMG_8829.png":"30071f077823b7e072962f21f3d424cad4f90c17db856bb50820c0954529e3cd","IMG_8831.png":"e721c36af780c13d2a28185a9b61a4336298cec229de84251b762348e1b1c571","IMG_8832.png":"693e3d2b2fb47ad155e1772f10edb4d5c749f13c5957029e84ff8f60f2c24584","IMG_8828.png":"cfad3f8a1824eac58beb7cfa4d7c94c58f24f1ca91f87b74bea26197b741aa13"},"teams":[{"id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Mirassol","formation":"4-4-2","coach":"Rafael Guanaes"},{"id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Internacional","formation":"3-5-2","coach":"Eduardo Baptista"}],"players":[{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Walter","number":22,"source_position":"GOL","position":"G","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:10226","previous_name":"Walter","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Igor Formiga","number":32,"source_position":"LAD","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:156191","previous_name":"Igor Formiga","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"João Victor","number":34,"source_position":"ZAD","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:115525","previous_name":"João Victor","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Willian Machado","number":3,"source_position":"ZAE","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:80654","previous_name":"Willian Machado","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Reinaldo","number":6,"source_position":"LAE","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:9946","previous_name":"Reinaldo","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Denilson","number":27,"source_position":"VOL","position":"M","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:276452","previous_name":"Denilson","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Neto Moura","number":25,"source_position":"VOL","position":"M","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:504957","previous_name":"Neto Moura","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Eduardo","number":33,"source_position":"MEC","position":"M","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:44348","previous_name":"Eduardo","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Shaylon","number":7,"source_position":"MEC","position":"M","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:10025","previous_name":"Shaylon","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Edson Carioca","number":95,"source_position":"ATA","position":"F","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:54238","previous_name":"Edson Carioca","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Bruno Santos","number":30,"source_position":"ATA","position":"F","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:159843","previous_name":"Bruno Santos","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Matheus Cunha","number":23,"source_position":"GOL","position":"G","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:306210","previous_name":"Matheus Cunha","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Bruno Gomes","number":15,"source_position":"ZAD","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:143368","previous_name":"Bruno Gomes","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Gabriel Mercado","number":25,"source_position":"ZAG","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:2044","previous_name":"Gabriel Mercado","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Juninho","number":18,"source_position":"ZAE","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:9912","previous_name":"Juninho","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Braian Aguirre","number":35,"source_position":"LAD","position":"D","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:288720","previous_name":"Braian Aguirre","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Villagra","number":5,"source_position":"VOL","position":"M","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:6519","previous_name":"Villagra","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Thiago Maia","number":29,"source_position":"VOL","position":"M","starting":true,"screenshot":"IMG_8828.png","canonical_key":"api-football:22231","previous_name":"Thiago Maia","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Bernabei","number":26,"source_position":"MEC","position":"M","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:129902","previous_name":"Bernabei","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Matheus Bahia","number":6,"source_position":"LAE","position":"D","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:197051","previous_name":"Matheus Bahia","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Vitinho","number":28,"source_position":"ATA","position":"F","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:10147","previous_name":"Vitinho","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Alerrandro","number":9,"source_position":"ATA","position":"F","starting":true,"screenshot":"IMG_8829.png","canonical_key":"api-football:9893","previous_name":"Alerrandro","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Thomazella","number":90,"source_position":"GOL","position":"G","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:77966","previous_name":"Thomazella","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Daniel Borges","number":20,"source_position":"LAD","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:9771","previous_name":"Daniel Borges","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Lucas Oliveira","number":2,"source_position":"ZAD","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:9308","previous_name":"Lucas Oliveira","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Gabriel Knesowitsch","number":44,"source_position":"ZAD","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:357888","previous_name":"Gabriel Knesowitsch","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Japa","number":5,"source_position":"VOL","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:405353","previous_name":"Japa","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Wallisson","number":80,"source_position":"VOL","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:159493","previous_name":"Wallisson","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Chico Kim","number":10,"source_position":"MEC","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:80474","previous_name":"Chico Kim","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"André Luis","number":9,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:41430","previous_name":"André Luis","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Fernandinho","number":17,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:77680","previous_name":"Fernandinho","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Alesson","number":77,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:9429","previous_name":"Alesson","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Carlos Eduardo","number":96,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:520668","previous_name":"Carlos Eduardo","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","name":"Zé Roberto","number":99,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:9686","previous_name":"Zé Roberto","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Kauan Jesus","number":22,"source_position":"GOL","position":"G","starting":false,"screenshot":"IMG_8832.png","canonical_key":"official:internacional:kauan","previous_name":"Kauan Jesus","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Félix Torres","number":4,"source_position":"ZAD","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"official:internacional:felix-torres","previous_name":"Félix Torres","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Victor Gabriel","number":41,"source_position":"ZAE","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"official:internacional:victor-gabriel","previous_name":"Victor Gabriel","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Luiz Felipe","number":53,"source_position":"LAE","position":"D","starting":false,"screenshot":"IMG_8832.png","canonical_key":"manual:ge-lineup:internacional:luiz-felipe:53","previous_name":null,"identity_reason":"new_manual_identity_no_api_id"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Bruno Henrique","number":8,"source_position":"VOL","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:9921","previous_name":"Bruno Henrique","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Ronaldo","number":16,"source_position":"VOL","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:10167","previous_name":"Ronaldo","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Paulinho","number":27,"source_position":"VOL","position":"M","starting":false,"screenshot":"IMG_8832.png","canonical_key":"api-football:96353","previous_name":"Paulinho","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Calebe","number":30,"source_position":"MEC","position":"M","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:266658","previous_name":"Calebe","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Johan Carbonero","number":7,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:13691","previous_name":"Johan Carbonero","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"Niclas Eliasson","number":17,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:19270","previous_name":"Niclas Eliasson","identity_reason":"exact_name_and_existing_team_squad"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"João Victor","number":44,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:633284","previous_name":"Victor Joao","identity_reason":"explicit_alias_same_team_and_prior_shirt_number"},{"team_id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","name":"João Bezerra","number":49,"source_position":"ATA","position":"F","starting":false,"screenshot":"IMG_8831.png","canonical_key":"api-football:609580","previous_name":"J. Bezerra","identity_reason":"explicit_alias_same_team_and_prior_shirt_number"}]}$snapshot$::jsonb;
  t jsonb;
  p jsonb;
  pid uuid;
  pname text;
  n integer;
  before_stats bigint;
  before_squads bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(d->>'operation',0));
  if jsonb_array_length(d->'players')<>46 or jsonb_array_length(d->'teams')<>2 then
    raise exception 'Snapshot de escalação incompleto.';
  end if;
  if not exists(select 1 from public.sports_fixtures where id=(d->>'fixture_id')::uuid
      and home_team_id=(d#>>'{teams,0,id}')::uuid and away_team_id=(d#>>'{teams,1,id}')::uuid
      and kickoff_at='2026-10-16 20:00:00-03'::timestamptz) then
    raise exception 'Partida alvo divergente.';
  end if;
  select count(*) into before_stats from public.sports_fixture_player_stats;
  select count(*) into before_squads from public.sports_team_squads;
  if exists(select 1 from public.sports_fixture_lineups
      where fixture_id=(d->>'fixture_id')::uuid and provider='manual'
      and metadata->>'operation' is distinct from d->>'operation') then
    raise exception 'Escalação manual preexistente; conciliação necessária.';
  end if;
  if exists(select 1 from public.source_definitions where source='manual'
      and definition_version<>'user-ge-lineup-v1') then
    raise exception 'Fonte manual com outra definição.';
  end if;
  insert into public.source_definitions(source,definition_version,metric_definitions,configured,notes,provider,
    data_owner_domain,data_steward,license_or_terms,quality_tier,sla_expectation,reviewed_at,next_review_at,governance_status)
  values('manual','user-ge-lineup-v1',jsonb_build_object('scope','Escalação Mirassol x Internacional 16/10/2026',
    'input','screenshots do ge enviados por Kauê','roles','titular e reserva informado; reserva não comprova entrada em campo',
    'statistics','sem minutos, participação efetiva ou métricas inferidas'),true,
    'Carga pontual conferida visualmente; arquivos e hashes nos metadados. Não é confirmação por API ou clube.',
    'user_supplied_ge_screenshots','sources','Repository Maintainer',null,'USER_SUPPLIED_ATTRIBUTED',
    'Snapshot pontual informado pelo usuário; sem atualização automática.',now(),now()+interval '90 days','ACTIVE')
  on conflict(source) do nothing;
  for t in select value from jsonb_array_elements(d->'teams') loop
    if not exists(select 1 from public.sports_teams where id=(t->>'id')::uuid and name=t->>'name') then
      raise exception 'Time alvo divergente.';
    end if;
    select count(*) into n from jsonb_array_elements(d->'players') x where x->>'team_id'=t->>'id';
    if n<>23 then raise exception 'Relação por equipe incompleta.'; end if;
  end loop;
  for p in select value from jsonb_array_elements(d->'players') loop
    pid:=null;
    select id,name into pid,pname from public.sports_players where canonical_key=p->>'canonical_key';
    if p->>'previous_name' is not null then
      if pid is null or pname not in (p->>'previous_name',p->>'name') then
        raise exception 'Identidade existente divergente: %',p->>'canonical_key';
      end if;
      if not exists(select 1 from public.sports_team_squads where team_id=(p->>'team_id')::uuid and player_id=pid)
        and not exists(select 1 from public.sports_fixture_lineups where team_id=(p->>'team_id')::uuid
          and player_id=pid and jersey_number=(p->>'number')::integer) then
        raise exception 'Identidade sem vínculo ao clube: %',p->>'name';
      end if;
    elsif pid is null then
      insert into public.sports_players(canonical_key,name,metadata)
      values(p->>'canonical_key',p->>'name',jsonb_build_object('source','manual','definition_version','user-ge-lineup-v1',
        'operation',d->>'operation','identity_resolution','pending_external_provider_link')) returning id into pid;
    elsif not exists(select 1 from public.sports_players where id=pid and metadata->>'operation'=d->>'operation') then
      raise exception 'Colisão na identidade manual.';
    end if;
    insert into public.sports_fixture_lineups(fixture_id,team_id,player_id,provider,is_starting,is_substitute,
      position,grid_position,jersey_number,formation,fetched_at,metadata)
    values((d->>'fixture_id')::uuid,(p->>'team_id')::uuid,pid,'manual',(p->>'starting')::boolean,
      not (p->>'starting')::boolean,p->>'position',null,(p->>'number')::integer,
      (select x->>'formation' from jsonb_array_elements(d->'teams') x where x->>'id'=p->>'team_id'),
      (d->>'fetched_at')::timestamptz,jsonb_build_object('source','manual','definition_version','user-ge-lineup-v1',
        'publisher','ge','input_kind','user_screenshot','operation',d->>'operation','display_name',p->>'name',
        'screenshot',p->>'screenshot','sha256',d->'files_sha256'->>(p->>'screenshot'),
        'capture_window_brt',d->>'capture_window_brt','source_position',p->>'source_position',
        'identity_reason',p->>'identity_reason','appearance_confirmed',false,'minutes_inferred',false,
        'confirmation_level','user_supplied_ge_lineup'))
    on conflict(fixture_id,team_id,player_id,provider) do update set
      is_starting=excluded.is_starting,is_substitute=excluded.is_substitute,position=excluded.position,
      jersey_number=excluded.jersey_number,formation=excluded.formation,fetched_at=excluded.fetched_at,metadata=excluded.metadata;
  end loop;
  for t in select value from jsonb_array_elements(d->'teams') loop
    select count(*) into n from public.sports_fixture_lineups where fixture_id=(d->>'fixture_id')::uuid
      and team_id=(t->>'id')::uuid and provider='manual' and is_starting and not is_substitute;
    if n<>11 then raise exception 'Total de titulares inválido.'; end if;
    select count(*) into n from public.sports_fixture_lineups where fixture_id=(d->>'fixture_id')::uuid
      and team_id=(t->>'id')::uuid and provider='manual' and is_substitute and not is_starting;
    if n<>12 then raise exception 'Total de reservas inválido.'; end if;
  end loop;
  update public.sports_fixtures set metadata=metadata||jsonb_build_object('reported_lineup',jsonb_build_object(
    'source','manual','definition_version','user-ge-lineup-v1','publisher','ge','operation',d->>'operation',
    'teams',d->'teams','files_sha256',d->'files_sha256','capture_window_brt',d->>'capture_window_brt',
    'appearance_confirmed',false)) where id=(d->>'fixture_id')::uuid;
  if before_stats<>(select count(*) from public.sports_fixture_player_stats)
      or before_squads<>(select count(*) from public.sports_team_squads) then
    raise exception 'Carga de escalação alterou estatísticas ou elenco geral.';
  end if;
end $lineup$;
select t.name,l.formation,count(*) filter(where l.is_starting) as starters,
  count(*) filter(where l.is_substitute) as bench,count(*) as total
from public.sports_fixture_lineups l join public.sports_teams t on t.id=l.team_id
where l.fixture_id='0f822af1-42d1-4b27-8bd6-b236ee65d52a' and l.provider='manual'
group by t.name,l.formation order by t.name;
commit;
