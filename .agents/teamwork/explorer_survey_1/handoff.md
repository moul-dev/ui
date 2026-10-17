# Handoff Report: Monorepo Survey & Disallowed Dependency Audit

**Author**: explorer_survey_1 (teamwork_preview_explorer)  
**Date**: 2026-10-16T03:16:00Z  
**Type**: Hard Handoff  
**Subject**: Comprehensive survey of package manifests, Vite build configuration, test harness, and tooling scripts in `@moul-dev/ui` monorepo ahead of Phase 1 and Phase 2 rebuild.

---

## 1. Observation

Direct observations from inspecting codebase files, manifests, and build configs:

### 1.1 Disallowed Dependencies in Manifests
Per `rdt/requirements.md` (Req 1.1, 1.2, 1.7) and `rdt/design.md` (Section 2.1), the following banned dependencies are currently present:

#### In `ui/package.json` (`/Users/phearak/github/orgs/moul-dev/ui/ui/package.json`):
- **`peerDependencies`** (Lines 73–77):
  ```json
  "peerDependencies": {
    "@stylexjs/stylex": "^0.19.0",
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
  ```
- **`dependencies`** (Lines 78–86):
  - `@phosphor-icons/react`: `"^2.1.10"` (Line 79) — violates `/^react-/` and React icon rule
  - `@stylexjs/stylex`: `"^0.19.0"` (Line 80) — violates StyleX rule
  - `input-otp`: `"^1.4.2"` (Line 81) — violates React input-otp rule
  - `react-aria`: `"^3.50.0"` (Line 83) — violates `react-aria` rule
  - `react-aria-components`: `"^1.19.0"` (Line 84) — violates `react-aria-components` rule
  - `recharts`: `"^3.9.2"` (Line 85) — violates `recharts` rule
- **`devDependencies`** (Lines 87–106):
  - `@stylexjs/unplugin`: `"^0.19.0"` (Line 89) — violates StyleX rule
  - `@testing-library/jest-dom`: `"^6.6.3"` (Line 90) — unneeded legacy React DOM testing helper
  - `@testing-library/react`: `"^16.1.0"` (Line 91) — violates React testing rule
  - `@types/react`: `"^19.2.14"` (Line 93) — violates `@types/react` rule
  - `@types/react-dom`: `"^19.2.3"` (Line 94) — violates `@types/react-dom` rule
  - `@vitejs/plugin-react`: `"^6.0.1"` (Line 95) — violates `@vitejs/plugin-react` rule
  - `jsdom`: `"^25.0.1"` (Line 98) — should be replaced by `happy-dom`
  - `lightningcss`: `"^1.33.0"` (Line 99) — legacy StyleX unplugin dependency
  - `react`: `"^19.2.6"` (Line 100) — violates `react` rule
  - `react-dom`: `"^19.2.6"` (Line 101) — violates `react-dom` rule

#### Missing Required Dependencies in `ui/package.json`:
- `dependencies`: `lit` (`^3.2.1`), `@lit/context` (`^1.1.3`), `@lit-labs/virtualizer` (`^2.1.0`), `d3-scale` (`^4.0.2`), `d3-shape` (`^3.2.0`). (Note: `motion`: `"^13.4.1"` is already installed).
- `devDependencies`: `@custom-elements-manifest/analyzer` (`^0.10.4`), `@open-wc/testing-helpers` (`^2.2.0`), `happy-dom` (`^16.8.1`), `@types/d3-scale` (`^4.0.8`), `@types/d3-shape` (`^3.1.6`).

#### In `docs/package.json` (`/Users/phearak/github/orgs/moul-dev/ui/docs/package.json`):
- **`dependencies`** (Lines 16–37):
  - `@stylexjs/stylex`: `"^0.19.0"` (Line 18)
  - `fumadocs-core`: `"16.10.5"` (Line 19)
  - `fumadocs-mdx`: `"15.0.12"` (Line 20)
  - `fumadocs-ui`: `"16.10.5"` (Line 21)
  - `lucide-react`: `"^1.20.0"` (Line 22)
  - `react`: `"^19.2.7"` (Line 23)
  - `react-aria-components`: `"^1.19.0"` (Line 24)
  - `react-dom`: `"^19.2.7"` (Line 25)
  - `react-server-dom-webpack`: `"^19.2.7"` (Line 26)
  - `waku`: `"1.0.0-beta.3"` (Line 28)
  - `@tanstack/react-pacer`: `"^0.23.0"` (Line 31)
  - `@tanstack/react-query`: `"^5.102.3"` (Line 32)
  - `@tanstack/react-store`: `"^0.11.1"` (Line 33)
  - `@tanstack/react-table`: `"^9.1.2"` (Line 34)
  - `@tanstack/react-virtual`: `"^3.14.10"` (Line 35)
  - Superfluous dependencies: `tailwind-merge` (`^3.6.0`), `zod` (`^4.4.3`), `@tanstack/pacer` (`^0.22.0`), `@tanstack/store` (`^0.11.1`).
