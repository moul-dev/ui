# Dispatch — Explorer M2.2

## Mission
Design and draft the pure Lit Web Components sandbox kitchen sink (`ui/src/sandbox.ts`) for Milestone 2.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/handoff.md

## Scope & Tasks
1. Design `ui/src/sandbox.ts` as a pure Lit custom element (`<moul-sandbox>`).
2. Utilize `<moul-sidebar>` as the application shell layout with navigation items for all categories:
   - Actions (`moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group`)
   - Surfaces & Feedback (`moul-card`, `moul-alert`, `moul-badge`, `moul-avatar`, `moul-table`, `moul-toast`, `toastQueue`)
   - Overlays & Navigation (`moul-modal`, `moul-popover`, `moul-tooltip`, `moul-tabs`, `moul-pagination`)
   - Forms & Inputs (`moul-text-field`, `moul-number-field`, `moul-select`, `moul-combobox`, `moul-switch`, `moul-slider`, `moul-date-picker`)
   - Charts & Analytics (`moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-stat`)
   - Composite Blocks (`moul-logs-viewer`, `moul-logs`, `moul-sidebar`)
3. Include an interactive theme toggle switching `document.documentElement.dataset.theme = 'light' | 'dark'`.
4. Ensure zero imports of React, JSX, or StyleX.
5. Provide complete, verified source code in `handoff.md`.


## 2026-10-17T13:23:10Z
You are explorer_phase10_m2_2, a teamwork_preview_explorer.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

Your task:
1. Design and draft pure Lit Web Components sandbox kitchen sink ui/src/sandbox.ts (<moul-sandbox>).
2. Showcase all 6 categories (Actions, Surfaces, Overlays, Forms, Charts, Blocks) using <moul-sidebar> as top-level layout.
3. Include theme toggle (light/dark) switching document.documentElement.dataset.theme.
4. Verify zero React/JSX dependencies.
5. Write complete verified source code in handoff.md and message the orchestrator.
