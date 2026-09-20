<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project maintenance rules

- Do not create or remix another Lovable project for this repository.
- Keep `Lovable Cloud` as the runtime/database source of truth and GitHub `main` as the versioned-code source of truth.
- Do not edit `supabase_migrations.schema_migrations` manually.
- Do not reintroduce generic shadcn/UI scaffolding. Add a UI primitive only when an application file actually uses it.
- Prefer application-specific components over broad generated component sets.
- Do not revive legacy experimental flows when the current flow already supersedes them.
- Preserve the separation between probability generation and bookmaker-price/value evaluation.
- Any new quantitative behavior needs tests and point-in-time/OOS evidence where applicable.
- Keep canonical documentation current after architectural, operational, metric, source, schema or access-control changes.
- Follow `docs/GOVERNANCE.md` for domain ownership and change rules.
- Metric semantics are versioned in `docs/METRICS_GLOSSARY.md` and `public.metric_definitions`; never silently redefine an existing version.
- New data lineage must use a registered `source + definition_version` from the governed source catalog.
- Preserve legacy decision-policy rows, but do not mix them silently with `decision-v2-strict70` analytics.
- Schema/RLS changes require migration plus database regression tests; these tests are part of required `test-and-build`.
- Access reviews are quarterly; unavailable external evidence remains explicitly `REVIEW_REQUIRED`.


## Active audit plan — Elo surface

When working on the `/elo` surface, preserve this execution order:

1. **Current ranking uniqueness and correctness — DONE**
   - expose only one current row per club in `elo_global_team_ratings`;
   - preserve historical league-local rows in `elo_team_ratings`;
   - verify promotion/relegation continuity without duplicating clubs in the current ranking.
2. **Freshness and temporal reference — DONE**
   - validate daily sync/finalize state, last processed fixture and visible update/reference timestamps;
   - keep current snapshots distinct from point-in-time history.
3. **Table filters and navigation — IN PROGRESS**
   - support search by club;
   - region;
   - country;
   - league/competition;
   - division;
   - club/league ranking mode;
   - combined filters;
   - explicit reset;
   - visible-result count versus total;
   - correct handling beyond the first 100 rows;
   - sorting by position, Elo, club, league and matches processed;
   - preserve the real global rank while filters/sorts are active.
4. **Ranking UX**
   - keep the table as the primary surface;
   - improve readability, density, hierarchy, crests/context and responsiveness without recalculating ratings client-side.
5. **Point-in-time history**
   - validate the 60-day history, delta, fixture ordering and temporal consistency.
6. **League ranking and hierarchy**
   - validate league ratings, divisions, inter-league evidence and hierarchy constraints.
7. **Final E2E**
   - validate data, filters, search, sorting, history, loading/error/empty states and mobile/browser accessibility.

For Elo changes, use the lifecycle: audit evidence → branch → tests → PR → all required gates green → merge → Lovable sync → runtime migration if needed → runtime validation. Never mark an Elo action complete before the matching runtime evidence exists.
