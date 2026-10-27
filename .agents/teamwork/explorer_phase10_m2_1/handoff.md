# Handoff Report — Milestone 2 Legacy React Purge & Contract Verification

**Agent**: `explorer_phase10_m2_1`  
**Date**: 2026-10-17  
**Milestone**: Milestone 2 (Legacy React Purge & Sandbox Rebuild)  
**Parent Orchestrator**: `dae9e90c-c048-4fc8-8e06-169a5a42bbad`  

---

## 1. Observation

### 1.1 Status and Restoration of `ui/package.json` (`customElements`)

- **Direct Observation**:
  Inspection of `ui/package.json` revealed line 10 had been modified by a previous survey agent:
  ```json
  "customElements": ".agents/teamwork/explorer_phase10_survey_3/test-dist/custom-elements.json",
  ```
  `git diff ui/package.json` verbatim output:
  ```diff
  diff --git a/ui/package.json b/ui/package.json
  index a521471..e2f1a00 100644
  --- a/ui/package.json
  +++ b/ui/package.json
  @@ -7,7 +7,7 @@
     "main": "./dist/moul-ui.js",
     "module": "./dist/moul-ui.js",
     "types": "./dist/src/index.d.ts",
  -  "customElements": "dist/custom-elements.json",
  +  "customElements": ".agents/teamwork/explorer_phase10_survey_3/test-dist/custom-elements.json",
     "sideEffects": [
       "./dist/moul-ui.js",
       "./dist/assets/style.css"
  ```
- **Action Taken**:
  Restored `ui/package.json` to git HEAD via `git checkout ui/package.json`.
  `view_file` on `ui/package.json` lines 7–11 now confirms:
  ```json
  "main": "./dist/moul-ui.js",
  "module": "./dist/moul-ui.js",
  "types": "./dist/src/index.d.ts",
  "customElements": "dist/custom-elements.json",
  "sideEffects": [
  ```
  `git status -s` shows `ui/package.json` is clean and restored.

---

### 1.2 Exhaustive Enumeration of Files and Directories Scheduled for Deletion

A comprehensive filesystem and codebase survey identified exactly **43 legacy files** across **8 directories** that must be purged in Milestone 2:

#### Category A: The 8 Scheduled Legacy Files (Explicitly listed in user request & dispatch)
| # | File Path | Lines | Size (Bytes) | Role / Purpose |
|---|---|---|---|---|
| 1 | `ui/src/App.tsx` | 504 | 15,172 | Legacy React sandbox app importing `@stylexjs/stylex`, `react`, and `ui/src/sandbox/sections/*`. |
| 2 | `ui/src/main.tsx` | 10 | 329 | Legacy React DOM entry mounting `<App />` via `createRoot`. |
| 3 | `ui/src/theme/ThemeProvider.tsx` | 64 | 1,448 | Legacy React `ThemeProvider` component managing color scheme classes. |
| 4 | `ui/src/tokens/tokens.stylex.ts` | 404 | 11,974 | Legacy StyleX token definitions (`defineVars`). |
| 5 | `ui/src/theme/ThemeProvider.test.tsx` | 75 | 2,538 | Legacy React test suite using `@testing-library/react`. |
| 6 | `ui/src/utils/utils.test.tsx` | 106 | 3,584 | Legacy React test suite testing React `warnMissingLabel` & `mergeProps`. |
| 7 | `ui/src/components/Autocomplete/Autocomplete.test.tsx` | 288 | 10,709 | Legacy React test suite for React Aria Autocomplete. |
| 8 | `ui/src/components/ListBox/ListBox.test.tsx` | 281 | 8,582 | Legacy React test suite for React Aria ListBox. |

