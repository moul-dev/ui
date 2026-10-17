# Review Report: Milestone 6 (Phase 6 Overlay & Navigation Components)

**Reviewer**: `reviewer_m6_1`  
**Date**: 2026-10-16T13:45:00Z  
**Verdict**: **`REQUEST_CHANGES`**  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  

---

## 1. Observation

1. **Standard Verification Commands**:
   - `node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts`:
     ```
     Test Files  2 passed (2)
          Tests  20 passed (20)
     ```
   - `bun ./scripts/verify-no-react.ts all`:
     ```
     ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
     ```
   - Regression Suites `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/Surfaces.test.ts`:
     ```
     Test Files  2 passed (2)
          Tests  51 passed (51)
     ```
   - Biome Lint Check:
     ```
     ./node_modules/.bin/biome check ui/src/components/Link ui/src/components/Breadcrumbs ui/src/components/Pagination ui/src/components/Tabs ui/src/components/Popover ui/src/components/Tooltip ui/src/components/Modal ui/src/components/AlertDialog ui/src/components/Drawer ui/src/components/CommandPalette ui/src/components/Navigation.test.ts ui/src/components/Overlays.test.ts
     Checked 35 files in 13ms. No fixes applied. Found 0 errors, 0 warnings.
     ```

2. **Source Inspection & Adversarial Challenge Failures**:
   - Running `node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts src/components/overlays-challenge.test.ts` surfaced 7 failures in `overlays-challenge.test.ts`:
     - **Failure A (Infinite Promise Hang on Detached Overlays)**:
       `CHAL-MOD-04`, `CHAL-ALT-03`, `CHAL-DRW-03`, and `CHAL-CMD-05` timed out at 5000ms:
       ```
       FAIL src/components/overlays-challenge.test.ts > Adversarial Stress Test: Phase 6 Overlay Components > MoulModal (`moul-modal`) Adversarial Stress > CHAL-MOD-04: Detached element handling: invoking open=true and setOpen(true) when disconnected
       Error: Test timed out in 5000ms.
       ```
       In `ui/src/controllers/overlay-presence.controller.ts:80-87`:
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
       When `this.host.isConnected === false`, Lit does not schedule an update cycle, causing `this.host.updateComplete` to never resolve and hanging the caller indefinitely.
     - **Failure B (Focus Trapping Invisible to Slotted Light DOM Content)**:
       `CHAL-MOD-07`:
       ```
       FAIL src/components/overlays-challenge.test.ts > Adversarial Stress Test: Phase 6 Overlay Components > MoulModal (`moul-modal`) Adversarial Stress > CHAL-MOD-07: Focus trapping cycles between first and last focusable elements on Tab and Shift+Tab
       AssertionError: expected <button id="first-el"></button> to be <button id="second-el"></button>
       ```
       In `ui/src/utils/focus-trap.ts:40-45`:
       ```ts
       export function getFocusableElements(container: HTMLElement): HTMLElement[] {
         if (!container) return []
         const elements = Array.from(
           container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
         )
         ...
       ```
       And in `ui/src/components/Modal/Modal.ts:126-131`:
       ```ts
       if (e.key === 'Tab') {
         const dialog = this.dialogEl
         if (dialog) {
           trapFocus(dialog, e)
         }
       }
       ```
       The `<dialog>` element is in shadow DOM. Calling `dialog.querySelectorAll(...)` does NOT pierce `<slot>` into slotted light DOM children. Hence `getFocusableElements` returns `[]`, preventing focus cycling between slotted interactive elements.
     - **Failure C (Dynamic Breadcrumbs Separator Update Ignored)**:
       In `ui/src/components/Breadcrumbs/Breadcrumbs.ts:31-40`:
       ```ts
       private syncSeparatorToChildren(): void {
         const items = Array.from(
           this.querySelectorAll<MoulBreadcrumbItem>('moul-breadcrumb-item'),
         )
         for (const item of items) {
           if (!item.hasAttribute('separator') || item.separator === '') {
             item.separator = this.separator
           }
         }
       }
       ```
       And in `ui/src/components/Breadcrumbs/BreadcrumbItem.ts:11`:
       ```ts
       separator: { type: String, reflect: true },
       ```
       On initial mount, `item.separator = this.separator` reflects `separator="..."` onto the DOM attribute. When `breadcrumbs.separator` is later updated, `!item.hasAttribute('separator')` evaluates to `false`, silently dropping the dynamic separator change.
     - **Failure D (Superficial Test Assertion in Worker Suite)**:
       In `ui/src/components/Overlays.test.ts:139-164` (`OV-MOD-04`), the test dispatches a `Tab` event and only asserts `expect(modal.isOpen).toBe(true)` without asserting `document.activeElement` cycling, masking the slotted focus trap bug.

