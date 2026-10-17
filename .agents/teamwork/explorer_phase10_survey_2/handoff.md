# Survey Report — Legacy React Purge & Lit Sandbox Architecture

## 1. Observation

### 1.1 Status of the 8 Legacy React Files Scheduled for Deletion

A direct inspection of the repository confirmed the existence and size of all 8 files explicitly scheduled for deletion in Phase 10:

| Path | Size (Bytes) | Nature / Content Summary |
|---|---|---|
| `ui/src/App.tsx` | 15,172 | Legacy React sandbox app importing `@stylexjs/stylex`, `react`, and `ui/src/sandbox/sections/*`. |
| `ui/src/main.tsx` | 329 | Legacy React DOM entry mounting `<App />` with `createRoot`. |
| `ui/src/theme/ThemeProvider.tsx` | 1,448 | Legacy React `ThemeProvider` component managing color scheme classes. |
| `ui/src/tokens/tokens.stylex.ts` | 11,974 | Legacy StyleX design token definitions (`defineVars`). |
| `ui/src/theme/ThemeProvider.test.tsx` | 2,538 | Legacy React test suite using `@testing-library/react`. |
| `ui/src/utils/utils.test.tsx` | 3,584 | Legacy React test suite testing React `warnMissingLabel` & `mergeProps`. |
| `ui/src/components/Autocomplete/Autocomplete.test.tsx` | 10,709 | Legacy React test suite for React Aria Autocomplete. |
| `ui/src/components/ListBox/ListBox.test.tsx` | 8,582 | Legacy React test suite for React Aria ListBox. |

### 1.2 References and Import Chains for the 8 Scheduled Files

A full ripgrep pattern search across the workspace revealed:

1. **`ui/src/App.tsx`**:
   - `ui/src/main.tsx:4`: `import App from './App.tsx'`
   - Mentioned only in documentation / root agent guidelines (`AGENTS.md:19`, `docs/public/AGENTS.md:23`, `rdt/tasks.md:208`).
   - No Lit Web Component imports `App.tsx`.

2. **`ui/src/main.tsx`**:
   - `ui/index.html:14`: `<script type="module" src="/src/main.tsx"></script>`
   - Mentioned in doc notes (`docs/public/AGENTS.md:23`, `ui/README.md:49`, `docs/content/docs/index.mdx:60`, etc.).
   - No code file imports `main.tsx`.

3. **`ui/src/theme/ThemeProvider.tsx`**:
   - `ui/src/theme/ThemeProvider.test.tsx:6`: `import { ThemeProvider } from './ThemeProvider'`
   - `ui/src/App.tsx:23`: `import { ThemeProvider } from './index'`
   - Note: `ThemeProvider` is **not** exported in `ui/src/index.ts`. No Web Component references it.

4. **`ui/src/tokens/tokens.stylex.ts`**:
   - `ui/src/App.tsx:48`: `import { tokens } from './tokens/tokens.stylex'`
   - `ui/src/theme/ThemeProvider.test.tsx:5`: `import { tokens } from '../tokens/tokens.stylex'`
   - `ui/src/sandbox/sections/*.tsx`: 8 section files import `tokens` from `tokens.stylex`
   - Legacy component style files (`FieldError.styles.ts`, `Autocomplete.styles.ts`, `DateField.styles.ts`, `Description.styles.ts`, `Label.styles.ts`, `ErrorMessage.styles.ts`, `ListBox.styles.ts`).
   - Script template: `scripts/gen-component.ts:211`.
   - **Crucial observation**: `ui/src/tokens/tokens.test.ts` (the Vitest suite for tokens) does **not** import `tokens.stylex.ts`. It directly tests `ui/src/styles/style.css`! Deleting `tokens.stylex.ts` has zero negative impact on `tokens.test.ts`.

5. **`ui/src/theme/ThemeProvider.test.tsx`**, **`ui/src/utils/utils.test.tsx`**, **`ui/src/components/Autocomplete/Autocomplete.test.tsx`**, and **`ui/src/components/ListBox/ListBox.test.tsx`**:
   - No files import these test files.
   - Vitest execution (`bun --cwd ui test`) confirmed:
     ```
     Test Files  4 failed | 32 passed (36)
     Tests       936 passed (936)
     ```
     The **only 4 failures out of 36 suites** are these 4 legacy test files! They fail because `banReactImportsPlugin` detects `react` and `react/jsx-dev-runtime`.
     Deleting these 4 files immediately allows `bun run test` to pass with **100% success** (32/32 suites, 936/936 tests).

### 1.3 Discovery of Additional Legacy React Files in `ui/src/`

Our comprehensive survey discovered an additional set of legacy React files that were not converted to Lit (or are obsolete remnants from before Phase 1):

