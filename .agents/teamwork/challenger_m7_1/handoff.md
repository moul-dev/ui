# Milestone 7 Challenge Report: Input & Form Components Adversarial Verification

**Agent**: `challenger_m7_1`  
**Date**: 2026-10-16T14:46:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  
**Verdict**: **REQUEST_CHANGES**

---

## Challenge Summary

**Overall risk assessment**: **CRITICAL**

While standard happy-path tests passed in the worker handoff, empirical adversarial stress testing and property-based fuzzing uncovered **two critical runtime crashes**, **one critical constraint breach/leak**, **one high form state desynchronization bug**, and **one accessibility ARIA defect**:
1. **Critical Runtime Crash (Motion Invariant)**: Typing into any slot of `moul-input-otp` triggers an uncaught exception from Motion 13 because 3 keyframes are passed to a spring animation preset (`SPRING_SNAPPY`).
2. **Critical Runtime Crash (Motion Invariant)**: Clicking either stepper button (`▲` or `▼`) on `moul-number-field` triggers the exact same unhandled exception from Motion 13.
3. **Critical Constraint Breach / Form Leak**: In `moul-slider`, `clampAndSnap` fails to re-clamp after rounding steps. When `(max - min)` is not divisible by `step` (e.g. `min=0, max=5, step=3`), `value` snaps to `6`, exceeding `max`. This leaks `value=6` to ARIA (`aria-valuenow="6" > aria-valuemax="5"`), DOM attributes, `ElementInternals`, and FormData.
4. **High Form State Desynchronization**: In `moul-form`, `handleReset` strictly filters on `typeof anyCtrl.value === 'string'`. Because `moul-number-field` and `moul-slider` store numeric values, they are completely skipped during `form.reset()`, leaving dirty values intact.
5. **Medium ARIA Defect**: `moul-text-field`, `moul-search-field`, and `moul-text-area` use Lit template expressions `aria-describedby=${describedBy || undefined}`. In Lit, `undefined` serializes to `aria-describedby=""` (empty string) rather than omitting the attribute.

---

## 1. Observation

### Empirical Test Harness Execution
Authored a 30-test empirical adversarial stress harness in `ui/src/components/forms-challenge.test.ts` covering `moul-form`, `moul-text-field`, `moul-search-field`, `moul-text-area`, `moul-number-field`, `moul-slider`, and `moul-input-otp`.

**Execution Command**:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts
```

**Verbatim Output**:
```text
 ✓ src/components/forms-challenge.test.ts (30)
   ✓ MoulForm Adversarial Challenges (6)
     ✓ AD-FRM-01: Slotted controls registration and dynamic DOM mutations
     ✓ AD-FRM-02: Nested forms data containment and submit isolation
     ✓ AD-FRM-03: Rapid submit and reset storm (50 rapid alternating cycles)
     ✓ AD-FRM-04: Form reset restores defaultValue when configured
     ✓ AD-FRM-05: FormData collection across heterogeneous formAssociated controls with disabled filtering
     ✓ AD-FRM-06: Form validation error aggregation and novalidate bypass
   ✓ MoulTextField, MoulSearchField, MoulTextArea Adversarial Challenges (6)
     ✓ AD-TXT-01: Rapid character burst (10,000+ characters) on TextField without crash or memory leak
     ✓ AD-TXT-02: Property-based fuzzing of TextField with adversarial strings
     ✓ AD-TXT-03: Required constraint and error message truncation <= 200 chars
     ✓ AD-SCH-01: SearchField clear button lifecycle, rapid clicking, and Escape key dismissal
     ✓ AD-SCH-02: SearchField disabled and readonly states prevent clearing
     ✓ AD-TXA-01: TextArea autoResize under multiline flood (100+ line breaks)
   ✓ MoulNumberField Adversarial Challenges (5)
     ✓ AD-NUM-01: Stepper arrow key navigation, rapid bursts, and Home/End jumping
     ✓ AD-NUM-02: Boundary clamping and rangeUnderflow/rangeOverflow validation
     ✓ AD-NUM-03: Fuzzing invalid inputs (symbols, alpha text, empty, NaN)
     ✓ AD-NUM-04: Decimal step precision without arithmetic drift
     ✓ AD-NUM-05: Disabled and readonly immunity to stepper actions and keyboard events
   ✓ MoulSlider Adversarial Challenges (4)
     ✓ AD-SLD-01: Arrow key stepping and Home/End bounds snapping
     ✓ AD-SLD-02: Pointer coordinate clamping and sub-pixel snapping
     ✓ AD-SLD-03: Property-based fuzzing of slider min/max/step clamping
     ✓ AD-SLD-04: Disabled slider ignores all pointer and keyboard interactions
   ✓ MoulInputOTP Adversarial Challenges (5)
     ✓ AD-OTP-01: Paste storm (exact, overlong, partial, empty) and digit distribution
     ✓ AD-OTP-02: Pattern fuzzing and alphanumeric filtering
     ✓ AD-OTP-03: Bidirectional arrow navigation and backspace deletion traversal across empty slots
     ✓ AD-OTP-04: Shake animation trigger does not throw and complete event dispatch semantics
     ✓ AD-OTP-05: Form association and required completeness validation
   ✓ Empirical Verification of Discovered Defects (4)
     ✓ CHAL-DEFECT-01: MoulForm reset does not reset MoulNumberField or MoulSlider values
     ✓ CHAL-DEFECT-02: MoulSlider clampAndSnap breaches max bound when (max - min) is not divisible by step
     ✓ CHAL-DEFECT-03: Motion 3-keyframe spring invariant crash in InputOTP and NumberField
     ✓ CHAL-DEFECT-04: MoulTextField and MoulSearchField render aria-describedby="" when descriptions are empty

 Test Files  1 passed (1)
      Tests  30 passed (30)
   Start at  21:43:00
   Duration  759ms
