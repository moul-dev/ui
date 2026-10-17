# Challenge Handoff Report: Milestone 6 Overlay & Navigation Components

**Agent**: `challenger_m6_2`  
**Date**: 2026-10-16T13:48:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  
**Status**: Challenged — Defects Identified  
**Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

1. **Test Suite Authoring**:
   Created `ui/src/components/overlays-challenge.test.ts` containing 27 empirical adversarial stress tests targeting `moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-popover`, `moul-tooltip`, and `moul-command-palette`.
   Lint and format check passed cleanly:
   `./node_modules/.bin/biome check ui/src/components/overlays-challenge.test.ts` -> 0 errors, 0 warnings.

2. **Test Execution Results**:
   Command: `node ui/node_modules/.bin/vitest run --root ui src/components/overlays-challenge.test.ts`
   Result: **22 passed, 5 failed** out of 27 tests (Duration: 14.83s).

3. **Verbatim Failures Observed**:

   - **Failure 1 — Deadlock on Disconnected `setOpen(true)` in Modal**:
     ```
     FAIL src/components/overlays-challenge.test.ts > CHAL-MOD-04: Detached element handling: invoking open=true and setOpen(true) when disconnected
     Error: Deadlock: setOpen(true) hung on detached element awaiting host.updateComplete
     at Timeout._onTimeout (src/components/overlays-challenge.test.ts:225:15)
     ```

   - **Failure 2 — Deadlock on Disconnected `setOpen(true)` in AlertDialog**:
     ```
     FAIL src/components/overlays-challenge.test.ts > CHAL-ALT-03: Detached alert dialog setOpen resilience without throwing
     Error: Deadlock: setOpen(true) hung on detached alert dialog awaiting host.updateComplete
     at Timeout._onTimeout (src/components/overlays-challenge.test.ts:439:15)
     ```

   - **Failure 3 — Deadlock on Disconnected `setOpen(true)` in Drawer**:
     ```
     FAIL src/components/overlays-challenge.test.ts > CHAL-DRW-03: Detached drawer handling and outside backdrop clicks
     Error: Deadlock: setOpen(true) hung on detached drawer awaiting host.updateComplete
     at Timeout._onTimeout (src/components/overlays-challenge.test.ts:543:15)
     ```

   - **Failure 4 — Deadlock on Disconnected `setOpen(true)` in CommandPalette**:
     ```
     FAIL src/components/overlays-challenge.test.ts > CHAL-CMD-05: Global shortcut toggling (Cmd+K / Ctrl+K) and detached resilience
     Error: Deadlock: setOpen(true) hung on detached command palette awaiting host.updateComplete
     at Timeout._onTimeout (src/components/overlays-challenge.test.ts:994:15)
     ```

   - **Failure 5 — Focus Trapping Fails on Slotted Modal Elements**:
     ```
     FAIL src/components/overlays-challenge.test.ts > CHAL-MOD-07: Focus trapping cycles between first and last focusable elements on Tab and Shift+Tab
     AssertionError: expected <button id="first-el"></button> to be <button id="second-el"></button> // Object.is equality

     - Expected
     + Received

       <button
     -   id="second-el"
     +   id="first-el"
       >
     -   Second
     +   First
       </button>
     at src/components/overlays-challenge.test.ts:355:38
     ```

---

## 2. Logic Chain

### Defect 1: Indefinite Promise Deadlock on Disconnected `setOpen(true)` Calls
1. **Source Code**: `ui/src/controllers/overlay-presence.controller.ts` lines 80–86:
   ```ts
   // Allow Lit template to render DOM if unmounted
   if (
     (this.host as unknown as { updateComplete?: Promise<boolean> })
       .updateComplete
   ) {
     await (this.host as unknown as { updateComplete: Promise<boolean> })
       .updateComplete
   }
   ```
2. **Mechanism**:
   In Lit 3, custom elements suspend update cycles while disconnected (`element.isConnected === false`). When `this.host.requestUpdate()` is called on a disconnected element, `this.host.updateComplete` returns a pending Promise that **never resolves** until the element is attached to a live document.
3. **Impact**:
   When any consumer or caller calls `await element.setOpen(true)` on a disconnected `MoulModal`, `MoulAlertDialog`, `MoulDrawer`, or `MoulCommandPalette`, the execution hangs indefinitely at line 84.
   Line 89 (`this.promoteTopLayer()`) and `safeShowModal()` are never reached.
4. **Remediation**:
   Guard the update await with `this.host.isConnected`:
   ```ts
   if (
     this.host.isConnected &&
     (this.host as unknown as { updateComplete?: Promise<boolean> })
       .updateComplete
   ) {
     await (this.host as unknown as { updateComplete: Promise<boolean> })
       .updateComplete
   }
   ```
   If disconnected, skip `updateComplete` and immediately proceed to `this.promoteTopLayer()`, which safely invokes `safeShowModal()` and catches the disconnected `DOMException` with a warning as specified in Requirement 6.10.

