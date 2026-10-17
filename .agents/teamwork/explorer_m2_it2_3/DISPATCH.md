## 2026-10-17T04:53:00Z
You are explorer_m2_it2_3.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_3

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/reviewer_m2_it2_1/handoff.md.

Task:
Milestone 2 reviewer flagged that non-finite numbers (`Infinity` / `-Infinity`) can slip past checks and cause `yScale(Infinity)` to compute `NaN`, emitting `NaN` into SVG path strings (`d`) and circle attributes (`cy`).
Investigate `ui/src/components/LineChart/LineChart.ts` and `ui/src/components/AreaChart/AreaChart.ts` for all places where data values are parsed, filtered, or projected.
Recommend exact locations where `Number.isFinite(...)` should be added to completely eliminate `NaN` risk.
Record your findings and fix strategy in `handoff.md` in your working directory and notify the orchestrator.
Do NOT modify source files (Explorers are read-only).
