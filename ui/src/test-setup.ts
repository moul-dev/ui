/**
 * @moul-dev/ui Test Environment Setup
 *
 * Configures happy-dom environment with standards-compliant shims for:
 * 1. ElementInternals (Form-associated custom elements)
 * 2. Native <dialog> (including disconnected DOMException behavior per Req 6.10)
 * 3. Popover API (showPopover, hidePopover, togglePopover, :popover-open)
 * 4. Deterministic ResizeObserver Controller (__triggerResize)
 */

import HTMLElementConfig from 'happy-dom/lib/config/HTMLElementConfig.js'

// Fix Happy-DOM fragment parser stripping table elements in <template>
if (HTMLElementConfig) {
  for (const tag of ['th', 'td', 'tr', 'tbody', 'thead', 'tfoot']) {
    const cfg = (HTMLElementConfig as Record<string, any>)[tag]
    if (cfg?.permittedParents && !cfg.permittedParents.includes(undefined)) {
      cfg.permittedParents.push(undefined)
    }
  }
}

// =============================================================================
// 1. Web Animations API, CSS.supports & matchMedia shims
// =============================================================================

const BaseElementClass =
  (typeof window !== 'undefined' && window.Element) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).Element)

if (BaseElementClass && !BaseElementClass.prototype.getAnimations) {
  BaseElementClass.prototype.getAnimations = () => []
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
  setValidity(
    flags?: Partial<ValidityStateFlags>,
    message?: string,
    anchor?: HTMLElement,
  ): void
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
    let formEl: HTMLElement | null = null
    if (formId && this._host.ownerDocument) {
      const el = this._host.ownerDocument.getElementById(formId)
      if (el && el.tagName === 'FORM') {
        formEl = el
      }
    }
    if (!formEl) {
      formEl = this._host.closest('form')
    }
    if (!formEl) return null

    // In Happy DOM, HTMLFormElement wraps instances in an internal Proxy
    const symbols = Object.getOwnPropertySymbols(formEl)
    const proxySym = symbols.find((s) => s.toString() === 'Symbol(proxy)')
    if (proxySym && (formEl as any)[proxySym]) {
      return (formEl as any)[proxySym] as HTMLFormElement
    }
    return formEl as HTMLFormElement
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
      this._validationMessage =
        typeof message === 'string' ? message.slice(0, 200) : ''
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

const HtmlElementClass =
  (typeof window !== 'undefined' && window.HTMLElement) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).HTMLElement)

if (HtmlElementClass) {
  HtmlElementClass.prototype.attachInternals = function (
    this: HTMLElement,
  ): ElementInternals {
    if (attachedElements.has(this)) {
      throw new DOMException(
        'ElementInternals already attached',
        'NotSupportedError',
      )
    }
    attachedElements.add(this)
    const internals = new MockElementInternalsImpl(this)
    internalsRegistry.set(this, internals)
    return internals as unknown as ElementInternals
  }
}

if (
  typeof window !== 'undefined' &&
  typeof (window as any).ElementInternals === 'undefined'
) {
  ;(window as any).ElementInternals = MockElementInternalsImpl
}
if (
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as any).ElementInternals === 'undefined'
) {
  ;(globalThis as any).ElementInternals = MockElementInternalsImpl
}

// =============================================================================
// 3. Native <dialog> Shim (Requirement 6.10)
// =============================================================================

const DialogClass =
  (typeof window !== 'undefined' && (window as any).HTMLDialogElement) ||
  (typeof globalThis !== 'undefined' &&
    (globalThis as any).HTMLDialogElement) ||
  class HTMLDialogElement extends (HtmlElementClass || Object) {}

if (typeof window !== 'undefined') {
  ;(window as any).HTMLDialogElement = DialogClass
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).HTMLDialogElement = DialogClass
}

if (DialogClass && DialogClass.prototype) {
  if (!Object.getOwnPropertyDescriptor(DialogClass.prototype, 'open')) {
    Object.defineProperty(DialogClass.prototype, 'open', {
      get(this: any) {
        return this.hasAttribute('open')
      },
      set(this: any, val: boolean) {
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

  if (!Object.getOwnPropertyDescriptor(DialogClass.prototype, 'returnValue')) {
    const returnValues = new WeakMap<any, string>()
    Object.defineProperty(DialogClass.prototype, 'returnValue', {
      get(this: any) {
        return returnValues.get(this) ?? ''
      },
      set(this: any, val: string) {
        returnValues.set(this, String(val))
      },
      configurable: true,
      enumerable: true,
    })
  }

  DialogClass.prototype.showModal = function (this: any) {
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

  DialogClass.prototype.close = function (this: any, returnValue?: string) {
    if (!this.open) return
    this.open = false
    if (returnValue !== undefined) {
      this.returnValue = String(returnValue)
    }
    this.dispatchEvent(new Event('close'))
  }

  DialogClass.prototype.show = function (this: any) {
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
    eventInitDict?: {
      oldState?: string
      newState?: string
      cancelable?: boolean
    },
  ) {
    super(type, {
      bubbles: false,
      cancelable: eventInitDict?.cancelable ?? false,
    })
    this.oldState = eventInitDict?.oldState ?? 'closed'
    this.newState = eventInitDict?.newState ?? 'open'
  }
}

if (
  typeof window !== 'undefined' &&
  typeof (window as any).ToggleEvent === 'undefined'
) {
  ;(window as any).ToggleEvent = MockToggleEvent
}
if (
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as any).ToggleEvent === 'undefined'
) {
  ;(globalThis as any).ToggleEvent = MockToggleEvent
}

if (HtmlElementClass) {
  if (!('popover' in HtmlElementClass.prototype)) {
    Object.defineProperty(HtmlElementClass.prototype, 'popover', {
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

  HtmlElementClass.prototype.showPopover = function (this: HTMLElement): void {
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
      this.hasAttribute(':popover-open') ||
      this.classList.contains(':popover-open')
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

  HtmlElementClass.prototype.hidePopover = function (this: HTMLElement): void {
    if (this.getAttribute('popover') === null) {
      throw new DOMException(
        "Failed to execute 'hidePopover' on 'HTMLElement': Element does not have a 'popover' attribute.",
        'InvalidStateError',
      )
    }
    const isOpen =
      this.hasAttribute(':popover-open') ||
      this.classList.contains(':popover-open')
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

  HtmlElementClass.prototype.togglePopover = function (
    this: HTMLElement,
    force?: boolean,
  ): boolean {
    const isOpen =
      this.hasAttribute(':popover-open') ||
      this.classList.contains(':popover-open')
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
  if (BaseElementClass && BaseElementClass.prototype) {
    const originalMatches = BaseElementClass.prototype.matches
    BaseElementClass.prototype.matches = function (
      this: Element,
      selector: string,
    ): boolean {
      if (selector === ':popover-open') {
        return (
          this.hasAttribute(':popover-open') ||
          this.classList.contains(':popover-open')
        )
      }
      return originalMatches.call(this, selector)
    }
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

export function triggerResize(
  element: Element,
  options: TriggerResizeOptions,
): void {
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
    devicePixelContentBoxSize: Object.freeze([
      { inlineSize: width, blockSize: height },
    ]),
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
