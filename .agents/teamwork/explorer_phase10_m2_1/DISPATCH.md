# Dispatch — Explorer M2.1

## Mission
Plan the complete legacy React purge for Milestone 2.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_1

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_2/handoff.md

## Scope & Tasks
1. Verify the exact list of all files/directories to delete:
   - 8 scheduled files: `ui/src/App.tsx`, `ui/src/main.tsx`, `ui/src/theme/ThemeProvider.tsx`, `ui/src/tokens/tokens.stylex.ts`, `ui/src/theme/ThemeProvider.test.tsx`, `ui/src/utils/utils.test.tsx`, `ui/src/components/Autocomplete/Autocomplete.test.tsx`, `ui/src/components/ListBox/ListBox.test.tsx`.
   - Remaining legacy files: `ui/src/sandbox/`, `ui/src/utils/mergeProps.ts`, `ui/src/utils/warnMissingLabel.ts`, and legacy directories `ui/src/components/Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`.
   - Scratch test files created during M1 challenge testing (e.g., `ui/src/components/challenger-m1-adversarial.test.ts`, `ui/src/components/m1-idempotency-challenge.test.ts`).
2. Verify that deleting them causes zero regressions to production Lit components or test suites.
3. Verify that `ui/package.json` has `"customElements": "dist/custom-elements.json"`.
4. Report detailed deletion plan and verification commands in `handoff.md`.

## 2026-10-17T13:23:10Z
sender=dae9e90c-c048-4fc8-8e06-169a5a42bbad priority=MESSAGE_PRIORITY_HIGH content=You are explorer_phase10_m2_1, a teamwork_preview_explorer.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

Your task:
1. Enumerate and verify all legacy React files and directories to delete:
   - 8 scheduled files: ui/src/App.tsx, ui/src/main.tsx, ui/src/theme/ThemeProvider.tsx, ui/src/tokens/tokens.stylex.ts, ui/src/theme/ThemeProvider.test.tsx, ui/src/utils/utils.test.tsx, ui/src/components/Autocomplete/Autocomplete.test.tsx, ui/src/components/ListBox/ListBox.test.tsx.
   - Additional legacy files: ui/src/sandbox/ directory, ui/src/utils/mergeProps.ts, ui/src/utils/warnMissingLabel.ts, and legacy directories ui/src/components/Autocomplete/, ListBox/, DateField/, Description/, ErrorMessage/, FieldError/, Label/.
   - Scratch test files in ui/src/components/ (challenger-m1-adversarial.test.ts, m1-idempotency-challenge.test.ts).
2. Check ui/package.json customElements field and ensure it is restored to dist/custom-elements.json.
3. Write your report in handoff.md and message the orchestrator.