- **`devDependencies`** (Lines 38–49):
  - `@types/react`: `"^19.2.17"` (Line 42)
  - `@types/react-dom`: `"^19.2.3"` (Line 43)
  - `@tailwindcss/vite` (`^4.3.1`), `@types/mdx` (`^2.0.14`), `tailwindcss` (`^4.3.1`), `vite` (`^8.0.16`).

---

### 1.2 `ui/package.json` Configuration and Exports Contract
Observed in `/Users/phearak/github/orgs/moul-dev/ui/ui/package.json`:
- **Current `exports`** (Lines 37–62):
  ```json
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "import": "./dist/moul-ui.js"
    },
    "./tokens": {
      "types": "./dist/src/tokens/tokens.stylex.d.ts",
      "import": "./dist/tokens.stylex.js"
    },
    "./tokens.stylex": {
      "types": "./dist/src/tokens/tokens.stylex.d.ts",
      "import": "./dist/tokens.stylex.js"
    },
    "./theme.css": {
      "style": "./dist/theme.css",
      "default": "./dist/theme.css"
    },
    "./style": {
      "style": "./dist/assets/stylex.css",
      "default": "./dist/assets/stylex.css"
    },
    "./style.css": {
      "style": "./dist/assets/stylex.css",
      "default": "./dist/assets/stylex.css"
    }
  }
  ```
  - `.` is missing `"default": "./dist/moul-ui.js"`.
  - `./tokens`, `./tokens.stylex`, `./theme.css`, and `./style` violate Requirement 16.3 & 16.6 and must be removed.
  - `./style.css` incorrectly resolves to `./dist/assets/stylex.css` instead of `./dist/assets/style.css` (Requirement 3.12, 16.2).
- **Other Package Manifest Fields**:
  - `description` (Line 4): `"Accessible, zero-runtime React component library built on React Aria and StyleX"` (Must be updated to Lit / Web Components).
  - `keywords` (Lines 27–36): Contains `"react"`, `"react-aria"`, `"stylex"`.
  - `customElements`: Missing. (Must be `"./dist/custom-elements.json"` per Requirement 2.7, Design 2.2).
  - `sideEffects`: Missing. (Must declare `["./dist/moul-ui.js", "./dist/assets/style.css"]`).
  - `scripts.build` (Line 65): `"tsc -b && vite build"` (Missing `verify-no-react.ts ui` guard and `cem analyze` step).

---

### 1.3 `ui/vite.config.ts` Setup & Missing Plugins
Observed in `/Users/phearak/github/orgs/moul-dev/ui/ui/vite.config.ts`:
- **Current Plugins**:
  - `stylex.vite(...)` using `@stylexjs/unplugin` (Lines 4, 68–75)
  - `react()` using `@vitejs/plugin-react` (Lines 5, 76)
  - `dts({ tsconfigPath: './tsconfig.app.json' })` (Lines 8, 77)
  - `preserveTokensStylexPlugin()` (Lines 11–58): Custom plugin transpiling `tokens.stylex.ts` and concatenating `theme.css` into `assets/stylex.css`.
- **Current `rollupOptions`**:
  - `external` (Lines 89–99): Explicitly externalizes `'react'`, `'react-dom'`, `'react/jsx-runtime'`, `'react-aria-components'`, `'@stylexjs/stylex'`, `'recharts'`, `'react-aria'`, `'input-otp'`.
  - `output.banner` (Lines 100–102): Single-quote wrapped string `"'use client';"`.
