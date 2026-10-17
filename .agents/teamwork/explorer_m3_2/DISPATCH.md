## 2026-10-17T05:20:00Z
You are explorer_m3_2.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_2

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md and `rdt/design.md` §8.1.

Task: Investigate `moul-doughnut-chart` (`DoughnutChart.ts` and `DoughnutChart.styles.ts`).
1. Inspect legacy `ui/src/components/DoughnutChart/DoughnutChart.tsx` and requirements in `rdt/design.md` §8.1.
2. Specify Lit 3 component architecture:
   - Component tag: `moul-doughnut-chart`, class: `MoulDoughnutChart as DoughnutChart`, exported types (`DoughnutDataItem` from `ChartCommon.ts`).
   - Reactive properties: `data` (`DoughnutDataItem[]`), `innerRadiusRatio` (`inner-radius-ratio`, default `0.6`), `height`, `valueFormatter`, `centerLabel`, `centerSublabel`.
   - D3 pipeline: `pie<DoughnutDataItem>()` & `arc()` from `d3-shape`. Arc slices, inner/outer radius, padAngle.
   - Slices: SVG `<path>` elements with color assignment (`getChartColor(idx)` or `item.color`), slice hover expansion (subtle radius enlargement or scale), `part="slice"`.
   - Center slot: `<slot name="center">` rendering custom center content or default `centerLabel` / `centerSublabel`.
   - Event contracts: pointerenter/pointerleave dispatching `point-hover` (`PointHoverDetail`).
   - Domain safeguards: empty data slot `<slot name="empty">`, all-zero values, single slice (360 deg arc).
3. Recommend complete implementation blueprint and test cases for the worker.
Record your findings in `handoff.md` in your working directory and notify the orchestrator.
Do NOT modify source files (Explorers are read-only).
