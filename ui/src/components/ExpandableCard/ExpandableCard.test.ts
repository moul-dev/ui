import { fixture, html } from '@open-wc/testing-helpers'
import { animate } from 'motion'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ExpandableCard'
import type { MoulExpandableCard } from './ExpandableCard'

vi.mock('motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion')>()
  return { ...actual, animate: vi.fn(actual.animate) }
})

const CARD_BOX = { top: 300, left: 40, width: 240, height: 180 }
const OPEN_BOX = { top: 80, left: 200, width: 640, height: 480 }

/** happy-dom has no layout: the panel sits at CARD_BOX in the page and OPEN_BOX once open. */
function stubLayout(el: MoulExpandableCard): HTMLDialogElement {
  const panel = el.panelEl as HTMLDialogElement
  const rect = ({ top, left, width, height }: typeof CARD_BOX) =>
    ({
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
  panel.getBoundingClientRect = () => rect(panel.open ? OPEN_BOX : CARD_BOX)
  const placeholder = el.shadowRoot?.querySelector(
    '[part="placeholder"]',
  ) as HTMLElement
  placeholder.getBoundingClientRect = () => rect(CARD_BOX)
  Object.defineProperty(panel, 'offsetWidth', { value: CARD_BOX.width })
  Object.defineProperty(panel, 'offsetHeight', { value: CARD_BOX.height })
  return panel
}

async function mount(
  template = html`<moul-expandable-card>
    <img slot="media" alt="" />
    <h3>Mountain cabin</h3>
    <p>Two nights, sleeps four.</p>
    <div slot="details"><a href="#book">Book</a></div>
  </moul-expandable-card>`,
): Promise<{ el: MoulExpandableCard; panel: HTMLDialogElement }> {
  const el = await fixture<MoulExpandableCard>(template)
  return { el, panel: stubLayout(el) }
}

const part = (el: MoulExpandableCard, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`) as HTMLElement

const key = (target: EventTarget, name: string) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: name,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )

/** Lets a click-started open or close run to the end. */
const settle = (el: MoulExpandableCard) =>
  (el as unknown as { running: Promise<void> }).running

describe('<moul-expandable-card>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.mocked(animate).mockClear()
  })

  it('is registered and renders a closed card panel with a hidden placeholder', async () => {
    const { el, panel } = await mount()
    expect(customElements.get('moul-expandable-card')).toBeDefined()
    expect(panel.tagName).toBe('DIALOG')
    expect(panel.open).toBe(false)
    expect(el.isOpen).toBe(false)
    expect(el.size).toBe('md')
    expect(el.getAttribute('size')).toBe('md')
    expect(el.closeLabel).toBe('Close')
    expect(part(el, 'placeholder').getAttribute('aria-hidden')).toBe('true')
  })

  describe('keyboard and screen readers', () => {
    it('is one Tab stop exposed as a collapsed button that opens a dialog', async () => {
      const { el, panel } = await mount()
      expect(panel.getAttribute('role')).toBe('button')
      expect(panel.getAttribute('tabindex')).toBe('0')
      expect(panel.getAttribute('aria-haspopup')).toBe('dialog')
      expect(panel.getAttribute('aria-expanded')).toBe('false')
      expect(panel.hasAttribute('aria-modal')).toBe(false)
      // Named by its content unless `label` is set.
      expect(panel.hasAttribute('aria-label')).toBe(false)
      el.label = 'Mountain cabin details'
      await el.updateComplete
      expect(panel.getAttribute('aria-label')).toBe('Mountain cabin details')
    })

    it('opens on Enter or Space, but not on keys from slotted content', async () => {
      const { el, panel } = await mount()
      key(el.querySelector('h3') as HTMLElement, 'Enter')
      await el.updateComplete
      expect(el.isOpen).toBe(false)

      const isSpaceHandled = !key(panel, ' ')
      expect(isSpaceHandled).toBe(true) // the page does not scroll
      expect(el.isOpen).toBe(true)
      await settle(el)
      await el.setOpen(false)

      key(panel, 'Enter')
      expect(el.isOpen).toBe(true)
      await settle(el)
      expect(panel.open).toBe(true)
    })

    it('becomes a modal dialog named by its first heading, with focus on the close button', async () => {
      const { el, panel } = await mount()
      const changes: boolean[] = []
      el.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )
      panel.click()
      await settle(el)

      expect(changes).toEqual([true])
      expect(el.hasAttribute('is-open')).toBe(true)
      expect(panel.open).toBe(true)
      expect(panel.getAttribute('role')).toBe('dialog')
      expect(panel.getAttribute('aria-modal')).toBe('true')
      expect(panel.getAttribute('aria-label')).toBe('Mountain cabin')
      expect(panel.hasAttribute('aria-expanded')).toBe(false)
      expect(panel.hasAttribute('aria-haspopup')).toBe(false)
      expect(panel.getAttribute('tabindex')).toBe('-1')
      const closeButton = part(el, 'close-button')
      expect(closeButton.getAttribute('aria-label')).toBe('Close')
      expect(el.shadowRoot?.activeElement).toBe(closeButton)
    })

    it('names the dialog with `label` over the heading', async () => {
      const { el, panel } = await mount()
      el.label = 'Cabin booking'
      await el.updateComplete
      await el.setOpen(true)
      expect(panel.getAttribute('aria-label')).toBe('Cabin booking')
    })

    it('closes on Escape and returns focus to the card', async () => {
      const { el, panel } = await mount()
      panel.focus()
      panel.click()
      await settle(el)
      expect(el.shadowRoot?.activeElement).toBe(part(el, 'close-button'))

      const changes: boolean[] = []
      el.addEventListener('openchange', (e) =>
        changes.push((e as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
      )
      const isHandled = !key(part(el, 'close-button'), 'Escape')
      expect(isHandled).toBe(true)
      await settle(el)

      expect(changes).toEqual([false])
      expect(panel.open).toBe(false)
      expect(el.hasAttribute('is-open')).toBe(false)
      expect(panel.getAttribute('role')).toBe('button')
      expect(panel.getAttribute('aria-expanded')).toBe('false')
      expect(el.shadowRoot?.activeElement).toBe(panel)
    })

    it('returns focus to the element that opened it from outside', async () => {
      const { el, panel } = await mount()
      const opener = document.createElement('button')
      document.body.append(opener)
      opener.focus()
      await el.setOpen(true)
      await el.setOpen(false)
      expect(panel.open).toBe(false)
      expect(document.activeElement).toBe(opener)
      opener.remove()
    })

    it('turns a close request (the cancel event) into an animated close', async () => {
      const { el, panel } = await mount()
      await el.setOpen(true)
      const cancel = new Event('cancel', { cancelable: true })
      panel.dispatchEvent(cancel)
      expect(cancel.defaultPrevented).toBe(true)
      expect(el.isOpen).toBe(false)
      await settle(el)
      expect(panel.open).toBe(false)
    })

    it('keeps Tab inside the open card', async () => {
      const { el, panel } = await mount()
      await el.setOpen(true)
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      const tab = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        composed: true,
        cancelable: true,
      })
      link.dispatchEvent(tab)
      expect(tab.defaultPrevented).toBe(true)
      expect(el.shadowRoot?.activeElement).toBe(part(el, 'close-button'))
      expect(panel.open).toBe(true)
    })
  })

  describe('closing', () => {
    it('closes from the close button and from a click on the backdrop, not inside', async () => {
      const { el, panel } = await mount()
      await el.setOpen(true)
      part(el, 'close-button').click()
      await settle(el)
      expect(panel.open).toBe(false)

      await el.setOpen(true)
      const at = (clientX: number, clientY: number) =>
        panel.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            composed: true,
            clientX,
            clientY,
          }),
        )
      at(OPEN_BOX.left + 20, OPEN_BOX.top + 20)
      expect(el.isOpen).toBe(true)
      at(OPEN_BOX.left - 20, OPEN_BOX.top + 20)
      expect(el.isOpen).toBe(false)
      await settle(el)
      expect(panel.open).toBe(false)
    })

    it('opens and closes from `isOpen` without firing openchange', async () => {
      const { el, panel } = await mount()
      const onChange = vi.fn()
      el.addEventListener('openchange', onChange)
      el.isOpen = true
      await el.updateComplete
      await settle(el)
      expect(panel.open).toBe(true)
      el.isOpen = false
      await el.updateComplete
      await settle(el)
      expect(panel.open).toBe(false)
      expect(onChange).not.toHaveBeenCalled()
      await el.toggle()
      expect(panel.open).toBe(true)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('closes its dialog when it leaves the page', async () => {
      const { el, panel } = await mount()
      await el.setOpen(true)
      el.remove()
      expect(panel.open).toBe(false)
    })
  })

  describe('motion', () => {
    it('holds its place in the page and grows from the card to the dialog by its real size', async () => {
      const { el, panel } = await mount()
      panel.click()
      await el.updateComplete
      await Promise.resolve()

      const placeholder = part(el, 'placeholder')
      expect(placeholder.style.width).toBe(`${CARD_BOX.width}px`)
      expect(placeholder.style.height).toBe(`${CARD_BOX.height}px`)

      const grow = vi
        .mocked(animate)
        .mock.calls.find(([target]) => target === panel)
      expect(grow?.[1]).toEqual({
        top: [`${CARD_BOX.top}px`, `${OPEN_BOX.top}px`],
        left: [`${CARD_BOX.left}px`, `${OPEN_BOX.left}px`],
        width: [`${CARD_BOX.width}px`, `${OPEN_BOX.width}px`],
        height: [`${CARD_BOX.height}px`, `${OPEN_BOX.height}px`],
      })
      expect(grow?.[2]).toMatchObject({ type: 'spring' })
      // Pinned while it morphs, centred by CSS again once it settles.
      expect(panel.style.bottom).toBe('auto')
      await settle(el)
      expect(panel.style.bottom).toBe('')
      expect(panel.style.width).toBe('')
    })

    it('shrinks back into the placeholder before closing', async () => {
      const { el, panel } = await mount()
      await el.setOpen(true)
      vi.mocked(animate).mockClear()
      const closing = el.setOpen(false)
      await el.updateComplete
      await Promise.resolve()
      expect(panel.open).toBe(true)
      const shrink = vi
        .mocked(animate)
        .mock.calls.find(([target]) => target === panel)
      expect(shrink?.[1]).toMatchObject({
        top: [`${OPEN_BOX.top}px`, `${CARD_BOX.top}px`],
        width: [`${OPEN_BOX.width}px`, `${CARD_BOX.width}px`],
      })
      await closing
      expect(panel.open).toBe(false)
      expect(panel.style.top).toBe('')
    })

    it('can be reversed mid-way without getting stuck', async () => {
      const { el, panel } = await mount()
      const opening = el.setOpen(true)
      const closing = el.setOpen(false)
      await Promise.all([opening, closing])
      expect(panel.open).toBe(false)
      expect(el.isOpen).toBe(false)
      await el.setOpen(true)
      expect(panel.open).toBe(true)
      expect(panel.getAttribute('role')).toBe('dialog')
    })
  })

  describe('reduced motion', () => {
    it('fades the dialog in and out at the centre instead of growing from the card', async () => {
      motion = mockReducedMotion(true)
      const { el, panel } = await mount()
      await el.setOpen(true)

      const calls = vi
        .mocked(animate)
        .mock.calls.filter(([target]) => target === panel)
      expect(calls).toHaveLength(1)
      expect(Object.keys(calls[0][1] as object)).toEqual(['opacity'])
      expect(panel.open).toBe(true)
      expect(panel.style.opacity).toBe('')

      await el.setOpen(false)
      const all = vi
        .mocked(animate)
        .mock.calls.filter(([target]) => target === panel)
      expect(all).toHaveLength(2)
      expect(Object.keys(all[1][1] as object)).toEqual(['opacity'])
      expect(panel.open).toBe(false)
      expect(panel.style.opacity).toBe('')
    })
  })
})
