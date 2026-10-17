# BRIEFING — 2026-10-17T04:12:15Z

## Mission
Formulate complete test specification for MoulLineChart and MoulAreaChart to be added to ui/src/components/Charts.test.ts.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_3
- Original parent: 5d04df52-77dd-4159-8972-455e52835bdb
- Milestone: m2_3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code files directly
- Write complete executable test specifications to handoff.md

## Current Parent
- Conversation ID: 5d04df52-77dd-4159-8972-455e52835bdb
- Updated: 2026-10-17T04:12:15Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md` (Requirements R1–R5 for Phase 8)
  - `orchestrator_phase8_1/PROJECT.md`, `plan.md`, `context.md`
  - `explorer_survey_3/handoff.md` (Suites 5 & 6 test specifications)
  - `spec_miner_survey_1/handoff.md` (§2.2 #3 & #4 detailed specs for MoulLineChart & MoulAreaChart)
  - `ui/src/components/ChartCommon.ts`
  - `ui/src/components/ChartContainer/ChartContainer.ts`
  - `ui/src/components/ChartTooltip/ChartTooltip.ts`
  - `ui/src/components/Charts.test.ts` (Existing Milestone 1 test suite)
- **Key findings**:
  - `MoulLineChart`: Custom element `moul-line-chart`, D3 `line()` + `curveMonotoneX`, `xScale: scalePoint`, `yScale: scaleLinear`. Renders `<path>` with `d` starting with `'M'`. Colors use `getChartColor(index)` -> `--color-chart-1`..`--color-chart-8`. Renders marker `<circle>` elements at projected coordinates; `pointerenter` fires `point-hover` (`detail: PointHoverDetail`). Empty state: renders `<slot name="empty">` and omits paths/circles when `data` is `[]`, `null`, or `undefined`.
  - `MoulAreaChart`: Custom element `moul-area-chart`, D3 `area()` + `curveMonotoneX` + `line()`. Renders closed area fill `<path>` (`d` starts with `'M'` and ends with `'Z'`) and stroke `<path>` for top boundary. Renders `<defs><linearGradient>` with stops (`stop-opacity="0.25"` to `0`). In stacked mode, area geometry shifts upward (`y_stacked < y_unstacked` in SVG coordinates, where 0 is top). Interactive `pointerenter` on points emits `point-hover`. Empty state renders `<slot name="empty">` when data is empty.
  - Test harness uses Vitest + happy-dom with `mount()` and `awaitNestedUpdates()`. Happy-dom does not compute SVG layouts (`getBBox()`), so assertions evaluate mathematical SVG attributes (`d`, `cx`, `cy`, `fill`, `stroke`, `stop-opacity`).
- **Unexplored areas**: None, full specification ready.

## Key Decisions Made
- Organized test suites into Suite 5 (`MoulLineChart`), Suite 6 (`MoulAreaChart`), and integration with Container & Tooltip.
- Specified 9 test cases for `MoulLineChart` (including fast-check property test for arbitrary numeric datasets).
- Specified 9 test cases for `MoulAreaChart` (including mathematical verification of stacking shifts and fast-check).
- Authored complete executable TypeScript code ready for downstream inclusion into `ui/src/components/Charts.test.ts`.

## Artifact Index
- DISPATCH.md — Initial dispatch instructions
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat
- handoff.md — Final test specification report with complete executable test code
