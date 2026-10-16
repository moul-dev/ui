# Milestone 1 Investigation & Implementation Plan: Vitest + happy-dom Test Harness (`ui/src/test-setup.ts`)

## 1. Observation

### Direct Codebase & Specification Observations

1. **Current State of `ui/src/test-setup.ts`**:
   - Path: `/Users/phearak/github/orgs/moul-dev/ui/ui/src/test-setup.ts` (lines 1–6):
     ```ts
     import '@testing-library/jest-dom/vitest'

     if (typeof window !== 'undefined' && !Element.prototype.getAnimations) {
       Element.prototype.getAnimations = () => []
     }
     ```
   - *Observation*: The file currently imports `@testing-library/jest-dom/vitest`. However, `@testing-library/jest-dom` is a legacy React-testing artifact being removed from the workspace in Milestone 1 (`ui/package.json`). Furthermore, `test-setup.ts` currently lacks any shims for `ElementInternals`, native `<dialog>`, Popover API, or `ResizeObserver`.

2. **Dispatch Directives & Acceptance Criteria**:
   - Dispatch message (`/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_3/DISPATCH.md`, lines 7–23):
     - `ElementInternals` shim:
       - Attach to `HTMLElement.prototype.attachInternals`.
       - Returns mock `ElementInternals` instance tracking: `form` (`this.closest('form')`), `setFormValue(value)`, `setValidity(flags, message, anchor)` storing validity flags and truncating `message` to `<= 200` chars, `reportValidity()`, `validity` (`ValidityState` getters based on flags), `validationMessage` returning current message.
     - Native `<dialog>` shim:
       - Shim on `HTMLDialogElement.prototype`:
       - `showModal()`: If `!this.isConnected`, MUST throw:
         `new DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')`
         per Requirement 6.10 and Acceptance Criteria. If connected, sets `open = true`.
       - `close(returnValue)`: removes `open`, sets `returnValue`, dispatches `new Event('close')`.
     - Popover API shim:
       - Shim on `HTMLElement.prototype`:
       - `showPopover()`, `hidePopover()`, `togglePopover()`
       - Toggles `:popover-open` simulation or attribute and dispatches `toggle` event.
     - Deterministic `ResizeObserver` controller:
       - Global `ResizeObserver` mock that allows tests to register observers and includes a helper (e.g. `window.__triggerResize(element, { width, height })`) to deterministically fire observer callbacks with `ResizeObserverEntry[]`.
   - `ORIGINAL_REQUEST.md` line 36:
     - `ui/src/test-setup.ts configures happy-dom with shims for ElementInternals (tracking form, value, validity), native <dialog> (showModal throwing DOMException when disconnected, close), Popover API (showPopover, hidePopover, togglePopover), and ResizeObserver.`

3. **Requirements & Architecture Context**:
   - `rdt/requirements.md` Requirement 6.10 (lines 143):
     - `IF dialog.showModal() is called on a <dialog> element that is not connected to the document, THEN THE Library SHALL catch the resulting DOMException, emit a console.warn message, and not attempt to focus any element.`
   - `rdt/design.md` §7.2 (lines 601–621):
     - `safeShowModal` wraps `dialog.showModal()` in `try ... catch (err)` checking for this exact disconnected `DOMException`.
   - `rdt/design.md` §6.5 (lines 460–472):
     - `FormInternalsController` checks `attachInternals()`, invokes `setFormValue()`, and in `setValidity(flags, message)` truncates `message?.slice(0, 200)` and calls `this.internals?.setValidity(...)` and `this.internals?.reportValidity()`. If element has a `name` attribute and `this.internals.form === null`, warns: `[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.` (Requirement 9.12).
   - `rdt/design.md` §7.1 (lines 578–593):
     - `supportsNativePopoverAndAnchor()` checks `'popover' in HTMLElement.prototype`. Open state selector uses `:where(:popover-open, .\:popover-open, [data-fallback-open])`.
   - `rdt/design.md` §11.1 (lines 960–969):
     - `ResizeObserver` mock controller allows tests to programmatically trigger resize callbacks at exact widths (`320px`, `600px`, `900px`, `1100px`, `1400px`) to deterministically verify `LayoutIndicatorController` breakpoints (`xs`, `sm`, `md`, `lg`, `xl`) and `ChartContainer` responsiveness.

