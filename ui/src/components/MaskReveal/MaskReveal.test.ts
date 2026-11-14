import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './MaskReveal'
import type { MoulMaskReveal } from './MaskReveal'
import { maskRevealStyles } from './MaskReveal.styles'

/** The stylesheet without its comments. */
const css = maskRevealStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of the first block whose prelude starts with `prelude`. */
function block(prelude: string): string {
  const start = css.indexOf(prelude)
  if (start < 0) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

const RECT = { left: 40, top: 60, width: 400, height: 200 }

function place(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      ...RECT,
      x: RECT.left,
      y: RECT.top,
      right: RECT.left + RECT.width,
      bottom: RECT.top + RECT.height,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  el: HTMLElement,
  type: string,
  clientX = 0,
  clientY = 0,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type !== 'pointerenter' && type !== 'pointerleave',
      composed: true,
    }),
  )
}

const layers = (el: MoulMaskReveal) =>
  el.shadowRoot?.querySelector('.layers') as HTMLElement
const part = (el: MoulMaskReveal, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement
const centreOf = (layer: HTMLElement) => [
  layer.style.getPropertyValue('--_mask-reveal-pointer-x'),
  layer.style.getPropertyValue('--_mask-reveal-pointer-y'),
]

async function mount() {
  const el = await fixture<MoulMaskReveal>(html`<moul-mask-reveal>
    <h2>Angkor at noon</h2>
    <h2 slot="revealed"><a href="#night">Angkor at night</a></h2>
  </moul-mask-reveal>`)
  place(el)
  return el
}

describe('<moul-mask-reveal>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
    frames.restore()
  })

  it('puts the visible layer and the hidden layer in their slots, the hidden one on top', async () => {
    const el = await mount()
    const visible = part(el, 'content').querySelector('slot') as HTMLSlotElement
    const hidden = part(el, 'revealed').querySelector('slot') as HTMLSlotElement
    expect(visible.assignedElements().map((node) => node.textContent)).toEqual([
      'Angkor at noon',
    ])
    expect(hidden.name).toBe('revealed')
    expect(hidden.assignedElements()[0].textContent).toBe('Angkor at night')
    expect(
      part(el, 'content').compareDocumentPosition(part(el, 'revealed')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(css).toMatch(/\.layer\s*\{[^}]*grid-area:\s*1 \/ 1/)
  })

  it('has the documented defaults and writes the sizes as variables', async () => {
    const el = await mount()
    expect(el.size).toBe(0)
    expect(el.revealSize).toBe(240)
    expect(el.isRevealed).toBe(false)
    expect(el.style.getPropertyValue('--_mask-reveal-size')).toBe('0px')
    expect(el.style.getPropertyValue('--_mask-reveal-active-size')).toBe(
      '240px',
    )
    el.setAttribute('size', '24')
    el.setAttribute('reveal-size', '320')
    await el.updateComplete
    expect(el.style.getPropertyValue('--_mask-reveal-size')).toBe('24px')
    expect(el.style.getPropertyValue('--_mask-reveal-active-size')).toBe(
      '320px',
    )
    el.size = -4
    await el.updateComplete
    expect(el.style.getPropertyValue('--_mask-reveal-size')).toBe('0px')
  })

  it('grows the circle while a mouse is over it and shrinks it when it leaves', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 100, 100)
    expect(layers(el).classList.contains('is-active')).toBe(true)
    pointer(el, 'pointerleave')
    expect(layers(el).classList.contains('is-active')).toBe(false)
  })

  it('moves the circle on both layers once per frame', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 100, 100)
    pointer(el, 'pointermove', 100, 100)
    pointer(el, 'pointermove', 140, 110)
    expect(frames.pending).toBe(1)
    frames.step(16)
    expect(centreOf(part(el, 'revealed'))).toEqual(['100px', '50px'])
    expect(centreOf(part(el, 'content'))).toEqual(['100px', '50px'])
    // The radius never inherits into the content, and the cut never lays out.
    expect(block('[part="content"]')).toMatch(/mask-image:\s*radial-gradient/)
    expect(block('[part="revealed"]')).toMatch(/clip-path:\s*circle\(/)
  })

  it('opens where a finger presses, and closes when it lifts', async () => {
    const el = await mount()
    pointer(el, 'pointerenter', 240, 160, 'touch')
    expect(layers(el).classList.contains('is-active')).toBe(false)
    pointer(el, 'pointerdown', 240, 160, 'touch')
    expect(layers(el).classList.contains('is-active')).toBe(true)
    expect(centreOf(part(el, 'revealed'))).toEqual(['200px', '100px'])
    expect(centreOf(part(el, 'content'))).toEqual(['200px', '100px'])
    pointer(el, 'pointerup', 240, 160, 'touch')
    expect(layers(el).classList.contains('is-active')).toBe(false)
    pointer(el, 'pointerdown', 240, 160, 'touch')
    pointer(el, 'pointercancel', 240, 160, 'touch')
    expect(layers(el).classList.contains('is-active')).toBe(false)
  })

  it('uncovers the whole layer with is-revealed, from a circle as wide as the diagonal', async () => {
    const el = await mount()
    triggerResize(el, { width: 300, height: 400 })
    expect(el.style.getPropertyValue('--_mask-reveal-full')).toBe('500px')
    el.isRevealed = true
    await el.updateComplete
    expect(el.hasAttribute('is-revealed')).toBe(true)
    expect(layers(el).classList.contains('is-full')).toBe(true)
    el.isRevealed = false
    await el.updateComplete
    expect(layers(el).classList.contains('is-full')).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable itself and leaves both layers in the reading order', async () => {
      const el = await mount()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(part(el, 'content').hasAttribute('aria-hidden')).toBe(false)
      expect(part(el, 'revealed').hasAttribute('aria-hidden')).toBe(false)
    })

    it('uncovers the whole layer while focus is inside the hidden layer', async () => {
      const el = await fixture<MoulMaskReveal>(html`<moul-mask-reveal>
        <p><a id="day" href="#day">Day</a></p>
        <p slot="revealed"><a id="night" href="#night">Night</a></p>
      </moul-mask-reveal>`)
      const day = el.querySelector('#day') as HTMLAnchorElement
      const night = el.querySelector('#night') as HTMLAnchorElement

      day.focus()
      expect(layers(el).classList.contains('is-full')).toBe(false)
      night.focus()
      expect(document.activeElement).toBe(night)
      expect(layers(el).classList.contains('is-full')).toBe(true)
      day.focus()
      expect(layers(el).classList.contains('is-full')).toBe(false)
      night.focus()
      night.blur()
      expect(layers(el).classList.contains('is-full')).toBe(false)

      // is-revealed holds it open after focus leaves.
      el.isRevealed = true
      await el.updateComplete
      night.focus()
      night.blur()
      expect(layers(el).classList.contains('is-full')).toBe(true)
    })
  })

  describe('reduced motion', () => {
    it('shows the whole layer at once on hover instead of a moving circle', async () => {
      motion.set(true)
      const el = await mount()
      pointer(el, 'pointerenter', 100, 100)
      pointer(el, 'pointermove', 100, 100)
      frames.step(16)
      expect(centreOf(part(el, 'content'))).toEqual(['', ''])
      expect(layers(el).classList.contains('is-active')).toBe(true)

      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toMatch(/transition:\s*none/)
      expect(reduced).toMatch(
        /\.layers\.is-active > \.layer,\s*\.layers\.is-full > \.layer\s*\{\s*--_mask-reveal-r:\s*var\(--_mask-reveal-full/,
      )
      expect(reduced).toMatch(/--_mask-reveal-r:\s*0px/)
    })

    it('stops following when the setting turns on mid-way', async () => {
      const el = await mount()
      pointer(el, 'pointerenter', 100, 100)
      pointer(el, 'pointermove', 100, 100)
      frames.step(16)
      expect(centreOf(part(el, 'content'))).toEqual(['60px', '40px'])
      motion.set(true)
      pointer(el, 'pointermove', 300, 200)
      frames.step(32)
      expect(centreOf(part(el, 'content'))).toEqual(['60px', '40px'])
    })
  })
})
