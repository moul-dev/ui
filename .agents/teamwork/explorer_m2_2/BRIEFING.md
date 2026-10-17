# BRIEFING — 2026-10-17T04:12:00Z

## Mission
Formulate the complete implementation blueprint for `moul-area-chart` (`ui/src/components/AreaChart/AreaChart.ts` & `AreaChart.styles.ts`) according to Lit conversion specifications, D3 pipeline, stacking, gradient styling, hover events, reduced motion, and pure Lit CSS.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, architectural blueprint formulation, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2
- Original parent: 5d04df52-77dd-4159-8972-455e52835bdb
- Milestone: milestone 2 (AreaChart Lit implementation blueprint)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Zero React or StyleX imports
- Write only to working directory (/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2)
- Handoff report in handoff.md following 5-component protocol

## Current Parent
- Conversation ID: 5d04df52-77dd-4159-8972-455e52835bdb
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md` (lines 221–266, Phase 8 specifications)
  - `orchestrator_phase8_1/PROJECT.md` (Milestone 2 scope and layout)
  - `spec_miner_survey_1/handoff.md` (Section 2.2 #4, MoulAreaChart spec)
  - `ui/src/components/ChartCommon.ts` (shared interfaces, `getChartColor`)
  - `ui/src/components/ChartContainer/ChartContainer.ts`
  - `ui/src/components/ChartTooltip/ChartTooltip.ts`
  - `ui/src/components/AreaChart/AreaChart.tsx` (legacy React component)
  - `ui/src/components/AreaChart/AreaChart.styles.ts` (legacy StyleX styles)
  - `ui/src/styles/reset.styles.ts` (shared shadow DOM reset)
  - `ui/src/utils/motion.ts` (`CHART_EASE`, `subtleAnimate`, `prefersReducedMotion`)
  - `ui/src/utils/define-element.ts` (idempotent registration)
  - `ui/src/controllers/layout-indicator.controller.ts` (responsive measurement)
  - `ui/src/components/Charts.test.ts` (existing M1 suites & structure)
  - `explorer_survey_3/handoff.md` (Suite 6 test requirements for MoulAreaChart)
- **Key findings**:
  - `MoulAreaChart` extends `LitElement`, registered as `moul-area-chart` via `defineElement`.
  - Properties: `data`, `xKey` (`x-key`), `series`, `height`, `stacked`, `showGrid` (`show-grid`), `valueFormatter`.
  - D3 pipeline uses `scalePoint` (X) and `scaleLinear` (Y) from `d3-scale`, and `area`, `line`, `curveMonotoneX` from `d3-shape`.
  - Stacking uses running cumulative baseline accumulators (`posBaselines`, `negBaselines`) per category.
  - SVG `<defs>` generates `<linearGradient>` per series with `stop-opacity="0.25"` to `stop-opacity="0"`.
  - Area filled `<path>` with gradient fill, plus upper boundary stroke `<path>`.
  - Responsive SVG viewport via `LayoutIndicatorController(this, { observeDimensions: true })`.
  - Interactive hover: data points render marker `<circle>` + hit target `<circle>` dispatching `point-hover` event (`PointHoverDetail`).
  - Empty state: `<slot name="empty"></slot>` rendered when data is empty/null/undefined.
  - Motion: `subtleAnimate` with `CHART_EASE` over 350ms, respecting `prefersReducedMotion()`.
  - Pure Lit CSS styles composed with `resetStyles` in `AreaChart.styles.ts`.
- **Unexplored areas**: none. All requirements and edge cases explored.

## Key Decisions Made
- Fully specified complete source code blueprints for `AreaChart.ts`, `AreaChart.styles.ts`, and `index.ts`.
- Included fallback for single-point datasets and identical Y-values to prevent D3 division-by-zero or `NaN`.
- Included fallback `effectiveSeries` derivation when `series` is not explicitly passed.

## Artifact Index
- `DISPATCH.md` — incoming dispatch instructions
- `BRIEFING.md` — persistent working memory
- `progress.md` — liveness heartbeat
- `handoff.md` — final 5-component handoff report
