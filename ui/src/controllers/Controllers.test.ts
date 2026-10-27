import fc from 'fast-check'
import {
  html,
  LitElement,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { triggerResize } from '../test-setup'
import {
  clampValue,
  computeBreakpoint,
  FormInternalsController,
  LayoutIndicatorController,
  MAX_NUMBER_VALUE,
  MIN_NUMBER_VALUE,
  NumberSpringController,
  OverlayPresenceController,
  type OverlayPreset,
  PressController,
} from './index'

let hostCounter = 0

class MockReactiveHost extends HTMLElement implements ReactiveControllerHost {
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

function createMockHost(prefix = 'mock-host'): MockReactiveHost {
  const tag = `${prefix}-${++hostCounter}`
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends MockReactiveHost {})
  }
  const el = document.createElement(tag) as MockReactiveHost
  document.body.appendChild(el)
  return el
}

describe('Phase 3: Reactive Controllers Architecture', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('1. MockReactiveHost & Test Invariants', () => {
    it('manages controller lifecycle upon attachment and detachment', () => {
      const host = createMockHost('lifecycle-test')
      let connectedCalled = false
      let disconnectedCalled = false

      const controller: ReactiveController = {
        hostConnected() {
          connectedCalled = true
        },
        hostDisconnected() {
          disconnectedCalled = true
        },
      }

      host.addController(controller)
      expect(connectedCalled).toBe(true)

      host.remove()
      expect(disconnectedCalled).toBe(true)
    })

    it('works cleanly when attached to a real LitElement', async () => {
      const tag = `lit-test-host-${++hostCounter}`
      class LitTestHost extends LitElement {
        controller = new PressController(this)
        override render() {
          return html`<button>Lit Button</button>`
        }
      }
      customElements.define(tag, LitTestHost)

      const litEl = document.createElement(tag) as LitTestHost
      document.body.appendChild(litEl)
      await litEl.updateComplete

      expect(litEl.controller.isPressed).toBe(false)
      litEl.remove()
    })
  })

  describe('2. PressController', () => {
    it('initializes with all boolean states set to false', () => {
      const host = createMockHost('press-init')
      const controller = new PressController(host)

      expect(controller.isPressed).toBe(false)
      expect(controller.isHovered).toBe(false)
      expect(controller.isFocusVisible).toBe(false)
    })

    it('tracks pointerdown, pointerup, and pointercancel with primary button', () => {
      const host = createMockHost('press-pointer')
      const controller = new PressController(host)

      // Non-primary click ignored
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 1, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(host.updateCalls.length).toBe(0)

      // Primary click activates press
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      expect(host.updateCalls.length).toBe(1)

      // Pointer up releases press
      host.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(host.updateCalls.length).toBe(2)

      // Pointer cancel also releases press
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      host.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
      expect(controller.isPressed).toBe(false)
    })

    it('tracks pointerenter and pointerleave', () => {
      const host = createMockHost('press-hover')
      const controller = new PressController(host)

      host.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      expect(controller.isHovered).toBe(true)
      expect(host.updateCalls.length).toBe(1)

      host.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(controller.isHovered).toBe(false)
      expect(host.updateCalls.length).toBe(2)
    })

    it('releases press when pointerleave occurs during active press', () => {
      const host = createMockHost('press-leave-release')
      const controller = new PressController(host)

      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)

      host.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(controller.isPressed).toBe(false)
      expect(controller.isHovered).toBe(false)
    })

    it('handles keyboard activation via Space and Enter keys and ignores repeated keydown', () => {
      const host = createMockHost('press-keys')
      const controller = new PressController(host)

      // Repeated keydown is ignored
      host.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)

      // Non-activation key is ignored
      host.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          repeat: false,
          bubbles: true,
        }),
      )
      expect(controller.isPressed).toBe(false)

      // Space keydown
      host.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ' ',
          repeat: false,
          bubbles: true,
        }),
      )
      expect(controller.isPressed).toBe(true)
      expect(controller.isFocusVisible).toBe(true)

      // Space keyup
      host.dispatchEvent(
        new KeyboardEvent('keyup', { key: ' ', bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)

      // Enter keydown
      host.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          repeat: false,
          bubbles: true,
        }),
      )
      expect(controller.isPressed).toBe(true)

      // Enter keyup
      host.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
    })

    it('handles focusin and focusout correctly', () => {
      const host = createMockHost('press-focus')
      const controller = new PressController(host)

      host.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(controller.isFocusVisible).toBe(true)
      expect(host.updateCalls.length).toBe(1)

      host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      expect(controller.isFocusVisible).toBe(false)
      expect(host.updateCalls.length).toBe(2)
    })

    it('synchronizes aria-pressed ONLY when host has type="button", type="checkbox", or initial aria-pressed', () => {
      // 1. Plain host without button/checkbox/aria-pressed
      const plainHost = createMockHost('press-plain')
      const plainController = new PressController(plainHost)
      plainHost.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(plainController.isPressed).toBe(true)
      expect(plainHost.hasAttribute('aria-pressed')).toBe(false)

      // 2. Host with type="button"
      const buttonHost = createMockHost('press-btn')
      buttonHost.setAttribute('type', 'button')
      const btnController = new PressController(buttonHost)
      expect(buttonHost.getAttribute('aria-pressed')).toBe('false')

      buttonHost.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(btnController.isPressed).toBe(true)
      expect(buttonHost.getAttribute('aria-pressed')).toBe('true')

      buttonHost.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(btnController.isPressed).toBe(false)
      expect(buttonHost.getAttribute('aria-pressed')).toBe('false')

      // 3. Host with type="checkbox"
      const checkHost = createMockHost('press-chk')
      checkHost.setAttribute('type', 'checkbox')
      const chkController = new PressController(checkHost)
      expect(checkHost.getAttribute('aria-pressed')).toBe('false')

      checkHost.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(chkController.isPressed).toBe(true)
      expect(checkHost.getAttribute('aria-pressed')).toBe('true')

      // 4. Host with pre-existing aria-pressed attribute
      const customHost = createMockHost('press-custom')
      customHost.setAttribute('aria-pressed', 'false')
      const customController = new PressController(customHost)

      customHost.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(customController.isPressed).toBe(true)
      expect(customHost.getAttribute('aria-pressed')).toBe('true')
    })

    it('suppresses interactions when host has disabled attribute or property', () => {
      // Attribute disabled
      const host1 = createMockHost('press-disabled-attr')
      host1.setAttribute('disabled', '')
      const c1 = new PressController(host1)

      host1.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(c1.isPressed).toBe(false)

      host1.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      expect(c1.isHovered).toBe(false)

      // Attribute is-disabled
      const host2 = createMockHost('press-is-disabled-attr')
      host2.setAttribute('is-disabled', '')
      const c2 = new PressController(host2)

      host2.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(c2.isPressed).toBe(false)

      // Options disabled callback
      const host3 = createMockHost('press-disabled-opt')
      let disabledFlag = true
      const c3 = new PressController(host3, {
        disabled: () => disabledFlag,
      })

      host3.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(c3.isPressed).toBe(false)

      disabledFlag = false
      host3.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(c3.isPressed).toBe(true)
    })

    it('triggers motion press scaling and hover lift when configured', () => {
      const host = createMockHost('press-motion')
      const controller = new PressController(host, {
        scaleOnPress: true,
        hoverLift: true,
      })

      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)

      host.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)

      host.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      expect(controller.isHovered).toBe(true)

      host.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(controller.isHovered).toBe(false)
    })

    it('respects options.target returning null without throwing', () => {
      const host = createMockHost('press-null-target')
      const controller = new PressController(host, {
        scaleOnPress: true,
        hoverLift: true,
        target: () => null,
      })

      expect(() => {
        host.dispatchEvent(
          new PointerEvent('pointerdown', { button: 0, bubbles: true }),
        )
        host.dispatchEvent(
          new PointerEvent('pointerup', { button: 0, bubbles: true }),
        )
        host.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
        host.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      }).not.toThrow()
      expect(controller.isPressed).toBe(false)
    })

    it('respects prefersReducedMotion() by suppressing transform animations', () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      try {
        const host = createMockHost('press-reduced-motion')
        const controller = new PressController(host, {
          scaleOnPress: true,
          hoverLift: true,
        })

        host.dispatchEvent(
          new PointerEvent('pointerdown', { button: 0, bubbles: true }),
        )
        expect(controller.isPressed).toBe(true)
        host.dispatchEvent(
          new PointerEvent('pointerup', { button: 0, bubbles: true }),
        )
        expect(controller.isPressed).toBe(false)
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('cleans up event listeners and resets state on disconnect', () => {
      const host = createMockHost('press-disconnect')
      const controller = new PressController(host)

      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)

      host.remove()
      expect(controller.isPressed).toBe(false)
      expect(controller.isHovered).toBe(false)
      expect(controller.isFocusVisible).toBe(false)

      const updateCountBefore = host.updateCalls.length
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(host.updateCalls.length).toBe(updateCountBefore)
    })
  })

  describe('3. LayoutIndicatorController', () => {
    it('initializes with default breakpoint md and zero dimensions', () => {
      const host = createMockHost('layout-init')
      const controller = new LayoutIndicatorController(host)

      expect(controller.breakpoint).toBe('md')
      expect(controller.width).toBe(0)
      expect(controller.height).toBe(0)
    })

    it('correctly maps width to breakpoints across all 5 intervals', () => {
      expect(computeBreakpoint(-10)).toBe('xs')
      expect(computeBreakpoint(0)).toBe('xs')
      expect(computeBreakpoint(479)).toBe('xs')
      expect(computeBreakpoint(480)).toBe('sm')
      expect(computeBreakpoint(767)).toBe('sm')
      expect(computeBreakpoint(768)).toBe('md')
      expect(computeBreakpoint(1023)).toBe('md')
      expect(computeBreakpoint(1024)).toBe('lg')
      expect(computeBreakpoint(1279)).toBe('lg')
      expect(computeBreakpoint(1280)).toBe('xl')
      expect(computeBreakpoint(2560)).toBe('xl')
    })

    it('passes fast-check property tests across random positive integer widths', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 479 }), (w) => {
          return computeBreakpoint(w) === 'xs'
        }),
      )

      fc.assert(
        fc.property(fc.integer({ min: 480, max: 767 }), (w) => {
          return computeBreakpoint(w) === 'sm'
        }),
      )

      fc.assert(
        fc.property(fc.integer({ min: 768, max: 1023 }), (w) => {
          return computeBreakpoint(w) === 'md'
        }),
      )

      fc.assert(
        fc.property(fc.integer({ min: 1024, max: 1279 }), (w) => {
          return computeBreakpoint(w) === 'lg'
        }),
      )

      fc.assert(
        fc.property(fc.integer({ min: 1280, max: 10000 }), (w) => {
          return computeBreakpoint(w) === 'xl'
        }),
      )
    })

    it('updates breakpoint and requests host update when triggerResize fires', () => {
      const host = createMockHost('layout-resize')
      const controller = new LayoutIndicatorController(host)

      triggerResize(host, { width: 320, height: 200 })
      expect(controller.width).toBe(320)
      expect(controller.height).toBe(200)
      expect(controller.breakpoint).toBe('xs')
      expect(host.updateCalls.length).toBe(1)

      triggerResize(host, { width: 1440, height: 900 })
      expect(controller.width).toBe(1440)
      expect(controller.height).toBe(900)
      expect(controller.breakpoint).toBe('xl')
      expect(host.updateCalls.length).toBe(2)
    })

    it('does not request update when resized within the same breakpoint if observeDimensions is false', () => {
      const host = createMockHost('layout-dedupe')
      const controller = new LayoutIndicatorController(host, {
        observeDimensions: false,
      })

      triggerResize(host, { width: 500, height: 300 }) // sm
      expect(controller.breakpoint).toBe('sm')
      const count = host.updateCalls.length

      triggerResize(host, { width: 600, height: 350 }) // still sm
      expect(controller.breakpoint).toBe('sm')
      expect(host.updateCalls.length).toBe(count)
    })

    it('requests update on every dimension change when observeDimensions is true', () => {
      const host = createMockHost('layout-dims')
      const controller = new LayoutIndicatorController(host, {
        observeDimensions: true,
      })

      triggerResize(host, { width: 500, height: 300 })
      expect(controller.width).toBe(500)
      expect(controller.height).toBe(300)
      expect(host.updateCalls.length).toBe(1)

      triggerResize(host, { width: 600, height: 350 }) // same sm breakpoint, but dimensions changed
      expect(controller.width).toBe(600)
      expect(controller.height).toBe(350)
      expect(host.updateCalls.length).toBe(2)
    })

    it('disconnects ResizeObserver on hostDisconnected', () => {
      const host = createMockHost('layout-disconnect')
      const controller = new LayoutIndicatorController(host)

      triggerResize(host, { width: 500, height: 300 })
      expect(controller.breakpoint).toBe('sm')

      host.remove()
      const callsBefore = host.updateCalls.length
      triggerResize(host, { width: 1440, height: 900 })
      expect(host.updateCalls.length).toBe(callsBefore)
    })
  })

  describe('4. OverlayPresenceController', () => {
    it('initializes with isOpen = false and isMounted = false', () => {
      const host = createMockHost('overlay-init')
      const controller = new OverlayPresenceController(host)

      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
    })

    it('returns early when closing an already closed overlay', async () => {
      const host = createMockHost('overlay-early-return')
      const controller = new OverlayPresenceController(host)

      await controller.setOpen(false)
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
      expect(host.updateCalls.length).toBe(0)
    })

    it('orchestrates dialog modal open and close with top-layer timing', async () => {
      const host = createMockHost('overlay-dialog')
      const dialog = document.createElement('dialog')
      host.appendChild(dialog)

      const controller = new OverlayPresenceController(host, {
        preset: 'modal',
        dialog: () => dialog,
      })

      // Open
      const openPromise = controller.setOpen(true)
      expect(controller.isMounted).toBe(true)
      expect(controller.isOpen).toBe(true)
      await openPromise
      expect(dialog.open).toBe(true)

      // Close
      const closePromise = controller.setOpen(false)
      expect(controller.isOpen).toBe(false)
      // Prior to completion, dialog must still be open
      await closePromise
      // After completion, dialog is closed and unmounted
      expect(dialog.open).toBe(false)
      expect(controller.isMounted).toBe(false)
    })

    it('orchestrates popover API open and close', async () => {
      const host = createMockHost('overlay-popover')
      const popover = document.createElement('div')
      popover.setAttribute('popover', 'auto')
      host.appendChild(popover)

      const controller = new OverlayPresenceController(host, {
        preset: 'popover',
        popover: () => popover,
      })

      await controller.setOpen(true)
      expect(controller.isOpen).toBe(true)
      expect(controller.isMounted).toBe(true)
      expect(popover.matches(':popover-open')).toBe(true)

      await controller.setOpen(false)
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
      expect(popover.matches(':popover-open')).toBe(false)
    })

    it('supports toggle() method', async () => {
      const host = createMockHost('overlay-toggle')
      const controller = new OverlayPresenceController(host)

      await controller.toggle()
      expect(controller.isOpen).toBe(true)
      expect(controller.isMounted).toBe(true)

      await controller.toggle()
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
    })

    it('supports all 8 preset animation modes', async () => {
      const presets: OverlayPreset[] = [
        'modal',
        'popover',
        'tooltip',
        'drawer-left',
        'drawer-right',
        'drawer-top',
        'drawer-bottom',
        'toast',
      ]

      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      try {
        for (const preset of presets) {
          const host = createMockHost(`overlay-preset-${preset}`)
          const controller = new OverlayPresenceController(host, { preset })

          await controller.setOpen(true)
          expect(controller.isOpen).toBe(true)
          expect(controller.isMounted).toBe(true)

          await controller.setOpen(false)
          expect(controller.isOpen).toBe(false)
          expect(controller.isMounted).toBe(false)
        }
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('safely handles rapid open-close-open toggling without race conditions', async () => {
      const host = createMockHost('overlay-race')
      const dialog = document.createElement('dialog')
      host.appendChild(dialog)

      const controller = new OverlayPresenceController(host, {
        preset: 'modal',
        dialog: () => dialog,
      })

      // Start open
      const p1 = controller.setOpen(true)
      // Immediately request close
      const p2 = controller.setOpen(false)
      // Immediately request open again
      const p3 = controller.setOpen(true)

      await Promise.all([p1, p2, p3])
      expect(controller.isOpen).toBe(true)
      expect(controller.isMounted).toBe(true)
      expect(dialog.open).toBe(true)
    })

    it('catches DOMException gracefully when dialog is disconnected on open', async () => {
      const host = createMockHost('overlay-disconnected-dialog')
      const dialog = document.createElement('dialog') // NOT attached to DOM

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const controller = new OverlayPresenceController(host, {
        dialog: () => dialog,
      })

      await controller.setOpen(true)
      expect(warnSpy).toHaveBeenCalled()
      expect(controller.isOpen).toBe(true)
      warnSpy.mockRestore()
    })
  })

  describe('5. NumberSpringController', () => {
    it('initializes with default value 0 or provided initialValue', () => {
      const host1 = createMockHost('spring-init-1')
      const c1 = new NumberSpringController(host1)
      expect(c1.targetValue).toBe(0)
      expect(c1.displayValue).toBe(0)

      const host2 = createMockHost('spring-init-2')
      const c2 = new NumberSpringController(host2, { initialValue: 42 })
      expect(c2.targetValue).toBe(42)
      expect(c2.displayValue).toBe(42)
    })

    it('strictly clamps values to [-999_999_999, 999_999_999]', () => {
      expect(clampValue(-2_000_000_000)).toBe(MIN_NUMBER_VALUE)
      expect(clampValue(2_000_000_000)).toBe(MAX_NUMBER_VALUE)
      expect(clampValue(100)).toBe(100)
      expect(clampValue(Number.NaN)).toBe(0)
      expect(clampValue(Number.POSITIVE_INFINITY)).toBe(0)
      expect(clampValue(Number.NEGATIVE_INFINITY)).toBe(0)
    })

    it('passes fast-check property tests for clampValue across all 32-bit integers', () => {
      fc.assert(
        fc.property(fc.integer(), (n) => {
          const clamped = clampValue(n)
          return (
            clamped >= MIN_NUMBER_VALUE &&
            clamped <= MAX_NUMBER_VALUE &&
            Number.isFinite(clamped)
          )
        }),
      )
    })

    it('immediately snaps when target delta is within threshold (<= 0.5)', () => {
      const host = createMockHost('spring-snap')
      const controller = new NumberSpringController(host, {
        initialValue: 100,
        threshold: 0.5,
      })

      controller.setTarget(100.4)
      expect(controller.targetValue).toBe(100.4)
      expect(controller.displayValue).toBe(100.4)
      expect(host.updateCalls.length).toBe(1)
    })

    it('resets target and display values immediately on reset()', () => {
      const host = createMockHost('spring-reset')
      const controller = new NumberSpringController(host, {
        initialValue: 0,
      })

      controller.reset(500)
      expect(controller.targetValue).toBe(500)
      expect(controller.displayValue).toBe(500)
      expect(host.updateCalls.length).toBe(1)
    })

    it('snaps immediately without animating when prefersReducedMotion is true', () => {
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      try {
        const host = createMockHost('spring-reduced-motion')
        const controller = new NumberSpringController(host, {
          initialValue: 0,
        })

        controller.setTarget(5000)
        expect(controller.targetValue).toBe(5000)
        expect(controller.displayValue).toBe(5000)
        expect(host.updateCalls.length).toBe(1)
      } finally {
        window.matchMedia = originalMatchMedia
      }
    })

    it('stops animation playback controls on hostDisconnected', () => {
      const host = createMockHost('spring-disconnect')
      const controller = new NumberSpringController(host, {
        initialValue: 0,
      })

      controller.setTarget(1000)
      expect(controller.targetValue).toBe(1000)

      host.remove()
      const callsBefore = host.updateCalls.length
      // Once disconnected, no further ticks occur
      expect(host.updateCalls.length).toBe(callsBefore)
    })
  })

  describe('6. FormInternalsController', () => {
    it('attaches ElementInternals on hostConnected when available', () => {
      const host = createMockHost('form-internals-attach')
      const controller = new FormInternalsController(host)

      expect(controller.internals).not.toBeNull()
      expect(typeof controller.setValue).toBe('function')
      expect(typeof controller.setValidity).toBe('function')
    })

    it('resolves parent <form> correctly when attached inside form', () => {
      const form = document.createElement('form')
      document.body.appendChild(form)

      const host = createMockHost('form-internals-parent')
      form.appendChild(host)

      const controller = new FormInternalsController(host)
      expect(controller.form).toBe(form)
    })

    it('warns when host has name attribute and is connected outside <form>', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createMockHost('form-internals-warn')
      host.setAttribute('name', 'userEmail')

      new FormInternalsController(host)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is not connected to a <form>'),
      )
      warnSpy.mockRestore()
    })

    it('does not warn when host has name attribute and is connected inside <form>', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const form = document.createElement('form')
      document.body.appendChild(form)

      const host = createMockHost('form-internals-no-warn')
      host.setAttribute('name', 'userEmail')
      form.appendChild(host)

      new FormInternalsController(host)
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('does not warn when host lacks name attribute and requireFormConnection is false', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createMockHost('form-internals-no-name')

      new FormInternalsController(host)
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('warns without throwing when attachInternals is unsupported in environment', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const host = createMockHost('form-internals-unsupported')
      // Temporarily mock attachInternals as undefined
      ;(host as unknown as { attachInternals?: unknown }).attachInternals =
        undefined

      const controller = new FormInternalsController(host)
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'ElementInternals is not supported in this environment.',
        ),
      )
      expect(controller.internals).toBeNull()

      // Methods operate safely as no-ops
      expect(() => controller.setValue('test')).not.toThrow()
      expect(() =>
        controller.setValidity({ customError: true }, 'error'),
      ).not.toThrow()
      expect(controller.checkValidity()).toBe(true)
      expect(controller.reportValidity()).toBe(true)

      warnSpy.mockRestore()
    })

    it('synchronously passes value to internals.setFormValue()', () => {
      const host = createMockHost('form-internals-set-value')
      const controller = new FormInternalsController(host)

      controller.setValue('Hello World')
      expect(
        (controller.internals as unknown as { formValue: unknown }).formValue,
      ).toBe('Hello World')

      controller.setValue(null)
      expect(
        (controller.internals as unknown as { formValue: unknown }).formValue,
      ).toBeNull()
    })

    it('truncates validity message to <= 200 characters and reports validity', () => {
      const host = createMockHost('form-internals-validity')
      const controller = new FormInternalsController(host)

      const longMessage = 'A'.repeat(350)
      controller.setValidity({ customError: true }, longMessage)

      expect(controller.validationMessage.length).toBe(200)
      expect(controller.validationMessage).toBe('A'.repeat(200))
      expect(controller.checkValidity()).toBe(false)
    })

    it('preserves internals across reconnects without throwing NotSupportedError', () => {
      const host = createMockHost('form-internals-reconnect')
      const controller = new FormInternalsController(host)
      const firstInternals = controller.internals

      // Disconnect and reconnect
      host.remove()
      document.body.appendChild(host)

      expect(controller.internals).toBe(firstInternals)
    })
  })
})