```

### Full Regression Suite Execution
Executed all 6 component test suites:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/forms-challenge.test.ts
```
**Result**: 118 passed (118) across 6 test files in 4.04s.

### Code Quality & Dependency Verification
- **Biome Check**: `node ./node_modules/.bin/biome check ui/src/components/forms-challenge.test.ts`: Checked 1 file, 0 errors, 0 warnings.
- **Zero-React Dependency Guard**: `bun ./scripts/verify-no-react.ts all`:
  `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`

---

## Confirmed Empirical Defects

### Defect 1 (CRITICAL RUNTIME CRASH): Motion 13 Spring Invariant Crash on OTP Slot Typing
- **Location**: `ui/src/components/InputOTP/InputOTP.ts`, line 143:
  ```ts
  private handleSlotInput(event: Event, index: number): void {
    ...
    if (char && regex.test(char)) {
      ...
      subtleAnimate(input, { scale: [0.95, 1.04, 1] }, SPRING_SNAPPY)
  ```
- **Definition of `SPRING_SNAPPY`** (`ui/src/utils/motion.ts`, lines 9–14):
  ```ts
  export const SPRING_SNAPPY: AnimationOptions = {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.8,
  }
  ```
- **Observed Behavior**:
  In Motion 12+, physics spring engines (`{ type: 'spring' }`) strictly support at most two keyframes (`[from, to]` or `[to]`). Passing three keyframes `[0.95, 1.04, 1]` causes Motion's internal animation loop to throw:
  ```text
  Error: Only two keyframes currently supported with spring and inertia animations. Trying to animate 0.95,1.04,1. For more information and steps for solving, visit https://motion.dev/troubleshooting/spring-two-frames
   ❯ invariant ../node_modules/.bun/motion-utils@13.3.0/node_modules/motion-utils/src/errors.ts:24:19
   ❯ JSAnimation.initAnimation ../node_modules/.bun/motion-dom@13.4.1/node_modules/motion-dom/src/animation/JSAnimation.ts:125:13
  ```
  Whenever a user types any character into an OTP slot in normal browser environments (where `prefers-reduced-motion` is false), `handleSlotInput` triggers this uncaught exception.
- **Why Worker Missed It**:
  `Forms.test.ts` line 558 only tested clipboard paste (`pasteEvent`) and Backspace key events (`simulateKey(slots[5], 'Backspace')`). The worker never typed into a slot using `input` event dispatch, completely dodging `handleSlotInput`.
- **Mitigation**:
  Replace `SPRING_SNAPPY` with an easing animation that supports multi-point keyframe arrays (e.g. `{ duration: 0.2, ease: 'easeOut' }`), or reduce keyframes to 2 (e.g. `{ scale: [0.95, 1] }`).

---

### Defect 2 (CRITICAL RUNTIME CRASH): Motion 13 Spring Invariant Crash on NumberField Stepper Click
- **Location**: `ui/src/components/NumberField/NumberField.ts`, line 269:
  ```ts
  private animateStepperPress(btn: HTMLElement): void {
    subtleAnimate(btn, { scale: [1, 0.94, 1] }, SPRING_SNAPPY)
  }
  ```
- **Observed Behavior**:
  Clicking either the increase (`▲`) or decrease (`▼`) stepper button invokes `this.animateStepperPress(e.currentTarget)`. Because it supplies 3 keyframes `[1, 0.94, 1]` with `SPRING_SNAPPY`, Motion immediately throws:
  ```text
  Error: Only two keyframes currently supported with spring and inertia animations. Trying to animate 1,0.94,1.
  ```