- **Missing Build Configurations & Plugins**:
  1. `banReactImportsPlugin`: Completely missing. A Rollup plugin hook (`resolveId` or `load`) is required to fail the build immediately if any import starts with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` (Req 1.5).
  2. CSS token emission plugin: Missing. A Rollup plugin hook (`closeBundle`) is required to copy `ui/src/styles/style.css` directly to `ui/dist/assets/style.css` preserving raw `light-dark()` OKLCH values without downleveling (Req 3.12).
  3. `custom-elements-manifest.config.mjs`: Completely missing from `ui/`.
  4. Test config within `vite.config.ts`: Configured with `environment: 'jsdom'` instead of `happy-dom` (Line 63).

---

### 1.4 Test Setup & Existing Test Files in `ui/`
Observed in `/Users/phearak/github/orgs/moul-dev/ui/ui/src/test-setup.ts`:
- Content is only 6 lines:
  ```ts
  import '@testing-library/jest-dom/vitest'
  if (typeof window !== 'undefined' && !Element.prototype.getAnimations) {
    Element.prototype.getAnimations = () => []
  }
  ```
- **Missing Shims**:
  1. `ElementInternals` shim: Missing `attachInternals()`, tracking form association via `closest('form')`, `setFormValue()`, `setValidity()`, `reportValidity()`, `validity`, and `validationMessage`.
  2. Native `<dialog>` shim: Missing `showModal()` with disconnected check (throwing `new DOMException('InvalidStateError')` when `!this.isConnected`), `close()`, and `close` event dispatch.
  3. Native Popover API shim: Missing `showPopover()`, `hidePopover()`, `togglePopover()`, and `toggle` event dispatch.
  4. Deterministic `ResizeObserver` mock: Missing controllable resize triggers at specific widths (`320px`, `600px`, `900px`, `1100px`, `1400px`).
- **Existing Test Files**:
  - 24 `.test.tsx` files in `ui/src/components/` and `ui/src/utils/` all depend on React, React Aria, and `@testing-library/react`.
  - `ui/src/tokens/tokens.test.ts` (lowercase) tests StyleX tokens against `tokens.stylex.ts`.
  - No Web Component Lit tests or property-based tests exist. Missing `ui/src/tokens/Tokens.test.ts` (Fast-Check 25 tone × variant property test) and `ui/src/controllers/Controllers.test.ts`.

---

### 1.5 Existing Tooling Scripts (`scripts/`) & Monorepo Config
Observed in `/Users/phearak/github/orgs/moul-dev/ui/scripts/`:
- `scripts/verify-no-react.ts`: **Does not exist**. Must be authored.
- `scripts/dev.ts`: Still launches `docs:waku` running `waku dev` (Line 44).
- `scripts/gen-component.ts`: Still generates React + StyleX `.tsx` components and React Aria wrappers (Lines 110–200).
- `scripts/sync-llms.ts`: Scans `ui/src/components/` directories for React component structures and `docs/content/docs/`.
- `scripts/bump-version.ts`: Uses `YYYY.M.PATCH` SemVer format instead of UTC `YYYY.M.D` CalVer, and mutates React/Waku documentation files.
- `biome.json`: Contains `"domains": { "react": "recommended" }` and `"useExhaustiveDependencies": "warn"`.
- `ui/tsconfig.app.json`: Still has `"jsx": "react-jsx"`.

---

## 2. Logic Chain

From the observations to the Phase 1 & 2 execution plan:

1. **Manifest Disallowed Dependency Purge (Task 1.2)**:
   - Observations 1.1 reveal 13 offending packages in `ui/package.json` across `peerDependencies`, `dependencies`, and `devDependencies`, and 17 offending packages in `docs/package.json`.
   - Purging `peerDependencies` entirely from `ui/package.json` eliminates consumer React peer dependency requirements.
   - Installing Lit 3, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, and devDependencies (`@custom-elements-manifest/analyzer`, `@open-wc/testing-helpers`, `happy-dom`, `fast-check`) brings `ui/package.json` into exact conformance with Design Section 2.2.
   - In `docs/package.json`, replacing Waku/Fumadocs with `astro`, `@astrojs/starlight`, `@phosphor-icons/web`, and `@moul-dev/ui` satisfies Requirement 13.11 and Design Section 2.3.

2. **Package Export Hardening (Task 1.2 & Req 16)**:
   - Observations 1.2 reveal 4 extraneous subpath exports (`./tokens`, `./tokens.stylex`, `./theme.css`, `./style`) and a misdirected `./style.css` mapping to `stylex.css`.
   - Pruning exports to strictly `.` and `./style.css` (mapping to `./dist/assets/style.css`) ensures node/bundler resolution rejects legacy React/StyleX entry points with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

3. **Dependency Guard CLI & Build Gate (Task 1.1 & 1.3)**:
   - Since `scripts/verify-no-react.ts` does not yet exist, creating it to inspect `ui/package.json` and `docs/package.json` will provide an automated verification barrier.
   - Adding `banReactImportsPlugin()` to `ui/vite.config.ts` prevents accidental re-introduction of React or `motion/react` imports during source compilation.
   - Replacing `preserveTokensStylexPlugin()` with a direct `closeBundle` copy of `ui/src/styles/style.css` ensures raw OKLCH tokens are emitted to `dist/assets/style.css`.

4. **Test Harness Modernization (Task 1.4)**:
   - Observations 1.4 show Vitest is using `jsdom` and `test-setup.ts` lacks all required Web Component and browser API shims.
   - Switching `environment: 'happy-dom'` in `ui/vite.config.ts` and authoring shims for `ElementInternals`, native `<dialog>` (including disconnected DOMException throw), Popover API, and deterministic `ResizeObserver` allows tests to run without browser rendering engines.

5. **Phase 2 Token Layer & Utilities (Tasks 2.1–2.4)**:
   - The token values in `ui/src/tokens/tokens.stylex.ts` provide the exact OKLCH values for Neutral, Primary, Error, Warning, and Success scales.
   - `ui/src/styles/style.css` can be generated directly using `:root` `color-scheme: light dark` and `light-dark(...)` syntax.
   - `semanticToneStyles` (25 combinations of 5 tones × 5 variants), `reset.styles.ts`, `define-element.ts`, `warn-missing-label.ts`, `focus-trap.ts`, `motion.ts`, and `icons.ts` can then be implemented and validated with `fast-check` property tests in `ui/src/tokens/Tokens.test.ts`.

---

## 3. Caveats

- **Scope Boundary**: As an Explorer agent, no files outside `.agents/teamwork/explorer_survey_1` were modified.
- **Component Source Files**: All 54 components in `ui/src/components/` currently remain React implementations. Full replacement of components occurs in subsequent phases (Phases 4–6). Phase 1 and 2 focus on foundation, package manifests, build config, test harness, CSS tokens, and core utilities.
- **`docs/` Astro Migration**: `docs/package.json` can be updated during Phase 1 to satisfy zero-React package rules, while the full Astro Starlight site authoring and page migration is scheduled for Phase 7 (Requirement 13).
- **Tooling Execution in Sandbox**: `bun` execution in restricted sandbox environments may encounter filesystem access limits (`CouldntReadCurrentDirectory`), requiring execution with standard privileges during build/test phases.

---

## 4. Conclusion

The repository is currently in its legacy React + StyleX state on git branch `lit`. The path to completing Phase 1 and Phase 2 is clear and well-defined:
1. **Manifests**: Purge 13 banned packages in `ui/package.json` and 17 banned packages in `docs/package.json`; configure strict exports (`.` and `./style.css`); add Lit 3, D3, CEM analyzer, and Happy DOM dependencies.
2. **Disallowed Guard**: Create `scripts/verify-no-react.ts` and add `banReactImportsPlugin` to `ui/vite.config.ts`.
3. **Build Config**: Reconfigure `ui/vite.config.ts` (remove StyleX/React plugins, set happy-dom, copy `style.css` on `closeBundle`, output `"use client";` banner) and add `ui/custom-elements-manifest.config.mjs`.
4. **Test Harness**: Implement `ui/src/test-setup.ts` with shims for `ElementInternals`, `<dialog>` (disconnected DOMException), Popover API, and `ResizeObserver`.
5. **Tokens & Utilities**: Port `ui/src/tokens/tokens.stylex.ts` to `ui/src/styles/style.css`, implement 25-combo `semantic-tones.ts`, `reset.styles.ts`, utilities in `ui/src/utils/`, and property tests in `ui/src/tokens/Tokens.test.ts`.

---

## 5. Verification Method

Once Phase 1 and 2 changes are applied by the implementer agents, verify independently using:

1. **Verify No React Dependencies**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected result*: Exits with status code 0.

2. **Verify Exports Contract**:
   Inspect `ui/package.json` to verify:
   - `exports` has only `.` and `./style.css`.
   - `./tokens`, `./tokens.stylex`, `./theme.css`, `./style` are absent.

3. **Verify Build Pipeline**:
   ```bash
   bun run build:ui
   ```
   *Expected result*:
   - Runs `verify-no-react.ts ui` -> exits 0.
   - Compiles library to `ui/dist/moul-ui.js` with `"use client";` banner.
   - Emits `ui/dist/assets/style.css` (copy of `ui/src/styles/style.css`).
   - Runs `cem analyze` and outputs `ui/dist/custom-elements.json`.

4. **Verify Test Harness & Property Tests**:
   ```bash
   bun --cwd ui test src/tokens/Tokens.test.ts
   ```
   *Expected result*: Vitest runs in `happy-dom` environment, passes all `:root` CSS custom property checks, and passes all `fast-check` runs for the 25 tone × variant combinations and invalid string fallbacks.

5. **Verify Biome Linting**:
   ```bash
   bun run lint
   ```
   *Expected result*: All files pass Biome formatting and linting rules.
