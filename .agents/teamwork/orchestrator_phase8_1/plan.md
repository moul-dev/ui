# Orchestration Plan — Phase 8

## Strategy
Decompose Phase 8 into 5 milestones:
1. **Milestone 1: Chart Container & Tooltip Foundation**
   - Implement `ChartCommon.ts`, `MoulChartContainer` (`moul-chart-container`), and `MoulChartTooltip` (`moul-chart-tooltip`).
   - Run iteration loop: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate.
2. **Milestone 2: Continuous Coordinate Charts**
   - Implement `MoulLineChart` (`moul-line-chart`) and `MoulAreaChart` (`moul-area-chart`).
   - Iteration loop and gate verification.
3. **Milestone 3: Discrete & Categorical Charts**
   - Implement `MoulBarChart` (`moul-bar-chart`), `MoulDoughnutChart` (`moul-doughnut-chart`), and `MoulTopList` (`moul-top-list`).
   - Iteration loop and gate verification.
4. **Milestone 4: Companion & Micro Indicators**
   - Implement `MoulStat` (`moul-stat`), `MoulPercentageBar` (`moul-percentage-bar`), and `MoulPercentageCircle` (`moul-percentage-circle`).
   - Iteration loop and gate verification.
5. **Milestone 5: Integration, Barrel Exports & Verification Suite**
   - Update `ui/src/index.ts`, author `ui/src/components/Charts.test.ts` (all 11 test suites).
   - Execute verification: `bun run test ui/src/components/Charts.test.ts`, `bun run lint`, `bun ./scripts/verify-no-react.ts all`.
   - Final audit and handoff.
