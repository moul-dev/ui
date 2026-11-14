import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion } from '../../test-setup'
import './index'
import type { MoulHoverHighlight } from './HoverHighlight'
import { hoverHighlightStyles } from './HoverHighlight.styles'

const highlight = (el: MoulHoverHighlight) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="highlight"]') as HTMLElement

/** Gives the element and each item a fixed box: items 100px wide in a row, 8px apart. */
function layOut(el: MoulHoverHighlight, items: Element[] = el.items): void {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
  el.getBoundingClientRect = () => rect(10, 20, 340, 40)
  items.forEach((item, index) => {
    ;(item as HTMLElement).getBoundingClientRect = () =>
      rect(10 + index * 108, 20, 100, 40)
  })
}

function pointer(
  target: EventTarget,
  type: 'pointerover' | 'pointerleave',
  pointerType = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerType,
      bubbles: type === 'pointerover',
      composed: true,
    }),
  )
}

async function list(attributes = '') {
  const host = document.createElement('div')
  host.innerHTML = `<moul-hover-highlight ${attributes}>
    <a href="#angkor">Angkor</a>
    <a href="#kampot">Kampot</a>
    <a href="#kep">Kep</a>
  </moul-hover-highlight>`
  document.body.append(host)
  const highlightEl = host.firstElementChild as MoulHoverHighlight
  await highlightEl.updateComplete
  layOut(highlightEl)
  return highlightEl
}

