# Empirical Adversarial Challenge Report: Milestone 4 (Actions & Toggle Components)

**Agent:** `challenger_m4_1`  
**Target:** `moul-button` & `moul-button-group` (Milestone 4 — Actions & Toggle Components)  
**Date:** 2026-10-16  
**Verdict:** **APPROVE**  

---

## 1. Observation

Direct empirical observations from authoring and executing the adversarial stress test suite in `ui/src/components/button-challenge.test.ts`:

1. **Test Suite Scope & Composition:**
   - File created: `ui/src/components/button-challenge.test.ts` (913 lines, 33 comprehensive tests across 6 challenge categories).
   - Category 1: Burst Interactions & Pending State Immunity (CHAL-BTN-01 to CHAL-BTN-06).
   - Category 2: Dynamic Disabled & Pending State Toggling During Active Pointer Events (CHAL-BTN-07 to CHAL-BTN-11).
   - Category 3: Form Submission Stress & Deep/Detached DOM Hierarchies (CHAL-BTN-12 to CHAL-BTN-17).
   - Category 4: Dev Warning Verification (`warnMissingLabel`) (CHAL-BTN-18 to CHAL-BTN-25).
   - Category 5: `moul-button-group` Dynamic Modifications & Propagation Stress (CHAL-GRP-01 to CHAL-GRP-06).
   - Category 6: Fast-Check Property-Based Stress Testing (CHAL-PBT-01 to CHAL-PBT-02).

2. **Empirical Execution Results:**
   - **Challenge Test Suite (`button-challenge.test.ts`):**
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/button-challenge.test.ts
     ```
     *Output:* `33 passed (33 total) in 893ms`.
   - **Full Combined Suite (`Actions.test.ts` + `button-challenge.test.ts` + `Controllers.test.ts` + `tokens.test.ts` + `utils-challenge.test.ts`):**
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/button-challenge.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
     ```
     *Output:* `170 passed (170 total across 5 suites) in 3.80s`. Zero failures.
   - **Zero-React Enforcement:**
     ```bash
     bun ./scripts/verify-no-react.ts all
     ```
     *Output:* `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`
   - **Linter & Formatter Validation:**
     ```bash
     node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/button-challenge.test.ts
     ```
     *Output:* `Checked 7 files in 36ms. No fixes applied.` 0 errors, 0 warnings.

3. **Behavioral Findings Observed:**
   - **Burst interaction suppression:** 50 consecutive synthetic `button.click()` calls and 50 rapid `pointerdown` + `pointerup` + `click` event cycles during `is-pending = true` generated strictly 0 `press` events and 0 form submissions. Switching `isPending` back to `false` restored press dispatch and form submission on the immediate next interaction.
   - **Dynamic pointer interruption:** If `btn.isDisabled` or `btn.isPending` is set to `true` while a pointer interaction is active (after `pointerdown` but before `pointerup` and `click`), `handlePointerUp` and `handleClick` safely intercept and suppress the `press` event (0 events emitted).
   - **100 rapid state flips:** Flipping `isDisabled` or `isPending` 100 times in rapid synchronous succession left the DOM attributes (`aria-disabled`, `aria-busy`, inner `<button disabled>`, `<moul-spinner>`) in strict, deterministic alignment with the final boolean state.
   - **Deep & detached DOM forms:** A 20-level deeply nested `moul-button[type="submit"]` and `moul-button[type="reset"]` correctly traversed the light DOM tree via `this.closest('form')` and triggered form submit/reset. In detached forms, calling `.click()` does not throw and safely adheres to standard DOM submission semantics. Dynamically reparenting the button from Form A to Form B routes submission strictly to Form B.
   - **Accessible dev warnings:** `<moul-button is-icon></moul-button>` without accessible labels triggers `warnMissingLabel` via `console.warn` exactly once on initial mount. Supplying `aria-label`, `aria-labelledby`, or visible child text content completely suppresses the warning. Setting `process.env.NODE_ENV = 'production'` completely suppresses the warning.
   - **Button group reactivity:** `moul-button-group` correctly propagates its `is-disabled` state across both slotted `moul-button` elements and arbitrary slotted standard HTMLElements (via `is-disabled` attribute). Switching `orientation` (`horizontal` / `vertical`) and `spacing` (`none` / `sm` / `md`) dynamically synchronizes `aria-orientation` and host styling.
   - **Property-based invariants:** 50 runs of random boolean combinations (`isDisabled`, `isPending`) paired with random interaction triggers (`click`, `pointer`, `space`, `Enter`) confirmed the invariant: no press is ever emitted when disabled or pending. 40 runs of random orientation/spacing/disabled permutations confirmed layout attribute invariants.