---

## 2. Logic Chain

1. **Architecture & Standards Baseline**:
   - The 10 components correctly implement Lit 3, open Shadow DOM, reactive property maps, `defineElement` idempotent registration, and export all classes and types in `ui/src/index.ts`.
   - Dependency checks confirm 0 disallowed React imports or dependencies.
2. **Defect 1: Detached Overlay Deadlock / Promise Hang**:
   - Requirement 6.10 specifies: *"If dialog is disconnected, catches DOMException, logs console.warn, and does NOT focus children"*.
   - Calling `setOpen(true)` on an unmounted element (e.g. `document.createElement('moul-modal')`) triggers `OverlayPresenceController.setOpen()`.
   - Observation 2.A demonstrates that `await (this.host as any).updateComplete` without checking `this.host.isConnected` results in an unresolving promise because Lit does not schedule render passes for disconnected elements. This causes an infinite hang and fails adversarial tests (`CHAL-MOD-04`, `CHAL-ALT-03`, `CHAL-DRW-03`, `CHAL-CMD-05`).
3. **Defect 2: Broken Tab Focus Trapping in Modals / Drawers**:
   - Requirements 6.3 & 10.2 mandate trapping keyboard focus within the dialog.
   - Consumers populate modals and drawers with slotted buttons and form elements.
   - Because `trapFocus` queries `dialog.querySelectorAll()`, it cannot inspect nodes slotted via `<slot>` (Shadow DOM encapsulation boundary).
   - `focusables` is computed as `[]`, causing `trapFocus` to only execute `event.preventDefault()` without focusing the boundary elements, breaking accessibility for keyboard users.
4. **Defect 3: Breadcrumbs Separator Property Desynchronization**:
   - Requirement 10.9 specifies breadcrumbs separator management.
   - Because `MoulBreadcrumbItem` has `reflect: true` on `separator`, parent synchronization reflects an attribute to each item.
   - The guard `!item.hasAttribute('separator')` in `Breadcrumbs.ts` assumes the attribute was authored by the user; since Lit added it via reflection, subsequent parent separator updates are permanently ignored.

---

## 3. Caveats

- **Anchor Positioning**: In Happy DOM / headless Node.js, `CSS.supports` returns `true` by default without a specialized mock. In real browsers without CSS Anchor Positioning, fallback coordinates are computed based on bounding client rects.
- **SearchField in CommandPalette**: `CommandPalette` uses an internal `<input part="input">` with search icon rather than `<moul-search-field>` because `moul-search-field` is part of Phase 7 (Inputs & Forms) and has not yet been built. This is an acceptable sequencing dependency and not a defect.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While the baseline architecture, zero-React compliance, and basic happy-path tests pass, the implementation contains critical runtime and accessibility defects that must be remediated:
1. **Critical**: Resolve the detached element promise hang in `OverlayPresenceController.ts` by checking `this.host.isConnected` before awaiting `this.host.updateComplete`.
2. **Major**: Fix `trapFocus` / modal focus management to support slotted light DOM content by piercing slots or passing the host context.
3. **Major**: Fix `Breadcrumbs.ts` / `BreadcrumbItem.ts` separator synchronization so dynamic separator changes propagate to children.
4. **Minor**: Update `OV-MOD-04` in `Overlays.test.ts` to assert actual `document.activeElement` cycling.

---

## 5. Verification Method

1. **Verify Baseline Tests**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts
   bun ./scripts/verify-no-react.ts all
   ```
2. **Verify Adversarial Stress Tests**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts src/components/overlays-challenge.test.ts
   ```
   *Passing Criteria*: Zero timeouts on detached overlay calls, proper cycling of focus on slotted elements, and dynamic breadcrumbs separator inheritance.
3. **Invalidation Conditions**:
   Any fix that modifies implementation code to fake focus trapping or bypasses the `isConnected` check invalidates the fix.
