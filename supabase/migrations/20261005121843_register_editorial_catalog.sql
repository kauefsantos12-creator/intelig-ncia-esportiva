-- Register the editorial definition even in a restored runtime with an empty catalog.
begin;
insert into public.source_definitions(
  source,definition_version,metric_definitions,configured,notes,provider,
  data_owner_domain,data_steward,license_or_terms,quality_tier,sla_expectation,
  reviewed_at,next_review_at,governance_status
)
values(
  'editorial_rss','editorial-rss-v2',
  jsonb_build_object('content','headlines_and_feed_summaries','matching','canonical_fixture_conservative','scope','previous_day_only','rendering','headline_context_with_explicit_source','publisherPolicy','two_approved_publishers_per_country','publishers',jsonb_build_object(
        'DE',jsonb_build_array('kicker','BILD Sport'),
        'ES',jsonb_build_array('Marca','AS'),
        'GB-ENG',jsonb_build_array('BBC Sport','Sky Sports'),
        'FR',jsonb_build_array('L''Équipe','RMC Sport'),
        'IT',jsonb_build_array('La Gazzetta dello Sport','Corriere dello Sport'),
        'PT',jsonb_build_array('A Bola','Record'),
        'BR',jsonb_build_array('ge','UOL Esporte')
      ), 'statisticsPolicy','sofascore_only',
      'editorialPolicyVersion','editorial-explanatory-v3'
    ),
  true,'14 veículos aprovados; desempenho de futebol somente SofaScore; ausência de dados mantém a redação factual.',
  'editorial_rss','sources','Repository Maintainer',null,'SECONDARY_EDITORIAL',
  'Best effort; falhas de uma fonte não bloqueiam o fechamento factual.',
  now(),now()+interval '90 days','ACTIVE'
)
on conflict(source) do update set
  definition_version=excluded.definition_version,
  metric_definitions=source_definitions.metric_definitions||excluded.metric_definitions,
  configured=excluded.configured,notes=excluded.notes,provider=excluded.provider,
  quality_tier=excluded.quality_tier,sla_expectation=excluded.sla_expectation,
  reviewed_at=excluded.reviewed_at,next_review_at=excluded.next_review_at,
  governance_status=excluded.governance_status;
commit;
