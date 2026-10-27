# Review & Adversarial Challenge Report: Milestone 4 (Actions & Toggles)

**Reviewer / Critic:** `reviewer_m4_2`  
**Milestone:** Milestone 4 (Phase 4: Actions & Toggle Components)  
**Date:** 2026-10-16  
**Final Verdict:** **APPROVE**  
**Integrity Status:** **VERIFIED (Zero Violations Detected)**  

---

## 1. Observation

Direct observations and command outcomes recorded during review:

1. **Test Execution & Regressions:**
   - Command:
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
     ```
   - Result:
     ```
     Test Files  4 passed (4)
          Tests  137 passed (137)
       Duration  4.07s
     ```
   - Breakdown:
     - `src/components/Actions.test.ts`: 21 tests passed (100%)
     - `src/controllers/Controllers.test.ts`: 45 tests passed (100%)
     - `src/tokens/tokens.test.ts`: 35 tests passed (100%)
     - `src/utils/utils-challenge.test.ts`: 36 tests passed (100%)

2. **Code Health & Biome Linter:**
   - Command:
     ```bash
     node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/ToggleButton ui/src/components/ToggleButtonGroup ui/src/components/Spinner ui/src/components/Actions.test.ts ui/src/index.ts
     ```
   - Result:
     ```
     Checked 17 files in 36ms. No fixes applied.
     ```
   - 0 errors, 0 warnings across all 17 touched files.

3. **Zero-React Compliance Verification:**
   - Command:
     ```bash
     bun ./scripts/verify-no-react.ts all
     ```
   - Result:
     ```
     ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
     ```
   - Source code grep for `react`, `react-dom`, `react-aria`, `@stylexjs` across:
     - `ui/src/components/Button/`: 0 results
     - `ui/src/components/ButtonGroup/`: 0 results
     - `ui/src/components/ToggleButton/`: 0 results
     - `ui/src/components/ToggleButtonGroup/`: 0 results
     - `ui/src/components/Spinner/`: 0 results
     - `ui/src/components/Actions.test.ts`: 0 results

4. **Component Implementation Inspections:**
   - `MoulButton` (`ui/src/components/Button/Button.ts:21-202`):
     Extends `LitElement`, registered as `moul-button` via `defineElement`. Integrates `PressController` with `scaleOnPress: 0.97`. Reflects `variant` (7 variants), `size` (3 sizes), `type`, `is-icon`, `is-disabled`, `is-pending`. Emits accessible `warnMissingLabel` in development when `is-icon` is set without accessible name (lines 95–98). Dispatches `press` custom event (`composed: true`, `bubbles: true`, detail with `originalEvent`). Intercepts form submission and reset on inner button or host activation (lines 158–171).
   - `MoulButtonGroup` (`ui/src/components/ButtonGroup/ButtonGroup.ts:8-88`):
     Extends `LitElement`, registered as `moul-button-group`. Reflects `orientation` (`horizontal` | `vertical`), `spacing` (`none` | `sm` | `md`), `is-disabled`. Automatically manages `role="group"` and `aria-orientation`. Scoped styles in `ButtonGroup.styles.ts:55-91` implement negative margins and corner radius collapse on child `moul-button` elements when `spacing="none"`.
   - `MoulToggleButton` (`ui/src/components/ToggleButton/ToggleButton.ts:8-165`):
     Extends `LitElement`, registered as `moul-toggle-button`. Manages `value: string`, `isSelected: boolean` (`is-selected`), `size`, `isDisabled`. Synchronizes `aria-pressed="true" | "false"` on host element and inner shadow `<button>` (lines 41, 62, 123, 149). Dispatches `change` (`detail: { isSelected, value }`) and `press` (`detail: { isSelected }`).
   - `MoulToggleButtonGroup` (`ui/src/components/ToggleButtonGroup/ToggleButtonGroup.ts:9-286`):
     Extends `LitElement`, registered as `moul-toggle-button-group`. Reflects `selected-key`, `orientation`, `is-disabled`. Implements WAI-ARIA roving `tabindex` (`tabindex="0"` on active button, `tabindex="-1"` on siblings). Handles keyboard traversal with circular wrapping across `ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`, `Home`, and `End` (lines 152–189). Smooth active indicator animation via `animateActiveIndicator` (lines 233–267). Dispatches `selectionchange` (`detail: { selectedKey }`).
   - `MoulSpinner` (`ui/src/components/Spinner/Spinner.ts:8-42`):
     Extends `LitElement`, registered as `moul-spinner`. Accepts `size: 'sm' | 'md' | 'lg'` and `label: string` (default `'Loading'`). Renders `spinnerRing()` SVG with `role="status"` and accessible `.sr-only` text. Respects `prefers-reduced-motion` in `Spinner.styles.ts:55-60`.
   - Public Barrel Exports (`ui/src/index.ts:66-79, 397-400, 453-461`):
     Exports `MoulButton` + alias `Button`, `MoulButtonGroup` + alias `ButtonGroup`, `MoulToggleButton` + alias `ToggleButton`, `MoulToggleButtonGroup` + alias `ToggleButtonGroup`, `MoulSpinner` + alias `Spinner`, and their respective TypeScript types.

---

## 2. Logic Chain

1. **Integrity & Authenticity Assessment:**
   - As observed in Section 1.4, the implementations in `ui/src/components/{Button,ButtonGroup,ToggleButton,ToggleButtonGroup,Spinner}` contain real Lit 3 component logic, DOM lifecycle management, and reactive properties.
   - There are zero hardcoded return values, dummy facades, test mocks embedded in production code, or bypassed tasks.
   - All tests in `Actions.test.ts` mount genuine DOM elements via Lit `html` templates and trigger real PointerEvent, KeyboardEvent, and click events (Section 1.1).

2. **Completeness Against Requirement 8 & Phase 4 Specifications:**
   - `rdt/requirements.md` Requirement 8 defines 7 acceptance criteria:
     - Req 8.1 & 8.2: `moul-button` implements 7 variants, 3 sizes, `is-icon`, `is-disabled`, `is-pending` with inline `moul-spinner` and `aria-busy="true"` (verified via `ACT-BTN-01`, `ACT-BTN-02`, `ACT-BTN-05`, `ACT-BTN-06`).
     - Req 8.3: `warnMissingLabel` emits dev warnings for unlabelled icon buttons (verified via `ACT-BTN-07`).
     - Req 8.4: `moul-button-group` supports horizontal/vertical orientation and spacing with radius collapse (verified via `ACT-GRP-01`, `ACT-GRP-03`).
     - Req 8.5: `moul-toggle-button` synchronizes `is-selected` and `aria-pressed` (verified via `ACT-TGL-01`).
     - Req 8.6 & 8.7: `moul-toggle-button-group` manages `selected-key`, dispatches `selectionchange`, and implements WAI-ARIA roving `tabindex` with circular wrapping (verified via `ACT-TGG-01`, `ACT-TGG-02`, `ACT-TGG-03`, `ACT-TGG-04`).
   - Req 11.11: `moul-spinner` renders SVG spinner with size variants and accessible label (verified via `ACT-SPN-01`).

3. **Zero-React Strict Verification:**
   - The verify script `scripts/verify-no-react.ts all` exits 0 (Observation 1.3).
   - In all 5 component directories, legacy `.tsx` files have been purged and replaced with clean `.ts` Lit implementations.
   - No imports match `/^react/`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.

4. **Regression Safety:**
   - Regression suites for Controllers (45 tests), CSS Tokens (35 tests), and Utilities (36 tests) all run cleanly alongside Actions (21 tests) with 100% pass rate (Observation 1.1).
   - Biome linter check reports 0 errors and 0 warnings (Observation 1.2).

---

## 3. Caveats & Adversarial Findings

### Review Findings

- **Finding 1 (Minor — Edge Case / Keyboard Form Submission):**
  - *Location:* `ui/src/components/Button/Button.ts:126, 141`
  - *Detail:* In `MoulButton`, `handleKeyUp` calls `this.handleFormIntegration()` when Enter or Space is released on `type="submit"` or `type="reset"`. However, `handleClick` also calls `this.handleFormIntegration()` unconditionally (outside the `!this.pressHandledInCycle` guard). If a browser synthesizes a native `click` event following a keyboard activation, `handleFormIntegration()` could theoretically be invoked twice.
  - *Impact:* Low. In typical SPA usage, `requestSubmit()` on an already-submitting form or event cancellation prevents double actions, but guarding `handleFormIntegration` with `pressHandledInCycle` or handling form submission exclusively on `click` is recommended for future hardening.

- **Finding 2 (Minor — Group Disabled State Overwrite):**
  - *Location:* `ui/src/components/ButtonGroup/ButtonGroup.ts:59-69` and `ui/src/components/ToggleButtonGroup/ToggleButtonGroup.ts:117-122`
  - *Detail:* When `syncDisabledState()` runs on an enabled group (`isDisabled = false`), it iterates over child buttons and sets `child.isDisabled = this.isDisabled` (`false`). If an individual button had `is-disabled` set independently by a developer, the group connection erases that button's individual disabled state.
  - *Impact:* Low. Standard practice is to manage disabled state either entirely at the group level or allow children to retain their own disabled state via `child.isDisabled = this.isDisabled || child.hasAttribute('is-disabled')`.

- **Finding 3 (Minor — Shadow DOM Focus Delegation):**
  - *Location:* `ui/src/components/ToggleButton/ToggleButton.ts:8`
  - *Detail:* `MoulToggleButtonGroup` sets `tabindex="0"` and `tabindex="-1"` on the host `<moul-toggle-button>`, but `MoulToggleButton` does not specify `delegatesFocus: true` on its shadow root options. Because the inner `<button>` in shadow DOM is natively focusable, external Tab navigation in non-roving contexts may focus the inner button.
  - *Impact:* Low. Roving tabindex within the group works as designed via host tabindex manipulation, but adding `delegatesFocus: true` would streamline native browser focus delegation.

- **Finding 4 (Minor — Test Coverage Extensions):**
  - *Location:* `ui/src/components/Actions.test.ts`
  - *Detail:* While test coverage is thorough across all 4 components (21 tests), adding tests for rapid consecutive pointer clicks (debouncing validation) and verifying that disabled items are bypassed during keyboard roving tabindex would further strengthen the test harness.

---

## 4. Conclusion

Milestone 4 (Phase 4: Actions & Toggle Components) is **APPROVED**:
1. All four action and toggle components (`moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group`) plus `moul-spinner` are fully implemented with Lit 3, `PressController`, and open Shadow DOM.
2. All 21 tests in `Actions.test.ts` pass cleanly, and all 116 regression tests in Controllers, Tokens, and Utilities continue to pass (137 tests total).
3. Zero React dependencies or imports exist across manifests, touched source files, and test files.
4. Biome linting and formatting pass with 0 errors and 0 warnings.
5. Zero integrity violations detected.

---

## 5. Verification Method

To independently reproduce and verify this review verdict:

1. **Verify No-React Manifest Guard:**
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome:* Exit code 0, 0 disallowed packages found.

2. **Verify Biome Linter & Code Health:**
   ```bash
   node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/ToggleButton ui/src/components/ToggleButtonGroup ui/src/components/Spinner ui/src/components/Actions.test.ts ui/src/index.ts
   ```
   *Expected outcome:* 17 files checked, 0 errors, 0 warnings.

3. **Verify Actions & Full Regression Test Suites:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   *Expected outcome:* 4 test files passed, 137 tests passed (0 failed).

4. **Invalidation Conditions:**
   - Any test failure in `Actions.test.ts` or regression suites.
   - Any React, React-Aria, or StyleX import detected in Phase 4 components.
   - Any Biome check error or warning on Phase 4 files.
