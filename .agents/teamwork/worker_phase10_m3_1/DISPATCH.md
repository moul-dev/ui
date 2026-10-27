# Dispatch: worker_phase10_m3_1

## Objective
Implement Milestone 3 of Phase 10:
1. Update `ui/custom-elements-manifest.config.mjs` using the tested drop-in AST plugin from `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_1/proposed-cem.config.mjs`.
2. Install `ui/src/components/Foundation.test.ts` using the code from `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2/proposed_Foundation.test.ts`.
3. Restore `ui/package.json` line 10 to `"customElements": "dist/custom-elements.json"` (reverting the survey 3 test path).
4. In `ui/vite.config.ts` line 66, cast `dts({ tsconfigPath: './tsconfig.app.json' }) as any` to fix the PostCSS/Vite version conflict in `tsconfig.node.json`.
5. In `ui/tsconfig.json`, remove `{"path": "./tsconfig.test.json"}` from `references` so `tsc -b` cleanly builds library core (`tsconfig.app.json`) and tooling (`tsconfig.node.json`). Test suites are executed and verified via Vitest (`bun run test`).
6. Execute the full library build pipeline `bun run build:ui` and verify:
   - Typecheck passes (`tsc -b`).
   - Vite build succeeds emitting `dist/moul-ui.js` starting with `"use client";`.
   - `dist/assets/style.css` is generated with `:root` tokens.
   - `dist/src/index.d.ts` is emitted with all 77 custom elements in `HTMLElementTagNameMap`.
   - `dist/custom-elements.json` is generated, contains all 77 elements, and 0 custom elements have missing `tagName`.
7. Synchronize root manifest: `cp ui/dist/custom-elements.json dist/custom-elements.json`.
8. Run full test suite: `bun run test` (all 34 test suites pass, 0 failed).
9. Run lint & format: `bun run lint` (0 errors).
10. Run zero-React verification: `bun ./scripts/verify-no-react.ts all`.

## Write Ownership
You exclusively own and may edit:
- `ui/custom-elements-manifest.config.mjs`
- `ui/src/components/Foundation.test.ts`
- `ui/package.json`
- `ui/vite.config.ts`
- `ui/tsconfig.json`
- `dist/custom-elements.json` (via copy from `ui/dist/custom-elements.json`)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m3_1/handoff.md` and message the orchestrator when complete.

## 2026-10-17T14:02:40Z
[Message] timestamp=2026-10-17T14:02:40Z sender=dae9e90c-c048-4fc8-8e06-169a5a42bbad priority=MESSAGE_PRIORITY_HIGH content=You are worker_phase10_m3_1, a teamwork_preview_worker.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m3_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m3_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

You exclusively own:
- ui/custom-elements-manifest.config.mjs
- ui/src/components/Foundation.test.ts
- ui/package.json
- ui/vite.config.ts
- ui/tsconfig.json
- dist/custom-elements.json

Your tasks:
1. Update ui/custom-elements-manifest.config.mjs with the AST plugin from /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_1/proposed-cem.config.mjs.
2. Install ui/src/components/Foundation.test.ts from /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2/proposed_Foundation.test.ts.
3. Revert ui/package.json line 10 to "customElements": "dist/custom-elements.json".
4. In ui/vite.config.ts line 66, cast dts({ tsconfigPath: './tsconfig.app.json' }) as any.
5. In ui/tsconfig.json, remove {"path": "./tsconfig.test.json"} from references.
6. Run bun run build:ui and verify:
   - verify-no-react passes.
   - tsc -b passes.
   - vite build passes emitting dist/moul-ui.js (starts with "use client";), dist/assets/style.css, dist/src/index.d.ts.
   - cem analyze outputs dist/custom-elements.json with all 77 components having valid tagName.
7. Copy ui/dist/custom-elements.json to dist/custom-elements.json at monorepo root.
8. Run bun run test and confirm all 34 test files pass (100% pass rate).
9. Run bun run lint and confirm 0 errors.
10. Run bun ./scripts/verify-no-react.ts all and confirm 0 errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m3_1/handoff.md and message the orchestrator when complete.