describe('<moul-hover-highlight>', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders one decorative highlight behind the slotted items', async () => {
    const el = await list()
    expect(customElements.get('moul-hover-highlight')).toBeDefined()
    expect(highlight(el).getAttribute('aria-hidden')).toBe('true')
    expect(el.items.map((item) => item.textContent)).toEqual([
      'Angkor',
      'Kampot',
      'Kep',
    ])
    expect(el.hasAttribute('data-highlight')).toBe(false)
  })

  it('places the highlight on the item under the pointer', async () => {
    const el = await list()
    const [, kampot] = el.items
    pointer(kampot, 'pointerover')
    expect(el.getAttribute('data-highlight')).toBe('pointer')
    expect(kampot.hasAttribute('data-highlighted')).toBe(true)
    expect(highlight(el).style.translate).toBe('108px 0px')
    expect(highlight(el).style.width).toBe('100px')
    expect(highlight(el).style.height).toBe('40px')
  })

  it('slides from item to item, moving the marker with it', async () => {
    const el = await list()
    const [angkor, , kep] = el.items
    pointer(angkor, 'pointerover')
    // Shown: the next placement keeps the stylesheet transition (a slide).
    expect(highlight(el).hasAttribute('data-visible')).toBe(true)
    pointer(kep, 'pointerover')
    expect(highlight(el).style.translate).toBe('216px 0px')
    expect(highlight(el).style.transition).toBe('')
    expect(angkor.hasAttribute('data-highlighted')).toBe(false)
    expect(kep.hasAttribute('data-highlighted')).toBe(true)
  })

  it('waits on the last item while the pointer crosses a gap', async () => {
    const el = await list()
    const [angkor] = el.items
    pointer(angkor, 'pointerover')
    pointer(el, 'pointerover')
    expect(angkor.hasAttribute('data-highlighted')).toBe(true)
    expect(el.getAttribute('data-highlight')).toBe('pointer')
  })

  it('fades out when the pointer leaves, and reappears without a slide', async () => {
    const el = await list()
    const [angkor, kampot] = el.items
    pointer(angkor, 'pointerover')
    pointer(el, 'pointerleave')
    expect(el.hasAttribute('data-highlight')).toBe(false)
    expect(angkor.hasAttribute('data-highlighted')).toBe(false)
    expect(highlight(el).hasAttribute('data-visible')).toBe(false)

    pointer(kampot, 'pointerover')
    expect(highlight(el).style.translate).toBe('108px 0px')
    expect(el.getAttribute('data-highlight')).toBe('pointer')
  })

  it('ignores a finger', async () => {
    const el = await list()
    pointer(el.items[1], 'pointerover', 'touch')
    expect(el.hasAttribute('data-highlight')).toBe(false)
  })

  it('takes the radius of a rounded item', async () => {
    const el = await list()
    const [angkor] = el.items
    angkor.style.borderRadius = '12px'
    pointer(angkor, 'pointerover')
    expect(
      highlight(el).style.getPropertyValue('--_hover-highlight-item-radius'),
    ).toBe('12px')
  })

  it('picks descendants with item-selector', async () => {
    const host = document.createElement('div')
    host.innerHTML = `<moul-hover-highlight item-selector="li">
      <ul><li>One</li><li>Two</li></ul>
    </moul-hover-highlight>`
    document.body.append(host)
    const el = host.firstElementChild as MoulHoverHighlight
    await el.updateComplete
    expect(el.items.map((item) => item.localName)).toEqual(['li', 'li'])
    layOut(el)
    pointer(el.items[1], 'pointerover')
    expect(el.items[1].hasAttribute('data-highlighted')).toBe(true)
    expect(el.querySelector('ul')?.hasAttribute('data-highlighted')).toBe(false)
  })

  it('treats an invalid item-selector as no items', async () => {
    const el = await list('item-selector="[[nope"')
    expect(el.items).toEqual([])
  })

  describe('is-persistent', () => {
    it('stays on the last item when the pointer leaves', async () => {
      const el = await list('is-persistent')
      const [, kampot] = el.items
      pointer(kampot, 'pointerover')
      pointer(el, 'pointerleave')
      expect(el.getAttribute('data-highlight')).toBe('rest')
      expect(kampot.hasAttribute('data-highlighted')).toBe(true)
    })

    it('rests on the current item, and follows aria-current when it moves', async () => {
      const el = await list('is-persistent')
      const [angkor, , kep] = el.items
      kep.setAttribute('aria-current', 'page')
      // The mutation observer reports asynchronously.
      await new Promise((resolve) => setTimeout(resolve))
      expect(kep.hasAttribute('data-highlighted')).toBe(true)
      expect(el.getAttribute('data-highlight')).toBe('rest')

      pointer(angkor, 'pointerover')
      expect(angkor.hasAttribute('data-highlighted')).toBe(true)
      pointer(el, 'pointerleave')
      expect(kep.hasAttribute('data-highlighted')).toBe(true)
    })
  })

  it('forgets an item that is removed', async () => {
    const el = await list('is-persistent')
    const [angkor] = el.items
    pointer(angkor, 'pointerover')
    pointer(el, 'pointerleave')
    angkor.remove()
    await new Promise((resolve) => setTimeout(resolve))
    expect(el.hasAttribute('data-highlight')).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('adds no role and leaves the items in the tab order', async () => {
      const el = await list()
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.items.some((item) => item.hasAttribute('tabindex'))).toBe(false)
    })

    it('follows keyboard focus from item to item', async () => {
      const el = await list()
      const [angkor, kampot] = el.items
      angkor.focus()
      expect(el.getAttribute('data-highlight')).toBe('focus')
      expect(angkor.hasAttribute('data-highlighted')).toBe(true)
      kampot.focus()
      expect(kampot.hasAttribute('data-highlighted')).toBe(true)
      expect(highlight(el).style.translate).toBe('108px 0px')
    })

    it('hides when focus leaves the items', async () => {
      const el = await list()
      const outside = document.createElement('button')
      document.body.append(outside)
      el.items[0].focus()
      outside.focus()
      expect(el.hasAttribute('data-highlight')).toBe(false)
    })

    it('prefers the pointer over focus, and returns to focus when the pointer leaves', async () => {
      const el = await list()
      const [angkor, , kep] = el.items
      angkor.focus()
      pointer(kep, 'pointerover')
      expect(kep.hasAttribute('data-highlighted')).toBe(true)
      pointer(el, 'pointerleave')
      expect(angkor.hasAttribute('data-highlighted')).toBe(true)
      expect(el.getAttribute('data-highlight')).toBe('focus')
    })
  })

  describe('reduced motion', () => {
    it('still marks the item, and the stylesheet stops the slide', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await list()
        pointer(el.items[2], 'pointerover')
        expect(el.items[2].hasAttribute('data-highlighted')).toBe(true)
        const css = hoverHighlightStyles.cssText
        const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
        expect(block).toMatch(/\.highlight\s*\{\s*transition:\s*none/)
      } finally {
        motion.restore()
      }
    })
  })
})