---

## 2. Logic Chain

1. **Purge of Legacy Jest-DOM Import**:
   - *Observation*: Line 1 of `ui/src/test-setup.ts` imports `@testing-library/jest-dom/vitest`.
   - *Reasoning*: As determined in Task 1.1 / Task 1.2, `@testing-library/jest-dom` is removed from `ui/package.json` in favor of native Lit / `@open-wc/testing-helpers` / `fast-check`. Keeping this import will cause module resolution errors once dependencies are cleaned.
   - *Inference*: The import must be removed and replaced with standard Web APIs and custom shims.

2. **`ElementInternals` Lifecycle & Edge Cases**:
   - *Observation*: Form components call `this.attachInternals()` in `hostConnected()`.
   - *Reasoning*:
     1. Per W3C Custom Elements specification, calling `element.attachInternals()` multiple times on the same element instance must throw a `DOMException('ElementInternals already attached', 'NotSupportedError')`.
     2. Form detection must check `this.closest('form')` as well as the `form` attribute id association (`document.getElementById(this.getAttribute('form'))`).
     3. `setValidity(flags, message, anchor)` must evaluate if any flag is `true`. When any flag is `true`, `validity.valid` is `false`, and `validationMessage` is set to `message.slice(0, 200)`. When all flags are false (or empty), `validity.valid` is `true`, and `validationMessage` is cleared to `""`.
     4. `reportValidity()` and `checkValidity()` must return boolean `this.validity.valid` and dispatch a cancelable `invalid` event on the host if invalid.
   - *Inference*: A dedicated `MockElementInternalsImpl` class attached to `HTMLElement.prototype.attachInternals` ensures complete standard compliance.

3. **Native `<dialog>` Disconnected State Enforcement**:
   - *Observation*: Requirement 6.10 explicitly demands that `showModal()` throws a `DOMException` when `!this.isConnected`.
   - *Reasoning*:
     1. In browser implementations (Chromium/WebKit/Gecko), calling `showModal()` on an unattached `<dialog>` throws `DOMException` with name `'InvalidStateError'`.
     2. The exact error message in acceptance criteria is:
        `'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.'` with name `'InvalidStateError'`.
     3. When connected, `showModal()` sets `this.open = true` and updates attribute `open`.
     4. Calling `close(returnValue)` clears `open`, sets `this.returnValue`, and fires an unbubbled `Event('close')`.
     5. If `HTMLDialogElement` is undefined in the environment, it must be defined so `dialog instanceof HTMLDialogElement` evaluates correctly.
   - *Inference*: Shimming `HTMLDialogElement.prototype` with exact disconnected checks satisfies Requirement 6.10 and validates `safeShowModal()`.

4. **Popover API & Pseudo-Class Compatibility**:
   - *Observation*: Components inspect `'popover' in HTMLElement.prototype` and query `:popover-open`.
   - *Reasoning*:
     1. In standard DOM, `element.popover` reflects the `popover` attribute (`"auto"` or `"manual"`).
     2. Calling `showPopover()` on an element without `popover` attribute throws `DOMException('InvalidStateError')`.
     3. Calling `showPopover()` must dispatch `beforetoggle` (cancelable `ToggleEvent` with `oldState: 'closed'`, `newState: 'open'`). If not canceled, it sets simulated state: attribute `:popover-open`, attribute `data-popover-open`, and class `:popover-open`. Then it dispatches `toggle` (`ToggleEvent` with `oldState: 'closed'`, `newState: 'open'`).
     4. `hidePopover()` dispatches `beforetoggle`, removes `:popover-open` / `data-popover-open`, and dispatches `toggle` (`oldState: 'open'`, `newState: 'closed'`).
     5. `togglePopover(force)` conditionally shows or hides based on current state.
     6. `Element.prototype.matches` must be patched so `element.matches(':popover-open')` returns `true` when the popover is active, preventing selector syntax errors in headless DOM.
   - *Inference*: Shimming `HTMLElement.prototype` methods and patching `matches(':popover-open')` allows seamless testing of popovers, dropdowns, tooltips, and comboboxes.

