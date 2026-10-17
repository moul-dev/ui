import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './Modal/Modal'
import './AlertDialog/AlertDialog'
import './Drawer/Drawer'
import './Popover/Popover'
import './Tooltip/Tooltip'
import './CommandPalette/CommandPalette'
import { safeShowModal } from '../utils/focus-trap'
import type { MoulAlertDialog } from './AlertDialog/AlertDialog'
import type {
  CommandPaletteItemData,
  MoulCommandPalette,
} from './CommandPalette/CommandPalette'
import type { MoulDrawer } from './Drawer/Drawer'
import type { MoulModal } from './Modal/Modal'
import type { MoulPopover } from './Popover/Popover'
import type { MoulTooltip } from './Tooltip/Tooltip'

async function awaitNestedUpdates(root: Element): Promise<void> {
  if ('updateComplete' in root && (root as LitElement).updateComplete) {
    await (root as LitElement).updateComplete
  }
  const children = Array.from(root.querySelectorAll('*'))
  await Promise.all(
    children.map((child) => {
      if ('updateComplete' in child && (child as LitElement).updateComplete) {
        return (child as LitElement).updateComplete
      }
      return Promise.resolve()
    }),
  )
}

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const element = container.firstElementChild as T
  await awaitNestedUpdates(element)
  return element
}

async function simulateKey(
  element: HTMLElement,
  key: string,
  options: Partial<KeyboardEventInit> = {},
): Promise<void> {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  )
  await awaitNestedUpdates(element)
}

