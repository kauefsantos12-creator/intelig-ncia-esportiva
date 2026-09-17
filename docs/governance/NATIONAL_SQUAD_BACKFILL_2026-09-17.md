# National squad backfill — 2026-09-17

## Objective

Complete the canonical club and squad catalog for the six priority domestic top leagues before expanding player-season statistics.

Target leagues for season 2026/27:

- English Premier League — API-Football league 39 — `GB-ENG`
- France Ligue 1 — API-Football league 61 — `FR`
- Brazil Serie A — API-Football league 71 — `BR`
- Germany Bundesliga — API-Football league 78 — `DE`
- Italy Serie A — API-Football league 135 — `IT`
- Spain La Liga — API-Football league 140 — `ES`

Continental competitions reuse the same canonical `sports_teams` and `sports_team_squads` rows. They do not trigger independent squad duplication.

## Provider request model

The backfill separates two concerns:

1. `API_FOOTBALL_LEAGUE_TEAMS`: one provider request for `/teams?league=<id>&season=2026`, used to discover the complete club set for one domestic league and persist canonical memberships.
2. `API_FOOTBALL_TEAM_SQUAD`: one provider request for `/players/squads?team=<id>`, used to persist the complete current squad for one club.

No player-by-player provider request is used for the squad backfill.

## Quota and freshness controls

- Jobs are processed through the existing sports worker and API-Football distributed rate limiter.
- The default sports worker batch remains one job per invocation.
- Team squads are considered fresh for seven days.
- A fresh squad does not produce another provider call.
- Squad job idempotency keys use the API team id plus the weekly freshness bucket, allowing future refreshes without repeating calls inside the same refresh window.
- Provider 429 responses continue through the existing shared blocking, retry/backoff and dead-letter policy.

## Canonical data rules

`sports_team_competitions` records club membership by competition, team, season and provider. It is shared catalog data: authenticated users may read it; only service-role/backend flows may mutate it.

When league discovery receives a club:

1. reuse a `sports_teams` row already linked by `api_football_team_id`;
2. otherwise reuse a single exact-name canonical row that does not yet have an API-Football id;
3. otherwise create a new API-Football canonical team row.

This preserves Five Dollar canonical rows already linked by fixture reconciliation and avoids replacing continental memberships with duplicate club entities.

## Squad replacement semantics

A successful fresh squad response deactivates the previous API-Football squad rows for that team/season and then upserts the returned players as active. Empty provider responses are treated as errors and do not clear the existing squad.

## Scope boundary

This change intentionally does **not** populate `sports_player_season_stats`. Player-season statistics remain a separate Analytics enrichment phase after squad coverage has been completed and measured.

## Acceptance criteria

- all six target domestic competitions exist once in the canonical competition catalog;
- league discovery produces complete `sports_team_competitions` membership from the provider rather than relying on incomplete fixtures;
- clubs with fresh squads are skipped without provider calls;
- missing/stale clubs receive one squad job per refresh bucket;
- squad sync is rate-limited by the existing API-Football adapter;
- no player-by-player requests are introduced;
- database, unit, architecture, security and browser gates remain green;
- post-merge Lovable Cloud validation reports membership and squad coverage separately for each target league.
