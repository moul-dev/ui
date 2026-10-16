import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { triggerResize } from '../test-setup'
import {
  computeBreakpoint,
  LayoutIndicatorController,
  OverlayPresenceController,
  type OverlayPreset,
  PressController,
} from './index'

let hostId = 0

class ChallengeMockHost extends HTMLElement implements ReactiveControllerHost {
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

function createChallengeHost(prefix = 'challenge-host'): ChallengeMockHost {
  const tag = `${prefix}-${++hostId}`
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends ChallengeMockHost {})
  }
  const el = document.createElement(tag) as ChallengeMockHost
  document.body.appendChild(el)
  return el
}

describe('Adversarial Challenger Test Suite: Press, LayoutIndicator, OverlayPresence', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  // =========================================================================
  // 1. Adversarial Challenge: PressController
  // =========================================================================
  describe('Adversarial Challenge: PressController', () => {
    it('survives 1,000 rapid pointerdown/up/cancel cycles without state drift or exception', () => {
      const host = createChallengeHost('press-stress')
      host.setAttribute('type', 'button')
      const controller = new PressController(host, {
        scaleOnPress: true,
        hoverLift: true,
      })

      // 1000 stress cycles
      for (let i = 0; i < 1000; i++) {
        // pointerdown
        host.dispatchEvent(
          new PointerEvent('pointerdown', { button: 0, bubbles: true }),
        )
        expect(controller.isPressed).toBe(true)
        expect(host.getAttribute('aria-pressed')).toBe('true')

        // pointerup
        host.dispatchEvent(
          new PointerEvent('pointerup', { button: 0, bubbles: true }),
        )
        expect(controller.isPressed).toBe(false)
        expect(host.getAttribute('aria-pressed')).toBe('false')

        // pointerdown
        host.dispatchEvent(
          new PointerEvent('pointerdown', { button: 0, bubbles: true }),
        )
        expect(controller.isPressed).toBe(true)

        // pointercancel
        host.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
        expect(controller.isPressed).toBe(false)
        expect(host.getAttribute('aria-pressed')).toBe('false')
      }

      // Settled invariants
      expect(controller.isPressed).toBe(false)
      expect(controller.isHovered).toBe(false)
      expect(host.getAttribute('aria-pressed')).toBe('false')
      expect(host.updateCalls.length).toBe(4000)
    })

    it('handles keyboard keydown without keyup, repeated keydown, and blur/focusout mid-press', () => {
      const host = createChallengeHost('press-key-stress')
      host.setAttribute('type', 'button')
      const controller = new PressController(host)

      // Initial state
      expect(controller.isPressed).toBe(false)
      expect(controller.isFocusVisible).toBe(false)

      // Keydown Enter
      host.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      expect(controller.isFocusVisible).toBe(true)
      expect(host.getAttribute('aria-pressed')).toBe('true')

      const updatesAfterFirstKeydown = host.updateCalls.length

      // 50 repeated keydown events (user holding key down) must be suppressed
      for (let i = 0; i < 50; i++) {
        host.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            repeat: true,
            bubbles: true,
          }),
        )
      }
      expect(controller.isPressed).toBe(true)
      expect(host.updateCalls.length).toBe(updatesAfterFirstKeydown)

      // Window blur / host focusout occurs BEFORE keyup (e.g. user Alt+Tabs while holding Enter)
      host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      expect(controller.isPressed).toBe(false)
      expect(controller.isFocusVisible).toBe(false)
      expect(host.getAttribute('aria-pressed')).toBe('false')

      // Belated keyup arrives: must NOT resurrect pressed state or throw
      host.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(controller.isFocusVisible).toBe(false)
    })

    it('handles switching disabled attribute mid-press without getting stuck in pressed state', () => {
      const host = createChallengeHost('press-disabled-midpress')
      host.setAttribute('type', 'button')
      const controller = new PressController(host)

      // 1. Press down
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      expect(host.getAttribute('aria-pressed')).toBe('true')

      // 2. Element becomes disabled mid-press (e.g. async action starts on mousedown)
      host.setAttribute('disabled', '')
      expect(controller.isDisabled()).toBe(true)

      // 3. Pointerup fires while disabled: MUST release pressed state cleanly
      host.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(host.getAttribute('aria-pressed')).toBe('false')

      // 4. Pointerdown while disabled: MUST be suppressed
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)

      // 5. Test with is-disabled attribute mid-press
      host.removeAttribute('disabled')
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)

      host.setAttribute('is-disabled', '')
      expect(controller.isDisabled()).toBe(true)

      // Pointercancel while is-disabled: MUST release pressed state cleanly
      host.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
      expect(controller.isPressed).toBe(false)

      // 6. Test with options.disabled() function mid-press
      host.removeAttribute('is-disabled')
      let dynamicDisabled = false
      const dynamicHost = createChallengeHost('press-dyn-disabled')
      const dynamicController = new PressController(dynamicHost, {
        disabled: () => dynamicDisabled,
      })

      dynamicHost.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(dynamicController.isPressed).toBe(true)

      dynamicDisabled = true
      dynamicHost.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(dynamicController.isPressed).toBe(false)
    })

    it('releases press and hover when pointerleave fires while pressed', () => {
      const host = createChallengeHost('press-pointerleave')
      host.setAttribute('type', 'button')
      const controller = new PressController(host, {
        scaleOnPress: true,
        hoverLift: true,
      })

      // Pointer enters and presses down
      host.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      expect(controller.isHovered).toBe(true)

      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      expect(host.getAttribute('aria-pressed')).toBe('true')

      // Pointer dragged outside the element boundary
      host.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(controller.isPressed).toBe(false)
      expect(controller.isHovered).toBe(false)
      expect(host.getAttribute('aria-pressed')).toBe('false')
    })

    it('prevents listener leaks across 100 connect / disconnect cycles and resets state', () => {
      const host = createChallengeHost('press-leak-check')
      const controller = new PressController(host)

      // Activate press
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)

      // 100 connect/disconnect cycles
      for (let i = 0; i < 100; i++) {
        host.remove()
        expect(controller.isPressed).toBe(false)
        expect(controller.isHovered).toBe(false)
        expect(controller.isFocusVisible).toBe(false)

        document.body.appendChild(host)
      }

      // After final reconnect, events work cleanly without duplicate handlers
      const updatesBefore = host.updateCalls.length
      host.dispatchEvent(
        new PointerEvent('pointerdown', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(true)
      expect(host.updateCalls.length).toBe(updatesBefore + 1)

      host.dispatchEvent(
        new PointerEvent('pointerup', { button: 0, bubbles: true }),
      )
      expect(controller.isPressed).toBe(false)
      expect(host.updateCalls.length).toBe(updatesBefore + 2)
    })
  })

  // =========================================================================
  // 2. Adversarial Challenge: LayoutIndicatorController
  // =========================================================================
  describe('Adversarial Challenge: LayoutIndicatorController', () => {
    it('accurately resolves exact boundary values and 1,000 rapid threshold transitions', () => {
      const host = createChallengeHost('layout-boundary')
      const controller = new LayoutIndicatorController(host, {
        observeDimensions: true,
      })

      // Exact boundaries per Requirement 5.3:
      // xs: 0-479, sm: 480-767, md: 768-1023, lg: 1024-1279, xl: >= 1280
      const boundaryCases: Array<[number, string]> = [
        [0, 'xs'],
        [1, 'xs'],
        [478.99, 'xs'],
        [479, 'xs'],
        [479.01, 'xs'],
        [479.999, 'xs'],
        [480, 'sm'],
        [480.001, 'sm'],
        [767, 'sm'],
        [767.999, 'sm'],
        [768, 'md'],
        [768.001, 'md'],
        [1023, 'md'],
        [1023.999, 'md'],
        [1024, 'lg'],
        [1024.001, 'lg'],
        [1279, 'lg'],
        [1279.999, 'lg'],
        [1280, 'xl'],
        [1280.001, 'xl'],
        [3840, 'xl'],
      ]

      for (const [w, expectedBp] of boundaryCases) {
        triggerResize(host, { width: w, height: 600 })
        expect(controller.breakpoint).toBe(expectedBp)
        expect(controller.width).toBe(w)
      }

      // 1,000 rapid random transitions across all boundaries
      const seeds = [
        200, 500, 800, 1100, 1500, -10, 0, 479, 480, 768, 1024, 1280,
      ]
      for (let i = 0; i < 1000; i++) {
        const w = seeds[i % seeds.length] + ((i * 17) % 300)
        triggerResize(host, { width: w, height: 400 })
        expect(controller.breakpoint).toBe(computeBreakpoint(w))
      }
    })

    it('safely handles negative widths, zero, and non-finite numbers without crashing', () => {
      const host = createChallengeHost('layout-exotic')
      const controller = new LayoutIndicatorController(host)

      const exoticWidths = [
        -1,
        -100,
        -999999,
        -0,
        0,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ]

      for (const w of exoticWidths) {
        expect(computeBreakpoint(w)).toBe('xs')
        triggerResize(host, { width: w, height: 100 })
        expect(controller.breakpoint).toBe('xs')
      }
    })

    it('gracefully handles missing contentRect, missing borderBoxSize, or empty entries', () => {
      const host = createChallengeHost('layout-missing-rects')
      const controller = new LayoutIndicatorController(host)

      // Direct inspection of the ResizeObserver callback behavior
      // 1. Entry with only borderBoxSize (no contentRect)
      const borderBoxOnlyEntry: ResizeObserverEntry = {
        target: host,
        contentRect: undefined as unknown as DOMRectReadOnly,
        borderBoxSize: Object.freeze([{ inlineSize: 850, blockSize: 400 }]),
        contentBoxSize: Object.freeze([{ inlineSize: 850, blockSize: 400 }]),
        devicePixelContentBoxSize: Object.freeze([
          { inlineSize: 850, blockSize: 400 },
        ]),
      }

      // Dispatch directly via MockResizeObserver
      const observer = (controller as any).observer as ResizeObserver
      expect(observer).toBeDefined()
      const recordCallback = (observer as any)._record?.callback

      if (recordCallback) {
        recordCallback([borderBoxOnlyEntry], observer)
        expect(controller.breakpoint).toBe('md')
        expect(controller.width).toBe(850)

        // 2. Entry with empty borderBoxSize and no contentRect
        const emptyEntry: ResizeObserverEntry = {
          target: host,
          contentRect: undefined as unknown as DOMRectReadOnly,
          borderBoxSize: Object.freeze([]),
          contentBoxSize: Object.freeze([]),
          devicePixelContentBoxSize: Object.freeze([]),
        }
        recordCallback([emptyEntry], observer)
        expect(controller.breakpoint).toBe('xs')
        expect(controller.width).toBe(0)

        // 3. Completely empty entries array
        recordCallback([], observer)
        expect(controller.breakpoint).toBe('xs')
      }
    })

    it('cleans up ResizeObserver on disconnect and resumes correctly on reconnect', () => {
      const host = createChallengeHost('layout-disconnect-reconnect')
      const controller = new LayoutIndicatorController(host)

      triggerResize(host, { width: 1200, height: 800 })
      expect(controller.breakpoint).toBe('lg')

      // Disconnect host
      host.remove()
      expect((controller as any).observer).toBeNull()

      // Resizing while disconnected should not update controller
      triggerResize(host, { width: 300, height: 800 })
      expect(controller.breakpoint).toBe('lg')

      // Reconnect host
      document.body.appendChild(host)
      expect((controller as any).observer).not.toBeNull()

      // Resizing after reconnect should update controller
      triggerResize(host, { width: 300, height: 800 })
      expect(controller.breakpoint).toBe('xs')
    })
  })

  // =========================================================================
  // 3. Adversarial Challenge: OverlayPresenceController
  // =========================================================================
  describe('Adversarial Challenge: OverlayPresenceController', () => {
    it('handles rapid concurrent open/close/open toggles without hanging or desyncing', async () => {
      const host = createChallengeHost('overlay-rapid-toggle')
      const dialog = document.createElement('dialog')
      host.appendChild(dialog)

      const controller = new OverlayPresenceController(host, {
        preset: 'modal',
        dialog: () => dialog,
      })

      // 1. Rapid unawaited cascade: open -> close -> open
      const p1 = controller.setOpen(true)
      const p2 = controller.setOpen(false)
      const p3 = controller.setOpen(true)

      await Promise.all([p1, p2, p3])

      // Settled state MUST be open
      expect(controller.isOpen).toBe(true)
      expect(controller.isMounted).toBe(true)
      expect(dialog.open).toBe(true)

      // 2. Rapid unawaited cascade: close -> open -> close
      const p4 = controller.setOpen(false)
      const p5 = controller.setOpen(true)
      const p6 = controller.setOpen(false)

      await Promise.all([p4, p5, p6])

      // Settled state MUST be closed
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
      expect(dialog.open).toBe(false)
    })

    it('survives a 50-iteration high-frequency toggle barrage and settles to final target state', async () => {
      const host = createChallengeHost('overlay-barrage')
      const dialog = document.createElement('dialog')
      host.appendChild(dialog)

      const controller = new OverlayPresenceController(host, {
        preset: 'modal',
        dialog: () => dialog,
      })

      // 50 rapid toggles in flight
      const promises: Promise<void>[] = []
      for (let i = 0; i < 50; i++) {
        const nextState = i % 2 === 1
        promises.push(controller.setOpen(nextState))
      }

      await Promise.all(promises)

      // 49 % 2 === 1 -> target state of last invocation is true
      expect(controller.isOpen).toBe(true)
      expect(controller.isMounted).toBe(true)
      expect(dialog.open).toBe(true)

      // Cleanly close afterwards
      await controller.setOpen(false)
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
      expect(dialog.open).toBe(false)
    })

    it('catches DOMException on disconnected dialog, logs warning, and does not throw (Req 6.10)', async () => {
      const host = createChallengeHost('overlay-disconnected-dialog')
      const detachedDialog = document.createElement('dialog')
      // NOTE: detachedDialog is NOT appended to host or document!

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const controller = new OverlayPresenceController(host, {
        preset: 'modal',
        dialog: () => detachedDialog,
      })

      // Must NOT throw
      await expect(controller.setOpen(true)).resolves.not.toThrow()

      // Requirement 6.10 verification:
      // Emitted console.warn containing disconnected warning
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[@moul-dev/ui] Failed to call dialog.showModal()',
        ),
        expect.any(DOMException),
      )

      // Controller remains functional and can close cleanly
      await expect(controller.setOpen(false)).resolves.not.toThrow()
      expect(controller.isOpen).toBe(false)
      expect(controller.isMounted).toBe(false)
    })

    it('successfully executes enter and exit animations across all 8 presets', async () => {
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

      for (const preset of presets) {
        const host = createChallengeHost(`overlay-preset-${preset}`)
        const controller = new OverlayPresenceController(host, { preset })

        // Enter
        await controller.setOpen(true)
        expect(controller.isOpen).toBe(true)
        expect(controller.isMounted).toBe(true)

        // Exit
        await controller.setOpen(false)
        expect(controller.isOpen).toBe(false)
        expect(controller.isMounted).toBe(false)

        host.remove()
      }
    })

    it('halts active animation and does not throw when host disconnects mid-animation', async () => {
      const host = createChallengeHost('overlay-mid-anim-disconnect')
      const controller = new OverlayPresenceController(host, {
        preset: 'drawer-left',
      })

      // Start opening
      const openPromise = controller.setOpen(true)

      // Disconnect host immediately while animation is in flight
      host.remove()

      await openPromise

      // Must not throw or crash
      expect(controller.isOpen).toBe(true)
    })
  })
})
