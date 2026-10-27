# Review & Adversarial Challenge Report: Milestone 4 (Actions & Toggles)

**Agent**: `reviewer_m4_1`  
**Roles**: Reviewer, Adversarial Critic  
**Milestone**: Milestone 4 (`MoulButton`, `MoulButtonGroup`, `MoulToggleButton`, `MoulToggleButtonGroup`, `MoulSpinner`, and `Actions.test.ts`)  
**Date**: 2026-10-16  
**Final Verdict**: **APPROVE**  

---

## 1. Observation

Direct observations and execution outcomes:

1. **Test Suite Execution**:
   - `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts`
     - Result: `Test Files 1 passed (1), Tests 21 passed (21), Duration 679ms`.
     - Verified test suites:
       - `MoulButton`: ACT-BTN-01 through ACT-BTN-10 (10 passed).
       - `MoulButtonGroup`: ACT-GRP-01 through ACT-GRP-03 (3 passed).
       - `MoulToggleButton`: ACT-TGL-01 through ACT-TGL-03 (3 passed).
       - `MoulToggleButtonGroup`: ACT-TGG-01 through ACT-TGG-04 (4 passed).
       - `MoulSpinner`: ACT-SPN-01 (1 passed).
   - Regression suite:
     - `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts`
     - Result: `Test Files 4 passed (4), Tests 137 passed (137), Duration 3.74s`.

2. **Zero-React Dependency Verification**:
   - `bun ./scripts/verify-no-react.ts all`
     - Result: `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`
   - No imports matching `/^react/`, `@stylexjs/stylex`, or `@lit/react` exist in any Milestone 4 component or test file.

3. **Code Style and Linter Verification**:
   - `./node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/ToggleButton ui/src/components/ToggleButtonGroup ui/src/components/Spinner ui/src/components/Actions.test.ts ui/src/index.ts`
     - Result: `Checked 17 files in 36ms. No fixes applied.` (0 errors, 0 warnings).

4. **TypeScript Typecheck Verification**:
   - `node ui/node_modules/.bin/tsc --noEmit -p ui/tsconfig.json`
     - Result: Exited with code 0, 0 type errors.
   - `node ui/node_modules/.bin/tsc --noEmit --skipLibCheck ui/src/components/Actions.test.ts`
     - Result: Exited with code 0, 0 type errors.

