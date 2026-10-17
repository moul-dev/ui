# BRIEFING — 2026-10-17T05:25:00Z

## Mission
Investigate moul-bar-chart requirements and legacy BarChart.tsx, formulating a complete Lit 3 architecture, D3 scales (scaleBand, scaleLinear, horizontal/vertical layouts, stacked/grouped), SVG geometries, point-hover events, and test cases.

## 🔒 My Identity
- Archetype: explorer
- Roles: Read-only investigation: analyze problems, synthesize findings, produce structured reports.
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_1
- Original parent: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Milestone: Milestone 3 (BarChart)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source files
- Files for content delivery, Messages for coordination
- 5-Component Handoff Report in handoff.md

## Current Parent
- Conversation ID: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Updated: 2026-10-17T05:25:00Z

## Investigation State
- **Explored paths**:
  - `ui/src/components/BarChart/BarChart.tsx` (legacy Recharts/StyleX implementation)
  - `ui/src/components/BarChart/BarChart.styles.ts` (legacy StyleX styles)
  - `ui/src/components/BarChart/index.ts` (export barrier)
  - `ui/src/components/LineChart/LineChart.ts` & `AreaChart.ts` (Milestone 2 reference architecture)
  - `ui/src/components/ChartCommon.ts` (types, colors, hover contracts)
  - `ui/src/components/Charts.test.ts` (Milestone 1 & 2 test suites and mounting helpers)
  - `rdt/design.md` §8.1 & `ORIGINAL_REQUEST.md` (specs and requirements)
- **Key findings**:
  - Legacy `BarChart.tsx` depends on `recharts` and `@stylexjs/stylex`. Must be replaced with Lit 3 `MoulBarChart` and pure D3 math.
  - Reactive properties: `data`, `xKey` (`x-key`), `series`, `height`, `layout` (`'vertical' | 'horizontal'`), `stacked`, `showGrid` (`show-grid`), `valueFormatter`.
  - D3 pipeline uses `scaleBand` for categorical axis and `scaleLinear` for continuous metric axis.
  - Complete 4-way layout matrix formulated: vertical-grouped, vertical-stacked, horizontal-grouped, horizontal-stacked.
  - Complete domain safeguards, motion animations, event dispatch contracts, and Vitest test suite specified.
- **Unexplored areas**: None, investigation complete.

## Key Decisions Made
- `layout = 'vertical'` default: Bars grow vertically along Y axis (columns); categorical axis is X, numeric axis is Y.
- `layout = 'horizontal'`: Bars grow horizontally along X axis (bars); categorical axis is Y, numeric axis is X.
- `point-hover` event dispatches `PointHoverDetail` with anchor coordinate at the tip/center of the active bar rect.

## Artifact Index
- DISPATCH.md — Initial dispatch instructions
- BRIEFING.md — Persistent situational awareness
- progress.md — Liveness heartbeat and step tracking
- handoff.md — Final 5-component handoff report