#### Category B: Additional Legacy Files and Directories
**1. Legacy Sandbox Directory (`ui/src/sandbox/`)**
| # | File Path | Lines | Size (Bytes) | Role / Purpose |
|---|---|---|---|---|
| 9 | `ui/src/sandbox/icons.tsx` | 189 | 5,241 | Legacy React SVG icons used only by `App.tsx`. |
| 10 | `ui/src/sandbox/types.ts` | 15 | 270 | Legacy TypeScript interfaces for React sandbox sections. |
| 11 | `ui/src/sandbox/sections/ActionsSection.tsx` | 241 | 7,751 | React sandbox section. |
| 12 | `ui/src/sandbox/sections/BlocksSection.tsx` | 115 | 3,237 | React sandbox section. |
| 13 | `ui/src/sandbox/sections/ChartsSection.tsx` | 215 | 6,822 | React sandbox section. |
| 14 | `ui/src/sandbox/sections/FeedbackSection.tsx` | 382 | 12,433 | React sandbox section. |
| 15 | `ui/src/sandbox/sections/FormsSection.tsx` | 993 | 33,389 | React sandbox section. |
| 16 | `ui/src/sandbox/sections/LayoutSection.tsx` | 178 | 5,441 | React sandbox section. |
| 17 | `ui/src/sandbox/sections/NavigationSection.tsx` | 284 | 8,954 | React sandbox section. |
| 18 | `ui/src/sandbox/sections/OverlaysSection.tsx` | 308 | 9,686 | React sandbox section. |

**2. Legacy Utilities (`ui/src/utils/`)**
| # | File Path | Lines | Size (Bytes) | Role / Purpose |
|---|---|---|---|---|
| 19 | `ui/src/utils/mergeProps.ts` | 1 | 40 | Re-exports `mergeProps` from `react-aria`. |
| 20 | `ui/src/utils/warnMissingLabel.ts` | 48 | 1,389 | Legacy React version. Lit components use `ui/src/utils/warn-missing-label.ts`. |

**3. Legacy Component Directories in `ui/src/components/` (Excluding test files listed above)**
| # | File Path | Lines | Size (Bytes) | Role / Purpose |
|---|---|---|---|---|
| 21 | `ui/src/components/Autocomplete/Autocomplete.styles.ts` | 104 | 2,968 | Legacy StyleX styles for Autocomplete. |
| 22 | `ui/src/components/Autocomplete/Autocomplete.tsx` | 429 | 15,317 | Legacy React Aria Autocomplete component. |
| 23 | `ui/src/components/Autocomplete/index.ts` | 47 | 1,235 | Legacy barrel export for Autocomplete. |
| 24 | `ui/src/components/ListBox/ListBox.styles.ts` | 119 | 3,397 | Legacy StyleX styles for ListBox. |
| 25 | `ui/src/components/ListBox/ListBox.tsx` | 384 | 13,101 | Legacy React Aria ListBox component. |
| 26 | `ui/src/components/ListBox/index.ts` | 22 | 608 | Legacy barrel export for ListBox. |
| 27 | `ui/src/components/DateField/DateField.styles.ts` | 73 | 2,019 | Legacy StyleX styles for DateField. |
| 28 | `ui/src/components/DateField/DateField.tsx` | 183 | 6,155 | Legacy React Aria DateField component. |
| 29 | `ui/src/components/DateField/index.ts` | 13 | 340 | Legacy barrel export for DateField. |
| 30 | `ui/src/components/Description/Description.styles.ts` | 32 | 926 | Legacy StyleX styles for Description. |
| 31 | `ui/src/components/Description/Description.tsx` | 47 | 1,595 | Legacy React Description component. |
| 32 | `ui/src/components/Description/index.ts` | 3 | 116 | Legacy barrel export for Description. |
| 33 | `ui/src/components/ErrorMessage/ErrorMessage.styles.ts` | 31 | 902 | Legacy StyleX styles for ErrorMessage. |
| 34 | `ui/src/components/ErrorMessage/ErrorMessage.tsx` | 47 | 1,585 | Legacy React ErrorMessage component. |
| 35 | `ui/src/components/ErrorMessage/index.ts` | 3 | 118 | Legacy barrel export for ErrorMessage. |
| 36 | `ui/src/components/FieldError/FieldError.styles.ts` | 31 | 913 | Legacy StyleX styles for FieldError. |
| 37 | `ui/src/components/FieldError/FieldError.tsx` | 44 | 1,498 | Legacy React FieldError component. |
| 38 | `ui/src/components/FieldError/index.ts` | 3 | 112 | Legacy barrel export for FieldError. |
| 39 | `ui/src/components/Label/Label.styles.ts` | 33 | 956 | Legacy StyleX styles for Label. |
| 40 | `ui/src/components/Label/Label.tsx` | 48 | 1,585 | Legacy React Label component. |
| 41 | `ui/src/components/Label/index.ts` | 3 | 98 | Legacy barrel export for Label. |

