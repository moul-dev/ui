## 2026-10-17T05:20:00Z
You are explorer_m3_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md and `rdt/design.md` §8.1.

Task: Investigate `moul-bar-chart` (`BarChart.ts` and `BarChart.styles.ts`).
1. Inspect legacy `ui/src/components/BarChart/BarChart.tsx` and requirements in `rdt/design.md` §8.1.
2. Specify Lit 3 component architecture:
   - Component tag: `moul-bar-chart`, class: `MoulBarChart as BarChart`, exported types.
   - Reactive properties: `data`, `xKey` (`x-key`), `series`, `height`, `layout` (`'vertical' | 'horizontal'`), `stacked`, `showGrid`, `valueFormatter`.
   - D3 pipeline: `scaleBand` (categorical axis) & `scaleLinear` (continuous metric axis), grouped vs stacked bar layout math.
   - SVG rect elements with transitions (`subtleAnimate`, `CHART_EASE`), `cursor="pointer"`, `part="bar"`.
   - Event contracts: pointerenter/pointerleave dispatching `point-hover` (`PointHoverDetail`).
   - Domain safeguards: empty data slot `<slot name="empty">`, single item, subnormal numbers, degenerate spans.
3. Recommend complete implementation blueprint and test cases for the worker.
Record your findings in `handoff.md` in your working directory and notify the orchestrator.
Do NOT modify source files (Explorers are read-only).
