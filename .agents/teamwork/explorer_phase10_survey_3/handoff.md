# Phase 10 Build Pipeline, CEM Analyzer & Foundation Contract Tests Survey

## 1. Observation

### 1.1 Package Manifests & Scripts
- **File**: `ui/package.json`
  - Line 10: `"customElements": "dist/custom-elements.json"`
  - Lines 43–52: `exports` defines strictly `.` (`types: ./dist/src/index.d.ts`, `import: ./dist/moul-ui.js`, `default: ./dist/moul-ui.js`) and `./style.css` (`style: ./dist/assets/style.css`, `default: ./dist/assets/style.css`).
  - Lines 53–62: `scripts` defines:
    - `"build": "bun ../scripts/verify-no-react.ts ui && tsc -b && vite build && cem analyze --config custom-elements-manifest.config.mjs"`
    - `"lint": "biome check"`
    - `"test": "vitest run"`
- **File**: `package.json` (monorepo root)
  - Line 11: `"build:ui": "bun --cwd ui build"`
  - Line 13: `"test": "bun --cwd ui test"`
  - Line 23: `"lint": "biome check"`
- **Tool Result**: `bun ./scripts/verify-no-react.ts all`
  - Exit code: `0`
  - Verbatim stdout: `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`

### 1.2 Vite Configuration & Rollup Guard
- **File**: `ui/vite.config.ts`
  - Lines 17–38: `banReactImportsPlugin` actively blocks imports prefixed with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, and `motion/react`.
  - Lines 40–55: `copyCssTokensPlugin` copies `ui/src/styles/style.css` to `dist/assets/style.css` on `closeBundle`.
  - Lines 66–81: Rollup library configuration:
    - `lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es'], fileName: () => 'moul-ui.js' }`
    - `rollupOptions.output.banner: '"use client";'`
    - `plugins` includes `dts({ tsconfigPath: './tsconfig.app.json' })`.

### 1.3 Custom Elements Manifest (CEM) Analyzer & Tag Name Defect
- **File**: `ui/custom-elements-manifest.config.mjs`:
  ```javascript
  export default {
    globs: ['src/components/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
    outdir: 'dist',
    litelement: true,
  }
  ```
- **Component registration pattern across all components**:
  - Components invoke `defineElement('moul-<tag>', Moul<Component>)` from `ui/src/utils/define-element.ts`.
  - Exactly 77 custom elements are registered via `defineElement` (54 primary components + 23 subcomponents/companion elements like `moul-card-header`, `moul-tab`, `moul-sidebar-item`, `moul-combobox-item`, etc.).
- **Analyzer Execution & Manifest Inspection**:
  - Running `node node_modules/.bin/cem analyze --config custom-elements-manifest.config.mjs` generates `dist/custom-elements.json` with `schemaVersion: "1.0.0"`.
  - When parsing `dist/custom-elements.json`:
    - `Total custom elements found: 77`
    - `Elements WITH tagName: 0`
    - `Elements WITHOUT tagName: 77`
    - Verbatim declarations list: `["NO-TAG (MoulAlert)", "NO-TAG (MoulAlertDialog)", "NO-TAG (MoulAreaChart)", ...]`
  - Reason: `@custom-elements-manifest/analyzer` natively only inspects `customElements.define(...)` calls and decorators. Because `@moul-dev/ui` uses idempotent wrapper `defineElement(...)`, CEM fails to associate tag names to declarations or emit `custom-element-definition` exports.
- **Verified Plugin Fix in In-Memory Test**:
  - Adding a custom plugin to `custom-elements-manifest.config.mjs` that intercepts `defineElement(tagName, className)` AST call expressions in `analyzePhase` resulted in:
    - `Total custom elements: 77`
    - `Tagged: 77`
    - `moul-alert (MoulAlert)`, `moul-button (MoulButton)`, `moul-sidebar (MoulSidebar)`, etc. all properly linked and exported.

