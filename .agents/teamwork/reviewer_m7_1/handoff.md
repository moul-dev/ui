# Review Report: Milestone 7 (Phase 7: Input & Form Components)

**Reviewer**: `reviewer_m7_1`  
**Date**: 2026-10-16T14:43:00Z  
**Verdict**: **`REQUEST_CHANGES`**  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (parent orchestrator)

---

## 1. Observation

### 1.1 Baseline Verification Commands

1. **Unit Test Suite (`Forms.test.ts`)**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts
   ```
   **Output**:
   ```
   Test Files  1 passed (1)
        Tests  17 passed (17)
     Duration  727ms
   ```
   *Note*: The run passed, but stderr surfaced runtime warnings from `safeShowModal` on `Select`, `ComboBox`, and `DatePicker`:
   ```
   stderr | src/components/Forms.test.ts > Input & Form Components (Phase 7) > MoulSelect (`moul-select`) > FRM-SEL-01: Popover dropdown toggle, item selection, and events
   [@moul-dev/ui] Failed to call dialog.showModal() (element may be disconnected): TypeError: dialog.showModal is not a function
       at Module.safeShowModal (/Users/phearak/github/orgs/moul-dev/ui/ui/src/utils/focus-trap.ts:204:14)
       at OverlayPresenceController.promoteTopLayer (/Users/phearak/github/orgs/moul-dev/ui/ui/src/controllers/overlay-presence.controller.ts:187:7)
       at OverlayPresenceController.setOpen (/Users/phearak/github/orgs/moul-dev/ui/ui/src/controllers/overlay-presence.controller.ts:90:12)
   ```

2. **Zero-React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   **Output**:
   ```
   ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
   ```

3. **Combined Regression Run across Phases 4–7**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts
   ```
   **Output**:
   ```
   Test Files  5 passed (5)
        Tests  88 passed (88)
     Duration  4.01s
   ```

4. **Linter & Formatter (`Biome`)**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components
   ```
   **Output**:
   ```
   Checked 215 files in 84ms. No fixes applied. Found 0 errors, 3 warnings (warnings in untouched legacy files).
   ```

---

### 1.2 Adversarial Stress Testing Results

Running the empirical challenge suites `forms-challenge.test.ts` and `pickers-challenge.test.ts`:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts
```
**Output**:
```
Test Files  2 failed (2)
     Tests  4 failed | 55 passed (59)
    Errors  1 uncaught exception
```

#### Observation A: Uncaught Motion Exception in `MoulInputOTP`
In `ui/src/components/InputOTP/InputOTP.ts:143`:
```ts
subtleAnimate(input, { scale: [0.95, 1.04, 1] }, SPRING_SNAPPY)
```
During digit input, Vitest caught an unhandled exception thrown directly from `motion`:
```
Error: Only two keyframes currently supported with spring and inertia animations. Trying to animate 0.95,1.04,1. For more information and steps for solving, visit https://motion.dev/troubleshooting/spring-two-frames
 ❯ invariant node_modules/motion-utils/src/errors.ts:24:19
 ❯ JSAnimation.initAnimation node_modules/motion-dom/src/animation/JSAnimation.ts:125:13
 ❯ new JSAnimation node_modules/motion-dom/src/animation/JSAnimation.ts:96:14
 ❯ AsyncMotionValueAnimation.onKeyframesResolved node_modules/motion-dom/src/animation/AsyncMotionValueAnimation.ts:188:25
```

