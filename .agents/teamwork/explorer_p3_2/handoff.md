# Phase 3 Test Strategy: Vitest + Happy-DOM Test Suite for Reactive Controllers

## 1. Observation

### 1.1 Test Setup Shims & Environment (`ui/src/test-setup.ts`)
1. **`ResizeObserver` Shim (`ui/src/test-setup.ts:476-605`)**:
   - `MockResizeObserver` maintains `activeObservers = new Set<ObserverRecord>()`.
   - Each record tracks `observer`, `callback`, `observedElements: Set<Element>`, and `options: Map<Element, ResizeObserverOptions>`.
   - `triggerResize(element: Element, options: TriggerResizeOptions)` is exported and globally attached to `window.__triggerResize` and `globalThis.__triggerResize` (`lines 592-599`).
   - `triggerResize` creates a mock `DOMRect` (`width`, `height ?? 0`, `top ?? 0`, `left ?? 0`) and assigns it to `element.getBoundingClientRect`.
   - It builds a `ResizeObserverEntry` where `contentRect`, `borderBoxSize`, `contentBoxSize`, and `devicePixelContentBoxSize` all reflect `{ inlineSize: width, blockSize: height }`.
   - It immediately loops through `activeObservers` and synchronously invokes `record.callback([entry], record.observer)`.
   - `MockResizeObserver.prototype.disconnect()` (`line 516`) empties `observedElements` and removes the record from `activeObservers`.

2. **`ElementInternals` Shim (`ui/src/test-setup.ts:44-226`)**:
   - `HTMLElement.prototype.attachInternals` returns `MockElementInternalsImpl`.
   - Enforces single attachment via `attachedElements = new WeakSet<HTMLElement>()`. If called twice on the same element, verbatim throws:
     `new DOMException('ElementInternals already attached', 'NotSupportedError')` (`lines 203-206`).
   - `MockElementInternalsImpl.prototype.form` (`lines 88-109`):
     - Checks `this._host.getAttribute('form')` and resolves via `ownerDocument.getElementById(formId)`.
     - Falls back to `this._host.closest('form')`.
     - Handles Happy DOM's `Symbol(proxy)` form wrapping unwrapping.
     - Returns `null` if no matching `<form>` exists.
   - `setFormValue(value)` (`line 123`): records value in `_value`, accessible via getter `formValue`.
   - `setValidity(flags, message, anchor)` (`lines 131-158`):
     - Merges flags with standard 10 validity keys (`badInput`, `customError`, `patternMismatch`, `rangeOverflow`, `rangeUnderflow`, `stepMismatch`, `tooLong`, `tooShort`, `typeMismatch`, `valueMissing`).
     - Truncates `message` to at most 200 characters: `typeof message === 'string' ? message.slice(0, 200) : ''`.
     - `validity` getter computes `valid: !isInvalid`.
     - `validationMessage` getter returns the truncated message string.
   - `reportValidity()` (`line 189`): calls `checkValidity()`, which dispatches an `'invalid'` event (`cancelable: true`) on `_host` when invalid and returns boolean validity.

3. **Native `<dialog>` Shim (`ui/src/test-setup.ts:228-306`)**:
   - `showModal()` throws `DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')` if `!this.isConnected`.
   - `showModal()` throws `DOMException('Failed to execute showModal on HTMLDialogElement: The element is already open.', 'InvalidStateError')` if `this.open`.
   - `close(returnValue)` sets `this.open = false`, updates `this.returnValue`, and dispatches an `Event('close')`.

4. **Popover API Shim (`ui/src/test-setup.ts:308-472`)**:
   - `showPopover()` throws `DOMException` if `popover` attribute is missing or element is disconnected.
   - Toggles `:popover-open` attribute and CSS class, dispatches `beforetoggle` (`cancelable: true`) and `toggle` events.
   - `Element.prototype.matches(':popover-open')` evaluates `true` when open.