### 1.4 Test Suite Status (`bun run test`)
- **Tool Result**: `bun --cwd ui test` (`vitest run`)
  - Test suites: **32 passed**, **4 failed** (out of 36 suites).
  - Individual tests: **936 passed**, **0 failed**.
  - All 4 failing suites failed identically due to `banReactImportsPlugin` blocking legacy React imports:
    1. `FAIL src/theme/ThemeProvider.test.tsx` (`Prohibited import detected: "react/jsx-dev-runtime"`)
    2. `FAIL src/utils/utils.test.tsx` (`Prohibited import detected: "react"`)
    3. `FAIL src/components/Autocomplete/Autocomplete.test.tsx` (`Prohibited import detected: "react/jsx-dev-runtime"`)
    4. `FAIL src/components/ListBox/ListBox.test.tsx` (`Prohibited import detected: "react/jsx-dev-runtime"`)
  - All 32 Web Component test suites passed with 100% success rate.
  - The 4 failing test files are explicitly slated for deletion under Phase 10 Requirement R2.

### 1.5 Lint Status (`bun run lint`)
- **Tool Result**: `bun run lint` (root)
  - Exit code: `0`
  - Output: `Checked 342 files in 139ms. Found 0 errors, 6 warnings, 2 infos.`
- **Tool Result**: `bun --cwd ui lint`
  - Exit code: `0`
  - Output: `Checked 277 files in 122ms. 0 errors, 0 warnings.`

### 1.6 TypeScript Build Status (`tsc -b`) & `ui/src/index.ts`
- **Tool Result**: `bun --cwd ui tsc -b` exited with code 1.
  - Failures stem from:
    1. Legacy React files still present in `src/` (`ListBox.tsx`, `Autocomplete.tsx`, `sandbox/sections/*.tsx`, etc.).
    2. Missing type imports in `ui/src/index.ts` (lines 411–475):
       `MoulChartContainer`, `MoulChartTooltip`, `MoulLineChart`, `MoulAreaChart`, `MoulBarChart`, `MoulDoughnutChart`, `MoulTopList`, `MoulStat`, `MoulPercentageBar`, `MoulPercentageCircle` are referenced in `HTMLElementTagNameMap` (lines 542–551) but not imported in the type declarations section of `ui/src/index.ts`.
    3. Type casting in `Sidebar.test.ts` (line 277: accessing `.isSelected` on generic `Element`).
- **File**: `ui/src/components/Foundation.test.ts`
  - Currently does NOT exist. Needs to be created for Phase 10 R3.

---

## 2. Logic Chain

1. **Step 1 (Package Manifest & Guard Verification)**:
   - Observation: `scripts/verify-no-react.ts all` exits 0. `ui/package.json` dependencies and exports strictly follow zero-React requirements (`lit`, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, `motion`).
   - Deduction: Phase 1 manifest purge is fully intact and passing.

2. **Step 2 (CEM Analyzer Root Cause)**:
   - Observation: CEM analyzer currently outputs `dist/custom-elements.json` with 77 declarations, but `tagName` is `undefined` on all 77 items.
   - Observation: CEM's internal `custom-elements-define-calls.js` only checks `node.expression.text === 'customElements'` and `node.name.text === 'define'`. It ignores `defineElement(...)`.
   - Observation: CEM's `linkClassToTagnamePlugin` only assigns `klass.tagName` if an export with `kind: 'custom-element-definition'` exists in the manifest.
   - Deduction: Without a custom analyzer plugin in `custom-elements-manifest.config.mjs`, CEM cannot map any tag names to component classes, violating Acceptance Criteria Requirement 2.7 / Requirement 15.7.
   - Deduction: Adding an `analyzePhase` plugin to `custom-elements-manifest.config.mjs` completely resolves this defect, restoring `tagName` and `custom-element-definition` for all 77 components.