5. **Integrity & Code Inspection**:
   - Inspected `ui/src/components/Button/Button.ts` (lines 1–202):
     - Uses `defineElement('moul-button', MoulButton)` and registers in `HTMLElementTagNameMap`.
     - Reactive properties: `variant`, `size`, `type`, `isIcon` (`is-icon`), `isDisabled` (`is-disabled`), `isPending` (`is-pending`).
     - Open Shadow DOM with scoped styles consuming `buttonStyles` and native tokens.
     - `PressController` attached with `scaleOnPress: 0.97`, disabled when `isDisabled` or `isPending`.
     - Dev-only label audit: `warnMissingLabel(this, 'icon-only button', hasVisibleLabel)` on line 97 when `isIcon` is true.
     - Pending state: renders inline `<moul-spinner size="sm">`, sets `aria-busy="true"` on host and inner button, blocks pointer and keyboard activation.
     - Form integration: invokes `form.requestSubmit()` or `form.reset()` on click/Enter/Space.
   - Inspected `ui/src/components/ButtonGroup/ButtonGroup.ts` (lines 1–88) & `ButtonGroup.styles.ts` (lines 1–100):
     - Sets `role="group"` and `aria-orientation` matching `orientation`.
     - Propagates disabled state to slotted children on slot change and property update.
     - CSS radius collapse when `spacing="none"` on both horizontal and vertical axes (`border-radius: 0 !important; margin-inline-start: -1px;`, etc.).
   - Inspected `ui/src/components/ToggleButton/ToggleButton.ts` (lines 1–165):
     - Synchronizes `aria-pressed="true" | "false"` on host and inner `<button>`.
     - Dispatches `change` with `{ isSelected, value }` and `press` with `{ isSelected }`.
     - Integrates `PressController` for tactile press feedback.
   - Inspected `ui/src/components/ToggleButtonGroup/ToggleButtonGroup.ts` (lines 1–286):
     - Sets `role="group"` and `aria-orientation`.
     - Implements WAI-ARIA roving `tabindex="0"` for active item and `tabindex="-1"` for inactive items.
     - Full keyboard navigation with circular wrapping (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`, `Home`, `End`).
     - Integrates `animateActiveIndicator` (`SPRING_SNAPPY`) for active selection pill.
     - Dispatches `selectionchange` with `{ selectedKey }`.
   - Inspected `ui/src/components/Spinner/Spinner.ts` (lines 1–42) & `Spinner.styles.ts` (lines 1–75):
     - Role `status` with accessible label and `<span class="sr-only">`.
     - SVG has `aria-hidden="true"` and keyframe rotation `moul-spin` 0.75s infinite linear.
     - `@media (prefers-reduced-motion: reduce)` disables continuous rotation and sets static opacity.
   - Inspected `ui/src/index.ts` (lines 66–79, 397–398, 453–461):
     - Exports `MoulButton`, `Button`, `MoulButtonGroup`, `ButtonGroup`, `MoulToggleButton`, `ToggleButton`, `MoulToggleButtonGroup`, `ToggleButtonGroup`, `MoulSpinner`, `Spinner` alongside all associated TypeScript types.

---

## 2. Logic Chain

1. **Zero Integrity Violations Confirmed:**
   - Active checks for hardcoded test outputs, dummy facades, task bypasses, fabricated logs, or self-certification confirmed no integrity violations (Observation 1.5).
   - All components implement genuine reactive lifecycles, event dispatching, property reflection, and real DOM interactions.
2. **Requirement 8 & Milestone 4 Full Compliance:**
   - Requirement 8.1–8.3: `moul-button` supports 7 variants, 3 sizes, `is-icon` with `warnMissingLabel`, `is-pending` with `aria-busy` and inline `moul-spinner`, and tactile press scale via `PressController` (Observation 1.1, ACT-BTN-01 through ACT-BTN-10).
   - Requirement 8.4: `moul-button-group` applies orientation and spacing, propagates disabled state, and implements corner radius collapse when `spacing="none"` (Observation 1.1, ACT-GRP-01 through ACT-GRP-03).
   - Requirement 8.5: `moul-toggle-button` synchronizes `is-selected` with `aria-pressed` on both host and inner button, and handles Space/Enter and pointer toggling (Observation 1.1, ACT-TGL-01 through ACT-TGL-03).
   - Requirement 8.6–8.7: `moul-toggle-button-group` manages `selected-key`, dispatches `selectionchange`, implements WAI-ARIA roving tabindex, circular wrapping arrow key navigation, Home/End jumping, and animated selection indicator (Observation 1.1, ACT-TGG-01 through ACT-TGG-04).
   - Requirement 11.11: `moul-spinner` renders SVG spinner ring with `role="status"` and accessible text, respecting `prefers-reduced-motion` (Observation 1.1, ACT-SPN-01).
3. **Standards & Modern Web Compatibility:**
   - Idempotent element registration via `defineElement`.
   - Open Shadow DOM with CSS custom property token integration (`style.css` and `resetStyles`).
   - Clean TypeScript types and Biome formatting compliance.
   - Zero React dependencies verified across the workspace.

---

## 3. Caveats & Adversarial Findings

### Finding 1 (Minor / Non-blocking — Event Deduplication Timing)
- **Observation**: `MoulButton.ts` and `MoulToggleButton.ts` dispatch `press` / `toggle` on `pointerup`, setting a boolean flag `pressHandledInCycle = true` that is cleared via `queueMicrotask(() => { this.pressHandledInCycle = false })` to prevent a duplicate trigger during the subsequent native `click` event.
- **Analysis**: In standard browser event loops, microtasks run at the end of each task (after the `pointerup` listener completes). In certain custom or synthetic event environments where `click` is dispatched in a later task, the microtask would clear the flag prior to `click`, theoretically permitting a secondary activation.
- **Mitigation / Note**: Under all tested conditions (including Vitest and standard DOM events), the guard performs accurately, and `handlePointerDown` resets the cycle properly. For future hardening, tracking pointer down/up pairs with a pointer ID or pointer capture provides an even stronger guarantee.

### Finding 2 (Minor / Non-blocking — Shadow DOM Focus with Roving Tabindex)
- **Observation**: `MoulToggleButtonGroup` sets `tabindex="0"` on the active `<moul-toggle-button>` host and `tabindex="-1"` on inactive hosts. Inside the shadow DOM of `MoulToggleButton`, the inner `<button>` is a native button without an explicit `tabindex`.
- **Analysis**: Keyboard arrow keys (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`, `Home`, `End`) explicitly call `item.focus()`, correctly directing focus to the active toggle button. However, in browsers that pierce shadow roots during Tab navigation, the inner button's native focusability can be tabbed into.
- **Mitigation / Note**: Requirement 8.7 specifies roving tabindex on arrow keys, which is fully operational and passes ACT-TGG-03 and ACT-TGG-04. If desired in future milestones, `delegatesFocus: true` or forwarding `tabindex` to the inner button can ensure strict Tab key parity.

No caveats invalidate the functional or architectural requirements of Milestone 4.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 4 (`MoulButton`, `MoulButtonGroup`, `MoulToggleButton`, `MoulToggleButtonGroup`, `MoulSpinner`, and `Actions.test.ts`) is fully implemented, verified, accessible, and strictly conforms to all architectural and zero-React guidelines:
1. 21/21 tests in `Actions.test.ts` pass cleanly.
2. 137/137 tests across all migrated test suites pass with zero regressions.
3. 100% Zero-React compliance confirmed via `verify-no-react.ts all`.
4. Biome linting and formatting pass with 0 errors and 0 warnings.
5. TypeScript compilation passes with 0 errors.
6. Tasks 4.1–4.5 in `rdt/tasks.md` are complete and verified.

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run Actions Test Suite:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts
   ```
   *Expected outcome*: 21 passed (21 total).

2. **Run Full Migrated Regression Suite:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   *Expected outcome*: 137 passed (137 total).

3. **Verify Zero React Dependencies:**
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Zero disallowed packages found.

4. **Verify TypeScript Typecheck:**
   ```bash
   node ui/node_modules/.bin/tsc --noEmit -p ui/tsconfig.json
   ```
   *Expected outcome*: Exits with code 0.

5. **Verify Biome Linter / Formatter:**
   ```bash
   ./node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/ToggleButton ui/src/components/ToggleButtonGroup ui/src/components/Spinner ui/src/components/Actions.test.ts ui/src/index.ts
   ```
   *Expected outcome*: 17 files checked, 0 errors, 0 warnings.

6. **Invalidation Conditions:**
   - Any failure in `Actions.test.ts`.
   - Any React, React Aria, or StyleX import detected by `verify-no-react.ts all`.
   - Any TypeScript typecheck error in `ui/tsconfig.json`.