### 1.2 Happy-DOM Runtime Mechanics (Empirical Probe)
1. **DOM Events**:
   - `PointerEvent` is a constructor in Happy DOM (`typeof win.PointerEvent === 'function'`).
   - Dispatched pointer events (`pointerdown`, `pointerup`, `pointercancel`, `pointerenter`, `pointerleave`) synchronously execute registered event listeners.
   - Dispatched keyboard events (`KeyboardEvent` with `key: ' '`, `key: 'Enter'`) execute synchronously.
   - Focus events: calling `btn.focus()` synchronously triggers both `focus` and `focusin` (`bubbles: true`). Calling `btn.blur()` synchronously triggers both `blur` and `focusout` (`bubbles: true`).
2. **Animation & Timers**:
   - `requestAnimationFrame` exists in Happy DOM and executes via timer loop.
   - `Element.prototype.animate` is `undefined` in Happy DOM; vanilla `motion` operates via its RAF driver.
   - `animate(0, 100, { type: 'spring', ... })` from `motion` successfully steps numbers via RAF and resolves its controls promise upon settling to the target.
   - Calling `controls.stop()` synchronously halts the animation loop.
   - `prefersReducedMotion()` queries `window.matchMedia('(prefers-reduced-motion: reduce)')`.

### 1.3 Test Execution Command & Baseline
- Test suite runner: `node ./node_modules/.bin/vitest run` from package root or `ui/` directory.
- Running `node ./node_modules/.bin/vitest run src/tokens/tokens.test.ts`: passes 35/35 tests in ~700ms.
- Running `node ./node_modules/.bin/vitest run src/utils/utils-challenge.test.ts`: passes 36/36 tests in ~540ms.
- Running `bun test` from `ui/` fails because Bun's native test runner invokes legacy React test suites and does not load `ui/src/test-setup.ts`. Vitest is the designated runner.

---

## 2. Logic Chain

### 2.1 Test Host Architecture Strategy
- **Step 1**: Controllers require a `ReactiveControllerHost & HTMLElement`. Lit components (`LitElement`) implement this, but constructing dedicated Lit elements for every test introduces asynchronous microtask batching overhead (`requestUpdate()` batches until `performUpdate()`).
- **Step 2**: For direct, deterministic assertion of synchronous `host.requestUpdate()` invocations, a `MockReactiveHost` custom element extending `HTMLElement` and implementing `ReactiveControllerHost` records every `requestUpdate(name, oldValue)` call into an array synchronously.
- **Step 3**: To verify real Lit component integration, a `TestLitHost` extending `LitElement` verifies that `hostConnected()`, `hostDisconnected()`, and `await host.updateComplete` behave identically inside Lit's actual reactive loop.
- **Conclusion**: The test suite should provide both:
  1. `createMockHost(tagPrefix)`: Lightweight synchronous host capturing `updateCalls: Array<{ name?, oldValue? }>`.
  2. `createLitHost(tagPrefix)`: Full `LitElement` instance validating Lit integration.

### 2.2 Breakpoint Testing Strategy (`LayoutIndicatorController`)
- **Step 1**: Requirement 5.3 defines 5 distinct breakpoints:
  - `xs`: `0 <= width <= 479`
  - `sm`: `480 <= width <= 767`
  - `md`: `768 <= width <= 1023`
  - `lg`: `1024 <= width <= 1279`
  - `xl`: `width >= 1280`
- **Step 2**: `test-setup.ts` exports `triggerResize(host, { width, height })`. It triggers `MockResizeObserver` callbacks synchronously.
- **Step 3**: We can run deterministic boundary tests at exact critical values: `0`, `479`, `480`, `767`, `768`, `1023`, `1024`, `1279`, `1280`, `2560`.
- **Step 4**: To guarantee no off-by-one gaps across the full positive integer spectrum, we combine deterministic boundary assertions with `fast-check` property tests across all 5 intervals.
- **Step 5**: Deduplication test: Changing width from 500 to 600 (both `sm`) with `observeDimensions: false` must NOT call `host.requestUpdate()`. With `observeDimensions: true`, it MUST call `host.requestUpdate()`.

