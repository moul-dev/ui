# Dispatch — Worker M2.1

## Mission
Implement Milestone 2: Legacy React Purge & Pure Lit/HTML Kitchen Sink Sandbox Rebuild for @moul-dev/ui.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m2_1

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_1/handoff.md (Full deletion manifest)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2/handoff.md & proposed_sandbox.ts
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3/handoff.md (ui/index.html)

## Write Ownership
You exclusively own:
- `ui/index.html` (rebuild per explorer_phase10_m2_3)
- `ui/src/sandbox.ts` (rebuild per explorer_phase10_m2_2 / proposed_sandbox.ts)
- `ui/package.json` (ensure `"customElements": "dist/custom-elements.json"`)
- Deletion of legacy files and directories specified below.

## Tasks
1. **Purge Legacy Files & Remnants**:
   Delete:
   - `ui/src/App.tsx`
   - `ui/src/main.tsx`
   - `ui/src/theme/` (including `ThemeProvider.tsx`, `ThemeProvider.test.tsx`)
   - `ui/src/tokens/tokens.stylex.ts`
   - `ui/src/utils/utils.test.tsx`
   - `ui/src/utils/mergeProps.ts`
   - `ui/src/utils/warnMissingLabel.ts`
   - `ui/src/components/Autocomplete/`
   - `ui/src/components/ListBox/`
   - `ui/src/components/DateField/`
   - `ui/src/components/Description/`
   - `ui/src/components/ErrorMessage/`
   - `ui/src/components/FieldError/`
   - `ui/src/components/Label/`
   - `ui/src/sandbox/`
   - Scratch test files in `ui/src/components/`: `challenger-m1-adversarial.test.ts`, `m1-idempotency-challenge.test.ts`.

2. **Rebuild `ui/index.html`**:
   Apply the drop-in HTML from `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3/handoff.md`.

3. **Install Pure Lit Sandbox (`ui/src/sandbox.ts`)**:
   Install the complete source code from `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2/proposed_sandbox.ts`.

4. **Ensure Package Manifest Integrity**:
   Verify `ui/package.json` has `"customElements": "dist/custom-elements.json"`.

5. **Verify Formatting & Tests**:
   - Run `bunx @biomejs/biome check --write ui/index.html ui/src/sandbox.ts`.
   - Run `bun ./scripts/verify-no-react.ts all`.
   - Run `bun --cwd ui test` (expect 100% passing suites, 0 failed).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Report results in `handoff.md`.


## 2026-10-17T13:33:55Z
You are worker_phase10_m2_1, a teamwork_preview_worker.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m2_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m2_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

You exclusively own:
- ui/index.html
- ui/src/sandbox.ts
- ui/package.json (ensure customElements field is dist/custom-elements.json)
- Deleting the legacy files/directories specified in DISPATCH.md.

Tasks:
1. Delete all legacy React files, legacy component directories (Autocomplete, ListBox, DateField, Description, ErrorMessage, FieldError, Label), legacy utils (mergeProps.ts, warnMissingLabel.ts), legacy sandbox/ directory, legacy test files (ThemeProvider.test.tsx, utils.test.tsx, Autocomplete.test.tsx, ListBox.test.tsx), and temporary scratch tests in ui/src/components/.
2. Rebuild ui/index.html using the HTML from /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_3/handoff.md.
3. Install ui/src/sandbox.ts using the code from /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m2_2/proposed_sandbox.ts.
4. Verify ui/package.json has "customElements": "dist/custom-elements.json".
5. Run Biome formatting / check on ui/index.html and ui/src/sandbox.ts.
6. Run bun ./scripts/verify-no-react.ts all and bun --cwd ui test.
