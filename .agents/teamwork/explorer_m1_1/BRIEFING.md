# BRIEFING — 2026-10-17T03:25:00Z

## Mission
Formulate exact implementation blueprint for ChartCommon.ts and moul-chart-container (Lit 3 Web Component).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_1
- Original parent: 5d04df52-77dd-4159-8972-455e52835bdb
- Milestone: Milestone 1 (ChartCommon & ChartContainer)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code files
- Provide concrete, exact implementation blueprints for implementers

## Current Parent
- Conversation ID: 5d04df52-77dd-4159-8972-455e52835bdb
- Updated: 2026-10-17T03:19:16Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `spec_miner_survey_1/handoff.md`
  - `ui/src/components/ChartCommon.ts`
  - `ui/src/components/ChartContainer/ChartContainer.tsx` & `.styles.ts` & `index.ts`
  - `ui/src/styles/reset.styles.ts`, `style.css`
  - `ui/src/utils/define-element.ts`
  - `ui/src/controllers/layout-indicator.controller.ts` & `Controllers.test.ts`
  - `ui/src/test-setup.ts` (`triggerResize`)
  - `ui/src/components/Surfaces.test.ts` & other Lit components (`Card.ts`, `EmptyState.ts`, `Table.ts`)
- **Key findings**:
  - `ChartCommon.ts` currently imports `tokens.stylex`; must be replaced with pure interfaces, `getChartColor`, and `CHART_COLORS` array referencing CSS tokens.
  - `moul-chart-container` requires `LayoutIndicatorController({ observeDimensions: true })`, emitting `viewport-resize` on dimension change.
  - Slots: `<slot name="header">`, default `<slot>`, `<slot name="empty">`, `<slot name="legend">`.
  - When `isEmpty` is true, render `<slot name="empty"><p class="empty-message">No data available</p></slot>` in place of default slot.
  - Zero React, StyleX, or Recharts imports. Idempotent `defineElement` registration.
- **Unexplored areas**: None for Milestone 1 scope.

## Key Decisions Made
- `getChartColor(index)` uses `((Math.floor(index) % 8) + 8) % 8 + 1` for 100% resilience with negative/non-integer numbers.
- `MoulChartContainer` checks dimension changes in `requestUpdate()` and `updated()`, emitting `viewport-resize` event with `{ width, height, breakpoint }`.
- Empty state replaces default `<slot>` when `isEmpty === true`, providing `<p class="empty-message">No data available</p>` fallback.

## Artifact Index
- DISPATCH.md — incoming dispatch instructions
- BRIEFING.md — persistent working memory
- progress.md — liveness heartbeat
- handoff.md — final comprehensive handoff report