1. **`ui/src/sandbox/`**:
   - `icons.tsx` (5,241 bytes)
   - `types.ts` (270 bytes)
   - `sections/ActionsSection.tsx` (7,751 bytes)
   - `sections/BlocksSection.tsx` (3,237 bytes)
   - `sections/ChartsSection.tsx` (6,822 bytes)
   - `sections/FeedbackSection.tsx` (12,433 bytes)
   - `sections/FormsSection.tsx` (33,389 bytes)
   - `sections/LayoutSection.tsx` (5,441 bytes)
   - `sections/NavigationSection.tsx` (8,954 bytes)
   - `sections/OverlaysSection.tsx` (9,686 bytes)
   *These were only imported by `ui/src/App.tsx`. Because `ui/tsconfig.app.json` includes `src`, keeping them triggers TypeScript compilation errors (`tsc -b`).*

2. **Legacy Component Remnants**:
   - `ui/src/components/Autocomplete/` (`Autocomplete.tsx`, `Autocomplete.styles.ts`, `index.ts`)
   - `ui/src/components/ListBox/` (`ListBox.tsx`, `ListBox.styles.ts`, `index.ts`)
   - `ui/src/components/DateField/` (`DateField.tsx`, `DateField.styles.ts`, `index.ts`)
   - `ui/src/components/Description/` (`Description.tsx`, `Description.styles.ts`, `index.ts`)
   - `ui/src/components/ErrorMessage/` (`ErrorMessage.tsx`, `ErrorMessage.styles.ts`, `index.ts`)
   - `ui/src/components/FieldError/` (`FieldError.tsx`, `FieldError.styles.ts`, `index.ts`)
   - `ui/src/components/Label/` (`Label.tsx`, `Label.styles.ts`, `index.ts`)
   *Note*: In `ui/src/index.ts`, `Autocomplete` (lines 16–38), `Description` (lines 124–125), and `Label` (lines 158–159) are still exported. In Lit, `ComboBox` replaces `Autocomplete`, and form inputs encapsulate labels/descriptions/errors.

3. **Legacy Utilities**:
   - `ui/src/utils/mergeProps.ts` (imports `react-aria`)
   - `ui/src/utils/warnMissingLabel.ts` (React version; the Lit version is `warn-missing-label.ts`)

### 1.4 Current `ui/index.html` and Sandbox Dev Server Setup

- `ui/index.html` currently contains:
  ```html
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
  ```
- It loads Google Sans from Google Fonts, but does **not** link `ui/src/styles/style.css` (the design token layer).
- In `package.json`: `"dev": "vite"` launches Vite in the `ui` directory.
- In workspace root `package.json`: `"dev:ui": "bun --cwd ui dev"`.
- When running `bun run dev:ui`, Vite serves `ui/index.html`. Because `main.tsx` attempts to load React, `banReactImportsPlugin` would throw a fatal error during dev.

### 1.5 Missing Chart Type Imports in `ui/src/index.ts`

`tsc -b` identified missing type imports in `ui/src/index.ts:542–551`:
`HTMLElementTagNameMap` defines entries for `moul-chart-container`, `moul-chart-tooltip`, `moul-line-chart`, `moul-area-chart`, `moul-bar-chart`, `moul-doughnut-chart`, `moul-top-list`, `moul-stat`, `moul-percentage-bar`, `moul-percentage-circle`, but their corresponding `import type { ... }` statements were omitted in lines 412–475 of `ui/src/index.ts`.

---

## 2. Logic Chain

