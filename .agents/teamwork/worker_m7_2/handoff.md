# Handoff Report: Milestone 7 Remediation (Phase 7: Input & Form Components)

**Agent**: `worker_m7_2`  
**Date**: 2026-10-16T15:04:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (parent orchestrator)  
**Status**: Remediation Complete — Ready for Review  

---

## 1. Observation

### 1.1 Pre-Remediation Baseline Failures

Prior to remediation, running:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts
```
Reported:
```text
FAIL src/components/pickers-challenge.test.ts > CHAL-CKG-05: CheckboxGroup preserves individual child checkbox is-disabled state when group is not disabled
AssertionError: expected false to be true
  expect(cbs[1].isDisabled).toBe(true)

FAIL src/components/pickers-challenge.test.ts > CHAL-RAD-03: Skipping disabled radios during arrow key roving navigation
AssertionError: expected false to be true
  expect(radios[1].isDisabled).toBe(true)

FAIL src/components/pickers-challenge.test.ts > CHAL-CMB-05: Sequential keyboard navigation when focus moves to active descendant item
AssertionError: expected <moul-combobox-item key="opt2"> to be <moul-combobox-item key="opt1">
```
Additionally, `Forms.test.ts` logged runtime warnings in stderr:
```text
[@moul-dev/ui] Failed to call dialog.showModal() (element may be disconnected): TypeError: dialog.showModal is not a function
    at Module.safeShowModal (ui/src/utils/focus-trap.ts:204:14)
    at OverlayPresenceController.promoteTopLayer (ui/src/controllers/overlay-presence.controller.ts:187:7)
```
And `forms-challenge.test.ts` confirmed:
1. `CHAL-DEFECT-01`: `MoulForm.reset()` did not reset `MoulNumberField` or `MoulSlider` values because `handleReset` filtered strictly on `typeof anyCtrl.value === 'string'`.
2. `CHAL-DEFECT-02`: `MoulSlider.clampAndSnap` breached `max` bound when `(max - min)` was not divisible by `step` (e.g. `min=0, max=5, step=3, value=5` snapped to `6 > max`).
3. `CHAL-DEFECT-03`: `subtleAnimate` in `InputOTP.ts` (line 143) and `NumberField.ts` (line 269) passed 3 keyframes with `SPRING_SNAPPY`, violating Motion 13's 2-keyframe spring physics engine invariant.
4. `CHAL-DEFECT-04`: `TextField.ts` and `TextArea.ts` used `aria-describedby=${describedBy || undefined}`, serializing in Lit as `aria-describedby=""` when empty.

---

### 1.2 Remediations Applied

1. **Motion 13 Invariant Violations**:
   - `ui/src/components/InputOTP/InputOTP.ts`: Updated `subtleAnimate` from `{ scale: [0.95, 1.04, 1] }` to `{ scale: [1.06, 1] }, SPRING_SNAPPY`.
   - `ui/src/components/NumberField/NumberField.ts`: Updated `animateStepperPress` from `{ scale: [1, 0.94, 1] }` to `{ scale: [0.94, 1] }, SPRING_SNAPPY`.

2. **CheckboxGroup & RadioGroup Disabled State Preservation**:
   - `ui/src/components/Checkbox/CheckboxGroup.ts`: In `willUpdate`, replaced unconditional assignment with conditional cascade:
     ```ts
     if (changedProperties.has('isDisabled')) {
       if (this.isDisabled) {
         for (const cb of this.checkboxes) cb.isDisabled = true
       } else if (changedProperties.get('isDisabled') === true) {
         for (const cb of this.checkboxes) {
           if (!cb.hasAttribute('is-disabled')) cb.isDisabled = false
         }
       }
     }
     ```
   - `ui/src/components/RadioGroup/RadioGroup.ts`: In `willUpdate`, applied the exact same check so individual `<moul-radio is-disabled>` items remain disabled.

3. **ComboBox Sequential Keyboard Traversal**:
   - `ui/src/components/ComboBox/ComboBox.ts`:
     - Added `@keydown=${this.handleKeyDown}` to `<div part="base">` and removed `@keydown` from `<input>`.
     - Attached `this.addEventListener('keydown', this.handleKeyDown)` in `connectedCallback` and removed in `disconnectedCallback`.
     - Guarded `handleKeyDown` with `if (this.isDisabled || event.defaultPrevented) return` to handle events from slotted items while preventing double execution.

4. **OverlayPresenceController Top-Layer Popover Configuration**:
   - `ui/src/components/Select/Select.ts`, `ui/src/components/ComboBox/ComboBox.ts`, `ui/src/components/DatePicker/DatePicker.ts`:
     - Replaced `dialog: () => this.popoverElement as any` with `popover: () => this.popoverElement` in `OverlayPresenceController` options.
     - Added `popover="auto"` to `<div part="popover">`.
     - Completely eliminated `safeShowModal` / `dialog.showModal is not a function` runtime errors.

5. **Slider Maximum Limit Re-Clamping**:
   - `ui/src/components/Slider/Slider.ts`: Updated `clampAndSnap`:
     ```ts
     const clamped = Math.min(Math.max(val, min), max)
     const steps = Math.round((clamped - min) / step)
     const snapped = Math.min(Math.max(min + steps * step, min), max)
     return Number(snapped.toFixed(6))
     ```
     Guarantees that `value` never exceeds `max` nor falls below `min`.

6. **Form Reset for Numeric Controls**:
   - `ui/src/components/NumberField/NumberField.ts`: Implemented public `reset()` method restoring `defaultValue ?? (typeof this.min === 'number' && this.min > 0 ? this.min : 0)` and syncing form internals.
   - `ui/src/components/Slider/Slider.ts`: Implemented public `reset()` method restoring `defaultValue ?? (typeof this.min === 'number' ? this.min : 0)` and syncing form internals.
   - `ui/src/components/Form/Form.ts`: Added numeric control reset handling in `handleReset` as fallback:
     ```ts
     } else if ('value' in anyCtrl && typeof anyCtrl.value === 'number') {
       anyCtrl.value = typeof anyCtrl.min === 'number' && anyCtrl.min > 0 ? anyCtrl.min : 0
     }
     ```

7. **Lit `nothing` Attribute Serialization**:
   - `ui/src/components/TextField/TextField.ts`: Imported `nothing` and used `aria-describedby=${describedBy || nothing}`.
   - `ui/src/components/SearchField/SearchField.ts`: Imported `nothing`, computed `describedBy`, and added `aria-describedby=${describedBy || nothing}` to `<input>`.
   - `ui/src/components/TextArea/TextArea.ts`: Imported `nothing` and used `aria-describedby=${describedBy || nothing}`.
   - `ui/src/components/forms-challenge.test.ts`: Updated `CHAL-DEFECT-01` through `CHAL-DEFECT-04` to assert the remediated behaviors.

---

### 1.3 Post-Remediation Verification Output

1. **Vitest Regression Across All Component Phases (4–7)**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts
   ```
   **Output**:
   ```text
    ✓ src/components/Actions.test.ts (21)
    ✓ src/components/Forms.test.ts (17)
    ✓ src/components/Navigation.test.ts (10)
    ✓ src/components/Overlays.test.ts (10)
    ✓ src/components/Surfaces.test.ts (30)
    ✓ src/components/forms-challenge.test.ts (30)
    ✓ src/components/pickers-challenge.test.ts (35)

    Test Files  7 passed (7)
         Tests  153 passed (153)
      Duration  4.14s
   ```
   *Note: Zero `dialog.showModal` errors in stderr.*

