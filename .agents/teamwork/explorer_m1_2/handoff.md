# Milestone 1 - Build Pipeline & CEM Analyzer Configuration Plan

## 1. Observation
1. **`ui/vite.config.ts` Current State** (`ui/vite.config.ts:1-106`):
   - Imports `@stylexjs/unplugin` (line 4) and `@vitejs/plugin-react` (line 5), both of which are banned under Requirement 1.1 and 1.5.
   - Imports `lightningcss` (line 6) and `typescript` (line 7), used exclusively by `preserveTokensStylexPlugin()` (lines 11-58) which emits legacy `tokens.stylex.js` and manipulates `stylex.css`.
   - Configures Vitest with `environment: 'jsdom'` (line 63).
   - Configures `build.lib` with `entry: { 'moul-ui': resolve(__dirname, 'src/index.ts') }` rather than single entry string with `fileName: () => 'moul-ui.js'`.
   - Lists legacy React packages in `rollupOptions.external` (lines 89-99: `react`, `react-dom`, `react/jsx-runtime`, `react-aria-components`, `@stylexjs/stylex`, `recharts`, etc.), preventing `banReactImportsPlugin` from intercepting and failing on these imports during bundle resolution.
2. **`ui/custom-elements-manifest.config.mjs` Current State**:
   - File does not exist yet (`find_by_name` returned 0 results for `*custom-elements-manifest*`).
3. **Specification & Acceptance Criteria** (`rdt/design.md:899-933`, `rdt/requirements.md:40-65, 300-334`, `ORIGINAL_REQUEST.md:33-37`):
   - Library mode must build `dist/moul-ui.js` with `"use client";` banner as the very first line of output.
   - `banReactImportsPlugin()` must reject any module specifier starting with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` with a descriptive Error.
   - CSS token copying plugin must copy `ui/src/styles/style.css` directly to `ui/dist/assets/style.css` during `closeBundle()` without downleveling `light-dark()` or `oklch()` functions.
   - Vitest config must specify `environment: 'happy-dom'` and `setupFiles: ['./src/test-setup.ts']`.
   - CEM Analyzer config (`ui/custom-elements-manifest.config.mjs`) must target CEM schema v2 with `globs: ['src/components/**/*.ts']`, `exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts']`, `outdir: 'dist'`, and `litelement: true`.

---

## 2. Logic Chain
1. **Elimination of React & StyleX Plugins**:
   - Because `@moul-dev/ui` is transitioning entirely to pure Lit 3 Web Components, `@vitejs/plugin-react` and `@stylexjs/unplugin` are dead code and prohibited by Requirement 1.1.
   - Removing them from `ui/vite.config.ts` prevents any React JSX transformation and eliminates StyleX compilation hooks.
   - Removing `preserveTokensStylexPlugin` eliminates the generation of `tokens.stylex.js` and `dist/theme.css`, adhering to the strict package exports contract where only `.` and `./style.css` exist (Requirement 16.1–16.3).

2. **Rollup Import Gate (`banReactImportsPlugin`)**:
   - Using Rollup's `resolveId(id, importer)` hook with `enforce: 'pre'` ensures the import check runs before any standard module resolution.
   - Checking whether `id` starts with any of `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` guarantees compile-time prevention of prohibited dependencies.
   - Throwing an `Error` inside `resolveId` causes Vite and Rollup builds to halt immediately with an informative error message citing the offending specifier and importer.
   - Removing `external: ['react', ...]` from `rollupOptions` is critical; if externalized, Rollup would bypass internal module resolution and fail to trigger the ban error on unwanted imports.

3. **CSS Token Copying without Downleveling (`copyCssTokensPlugin`)**:
   - Standard Vite CSS bundling passes CSS through LightningCSS or PostCSS, which can lower modern CSS functions like `light-dark(oklch(...))` into static fallback colors or CSS variables.
   - Using a Rollup plugin with `closeBundle()` that calls `fs.copyFileSync(src, dest)` bypasses Vite's CSS transformation pipeline entirely, preserving the exact raw syntax in `dist/assets/style.css` (Requirement 3.12).
   - Calling `fs.mkdirSync(outDir, { recursive: true })` ensures `dist/assets/` exists prior to copying. Guarding with `fs.existsSync(srcPath)` allows early build checks to succeed even before Phase 2 authors the full token file.

4. **Vitest `happy-dom` Configuration**:
   - Updating Vitest `test.environment` from `'jsdom'` to `'happy-dom'` aligns test execution with the Lit 3 test harness and Open-WC conventions (Requirement 11.1).
   - Keeping `globals: true` preserves Vitest global assertions (`describe`, `it`, `expect`) used across the test suite.

5. **CEM Analyzer Configuration**:
   - Creating `ui/custom-elements-manifest.config.mjs` with `globs: ['src/components/**/*.ts']`, `exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts']`, `outdir: 'dist'`, and `litelement: true` instructs `@custom-elements-manifest/analyzer` to output schema v2 manifest directly to `ui/dist/custom-elements.json` without cluttering the manifest with internal test or style modules.

