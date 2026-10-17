# Challenge Handoff Report: Milestone 7 Selection & Picker Controls

**Agent**: `challenger_m7_2`  
**Date**: 2026-10-16T14:42:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  
**Status**: Challenged — Defects Identified  
**Verdict**: **`REQUEST_CHANGES`**

---

## Challenge Summary

**Overall risk assessment**: **HIGH**

Empirical stress testing of Selection & Picker controls (`moul-checkbox`, `moul-checkbox-group`, `moul-radio-group`, `moul-radio`, `moul-switch`, `moul-select`, `moul-combobox`, `moul-calendar`, `moul-date-picker`) under extreme workloads (50–100 rapid toggle clicks, 50-item open/close storms, roving keyboard navigation across 50 items, decade jump calendar traversal) uncovered **3 critical behavioral defects** that compromise component state integrity and accessibility.

---

## 1. Observation

1. **Test Suite Authoring**:
   - Created `ui/src/components/pickers-challenge.test.ts` with 35 empirical adversarial stress tests covering all 7 target components and their slotted children.
   - Code quality and formatting verified via Biome:
     ```bash
     node ./node_modules/.bin/biome check ui/src/components/pickers-challenge.test.ts
     ```
     Result: `Checked 1 file in 17ms. No fixes applied.` (0 errors, 0 warnings).