---

## 2. Logic Chain

1. **Premise:** The dispatch contract mandates testing `moul-button` and `moul-button-group` under extreme adversarial workloads: 50 click bursts during pending state, dynamic state toggling during pointer events, deep/detached form submissions, label warning validation, and button group DOM modifications.
2. **Execution:** 33 targeted test cases were implemented in `ui/src/components/button-challenge.test.ts` following strict Vitest and Happy DOM standards without any React or legacy imports.
3. **Verification of Invariants:**
   - Invariant A (`Pending and Disabled Event Immunity`): Observed in CHAL-BTN-01, 02, 05, 06, 07, 08, and CHAL-PBT-01. When `isDisabled` or `isPending` is true, pointer, mouse, and keyboard listeners return early and call `stopImmediatePropagation()`. Press count remained 0 across all burst tests.
   - Invariant B (`Form Association Integrity`): Observed in CHAL-BTN-12, 13, 14, 15, 16, 17. Button uses native `this.closest('form')` and calls `form.requestSubmit()` / `form.reset()`. Deeply nested elements and reparented elements route to the appropriate form instance.
   - Invariant C (`A11y Label Warning Compliance`): Observed in CHAL-BTN-18 through CHAL-BTN-25. `warnMissingLabel` is called in `updated()` when `this.isIcon` is true and both accessible labels and visible text are absent.
   - Invariant D (`Button Group Propagation`): Observed in CHAL-GRP-01 through CHAL-GRP-06 and CHAL-PBT-02. Dynamic child additions, removals, and group disabled toggling propagate properly to all children.
4. **Zero-React & Linter Adherence:** Biome check completed with 0 errors and 0 warnings. `verify-no-react.ts` confirmed zero forbidden dependencies.

---

## 3. Caveats

- **Lit Update Lifecycle on Disconnected Elements:** Custom elements that have never been attached to the DOM (`isConnected === false`) do not trigger `connectedCallback` and do not process Lit reactive render loops. This is standard browser and Lit behavior. Tests appropriately test detached forms once elements have been connected or observe safe no-op behavior on detached elements.
- **Icon Button Re-update Warning Frequency:** If an icon-only button without an accessible label undergoes subsequent property mutations (e.g. `btn.size = 'lg'`), `warnMissingLabel` will be invoked again because `updated()` checks `if (this.isIcon)`. This is harmless in development mode and reinforces the accessibility warning until resolved. In production (`NODE_ENV === 'production'`), it is a complete no-op.

---

## 4. Conclusion

**Verdict: APPROVE**

The implementations of `moul-button` (`ui/src/components/Button/Button.ts`) and `moul-button-group` (`ui/src/components/ButtonGroup/ButtonGroup.ts`) are robust, hardened against adversarial edge cases, and completely satisfy all architectural, accessibility, and behavioral specifications of Milestone 4.

---

## 5. Verification Method

To reproduce and independently verify this evaluation:

1. **Run the Button Challenge Test Suite:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/button-challenge.test.ts
   ```
   *Expected:* 33 passed (33 total).

2. **Run Full Actions and Foundation Regressions:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/button-challenge.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   *Expected:* 170 passed (170 total across 5 suites).

3. **Verify Zero React Dependencies:**
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected:* Code 0, zero disallowed packages found.

4. **Verify Linter / Formatter:**
   ```bash
   node_modules/.bin/biome check ui/src/components/Button ui/src/components/ButtonGroup ui/src/components/button-challenge.test.ts
   ```
   *Expected:* 7 files checked, 0 errors, 0 warnings.
