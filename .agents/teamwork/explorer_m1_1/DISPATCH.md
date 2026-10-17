## 2026-10-17T03:19:16Z
You are explorer_m1_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md.
Do NOT write code or modify source code files. You are a read-only investigation agent.

Your mission is to formulate the exact implementation blueprint for:
1. `ui/src/components/ChartCommon.ts`:
   - Exact TypeScript interfaces: `ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail`.
   - `getChartColor(index: number): string` returning `var(--color-chart-${(index % 8) + 1})`.
   - Purge all imports of `tokens.stylex`.
2. `moul-chart-container` (`ui/src/components/ChartContainer/ChartContainer.ts` & `ChartContainer.styles.ts`):
   - Replace legacy React/Recharts/StyleX with Lit 3 LitElement.
   - Use `resetStyles` from `../../styles/reset.styles`.
   - Register via idempotent `defineElement` from `../../utils/define-element`.
   - Integrate `LayoutIndicatorController` with `{ observeDimensions: true }`.
   - Properties: `title`, `description`, `height` (default 300), `isEmpty` (`is-empty`).
   - Emit `viewport-resize` event with `{ width, height, breakpoint }` on dimension change.
   - Render slots: `<slot name="header">`, default `<slot>`, `<slot name="empty">`, `<slot name="legend">`.
   - When `isEmpty` is true, render `<slot name="empty"><p class="empty-message">No data available</p></slot>`.
   - CSS styles using Lit `css` tagged template, CSS variables from `style.css`.

Write your full findings and implementation strategy to:
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_1/handoff.md
Send a message back when done.
