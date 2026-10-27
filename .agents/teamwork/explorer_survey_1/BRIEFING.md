# BRIEFING — 2026-10-16T03:17:00Z

## Mission
Survey the current monorepo structure, package manifests, build config, scripts, and test setup to support Phase 1 & 2 rebuild planning.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_survey_1
- Original parent: d61b067a-65c4-48c0-9937-01779e27afa2
- Milestone: Phase 1 & 2 Monorepo Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any files outside working directory
- Produce structured 5-component handoff report

## Current Parent
- Conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `rdt/requirements.md`, `rdt/design.md`, `rdt/tasks.md`
  - `package.json`, `ui/package.json`, `docs/package.json`
  - `ui/vite.config.ts`, `ui/src/test-setup.ts`
  - `ui/src/tokens/tokens.stylex.ts`, `ui/src/styles/theme.css`
  - `scripts/dev.ts`, `scripts/gen-component.ts`, `scripts/sync-llms.ts`, `scripts/bump-version.ts`, `scripts/setup-hooks.ts`
  - `biome.json`, `ui/tsconfig.json`, `ui/tsconfig.app.json`, `docs/tsconfig.json`
- **Key findings**:
  - Found 13 banned dependencies across peer/regular/dev in `ui/package.json` and 17 banned dependencies in `docs/package.json`.
  - `ui/package.json` exposes 4 disallowed export subpaths (`./tokens`, `./tokens.stylex`, `./theme.css`, `./style`) and maps `./style.css` incorrectly to `stylex.css`.
  - `ui/vite.config.ts` currently uses React and StyleX plugins, lacks `banReactImportsPlugin`, lacks `closeBundle` copy for `style.css`, and runs tests in `jsdom`.
  - `ui/src/test-setup.ts` lacks shims for `ElementInternals`, `<dialog>` (disconnected DOMException), Popover API, and `ResizeObserver`.
  - `scripts/verify-no-react.ts` and `ui/custom-elements-manifest.config.mjs` are completely absent and must be created.
- **Unexplored areas**:
  - None within the survey scope.

## Key Decisions Made
- Completed read-only investigation and synthesized all observations into `handoff.md`.

## Artifact Index
- `DISPATCH.md` — Incoming dispatch log
- `BRIEFING.md` — Working memory and situational awareness
- `progress.md` — Liveness heartbeat and progress tracker
- `handoff.md` — 5-component handoff report
