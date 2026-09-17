# Pastel Frontend UX — 2026-09-17

## Scope

This document governs the visual redesign introduced by PR #17 across the shared product shell and the five primary product surfaces: Noticiário, Hoje, Elo, Analytics and Anotações.

The change is intentionally presentation-only. It does not alter sports data contracts, Elo calculations, jobs, authentication, authorization, database behavior or business rules.

## Visual direction

The product moves from a dark, single-accent interface to a light-first interface with functional pastel accents. IBM Plex Sans and IBM Plex Mono remain the product typefaces.

The default foundation is a warm light canvas with white surfaces, soft borders, short shadows and restrained decorative gradients. Color is used to help distinguish product context and state rather than as a substitute for labels.

### Surface accents

- Noticiário: peach, for editorial context.
- Hoje: blue, for schedule and live-day information.
- Elo: mint, for ranking and performance context.
- Analytics: lilac, for analytical exploration.
- Anotações: yellow, for review and note-taking context.
- Account: blue, consistent with utility/navigation behavior.

## Shared component contract

`AppShell` remains the single shared navigation shell. It exposes the active stage through `data-stage`, allowing the visual system to apply the correct semantic accent without duplicating navigation behavior or route logic.

Shared product components keep their existing semantic responsibilities:

- `ProductPageHeader` owns page hierarchy and page-level metadata.
- `SurfaceCard` owns section grouping and may use a restrained pastel tone where it improves context.
- `MetricPreview` remains secondary to the primary task and may use pastel differentiation across metric tiles.
- `FilterBar`, `FilterChip`, `SegmentedControl`, `SearchField` and `StatusBadge` retain their interaction semantics while receiving stronger visible states.
- Empty, loading and error states keep explicit text and icon treatment; color alone must never communicate state.

## Hoje fixture contract

Today fixtures remain progressively disclosed with `details/summary`. The collapsed state prioritizes competition, status, time, teams, score and broadcast evidence. Expanded content continues to separate recent form, Elo and broadcast information.

The redesign may increase visual emphasis through spacing, pastel panels, icon containers, borders and shadows, but must not recalculate or reinterpret any fixture, form, Elo or broadcast data on the client.

## Accessibility and responsive guardrails

The redesign preserves the existing accessibility and responsive contracts:

- keyboard focus remains visibly exposed;
- touch targets remain at least 44 px on coarse pointers and narrow screens;
- status meaning remains available as text, not color only;
- reduced-motion preferences continue to suppress non-essential transitions;
- mobile bottom navigation remains hidden while the on-screen keyboard is open;
- content order and progressive disclosure remain usable without hover;
- contrast must remain sufficient for body text, controls and status labels against the new light surfaces.

## Browser and PWA chrome

The application theme color is aligned to the new light canvas (`#f7f8f5`) and the Apple mobile web app status bar uses the default light treatment. This is visual chrome only and does not affect routing, authentication or runtime behavior.

## Change guardrails

Future frontend changes that modify `AppShell`, shared navigation semantics, primary surface hierarchy or these stage accents should update this document (or a superseding canonical frontend governance document) in the same pull request.
