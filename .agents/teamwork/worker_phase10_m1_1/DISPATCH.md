# Dispatch — Worker M1.1

## Mission
Implement Milestone 1: Complete Single Public Entry Point (`ui/src/index.ts`) & Tag Map Augmentation for @moul-dev/ui.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m1_1

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_3/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_phase10_m1_2/handoff.md
- Complete synthesized index: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_3/proposed_index.ts

## Write Ownership
You exclusively own and may edit:
- `ui/src/index.ts`
- `ui/src/components/ChartContainer/index.ts`
- `ui/src/components/ChartTooltip/index.ts`
- `ui/src/components/DoughnutChart/index.ts`

Do NOT touch any other files in `ui/src/` or outside your ownership.

## Tasks
1. Apply the verified `ui/src/index.ts` from the Explorer findings:
   - Export all 54 component classes, subcomponents, and their Lit types (77 custom elements).
   - Export all 5 reactive controllers and their option/state types from `./controllers`.
   - Export `toastQueue`, `generatePagination`, and all 7 pure log parsers/constants (`parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, `SERVER_LOGS`).
   - Export chart utilities and types: `ChartSeries`, `DoughnutDataItem`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor` from `./components/ChartCommon`.
   - Remove lingering legacy React exports (`Autocomplete`, `Description`, `Label`) and phantom types (`ChartContainerProps`, `LegendItem`, `CustomTooltipProps`).
   - Augment `HTMLElementTagNameMap` with all 77 `moul-*` tags mapped 1:1 to their exact LitElement classes, with all 77 type imports resolved preceding `declare global`.
2. Update the companion barrel files:
   - `ui/src/components/ChartContainer/index.ts`: export `ViewportResizeDetail` (removing `ChartContainerProps`, `LegendItem`).
   - `ui/src/components/ChartTooltip/index.ts`: export `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions` (removing `CustomTooltipProps`).
   - `ui/src/components/DoughnutChart/index.ts`: re-export `DoughnutDataItem` from `../ChartCommon`.
3. Verify formatting and linting:
   - Run `bunx @biomejs/biome check --write ui/src/index.ts ui/src/components/ChartContainer/index.ts ui/src/components/ChartTooltip/index.ts ui/src/components/DoughnutChart/index.ts`.
4. Report results in `handoff.md` including exact commands run and outcomes.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.


## 2026-10-17T13:08:22Z
[Message] timestamp=2026-10-17T13:08:22Z sender=dae9e90c-c048-4fc8-8e06-169a5a42bbad priority=MESSAGE_PRIORITY_HIGH content=You are worker_phase10_m1_1, a teamwork_preview_worker.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m1_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m1_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

You exclusively own and may edit:
- ui/src/index.ts
- ui/src/components/ChartContainer/index.ts
- ui/src/components/ChartTooltip/index.ts
- ui/src/components/DoughnutChart/index.ts

Your tasks:
1. Apply the synthesized ui/src/index.ts from /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_3/proposed_index.ts (or /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1/proposed_index.ts), exporting all 54 component classes and companion elements (77 custom elements), 5 reactive controllers, toastQueue, generatePagination, all 7 log parser utilities, and chart helpers/types.
2. Ensure lingering legacy React exports (Autocomplete, Description, Label) and phantom types (ChartContainerProps, LegendItem, CustomTooltipProps) are removed.
3. Update ui/src/components/ChartContainer/index.ts to export ViewportResizeDetail.
4. Update ui/src/components/ChartTooltip/index.ts to export ChartTooltipPayloadEntry, ChartTooltipShowOptions.
5. Update ui/src/components/DoughnutChart/index.ts to export DoughnutDataItem from ../ChartCommon.
6. Run Biome formatting / linting: bunx @biomejs/biome check --write ui/src/index.ts ui/src/components/ChartContainer/index.ts ui/src/components/ChartTooltip/index.ts ui/src/components/DoughnutChart/index.ts.
