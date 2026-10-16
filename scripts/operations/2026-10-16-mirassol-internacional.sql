-- Carga operacional pontual solicitada por Kauê em 16/10/2026.
-- PRIMARY: hefuvmocohhpmnhwpkac / Lovable 428fa571-e363-4bbf-ab2c-058451eba7dc.
-- Não é migration, não altera schema e não reativa crons ou coletores.
-- Para ensaio, trocar apenas o COMMIT final por ROLLBACK.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $recovery$
declare
  v_data jsonb := $snapshot${"recovery_id":"mirassol-internacional-2026-10-16-v1","source":"official","definition_version":"official-match-squad-v1","fixture":{"canonical_key":"official:cbf:832195","primary_fixture_id":"cbf:832195","kickoff_at":"2026-10-16T20:00:00-03:00","competition_id":"000e0480-978f-437e-93a4-9a3715579f77","season_label":"2026/27","official_season":"2026","round":31,"sources":["https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/mirassol-x-internacional/832195","https://mirassolfc.com.br/blogs/elenco","https://www.internacional.com.br/noticias/masculino/saiba-onde-assistir-ao-jogo-do-inter-contra-o-mirassol"]},"teams":[{"id":"c4702f06-eb1b-4cb9-acc4-895e70dd208f","slug":"mirassol","expected_name":"Mirassol","api_team_id":7848,"source_url":"https://mirassolfc.com.br/blogs/elenco","fetched_at":"2026-10-16T19:37:37.165943+00:00","html_sha256":"1afaf9d0d03393ffbcb43c695597acb34eb8a2820a9ff325ad3f3d93d48d26f1","players":[{"slug":"georgemy","name":"Georgemy","jersey_number":1,"position":"Goalkeeper","profile_url":"https://mirassolfc.com.br/blogs/elenco/georgemy","canonical_key":"api-football:80649","previous_name":"Georgemy","existing_identity":true},{"slug":"walter","name":"Walter","jersey_number":22,"position":"Goalkeeper","profile_url":"https://mirassolfc.com.br/blogs/elenco/walter","canonical_key":"api-football:10226","previous_name":"Walter","existing_identity":true},{"slug":"thomazella","name":"Thomazella","jersey_number":90,"position":"Goalkeeper","profile_url":"https://mirassolfc.com.br/blogs/elenco/thomazella","canonical_key":"api-football:77966","previous_name":"Thomazella","existing_identity":true},{"slug":"alex-muralha","name":"Alex Muralha","jersey_number":23,"position":"Goalkeeper","profile_url":"https://mirassolfc.com.br/blogs/elenco/alex-muralha","canonical_key":"api-football:9337","previous_name":"Alex Muralha","existing_identity":true},{"slug":"elias","name":"Elias","jersey_number":18,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/elias","canonical_key":"api-football:9573","previous_name":"Elias","existing_identity":true},{"slug":"caua-victor","name":"Cauã Victor","jersey_number":45,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/caua-victor","canonical_key":"official:mirassol:caua-victor","previous_name":null,"existing_identity":false},{"slug":"victor-luis","name":"Victor Luis","jersey_number":12,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/victor-luis","canonical_key":"api-football:9907","previous_name":"Victor Luís","existing_identity":true},{"slug":"igor-formiga","name":"Igor Formiga","jersey_number":32,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/igor-formiga","canonical_key":"api-football:156191","previous_name":"Igor Formiga","existing_identity":true},{"slug":"daniel-borges","name":"Daniel Borges","jersey_number":20,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/daniel-borges","canonical_key":"api-football:9771","previous_name":"Daniel Borges","existing_identity":true},{"slug":"reinaldo","name":"Reinaldo","jersey_number":6,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/reinaldo","canonical_key":"api-football:9946","previous_name":"Reinaldo","existing_identity":true},{"slug":"gabriel-knesowitsch","name":"Gabriel Knesowitsch","jersey_number":44,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/gabriel-knesowitsch","canonical_key":"api-football:357888","previous_name":"Gabriel","existing_identity":true},{"slug":"marcelinho","name":"Marcelinho","jersey_number":null,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/marcelinho","canonical_key":"official:mirassol:marcelinho","previous_name":null,"existing_identity":false},{"slug":"willian-machado","name":"Willian Machado","jersey_number":3,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/willian-machado","canonical_key":"api-football:80654","previous_name":"Willian Machado","existing_identity":true},{"slug":"rodrigues","name":"Rodrigues","jersey_number":97,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/rodrigues","canonical_key":"official:mirassol:rodrigues","previous_name":null,"existing_identity":false},{"slug":"lucas-oliveira","name":"Lucas Oliveira","jersey_number":2,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/lucas-oliveira","canonical_key":"api-football:9308","previous_name":"Lucas Oliveira","existing_identity":true},{"slug":"joao-victor","name":"João Victor","jersey_number":34,"position":"Defender","profile_url":"https://mirassolfc.com.br/blogs/elenco/joao-victor","canonical_key":"api-football:115525","previous_name":"João Victor","existing_identity":true},{"slug":"wallisson","name":"Wallisson","jersey_number":80,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/wallisson","canonical_key":"api-football:159493","previous_name":"Wallisson","existing_identity":true},{"slug":"gustavo-cazonatti","name":"Gustavo Cazonatti","jersey_number":null,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/gustavo-cazonatti","canonical_key":"api-football:96385","previous_name":"Gustavo Cazonatti","existing_identity":true},{"slug":"japa","name":"Japa","jersey_number":5,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/japa","canonical_key":"api-football:405353","previous_name":"Japa","existing_identity":true},{"slug":"gabriel-pires","name":"Gabriel Pires","jersey_number":18,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/gabriel-pires","canonical_key":"official:mirassol:gabriel-pires","previous_name":null,"existing_identity":false},{"slug":"neto-moura","name":"Neto Moura","jersey_number":25,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/neto-moura","canonical_key":"api-football:504957","previous_name":"Neto","existing_identity":true},{"slug":"shaylon","name":"Shaylon","jersey_number":7,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/shaylon","canonical_key":"api-football:10025","previous_name":"Shaylon","existing_identity":true},{"slug":"eduardo","name":"Eduardo","jersey_number":33,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/eduardo","canonical_key":"api-football:44348","previous_name":"Eduardo","existing_identity":true},{"slug":"denilson","name":"Denilson","jersey_number":8,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/denilson","canonical_key":"api-football:276452","previous_name":"Denilson","existing_identity":true},{"slug":"chico-kim","name":"Chico Kim","jersey_number":10,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/chico-kim","canonical_key":"api-football:80474","previous_name":"Chico","existing_identity":true},{"slug":"aldo-filho","name":"Aldo Filho","jersey_number":21,"position":"Midfielder","profile_url":"https://mirassolfc.com.br/blogs/elenco/aldo-filho","canonical_key":"api-football:133183","previous_name":"José Aldo","existing_identity":true},{"slug":"ze-roberto","name":"Zé Roberto","jersey_number":99,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/ze-roberto","canonical_key":"api-football:9686","previous_name":"Zé Roberto","existing_identity":true},{"slug":"fernandinho","name":"Fernandinho","jersey_number":17,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/fernandinho","canonical_key":"api-football:77680","previous_name":"Fernandinho","existing_identity":true},{"slug":"bruno-santos","name":"Bruno Santos","jersey_number":30,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/bruno-santos","canonical_key":"api-football:159843","previous_name":"Bruno Santos","existing_identity":true},{"slug":"gustavo-silva","name":"Gustavo Silva","jersey_number":19,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/gustavo-silva","canonical_key":"api-football:9620","previous_name":"Gustavo Silva","existing_identity":true},{"slug":"tiquinho-soares","name":"Tiquinho Soares","jersey_number":29,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/tiquinho-soares","canonical_key":"official:mirassol:tiquinho-soares","previous_name":null,"existing_identity":false},{"slug":"negueba","name":"Negueba","jersey_number":11,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/negueba","canonical_key":"api-football:153458","previous_name":"Negueba","existing_identity":true},{"slug":"nathan-fogaca","name":"Nathan Fogaça","jersey_number":9,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/nathan-fogaca","canonical_key":"official:mirassol:nathan-fogaca","previous_name":null,"existing_identity":false},{"slug":"galeano","name":"Galeano","jersey_number":27,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/galeano","canonical_key":"official:mirassol:galeano","previous_name":null,"existing_identity":false},{"slug":"galdino","name":"Galdino","jersey_number":17,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/galdino","canonical_key":"official:mirassol:galdino","previous_name":null,"existing_identity":false},{"slug":"edson-carioca","name":"Edson Carioca","jersey_number":95,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/edson-carioca","canonical_key":"api-football:54238","previous_name":"Edson","existing_identity":true},{"slug":"carlos-eduardo","name":"Carlos Eduardo","jersey_number":96,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/carlos-eduardo","canonical_key":"api-football:520668","previous_name":"Carlos Eduardo de Barros","existing_identity":true},{"slug":"andre-luis","name":"André Luis","jersey_number":99,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/andre-luis","canonical_key":"api-football:41430","previous_name":"André Luís","existing_identity":true},{"slug":"alesson","name":"Alesson","jersey_number":77,"position":"Attacker","profile_url":"https://mirassolfc.com.br/blogs/elenco/alesson","canonical_key":"api-football:9429","previous_name":"Alesson","existing_identity":true}]},{"id":"a444c8f0-97ff-460f-bfd2-c413bd62cb11","slug":"internacional","expected_name":"Internacional","api_team_id":119,"source_url":"https://www.internacional.com.br/equipes/masculino","fetched_at":"2026-10-16T19:37:30.421474+00:00","html_sha256":"1ce03c1b31b25d8f3f3586fd3c2d7d4633e09e942491abb53f6325ab9cc84713","players":[{"slug":"anthoni","name":"Anthoni","jersey_number":12,"position":"Goalkeeper","profile_url":"https://www.internacional.com.br/equipes/masculino/anthoni","canonical_key":"api-football:306552","previous_name":"Anthoni","existing_identity":true},{"slug":"diego-esser","name":"Diego Esser","jersey_number":32,"position":"Goalkeeper","profile_url":"https://www.internacional.com.br/equipes/masculino/diego-esser","canonical_key":"official:internacional:diego-esser","previous_name":null,"existing_identity":false},{"slug":"kauan","name":"Kauan Jesus","jersey_number":22,"position":"Goalkeeper","profile_url":"https://www.internacional.com.br/equipes/masculino/kauan","canonical_key":"official:internacional:kauan","previous_name":null,"existing_identity":false},{"slug":"matheus-cunha","name":"Matheus Cunha","jersey_number":23,"position":"Goalkeeper","profile_url":"https://www.internacional.com.br/equipes/masculino/matheus-cunha","canonical_key":"api-football:306210","previous_name":"Matheus Cunha","existing_identity":true},{"slug":"sergio-rochet","name":"Sergio Rochet","jersey_number":1,"position":"Goalkeeper","profile_url":"https://www.internacional.com.br/equipes/masculino/sergio-rochet","canonical_key":"official:internacional:sergio-rochet","previous_name":null,"existing_identity":false},{"slug":"felix-torres","name":"Félix Torres","jersey_number":4,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/felix-torres","canonical_key":"official:internacional:felix-torres","previous_name":null,"existing_identity":false},{"slug":"gabriel-mercado","name":"Gabriel Mercado","jersey_number":25,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/gabriel-mercado","canonical_key":"api-football:2044","previous_name":"G. Mercado","existing_identity":true},{"slug":"guillermo-maripan","name":"Guillermo Maripán","jersey_number":3,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/guillermo-maripan","canonical_key":"official:internacional:guillermo-maripan","previous_name":null,"existing_identity":false},{"slug":"juninho","name":"Juninho","jersey_number":18,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/juninho","canonical_key":"api-football:9912","previous_name":"Juninho","existing_identity":true},{"slug":"victor-gabriel","name":"Victor Gabriel","jersey_number":41,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/victor-gabriel","canonical_key":"official:internacional:victor-gabriel","previous_name":null,"existing_identity":false},{"slug":"bernabei","name":"Bernabei","jersey_number":26,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/bernabei","canonical_key":"api-football:129902","previous_name":"A. Bernabéi","existing_identity":true},{"slug":"braian-aguirre","name":"Braian Aguirre","jersey_number":35,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/braian-aguirre","canonical_key":"api-football:288720","previous_name":"B. Aguirre","existing_identity":true},{"slug":"bruno-gomes","name":"Bruno Gomes","jersey_number":15,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/bruno-gomes","canonical_key":"api-football:143368","previous_name":"Bruno Gomes","existing_identity":true},{"slug":"matheus-bahia","name":"Matheus Bahia","jersey_number":6,"position":"Defender","profile_url":"https://www.internacional.com.br/equipes/masculino/matheus-bahia","canonical_key":"api-football:197051","previous_name":"Matheus Bahia","existing_identity":true},{"slug":"alan-patrick","name":"Alan Patrick","jersey_number":10,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/alan-patrick","canonical_key":"api-football:692","previous_name":"Alan Patrick","existing_identity":true},{"slug":"bruno-henrique","name":"Bruno Henrique","jersey_number":8,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/bruno-henrique","canonical_key":"api-football:9921","previous_name":"Bruno Henrique","existing_identity":true},{"slug":"calebe","name":"Calebe","jersey_number":30,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/calebe","canonical_key":"api-football:266658","previous_name":"Calebe","existing_identity":true},{"slug":"niclas-eliasson","name":"Niclas Eliasson","jersey_number":17,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/niclas-eliasson","canonical_key":"api-football:19270","previous_name":"N. Eliasson","existing_identity":true},{"slug":"paulinho","name":"Paulinho","jersey_number":27,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/paulinho","canonical_key":"api-football:96353","previous_name":"Paulinho","existing_identity":true},{"slug":"alerrandro","name":"Alerrandro","jersey_number":9,"position":"Attacker","profile_url":"https://www.internacional.com.br/equipes/masculino/alerrandro","canonical_key":"api-football:9893","previous_name":"Alerrandro","existing_identity":true},{"slug":"johan-carbonero","name":"Johan Carbonero","jersey_number":7,"position":"Attacker","profile_url":"https://www.internacional.com.br/equipes/masculino/johan-carbonero","canonical_key":"api-football:13691","previous_name":"J. Carbonero","existing_identity":true},{"slug":"kayky","name":"Kayky","jersey_number":11,"position":"Attacker","profile_url":"https://www.internacional.com.br/equipes/masculino/kayky","canonical_key":"official:internacional:kayky","previous_name":null,"existing_identity":false},{"slug":"sanabria","name":"Sanabria","jersey_number":19,"position":"Attacker","profile_url":"https://www.internacional.com.br/equipes/masculino/sanabria","canonical_key":"official:internacional:sanabria","previous_name":null,"existing_identity":false},{"slug":"vitinho","name":"Vitinho","jersey_number":28,"position":"Attacker","profile_url":"https://www.internacional.com.br/equipes/masculino/vitinho","canonical_key":"api-football:10147","previous_name":"Vitinho","existing_identity":true},{"slug":"ronaldo","name":"Ronaldo","jersey_number":16,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/ronaldo","canonical_key":"api-football:10167","previous_name":"Ronaldo","existing_identity":true},{"slug":"thiago-maia","name":"Thiago Maia","jersey_number":29,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/thiago-maia","canonical_key":"api-football:22231","previous_name":"Thiago Maia","existing_identity":true},{"slug":"rodrigo-villagra","name":"Villagra","jersey_number":5,"position":"Midfielder","profile_url":"https://www.internacional.com.br/equipes/masculino/rodrigo-villagra","canonical_key":"api-football:6519","previous_name":"R. Villagra","existing_identity":true}]}]}$snapshot$::jsonb;
  v_team jsonb;
  v_player jsonb;
  v_player_id uuid;
  v_fixture_id uuid;
  v_name text;
  v_matches integer;
  v_count integer;
  v_before_stats bigint;
  v_before_lineups bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_data->>'recovery_id',0));
  if (now() at time zone 'America/Sao_Paulo')::date <> date '2026-10-16' then
    raise exception 'Carga restrita a 16/10/2026; revalidar fontes antes de executar em outra data.';
  end if;
  if jsonb_array_length(v_data->'teams') <> 2
    or jsonb_array_length(v_data#>'{teams,0,players}') <> 39
    or jsonb_array_length(v_data#>'{teams,1,players}') <> 27 then
    raise exception 'Snapshot de elencos incompleto.';
  end if;
  select count(*) into v_before_stats from public.sports_fixture_player_stats;
  select count(*) into v_before_lineups from public.sports_fixture_lineups;

  if not exists (
    select 1 from public.sports_competitions
    where id=(v_data#>>'{fixture,competition_id}')::uuid
      and api_football_league_id=71 and country_code='BR'
      and season=v_data#>>'{fixture,season_label}' and active
  ) then raise exception 'Competição alvo não corresponde ao PRIMARY auditado.'; end if;

  if exists(select 1 from public.source_definitions where source='official'
    and definition_version <> 'official-match-squad-v1') then
    raise exception 'Fonte official já tem outra versão; conciliação humana necessária.';
  end if;
  insert into public.source_definitions(
    source,definition_version,metric_definitions,configured,notes,provider,
    data_owner_domain,data_steward,license_or_terms,quality_tier,sla_expectation,
    reviewed_at,next_review_at,governance_status
  ) values (
    'official','official-match-squad-v1',
    jsonb_build_object('scope','Mirassol x Internacional em 16/10/2026 e elencos publicados pelos dois clubes',
      'fixture','CBF e páginas oficiais dos clubes',
      'squad','jogadores listados na página oficial; não prova convocação ou titularidade',
      'statistics','nenhuma métrica ou resultado inferido',
      'automation','carga pontual; não habilita coletor automático'),
    true,'Carga factual pontual solicitada por Kauê; URLs, timestamp e SHA-256 dos HTMLs em cada elenco.',
    'CBF e clubes oficiais','sources','Repository Maintainer',null,'PRIMARY_OFFICIAL_FACTS',
    'Conferência pontual em 16/10/2026; sem SLA automático.',now(),now()+interval '90 days','ACTIVE'
  ) on conflict(source) do nothing;

  for v_team in select value from jsonb_array_elements(v_data->'teams') loop
    if not exists(select 1 from public.sports_teams where id=(v_team->>'id')::uuid
      and name=v_team->>'expected_name' and api_football_team_id=(v_team->>'api_team_id')::bigint
      and country_code='BR') then
      raise exception 'Time alvo divergente: %',v_team->>'slug';
    end if;
    select count(distinct p->>'canonical_key') into v_count
      from jsonb_array_elements(v_team->'players') p;
    if v_count <> jsonb_array_length(v_team->'players') then
      raise exception 'Identidades duplicadas no snapshot: %',v_team->>'slug';
    end if;
    for v_player in select value from jsonb_array_elements(v_team->'players') loop
      v_player_id := null;
      select id,name into v_player_id,v_name from public.sports_players
        where canonical_key=v_player->>'canonical_key';
      if (v_player->>'existing_identity')::boolean then
        if v_player_id is null or v_name not in (v_player->>'previous_name',v_player->>'name') then
          raise exception 'Identidade existente alterada/ausente: %',v_player->>'canonical_key';
        end if;
        if not exists(select 1 from public.sports_team_squads
          where team_id=(v_team->>'id')::uuid and player_id=v_player_id)
          and not exists(select 1 from public.sports_fixture_lineups
          where team_id=(v_team->>'id')::uuid and player_id=v_player_id) then
          raise exception 'Identidade sem vínculo auditado ao clube: %',v_player->>'canonical_key';
        end if;
      elsif v_player_id is not null and not (
        (select metadata->>'official_profile_url' from public.sports_players where id=v_player_id)
        is not distinct from v_player->>'profile_url'
      ) then
        raise exception 'Chave official existente não corresponde ao perfil: %',v_player->>'canonical_key';
      end if;
      if v_player_id is null then
        insert into public.sports_players(canonical_key,name,metadata)
        values(v_player->>'canonical_key',v_player->>'name',jsonb_build_object(
          'source','official','definition_version','official-match-squad-v1',
          'official_profile_url',v_player->>'profile_url',
          'fetched_at',v_team->>'fetched_at','recovery_id',v_data->>'recovery_id'))
        returning id into v_player_id;
      else
        update public.sports_players set name=v_player->>'name',
          metadata=metadata||jsonb_build_object('official_profile_url',v_player->>'profile_url',
            'name_source','official','name_definition_version','official-match-squad-v1',
            'previous_provider_name',v_player->>'previous_name')
          where id=v_player_id;
      end if;
      insert into public.sports_team_squads(
        team_id,player_id,season,provider,jersey_number,position,active,fetched_at,metadata
      ) values (
        (v_team->>'id')::uuid,v_player_id,v_data#>>'{fixture,season_label}','official',
        (v_player->>'jersey_number')::integer,v_player->>'position',true,
        (v_team->>'fetched_at')::timestamptz,jsonb_build_object(
          'source','official','definition_version','official-match-squad-v1',
          'source_url',v_team->>'source_url','profile_url',v_player->>'profile_url',
          'html_sha256',v_team->>'html_sha256','recovery_id',v_data->>'recovery_id',
          'roster_kind','published_club_roster','lineup_confirmed',false,
          'official_position',v_player->>'position','official_season','2026')
      ) on conflict(team_id,player_id,season,provider) do update set
        jersey_number=excluded.jersey_number,position=excluded.position,active=true,
        fetched_at=excluded.fetched_at,metadata=excluded.metadata;
    end loop;
    select count(distinct player_id) into v_count from public.sports_team_squads
      where team_id=(v_team->>'id')::uuid and season=v_data#>>'{fixture,season_label}' and active;
    if v_count <> jsonb_array_length(v_team->'players') then
      raise exception 'Elenco visível possui identidades extras/ausentes: % (%)',v_team->>'slug',v_count;
    end if;
  end loop;

  select count(*) into v_matches from public.sports_fixtures
    where home_team_id=(v_data#>>'{teams,0,id}')::uuid
      and away_team_id=(v_data#>>'{teams,1,id}')::uuid
      and (kickoff_at at time zone 'America/Sao_Paulo')::date=date '2026-10-16';
  if v_matches>1 then raise exception 'Partida duplicada; conciliar antes de inserir.'; end if;
  select id into v_fixture_id from public.sports_fixtures
    where home_team_id=(v_data#>>'{teams,0,id}')::uuid
      and away_team_id=(v_data#>>'{teams,1,id}')::uuid
      and (kickoff_at at time zone 'America/Sao_Paulo')::date=date '2026-10-16';
  if v_fixture_id is null then
    insert into public.sports_fixtures(
      canonical_key,primary_provider,primary_fixture_id,competition_id,season,kickoff_at,status,
      home_team_id,away_team_id,source_fetched_at,source_payload_hash,metadata
    ) values (
      v_data#>>'{fixture,canonical_key}','official',v_data#>>'{fixture,primary_fixture_id}',
      (v_data#>>'{fixture,competition_id}')::uuid,v_data#>>'{fixture,season_label}',
      (v_data#>>'{fixture,kickoff_at}')::timestamptz,'SCHEDULED',
      (v_data#>>'{teams,0,id}')::uuid,(v_data#>>'{teams,1,id}')::uuid,
      (v_data#>>'{teams,0,fetched_at}')::timestamptz,v_data#>>'{teams,0,html_sha256}',
      jsonb_build_object('source','official','definition_version','official-match-squad-v1',
        'source_urls',v_data#>'{fixture,sources}','official_season','2026','round',31,
        'recovery_id',v_data->>'recovery_id','venue','Estádio José Maria de Campos Maia',
        'automatic_collection_restored',false)
    ) returning id into v_fixture_id;
  end if;
  if not exists(select 1 from public.sports_fixtures where id=v_fixture_id
      and kickoff_at=(v_data#>>'{fixture,kickoff_at}')::timestamptz
      and competition_id=(v_data#>>'{fixture,competition_id}')::uuid) then
    raise exception 'Conflito entre partida existente e fontes oficiais.';
  end if;
  if not exists(select 1 from public.get_today_tracked_fixtures(
      '2026-10-16 00:00:00-03'::timestamptz,'2026-10-17 00:00:00-03'::timestamptz,300)
      where fixture_id=v_fixture_id) then
    raise exception 'Partida não aparece na consulta usada pela aba Hoje.';
  end if;
  if v_before_stats <> (select count(*) from public.sports_fixture_player_stats)
    or v_before_lineups <> (select count(*) from public.sports_fixture_lineups) then
    raise exception 'Carga pontual alterou estatísticas ou escalações.';
  end if;
end
$recovery$;

select jsonb_build_object(
  'fixture',(select jsonb_agg(jsonb_build_object('id',fixture_id,'home',home_team_name,
    'away',away_team_name,'kickoff_at',kickoff_at,'status',status,'home_goals',home_goals,'away_goals',away_goals))
    from public.get_today_tracked_fixtures('2026-10-16 00:00:00-03'::timestamptz,'2026-10-17 00:00:00-03'::timestamptz,300)
    where home_team_name='Mirassol' and away_team_name='Internacional'),
  'squads',(select jsonb_agg(x) from (select t.name,count(distinct s.player_id) as players,
    max(s.fetched_at) as fetched_at from public.sports_team_squads s
    join public.sports_teams t on t.id=s.team_id
    where s.active and s.season='2026/27'
      and t.id in ('c4702f06-eb1b-4cb9-acc4-895e70dd208f','a444c8f0-97ff-460f-bfd2-c413bd62cb11')
    group by t.name) x),
  'official_rows',(select count(*) from public.sports_team_squads
    where provider='official' and metadata->>'recovery_id'='mirassol-internacional-2026-10-16-v1')
) as recovery_result;

commit;