- **Why Worker Missed It**:
  `Forms.test.ts` lines 267–289 only invoked `field.stepUp()`, `field.stepDown()`, and `simulateKey(input, 'ArrowUp')`. The worker never clicked the actual stepper `<button>` elements in the shadow root.
- **Mitigation**:
  Use `{ duration: 0.15, ease: 'easeInOut' }` or 2 keyframes `{ scale: [0.94, 1] }`.

---

### Defect 3 (CRITICAL CONSTRAINT BREACH): `MoulSlider.clampAndSnap` Breaches `max` Limit
- **Location**: `ui/src/components/Slider/Slider.ts`, lines 106–115:
  ```ts
  private clampAndSnap(val: number): number {
    const min = typeof this.min === 'number' ? this.min : 0
    const max = typeof this.max === 'number' ? this.max : 100
    const step = typeof this.step === 'number' && this.step > 0 ? this.step : 1

    const clamped = Math.min(Math.max(val, min), max)
    const steps = Math.round((clamped - min) / step)
    const snapped = min + steps * step
    return Number(snapped.toFixed(6))
  }
  ```
- **Observed Behavior**:
  `clamped` is calculated *before* snapping to `step`. However, if `(max - min)` is not an exact integer multiple of `step`, rounding `steps` can round UP and produce a value strictly greater than `max`!
  - **Empirical Example**: Let `min = 0`, `max = 5`, `step = 3`, `val = 5`.
    1. `clamped = Math.min(Math.max(5, 0), 5) = 5`.
    2. `steps = Math.round((5 - 0) / 3) = Math.round(1.666) = 2`.
    3. `snapped = 0 + 2 * 3 = 6`.
    4. `return 6`.
  - Result: `slider.value = 6`.
  - Blast Radius:
    - `slider.value` is `6` despite `max="5"`.
    - `aria-valuenow="6"` while `aria-valuemax="5"`, violating WAI-ARIA slider specifications.
    - `ElementInternals.setFormValue("6")` sends invalid data to `<form>` submissions.
- **Reproduced in Test**: `CHAL-DEFECT-02` in `forms-challenge.test.ts`.
- **Mitigation**:
  Clamp `snapped` again to `[min, max]` before returning:
  ```ts
  const clamped = Math.min(Math.max(val, min), max)
  const steps = Math.round((clamped - min) / step)
  const snapped = Math.min(Math.max(min + steps * step, min), max)
  return Number(snapped.toFixed(6))
  ```

---

### Defect 4 (HIGH FORM STATE DESYNC): `MoulForm.reset()` Fails to Reset Numeric Form Controls
- **Location**: `ui/src/components/Form/Form.ts`, lines 204–217:
  ```ts
    const controls = this.getControls()
    for (const ctrl of controls) {
      const anyCtrl = ctrl as any
      if (typeof anyCtrl.reset === 'function') {
        anyCtrl.reset()
      } else if (
        'value' in anyCtrl &&
        typeof anyCtrl.defaultValue !== 'undefined'
      ) {
        anyCtrl.value = anyCtrl.defaultValue
      } else if ('isChecked' in anyCtrl) {
        anyCtrl.isChecked = false
      } else if ('value' in anyCtrl && typeof anyCtrl.value === 'string') {
        anyCtrl.value = ''
      }
    }
  ```
- **Observed Behavior**:
  `MoulNumberField` and `MoulSlider` store numeric values (`value: number | null`).
  Neither component defines a `reset()` method, neither component defines a `defaultValue` property, and `typeof anyCtrl.value === 'string'` evaluates to `false` when `value` is a number (e.g. `typeof 99 === 'number'`).
  As a result, calling `form.reset()` leaves both `MoulNumberField` and `MoulSlider` completely untouched, keeping their dirty user-entered values!
- **Reproduced in Test**: `CHAL-DEFECT-01` in `forms-challenge.test.ts`.
- **Mitigation**:
  In `MoulNumberField` and `MoulSlider`, either:
  1. Implement a public `reset()` method (e.g. resetting to `defaultValue ?? min ?? 0`).
  2. Or update `Form.ts` line 214 to support numeric controls:
     ```ts
     } else if ('value' in anyCtrl && typeof anyCtrl.value === 'number') {
       anyCtrl.value = typeof anyCtrl.min === 'number' ? anyCtrl.min : 0
     }
     ```

---

