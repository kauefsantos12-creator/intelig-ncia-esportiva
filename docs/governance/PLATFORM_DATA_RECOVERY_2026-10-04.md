# Agenda and Elo data recovery — 2026-10-04

## Runtime evidence

Authenticated production loads all routes, but Today returned zero tracked fixtures despite 87 catalog fixtures for 2026-10-04 in America/Sao_Paulo. Six Spain Segunda fixtures were excluded because the competition was classified OTHER. The ingestion inferred kind from display names even when the provider ID matched a registered domestic Elo target. The loose `champions` pattern also matched domestic Championship names.

All 32 active domestic and nine continental Elo targets had successful initial imports. There were 732 local ratings but no league ratings and no main row in elo_sync_state. The current global ranking view joins local and league ratings, so it returned no clubs. Initial imports do not replace the daily finalize step.

## Change and validation

Registered domestic targets now persist as LEAGUE using their existing provider identity; registered continental targets remain CONTINENTAL. Champions League matching no longer consumes Championship. Regression tests cover Spain Segunda, Argentina Nacional B, Scotland Championship, USL Championship, Champions League, cups and unknown competitions.

`scripts/recuperacao-agenda-elo.sql` is an operational data repair, not a migration. It requires successful current-day imports for all active Elo targets, shares the initial loader advisory lock, creates only the missing control row, invokes the existing canonical finalize/audit, repairs domestic competition metadata from registered targets, and removes the temporary loader only after a nonempty global ranking. The regular daily jobs remain configured. Audit ATTENTION is preserved and must be reported rather than relabeled as OK.

No archived migrations are applied to Cloud and no schema, model formula, access policy, secrets or provider identifiers change. CI must pass before merging. Runtime recovery and authenticated verification are separate from CI and are recorded below after execution.

## Rollback

Revert the ingestion commit through a new commit if needed. Derived league ratings can be rebuilt through the existing finalize operation; historical fixtures and local ratings remain intact. Competition metadata remains aligned with the authoritative target catalog. Do not rewrite published history or replay archived migrations.
