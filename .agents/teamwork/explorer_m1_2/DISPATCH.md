## 2026-10-17T03:19:16Z
You are explorer_m1_2.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md.
Do NOT write code or modify source code files. You are a read-only investigation agent.

Your mission is to formulate the exact implementation blueprint for `moul-chart-tooltip`:
- File locations: `ui/src/components/ChartTooltip/ChartTooltip.ts` and `ChartTooltip.styles.ts`.
- Replace legacy React/Recharts/StyleX with Lit 3 LitElement.
- Use `resetStyles` from `../../styles/reset.styles`.
- Register via idempotent `defineElement`.
- Popover API integration: host/popover element must have `popover="manual"`.
- Integrate `OverlayPresenceController` with `preset: 'tooltip'`.
- Properties: `label`, `value`, `color` (default `'var(--color-chart-1)'`), `isOpen` (`is-open`), `x`, `y`, `payload`.
- Public methods: `show(x: number, y: number, label: string, value: string, color?: string)` and `hide()`.
- Position via CSS transform `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px)` with fallback when native anchor is unsupported.
- Renders indicator dot with series color, label, and formatted value. Slot for custom content.
- Styling: dark/light theme aware, glass backdrop-filter progressive enhancement, elevated shadow.

Write your full findings and implementation strategy to:
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2/handoff.md
Send a message back when done.
