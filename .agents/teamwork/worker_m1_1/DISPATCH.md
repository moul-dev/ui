## 2026-10-16T03:26:07Z
You are a Worker agent (teamwork_preview_worker).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m1_1
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/PROJECT.md before doing any work.

Read the detailed implementation plans provided by the explorers:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_1/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/handoff.md

You exclusively own and may edit the following files:
- scripts/verify-no-react.ts
- ui/package.json
- docs/package.json
- ui/vite.config.ts
- ui/custom-elements-manifest.config.mjs
- ui/src/test-setup.ts
(and you may run bun install to update bun.lock)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Tasks for Milestone 1:
1. Create `scripts/verify-no-react.ts`:
   - Inspects `dependencies`, `devDependencies`, `peerDependencies` of `ui/package.json` and `docs/package.json`.
   - Supports CLI targets: `all` (default), `ui`, `docs`.
   - Exits with code 1 and prints offending packages grouped by package.json and dependency section if any banned React, StyleX, Recharts, Waku, Fumadocs, etc. package is present.
   - Exits with code 0 if all clean.
   - Make it executable.
2. Update `ui/package.json`:
   - Purge all React, StyleX, Recharts, input-otp, peerDependencies.
   - Dependencies: `lit` (^3.2.1), `@lit/context` (^1.1.3), `@lit-labs/virtualizer` (^2.1.0), `d3-scale` (^4.0.2), `d3-shape` (^3.2.0), `motion` (^13.4.1).
   - DevDependencies: `@biomejs/biome` (^2.5.0), `@custom-elements-manifest/analyzer` (^0.10.4), `@open-wc/testing-helpers` (^2.2.0), `@types/d3-scale` (^4.0.8), `@types/d3-shape` (^3.1.6), `@types/node` (^24.12.3), `fast-check` (^3.23.2), `glob` (^11.0.0), `happy-dom` (^16.8.1), `typescript` (~6.0.2), `vite` (^8.0.12), `vite-plugin-dts` (^5.0.2), `vitest` (^2.1.8).
   - Exports: Strictly expose `.` (`types: ./dist/src/index.d.ts`, `import: ./dist/moul-ui.js`, `default: ./dist/moul-ui.js`) and `./style.css` (`style: ./dist/assets/style.css`, `default: ./dist/assets/style.css`). Delete `./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`.
   - Set `"customElements": "./dist/custom-elements.json"` and `"sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"]`.
   - Update scripts per explorer_m1_1 report.
3. Update `docs/package.json`:
   - Remove all React, Waku, Fumadocs packages.
   - Dependencies: `@astrojs/starlight` (^0.32.0), `@moul-dev/ui` (workspace:*), `@phosphor-icons/web` (^2.1.1), `astro` (^5.5.0), `sharp` (^0.33.5).
   - DevDependencies: `@biomejs/biome` (^2.5.0), `@types/node` (^25.9.3), `typescript` (^6.0.3).
4. Run `bun install` at workspace root to update lockfile and dependencies.
5. Verify `bun ./scripts/verify-no-react.ts all` exits with 0.
6. Update `ui/vite.config.ts`:
   - Configure library mode outputting `dist/moul-ui.js` with Rollup banner `"use client";`.
   - Implement `banReactImportsPlugin()` rejecting any import starting with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, `motion/react`.
   - Implement `copyCssTokensPlugin()` copying `ui/src/styles/style.css` to `ui/dist/assets/style.css` (safely checking if exists).
   - Set Vitest environment to `happy-dom` with `setupFiles: ['./src/test-setup.ts']`.
7. Create `ui/custom-elements-manifest.config.mjs` configured for schema v2 per explorer_m1_2 handoff.
8. Update `ui/src/test-setup.ts`:
   - Implement all 4 shims:
     a) `ElementInternals` shim (tracking form, setFormValue, setValidity with <=200 char truncation, reportValidity, validity, validationMessage).
     b) Native `<dialog>` shim (`showModal` throwing `new DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')` when disconnected per Req 6.10, `close` event).
     c) Popover API shim (`showPopover`, `hidePopover`, `togglePopover`, `beforetoggle`/`toggle` events, simulating `:popover-open`).
     d) Deterministic `ResizeObserver` controller (`window.__triggerResize(element, { width, height })`).
9. Run verification commands:
   - `bun ./scripts/verify-no-react.ts all`
   - Test test-setup shim behaviors.
10. Write complete handoff report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m1_1/handoff.md`.
When finished, send a message back to the orchestrator (conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2).
