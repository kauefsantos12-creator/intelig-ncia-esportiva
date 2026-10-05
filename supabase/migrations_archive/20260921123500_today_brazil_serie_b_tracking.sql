-- Include second divisions of the project's principal countries in Today.
-- Agenda visibility only: this does not expand detailed player-stat collection.
insert into public.sports_tracking_rules (
  rule_key, country_code, region, competition_kind, division_level,
  competition_id, always_track, enabled, priority, metadata
)
values
  ('always-brazil-second-league',  'BR',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Serie B brasileira"}'::jsonb),
  ('always-england-second-league', 'GB-ENG', null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Championship"}'::jsonb),
  ('always-germany-second-league', 'DE',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"2. Bundesliga"}'::jsonb),
  ('always-france-second-league',  'FR',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Ligue 2"}'::jsonb),
  ('always-italy-second-league',   'IT',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Serie B italiana"}'::jsonb),
  ('always-spain-second-league',   'ES',     null, 'LEAGUE', 2, null, true, true, 100, '{"label":"Segunda Division"}'::jsonb)
on conflict (rule_key) do update
set country_code=excluded.country_code,
    competition_kind=excluded.competition_kind,
    division_level=excluded.division_level,
    always_track=true,
    enabled=true,
    priority=excluded.priority,
    metadata=excluded.metadata,
    updated_at=now();
