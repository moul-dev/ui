# BRIEFING — 2026-10-17T12:53:00Z

## Mission
Survey legacy React files to delete, current sandbox setup, and architecture for pure vanilla HTML/Lit sandbox.

## 🔒 My Identity
- Archetype: explorer
- Roles: [teamwork_preview_explorer]
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2
- Original parent: dae9e90c-c048-4fc8-8e06-169a5a42bbad
- Milestone: Phase 10 Survey 2 (Sandbox & Legacy Cleanup)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only on project source; only write reports and progress in agent's own directory

## Current Parent
- Conversation ID: dae9e90c-c048-4fc8-8e06-169a5a42bbad
- Updated: 2026-10-17T12:44:06Z

## Investigation State
- **Explored paths**:
  - `ui/src/App.tsx`, `ui/src/main.tsx`, `ui/src/theme/ThemeProvider.tsx`, `ui/src/tokens/tokens.stylex.ts`
  - `ui/src/theme/ThemeProvider.test.tsx`, `ui/src/utils/utils.test.tsx`, `ui/src/components/Autocomplete/Autocomplete.test.tsx`, `ui/src/components/ListBox/ListBox.test.tsx`
  - `ui/src/sandbox/` and sections
  - `ui/src/components/Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`
  - `ui/src/utils/mergeProps.ts`, `ui/src/utils/warnMissingLabel.ts`
  - `ui/index.html`, `ui/vite.config.ts`, `ui/package.json`
  - `ui/src/index.ts`
- **Key findings**:
  - All 8 scheduled legacy files exist and have no production Lit dependents.
  - The 4 legacy test files are the ONLY failing test suites in Vitest (32 pass, 4 fail); deleting them makes Vitest 100% green (936 tests).
  - Discovered additional unscheduled legacy React files (`ui/src/sandbox/`, `Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`, `mergeProps.ts`, `warnMissingLabel.ts`) that will cause `tsc -b` compilation failures unless deleted or cleaned.
  - `ui/index.html` requires linking `style.css` and loading `/src/sandbox.ts`.
  - Architecture for `ui/src/sandbox.ts` designed using Lit (`MoulSandbox` element with `<moul-sidebar>`) showcasing all 6 component categories.
  - Missing type imports in `ui/src/index.ts:542-551` for chart components identified.
- **Unexplored areas**: none within survey scope.

## Key Decisions Made
- Follow read-only explorer protocol and produce comprehensive handoff.md
- Document complete evidence chains and recommend deletion of both the 8 scheduled legacy files and additional legacy remnants.

## Artifact Index
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/DISPATCH.md — Dispatch instructions
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/BRIEFING.md — Situational awareness
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/progress.md — Liveness & status
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/handoff.md — 5-component handoff report