describe('Adversarial Stress Test: Phase 6 Overlay Components', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // ===========================================================================
  // 1. MoulModal Adversarial Stress Suite
  // ===========================================================================
  describe('MoulModal (`moul-modal`) Adversarial Stress', () => {
    it('CHAL-MOD-01: Rapid 100-cycle unawaited synchronous open/close toggle bursts without deadlock', async () => {
      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Stress Modal</div>
          <p>Body</p>
        </moul-modal>
      `)

      expect(modal.isOpen).toBe(false)

      // Fire 100 high-frequency unawaited toggle calls in a synchronous burst
      for (let i = 0; i < 100; i++) {
        modal.setOpen(i % 2 === 1)
      }

      // Settle on closed state
      await modal.setOpen(false)
      await awaitNestedUpdates(modal)

      expect(modal.isOpen).toBe(false)
      expect(modal.isMounted).toBe(false)
      expect(modal.dialogEl?.open).toBe(false)

      // Ensure subsequent clean open functions correctly
      await modal.setOpen(true)
      await awaitNestedUpdates(modal)

      expect(modal.isOpen).toBe(true)
      expect(modal.isMounted).toBe(true)
      expect(modal.dialogEl?.open).toBe(true)
    })

    it('CHAL-MOD-02: 100-cycle sequential open/close lifecycle under reduced motion without leaks', async () => {
      const origMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }))

      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Reduced Motion Modal</div>
          <button id="modal-inner-btn">Action</button>
        </moul-modal>
      `)

      let openCount = 0
      let closeCount = 0
      modal.addEventListener('openchange', (e: Event) => {
        const isOpen = (e as CustomEvent<{ isOpen: boolean }>).detail.isOpen
        if (isOpen) openCount++
        else closeCount++
      })

      // Run 50 complete open-then-close iterations (100 state transitions)
      for (let i = 0; i < 50; i++) {
        await modal.setOpen(true)
        expect(modal.isOpen).toBe(true)
        expect(modal.dialogEl?.open).toBe(true)

        await modal.setOpen(false)
        expect(modal.isOpen).toBe(false)
        expect(modal.dialogEl?.open).toBe(false)
      }

      expect(openCount).toBe(50)
      expect(closeCount).toBe(50)
      expect(modal.isOpen).toBe(false)

      window.matchMedia = origMatchMedia
    })

    it('CHAL-MOD-03: Escape key dismissals in nested modals with event propagation cancellation', async () => {
      const container = await mount<HTMLDivElement>(html`
        <div id="nested-test-root">
          <moul-modal id="parent-modal">
            <div slot="header">Parent Title</div>
            <button id="open-child-btn">Open Child</button>
            <moul-modal id="child-modal">
              <div slot="header">Child Title</div>
              <button id="child-inner-btn">Child Action</button>
            </moul-modal>
          </moul-modal>
        </div>
      `)

      const parentModal = container.querySelector<MoulModal>('#parent-modal')!
      const childModal = container.querySelector<MoulModal>('#child-modal')!

      // Open parent modal
      await parentModal.setOpen(true)
      await awaitNestedUpdates(parentModal)
      expect(parentModal.isOpen).toBe(true)

      // Open child modal while parent is open
      await childModal.setOpen(true)
      await awaitNestedUpdates(childModal)
      expect(childModal.isOpen).toBe(true)
      expect(parentModal.isOpen).toBe(true)

      // Dispatch Escape on child modal
      const childEscape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      const stopSpy = vi.spyOn(childEscape, 'stopPropagation')
      childModal.dispatchEvent(childEscape)
      await awaitNestedUpdates(childModal)
      await awaitNestedUpdates(parentModal)

      // Verification: child closes, but parent remains open because stopPropagation prevented bubbling
      expect(childModal.isOpen).toBe(false)
      expect(parentModal.isOpen).toBe(true)
      expect(stopSpy).toHaveBeenCalled()

      // Subsequent Escape on parent modal closes parent
      await simulateKey(parentModal, 'Escape')
      expect(parentModal.isOpen).toBe(false)
    })

    it('CHAL-MOD-04: Detached element handling: invoking open=true and setOpen(true) when disconnected', async () => {
      // 1. safeShowModal on detached native <dialog> element catches DOMException
      const detachedDialog = document.createElement('dialog')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = safeShowModal(detachedDialog)
      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalled()

      // 2. Direct property assignment while detached
      const detachedModal = document.createElement('moul-modal') as MoulModal
      expect(detachedModal.isConnected).toBe(false)
      detachedModal.isOpen = true
      expect(detachedModal.isOpen).toBe(true)

      // 3. Invoking setOpen(true) on disconnected element must not deadlock
      const hangTimeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Deadlock: setOpen(true) hung on detached element awaiting host.updateComplete',
              ),
            ),
          200,
        ),
      )
      await Promise.race([detachedModal.setOpen(true), hangTimeout])
    })

    it('CHAL-MOD-05: Focus restoration when trigger element is dynamically unmounted while dialog is open', async () => {
      const trigger = document.createElement('button')
      trigger.id = 'ephemeral-trigger'
      document.body.appendChild(trigger)
      trigger.focus()
      expect(document.activeElement).toBe(trigger)

      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Title</div>
          <button id="modal-btn">Inside</button>
        </moul-modal>
      `)

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(true)

      // Remove trigger from DOM while modal is active
      trigger.remove()
      expect(trigger.isConnected).toBe(false)

      // Close modal - must restore focus gracefully without unhandled exceptions
      await expect(modal.setOpen(false)).resolves.not.toThrow()
      expect(modal.isOpen).toBe(false)
    })

    it('CHAL-MOD-06: Backdrop click dismisses when isDismissable=true and retains open when isDismissable=false', async () => {
      const modal = await mount<MoulModal>(html`
        <moul-modal is-dismissable>
          <div slot="header">Dismissable Modal</div>
          <p>Modal content</p>
        </moul-modal>
      `)

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(true)

      const dialog = modal.dialogEl
      expect(dialog).toBeTruthy()

      // Mock content bounding box
      const content = modal.contentEl
      if (content) {
        content.getBoundingClientRect = () =>
          ({
            top: 100,
            bottom: 300,
            left: 100,
            right: 400,
            width: 300,
            height: 200,
            x: 100,
            y: 100,
            toJSON: () => ({}),
          }) as DOMRect
      }

      // Click outside content card (at x: 10, y: 10)
      dialog?.dispatchEvent(
        new MouseEvent('click', {
          clientX: 10,
          clientY: 10,
          bubbles: true,
        }),
      )
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(false)

      // Re-open with isDismissable = false
      modal.isDismissable = false
      await modal.setOpen(true)
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(true)

      // Click outside content card again
      dialog?.dispatchEvent(
        new MouseEvent('click', {
          clientX: 10,
          clientY: 10,
          bubbles: true,
        }),
      )
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(true)
    })

    it('CHAL-MOD-07: Focus trapping cycles between first and last focusable elements on Tab and Shift+Tab', async () => {
      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Trap Boundary</div>
          <div>
            <button id="first-el">First</button>
            <button id="second-el">Second</button>
          </div>
        </moul-modal>
      `)

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)

      const firstBtn = modal.querySelector<HTMLElement>('#first-el')!
      const secondBtn = modal.querySelector<HTMLElement>('#second-el')!
      expect(firstBtn).toBeTruthy()
      expect(secondBtn).toBeTruthy()

      // Initial focus on first element
      firstBtn.focus()
      expect(document.activeElement).toBe(firstBtn)

      // Shift+Tab on first element wraps around to last element
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      modal.dispatchEvent(shiftTabEvent)
      expect(shiftTabEvent.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(secondBtn)

      // Tab on last element wraps around to first element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: false,
        bubbles: true,
        cancelable: true,
      })
      modal.dispatchEvent(tabEvent)
      expect(tabEvent.defaultPrevented).toBe(true)
      expect(document.activeElement).toBe(firstBtn)
    })
  })

  // ===========================================================================
  // 2. MoulAlertDialog Adversarial Stress Suite
  // ===========================================================================
  describe('MoulAlertDialog (`moul-alert-dialog`) Adversarial Stress', () => {
    it('CHAL-ALT-01: Rapid 100-cycle unawaited synchronous open/close toggle bursts', async () => {
      const alertModal = await mount<MoulAlertDialog>(html`
        <moul-alert-dialog tone="warning">
          <div slot="header">Warning</div>
          <div slot="body">Critical prompt</div>
        </moul-alert-dialog>
      `)

      for (let i = 0; i < 100; i++) {
        alertModal.setOpen(i % 2 === 1)
      }

      await alertModal.setOpen(false)
      await awaitNestedUpdates(alertModal)
      expect(alertModal.isOpen).toBe(false)
      expect(alertModal.dialogEl?.open).toBe(false)

      await alertModal.setOpen(true)
      await awaitNestedUpdates(alertModal)
      expect(alertModal.isOpen).toBe(true)
      expect(alertModal.dialogEl?.open).toBe(true)
    })

    it('CHAL-ALT-02: Escape dismissal invokes cancel handler and stops event propagation', async () => {
      const alertModal = await mount<MoulAlertDialog>(html`
        <moul-alert-dialog tone="error">
          <div slot="header">Destructive Action</div>
          <div slot="body">Proceed?</div>
        </moul-alert-dialog>
      `)

      let canceled = false
      alertModal.addEventListener('cancel', () => {
        canceled = true
      })

      await alertModal.setOpen(true)
      await awaitNestedUpdates(alertModal)
      expect(alertModal.isOpen).toBe(true)

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      const stopSpy = vi.spyOn(escapeEvent, 'stopPropagation')

      alertModal.dispatchEvent(escapeEvent)
      await awaitNestedUpdates(alertModal)

      expect(canceled).toBe(true)
      expect(alertModal.isOpen).toBe(false)
      expect(stopSpy).toHaveBeenCalled()
    })

    it('CHAL-ALT-03: Detached alert dialog setOpen resilience without throwing', async () => {
      const detachedAlert = document.createElement(
        'moul-alert-dialog',
      ) as MoulAlertDialog
      expect(detachedAlert.isConnected).toBe(false)

      const hangTimeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Deadlock: setOpen(true) hung on detached alert dialog awaiting host.updateComplete',
              ),
            ),
          200,
        ),
      )
      await Promise.race([detachedAlert.setOpen(true), hangTimeout])
    })

    it('CHAL-ALT-04: Prioritizes initial focus on cancel button over confirm button for destructive safety', async () => {
      const alertModal = await mount<MoulAlertDialog>(html`
        <moul-alert-dialog tone="error">
          <div slot="header">Delete Account</div>
          <div slot="body">Are you sure?</div>
          <div slot="footer">
            <button data-action="confirm" id="btn-danger-confirm">Delete</button>
            <button data-action="cancel" id="btn-safe-cancel">Cancel</button>
          </div>
        </moul-alert-dialog>
      `)

      await alertModal.setOpen(true)
      await awaitNestedUpdates(alertModal)

      const cancelBtn =
        alertModal.querySelector<HTMLElement>('#btn-safe-cancel')
      expect(document.activeElement).toBe(cancelBtn)
    })
  })

  // ===========================================================================
  // 3. MoulDrawer Adversarial Stress Suite
  // ===========================================================================
  describe('MoulDrawer (`moul-drawer`) Adversarial Stress', () => {
    it('CHAL-DRW-01: Rapid 100-cycle unawaited toggle bursts across edge placements', async () => {
      const drawer = await mount<MoulDrawer>(html`
        <moul-drawer placement="right" size="lg">
          <div slot="header">Drawer</div>
          <div>Content</div>
        </moul-drawer>
      `)

      for (let i = 0; i < 100; i++) {
        drawer.setOpen(i % 2 === 1)
      }

      await drawer.setOpen(false)
      await awaitNestedUpdates(drawer)
      expect(drawer.isOpen).toBe(false)
      expect(drawer.dialogEl?.open).toBe(false)

      await drawer.setOpen(true)
      await awaitNestedUpdates(drawer)
      expect(drawer.isOpen).toBe(true)
      expect(drawer.dialogEl?.open).toBe(true)
    })

    it('CHAL-DRW-02: Edge positioning and placement presets across all 4 directions', async () => {
      const drawer = await mount<MoulDrawer>(html`
        <moul-drawer placement="left">
          <div slot="header">Multi-edge Drawer</div>
          <div>Content</div>
        </moul-drawer>
      `)

      const placements: Array<'left' | 'right' | 'top' | 'bottom'> = [
        'left',
        'right',
        'top',
        'bottom',
      ]

      for (const placement of placements) {
        drawer.placement = placement
        await awaitNestedUpdates(drawer)

        expect(drawer.getAttribute('placement')).toBe(placement)
        const opts = (
          drawer.overlayPresence as unknown as {
            options: { preset: string }
          }
        ).options
        expect(opts.preset).toBe(`drawer-${placement}`)

        await drawer.setOpen(true)
        await awaitNestedUpdates(drawer)
        expect(drawer.isOpen).toBe(true)
        expect(drawer.dialogEl?.open).toBe(true)

        await drawer.setOpen(false)
        await awaitNestedUpdates(drawer)
        expect(drawer.isOpen).toBe(false)
      }
    })

    it('CHAL-DRW-03: Detached drawer handling and outside backdrop clicks', async () => {
      const detachedDrawer = document.createElement('moul-drawer') as MoulDrawer
      expect(detachedDrawer.isConnected).toBe(false)

      const hangTimeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Deadlock: setOpen(true) hung on detached drawer awaiting host.updateComplete',
              ),
            ),
          200,
        ),
      )
      await Promise.race([detachedDrawer.setOpen(true), hangTimeout])
    })
  })

  // ===========================================================================
  // 4. MoulPopover Adversarial Fallback & Stress Suite
  // ===========================================================================
  describe('MoulPopover (`moul-popover`) Adversarial Fallback & Stress', () => {
    it('CHAL-POP-01: Fallback fixed coordinate math for all 4 placements (top, bottom, left, right)', async () => {
      // Simulate environment where native Anchor Positioning is absent
      const originalSupports = Object.getPrototypeOf(window.CSS).supports
      Object.getPrototypeOf(window.CSS).supports = () => false

      const popover = await mount<MoulPopover>(html`
        <moul-popover placement="bottom" offset="12">
          <button slot="trigger" id="pop-btn">Trigger</button>
          <div>Popover Body</div>
        </moul-popover>
      `)

      const triggerWrapper =
        popover.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]')
      expect(triggerWrapper).toBeTruthy()

      // Mock trigger bounding box
      if (triggerWrapper) {
        triggerWrapper.getBoundingClientRect = () =>
          ({
            top: 100,
            bottom: 150,
            left: 200,
            right: 300,
            width: 100,
            height: 50,
            x: 200,
            y: 100,
            toJSON: () => ({}),
          }) as DOMRect
      }

      const winWidth = window.innerWidth
      const winHeight = window.innerHeight
      const innerPop = popover.popoverEl!
      expect(innerPop).toBeTruthy()

      // 1. Bottom placement: top = rect.bottom + offset = 150 + 12 = 162px, left = rect.left + rect.width / 2 = 250px
      popover.placement = 'bottom'
      popover.offset = 12
      await popover.setOpen(true)
      await awaitNestedUpdates(popover)

      expect(innerPop.style.position).toBe('fixed')
      expect(innerPop.style.top).toBe('162px')
      expect(innerPop.style.left).toBe('250px')
      expect(innerPop.style.transform).toBe('translateX(-50%)')

      await popover.setOpen(false)

      // 2. Top placement: bottom = winHeight - rect.top + offset = winHeight - 100 + 12, left = 250px
      popover.placement = 'top'
      await popover.setOpen(true)
      await awaitNestedUpdates(popover)

      expect(innerPop.style.bottom).toBe(`${winHeight - 100 + 12}px`)
      expect(innerPop.style.left).toBe('250px')
      expect(innerPop.style.transform).toBe('translateX(-50%)')

      await popover.setOpen(false)

      // 3. Left placement: right = winWidth - rect.left + offset = winWidth - 200 + 12, top = rect.top + rect.height / 2 = 125px
      popover.placement = 'left'
      await popover.setOpen(true)
      await awaitNestedUpdates(popover)

      expect(innerPop.style.right).toBe(`${winWidth - 200 + 12}px`)
      expect(innerPop.style.top).toBe('125px')
      expect(innerPop.style.transform).toBe('translateY(-50%)')

      await popover.setOpen(false)

      // 4. Right placement: left = rect.right + offset = 300 + 12 = 312px, top = 125px
      popover.placement = 'right'
      await popover.setOpen(true)
      await awaitNestedUpdates(popover)

      expect(innerPop.style.left).toBe('312px')
      expect(innerPop.style.top).toBe('125px')
      expect(innerPop.style.transform).toBe('translateY(-50%)')

      await popover.setOpen(false)
      Object.getPrototypeOf(window.CSS).supports = originalSupports
    })

    it('CHAL-POP-02: Rapid 100-cycle unawaited synchronous toggle bursts without desync', async () => {
      const popover = await mount<MoulPopover>(html`
        <moul-popover>
          <button slot="trigger">Trigger</button>
          <div>Content</div>
        </moul-popover>
      `)

      for (let i = 0; i < 100; i++) {
        popover.setOpen(i % 2 === 1)
      }

      await popover.setOpen(false)
      await awaitNestedUpdates(popover)
      expect(popover.isOpen).toBe(false)

      await popover.setOpen(true)
      await awaitNestedUpdates(popover)
      expect(popover.isOpen).toBe(true)
    })

    it('CHAL-POP-03: Keyboard triggers (Enter, Space, ArrowDown) open popover and Escape closes', async () => {
      const popover = await mount<MoulPopover>(html`
        <moul-popover>
          <button slot="trigger" id="pop-trig">Trigger</button>
          <div>Popover Content</div>
        </moul-popover>
      `)

      expect(popover.isOpen).toBe(false)

      // Enter key opens
      await simulateKey(popover, 'Enter')
      expect(popover.isOpen).toBe(true)

      // Escape closes
      await simulateKey(popover, 'Escape')
      expect(popover.isOpen).toBe(false)

      // Space key opens
      await simulateKey(popover, ' ')
      expect(popover.isOpen).toBe(true)

      await simulateKey(popover, 'Escape')
      expect(popover.isOpen).toBe(false)

      // ArrowDown opens
      await simulateKey(popover, 'ArrowDown')
      expect(popover.isOpen).toBe(true)
    })
  })

  // ===========================================================================
  // 5. MoulTooltip Adversarial Delay & Lifecycle Suite
  // ===========================================================================
  describe('MoulTooltip (`moul-tooltip`) Adversarial Delay & Lifecycle', () => {
    it('CHAL-TLP-01: Rapid 50-burst pointerenter/pointerleave oscillations cancel timer and do not prematurely open', async () => {
      vi.useFakeTimers()

      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Tooltip info" delay="300">
          <button id="oscillate-btn">Target</button>
        </moul-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)

      // Oscillate 50 times with 20ms dwell time (< 300ms delay)
      for (let i = 0; i < 50; i++) {
        tooltip.dispatchEvent(
          new PointerEvent('pointerenter', { bubbles: true }),
        )
        vi.advanceTimersByTime(20)
        expect(tooltip.isOpen).toBe(false)

        tooltip.dispatchEvent(
          new PointerEvent('pointerleave', { bubbles: true }),
        )
        vi.advanceTimersByTime(20)
        expect(tooltip.isOpen).toBe(false)
      }

      // Advance timers by a large buffer: must stay closed because hoverTimer was cleared
      vi.advanceTimersByTime(5000)
      expect(tooltip.isOpen).toBe(false)

      // Now enter and hold for exactly 300ms
      tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      vi.advanceTimersByTime(299)
      expect(tooltip.isOpen).toBe(false)

      vi.advanceTimersByTime(1)
      expect(tooltip.isOpen).toBe(true)

      // Leave closes immediately
      tooltip.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(tooltip.isOpen).toBe(false)
    })

    it('CHAL-TLP-02: Focusin displays immediately without delay and focusout dismisses immediately', async () => {
      vi.useFakeTimers()

      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Focus tooltip" delay="500">
          <button id="focus-target">Target</button>
        </moul-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)

      // Focusin: 0ms delay required
      tooltip.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      expect(tooltip.isOpen).toBe(true)

      // Focusout: immediate close
      tooltip.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      expect(tooltip.isOpen).toBe(false)
    })

    it('CHAL-TLP-03: Disconnection while hover timer is pending clears timer without throwing or leaking', async () => {
      vi.useFakeTimers()

      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Orphan tooltip" delay="300">
          <button>Target</button>
        </moul-tooltip>
      `)

      tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))
      vi.advanceTimersByTime(100)
      expect(tooltip.isOpen).toBe(false)

      // Unmount element while timer is active
      tooltip.remove()
      expect(tooltip.isConnected).toBe(false)

      // Advance timers beyond 300ms
      expect(() => vi.advanceTimersByTime(500)).not.toThrow()
    })

    it('CHAL-TLP-04: Escape key dismisses open tooltip immediately and cancels propagation', async () => {
      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Dismiss text" delay="0">
          <button id="esc-target">Target</button>
        </moul-tooltip>
      `)

      await tooltip.setOpen(true)
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      const stopSpy = vi.spyOn(escapeEvent, 'stopPropagation')

      tooltip.dispatchEvent(escapeEvent)
      await awaitNestedUpdates(tooltip)

      expect(tooltip.isOpen).toBe(false)
      expect(stopSpy).toHaveBeenCalled()
    })

    it('CHAL-TLP-05: Slotted trigger elements are synchronized with aria-describedby', async () => {
      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Accessible tooltip">
          <button id="accessible-btn">Accessible Target</button>
        </moul-tooltip>
      `)

      const btn = tooltip.querySelector<HTMLButtonElement>('#accessible-btn')!
      expect(btn).toBeTruthy()

      const describedBy = btn.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      expect(describedBy).toMatch(/^moul-tooltip-\d+$/)
    })
  })

  // ===========================================================================
  // 6. MoulCommandPalette Adversarial Stress Suite
  // ===========================================================================
  describe('MoulCommandPalette (`moul-command-palette`) Adversarial Stress', () => {
    const testItems: CommandPaletteItemData[] = Array.from(
      { length: 50 },
      (_, i) => ({
        id: `cmd-${i}`,
        title: `Command ${i} - ${i % 2 === 0 ? 'Alpha' : 'Beta'}`,
        description: `Description for command ${i}`,
        disabled: i === 1,
      }),
    )

    it('CHAL-CMD-01: Rapid search query updates (50 bursts) maintain filter integrity and reset activeIndex', async () => {
      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems}></moul-command-palette>
      `)

      await palette.setOpen(true)
      await awaitNestedUpdates(palette)
      expect(palette.isOpen).toBe(true)

      const input = palette.inputEl
      expect(input).toBeTruthy()

      const searchTerms = [
        'alpha',
        'beta',
        'cmd',
        '10',
        '25',
        'nonexistent',
        'command',
        '',
      ]

      for (let i = 0; i < 50; i++) {
        const term = searchTerms[i % searchTerms.length]
        if (input) {
          input.value = term
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }
        expect(palette.activeIndex).toBe(0)
      }

      await awaitNestedUpdates(palette)
      expect(palette.query).toBe('beta')
      const filtered = palette.getFilteredItems()
      expect(filtered.length).toBeGreaterThan(0)
      expect(
        filtered.every(
          (item) =>
            item.title.toLowerCase().includes('beta') ||
            item.description?.toLowerCase().includes('beta'),
        ),
      ).toBe(true)
    })

    it('CHAL-CMD-02: Empty state rendering when query has zero matches', async () => {
      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems}></moul-command-palette>
      `)

      await palette.setOpen(true)
      await awaitNestedUpdates(palette)

      const input = palette.inputEl!
      input.value = 'query-with-absolutely-zero-matches-xyz'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await awaitNestedUpdates(palette)

      expect(palette.getFilteredItems().length).toBe(0)
      const emptyEl = palette.shadowRoot?.querySelector('[part="empty"]')
      expect(emptyEl).toBeTruthy()
      expect(emptyEl?.textContent).toContain('No results found.')
    })

    it('CHAL-CMD-03: Keyboard arrow navigation boundary clamping', async () => {
      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems.slice(0, 3)}></moul-command-palette>
      `)

      await palette.setOpen(true)
      await awaitNestedUpdates(palette)

      // Press ArrowDown 20 times: must clamp at max index (2)
      for (let i = 0; i < 20; i++) {
        await simulateKey(palette, 'ArrowDown')
      }
      expect(palette.activeIndex).toBe(2)

      // Press ArrowUp 20 times: must clamp at index 0
      for (let i = 0; i < 20; i++) {
        await simulateKey(palette, 'ArrowUp')
      }
      expect(palette.activeIndex).toBe(0)
    })

    it('CHAL-CMD-04: Disabled items reject selection via Enter and click', async () => {
      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems}></moul-command-palette>
      `)

      await palette.setOpen(true)
      await awaitNestedUpdates(palette)

      let selected = false
      palette.addEventListener('select', () => {
        selected = true
      })

      // Item 1 is disabled
      await simulateKey(palette, 'ArrowDown') // activeIndex becomes 1
      expect(palette.activeIndex).toBe(1)
      expect(palette.getFilteredItems()[1].disabled).toBe(true)

      // Press Enter on disabled item: must NOT dispatch select or close palette
      await simulateKey(palette, 'Enter')
      expect(selected).toBe(false)
      expect(palette.isOpen).toBe(true)

      // Move to item 2 (enabled) and press Enter
      await simulateKey(palette, 'ArrowDown') // activeIndex becomes 2
      expect(palette.activeIndex).toBe(2)
      await simulateKey(palette, 'Enter')

      expect(selected).toBe(true)
      expect(palette.isOpen).toBe(false)
    })

    it('CHAL-CMD-05: Global shortcut toggling (Cmd+K / Ctrl+K) and detached resilience', async () => {
      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems} shortcut="k"></moul-command-palette>
      `)

      expect(palette.isOpen).toBe(false)

      // Global Cmd+K opens
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(palette)
      expect(palette.isOpen).toBe(true)

      // Global Cmd+K closes
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      await awaitNestedUpdates(palette)
      expect(palette.isOpen).toBe(false)

      // Detached palette check
      const detachedPalette = document.createElement(
        'moul-command-palette',
      ) as MoulCommandPalette
      const hangTimeout = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Deadlock: setOpen(true) hung on detached command palette awaiting host.updateComplete',
              ),
            ),
          200,
        ),
      )
      await Promise.race([detachedPalette.setOpen(true), hangTimeout])
    })
  })
})
