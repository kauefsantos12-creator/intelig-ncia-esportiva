begin;

alter table public.sports_standings enable row level security;
create policy sports_standings_authenticated_read on public.sports_standings for select to authenticated using (true);
revoke all on table public.sports_standings from anon;
grant select on table public.sports_standings to authenticated;
grant all on table public.sports_standings to service_role;

alter table public.sports_player_season_stats enable row level security;
create policy sports_player_season_stats_authenticated_read on public.sports_player_season_stats for select to authenticated using (true);
revoke all on table public.sports_player_season_stats from anon;
grant select on table public.sports_player_season_stats to authenticated;
grant all on table public.sports_player_season_stats to service_role;

commit;
