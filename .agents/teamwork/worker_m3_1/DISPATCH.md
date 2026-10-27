# Dispatch: Worker M3.1 — Discrete & Categorical Charts

## 2026-10-17T05:30:00Z
You are worker_m3_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m3_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_1/handoff.md (BarChart blueprint)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_2/handoff.md (DoughnutChart blueprint)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_3/handoff.md (TopList blueprint)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY create or edit:
1. `ui/src/components/BarChart/BarChart.ts`
2. `ui/src/components/BarChart/BarChart.styles.ts`
3. `ui/src/components/DoughnutChart/DoughnutChart.ts`
4. `ui/src/components/DoughnutChart/DoughnutChart.styles.ts`
5. `ui/src/components/TopList/TopList.ts`
6. `ui/src/components/TopList/TopList.styles.ts`
7. `ui/src/components/Charts.test.ts`

REQUIREMENTS TO IMPLEMENT:

1. `moul-bar-chart` (`BarChart.ts`, `BarChart.styles.ts`):
   - Pure Lit 3 `MoulBarChart extends LitElement` registered via `defineElement('moul-bar-chart', MoulBarChart)`. Augment `HTMLElementTagNameMap`. Export `MoulBarChart as BarChart`, `MoulBarChart`, and `BarChartProps`.
   - Properties: `data`, `xKey` (`x-key`, default `'name'`), `series` (ChartSeries[]), `height` (default 300), `layout` (`'vertical' | 'horizontal'`, default `'vertical'`), `stacked` (boolean, default false), `showGrid` (`show-grid`, default true), `valueFormatter`.
   - D3 Pipeline: `scaleBand` (categorical axis) & `scaleLinear` (continuous metric axis). Support 4 combinations:
     - vertical + grouped
     - vertical + stacked
     - horizontal + grouped
     - horizontal + stacked
   - Safeguards: subnormal domain span safeguard (`Math.abs(domainMax - domainMin) < 1e-6`), defensive `try / catch` around `ticks()`, `Number.isFinite(...)` sanitization, empty data `<slot name="empty">`.
   - SVG `<rect>` elements with `subtleAnimate` / `CHART_EASE` motion transitions, `cursor="pointer"`, `part="bar"`.
   - Event contracts: pointerenter/pointerleave dispatching `point-hover` (`PointHoverDetail`) with projected `(x, y)` coordinates.

2. `moul-doughnut-chart` (`DoughnutChart.ts`, `DoughnutChart.styles.ts`):
   - Pure Lit 3 `MoulDoughnutChart extends LitElement` registered via `defineElement('moul-doughnut-chart', MoulDoughnutChart)`. Augment `HTMLElementTagNameMap`. Export `MoulDoughnutChart as DoughnutChart`, `MoulDoughnutChart`, `DoughnutChartProps`.
   - Properties: `data` (`DoughnutDataItem[]`), `innerRadiusRatio` (`inner-radius-ratio`, default 0.6, clamped [0, 0.95]), `height` (default 300), `valueFormatter`, `centerLabel` (`center-label`), `centerSublabel` (`center-sublabel`).
   - D3 Pipeline: `pie<DoughnutDataItem>()` & `arc()` from `d3-shape`. Assign colors using `item.color` or `getChartColor(idx)`.
   - Slice hover: +6px outer radius expansion and active class on hover.
   - Slices emit `point-hover` (`PointHoverDetail`) on pointerenter and `point-leave` on pointerleave. Coordinates computed from slice arc centroid.
   - Center slot: `<slot name="center">` with default fallback rendering `centerLabel` and `centerSublabel`.
   - Safeguards: empty data `<slot name="empty">`, all-zero values rendering empty track ring without `NaN`, single 100% slice rendering full 360° arc.

3. `moul-top-list` (`TopList.ts`, `TopList.styles.ts`):
   - Pure Lit 3 `MoulTopList extends LitElement` registered via `defineElement('moul-top-list', MoulTopList)`. Augment `HTMLElementTagNameMap`. Export `MoulTopList as TopList`, `MoulTopList`, `TopListProps`.
   - Properties: `data` (`TopListItem[]`), `max` (number), `valueFormatter`, `showRank` (`show-rank`, boolean, default true).
   - Layout: HTML list with ranked rows (`role="list"`, `role="listitem"`).
   - Proportional progress bar: `(item.value / computedMax) * 100`% width, `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`.
   - CSS tokens: bar fill styled with `item.color` or `getChartColor(idx)`.
   - Event contract: Click and Enter/Space on row dispatches `item-press` custom event (`{ detail: { item: TopListItem, index: number } }`).
   - Safeguards: empty data `<slot name="empty">`, 0/negative max value division by zero protection, missing label fallbacks.

4. `ui/src/components/Charts.test.ts`:
   - Append comprehensive test suites for Milestone 3:
     - `MoulBarChart (moul-bar-chart)`: Registration, vertical/horizontal layouts, grouped/stacked rectangles, empty state, `point-hover` event dispatch.
     - `MoulDoughnutChart (moul-doughnut-chart)`: Registration, arc slice paths, center slot and labels, inner-radius-ratio, `point-hover` event dispatch, all-zero and single-slice edge cases.
     - `MoulTopList (moul-top-list)`: Registration, ranked rows, proportional widths, `item-press` event on click and keyboard, `role="progressbar"`, empty state.
     - Integration tests: verify components work inside `<moul-chart-container>` and wire to `<moul-chart-tooltip>`.

VERIFICATION MANDATE:
Before submitting handoff:
1. `./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts` (100% passing).
2. `./node_modules/.bin/biome check ui/src/components/BarChart ui/src/components/DoughnutChart ui/src/components/TopList ui/src/components/Charts.test.ts` (0 errors).
3. `./ui/node_modules/.bin/tsc -p ui/tsconfig.json --noEmit` (0 errors).
4. `bun ./scripts/verify-no-react.ts all` (exits 0).

Document verbatim command execution outputs in `handoff.md` and send a message upon completion.
