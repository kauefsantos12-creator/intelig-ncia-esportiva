# National squad backfill — 2026-09-17

## Objective

Complete the canonical club and squad catalog for the six priority domestic top leagues before expanding player-season statistics.

Target leagues for season 2026/27:

- English Premier League — API-Football 39 / 5Dollar 4160026622 — `GB-ENG`
- France Ligue 1 — API-Football 61 / 5Dollar 3614399544 — `FR`
- Brazil Serie A — API-Football 71 / 5Dollar 3118717965 — `BR`
- Germany Bundesliga — API-Football 78 / 5Dollar 686337048 — `DE`
- Italy Serie A — API-Football 135 / 5Dollar 3405541143 — `IT`
- Spain La Liga — API-Football 140 / 5Dollar 4212821298 — `ES`

Continental competitions reuse the same canonical `sports_teams` and `sports_team_squads` rows. They do not trigger independent squad duplication.

## Provider request model

The initial implementation attempted `/teams?league=<id>&season=2026` on API-Football. Production validation showed the connected API-Football plan only exposes historical seasons 2022–2024 for that season-scoped query, so those six catalog jobs were stopped rather than retried blindly.

The corrected catalog flow is hybrid and quota-aware:

1. 5Dollar `/standings?league=<id>` returns the current clubs for the domestic competition in one request. It is the source of truth for 2026/27 league membership.
2. API-Football `/teams?country=<country>` returns stable API-Football team IDs for all clubs in the country in one request without a season parameter.
3. Current 5Dollar clubs are matched to API-Football country teams by normalized name with an ambiguity threshold. Unmapped teams remain in the canonical league membership but do not receive a squad job until their provider ID is reconciled.
4. `API_FOOTBALL_TEAM_SQUAD` uses `/players/squads?team=<id>` to persist the complete current squad for one mapped club.

This uses two catalog/mapping requests per league and never performs one request per player.

## Quota and freshness controls

- Jobs are processed through the existing sports worker and distributed provider rate limiters.
- The default sports worker batch remains one job per invocation.
- Team squads are considered fresh for seven days.
- A fresh squad does not produce another provider call.
- Squad job idempotency keys use the API team id plus the weekly freshness bucket, allowing future refreshes without repeating calls inside the same refresh window.
- Squad jobs allow 20 attempts so a daily provider quota cannot turn the full backfill into dead-letter churn.
- Explicit daily-quota messages are deferred with a 4–12 hour backoff; minute-level 429/rate-limit messages retain the shorter shared backoff.

## Canonical data rules

`sports_team_competitions` records club membership by competition, team, season and provider. It is shared catalog data: authenticated users may read it; only service-role/backend flows may mutate it.

When current league discovery receives a club:

1. reuse a `sports_teams` row already linked by `five_dollar_team_id`;
2. otherwise reuse the row already linked by the matched `api_football_team_id`;
3. otherwise reuse a single exact-name canonical row;
4. otherwise create a new Five Dollar canonical team row.

The 5Dollar team id defines current league membership; the API-Football team id is enrichment metadata used for squad retrieval. This preserves fixture/Elo identity and prevents continental competitions from creating duplicate squad entities.

## Squad replacement semantics

A successful fresh squad response deactivates the previous API-Football squad rows for that team/season and then upserts the returned players as active. Empty provider responses are treated as errors and do not clear the existing squad.

## Scope boundary

This change intentionally does **not** populate `sports_player_season_stats`. Player-season statistics remain a separate Analytics enrichment phase after squad coverage has been completed and measured.

## Acceptance criteria

- all six target domestic competitions exist once in the canonical competition catalog;
- 5Dollar current standings produce complete `sports_team_competitions` membership instead of relying on incomplete fixture ingestion;
- API-Football country catalogs map current clubs to stable team ids with ambiguity protection;
- clubs with fresh squads are skipped without provider calls;
- missing/stale mapped clubs receive one squad job per refresh bucket;
- unmapped clubs remain visible and measurable without unsafe guessed IDs;
- squad sync is rate-limited by the existing API-Football adapter;
- no player-by-player requests are introduced;
- database, unit, architecture, security and browser gates remain green;
- post-merge Lovable Cloud validation reports current membership, API-id mapping and squad coverage separately for each target league.