#### Observation B: Child Disabled State Clobbered in `RadioGroup` and `CheckboxGroup`
In `src/components/pickers-challenge.test.ts`:
```
FAIL CHAL-RAD-03: Skipping disabled radios during arrow key roving navigation
AssertionError: expected false to be true
  - Expected: true
  + Received: false
  line 463: expect(radios[1].isDisabled).toBe(true)

FAIL CHAL-CKG-05: CheckboxGroup preserves individual child checkbox is-disabled state when group is not disabled
AssertionError: expected false to be true
  - Expected: true
  + Received: false
  line 369: expect(cbs[1].isDisabled).toBe(true)
```
Inspection of `ui/src/components/RadioGroup/RadioGroup.ts:68-72`:
```ts
    if (changedProperties.has('isDisabled')) {
      for (const r of this.radios) {
        r.isDisabled = this.isDisabled
      }
    }
```
And `ui/src/components/Checkbox/CheckboxGroup.ts:82-86`:
```ts
    if (changedProperties.has('isDisabled')) {
      for (const cb of this.checkboxes) {
        cb.isDisabled = this.isDisabled
      }
    }
```
On initial mount of the group, `changedProperties.has('isDisabled')` is `true` while `this.isDisabled` defaults to `false`. The parent group forcibly sets `r.isDisabled = false` on every child item, destroying the child's own `is-disabled` configuration.

#### Observation C: `safeShowModal` Runtime Error on `Select`, `ComboBox`, and `DatePicker`
In `ui/src/components/Select/Select.ts:49`, `ui/src/components/ComboBox/ComboBox.ts:52`, and `ui/src/components/DatePicker/DatePicker.ts:57`:
```ts
    this.overlayController = new OverlayPresenceController(this, {
      preset: 'popover',
      dialog: () => this.popoverElement as any,
    })
```
Where `this.popoverElement` is defined as:
```ts
  public get popoverElement(): HTMLElement | null {
    return this.renderRoot?.querySelector('[part="popover"]') ?? null
  }
```
Which returns an `HTMLDivElement` (`div[part="popover"]`), NOT an `HTMLDialogElement`.
When `setOpen(true)` is called, `OverlayPresenceController.promoteTopLayer()` executes `safeShowModal(dialog)` on that `<div>`, causing:
`TypeError: dialog.showModal is not a function`.
Furthermore, `popover:` is omitted from `OverlayPresenceControllerOptions` and `[part="popover"]` lacks `popover="auto"` or `popover="manual"`.

#### Observation D: Broken Sequential Keyboard Traversal in `MoulComboBox`
In `src/components/pickers-challenge.test.ts`:
```
FAIL CHAL-CMB-05: Sequential keyboard navigation when focus moves to active descendant item
AssertionError: expected <moul-combobox-item key="opt1"> to be <moul-combobox-item key="opt2">
  line 940: expect(document.activeElement).toBe(items[1])
```
Inspection of `ui/src/components/ComboBox/ComboBox.ts:318`:
The `@keydown=${this.handleKeyDown}` listener is attached strictly to `<input id="input">`:
```html
<input
  id="input"
  part="input"
  type="text"
  ...
  @input=${this.handleInput}
  @keydown=${this.handleKeyDown}
/>
```
In `handleKeyDown`, arrow keys focus active child items (`visible[this.activeIndex]?.focus()`). Once focus moves to a `moul-combobox-item`, subsequent arrow key events are dispatched to that item, completely bypassing the input's keydown listener, freezing keyboard navigation in the listbox. (In contrast, `MoulSelect` correctly attaches `@keydown` on `<div part="base">` enclosing the entire component).

---

## 2. Logic Chain

1. **Integrity Assessment**:
   - There are zero hardcoded test returns or fake facades.
   - All 15 components implement real Lit templates, shadow DOM, FormInternalsController, reactive properties, and CSS variables.
   - There are zero legacy React remnants (`verify-no-react.ts all` exits 0).
   - The defects found are authentic implementation bugs, NOT integrity violations.