---

## 3. Caveats
1. **Phase 2 Dependency**: `ui/src/styles/style.css` is authored in Milestone 2. The `copyCssTokensPlugin` handles this by checking `if (fs.existsSync(srcPath))` so builds in Milestone 1 do not fail with ENOENT if `style.css` does not exist yet.
2. **`ui/package.json` Coordination**: The companion worker (explorer 1) is updating `ui/package.json` to include `@custom-elements-manifest/analyzer` in `devDependencies` and the updated build script `tsc -b && vite build && cem analyze --config custom-elements-manifest.config.mjs`. The CEM config created here directly powers that analyze step.
3. **No External Imports Bypassing Plugin**: By omitting `rollupOptions.external` or only externalizing runtime peer dependencies if strictly needed, Rollup resolves all specifiers through `resolveId`, ensuring `banReactImportsPlugin` cannot be bypassed.

---

## 4. Conclusion & Concrete Implementation Plan

### File 1: `ui/vite.config.ts`
Replace the entire contents of `ui/vite.config.ts` with:

```ts
/// <reference types="vitest" />
import fs from 'node:fs'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig, type Plugin } from 'vitest/config'

const BANNED_IMPORT_PREFIXES = [
  'react',
  'react-dom',
  'react-aria',
  'react-aria-components',
  '@stylexjs/stylex',
  '@lit/react',
  'motion/react',
] as const

export function banReactImportsPlugin(): Plugin {
  return {
    name: 'ban-react-imports',
    enforce: 'pre',
    resolveId(id: string, importer?: string) {
      const isBanned = BANNED_IMPORT_PREFIXES.some(
        (prefix) =>
          id === prefix ||
          id.startsWith(`${prefix}/`) ||
          id.startsWith(`${prefix}-`) ||
          id.startsWith(prefix),
      )
      if (isBanned) {
        throw new Error(
          `[banReactImportsPlugin] Prohibited import detected: "${id}"${
            importer ? ` in "${importer}"` : ''
          }. React, StyleX, and React-adapter modules are forbidden in @moul-dev/ui.`,
        )
      }
      return null
    },
  }
}

export function copyCssTokensPlugin(): Plugin {
  return {
    name: 'copy-css-tokens',
    apply: 'build',
    closeBundle() {
      const srcPath = resolve(__dirname, 'src/styles/style.css')
      const outDir = resolve(__dirname, 'dist/assets')
      const destPath = resolve(outDir, 'style.css')

      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(outDir, { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    banReactImportsPlugin(),
    dts({ tsconfigPath: './tsconfig.app.json' }),
    copyCssTokensPlugin(),
  ],
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'moul-ui.js',
    },
    rollupOptions: {
      output: {
        banner: '"use client";',
      },
    },
  },
})
```

### File 2: `ui/custom-elements-manifest.config.mjs`
Create new file `ui/custom-elements-manifest.config.mjs` with:

```js
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
  outdir: 'dist',
  litelement: true,
}
```

---

## 5. Verification Method

### 1. Plugin Unit Behavior Verification
Verify that `banReactImportsPlugin()` immediately throws on prohibited specifiers and permits valid ones:
- In Node/Bun REPL or test harness:
  ```ts
  import { banReactImportsPlugin } from './ui/vite.config'
  const plugin = banReactImportsPlugin()
  const resolve = plugin.resolveId.bind(plugin)

  // Should throw Error:
  resolve('react')
  resolve('react-dom')
  resolve('react-aria')
  resolve('react-aria-components')
  resolve('@stylexjs/stylex')
  resolve('@lit/react')
  resolve('motion/react')

  // Should return null (allowed):
  console.assert(resolve('lit') === null)
  console.assert(resolve('@lit/context') === null)
  console.assert(resolve('@lit-labs/virtualizer') === null)
  console.assert(resolve('motion') === null)
  console.assert(resolve('d3-scale') === null)
  console.assert(resolve('./components/button/button.ts') === null)
  ```

### 2. Linting & Formatting Verification
Run:
```bash
bun x biome check ui/vite.config.ts ui/custom-elements-manifest.config.mjs
```
Must pass with 0 errors and adhere to single quotes and no unnecessary semicolons.

### 3. File & Rollup Output Verification
Run:
```bash
bun run --cwd ui build
```
Verify:
1. `ui/dist/moul-ui.js` starts with `"use client";` as the first line.
2. `ui/dist/assets/style.css` is present when `ui/src/styles/style.css` exists.
3. No React or StyleX imports are bundled.

### 4. CEM Configuration Syntax Verification
Run:
```bash
bun x @custom-elements-manifest/analyzer analyze --config ui/custom-elements-manifest.config.mjs
```
Validates that `@custom-elements-manifest/analyzer` successfully parses the configuration file.
