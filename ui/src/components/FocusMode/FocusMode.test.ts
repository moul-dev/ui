import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './FocusMode'
import type { MoulFocusMode } from './FocusMode'

function stubRect(
  el: Element,
  box: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      ...box,
      x: box.left,
      y: box.top,
      right: box.left + box.width,
      bottom: box.top + box.height,
      toJSON: () => box,
    }) as DOMRect
}

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

async function settle(el: MoulFocusMode): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await el.updateComplete
    await wait()
  }
}

async function mount(attrs = '') {
  const root = await fixture<HTMLDivElement>(html`
    <div>
      <button id="elsewhere">Elsewhere</button>
      <p id="note">A note</p>
      <moul-focus-mode radius="6">
        <textarea aria-label="Draft"></textarea>
      </moul-focus-mode>
    </div>
  `)
  const el = root.querySelector('moul-focus-mode') as MoulFocusMode
  if (attrs) el.setAttribute(attrs, '')
  stubRect(el, { left: 100, top: 200, width: 300, height: 100 })
  stubRect(root.querySelector('#note') as Element, {
    left: 20,
    top: 20,
    width: 50,
    height: 20,
  })
  await settle(el)
  const overlay = el.overlayEl as HTMLElement
  const isShown = () =>
    overlay.classList.contains('is-shown') && overlay.matches(':popover-open')
  return { root, el, overlay, isShown }
}

describe('<moul-focus-mode>', () => {
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    motion = mockReducedMotion(true)
  })

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered and wraps its region with the dim layer hidden', async () => {
    const { el, overlay, isShown } = await mount()
    expect(customElements.get('moul-focus-mode')).toBeDefined()
    expect(el.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull()
    expect(el.isOpen).toBe(false)
    expect(overlay.getAttribute('popover')).toBe('manual')
    expect(isShown()).toBe(false)
  })

  it('dims the page around the region when opened', async () => {
    const { el, overlay, isShown } = await mount()
    const onOpen = vi.fn()
    el.addEventListener('openchange', onOpen)
    await el.setOpen(true)
    await settle(el)
    expect(el.hasAttribute('is-open')).toBe(true)
    expect(onOpen.mock.calls[0][0].detail).toEqual({ isOpen: true })
    expect(isShown()).toBe(true)
    // 8px padding around the 300 × 100 region at (100, 200), 6px corners.
    expect(overlay.style.clipPath).toContain(
      'M98 192H402A6 6 0 0 1 408 198V302',
    )
  })

  it('cuts around the element `target` selects instead', async () => {
    const { el, overlay } = await mount()
    el.target = '#note'
    el.padding = 0
    await el.setOpen(true)
    await settle(el)
    expect(overlay.style.clipPath).toContain('M26 20H64')
  })

  it('follows the region as the page scrolls', async () => {
    const { el, overlay } = await mount()
    await el.setOpen(true)
    await settle(el)
    stubRect(el, { left: 100, top: 50, width: 300, height: 100 })
    window.dispatchEvent(new Event('scroll'))
    await wait(40)
    expect(overlay.style.clipPath).toContain('M98 42H402')
  })

  it('ends on a click on the dimmed page', async () => {
    const { el, overlay, isShown } = await mount()
    const onOpen = vi.fn()
    await el.setOpen(true)
    await settle(el)
    el.addEventListener('openchange', onOpen)
    overlay.click()
    await settle(el)
    expect(el.isOpen).toBe(false)
    expect(onOpen.mock.calls[0][0].detail).toEqual({ isOpen: false })
    expect(isShown()).toBe(false)
  })

  it('toggles, and setting is-open directly fires no event', async () => {
    const { el, isShown } = await mount()
    const onOpen = vi.fn()
    el.addEventListener('openchange', onOpen)
    el.isOpen = true
    await settle(el)
    expect(isShown()).toBe(true)
    expect(onOpen).not.toHaveBeenCalled()
    await el.toggle()
    await settle(el)
    expect(el.isOpen).toBe(false)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('reflects is-blurred', async () => {
    const { el } = await mount('is-blurred')
    expect(el.isBlurred).toBe(true)
    el.isBlurred = false
    await el.updateComplete
    expect(el.hasAttribute('is-blurred')).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('ends on Escape from anywhere, unless something else handled it', async () => {
      const { el, root } = await mount()
      await el.setOpen(true)
      await settle(el)
      const elsewhere = root.querySelector('#elsewhere') as HTMLElement

      const handled = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
      handled.preventDefault()
      elsewhere.dispatchEvent(handled)
      await settle(el)
      expect(el.isOpen).toBe(true)

      elsewhere.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      )
      await settle(el)
      expect(el.isOpen).toBe(false)
    })

    it('moves no focus and hides the dim layer from screen readers', async () => {
      const { el, overlay, root } = await mount()
      const elsewhere = root.querySelector('#elsewhere') as HTMLElement
      elsewhere.focus()
      await el.setOpen(true)
      await settle(el)
      expect(document.activeElement).toBe(elsewhere)
      expect(overlay.getAttribute('aria-hidden')).toBe('true')
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('shows and hides the dim at once, with the cutout already in place', async () => {
      const { el, overlay, isShown } = await mount()
      await el.setOpen(true)
      await settle(el)
      expect(overlay.style.clipPath).toContain('M98 192H402')
      expect(overlay.style.opacity).toBe('')
      await el.setOpen(false)
      await settle(el)
      expect(isShown()).toBe(false)
    })

    it('closes in on the region, and fades before hiding, when motion is allowed', async () => {
      motion?.set(false)
      const { el, overlay, isShown } = await mount()
      await el.setOpen(true)
      await el.updateComplete
      // The hole starts as the whole viewport, so nothing is dimmed yet.
      expect(overlay.style.clipPath).not.toContain('M98 192H402')
      await wait(900)
      expect(overlay.style.clipPath).toContain('M98 192H402')
      await el.setOpen(false)
      await wait()
      expect(isShown()).toBe(true)
      await wait(600)
      expect(isShown()).toBe(false)
    })
  })
})