### 2.3 Press, Focus & Aria-Pressed Strategy (`PressController`)
- **Step 1**: PressController tracks `isPressed`, `isHovered`, and `isFocusVisible`, calling `host.requestUpdate()` on state changes.
- **Step 2**: Pointer events (`pointerenter`, `pointerleave`, `pointerdown`, `pointerup`, `pointercancel`) and keyboard events (`keydown`/`keyup` for `Space` and `Enter`) can be dispatched via `host.dispatchEvent(new PointerEvent(...))` and `new KeyboardEvent(...)`.
- **Step 3**: Focus events (`focusin`, `focusout`) are triggered by `host.focus()` and `host.blur()`.
- **Step 4**: `aria-pressed` synchronization logic:
  - When `host.getAttribute('type') === 'button'`, `host.getAttribute('type') === 'checkbox'`, or `host.hasAttribute('aria-pressed')` on controller mount: `shouldSyncAriaPressed` is `true`.
  - When `isPressed` toggles, `host.setAttribute('aria-pressed', String(this.isPressed))` must be invoked.
  - When host lacks these attributes (e.g. plain `<div>` or input field), `aria-pressed` must NEVER be set.
- **Step 5**: Disabled state (`disabled` or `is-disabled` attribute/property): pointer/key events must be ignored, `isPressed` remains `false`, and motion scaling is suppressed.

