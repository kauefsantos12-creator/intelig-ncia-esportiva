# Squad collection pacing — 2026-10-04

## Evidence and change

Cloud had 15 clubs with squad rows (Premier League 14/20, La Liga 1/20); four national catalogs were still pending and 16 squad jobs were deferred with API-Football minute-limit errors. The shared provider cooldown was active. Elo recovery is complete: 32 domestic targets, nine continental targets, 676 current global clubs, finalize/audit OK. Daily Elo finalize remains scheduled for 05:05 America/Sao_Paulo.

Reduce the API-Football shared ceiling from four to two calls per minute and the local minimum spacing from five to fifteen seconds. Serialize the local spacing for concurrent calls. The old shared throttle could dispatch after three denied permits; a denied or unavailable shared permit now returns UNAVAILABLE before fetch, allowing the existing queue policy to defer instead. Existing caches remain first, so fresh cached responses consume no new provider quota.

Log only numeric minute/day limit and remaining headers with HTTP status. Do not log request headers, credentials or player payloads. Existing worker leases, retry backoff, quota-aware failure handling and completed squad rows remain intact. Do not reset the provider cooldown or resubmit successful work to accelerate collection.

## Validation and operational limits

Tests cover denied and unavailable shared permits, concurrent fifteen-second spacing, the two-request ceiling despite a higher advertised provider limit, and cache reuse. Required CI precedes merge/publication. Verify a normal queued job after publication and retain pending work if the upstream quota remains blocked. This does not promise completion overnight: API-Football plan limits and unmatched club IDs still govern coverage. A club with some active squad rows is not proof of a fully complete roster.

## Rollback

Revert through a new commit, preserving published history. No schema or production-data mutation is required by this change, and no archived migrations are applied.