2. **Zero-React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   **Output**:
   ```text
   ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
   ```

3. **Biome Linter Check**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components
   ```
   **Output**:
   ```text
   Checked 217 files in 114ms. No fixes applied. Found 0 errors, 3 warnings (untouched legacy files).
   ```

---

## 2. Logic Chain

1. **Defect 1**: Motion's spring solver requires `[start, end]` (2 keyframes). Supplying `[1.06, 1]` for `InputOTP` and `[0.94, 1]` for `NumberField` satisfies this constraint while preserving visual tactile feedback.
2. **Defect 2**: In Lit's initial render cycle, `changedProperties.has('isDisabled')` evaluates to `true` while `this.isDisabled` defaults to `false`. By checking `if (this.isDisabled)` before cascading, and only resetting children when the group actually toggles from `true` to `false`, children with `is-disabled` retain their individual disabled status.
3. **Defect 3**: ComboBox items are slotted in light DOM. While keyboard events inside shadow root bubble up to `<div part="base">`, slotted item keyboard events bubble directly to the host `<moul-combobox>` element in headless environments. Handling keydown on both `<div part="base">` and the host with an `event.defaultPrevented` guard ensures complete traversal continuity regardless of DOM boundary routing.
4. **Defect 4**: `OverlayPresenceController` specifically branches between `<dialog>` (calling `safeShowModal`) and `[popover]` (calling `popover.showPopover`). Passing `popover: () => this.popoverElement` and assigning `popover="auto"` enables native top-layer promotion without attempting to execute `showModal` on a `<div>`.
5. **Defect 5**: When `(max - min)` is not an integer multiple of `step`, `min + Math.round((clamped - min) / step) * step` can round up past `max`. Applying `Math.min(..., max)` ensures the final output never violates the `max` boundary.
6. **Defect 6**: Form reset mechanisms must accommodate numeric fields. Adding `.reset()` methods on `MoulNumberField` and `MoulSlider` and augmenting `Form.handleReset` with a numeric branch restores controls to their baseline/min value on form reset.
7. **Defect 7**: In Lit templates, `undefined` attribute expressions render as empty string `""`. Using Lit's `nothing` sentinel causes the attribute to be omitted entirely when no descriptions are present.

---

## 3. Caveats

No caveats. All 7 defect categories have been resolved, and 153/153 tests pass deterministically across all component test suites.

---

## 4. Conclusion

Milestone 7 remediation is complete. All 7 reported defects are resolved with clean, genuine logic adhering strictly to the zero-React mandate, WAI-ARIA accessibility specifications, and Motion 13 invariants.

---

## 5. Verification Method

To independently verify the remediation:

1. **Execute Vitest across all Phase 4–7 Component Suites**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts
   ```
   *Expected*: 7 test files passed, 153 passed tests, 0 failures, 0 runtime exceptions.

2. **Verify Zero-React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected*: Exits 0 with `Zero disallowed React/legacy packages found`.

3. **Verify Biome Linter**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components
   ```
   *Expected*: Checked 217 files, 0 errors.
