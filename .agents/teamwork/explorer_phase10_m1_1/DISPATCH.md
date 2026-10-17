# Dispatch — Explorer M1.1

## Mission
Investigate and draft the complete public export surface for `ui/src/index.ts` for Milestone 1.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1

## Authoritative Requirements & Context
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_1/handoff.md

## Scope & Tasks
1. Audit all export statements in `ui/src/index.ts`.
2. Remove legacy React exports: `Autocomplete`, `Description`, `Label` and any associated legacy types.
3. Fix phantom type exports (e.g. `ChartContainerProps`, `LegendItem`, `CustomTooltipProps`) and replace with actual interfaces (`ViewportResizeDetail`, `ChartTooltipPayloadEntry`, `ChartTooltipShowOptions`).
4. Ensure all 54 component classes, subcomponents, and their associated types are exported cleanly.
5. Report findings and proposed file modifications in `handoff.md`.


## 2026-10-17T12:58:30Z
You are explorer_phase10_m1_1, a teamwork_preview_explorer.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10).

Your tasks:
1. Audit all component exports in ui/src/index.ts.
2. Remove legacy React exports (Autocomplete, Description, Label) and associated types.
3. Fix phantom type exports (ChartContainerProps, LegendItem, CustomTooltipProps) and replace with actual exported types (ViewportResizeDetail, ChartTooltipPayloadEntry, ChartTooltipShowOptions).
4. Verify that all 54 component classes, subcomponents, and their associated types are cleanly exported.
5. Write your findings and proposed exports to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m1_1/handoff.md and message the orchestrator.