---

### Defect 2: Broken Keyboard Focus Trapping for Slotted Content in Shadow DOM
1. **Source Code**:
   `ui/src/components/Modal/Modal.ts` lines 126–131:
   ```ts
   if (e.key === 'Tab') {
     const dialog = this.dialogEl
     if (dialog) {
       trapFocus(dialog, e)
     }
   }
   ```
   and `ui/src/utils/focus-trap.ts` lines 40–44:
   ```ts
   export function getFocusableElements(container: HTMLElement): HTMLElement[] {
     if (!container) return []
     const elements = Array.from(
       container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
     )
   ```
2. **Mechanism**:
   In `MoulModal`, `MoulAlertDialog`, and `MoulDrawer`, all consumer-provided buttons, inputs, and interactive elements are rendered into light DOM and projected into `<slot>` inside `<dialog>`.
   `handleKeyDown` passes `this.dialogEl` (the `<dialog>` element within the shadow root) to `trapFocus(dialog, e)`.
   Standard DOM `container.querySelectorAll(...)` searches exclusively within the shadow tree of `container` and **does not query light-DOM slotted nodes**.
3. **Impact**:
   `getFocusableElements(dialog)` returns `[]` (empty array).
   In `trapFocus`:
   ```ts
   if (focusables.length === 0) {
     event.preventDefault()
     return
   }
   ```
   Focus is never cycled. Pressing Shift+Tab on the first element fails to focus the last element (`document.activeElement` remains stuck on the first element). Pressing Tab on the last element fails to wrap to the first element.
   This violates WAI-ARIA modal dialog focus management (Requirement 6.3 & 6.4).
4. **Remediation**:
   Pass `this` (the host element containing the slotted children) or query assigned elements:
   In `Modal.ts`, `AlertDialog.ts`, and `Drawer.ts`:
   ```ts
   if (e.key === 'Tab') {
     trapFocus(this, e)
   }
   ```
   Alternatively, enhance `getFocusableElements` in `focus-trap.ts` to inspect `<slot>` elements via `slot.assignedElements({ flatten: true })`.

---

## 3. Caveats

1. **Robust Component Features Confirmed**:
   Outside of the two defects noted above, several key behaviors passed adversarial testing cleanly:
   - Rapid 100-cycle unawaited burst toggles on Modal, AlertDialog, Drawer, Popover settle without race condition deadlocks or orphaned animations.
   - Escape dismissal in nested modals properly calls `e.stopPropagation()` and dismisses only the child modal.
   - Tooltip 300ms hover delay cancellation handles rapid 50-burst pointerenter/leave oscillations without premature display.
   - Tooltip immediate display on `focusin` (0ms delay) and immediate close on `focusout` function as specified.
   - Popover fallback fixed coordinate math (`top`, `bottom`, `left`, `right`) was empirically validated and passed when `CSS.supports` anchor query returns false.
   - CommandPalette rapid query bursts (50 updates), activeIndex resets, boundary clamping, and disabled item selection guards function properly.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While the core functionality of Phase 6 overlay components is solid under standard workloads, two critical defects were uncovered under adversarial stress testing:
1. **Infinite hang/deadlock** when `await setOpen(true)` is called on a detached element (`MoulModal`, `MoulAlertDialog`, `MoulDrawer`, `MoulCommandPalette`) due to unguarded `await this.host.updateComplete` in `OverlayPresenceController`.
2. **Broken keyboard focus trapping** in `MoulModal`, `MoulAlertDialog`, and `MoulDrawer` because `trapFocus(dialog, e)` fails to inspect slotted light-DOM elements.

These defects must be resolved before Milestone 6 can be certified complete.

---

## 5. Verification Method

To reproduce and verify these findings independently:

1. **Execute the Challenge Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/overlays-challenge.test.ts
   ```
   *Expected outcome*: 22 tests pass, 5 tests fail (4 with `Deadlock: setOpen(true) hung on detached element awaiting host.updateComplete`, 1 with `AssertionError: expected <button id="first-el"> to be <button id="second-el">`).

2. **Verify Code Locations**:
   - Inspect `ui/src/controllers/overlay-presence.controller.ts` line 84 (`await this.host.updateComplete`).
   - Inspect `ui/src/components/Modal/Modal.ts` line 129 (`trapFocus(dialog, e)`).
   - Inspect `ui/src/utils/focus-trap.ts` lines 40–56 (`getFocusableElements(container)`).

3. **Check Test Suite Lint / Formatting**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/overlays-challenge.test.ts
   ```
   *Expected outcome*: 0 errors, 0 warnings.
