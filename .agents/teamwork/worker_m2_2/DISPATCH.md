# Dispatch: Worker M2.2

## 2026-10-17T05:05:00Z
You are worker_m2_2.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m2_2

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md, /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_1/handoff.md, /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_2/handoff.md, and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_3/handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A forensic auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may ONLY edit:
1. `ui/src/components/LineChart/LineChart.ts`
2. `ui/src/components/AreaChart/AreaChart.ts`

TASK OBJECTIVES:
Apply the exact remediation formulated by the explorers:
1. In `ui/src/components/LineChart/LineChart.ts`:
   - Input normalization & filtering: Use `Number.isFinite(...)` instead of `!Number.isNaN(...)` across `getActiveSeries`, `yValues`, `lineGenerator.defined()`, and `<circle>` rendering to prevent `Infinity` / `-Infinity` from producing `NaN`.
   - Domain span safeguard: When calculating `minY` and `maxY`, if `Math.abs(maxY - minY) < 1e-6`:
     - If `minY < 0 && maxY > 0`: `minY = -1; maxY = 1;`
     - Else if `maxY <= 0`: `minY = -1; maxY = 0;`
     - Else: `minY = 0; maxY = 1;`
   - Defensive ticks: Wrap `yScale.ticks(5)` in a `try / catch`:
     ```ts
     let yTicks: number[] = []
     try {
       yTicks = yScale.ticks(5)
     } catch {
       yTicks = [minY, (minY + maxY) / 2, maxY]
     }
     if (!yTicks || yTicks.length === 0) {
       yTicks = [minY, (minY + maxY) / 2, maxY]
     }
     ```
2. In `ui/src/components/AreaChart/AreaChart.ts`:
   - Input normalization: `const num = Number(raw); const val = Number.isFinite(num) ? num : 0;` in stacking calculation.
   - Non-finite filtering with `Number.isFinite(...)` across series keys, areaGenerator `.defined()`, and `<circle>` rendering.
   - Domain span safeguard: When `Math.abs(domainMax - domainMin) < 1e-6`:
     - If `domainMin < 0 && domainMax > 0`: `domainMin = -1; domainMax = 1;`
     - Else if `domainMax <= 0`: `domainMin = -1; domainMax = 0;`
     - Else: `domainMin = 0; domainMax = 1;`
   - Defensive ticks: Wrap `yScale.ticks(5)` in `try / catch` with fallback to `[domainMin, (domainMin + domainMax) / 2, domainMax]`.

VERIFICATION:
Run and verify:
1. `./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts` (all 41 tests pass, especially `CHART-LINE-09`!).
2. `./ui/node_modules/.bin/vitest run --root ui src/components/line-chart-challenge.test.ts src/components/area-chart-challenge.test.ts` (all pass).
3. `./node_modules/.bin/biome check ui/src/components/LineChart ui/src/components/AreaChart` (0 errors).
4. `bun ./scripts/verify-no-react.ts all` (exits 0).

Write a comprehensive handoff report in `handoff.md` in your working directory and notify the orchestrator.