1. **Safety of Deleting Scheduled Files**:
   - `App.tsx` and `main.tsx` are only needed for the legacy React dev server sandbox. Replacing them with `ui/src/sandbox.ts` and updating `ui/index.html` completely eliminates any runtime need for them.
   - `ThemeProvider.tsx` is not exported by `ui/src/index.ts`. Theme switching in `@moul-dev/ui` is natively handled by CSS custom properties and `data-theme="light" | "dark"` via `ui/src/styles/style.css`.
   - `tokens.stylex.ts` has been replaced by the native CSS tokens in `ui/src/styles/style.css` (Phase 2). `Tokens.test.ts` reads `style.css` directly and does not touch `tokens.stylex.ts`.
   - The 4 test files (`ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, `ListBox.test.tsx`) are the exact and only test files failing Vitest. Deleting them turns `bun run test` into 100% green.

2. **Necessity of Purging Unscheduled Legacy Files**:
   - `ui/tsconfig.app.json` includes `src`. If `src/sandbox/sections/*.tsx`, `src/components/Autocomplete/`, `src/components/ListBox/`, `src/components/DateField/`, etc., remain in the tree, `bun run --cwd ui tsc -b` checks them and throws hundreds of compilation errors.
   - Deleting or cleaning these legacy files ensures a clean build of `dist/src/index.d.ts` and allows `bun run build:ui` to succeed.
   - `ui/src/index.ts` must remove legacy exports for `Autocomplete`, `Description`, and `Label`.

3. **Pure Vanilla HTML / Lit Sandbox Architecture**:
   - **`ui/index.html`**:
     - Replace `<div id="root"></div>` with `<moul-sandbox></moul-sandbox>` (or a container `<div id="app"></div>`).
     - Add `<link rel="stylesheet" href="/src/styles/style.css" />` to load all OKLCH design tokens.
     - Change `<script type="module" src="/src/main.tsx"></script>` to `<script type="module" src="/src/sandbox.ts"></script>`.
   - **`ui/src/sandbox.ts`**:
     - Import `./index.ts` (this registers all 54 `moul-*` custom elements idempotently via `defineElement`).
     - Import `./styles/style.css`.
     - Define a root LitElement `<moul-sandbox>` using `<moul-sidebar>` as the top-level application layout:
       - **Sidebar Aside**:
         - Header with brand title and version badge.
         - Category items:
           1. All Components (`all`)
           2. Actions (`actions`)
           3. Surfaces & Feedback (`surfaces`)
           4. Overlays & Navigation (`overlays`)
           5. Forms & Inputs (`forms`)
           6. Charts & Analytics (`charts`)
           7. Composite Blocks (`blocks`)
         - Footer with theme toggle (`light` / `dark`) setting `document.documentElement.dataset.theme`.
       - **Sidebar Main**:
         - Toolbar with search filter and quick actions (e.g. `toastQueue.add`).
         - Responsive showcase cards for each of the 6 categories demonstrating interactive states (e.g., modals, form submissions, D3 continuous charts, streaming logs).

---

## 3. Caveats

1. **Documentation References**:
   - `docs/content/` and `docs/public/` contain markdown references mentioning `ThemeProvider` and `tokens.stylex`. As this is outside the `ui/` component library package and covered under separate docs tasks, those documentation files do not block `bun run build:ui` or `bun run test`.
2. **Component Scaffolding Script**:
   - `scripts/gen-component.ts` has legacy templates referencing `tokens.stylex` and `@stylexjs/stylex`. This script is developer tooling and does not affect the library build or test suite.
3. **Unscheduled Legacy Files**:
   - While the user request explicitly listed 8 files, the orchestrator and implementer should decide whether to delete all remnants in `ui/src/components/Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`, and `ui/src/sandbox/`, or exclude them from `tsconfig.app.json`. Deleting them is the cleanest, purest approach.

---

## 4. Conclusion

1. **Legacy Files to Delete Immediately**:
   - `ui/src/App.tsx`
   - `ui/src/main.tsx`
   - `ui/src/theme/ThemeProvider.tsx`
   - `ui/src/tokens/tokens.stylex.ts`
   - `ui/src/theme/ThemeProvider.test.tsx`
   - `ui/src/utils/utils.test.tsx`
   - `ui/src/components/Autocomplete/Autocomplete.test.tsx`
   - `ui/src/components/ListBox/ListBox.test.tsx`
   - *Recommended additional deletions*: `ui/src/sandbox/` directory, `ui/src/utils/mergeProps.ts`, `ui/src/utils/warnMissingLabel.ts`, and legacy directories `Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`.

2. **`ui/index.html` Update**:
   - Link `/src/styles/style.css`.
   - Update script source to `/src/sandbox.ts`.
   - Mount `<moul-sandbox></moul-sandbox>`.

3. **`ui/src/sandbox.ts` Architecture**:
   - Pure Lit Web Component (`MoulSandbox`) utilizing `<moul-sidebar>`, `<moul-card>`, and interactive component showcases across all 6 categories.
   - Zero React dependencies or imports.

4. **`ui/src/index.ts` Fixes Required**:
   - Remove legacy React exports (`Autocomplete`, `Description`, `Label`).
   - Add missing `import type` definitions for the 10 chart components before `declare global`.

---

## 5. Verification Method

1. **Verify No React Dependencies or Imports**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
2. **Verify Test Suite**:
   ```bash
   bun --cwd ui test
   ```
   *Expected*: 32+ passed suites, 0 failed.
3. **Verify TypeScript Compilation**:
   ```bash
   bun run --cwd ui tsc -b
   ```
   *Expected*: Code 0, zero diagnostic errors.
4. **Verify Library Build**:
   ```bash
   bun run build:ui
   ```
   *Expected*: Emits `dist/moul-ui.js`, `dist/assets/style.css`, `dist/src/index.d.ts`, and `dist/custom-elements.json`.
5. **Verify Dev Server**:
   ```bash
   bun run dev:ui
   ```
   *Expected*: Vite dev server starts without prohibited import errors and displays the interactive Lit kitchen sink.
