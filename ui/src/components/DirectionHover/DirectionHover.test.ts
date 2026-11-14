import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion } from '../../test-setup'
import './index'
import type { MoulDirectionHover } from './DirectionHover'
import { directionHoverStyles } from './DirectionHover.styles'

/** The element covers 100..300 across and 100..250 down. */
function place(el: MoulDirectionHover): void {
  el.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      right: 300,
      bottom: 250,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  el: HTMLElement,
  type: 'pointerenter' | 'pointerleave' | 'pointerup',
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, { clientX, clientY, pointerType, composed: true }),
  )
}

const overlay = (el: MoulDirectionHover) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="overlay"]') as HTMLElement

async function card() {
  const el = await fixture<MoulDirectionHover>(html`<moul-direction-hover>
    <img src="data:," alt="Angkor Wat at dawn" />
    <div slot="overlay">
      <strong>Angkor Wat</strong>
      <a href="#angkor">Plan a visit</a>
    </div>
  </moul-direction-hover>`)
  place(el)
  return el
}

describe('<moul-direction-hover>', () => {
  afterEach(() => fixtureCleanup())

  it('renders the picture and the overlay in their parts', async () => {
    const el = await card()
    expect(customElements.get('moul-direction-hover')).toBeDefined()
    const media = el.shadowRoot?.querySelector('[part="media"] slot')
    expect(media?.getAttribute('name')).toBeNull()
    expect(overlay(el).querySelector('slot')?.getAttribute('name')).toBe(
      'overlay',
    )
    expect(el.isRevealed).toBe(false)
  })

  it.each([
    ['left', 101, 175],
    ['right', 299, 175],
    ['top', 200, 101],
    ['bottom', 200, 249],
  ])('slides in from the %s when the pointer enters there', async (edge, x, y) => {
    const el = await card()
    pointer(el, 'pointerenter', x, y)
    expect(el.getAttribute('data-edge')).toBe(edge)
    expect(el.getAttribute('data-state')).toBe('in')
    expect(el.isRevealed).toBe(true)
    // The jump to the entry edge is made without a transition, then restored.
    expect(el.hasAttribute('data-snap')).toBe(false)
  })

  it('slides out toward the edge the pointer leaves by', async () => {
    const el = await card()
    pointer(el, 'pointerenter', 101, 175)
    pointer(el, 'pointerleave', 200, 252)
    expect(el.getAttribute('data-state')).toBe('out')
    expect(el.getAttribute('data-edge')).toBe('bottom')
    pointer(el, 'pointerenter', 299, 175)
    pointer(el, 'pointerleave', 302, 175)
    expect(el.getAttribute('data-edge')).toBe('right')
  })

  it('turns back from where it is when the pointer returns mid-exit', async () => {
    const el = await card()
    pointer(el, 'pointerenter', 101, 175)
    pointer(el, 'pointerleave', 302, 175)
    // Still sliding out to the right: re-entering at the top does not jump it to the top.
    pointer(el, 'pointerenter', 200, 101)
    expect(el.getAttribute('data-edge')).toBe('right')
    expect(el.getAttribute('data-state')).toBe('in')
  })

  it('jumps to the new edge once the exit has finished', async () => {
    const el = await card()
    pointer(el, 'pointerenter', 101, 175)
    pointer(el, 'pointerleave', 302, 175)
    const end = new Event('transitionend') as TransitionEvent
    Object.defineProperty(end, 'propertyName', { value: 'translate' })
    overlay(el).dispatchEvent(end)
    pointer(el, 'pointerenter', 200, 101)
    expect(el.getAttribute('data-edge')).toBe('top')
  })

  it('ignores the enter and leave a finger makes, and shows the overlay on a tap', async () => {
    const el = await card()
    pointer(el, 'pointerenter', 150, 150, 'touch')
    expect(el.isRevealed).toBe(false)
    pointer(el, 'pointerup', 150, 150, 'touch')
    pointer(el, 'pointerleave', 150, 150, 'touch')
    expect(el.isRevealed).toBe(true)
    expect(el.getAttribute('data-edge')).toBe('bottom')
  })

  it('hides a tapped overlay when the reader taps elsewhere', async () => {
    const el = await card()
    pointer(el, 'pointerup', 150, 150, 'touch')
    await new Promise((resolve) => setTimeout(resolve))
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }),
    )
    expect(el.isRevealed).toBe(false)
  })

  it('keeps a tapped overlay when the tap lands inside it', async () => {
    const el = await card()
    pointer(el, 'pointerup', 150, 150, 'touch')
    await new Promise((resolve) => setTimeout(resolve))
    el.querySelector('a')?.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerType: 'touch',
        bubbles: true,
        composed: true,
      }),
    )
    expect(el.isRevealed).toBe(true)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the overlay stays in the page', async () => {
      const el = await card()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(overlay(el).hasAttribute('aria-hidden')).toBe(false)
      expect(overlay(el).hasAttribute('inert')).toBe(false)
    })

    it('shows the overlay from the bottom while focus is inside', async () => {
      const el = await card()
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(el.isRevealed).toBe(true)
      expect(el.getAttribute('data-edge')).toBe('bottom')
      link.blur()
      expect(el.isRevealed).toBe(false)
    })

    it('keeps the overlay while the pointer is still over it after focus leaves', async () => {
      const el = await card()
      pointer(el, 'pointerenter', 101, 175)
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      link.blur()
      expect(el.isRevealed).toBe(true)
    })
  })

  describe('reduced motion', () => {
    it('fades the overlay in place instead of sliding, and drops the zoom', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await card()
        pointer(el, 'pointerenter', 101, 175)
        expect(el.isRevealed).toBe(true)
        const css = directionHoverStyles.cssText
        const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
        expect(block).toMatch(/translate:\s*none/)
        expect(block).toMatch(/scale:\s*none/)
        expect(block).toMatch(/transition:\s*opacity/)
      } finally {
        motion.restore()
      }
    })
  })
})