2. **Test Execution Results**:
   - Command executed:
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/pickers-challenge.test.ts
     ```
   - Result: **32 passed, 3 failed** out of 35 tests (Duration: 806ms).

3. **Verbatim Failures Observed**:

   - **Failure 1 — `MoulCheckboxGroup` clobbers child `is-disabled` on initialization (`CHAL-CKG-05`)**:
     ```
     FAIL src/components/pickers-challenge.test.ts > Empirical Adversarial Stress Suite: Pickers & Selection Controls (Phase 7) > MoulCheckbox & MoulCheckboxGroup Adversarial Stress > CHAL-CKG-05: CheckboxGroup preserves individual child checkbox is-disabled state when group is not disabled
     AssertionError: expected false to be true // Object.is equality

     - Expected
     + Received

     - true
     + false

      ❯ src/components/pickers-challenge.test.ts:369:33
         367|       const cbs = group.checkboxes
         368|       expect(cbs[0].isDisabled).toBe(false)
         369|       expect(cbs[1].isDisabled).toBe(true)
            |                                 ^
         370|       expect(cbs[2].isDisabled).toBe(false)
     ```

   - **Failure 2 — `MoulRadioGroup` clobbers child `is-disabled` on initialization and breaks roving keyboard navigation skipping (`CHAL-RAD-03`)**:
     ```
     FAIL src/components/pickers-challenge.test.ts > Empirical Adversarial Stress Suite: Pickers & Selection Controls (Phase 7) > MoulRadioGroup & MoulRadio Adversarial Stress > CHAL-RAD-03: Skipping disabled radios during arrow key roving navigation
     AssertionError: expected false to be true // Object.is equality

     - Expected
     + Received

     - true
     + false

      ❯ src/components/pickers-challenge.test.ts:463:36
         461| 
         462|       const radios = group.radios
         463|       expect(radios[1].isDisabled).toBe(true)
            |                                    ^
         464| 
         465|       // ArrowDown from tier1 must skip disabled tier2 and land directly on tier3
     ```

   - **Failure 3 — `MoulComboBox` drops all sequential keyboard navigation events after focus moves to active descendant item (`CHAL-CMB-05`)**:
     ```
     FAIL src/components/pickers-challenge.test.ts > Empirical Adversarial Stress Suite: Pickers & Selection Controls (Phase 7) > MoulSelect & MoulComboBox Adversarial Stress > CHAL-CMB-05: Sequential keyboard navigation when focus moves to active descendant item
     AssertionError: expected <moul-combobox-item …(4)></moul-combobox-item> to be <moul-combobox-item …(4)></moul-combobox-item> // Object.is equality

     - Expected
     + Received

       <moul-combobox-item
     -   key="opt2"
     +   key="opt1"
         role="option"
         tabindex="-1"
     -   text-value="Option 2"
     +   text-value="Option 1"
       >
     -   Option 2
     +   Option 1
       </moul-combobox-item>

      ❯ src/components/pickers-challenge.test.ts:940:38
         938|       // In real browser keyboard navigation, subsequent key events are dispatched to document.activeElement
         939|       await simulateKey(document.activeElement as HTMLElement, 'ArrowDown')
         940|       expect(document.activeElement).toBe(items[1])
            |                                      ^
         941| 
         942|       await simulateKey(document.activeElement as HTMLElement, 'Enter')
     ```

---

## 2. Logic Chain

### Defect 1 & Defect 2: Unconditional Child `isDisabled` Reset During Group Initial Lifecycle (`MoulCheckboxGroup` & `MoulRadioGroup`)

1. **Source Code**:
   - `ui/src/components/Checkbox/CheckboxGroup.ts` lines 82–86:
     ```ts
     if (changedProperties.has('isDisabled')) {
       for (const cb of this.checkboxes) {
         cb.isDisabled = this.isDisabled
       }
     }
     ```
   - `ui/src/components/RadioGroup/RadioGroup.ts` lines 68–72:
     ```ts
     if (changedProperties.has('isDisabled')) {
       for (const r of this.radios) {
         r.isDisabled = this.isDisabled
       }
     }
     ```
2. **Mechanism**:
   - In Lit 3 lifecycle semantics, `changedProperties` in the initial `willUpdate` call contains every declared property with its previous value `undefined`.
   - Therefore, `changedProperties.has('isDisabled')` evaluates to **`true`** on the very first render for both `MoulCheckboxGroup` and `MoulRadioGroup`.
   - Because `this.isDisabled` defaults to `false`, the group loops over all child elements (`this.checkboxes` / `this.radios`) and unconditionally executes `cb.isDisabled = false` / `r.isDisabled = false`.
3. **Impact**:
   - Any consumer declaring individually disabled items (e.g. `<moul-checkbox value="opt1" is-disabled>` or `<moul-radio value="tier2" is-disabled>`) has their disabled state immediately overwritten and erased upon mount.
   - For `MoulRadioGroup`, disabled radios become active, allowing users to select disabled radio options and breaking roving keyboard navigation skipping (ArrowDown/ArrowUp land on disabled options instead of skipping them).
4. **Remediation**:
   - Only propagate `isDisabled` downward when the group itself is actually disabled (`this.isDisabled === true`), or verify that `changedProperties.get('isDisabled') !== undefined`:
     ```ts
     // In CheckboxGroup.ts and RadioGroup.ts:
     if (changedProperties.has('isDisabled') && this.isDisabled) {
       for (const child of this.items) {
         child.isDisabled = true
       }
     }
     ```
   - This ensures a disabled group disables all children, while an enabled group allows individual children to remain disabled.

---

### Defect 3: Scoping of `@keydown` to `<input>` in `MoulComboBox` Drops All Subsequent Navigation Events

1. **Source Code**:
   - `ui/src/components/ComboBox/ComboBox.ts` line 319:
     ```html
     <input
       id="input"
       part="input"
       type="text"
       role="combobox"
       aria-autocomplete="list"
       aria-expanded=${this.isOpen ? 'true' : 'false'}
       placeholder=${this.placeholder}
       .value=${this.inputValue}
       ?disabled=${this.isDisabled}
       ?required=${this.isRequired}
       aria-invalid=${isInvalid ? 'true' : 'false'}
       @input=${this.handleInput}
       @keydown=${this.handleKeyDown}
     />
     ```
   - Focus transition in `ComboBox.ts` lines 260–263:
     ```ts
     if (event.key === 'ArrowDown') {
       event.preventDefault()
       this.activeIndex = (this.activeIndex + 1) % visible.length
       visible[this.activeIndex]?.focus()
     }
     ```
2. **Mechanism**:
   - When a user presses `ArrowDown` inside `<input>`, `this.handleKeyDown` triggers, advances `this.activeIndex = 0`, and calls `visible[0]?.focus()`.
   - Calling `focus()` moves the browser's active focus target (`document.activeElement`) from `<input>` to the slotted `<moul-combobox-item>`.
   - When the user presses `ArrowDown` a second time, or presses `Enter` to commit, or presses `Escape` to close, the browser fires the `keydown` event on `document.activeElement` (`<moul-combobox-item>`).
   - In DOM event propagation, keyboard events bubble UP through DOM ancestor trees (`<moul-combobox-item>` -> `<slot>` -> `<div part="popover">` -> `<div part="base">` -> shadow root -> `<moul-combobox>`).
   - Because `<input>` is a sibling of `<div part="popover">`, the event never enters or bubbles through `<input>`.
   - And because `MoulComboBox` only binds `@keydown` to `<input>` (unlike `MoulSelect`, which binds `@keydown` to `<div part="base">`), no element handles the keydown event.
3. **Impact**:
   - The user can never advance past the first item using keyboard navigation.
   - The user cannot press `Enter` to select an option once navigated to it.
   - The user cannot press `Escape` to dismiss the combobox popover once focus has entered the listbox.
4. **Remediation**:
   - Move or duplicate the `@keydown=${this.handleKeyDown}` listener to `<div part="base">` (or attach it to `this` during `connectedCallback`), matching the accessible pattern implemented in `MoulSelect`:
     ```html
     <div part="base" @keydown=${this.handleKeyDown}>
     ```
   - Alternatively, maintain focus on `<input>` and manage active item highlight via `aria-activedescendant`.

---

## 3. Stress Test Results

| Test ID | Component | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| `CHAL-CHK-01` | `moul-checkbox` | 50 rapid click toggles | State parity maintained, exactly 50 change events | Parity maintained, 50 change events | **PASS** |
| `CHAL-CHK-02` | `moul-checkbox` | Indeterminate transitions & Space key | Clears indeterminate to false, toggles checked | Indeterminate cleared, aria-checked mixed -> true -> false | **PASS** |
| `CHAL-CHK-03` | `moul-checkbox` | Disabled checkbox click & Space key | No state mutation, 0 events fired | Completely suppressed | **PASS** |
| `CHAL-CKG-01` | `moul-checkbox-group` | 50 rapid clicks across 5 child checkboxes | Aggregate value matches exact set of checked values | Aggregate value clean, 50 events | **PASS** |
| `CHAL-CKG-02` | `moul-checkbox-group` | Event isolation & deduplication | Container listener receives only group event, no raw child leaks | Single aggregate change event with array value | **PASS** |
| `CHAL-CKG-03` | `moul-checkbox-group` | Group disabled state propagation | Disables all child checkboxes | All children disabled, clicks suppressed | **PASS** |
| `CHAL-CKG-04` | `moul-checkbox-group` | Form validity & isRequired constraint | `valueMissing` when empty, valid when >= 1 checked | Validity flags correctly set and cleared | **PASS** |
| `CHAL-CKG-05` | `moul-checkbox-group` | Individual child disabled preservation | Slotted child `<moul-checkbox is-disabled>` remains disabled | Overwritten to `isDisabled = false` by group | **FAIL** |
| `CHAL-RAD-01` | `moul-radio-group` | Arrow key roving navigation (4 directions) | ArrowDown/Right advances, ArrowUp/Left rewinds | Roving focus and checked state update cleanly | **PASS** |
| `CHAL-RAD-02` | `moul-radio-group` | Circular boundary wrapping | ArrowDown on last wraps to 0; ArrowUp on 0 wraps to last | Wraps accurately in both directions | **PASS** |
| `CHAL-RAD-03` | `moul-radio-group` | Disabled radio skipping during roving navigation | Arrow navigation skips disabled option | Overwritten to `isDisabled = false` by group | **FAIL** |
| `CHAL-RAD-04` | `moul-radio-group` | 50 rapid random clicks across radios | Strictly one radio checked at any time | Mutual exclusion preserved 100% | **PASS** |
| `CHAL-RAD-05` | `moul-radio-group` | Arrow navigation from unselected state | ArrowDown selects 0; ArrowUp selects last | Selects correct default items | **PASS** |
| `CHAL-SWT-01` | `moul-switch` | 100 rapid click toggles | State parity maintained, exactly 100 change events | Parity maintained, 100 events | **PASS** |
| `CHAL-SWT-02` | `moul-switch` | Keyboard toggles (Enter and Space) | Both keys toggle switch state | Successfully toggled | **PASS** |
| `CHAL-SWT-03` | `moul-switch` | Disabled switch suppression | Clicks, Enter, and Space keys ignored | Fully suppressed | **PASS** |
| `CHAL-SWT-04` | `moul-switch` | FormInternals value sync | String value when checked, null when unchecked | Synced accurately | **PASS** |
| `CHAL-SEL-01` | `moul-select` | 50 items dropdown open/close storm (50 rapid toggles) | Smooth toggles, no deadlock | 50 cycles executed without hanging | **PASS** |
| `CHAL-SEL-02` | `moul-select` | 50 items keyboard navigation & circular wrapping | Arrow traversal, wrapping 0 <-> 49, Enter commits | All selections committed cleanly | **PASS** |
| `CHAL-SEL-03` | `moul-select` | Skipping disabled items in select list | Skips disabled option during arrow traversal | Disabled item skipped | **PASS** |
| `CHAL-SEL-04` | `moul-select` | Escape key dismissal | Closes popover, restores focus to trigger | Dropdown closed, selection untouched | **PASS** |
| `CHAL-SEL-05` | `moul-select` | isRequired form validation | Enforces selection before validity passes | `valueMissing` flagged and cleared | **PASS** |
| `CHAL-CMB-01` | `moul-combobox` | 50 items dropdown open/close storm | Toggles cleanly without deadlock | 50 cycles completed | **PASS** |
| `CHAL-CMB-02` | `moul-combobox` | Live search filtering of 50 items & empty state | Matches filter query, shows "No results found" on empty | Filtering and empty state working | **PASS** |
| `CHAL-CMB-03` | `moul-combobox` | Custom value commit & FormInternals sync | Value accepted and submitted in form data | Custom input synced to FormInternals | **PASS** |
| `CHAL-CMB-04` | `moul-combobox` | Basic keyboard open, Enter select, Escape dismiss | ArrowDown opens, Escape closes, Enter selects | Operates cleanly from input | **PASS** |
| `CHAL-CMB-05` | `moul-combobox` | Sequential arrow navigation when item is focused | Subsequent ArrowDown/Enter keys dispatched to activeElement work | Keys dropped; focus stuck on first item | **FAIL** |
| `CHAL-CAL-01` | `moul-calendar` | Navigation storm (24 next, 36 prev, 120 decade jump) | Year & month accurate, no NaN, valid grid | Decade jump (2026 -> 2015) clean | **PASS** |
| `CHAL-CAL-02` | `moul-calendar` | minDate and maxDate boundary clamps | Dates outside clamp are unclickable, disabled | Out-of-bounds rejected, in-bounds selected | **PASS** |
| `CHAL-CAL-03` | `moul-calendar` | Keyboard grid traversal & month crossing | Arrow keys (+/- 1 day, +/- 7 days), PageUp/Down, Oct 31 -> Nov 01 | Seamless month transition | **PASS** |
| `CHAL-CAL-04` | `moul-calendar` | Locale internationalization (fr-FR, ja-JP) | Months and headers localized | "juillet 2026", "2026年7月" rendered | **PASS** |
| `CHAL-DTP-01` | `moul-date-picker` | 50 open/close bursts via trigger button | Rapidly toggles without hanging | 50 cycles completed | **PASS** |
| `CHAL-DTP-02` | `moul-date-picker` | Calendar popover selection & display format | Selects date, closes popover, formats display ("Mar 25, 2026") | Selection, formatting, and events passed | **PASS** |
| `CHAL-DTP-03` | `moul-date-picker` | Escape key dismissal | Closes popover, restores focus to input | Closed cleanly | **PASS** |
| `CHAL-DTP-04` | `moul-date-picker` | isRequired validation | Empty date flags valueMissing, valid date passes | Validation synced with FormInternals | **PASS** |

---

## 4. Caveats

- Tests were run in Happy DOM environment with ElementInternals and Popover shims.
- Virtualized list rendering for very large datasets (10,000+ items) is not implemented in Phase 7 and was not tested.
- No caveats regarding reproducibility: all 3 failures reproduce deterministically with 100% consistency.

---

## 5. Conclusion

**Verdict**: **`REQUEST_CHANGES`**

While 32 of 35 stress tests passed, the 3 identified defects break basic component functionality:
1. `MoulCheckboxGroup` wipes out individual child checkbox disabled states.
2. `MoulRadioGroup` wipes out individual child radio disabled states and breaks roving focus navigation.
3. `MoulComboBox` drops keyboard navigation after the first ArrowDown because `@keydown` is not bound to the container or item elements.

These defects must be remediated by the worker before Milestone 7 can be approved.

---

## 6. Verification Method

To independently reproduce and verify these findings:

1. **Run the Challenge Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/pickers-challenge.test.ts
   ```
   *Expected Output*: Exactly 3 failed (`CHAL-CKG-05`, `CHAL-RAD-03`, `CHAL-CMB-05`), 32 passed.

2. **Verify Biome Cleanliness**:
   ```bash
   node ./node_modules/.bin/biome check ui/src/components/pickers-challenge.test.ts
   ```
   *Expected Output*: `Checked 1 file in 17ms. No fixes applied.` (0 errors, 0 warnings).