5. **Deterministic `ResizeObserver` Controller**:
   - *Observation*: `LayoutIndicatorController` maps width to breakpoints (`xs`: 0–479, `sm`: 480–767, `md`: 768–1023, `lg`: 1024–1279, `xl`: >=1280), and `ChartContainer` updates SVG viewports.
   - *Reasoning*:
     1. Asynchronous layout engines cannot be relied upon in headless unit tests.
     2. A global `MockResizeObserver` class replaces `window.ResizeObserver`, registering each observed element and observer instance.
     3. `window.__triggerResize(element, { width, height, top, left })` updates `element.getBoundingClientRect()` synchronously, constructs a spec-compliant `ResizeObserverEntry` (with `contentRect`, `borderBoxSize`, `contentBoxSize`), and invokes all callbacks observing that element immediately.
   - *Inference*: Tests can deterministically invoke `window.__triggerResize(host, { width: 320 })`, `window.__triggerResize(host, { width: 800 })`, etc., and immediately assert synchronous updates.

---

## 3. Caveats

1. **No Out-of-Directory Modifications**:
   - In accordance with explorer archetype constraints, no modifications to `ui/src/test-setup.ts` were executed during this investigation. The verified plan is ready for the Milestone 1 worker.
2. **CSS Anchor Positioning Support**:
   - In `happy-dom`, CSS Anchor Positioning is not natively implemented. `supportsNativePopoverAndAnchor()` relies on `CSS.supports('anchor-name', '--moul-anchor')`. By having `CSS.supports` default to returning `false`, components will properly test their fixed-position fallback logic (Requirement 6.9, Edge Case 10). If an anchor test needs to simulate anchor support, it can mock `CSS.supports` to return `true`.
3. **Vitest Execution Environment**:
   - `ui/vite.config.ts` must set `test.environment = 'happy-dom'` and `setupFiles = ['./src/test-setup.ts']` (covered by `explorer_m1_2`).

---

## 4. Conclusion & Complete Implementation Plan

### Complete Source Code for `ui/src/test-setup.ts`

The worker should replace the entire contents of `/Users/phearak/github/orgs/moul-dev/ui/ui/src/test-setup.ts` with the following implementation:

