# Dispatch — Spec Miner M1.2

## Mission
Extract and verify the complete, exact `HTMLElementTagNameMap` declaration block for `ui/src/index.ts` covering all 77 custom elements.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_phase10_m1_2

## Authoritative Requirements & Context
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_1/handoff.md

## Scope & Tasks
1. Verify the list of all 77 `moul-*` custom element tag names registered across `ui/src/components/`.
2. Map each tag name to its exact LitElement class name (e.g. `'moul-line-chart': MoulLineChart`, `'moul-chart-container': MoulChartContainer`).
3. Verify the type imports block (preceding `declare global`) so that every class used in `HTMLElementTagNameMap` is imported with `import type { ... }` from its exact file path, fixing the 10 missing Chart type imports.
4. Report the exact, verified TypeScript snippet for the import block and `declare global { interface HTMLElementTagNameMap { ... } }` in `handoff.md`.


## 2026-10-17T12:58:30Z
You are spec_miner_phase10_m1_2, a teamwork_preview_spec_miner.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_phase10_m1_2.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_phase10_m1_2/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10).

Your tasks:
1. Verify the list of all 77 moul-* custom element tag names registered across ui/src/components/.
2. Map each tag name to its exact LitElement class name.
3. Verify the type imports block preceding declare global in ui/src/index.ts so that every class used in HTMLElementTagNameMap is imported with import type { ... }, fixing the 10 missing Chart type imports.
4. Report the exact, verified TypeScript snippet for the import block and declare global { interface HTMLElementTagNameMap { ... } } in /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_phase10_m1_2/handoff.md and message the orchestrator.