### Defect 5 (MEDIUM ARIA LEAK): Lit `undefined` Serialization Leaks `aria-describedby=""`
- **Location**:
  - `ui/src/components/TextField/TextField.ts:187`
  - `ui/src/components/SearchField/SearchField.ts`
  - `ui/src/components/TextArea/TextArea.ts:195`
  ```html
  <input
    ...
    aria-describedby=${describedBy || undefined}
  />
  ```
- **Observed Behavior**:
  In Lit templates, passing `undefined` to an attribute does NOT omit or remove the attribute; Lit serializes `undefined` as `""` (empty string). When a field has no `description` and no `errorMessage`, the inner `<input>` or `<textarea>` renders with `aria-describedby=""`.
  In accessibility audits and assistive technology (VoiceOver / JAWS / NVDA), `aria-describedby=""` is invalid because an empty ID reference is treated as an unresolved node reference.
- **Reproduced in Test**: `CHAL-DEFECT-04` in `forms-challenge.test.ts`.
- **Mitigation**:
  Use `nothing` from `'lit'` instead of `undefined`:
  ```ts
  import { html, nothing } from 'lit'
  ...
  aria-describedby=${describedBy || nothing}
  ```

---

## 2. Logic Chain

1. **Defects 1 & 2 (Motion Invariant Violations)**:
   - `subtleAnimate` is a wrapper around `animate` from `'motion'`.
   - `SPRING_SNAPPY` is defined in `ui/src/utils/motion.ts` as `{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }`.
   - Motion 12/13 throws an invariant exception when an array of 3 or more keyframes is supplied with `type: 'spring'`.
   - `InputOTP.ts:143` passes `{ scale: [0.95, 1.04, 1] }` to `subtleAnimate` with `SPRING_SNAPPY`.
   - `NumberField.ts:269` passes `{ scale: [1, 0.94, 1] }` to `subtleAnimate` with `SPRING_SNAPPY`.
   - Ergo, keyboard typing into `moul-input-otp` and clicking stepper buttons on `moul-number-field` throw unhandled runtime errors in any environment where reduced motion is not forced.

2. **Defect 3 (Slider Boundary Breach)**:
   - `clampAndSnap` computes `clamped = Math.min(Math.max(val, min), max)`.
   - It then snaps to nearest step: `snapped = min + Math.round((clamped - min) / step) * step`.
   - When `(max - min)` is not a multiple of `step`, `Math.round()` can round upwards past `max`.
   - Because no secondary clamp is applied to `snapped`, `snapped > max`.
   - Fast-check property fuzzing counterexample `[0, 5, 3, 5]` proved `slider.value` becomes `6`, which exceeds `slider.max=5`.

3. **Defect 4 (Form Reset Desync)**:
   - `MoulForm.handleReset` iterates over all slotted controls.
   - For controls without `.reset()` or `.defaultValue`, it only clears `.value` if `typeof anyCtrl.value === 'string'`.
   - `MoulNumberField` and `MoulSlider` have numeric values (`typeof value === 'number'`).
   - Neither implements `.reset()`.
   - Ergo, `form.reset()` ignores them and does not clear or restore their initial values.

---

## 3. Caveats

- In headless test environments (`happy-dom`), DOM layout dimensions (`track.getBoundingClientRect().width` on Slider) return 0 unless explicitly mocked. Our stress tests mocked `getBoundingClientRect` to test drag interactions accurately.
- `Forms.test.ts` passed 17/17 tests in the worker phase only because the worker wrote superficial happy-path tests (e.g. testing paste instead of typing in OTP, calling `stepUp()` directly instead of clicking stepper buttons in NumberField, and only checking string fields on form reset).

---

## 4. Conclusion

The adversarial review verdict is **REQUEST_CHANGES**.

The implementation cannot be approved in its current state because:
1. `moul-input-otp` crashes when users type into slot inputs.
2. `moul-number-field` crashes when users click the stepper buttons.
3. `moul-slider` produces invalid values greater than `max`, breaking ARIA range semantics and form data.
4. `moul-form` fails to reset `moul-number-field` and `moul-slider`.
5. `moul-text-field`, `moul-search-field`, and `moul-text-area` render invalid `aria-describedby=""`.

A remediation worker must be dispatched to fix these five issues in the component implementations.

---

## 5. Verification Method

To independently reproduce all tests and confirm findings:

1. **Run the Adversarial Challenge Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts
   ```
   *Expected: 30 passed (30), including 4 explicit empirical defect verification tests.*

2. **Run Biome Linter**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components/forms-challenge.test.ts
   ```
   *Expected: Checked 1 file, 0 errors, 0 warnings.*

3. **Run Zero-React Constraint Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected: 0 disallowed packages.*

4. **Run Full Component Regression Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/forms-challenge.test.ts
   ```
   *Expected: 6 passed (118 passed).*