```ts
/**
 * @moul-dev/ui Test Environment Setup
 *
 * Configures happy-dom environment with standards-compliant shims for:
 * 1. ElementInternals (Form-associated custom elements)
 * 2. Native <dialog> (including disconnected DOMException behavior per Req 6.10)
 * 3. Popover API (showPopover, hidePopover, togglePopover, :popover-open)
 * 4. Deterministic ResizeObserver Controller (__triggerResize)
 */

// =============================================================================
// 1. Web Animations API, CSS.supports & matchMedia shims
// =============================================================================

if (typeof window !== 'undefined' && !Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

if (typeof globalThis.CSS === 'undefined') {
  ;(globalThis as any).CSS = {}
}
if (typeof CSS.supports !== 'function') {
  CSS.supports = (_property: string, _value?: string) => false
}

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// =============================================================================
// 2. ElementInternals Shim
// =============================================================================

export interface MockElementInternals {
  readonly form: HTMLFormElement | null
  readonly validity: ValidityState
  readonly validationMessage: string
  readonly willValidate: boolean
  readonly labels: NodeList
  readonly shadowRoot: ShadowRoot | null
  setFormValue(value: string | File | FormData | null, state?: unknown): void
  setValidity(flags?: Partial<ValidityStateFlags>, message?: string, anchor?: HTMLElement): void
  checkValidity(): boolean
  reportValidity(): boolean
}

const internalsRegistry = new WeakMap<HTMLElement, MockElementInternals>()
const attachedElements = new WeakSet<HTMLElement>()

class MockElementInternalsImpl implements MockElementInternals {
  private _host: HTMLElement
  private _value: string | File | FormData | null = null
  private _validationMessage: string = ''
  private _flags: Record<keyof ValidityStateFlags, boolean> = {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valueMissing: false,
  }

  constructor(host: HTMLElement) {
    this._host = host
  }

  get form(): HTMLFormElement | null {
    const formId = this._host.getAttribute('form')
    if (formId && this._host.ownerDocument) {
      const formEl = this._host.ownerDocument.getElementById(formId)
      if (formEl && formEl.tagName === 'FORM') {
        return formEl as HTMLFormElement
      }
    }
    return this._host.closest('form')
  }

  get willValidate(): boolean {
    return true
  }

  get labels(): NodeList {
    return (this._host as any).labels ?? ([] as unknown as NodeList)
  }

  get shadowRoot(): ShadowRoot | null {
    return this._host.shadowRoot
  }

  setFormValue(value: string | File | FormData | null): void {
    this._value = value
  }

  get formValue(): string | File | FormData | null {
    return this._value
  }

  setValidity(
    flags?: Partial<ValidityStateFlags>,
    message?: string,
    _anchor?: HTMLElement,
  ): void {
    const newFlags = {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: false,
      ...flags,
    }
    this._flags = newFlags

    const isInvalid = Object.values(newFlags).some(Boolean)
    if (isInvalid) {
      this._validationMessage = typeof message === 'string' ? message.slice(0, 200) : ''
    } else {
      this._validationMessage = ''
    }
  }

  get validity(): ValidityState {
    const isInvalid = Object.values(this._flags).some(Boolean)
    return {
      badInput: this._flags.badInput,
      customError: this._flags.customError,
      patternMismatch: this._flags.patternMismatch,
      rangeOverflow: this._flags.rangeOverflow,
      rangeUnderflow: this._flags.rangeUnderflow,
      stepMismatch: this._flags.stepMismatch,
      tooLong: this._flags.tooLong,
      tooShort: this._flags.tooShort,
      typeMismatch: this._flags.typeMismatch,
      valueMissing: this._flags.valueMissing,
      valid: !isInvalid,
    }
  }

  get validationMessage(): string {
    return this._validationMessage
  }

  checkValidity(): boolean {
    const isValid = this.validity.valid
    if (!isValid) {
      this._host.dispatchEvent(new Event('invalid', { cancelable: true }))
    }
    return isValid
  }

  reportValidity(): boolean {
    return this.checkValidity()
  }
}

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.attachInternals = function (this: HTMLElement): ElementInternals {
    if (attachedElements.has(this)) {
      throw new DOMException('ElementInternals already attached', 'NotSupportedError')
    }
    attachedElements.add(this)
    const internals = new MockElementInternalsImpl(this)
    internalsRegistry.set(this, internals)
    return internals as unknown as ElementInternals
  }
}

if (typeof window !== 'undefined' && typeof (window as any).ElementInternals === 'undefined') {
  ;(window as any).ElementInternals = MockElementInternalsImpl
}
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).ElementInternals === 'undefined') {
  ;(globalThis as any).ElementInternals = MockElementInternalsImpl
}

// =============================================================================
// 3. Native <dialog> Shim (Requirement 6.10)
// =============================================================================

if (typeof window !== 'undefined' && typeof (window as any).HTMLDialogElement === 'undefined') {
  ;(window as any).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {}
  ;(globalThis as any).HTMLDialogElement = (window as any).HTMLDialogElement
}

if (typeof HTMLDialogElement !== 'undefined') {
  if (!Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'open')) {
    Object.defineProperty(HTMLDialogElement.prototype, 'open', {
      get(this: HTMLDialogElement) {
        return this.hasAttribute('open')
      },
      set(this: HTMLDialogElement, val: boolean) {
        if (val) {
          this.setAttribute('open', '')
        } else {
          this.removeAttribute('open')
        }
      },
      configurable: true,
      enumerable: true,
    })
  }

  if (!Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'returnValue')) {
    const returnValues = new WeakMap<HTMLDialogElement, string>()
    Object.defineProperty(HTMLDialogElement.prototype, 'returnValue', {
      get(this: HTMLDialogElement) {
        return returnValues.get(this) ?? ''
      },
      set(this: HTMLDialogElement, val: string) {
        returnValues.set(this, String(val))
      },
      configurable: true,
      enumerable: true,
    })
  }

  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    if (!this.isConnected) {
      throw new DOMException(
        'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.',
        'InvalidStateError',
      )
    }
    if (this.open) {
      throw new DOMException(
        'Failed to execute showModal on HTMLDialogElement: The element is already open.',
        'InvalidStateError',
      )
    }
    this.open = true
  }

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return
    this.open = false
    if (returnValue !== undefined) {
      this.returnValue = String(returnValue)
    }
    this.dispatchEvent(new Event('close'))
  }

  HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
    if (this.open) return
    this.open = true
  }
}

// =============================================================================
// 4. Popover API Shim
// =============================================================================

class MockToggleEvent extends Event {
  readonly oldState: string
  readonly newState: string

  constructor(
    type: string,
    eventInitDict?: { oldState?: string; newState?: string; cancelable?: boolean },
  ) {
    super(type, { bubbles: false, cancelable: eventInitDict?.cancelable ?? false })
    this.oldState = eventInitDict?.oldState ?? 'closed'
    this.newState = eventInitDict?.newState ?? 'open'
  }
}

if (typeof window !== 'undefined' && typeof (window as any).ToggleEvent === 'undefined') {
  ;(window as any).ToggleEvent = MockToggleEvent
  ;(globalThis as any).ToggleEvent = MockToggleEvent
}

if (typeof HTMLElement !== 'undefined') {
  if (!('popover' in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, 'popover', {
      get(this: HTMLElement) {
        return this.getAttribute('popover')
      },
      set(this: HTMLElement, val: string | null) {
        if (val === null || val === undefined) {
          this.removeAttribute('popover')
        } else {
          this.setAttribute('popover', val === '' ? 'auto' : val)
        }
      },
      configurable: true,
      enumerable: true,
    })
  }

  HTMLElement.prototype.showPopover = function (this: HTMLElement): void {
    if (this.getAttribute('popover') === null) {
      throw new DOMException(
        "Failed to execute 'showPopover' on 'HTMLElement': Element does not have a 'popover' attribute.",
        'InvalidStateError',
      )
    }
    if (!this.isConnected) {
      throw new DOMException(
        "Failed to execute 'showPopover' on 'HTMLElement': The element is not in a Document.",
        'InvalidStateError',
      )
    }
    const isOpen =
      this.hasAttribute(':popover-open') || this.classList.contains(':popover-open')
    if (isOpen) return

    const beforeEvent = new MockToggleEvent('beforetoggle', {
      oldState: 'closed',
      newState: 'open',
      cancelable: true,
    })
    const shouldContinue = this.dispatchEvent(beforeEvent)
    if (!shouldContinue) return

    this.setAttribute(':popover-open', '')
    this.classList.add(':popover-open')

    const toggleEvent = new MockToggleEvent('toggle', {
      oldState: 'closed',
      newState: 'open',
      cancelable: false,
    })
    this.dispatchEvent(toggleEvent)
  }

  HTMLElement.prototype.hidePopover = function (this: HTMLElement): void {
    if (this.getAttribute('popover') === null) {
      throw new DOMException(
        "Failed to execute 'hidePopover' on 'HTMLElement': Element does not have a 'popover' attribute.",
        'InvalidStateError',
      )
    }
    const isOpen =
      this.hasAttribute(':popover-open') || this.classList.contains(':popover-open')
    if (!isOpen) return

    const beforeEvent = new MockToggleEvent('beforetoggle', {
      oldState: 'open',
      newState: 'closed',
      cancelable: false,
    })
    this.dispatchEvent(beforeEvent)

    this.removeAttribute(':popover-open')
    this.classList.remove(':popover-open')

    const toggleEvent = new MockToggleEvent('toggle', {
      oldState: 'open',
      newState: 'closed',
      cancelable: false,
    })
    this.dispatchEvent(toggleEvent)
  }

  HTMLElement.prototype.togglePopover = function (this: HTMLElement, force?: boolean): boolean {
    const isOpen =
      this.hasAttribute(':popover-open') || this.classList.contains(':popover-open')
    if (force === true) {
      if (!isOpen) this.showPopover()
      return true
    }
    if (force === false) {
      if (isOpen) this.hidePopover()
      return false
    }
    if (isOpen) {
      this.hidePopover()
      return false
    } else {
      this.showPopover()
      return true
    }
  }

  // Support element.matches(':popover-open')
  const originalMatches = HTMLElement.prototype.matches
  HTMLElement.prototype.matches = function (this: HTMLElement, selector: string): boolean {
    if (selector === ':popover-open') {
      return this.hasAttribute(':popover-open') || this.classList.contains(':popover-open')
    }
    return originalMatches.call(this, selector)
  }
}

// =============================================================================
// 5. Deterministic ResizeObserver Controller
// =============================================================================

export interface TriggerResizeOptions {
  width: number
  height?: number
  top?: number
  left?: number
}

interface ObserverRecord {
  observer: MockResizeObserver
  callback: ResizeObserverCallback
  observedElements: Set<Element>
  options: Map<Element, ResizeObserverOptions | undefined>
}

const activeObservers = new Set<ObserverRecord>()

export class MockResizeObserver implements ResizeObserver {
  private _record: ObserverRecord

  constructor(callback: ResizeObserverCallback) {
    this._record = {
      observer: this,
      callback,
      observedElements: new Set(),
      options: new Map(),
    }
    activeObservers.add(this._record)
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    this._record.observedElements.add(target)
    this._record.options.set(target, options)
  }

  unobserve(target: Element): void {
    this._record.observedElements.delete(target)
    this._record.options.delete(target)
  }

  disconnect(): void {
    this._record.observedElements.clear()
    this._record.options.clear()
    activeObservers.delete(this._record)
  }
}

export function triggerResize(element: Element, options: TriggerResizeOptions): void {
  const width = options.width
  const height = options.height ?? 0
  const top = options.top ?? 0
  const left = options.left ?? 0

  const rect: DOMRect = {
    width,
    height,
    top,
    left,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({
      width,
      height,
      top,
      left,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
    }),
  }
  element.getBoundingClientRect = () => rect

  const contentRect = {
    width,
    height,
    top,
    left,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({
      width,
      height,
      top,
      left,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
    }),
  }

  const entry: ResizeObserverEntry = {
    target: element,
    contentRect: contentRect as DOMRectReadOnly,
    borderBoxSize: Object.freeze([{ inlineSize: width, blockSize: height }]),
    contentBoxSize: Object.freeze([{ inlineSize: width, blockSize: height }]),
    devicePixelContentBoxSize: Object.freeze([{ inlineSize: width, blockSize: height }]),
  }

  for (const record of activeObservers) {
    if (record.observedElements.has(element)) {
      record.callback([entry], record.observer)
    }
  }
}

if (typeof window !== 'undefined') {
  ;(window as any).ResizeObserver = MockResizeObserver
  ;(window as any).__triggerResize = triggerResize
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).ResizeObserver = MockResizeObserver
  ;(globalThis as any).__triggerResize = triggerResize
}

declare global {
  interface Window {
    __triggerResize: (element: Element, options: TriggerResizeOptions) => void
  }
}
```

