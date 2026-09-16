-- Motor de Inteligência Esportiva — preparar domínio de governança antes das métricas do runtime.
begin;

insert into public.governance_domain_owners(
  domain,
  data_owner,
  technical_owner,
  approval_policy,
  review_cadence_days
)
values(
  'sports_analytics',
  'Product owner',
  'Application owner',
  'Mudanças de regra exigem teste, documentação e PR verde',
  90
)
on conflict(domain) do update set
  technical_owner=excluded.technical_owner,
  approval_policy=excluded.approval_policy,
  review_cadence_days=excluded.review_cadence_days,
  updated_at=now();

commit;