### 2.4 Overlay Presence & Top-Layer Lifecycle Strategy (`OverlayPresenceController`)
- **Step 1**: Requirement 5.4 & Design 6.3 define a two-phase open/close lifecycle across 8 presets (`modal`, `popover`, `tooltip`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`, `toast`).
- **Step 2**: Open sequence:
  `controller.setOpen(true, target)` → `isMounted = true` → `host.requestUpdate()` → promote to top layer (`dialog.showModal()` or `popover.showPopover()`) → enter animation → `isOpen = true` → `host.requestUpdate()`.
- **Step 3**: Close sequence:
  `controller.setOpen(false, target)` → `isOpen = false` → `host.requestUpdate()` → await exit animation → remove from top layer (`dialog.close()` or `popover.hidePopover()`) → `isMounted = false` → `host.requestUpdate()`.
- **Step 4**: The critical assertion: On close, `dialog.close()` or `popover.hidePopover()` must NOT be called before the exit animation promise finishes. If it were called early, the element would be removed from the top layer prematurely, clipping the exit transition.
- **Step 5**: Concurrency & Rapid Toggling:
  Calling `setOpen(true)` followed synchronously by `setOpen(false)` must not throw, must cancel or supersede the entrance animation, and must settle in the closed/unmounted state (`isOpen: false`, `isMounted: false`).

### 2.5 Number Spring Convergence Strategy (`NumberSpringController`)
- **Step 1**: Clamping: Input target values outside `[-999_999_999, 999_999_999]` must be clamped to the boundaries. Verified with `fast-check` across `fc.integer()`.
- **Step 2**: Progression: When `setTarget(100)` is called, `targetValue` updates immediately, `displayValue` begins stepping on each animation frame, and `host.requestUpdate()` is called per tick.
- **Step 3**: Snapping: When `Math.abs(displayValue - targetValue) <= 0.5`, `displayValue` snaps to exact `targetValue` and stops the RAF loop.
- **Step 4**: Disconnect: Calling `hostDisconnected()` stops active animation controls and prevents orphaned ticks from calling `requestUpdate()`.

### 2.6 Form Internals Bridge Strategy (`FormInternalsController`)
- **Step 1**: Standard Form Association: Host element has `static formAssociated = true`. Connecting host inside `<form id="test-form">` sets `controller.internals.form === formEl`.
- **Step 2**: Detached Form Warning (Req 9.12): Host element has attribute `name="email"` and is connected outside `<form>`. Spy on `console.warn` asserts:
  `[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.`
  When connected inside `<form>`, no warning is logged.
- **Step 3**: Missing `attachInternals` Fallback (Req 5.9):
  When `host.attachInternals` is `undefined`, connecting the element logs:
  `[@moul-dev/ui] ElementInternals is not supported in this environment.`
  `controller.internals` is set to `null`, and no exceptions are thrown.
- **Step 4**: Synchronous Form Value (Req 6.7):
  Calling `controller.setValue("abc")` immediately calls `internals.setFormValue("abc")` synchronously.
- **Step 5**: Validity Truncation (Req 5.8):
  Calling `controller.setValidity({ customError: true }, "A".repeat(350))` truncates message to exactly 200 characters (`"A".repeat(200)`), updates `internals.validationMessage`, and calls `reportValidity()`.

---

## 3. Caveats

1. **`bun test` vs `vitest`**:
   - `bun test` runs Bun's built-in test runner which does not respect `vitest.config.ts` or `ui/src/test-setup.ts` by default, and attempts to run obsolete React tests.
   - All tests MUST be executed via `node ./node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts` (or `bun run --cwd ui test`).
2. **Reduced Motion State Leakage**:
   - Tests that mock `window.matchMedia` for `prefersReducedMotion()` must restore the original function in a `finally` block or `afterEach()`, otherwise later tests will incorrectly assume reduced motion is active.
3. **Happy DOM `Symbol(proxy)` on HTMLFormElement**:
   - Happy DOM wraps form elements in an internal Proxy. `test-setup.ts` handles this when comparing `internals.form`, but tests should verify form identity using standard DOM comparison (`expect(controller.internals.form).toBe(formElement)`).
4. **Dynamic Custom Element Names**:
   - Custom element tag names in `customElements.define` cannot be redefined or overwritten within the same process. Test hosts must use auto-incremented tag names (e.g. `mock-host-${++id}`).

---

## 4. Conclusion

The test suite for Phase 3 Reactive Controllers (`ui/src/controllers/Controllers.test.ts`) can be authored with 100% test reliability, zero flakiness, and sub-second execution speed using the following architecture:

### 4.1 Test Suite Structure Blueprint (`Controllers.test.ts`)
The test suite should be organized into 6 `describe` blocks:
1. **`Test Harness & Reactive Host Invariants`**: Verifies `MockReactiveHost` and `TestLitHost` lifecycle notification.
2. **`PressController`**:
   - Default state properties (`isPressed`, `isHovered`, `isFocusVisible`).
   - Pointer enter, leave, down, up, cancel transitions & `requestUpdate()`.
   - Focusin, focusout transitions.
   - Keyboard Space and Enter transitions.
   - Host `aria-pressed` synchronization matrix:
     - `type="button"` → synchronized.
     - `type="checkbox"` → synchronized.
     - initial `aria-pressed` attribute → synchronized.
     - Host without button/checkbox/aria-pressed → untracked, no attribute added.
   - Disabled host guards (`disabled` / `is-disabled` attributes and property).
   - Motion integration & `prefersReducedMotion()`.
   - Disconnect cleanup (no event handling or updates after unmount).
3. **`LayoutIndicatorController`**:
   - Default state (`md`, `width: 0`, `height: 0`).
   - Breakpoint classification with `triggerResize`:
     - `xs`: 0px, 479px
     - `sm`: 480px, 767px
     - `md`: 768px, 1023px
     - `lg`: 1024px, 1279px
     - `xl`: 1280px, 2560px
   - `fast-check` property tests across all 5 intervals.
   - Dimension tracking option (`observeDimensions: true` vs `false`).
   - Update deduplication when resizing within the same breakpoint.
   - Disconnect cleanup (no updates after unmount).
4. **`OverlayPresenceController`**:
   - Default state (`isOpen: false`, `isMounted: false`).
   - Enter lifecycle with `<dialog>`: `isMounted = true` → `requestUpdate()` → `showModal()` → animate → `isOpen = true`.
   - Exit lifecycle with `<dialog>`: `isOpen = false` → `requestUpdate()` → await animate → `close()` → `isMounted = false`.
   - Popover lifecycle with `[popover]`: `showPopover()` on open, `hidePopover()` after exit.
   - Preset modes: all 8 presets (`modal`, `popover`, `tooltip`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`, `toast`).
   - Rapid open/close toggle concurrency & cancellation safety.
5. **`NumberSpringController`**:
   - Default state (`targetValue: 0`, `displayValue: 0`).
   - Clamping bounds `[-999_999_999, 999_999_999]` with boundary tests and `fast-check` property test.
   - Spring animation progression toward target & `host.requestUpdate()` on each frame.
   - Snapping when `|displayValue - targetValue| <= 0.5`.
   - Mid-flight retargeting.
   - Disconnect cleanup (halts active animation controls).
6. **`FormInternalsController`**:
   - Default state and `static formAssociated = true` host requirement.
   - Attaching internals and resolving parent `<form>`.
   - Detached form warning when host has `name` attribute and no parent `<form>`.
   - No warning when connected inside `<form>`.
   - Missing `attachInternals` graceful fallback: logs warning, sets `internals = null`, does not throw.
   - Synchronous `setValue()` calling `internals.setFormValue()`.
   - `setValidity()` truncating validation message to `<= 200` characters and invoking `reportValidity()`.
   - Reconnecting host does not throw double-attachment error.

### 4.2 Reusable Test Harness Helpers (Code Snippet)
```ts
import { LitElement, type ReactiveController, type ReactiveControllerHost } from 'lit'
import { triggerResize } from '../test-setup'

let hostId = 0

export class MockReactiveHost extends HTMLElement implements ReactiveControllerHost {
  static formAssociated = true
  readonly controllers = new Set<ReactiveController>()
  updateCalls: Array<{ name?: PropertyKey; oldValue?: unknown }> = []

  addController(controller: ReactiveController): void {
    this.controllers.add(controller)
    if (this.isConnected) {
      controller.hostConnected?.()
    }
  }

  removeController(controller: ReactiveController): void {
    this.controllers.delete(controller)
  }

  requestUpdate(name?: PropertyKey, oldValue?: unknown): void {
    this.updateCalls.push({ name, oldValue })
  }

  get updateComplete(): Promise<boolean> {
    return Promise.resolve(true)
  }

  connectedCallback(): void {
    for (const c of this.controllers) {
      c.hostConnected?.()
    }
  }

  disconnectedCallback(): void {
    for (const c of this.controllers) {
      c.hostDisconnected?.()
    }
  }
}

export function createMockHost(prefix = 'mock-host'): MockReactiveHost {
  const tag = `${prefix}-${++hostId}`
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends MockReactiveHost {})
  }
  return document.createElement(tag) as MockReactiveHost
}
```

---

## 5. Verification Method

### 5.1 Command Line Verification
Run these commands from repository root to verify existing test stability and runner performance:
```bash
# 1. Run tokens test suite
node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts

# 2. Run core utilities challenge suite
node ui/node_modules/.bin/vitest run --root ui src/utils/utils-challenge.test.ts

# 3. Check dependency guard
bun ./scripts/verify-no-react.ts all
```

### 5.2 Verification of Future `Controllers.test.ts`
Once the worker implements `Controllers.test.ts`:
```bash
node ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts
```
Expected output:
- 100% test pass rate across all 6 test suites.
- Execution time under 2.5 seconds.
- 0 unhandled promise rejections.
- 0 leaked warnings in stdout.

### 5.3 Invalidation Conditions
This strategy is invalidated if:
1. `happy-dom` is replaced with an environment lacking `PointerEvent` or `requestAnimationFrame`.
2. `ui/src/test-setup.ts` removes `triggerResize` or changes `ElementInternals` shimming.
3. Controllers are changed to require non-standard React-style hooks instead of Lit's `ReactiveController` protocol.