#### Category C: Scratch Test Files in `ui/src/components/`
| # | File Path | Lines | Size (Bytes) | Role / Purpose |
|---|---|---|---|---|
| 42 | `ui/src/components/challenger-m1-adversarial.test.ts` | 764 | 27,137 | Temporary scratch test suite created during Milestone 1 challenge testing. |
| 43 | `ui/src/components/m1-idempotency-challenge.test.ts` | 379 | 13,606 | Temporary scratch test suite created during Milestone 1 challenge testing. |

---

### 1.3 Dependency and Reference Analysis Across Active Components

A repository-wide ripgrep search was conducted for every scheduled file and legacy directory:

1. **`ui/src/index.ts` Public API**:
   - `Autocomplete`, `ListBox`, `DateField`, `Description`, `ErrorMessage`, `FieldError`, `Label`, and `ThemeProvider` have **0 occurrences** in `ui/src/index.ts`.
   - `ui/src/index.ts` exports strictly pure Lit Web Components, 5 reactive controllers, `toastQueue`, `generatePagination`, and pure log parsers.
2. **Lit Web Components (`ui/src/components/*`)**:
   - Zero Lit component imports from `tokens.stylex.ts`, `App.tsx`, `main.tsx`, `ThemeProvider.tsx`, or any legacy directory.
   - All Lit form controls (`moul-select`, `moul-combobox`, `moul-text-field`, etc.) encapsulate their own labels, descriptions, and error states internally within shadow DOM or use slotted content.
3. **Design Tokens & Test Suite (`ui/src/tokens/`)**:
   - `ui/src/tokens/tokens.test.ts` (Vitest suite) imports directly from `ui/src/styles/style.css` and `ui/src/styles/semantic-tones.ts`. It has **0 imports** from `tokens.stylex.ts`.
4. **Utilities (`ui/src/utils/`)**:
   - All Lit components import `warnMissingLabel` from `ui/src/utils/warn-missing-label.ts` (kebab-case).
   - `ui/src/utils/warnMissingLabel.ts` (camelCase) and `ui/src/utils/mergeProps.ts` are only imported by `ui/src/utils/utils.test.tsx` (which is scheduled for deletion).

---

### 1.4 Test Suite Baseline Verification (`bun run test`)

Running `bun --cwd ui test` (`vitest run`) in the current workspace yielded:
```
Test Files  4 failed | 34 passed (38)
     Tests  1003 passed (1003)
  Duration  14.48s
```
The **4 failed test suites** are exclusively the 4 legacy React test files:
1. `FAIL src/theme/ThemeProvider.test.tsx` — Prohibited import `"react/jsx-dev-runtime"` caught by `banReactImportsPlugin`.
2. `FAIL src/utils/utils.test.tsx` — Prohibited import `"react"` caught by `banReactImportsPlugin`.
3. `FAIL src/components/Autocomplete/Autocomplete.test.tsx` — Prohibited import `"react/jsx-dev-runtime"` caught by `banReactImportsPlugin`.
4. `FAIL src/components/ListBox/ListBox.test.tsx` — Prohibited import `"react/jsx-dev-runtime"` caught by `banReactImportsPlugin`.

Every other test suite (34 suites, 1,003 tests) passed completely.

---

## 2. Logic Chain

1. **Safety and Zero-Regression Guarantee**:
   - Because no production Lit component, controller, style sheet, or active test imports any of the 43 legacy files (Observation 1.3), deleting them will cause **zero broken imports or runtime regressions** in production code.
