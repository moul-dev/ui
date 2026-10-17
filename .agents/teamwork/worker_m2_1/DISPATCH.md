## 2026-10-17T04:13:57Z
You are worker_m2_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m2_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).

Also read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_1/handoff.md (Complete MoulLineChart blueprint)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2/handoff.md (Complete MoulAreaChart blueprint)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_3/handoff.md (Complete test suite additions for Charts.test.ts)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY create or edit:
1. `ui/src/components/LineChart/LineChart.ts`
2. `ui/src/components/LineChart/LineChart.styles.ts`
3. `ui/src/components/AreaChart/AreaChart.ts`
4. `ui/src/components/AreaChart/AreaChart.styles.ts`
5. `ui/src/components/Charts.test.ts`

REQUIREMENTS FOR MILESTONE 2:
1. `moul-line-chart` (`ui/src/components/LineChart/LineChart.ts` & `LineChart.styles.ts`):
   - Replace legacy React/Recharts/StyleX with pure Lit 3 LitElement.
   - Use `resetStyles` from `../../styles/reset.styles`.
   - Register via idempotent `defineElement` as `moul-line-chart`.
   - Augment `HTMLElementTagNameMap`: `'moul-line-chart': MoulLineChart`.
   - Properties: `data`, `xKey` (`x-key`), `series`, `height`, `showGrid` (`show-grid`), `curve`, `valueFormatter`.
   - D3: `scalePoint` (X) and `scaleLinear` (Y) from `d3-scale`, `line` and `curveMonotoneX` from `d3-shape`.
   - Domain safeguards: handle empty data (`!data || data.length === 0`), single point, identical Y values, negative values.
   - SVG viewport: grid lines, multi-series path strokes using `getChartColor(index)` or `s.color`, hover marker `<circle>`s.
   - Interactive point hover: dispatches `point-hover` event (`PointHoverDetail`).
   - Empty state: renders `<slot name="empty"></slot>` when data is empty/null/undefined.
   - Motion: 350ms path transition with `CHART_EASE` via `subtleAnimate`, respecting `prefersReducedMotion()`.
   - Pure Lit CSS styles in `LineChart.styles.ts`. Zero React/StyleX imports.
2. `moul-area-chart` (`ui/src/components/AreaChart/AreaChart.ts` & `AreaChart.styles.ts`):
   - Replace legacy React/Recharts/StyleX with pure Lit 3 LitElement.
   - Use `resetStyles`.
   - Register via idempotent `defineElement` as `moul-area-chart`.
   - Augment `HTMLElementTagNameMap`: `'moul-area-chart': MoulAreaChart`.
   - Properties: `data`, `xKey` (`x-key`), `series`, `height`, `stacked`, `showGrid` (`show-grid`), `valueFormatter`.
   - D3: `scalePoint` and `scaleLinear`, `area`, `line`, `curveMonotoneX`.
   - Stacking support: when `stacked` is true, accumulate cumulative baseline offsets per category across series.
   - SVG `<defs>` with `<linearGradient>` per series (`stop-opacity="0.25"` to `0`).
   - Area filled path + top boundary stroke path.
   - Interactive point hover: dispatches `point-hover`.
   - Empty state: renders `<slot name="empty"></slot>` when data is empty/null/undefined.
   - Motion: 350ms geometry transition with `CHART_EASE`, respecting `prefersReducedMotion()`.
   - Pure Lit CSS styles in `AreaChart.styles.ts`. Zero React/StyleX imports.
3. `ui/src/components/Charts.test.ts`:
   - Append the tests specified in `explorer_m2_3/handoff.md`: `CHART-LINE-01` to `09`, `CHART-AREA-01` to `09`, and `CHART-INT-02` to `03`.
4. Verification:
   - Run `./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts` (ensure 100% pass across all M1 + M2 tests).
   - Run `./node_modules/.bin/biome check ui/src/components/LineChart ui/src/components/AreaChart ui/src/components/Charts.test.ts` (0 errors).
   - Verify `bun ./scripts/verify-no-react.ts all`.

Write your completion report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m2_1/handoff.md`.
Send a message back when done.
