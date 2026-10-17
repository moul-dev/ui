# BRIEFING — 2026-10-17T03:22:30Z

## Mission
Formulate the exact implementation blueprint for `moul-chart-tooltip` (Lit 3 LitElement, Popover API `manual`, OverlayPresenceController, styles, properties, methods, slots).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2
- Original parent: 5d04df52-77dd-4159-8972-455e52835bdb
- Milestone: M1 Chart Primitives - Tooltip

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do not write code or modify source code files outside .agents/teamwork/explorer_m1_2
- Exact file locations: ui/src/components/ChartTooltip/ChartTooltip.ts and ChartTooltip.styles.ts
- Replace legacy React/Recharts/StyleX with Lit 3 LitElement
- Use resetStyles from ../../styles/reset.styles
- Register via idempotent defineElement
- Popover API integration: host/popover element must have popover="manual"
- Integrate OverlayPresenceController with preset: 'tooltip'
- Properties: label, value, color (default 'var(--color-chart-1)'), isOpen (is-open), x, y, payload
- Public methods: show(x: number, y: number, label: string, value: string, color?: string) and hide()
- Position via CSS transform translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px) with fallback when native anchor is unsupported
- Indicator dot with series color, label, and formatted value. Slot for custom content
- Styling: dark/light theme aware, glass backdrop-filter progressive enhancement, elevated shadow

## Current Parent
- Conversation ID: 5d04df52-77dd-4159-8972-455e52835bdb
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ui/src/components/ChartTooltip/ChartTooltip.tsx` (legacy React/StyleX implementation)
  - `ui/src/components/ChartTooltip/ChartTooltip.styles.ts` (legacy StyleX rules)
  - `ui/src/components/Tooltip/Tooltip.ts` & `Tooltip.styles.ts` (modern Lit reference for popover/tooltip)
  - `ui/src/components/Popover/Popover.ts` & `Popover.styles.ts` (fallback positioning and Popover API)
  - `ui/src/controllers/overlay-presence.controller.ts` (preset 'tooltip' animations and lifecycle)
  - `ui/src/utils/focus-trap.ts` (`supportsNativePopoverAndAnchor`)
  - `ui/src/styles/reset.styles.ts` (`resetStyles` CSSResultGroup)
  - `ui/src/styles/style.css` (OKLCH light-dark tokens, `--color-chart-1` to `--color-chart-8`, `--color-bg-glass`, `--color-bg-elevated`, `--shadow-lg`)
  - `ui/src/styles/semantic-tones.ts` (glass `@supports` backdrop-filter pattern)
  - `ui/src/test-setup.ts` (happy-dom popover shim)
- **Key findings**:
  - `OverlayPresenceController` preset `'tooltip'` executes `opacity: [0, 1], scale: [0.96, 1], y: [-2, 0]` on enter (`SPRING_SNAPPY`) and `opacity: [1, 0], scale: [1, 0.96]` on exit (100ms).
  - Popover API `manual` works in both native and happy-dom environments when host and inner elements declare `popover="manual"`.
  - Position transform `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%) translateY(-8px)` centers the tooltip above the hover target with an 8px vertical offset.
  - Multi-series payload entries and single series properties can both be rendered cleanly with indicator dot, series color, label, and formatted value, with fallback `<slot>` for custom overrides.
- **Unexplored areas**: None for M1 ChartTooltip.

## Key Decisions Made
- Architected drop-in replacement files: `ChartTooltip.ts`, `ChartTooltip.styles.ts`, and `index.ts`.
- Outlined precise TypeScript interfaces, LitElement properties, reactive lifecycle, public methods, and CSS rules with progressive glass enhancement and theme awareness.

## Artifact Index
- DISPATCH.md — Initial dispatch message
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat
- handoff.md — Complete 5-component blueprint report
