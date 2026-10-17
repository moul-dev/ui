## 2026-10-17T04:08:01Z

You are explorer_m2_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md (Section 2.2 #3).
Do NOT write code or modify source code files. You are a read-only investigation agent.

Formulate the complete implementation blueprint for `moul-line-chart` (`ui/src/components/LineChart/LineChart.ts` & `LineChart.styles.ts`):
- Extends `LitElement`, registered via idempotent `defineElement` as `moul-line-chart`.
- Augments `HTMLElementTagNameMap`: `'moul-line-chart': MoulLineChart`.
- Properties:
  - `data: Record<string, unknown>[] = []` (`attribute: false`)
  - `xKey: string = 'name'` (attribute `x-key`)
  - `series: ChartSeries[] = []` (`attribute: false`)
  - `height: number = 300` (type `Number`)
  - `showGrid: boolean = true` (type `Boolean`, attribute `show-grid`)
  - `curve: string = 'monotoneX'`
  - `valueFormatter?: (value: any) => string`
- D3 pipeline using `d3-scale` (`scalePoint`, `scaleLinear`) and `d3-shape` (`line`, `curveMonotoneX`).
  - Calculate domain safeguards: handle empty data (`!data || data.length === 0`), single data point, all-identical Y values, and negative values.
- Multi-series SVG rendering: `<svg>` viewport with viewBox based on container width & height, grid lines, series `<path>` strokes referencing `getChartColor(index)` or `s.color`, hover marker `<circle>`s.
- Interactive hover: `pointerenter` on points dispatches custom event `point-hover` (`bubbles: true, composed: true, detail: PointHoverDetail`).
- Empty state: When data is null, undefined, or empty `[]`, render `<slot name="empty"></slot>`.
- Motion: SVG path transition animated over 350ms using `CHART_EASE` via `subtleAnimate` from `../../utils/motion`, respecting `prefersReducedMotion()`.
- Pure Lit CSS styles in `LineChart.styles.ts` composed with `resetStyles`.
- Zero React or StyleX imports.

Write your complete blueprint to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_1/handoff.md`.
Send a message back when done.