---

## 5. Verification Method

### 1. Test Verification Strategy
To independently verify the 4 shims in `ui/src/test-setup.ts`, the worker can run a self-verifying test (e.g. in `ui/src/test-setup.test.ts` or during `Tokens.test.ts` execution):

```ts
import { describe, expect, it, vi } from 'vitest'

describe('ui/src/test-setup.ts Shims', () => {
  describe('ElementInternals Shim', () => {
    it('attaches internals, tracks form, value, validity, and message truncation', () => {
      const form = document.createElement('form')
      const host = document.createElement('div')
      form.appendChild(host)
      document.body.appendChild(form)

      const internals = host.attachInternals()
      expect(internals).toBeDefined()
      expect(internals.form).toBe(form)

      // Test value setting
      internals.setFormValue('test-val')

      // Test validity & truncation to <= 200 chars
      const longMessage = 'A'.repeat(300)
      internals.setValidity({ valueMissing: true }, longMessage)
      expect(internals.validity.valid).toBe(false)
      expect(internals.validity.valueMissing).toBe(true)
      expect(internals.validationMessage.length).toBe(200)

      // Reset to valid
      internals.setValidity({})
      expect(internals.validity.valid).toBe(true)
      expect(internals.validationMessage).toBe('')

      // Double attach should throw
      expect(() => host.attachInternals()).toThrowError(/ElementInternals already attached/)

      document.body.removeChild(form)
    })
  })

  describe('Native <dialog> Shim', () => {
    it('throws InvalidStateError when showModal() is called disconnected per Req 6.10', () => {
      const dialog = document.createElement('dialog') as HTMLDialogElement
      expect(dialog.isConnected).toBe(false)

      expect(() => dialog.showModal()).toThrow(
        'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.',
      )
    })

    it('sets open when connected and dispatches close event on close()', () => {
      const dialog = document.createElement('dialog') as HTMLDialogElement
      document.body.appendChild(dialog)
      expect(dialog.open).toBe(false)

      dialog.showModal()
      expect(dialog.open).toBe(true)
      expect(dialog.hasAttribute('open')).toBe(true)

      const onClose = vi.fn()
      dialog.addEventListener('close', onClose)
      dialog.close('custom-return')

      expect(dialog.open).toBe(false)
      expect(dialog.hasAttribute('open')).toBe(false)
      expect(dialog.returnValue).toBe('custom-return')
      expect(onClose).toHaveBeenCalledOnce()

      document.body.removeChild(dialog)
    })
  })

  describe('Popover API Shim', () => {
    it('supports popover property, showPopover, hidePopover, and toggle event', () => {
      const popover = document.createElement('div')
      expect('popover' in popover).toBe(true)

      // Throws if popover attribute is missing
      document.body.appendChild(popover)
      expect(() => popover.showPopover()).toThrowError(/not a popover/)

      popover.setAttribute('popover', 'auto')
      const onToggle = vi.fn()
      popover.addEventListener('toggle', onToggle)

      popover.showPopover()
      expect(popover.matches(':popover-open')).toBe(true)
      expect(onToggle).toHaveBeenCalledTimes(1)
      expect((onToggle.mock.calls[0][0] as any).newState).toBe('open')

      popover.hidePopover()
      expect(popover.matches(':popover-open')).toBe(false)
      expect(onToggle).toHaveBeenCalledTimes(2)
      expect((onToggle.mock.calls[1][0] as any).newState).toBe('closed')

      document.body.removeChild(popover)
    })
  })

  describe('Deterministic ResizeObserver Controller', () => {
    it('allows tests to register observers and deterministically fires callbacks via __triggerResize', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)

      const callback = vi.fn()
      const observer = new ResizeObserver(callback)
      observer.observe(el)

      window.__triggerResize(el, { width: 768, height: 400 })

      expect(callback).toHaveBeenCalledOnce()
      const [entries, obs] = callback.mock.calls[0]
      expect(obs).toBe(observer)
      expect(entries[0].target).toBe(el)
      expect(entries[0].contentRect.width).toBe(768)
      expect(entries[0].contentRect.height).toBe(400)
      expect(el.getBoundingClientRect().width).toBe(768)

      observer.disconnect()
      document.body.removeChild(el)
    })
  })
})
```

### 2. Invalidation Conditions
- If `HTMLDialogElement.prototype.showModal` does not throw `'Failed to execute showModal on HTMLDialogElement: The element is not in a Document.'` when unattached, Requirement 6.10 fails.
- If `ElementInternals.setValidity` does not truncate messages to `<= 200` characters, FormInternalsController validation tests fail.
- If `'popover' in HTMLElement.prototype` is `false`, `supportsNativePopoverAndAnchor()` falsely rejects popovers.
- If `window.__triggerResize` does not synchronously fire `ResizeObserverEntry`, responsive component tests will flake or time out.