2. **Root Cause Analysis of Defects**:
   - **Defect 1 (Critical — Uncaught Motion Exception in `InputOTP.ts`)**:
     `subtleAnimate(input, { scale: [0.95, 1.04, 1] }, SPRING_SNAPPY)` violates the Motion engine invariant that spring-physics transitions can only interpolate between exactly two values (start and end). Providing 3 values throws an uncaught Error on every keystroke in production.
     *Remediation*: Animate scale with 2 keyframes (e.g. `{ scale: [1.06, 1] }`, `SPRING_SNAPPY`), or use duration/easing (e.g. `{ duration: 0.18, ease: 'easeOut' }`).
   - **Defect 2 (Critical — Child Disabled State Clobbered in Groups)**:
     In `RadioGroup.ts` and `CheckboxGroup.ts`, unconditionally looping over children during `willUpdate` and assigning `child.isDisabled = this.isDisabled` unconditionally resets all children to `false` when the group itself is not disabled.
     *Remediation*: Only propagate disabled state when the group itself is disabled:
     `if (this.isDisabled) { for (const item of this.items) item.isDisabled = true; }`
     or record the child's intrinsic disabled state so it is preserved.
   - **Defect 3 (Major — `safeShowModal` TypeError in `Select`, `ComboBox`, `DatePicker`)**:
     Passing `dialog: () => this.popoverElement as any` causes `OverlayPresenceController` to treat a standard `<div>` as a `<dialog>`.
     *Remediation*: Change the controller configuration to:
     ```ts
     this.overlayController = new OverlayPresenceController(this, {
       preset: 'popover',
       popover: () => this.popoverElement,
       target: () => this.popoverElement,
     })
     ```
     and add `popover="auto"` or `popover="manual"` to `div[part="popover"]`.
   - **Defect 4 (Major — ComboBox Keyboard Navigation Trapping)**:
     Placing `@keydown` solely on `<input>` prevents the combobox from receiving keyboard events once focus leaves the input and enters the slotted items.
     *Remediation*: Move `@keydown=${this.handleKeyDown}` to `<div part="base">` (identical to `MoulSelect`) so keyboard events anywhere inside the combobox are captured.

---

## 3. Caveats

- **Vitest `Forms.test.ts`**: The 17 baseline tests passed because they exercised happy-path single-press scenarios without testing multi-keyframe OTP input, disabled radios inside non-disabled groups, or sequential combobox descendant item key traversal.
- **`tsc` test error**: In `Forms.test.ts:171–173`, `submittedFormData?.get(...)` flags `Property 'get' does not exist on type 'never'` during isolated `tsc` checks because `submittedFormData` is initialized to `null` and assigned inside an event callback. A simple `(submittedFormData as FormData)?.get(...)` type cast will keep isolated typechecks clean.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While the foundational zero-React architecture, FormInternalsController binding, and barrel exports are properly scaffolded, Milestone 7 cannot be approved until the following 4 issues are remediated:

1. **Fix Motion 3-keyframe exception in `InputOTP.ts:143`**:
   Change `{ scale: [0.95, 1.04, 1] }, SPRING_SNAPPY` to two keyframes (e.g. `{ scale: [1.06, 1] }`) so `motion` does not throw an invariant error on keystroke.
2. **Fix child disabled clobbering in `RadioGroup.ts:68-72` and `CheckboxGroup.ts:82-86`**:
   Ensure `group.isDisabled = false` does not overwrite individually disabled child radios or checkboxes.
3. **Fix `safeShowModal` TypeError in `Select.ts:49`, `ComboBox.ts:52`, and `DatePicker.ts:57`**:
   Pass `popover: () => this.popoverElement` (not `dialog:`) to `OverlayPresenceController`, and set `popover="auto"` on `[part="popover"]`.
4. **Fix ComboBox keyboard traversal in `ComboBox.ts:318`**:
   Move `@keydown=${this.handleKeyDown}` from `<input>` to `<div part="base">` so arrow navigation continues to function when focus moves to list items.

---

## 5. Verification Method

To verify the remediation:

1. **Verify Baseline Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Forms.test.ts
   ```
   *Expected*: 17/17 passed with **zero** `TypeError: dialog.showModal is not a function` in stderr.

2. **Verify Adversarial Stress Suites**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts
   ```
   *Expected*: `CHAL-CKG-05`, `CHAL-RAD-03`, `CHAL-CMB-05` pass, and zero uncaught Motion keyframe exceptions occur.

3. **Verify Zero React Dependencies**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected*: Zero disallowed React packages found.

4. **Verify Linter**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components
   ```
   *Expected*: 0 errors.
