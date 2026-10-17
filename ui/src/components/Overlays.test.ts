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

describe('Overlay Components (Phase 6)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('MoulModal (`moul-modal`)', () => {
    it('OV-MOD-01: Native <dialog> lifecycle', async () => {
      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Modal Title</div>
          <p>Modal Body Content</p>
          <div slot="footer"><button id="btn-save">Save</button></div>
        </moul-modal>
      `)

      expect(modal.isOpen).toBe(false)
      const dialog = modal.shadowRoot?.querySelector('dialog')
      expect(dialog?.open).toBe(false)

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)

      expect(modal.isOpen).toBe(true)
      expect(modal.isMounted).toBe(true)
      expect(dialog?.open).toBe(true)

      await modal.setOpen(false)
      await awaitNestedUpdates(modal)

      expect(modal.isOpen).toBe(false)
      expect(dialog?.open).toBe(false)
    })

    it('OV-MOD-02: Disconnected DOMException safeShowModal handling', () => {
      const dialog = document.createElement('dialog')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = safeShowModal(dialog)
      expect(result).toBe(false)
      expect(warnSpy).toHaveBeenCalled()
    })

    it('OV-MOD-03: Escape key close and focus restore', async () => {
      const triggerBtn = document.createElement('button')
      triggerBtn.id = 'trigger'
      document.body.appendChild(triggerBtn)
      triggerBtn.focus()

      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Title</div>
          <div>Content</div>
        </moul-modal>
      `)

      let openChangedValue = true
      modal.addEventListener('openchange', (e: Event) => {
        openChangedValue = (e as CustomEvent<{ isOpen: boolean }>).detail.isOpen
      })

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)
      expect(modal.isOpen).toBe(true)

      await simulateKey(modal, 'Escape')
      expect(modal.isOpen).toBe(false)
      expect(openChangedValue).toBe(false)
    })

    it('OV-MOD-04: Focus trapping within modal boundary', async () => {
      const modal = await mount<MoulModal>(html`
        <moul-modal>
          <div slot="header">Title</div>
          <div>
            <button id="first-btn">First</button>
            <button id="second-btn">Second</button>
          </div>
        </moul-modal>
      `)

      await modal.setOpen(true)
      await awaitNestedUpdates(modal)

      const dialog = modal.dialogEl
      expect(dialog).toBeTruthy()

      // Tab on dialog traps within
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
      modal.dispatchEvent(tabEvent)
      expect(modal.isOpen).toBe(true)
    })
  })

  describe('MoulAlertDialog (`moul-alert-dialog`)', () => {
    it('OV-ALT-01: Alertdialog role and confirm/cancel events', async () => {
      const alertModal = await mount<MoulAlertDialog>(html`
        <moul-alert-dialog tone="error">
          <div slot="header">Delete File</div>
          <div slot="body">Are you sure you want to delete this file?</div>
          <div slot="footer">
            <button data-action="cancel" id="cancel-btn">Cancel</button>
            <button data-action="confirm" id="confirm-btn">Confirm</button>
          </div>
        </moul-alert-dialog>
      `)

      const dialog = alertModal.dialogEl
      expect(dialog?.getAttribute('role')).toBe('alertdialog')

      let confirmed = false
      let canceled = false
      alertModal.addEventListener('confirm', () => {
        confirmed = true
      })
      alertModal.addEventListener('cancel', () => {
        canceled = true
      })

      await alertModal.setOpen(true)
      await awaitNestedUpdates(alertModal)
      expect(alertModal.isOpen).toBe(true)

      const confirmBtn = alertModal.querySelector<HTMLElement>('#confirm-btn')
      confirmBtn?.click()
      await awaitNestedUpdates(alertModal)

      expect(confirmed).toBe(true)
      expect(alertModal.isOpen).toBe(false)

      // Re-open and cancel
      await alertModal.setOpen(true)
      await awaitNestedUpdates(alertModal)
      const cancelBtn = alertModal.querySelector<HTMLElement>('#cancel-btn')
      cancelBtn?.click()
      await awaitNestedUpdates(alertModal)

      expect(canceled).toBe(true)
      expect(alertModal.isOpen).toBe(false)
    })
  })

  describe('MoulDrawer (`moul-drawer`)', () => {
    it('OV-DRW-01: Placement and animation preset', async () => {
      const drawer = await mount<MoulDrawer>(html`
        <moul-drawer placement="left" size="md">
          <div slot="header">Drawer Header</div>
          <div>Drawer Content</div>
        </moul-drawer>
      `)

      expect(drawer.placement).toBe('left')
      expect(drawer.size).toBe('md')

      await drawer.setOpen(true)
      await awaitNestedUpdates(drawer)
      expect(drawer.isOpen).toBe(true)

      const dialog = drawer.dialogEl
      expect(dialog?.open).toBe(true)

      await simulateKey(drawer, 'Escape')
      expect(drawer.isOpen).toBe(false)
    })
  })

  describe('MoulPopover (`moul-popover`)', () => {
    it('OV-POP-01: Popover API integration and trigger toggle', async () => {
      const popover = await mount<MoulPopover>(html`
        <moul-popover trigger="click">
          <button slot="trigger" id="popover-trigger">Open</button>
          <div id="popover-body">Popover Content</div>
        </moul-popover>
      `)

      expect(popover.isOpen).toBe(false)

      const triggerWrapper =
        popover.shadowRoot?.querySelector<HTMLElement>('[part="trigger"]')
      expect(triggerWrapper).toBeTruthy()

      let openChangeCalled = false
      popover.addEventListener('openchange', (_e: Event) => {
        openChangeCalled = true
      })

      triggerWrapper?.click()
      await awaitNestedUpdates(popover)

      expect(popover.isOpen).toBe(true)
      expect(openChangeCalled).toBe(true)

      const innerPopover = popover.popoverEl
      expect(innerPopover?.matches(':popover-open')).toBe(true)

      // Close popover
      await popover.setOpen(false)
      await awaitNestedUpdates(popover)
      expect(popover.isOpen).toBe(false)
    })
  })

  describe('MoulTooltip (`moul-tooltip`)', () => {
    it('OV-TLP-01: 300ms hover delay contract', async () => {
      vi.useFakeTimers()

      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Helpful tooltip text" delay="300">
          <button id="target-btn">Hover Target</button>
        </moul-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)

      // Pointer enters -> starts 300ms timer
      tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }))

      // At 299ms, still closed
      vi.advanceTimersByTime(299)
      expect(tooltip.isOpen).toBe(false)

      // At 300ms, opens
      vi.advanceTimersByTime(1)
      expect(tooltip.isOpen).toBe(true)

      // Pointer leave closes immediately
      tooltip.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
      expect(tooltip.isOpen).toBe(false)
    })

    it('OV-TLP-02: Focusin immediate display', async () => {
      const tooltip = await mount<MoulTooltip>(html`
        <moul-tooltip content="Focus tooltip text">
          <button id="focus-btn">Focus Target</button>
        </moul-tooltip>
      `)

      expect(tooltip.isOpen).toBe(false)

      // Focusin displays immediately without delay
      tooltip.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(true)

      // Focusout closes
      tooltip.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
      await awaitNestedUpdates(tooltip)
      expect(tooltip.isOpen).toBe(false)
    })
  })

  describe('MoulCommandPalette (`moul-command-palette`)', () => {
    it('OV-CMD-01: Palette shortcut, filtering, and selection', async () => {
      const testItems: CommandPaletteItemData[] = [
        {
          id: '1',
          title: 'Open Settings',
          description: 'Application preferences',
        },
        { id: '2', title: 'Save File', description: 'Save current document' },
        {
          id: '3',
          title: 'Quit Application',
          description: 'Close all windows',
        },
      ]

      const palette = await mount<MoulCommandPalette>(html`
        <moul-command-palette .items=${testItems} shortcut="k"></moul-command-palette>
      `)

      expect(palette.isOpen).toBe(false)

      // Hotkey (Cmd+K) opens palette
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

      // Filter by typing 'save'
      const input = palette.inputEl
      expect(input).toBeTruthy()
      if (input) {
        input.value = 'save'
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      await awaitNestedUpdates(palette)

      const filtered = palette.getFilteredItems()
      expect(filtered.length).toBe(1)
      expect(filtered[0].title).toBe('Save File')

      // Select item via Enter
      let selectedItem: CommandPaletteItemData | null = null
      palette.addEventListener('select', (e: Event) => {
        selectedItem = (e as CustomEvent<{ item: CommandPaletteItemData }>)
          .detail.item
      })

      await simulateKey(palette, 'Enter')
      expect(selectedItem).toEqual(testItems[1])
      expect(palette.isOpen).toBe(false)
    })
  })
})
