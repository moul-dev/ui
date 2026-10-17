## 2026-10-17T03:19:16Z
From: 5d04df52-77dd-4159-8972-455e52835bdb
Content:
You are explorer_m1_3.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_1/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_survey_3/handoff.md.
Do NOT write code or modify source code files. You are a read-only investigation agent.

Your mission is to formulate the exact unit and integration test plan for Milestone 1 (`moul-chart-container` and `moul-chart-tooltip`):
- Review tests in `ui/src/components/Overlays.test.ts` and `Surfaces.test.ts` to replicate exact testing patterns.
- Specify test cases for:
  1. `moul-chart-container`:
     - Registration in `customElements` and `MoulChartContainer` instance check.
     - Title and description rendering.
     - Slotted content rendering.
     - Empty state rendering when `is-empty` is set: `<slot name="empty">` rendered.
     - Deterministic resize testing using `triggerResize(container, { width: 600, height: 300 })` and verifying `viewport-resize` event detail.
  2. `moul-chart-tooltip`:
     - Registration in `customElements` and `MoulChartTooltip` instance check.
     - Initial closed state (`isOpen = false`, `:popover-open` false).
     - Calling `show(...)` or `showPopover()`: sets `isOpen = true`, `:popover-open`, renders indicator color, label, and value.
     - Positioning: verifies style coordinates updated based on `x` and `y`.
     - Calling `hide()` or `hidePopover()`: closes popover and sets `isOpen = false`.
  3. `ChartCommon.ts`:
     - `getChartColor(0)` returns `'var(--color-chart-1)'` through `getChartColor(7)` returning `'var(--color-chart-8)'` and modulo 8 wrapping.

Write your complete test plan to:
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/handoff.md
Send a message back when done.
