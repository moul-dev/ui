# Context — Phase 8 Rebuild

## Monorepo State
- Framework: Lit 3 + D3 (`d3-scale`, `d3-shape`) + Motion (vanilla `motion`).
- Pure zero-React / zero-StyleX mandate.
- Test runner: Vitest + Happy-DOM (`ui/src/test-setup.ts`).
- Tokens: `--color-chart-1` through `--color-chart-8` in `ui/src/styles/style.css`.
- Controllers: `LayoutIndicatorController`, `NumberSpringController`, `OverlayPresenceController`, `PressController` in `ui/src/controllers/`.
- Idempotent element registration helper: `ui/src/utils/define-element.ts`.

## Survey Subagent Reports
- `spec_miner_survey_1`: `.agents/teamwork/spec_miner_survey_1/handoff.md` (Detailed 10-component specification matrix)
- `explorer_survey_2`: `.agents/teamwork/explorer_survey_2/handoff.md` (Codebase infrastructure & D3/motion/controllers analysis)
- `explorer_survey_3`: `.agents/teamwork/explorer_survey_3/handoff.md` (Testing architecture & 11 test suites specification)
