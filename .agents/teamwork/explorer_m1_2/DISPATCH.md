## 2026-10-16T03:18:33Z

You are an Explorer agent (teamwork_preview_explorer).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/PROJECT.md first.

Scope: Milestone 1 - Build Pipeline & CEM Analyzer Configuration
1. `ui/vite.config.ts`:
   - Remove `@stylexjs/unplugin` and `@vitejs/plugin-react`.
   - Build in library mode: entry `resolve(__dirname, 'src/index.ts')`, formats: `['es']`, fileName: `() => 'moul-ui.js'`.
   - Rollup output banner: `"use client";` as the first line of `dist/moul-ui.js`.
   - `banReactImportsPlugin()`: Rollup plugin with `resolveId(id, importer)` hook that rejects any module specifier starting with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` with a descriptive Error.
   - CSS token copying plugin: Rollup plugin with `closeBundle()` hook that copies `ui/src/styles/style.css` directly to `ui/dist/assets/style.css` (creating `dist/assets` if needed) without downleveling.
   - Vitest config in `vite.config.ts`: `environment: 'happy-dom'`, `setupFiles: ['./src/test-setup.ts']`.
2. `ui/custom-elements-manifest.config.mjs`:
   - Target CEM schema v2:
     ```js
     export default {
       globs: ['src/components/**/*.ts'],
       exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
       outdir: 'dist',
       litelement: true,
     }
     ```

Formulate a detailed, concrete implementation strategy and code plan for the worker.
Do NOT modify files outside your working directory. Write your report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_2/handoff.md`.
When done, send a message back to the orchestrator (conversation ID: d61b067a-65c4-48c0-9937-01779e27afa2).
