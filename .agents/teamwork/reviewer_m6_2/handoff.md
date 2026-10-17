# Milestone 6 Review & Adversarial Challenge Report

**Reviewer**: `reviewer_m6_2`  
**Roles**: Reviewer, Adversarial Critic  
**Date**: 2026-10-16T13:45:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  
**Verdict**: `REQUEST_CHANGES`  

---

## Review Summary

**Verdict**: **`REQUEST_CHANGES`**  
While the architectural baseline of Milestone 6 introduces genuine Lit 3 components with zero React dependencies and passes the basic tests in `Navigation.test.ts` (10/10) and `Overlays.test.ts` (10/10), rigorous adversarial stress testing uncovered **1 Critical deadlocking defect** in `OverlayPresenceController`, **3 Major behavioral/accessibility defects** in `focus-trap.ts`, `Link.ts`, `Pagination.ts`, and `Breadcrumbs.ts`, as well as significant test suite coverage gaps where critical fallback branches are never exercised.

---

## Findings

### [Critical] Finding 1: Unmounted/Disconnected Overlay `setOpen(true)` Deadlocks on `updateComplete`
- **Location**: `ui/src/controllers/overlay-presence.controller.ts:80-86`
- **What**: When `setOpen(true)` is invoked on any overlay element (`moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-command-palette`) that is created via `document.createElement()` or disconnected from the DOM, execution hangs indefinitely and times out.
- **Code**:
  ```ts
  // ui/src/controllers/overlay-presence.controller.ts:80-86
  if (
    (this.host as unknown as { updateComplete?: Promise<boolean> })
      .updateComplete
  ) {
    await (this.host as unknown as { updateComplete: Promise<boolean> })
      .updateComplete
  }
  ```
- **Why**: In Lit, an element that has never been connected to the DOM (`!this.host.isConnected`) does not schedule or fulfill its render cycle; its `updateComplete` promise remains unsettled. Awaiting `this.host.updateComplete` on an unmounted element blocks the async function permanently. This causes empirical test timeouts in `CHAL-MOD-04`, `CHAL-ALT-03`, `CHAL-DRW-03`, and `CHAL-CMD-05` (5000ms vitest timeout).
- **Suggested Fix**: Guard the `updateComplete` await by checking connection status:
  ```ts
  if (this.host.isConnected && (this.host as unknown as { updateComplete?: Promise<boolean> }).updateComplete) {
    await (this.host as unknown as { updateComplete: Promise<boolean> }).updateComplete
  }
  ```

---

### [Major] Finding 2: `trapFocus` Fails to Trap Focus for Light DOM Slotted Children
- **Location**: `ui/src/utils/focus-trap.ts:40-44` and `ui/src/components/Modal/Modal.ts:126-131`
- **What**: Slotted interactive elements (buttons, inputs, links in `<slot>`) inside `moul-modal`, `moul-alert-dialog`, and `moul-drawer` are completely invisible to `trapFocus()`.
- **Code**:
  ```ts
  // ui/src/utils/focus-trap.ts:40-44
  export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    if (!container) return []
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
    )
    ...
  ```
  ```ts
  // ui/src/components/Modal/Modal.ts:127-130
  const dialog = this.dialogEl
  if (dialog) {
    trapFocus(dialog, e)
  }
  ```
