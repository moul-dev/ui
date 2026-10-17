## 2026-10-17T03:24:40Z

You are worker_m1_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m1_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
IMPORTANT: Note that the user request is in the LATEST section of ORIGINAL_REQUEST.md (under ## 2026-10-17T03:06:45Z), which mandates Phase 8: Category 1 — Charts & Data Visualization rebuild as Lit Web Components.

Also read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md (Sections 2.1 & 2.2 for exact element specifications)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_survey_2/handoff.md (Controller APIs and design tokens)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/handoff.md (Section 4.2 for the complete 16-test suite for Milestone 1)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY create or modify the following files:
1. `ui/src/components/ChartCommon.ts`
2. `ui/src/components/ChartContainer/ChartContainer.ts`
3. `ui/src/components/ChartContainer/ChartContainer.styles.ts`
4. `ui/src/components/ChartTooltip/ChartTooltip.ts`
5. `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`
6. `ui/src/components/Charts.test.ts`

REQUIREMENTS FOR MILESTONE 1:
1. `ui/src/components/ChartCommon.ts`:
   - Export interfaces: `ChartSeries`, `DoughnutDataItem`, `TopListItem`, `PointHoverDetail`.
   - Export helper `getChartColor(index: number): string` which returns `var(--color-chart-${(((index % 8) + 8) % 8) + 1})`.
   - Pure TypeScript, zero React or StyleX imports.
2. `moul-chart-container` (`ui/src/components/ChartContainer/ChartContainer.ts` & `ChartContainer.styles.ts`):
   - Lit 3 LitElement, using `resetStyles` from `../../styles/reset.styles`.
   - Register via idempotent `defineElement` from `../../utils/define-element`.
   - Augment `HTMLElementTagNameMap`: `'moul-chart-container': MoulChartContainer`.
   - Properties: `@property({ type: String, reflect: true }) title = ''`, `@property({ type: String, reflect: true }) description = ''`, `@property({ type: Number, reflect: true }) height = 300`, `@property({ type: Boolean, reflect: true, attribute: 'is-empty' }) isEmpty = false`.
   - Controller: `private layout = new LayoutIndicatorController(this, { observeDimensions: true })`.
   - On dimension change / updated: emit custom event `viewport-resize` (`bubbles: true, composed: true, detail: { width: this.layout.width, height: this.layout.height, breakpoint: this.layout.breakpoint }`).
   - Shadow DOM template:
     - Header container rendering title, description, and `<slot name="header">`.
     - When `isEmpty` is true, render `<slot name="empty"><p class="empty-message">No data available</p></slot>`.
     - When `isEmpty` is false, render default `<slot></slot>`.
     - Footer / legend container rendering `<slot name="legend"></slot>`.
   - Styles in `ChartContainer.styles.ts`: pure Lit CSS tagged template using CSS variables (`--color-bg`, `--color-border`, `--color-fg`, `--color-fg-subtle`, `--radius-lg`, `--shadow-sm`, etc.).
3. `moul-chart-tooltip` (`ui/src/components/ChartTooltip/ChartTooltip.ts` & `ChartTooltip.styles.ts`):
   - Lit 3 LitElement, using `resetStyles`.
   - Register via idempotent `defineElement`.
   - Augment `HTMLElementTagNameMap`: `'moul-chart-tooltip': MoulChartTooltip`.
   - In `connectedCallback`, set `this.setAttribute('popover', 'manual')` (or inner popover element has `popover="manual"` and host delegates/manages).
   - Integrate `OverlayPresenceController(this, { preset: 'tooltip', popover: () => this.popoverEl })`.
   - Properties: `@property({ type: String }) label = ''`, `@property({ type: String }) value = ''`, `@property({ type: String }) color = 'var(--color-chart-1)'`, `@property({ type: Boolean, reflect: true, attribute: 'is-open' }) isOpen = false`, `@property({ type: Number }) x = 0`, `@property({ type: Number }) y = 0`, `@property({ attribute: false }) payload: any[] = []`.
   - Methods:
     - `show(options: { label: string; value: string; color?: string; x?: number; y?: number } | number, y?: number, label?: string, value?: string, color?: string)`: flexibly handle either options object or positional args. Sets `isOpen = true`, coordinates, label, value, and calls `showPopover()`.
     - `hide()`: sets `isOpen = false` and calls `hidePopover()`.
   - Coordinates applied to style via `left`, `top` or `transform: translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -100%) translateY(-8px)`.
   - Shadow DOM renders indicator swatch with `${this.color}`, label text, value text, and default `<slot></slot>`.
4. `ui/src/components/Charts.test.ts`:
   - Implement the 16 tests specified in `explorer_m1_3/handoff.md` Section 4.2.
5. Verification:
   - Run `bun --cwd ui test src/components/Charts.test.ts` (or `node ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts`). Ensure 100% pass!
   - Run `bun run lint` (or `bun x biome check ui/src/components/ChartContainer ui/src/components/ChartTooltip ui/src/components/ChartCommon.ts ui/src/components/Charts.test.ts`). Ensure 0 errors!
   - Verify `bun ./scripts/verify-no-react.ts all`.
