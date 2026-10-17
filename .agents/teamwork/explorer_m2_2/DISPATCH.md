## 2026-10-17T04:08:01Z

You are explorer_m2_2.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md (Section 2.2 #4).
Do NOT write code or modify source code files. You are a read-only investigation agent.

Formulate the complete implementation blueprint for `moul-area-chart` (`ui/src/components/AreaChart/AreaChart.ts` & `AreaChart.styles.ts`):
- Extends `LitElement`, registered via idempotent `defineElement` as `moul-area-chart`.
- Augments `HTMLElementTagNameMap`: `'moul-area-chart': MoulAreaChart`.
- Properties:
  - `data: Record<string, unknown>[] = []` (`attribute: false`)
  - `xKey: string = 'name'` (attribute `x-key`)
  - `series: ChartSeries[] = []` (`attribute: false`)
  - `height: number = 300` (type `Number`)
  - `stacked: boolean = false` (type `Boolean`)
  - `showGrid: boolean = true` (type `Boolean`, attribute `show-grid`)
  - `valueFormatter?: (value: any) => string`
- D3 pipeline using `d3-scale` and `d3-shape` (`area`, `line`, `curveMonotoneX`).
  - Stacking support: when `stacked` is true, accumulate cumulative baseline offsets per category across series.
  - SVG `<defs>` with `<linearGradient>` per series using `stop-opacity="0.25"` to `stop-opacity="0"`.
  - Area filled `<path>` with gradient fill, plus upper boundary stroke `<path>`.
- Interactive hover: `point-hover` event dispatch.
- Empty state: When data is null, undefined, or empty `[]`, render `<slot name="empty"></slot>`.
- Motion: Geometry transitions over 350ms with `CHART_EASE`, respecting `prefersReducedMotion()`.
- Pure Lit CSS styles in `AreaChart.styles.ts` composed with `resetStyles`.
- Zero React or StyleX imports.

Write your complete blueprint to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_2/handoff.md`.
Send a message back when done.