3. **Step 3 (Test Suite Health & Regression Isolation)**:
   - Observation: Out of 36 test files, exactly 32 pass (936 tests) and exactly 4 fail.
   - Observation: The 4 failing test files are `ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, and `ListBox.test.tsx`.
   - Observation: All 4 failures are triggered by `banReactImportsPlugin` throwing on `react` / `react/jsx-dev-runtime`.
   - Observation: Requirement 10.2 explicitly commands the deletion of these 4 files.
   - Deduction: No component implementation regressions exist in the Web Components codebase. Deleting the legacy React files will result in a 100% green test suite.

4. **Step 4 (Foundation Contract Test Blueprint)**:
   - Observation: `ui/src/components/Foundation.test.ts` does not yet exist.
   - Observation: Requirement 10.3 requires testing:
     - All 54 component classes and companion elements exported from `ui/src/index.ts`.
     - All 5 reactive controllers, `toastQueue`, `generatePagination`, and log parser functions exported.
     - All 54 custom elements registered in `customElements` with `moul-` prefix.
     - Idempotent registration: calling `defineElement(tag, ctor)` again emits `console.warn` matching `Custom element "${tag}" is already registered.` without throwing.
     - Second import idempotency: `customElements.get(tag)` before and after second import matches expected constructor.
     - Zero React imports: no banned packages loaded.
   - Deduction: `Foundation.test.ts` can be authored following the established testing patterns in `Blocks.test.ts` and `Controllers.test.ts`.

5. **Step 5 (Build Pipeline Convergence)**:
   - Observation: `bun run build:ui` runs `verify-no-react -> tsc -b -> vite build -> cem analyze`.
   - Deduction: Once Phase 10 R1 (`ui/src/index.ts` type imports), R2 (legacy React file deletion & sandbox rebuild), and CEM plugin in `custom-elements-manifest.config.mjs` are implemented, `bun run build:ui` will succeed from end to end.

---

## 3. Caveats

1. **CEM Schema Version**: The WICG/Open-WC Custom Elements Manifest specification is referred to as "schema v2" across requirements (in contrast to legacy v1 web-component-analyzer), but the specification's actual schemaVersion field in the JSON output is `"1.0.0"`. This is standard across the ecosystem.
2. **Total Custom Elements Count**: While there are 54 primary components specified in RDT Section 8, compound component families (such as `moul-card-header/body/footer`, `moul-tab/tab-panel`, `moul-sidebar-*`, `moul-combobox-item`, `moul-toast-region`, `moul-chart-container/tooltip`) bring the total number of custom elements registered in the browser and CEM to **77 elements**. `Foundation.test.ts` and the CEM plugin must account for both the 54 primary components and the 23 companion elements.
3. **Docs App Dependency on Root `custom-elements.json`**: Root `package.json` specifies `"customElements": "dist/custom-elements.json"`, while `ui/package.json` specifies `"customElements": "dist/custom-elements.json"`. Ensure that build scripts or copy steps keep root `dist/custom-elements.json` in sync if tools outside `ui` read it.

---

## 4. Conclusion

The build and test infrastructure is in excellent shape, with clear, deterministic fixes needed for Phase 10:

1. **CEM Config Fix**: Update `ui/custom-elements-manifest.config.mjs` to add the `moul-define-element-plugin`. This will populate `tagName` and `custom-element-definition` for all 77 custom elements in `dist/custom-elements.json`.
2. **`ui/src/index.ts` Type Fix**: Add missing `import type { MoulAreaChart, MoulBarChart, ... }` to `ui/src/index.ts` so `HTMLElementTagNameMap` type-checks cleanly without TS2304/TS2552 errors.
3. **Legacy Deletion**: Deleting the 4 legacy test files (`ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, `ListBox.test.tsx`) will immediately restore `bun run test` to 100% pass rate (32/32 suites passing, 936 tests passing).
4. **Foundation Contract Tests**: Create `ui/src/components/Foundation.test.ts` covering export completeness, `customElements.define` idempotency warnings, `HTMLElementTagNameMap` validation, and zero React imports.

---

## 5. Verification Method

To independently verify these findings, run the following commands:

```bash
# 1. Verify no banned React packages in manifests (must exit 0)
bun ./scripts/verify-no-react.ts all

# 2. Verify current lint health (must exit 0 with 0 errors)
bun run lint
bun --cwd ui lint

# 3. Verify passing vs failing test suites (32 passing, 4 legacy failing due to banReactImportsPlugin)
bun --cwd ui test

# 4. Verify CEM missing tagNames in current output
bun -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('ui/dist/custom-elements.json', 'utf-8'));
const withoutTag = manifest.modules.flatMap(m => m.declarations || []).filter(d => d.customElement && !d.tagName);
console.log('Custom elements without tagName:', withoutTag.length);
"

# 5. Verify plugin fix resolving all 77 custom elements
node ui/node_modules/.bin/cem analyze --config .agents/teamwork/explorer_phase10_survey_3/test-cem.config.mjs
bun -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('ui/dist/custom-elements.json', 'utf-8'));
const withTag = manifest.modules.flatMap(m => m.declarations || []).filter(d => d.customElement && d.tagName);
console.log('Custom elements with tagName:', withTag.length);
"
```