- **Why**: `dialog` resides in the component's Shadow Root. `dialog.querySelectorAll()` searches only shadow DOM nodes and does NOT traverse into `<slot>` elements to inspect assigned Light DOM elements. Slotted buttons like `<moul-modal><button>Action</button></moul-modal>` are omitted from `getFocusableElements(dialog)`. When `Tab` or `Shift+Tab` is pressed, focus leaks outside the modal or fails to wrap, failing `CHAL-MOD-07`.
- **Suggested Fix**: Update `getFocusableElements` or `trapFocus` to inspect slotted light DOM elements (via `slot.assignedElements({ flatten: true })` or querying the host component's light DOM children).

---

### [Major] Finding 3: Lit Undefined-Attribute Interpolation Serializes `aria-disabled=""`, `role=""`, and `aria-current=""`
- **Location**: `ui/src/components/Link/Link.ts:94,96` and `ui/src/components/Pagination/Pagination.ts:162`
- **What**: In Lit HTML template bindings, passing `undefined` to an attribute does NOT remove the attribute from the DOM element; instead, it renders the attribute with an empty string value (`""`).
- **Code in `Link.ts`**:
  ```ts
  <a
    part="base"
    href=${this.isDisabled ? undefined : this.href || undefined}
    target=${target || undefined}
    rel=${effectiveRel || undefined}
    role=${!this.href ? 'button' : undefined}
    tabindex=${this.isDisabled ? '-1' : '0'}
    aria-disabled=${this.isDisabled ? 'true' : undefined}
  ```
- **Code in `Pagination.ts`**:
  ```ts
  aria-current=${isCurrent ? 'page' : undefined}
  ```
- **Why**:
  1. On an **enabled link**, `<a aria-disabled="">` is rendered. Assistive technology treats `aria-disabled=""` as disabled, erroneously announcing active links as disabled.
  2. A normal link with an `href` renders `<a role="">`, which is invalid WAI-ARIA.
  3. A disabled link renders `<a href="">`, keeping the anchor interactive and linking to the current page.
  4. In `Pagination.ts`, `<button aria-current="">` is rendered on **all inactive page buttons**. WAI-ARIA 1.2 treats any presence of `aria-current` (even empty string) as `aria-current="page"`, causing screen readers to announce every page button as the current page.
- **Suggested Fix**: Use Lit's `nothing` sentinel (`import { nothing } from 'lit'`):
  ```ts
  aria-disabled=${this.isDisabled ? 'true' : nothing}
  role=${!this.href ? 'button' : nothing}
  href=${this.isDisabled ? nothing : this.href || nothing}
  aria-current=${isCurrent ? 'page' : nothing}
  ```

---

### [Major] Finding 4: Dynamic Separator Updates in `Breadcrumbs` Blocked by Reflected Child Attribute
- **Location**: `ui/src/components/Breadcrumbs/Breadcrumbs.ts:36-39` and `BreadcrumbItem.ts:11`
- **What**: Dynamically changing `breadcrumbs.separator = '/'` after an initial render does not update child `moul-breadcrumb-item` elements.
- **Code in `Breadcrumbs.ts`**:
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
- **Why**: `MoulBreadcrumbItem` declares `separator: { type: String, reflect: true }`. On initial sync, `item.separator = this.separator` sets the property, which Lit reflects by adding `separator=">"` as an HTML attribute on the `<moul-breadcrumb-item>` DOM node. When `breadcrumbs.separator` subsequently updates to `'/'`, `item.hasAttribute('separator')` is now `true`, causing `syncSeparatorToChildren()` to skip the child and leave the old separator in place.
- **Suggested Fix**: Remove `reflect: true` from `separator` on `MoulBreadcrumbItem`, or track parent inheritance separately from user overrides (e.g., checking if the attribute was present before sync).

---

### [Major] Finding 5: Test Suite Completeness Gap for Popover Fallback Positioning and Overlays
- **Location**: `ui/src/components/Overlays.test.ts`
- **What**: `Overlays.test.ts` contains only 10 tests and fails to test:
  1. Popover fallback fixed coordinate math (`top`, `bottom`, `left`, `right`, `offset`). In Happy DOM, `supportsNativePopoverAndAnchor()` returns `true` because Happy DOM mocks `CSS.supports` to return `true` for all CSS properties. The entire fallback coordinate branch was never executed in any unit test.
  2. Nested overlay Escape key isolation (only single modal is tested).
  3. Drawer placement presets (`left`, `right`, `top`, `bottom`).
- **Suggested Fix**: Add dedicated test cases in `Overlays.test.ts` that mock `CSS.constructor.prototype.supports` to return `false` for `anchor-name`, verifying all 4 placements (`top`, `bottom`, `left`, `right`), and test nested overlay Escape handling.

---

## 1. Observation

1. **Test Commands Executed**:
   - `node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts`:
     - Result: 4 passed, 71 tests passed.
   - `node ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts src/tokens/tokens.test.ts`:
     - Result: 2 passed, 80 tests passed.
   - `bun ./scripts/verify-no-react.ts all`:
     - Result: Exit code 0, zero disallowed React/legacy packages found across manifests.
   - `./node_modules/.bin/biome check ui/src/components/Link ui/src/components/Breadcrumbs ui/src/components/Pagination ui/src/components/Tabs ui/src/components/Popover ui/src/components/Tooltip ui/src/components/Modal ui/src/components/AlertDialog ui/src/components/Drawer ui/src/components/CommandPalette ui/src/components/Navigation.test.ts ui/src/components/Overlays.test.ts`:
     - Result: Checked 35 files, 0 errors, 0 warnings.

2. **Adversarial Test Execution (`navigation-challenge.test.ts` & `overlays-challenge.test.ts`)**:
   - `node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts src/components/overlays-challenge.test.ts`:
     - Result: `1 failed | 1 passed (2)`, `7 failed | 36 passed (43)`.
     - Verbatim Errors:
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-MOD-04: Detached element handling: invoking open=true and setOpen(true) when disconnected -> Error: Test timed out in 5000ms.`
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-ALT-03: Detached alert dialog setOpen resilience without throwing -> Error: Test timed out in 5000ms.`
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-DRW-03: Detached drawer handling and outside backdrop clicks -> Error: Test timed out in 5000ms.`
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-CMD-05: Global shortcut toggling (Cmd+K / Ctrl+K) and detached resilience -> Error: Test timed out in 5000ms.`
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-MOD-07: Focus trapping cycles between first and last focusable elements on Tab and Shift+Tab -> AssertionError: expected <button id="first-el"></button> to be <button id="second-el"></button>`
       - `FAIL src/components/overlays-challenge.test.ts > CHAL-POP-01: Fallback fixed coordinate math for all 4 placements (top, bottom, left, right) -> AssertionError: expected '' to be 'fixed'`
       - `FAIL src/components/navigation-challenge.test.ts > CHAL-DEFECT-01: Lit undefined-attribute bug serializes aria-disabled="" and role="" in MoulLink`
       - `FAIL src/components/navigation-challenge.test.ts > CHAL-DEFECT-02: Lit undefined-attribute bug serializes aria-current="" on inactive pagination buttons`

3. **Integrity Assessment**:
   - Zero hardcoded test outputs or fake logic found in component source files.
   - Zero React dependencies or imports found in touched Milestone 6 components.
   - All legacy `.tsx` files in the 10 component directories have been removed.

---

## 2. Logic Chain

1. **Disconnected Execution Deadlock**:
   - In `OverlayPresenceController.setOpen(true)`, line 84 executes `await this.host.updateComplete`.
   - In LitElement lifecycle, `updateComplete` is only resolved as part of the scheduled render cycle, which requires the element to be connected to the DOM (`connectedCallback`).
   - If an element is unmounted (`!this.host.isConnected`), `updateComplete` does not resolve, causing any caller awaiting `element.setOpen(true)` to deadlock until timeout.
   - This directly contradicts Requirement 6.10 / Milestone 6 dispatch expectations that unmounted/disconnected elements are handled gracefully without hangs or unhandled errors.

2. **Shadow DOM Slotted Boundary Leaks in `trapFocus`**:
   - `trapFocus` passes `dialog` (a shadow DOM node of `MoulModal`) to `getFocusableElements`.
   - `getFocusableElements` uses `container.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR)`.
   - In DOM specifications, `querySelectorAll` called on a shadow DOM element does not penetrate child `<slot>` elements to return assigned light DOM nodes.
   - Because user interactive elements are provided in the light DOM via `<slot>`, `trapFocus` finds 0 interactive elements, completely disabling focus trapping for slotted content.

3. **Attribute Stringification in Lit**:
   - Lit 2 and 3 require the `nothing` sentinel to omit an attribute from the DOM.
   - Passing `undefined` to `${...}` in an attribute binding stringifies as an empty string attribute (`attr=""`).
   - Consequently, `aria-disabled=""` is set on enabled links, `role=""` on links with href, and `aria-current=""` on all pagination buttons.
   - According to WAI-ARIA 1.2, boolean and enumerated attributes like `aria-current` and `aria-disabled` treat presence (including empty string) as active/true. This is a severe accessibility regression.

---

## 3. Caveats

- **Anchor Positioning Environment**: In real browser engines supporting native CSS Anchor Positioning (e.g. Chromium 125+), fallback coordinate math is bypassed by design. However, in headless test environments (Happy DOM) and unsupported browsers (Safari / Firefox without flags), the fallback path is critical.
- **Scope Boundary**: Legacy React files in unmigrated Milestone 7 components (`ui/src/components/Calendar/Calendar.tsx`, `ChartContainer.tsx`) remain present in the workspace as expected per the project milestone roadmap. Milestone 6 touched files have zero React imports.

---

## 4. Conclusion

The code produced by `worker_m6_1` implements the functional structure of the 10 components, but contains **1 Critical hanging defect** on unmounted elements, **3 Major accessibility/behavioral bugs**, and **test suite omissions**. Therefore, changes are requested to remediate these defects and expand test coverage before Milestone 6 can be approved.

---

## 5. Verification Method

To verify the required fixes:

1. **Fix Disconnected Element Hang**:
   Add `this.host.isConnected` check before `await this.host.updateComplete` in `ui/src/controllers/overlay-presence.controller.ts`.
   Verify with:
   ```bash
   node -e "
   const { Window } = require('./ui/node_modules/happy-dom');
   // Verify setOpen(true) resolves immediately without hanging on detached element
   "
   ```

2. **Fix `trapFocus` for Slotted Elements**:
   Update `ui/src/utils/focus-trap.ts` to inspect `<slot>` assigned elements so slotted buttons in `moul-modal` are properly returned and trapped.

3. **Fix Lit Attribute Interpolation**:
   Import `nothing` from `'lit'` in `Link.ts` and `Pagination.ts`, replacing `undefined` attribute expressions with `nothing`.
   Verify with:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts
   ```

4. **Fix Breadcrumbs Separator Inheritance**:
   Ensure `moul-breadcrumb-item` does not reflect `separator` to attribute, allowing dynamic updates to `moul-breadcrumbs.separator` to propagate to children.

5. **Run Full Regression Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts
   bun ./scripts/verify-no-react.ts all
   ./node_modules/.bin/biome check ui/src/components/Link ui/src/components/Breadcrumbs ui/src/components/Pagination ui/src/components/Tabs ui/src/components/Popover ui/src/components/Tooltip ui/src/components/Modal ui/src/components/AlertDialog ui/src/components/Drawer ui/src/components/CommandPalette ui/src/components/Navigation.test.ts ui/src/components/Overlays.test.ts
   ```