2. **Vitest Test Suite Health**:
   - The only failures currently preventing a 100% green test suite across the monorepo are the 4 legacy test suites (Observation 1.4).
   - Deleting `ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, and `ListBox.test.tsx` immediately eliminates all 4 failures, resulting in **100% passing test suites (0 failed)**.
3. **Scratch Test Files Purge**:
   - `challenger-m1-adversarial.test.ts` and `m1-idempotency-challenge.test.ts` are untracked scratch files created solely to validate Milestone 1. SCOPE.md Milestone 3 designates `ui/src/components/Foundation.test.ts` as the permanent contract test suite. Removing these two scratch files leaves `ui/src/components/` clean.
4. **TypeScript Build (`tsc -b`)**:
   - `ui/tsconfig.test.json` includes `src/**/*.test.tsx`, and `ui/tsconfig.app.json` includes `src`. The legacy React files cause hundreds of JSX/React typing errors because React dependencies have been removed. Deleting all 43 legacy files removes these sources of diagnostic failure.
5. **Sandbox Decoupling**:
   - `main.tsx` is only referenced in `ui/index.html`. Replacing `ui/index.html` with the pure Lit `<moul-sandbox>` host (designed by M2.3) and adding `ui/src/sandbox.ts` (designed by M2.2) completes the transition from React sandbox to Lit sandbox.
6. **Package Manifest Integrity**:
   - `ui/package.json` line 10 has been restored to `"customElements": "dist/custom-elements.json"` (Observation 1.1), ensuring the CEM analyzer output matches the package manifest.

---

## 3. Caveats

1. **`ui/index.html` Order of Operations**:
   - If `main.tsx` is deleted before `ui/src/sandbox.ts` is created and `ui/index.html` is updated, `bun run dev:ui` would briefly fail to resolve `/src/main.tsx`. The worker should execute the deletions and create `ui/src/sandbox.ts` / update `ui/index.html` together in Milestone 2.
2. **Developer Tooling Script (`scripts/gen-component.ts`)**:
   - Line 211 of `scripts/gen-component.ts` contains a string template referencing `tokens.stylex`. This file is an internal code-generation utility and does not affect the library build, Vite bundle, or test execution.
3. **Empty Theme Directory**:
   - After deleting `ThemeProvider.tsx` and `ThemeProvider.test.tsx`, `ui/src/theme/` contains only `.gitkeep`. It can either be deleted or kept with `.gitkeep` without affecting builds or tests.

---

## 4. Conclusion

1. **Restoration Confirmed**:
   - `ui/package.json` `customElements` field is verified restored to `"dist/custom-elements.json"`.
2. **Actionable Deletion Plan**:
   - The implementer worker can cleanly execute the deletion of all 43 legacy files and 8 directories using the command sequence below.
3. **Regression Assessment**:
   - Deleting these files causes **zero regressions** to the Lit component library and elevates the test pass rate to **100%**.

### Deletion Script for Milestone 2 Worker
```bash
# 1. Purge 8 scheduled legacy files
rm -f ui/src/App.tsx \
      ui/src/main.tsx \
      ui/src/theme/ThemeProvider.tsx \
      ui/src/tokens/tokens.stylex.ts \
      ui/src/theme/ThemeProvider.test.tsx \
      ui/src/utils/utils.test.tsx \
      ui/src/components/Autocomplete/Autocomplete.test.tsx \
      ui/src/components/ListBox/ListBox.test.tsx

# 2. Purge legacy sandbox directory
rm -rf ui/src/sandbox/

# 3. Purge legacy utilities
rm -f ui/src/utils/mergeProps.ts \
      ui/src/utils/warnMissingLabel.ts

# 4. Purge legacy component directories
rm -rf ui/src/components/Autocomplete/ \
       ui/src/components/ListBox/ \
       ui/src/components/DateField/ \
       ui/src/components/Description/ \
       ui/src/components/ErrorMessage/ \
       ui/src/components/FieldError/ \
       ui/src/components/Label/

# 5. Purge scratch challenge test files
rm -f ui/src/components/challenger-m1-adversarial.test.ts \
      ui/src/components/m1-idempotency-challenge.test.ts

# 6. Clean up empty theme directory (optional)
rm -rf ui/src/theme/
```

---

## 5. Verification Method

To independently verify the deletion and health of the codebase:

1. **Verify No Deleted Files Remain**:
   ```bash
   ls ui/src/App.tsx ui/src/main.tsx ui/src/theme/ThemeProvider.tsx ui/src/tokens/tokens.stylex.ts 2>&1
   ```
   *Expected*: `No such file or directory` for all queried paths.

2. **Verify No React Dependencies or Prohibited Imports**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected*: Exit code 0, verbatim `Zero disallowed React/legacy packages found across inspected manifests.`

3. **Verify Vitest Test Suite (100% Pass)**:
   ```bash
   bun --cwd ui test
   ```
   *Expected*: 0 failed suites, all active suites pass.

4. **Verify Biome Linter**:
   ```bash
   bun run --cwd ui lint
   ```
   *Expected*: Exit code 0, 0 errors.

5. **Verify Package Manifest Contract**:
   ```bash
   grep '"customElements"' ui/package.json
   ```
   *Expected*: `"customElements": "dist/custom-elements.json",`
