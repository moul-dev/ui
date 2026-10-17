# Context — Phase 8 (orchestrator_phase8_2)

- Workspace Root: `/Users/phearak/github/orgs/moul-dev/ui`
- Phase 8 Target: Rebuild Category 1 — Charts & Data Visualization in pure Lit 3 + D3 + motion.
- Components to rebuild/author:
  - Milestone 1: `moul-chart-container`, `moul-chart-tooltip`, `ChartCommon.ts` (DONE)
  - Milestone 2: `moul-line-chart`, `moul-area-chart` (Worker authored; verifying gate)
  - Milestone 3: `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list` (Next)
  - Milestone 4: `moul-stat`, `moul-percentage-bar`, `moul-percentage-circle`
  - Milestone 5: Full integration, `ui/src/index.ts` exports, comprehensive `Charts.test.ts`, lint & verify-no-react.
- Constraints: Zero React / StyleX / Recharts imports, pure CSS tokens with `--color-chart-1`..`--color-chart-8`, idempotent registration, full a11y & responsive support.
