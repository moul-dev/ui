import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './PointerParallax'
import { type MoulPointerParallax, parseDepth } from './PointerParallax'
import { pointerParallaxStyles } from './PointerParallax.styles'

/** Lets slotchange events and the renders they cause run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const depthOf = (el: Element) =>
  (el as HTMLElement).style.getPropertyValue('--_pointer-parallax-depth')

/** A 400 × 200 box whose top-left corner is at (100, 100). */
function place(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      width: 400,
      height: 200,
      right: 500,
      bottom: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  target: EventTarget,
  type: 'pointermove' | 'pointerleave',
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type === 'pointermove',
      composed: true,
    }),
  )
}

describe('parseDepth', () => {
  it('reads numbers, and nothing else', () => {
    expect(parseDepth('0.5')).toBe(0.5)
    expect(parseDepth('-1')).toBe(-1)
    expect(parseDepth('')).toBeNull()
    expect(parseDepth(null)).toBeNull()
    expect(parseDepth('deep')).toBeNull()
  })
})

describe('<moul-pointer-parallax>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    frames.restore()
    motion.restore()
  })

  async function parallax(
    markup = html`<moul-pointer-parallax>
      <div class="sky" data-depth="0.2"></div>
      <div class="hill" data-depth="-0.5"></div>
      <h1>Kampot</h1>
    </moul-pointer-parallax>`,
  ) {
    const el = await fixture<MoulPointerParallax>(markup)
    await settle()
    place(el)
    return el
  }

  it('copies each child depth into a variable, once, and leaves children without one alone', async () => {
    const el = await parallax()
    expect(customElements.get('moul-pointer-parallax')).toBeDefined()
    const [sky, hill, heading] = [...el.children]
    expect(depthOf(sky)).toBe('0.2')
    expect(depthOf(hill)).toBe('-0.5')
    expect(depthOf(heading)).toBe('')
    expect(el.strength).toBe(24)
    expect(el.scope).toBe('element')
  })

  it('follows changes to data-depth', async () => {
    const el = await parallax()
    const sky = el.children[0] as HTMLElement
    sky.setAttribute('data-depth', '1')
    await settle()
    expect(depthOf(sky)).toBe('1')
    sky.removeAttribute('data-depth')
    await settle()
    expect(depthOf(sky)).toBe('')
  })

  it('writes one offset for every layer, once per frame, while the pointer is over it', async () => {
    const el = await parallax()
    pointer(el, 'pointermove', 400, 150)
    pointer(el, 'pointermove', 500, 300)
    expect(frames.pending).toBe(1)
    frames.step(16)
    // The bottom-right corner: one full step right and down.
    expect(el.offset).toEqual({ x: 1, y: 1 })
    pointer(el, 'pointermove', 200, 200)
    frames.step(32)
    expect(el.offset).toEqual({ x: -0.5, y: 0 })
  })

  it('drifts back to the centre when the pointer leaves', async () => {
    const el = await parallax()
    pointer(el, 'pointermove', 450, 120)
    frames.step(16)
    expect(el.offset.x).not.toBe(0)
    pointer(el, 'pointerleave', 600, 120)
    frames.step(32)
    expect(el.offset).toEqual({ x: 0, y: 0 })
  })

  it('passes strength to the layers', async () => {
    const el = await parallax(
      html`<moul-pointer-parallax strength="60"><div data-depth="1"></div></moul-pointer-parallax>`,
    )
    const layers = el.shadowRoot?.querySelector('.layers') as HTMLElement
    expect(layers.style.getPropertyValue('--_pointer-parallax-strength')).toBe(
      '60',
    )
  })

  it('ignores touch', async () => {
    const el = await parallax()
    pointer(el, 'pointermove', 450, 120, 'touch')
    expect(frames.pending).toBe(0)
    expect(el.offset).toEqual({ x: 0, y: 0 })
  })

  describe('scope="page"', () => {
    let io: IntersectionMock

    beforeEach(() => {
      io = mockIntersectionObserver()
    })

    afterEach(() => io.restore())

    it('follows the pointer anywhere on the page, clamped at the edges', async () => {
      const el = await parallax(
        html`<moul-pointer-parallax scope="page"><div data-depth="1"></div></moul-pointer-parallax>`,
      )
      io.enter(el)
      pointer(window, 'pointermove', 1500, 200)
      frames.step(16)
      expect(el.offset).toEqual({ x: 1, y: 0 })
    })

    it('skips its writes while the element is off screen', async () => {
      const el = await parallax(
        html`<moul-pointer-parallax scope="page"><div data-depth="1"></div></moul-pointer-parallax>`,
      )
      io.leave(el)
      pointer(window, 'pointermove', 500, 200)
      frames.step(16)
      expect(el.offset).toEqual({ x: 0, y: 0 })
    })

    it('switches back to the element when scope changes', async () => {
      const el = await parallax(
        html`<moul-pointer-parallax scope="page"><div data-depth="1"></div></moul-pointer-parallax>`,
      )
      el.scope = 'element'
      await el.updateComplete
      pointer(window, 'pointermove', 500, 200)
      expect(frames.pending).toBe(0)
      pointer(el, 'pointermove', 500, 200)
      frames.step(16)
      expect(el.offset).toEqual({ x: 1, y: 0 })
    })

    it('falls back to element for an unknown scope', async () => {
      const el = await parallax(
        html`<moul-pointer-parallax scope="sky"></moul-pointer-parallax>`,
      )
      expect(el.scope).toBe('element')
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role, so the layers read in order', async () => {
      const el = await parallax()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      expect(el.getAttribute('aria-hidden')).toBeNull()
      expect(el.querySelector('h1')?.textContent).toBe('Kampot')
    })
  })

  describe('reduced motion', () => {
    it('keeps every layer in its place when the user asks for reduced motion', async () => {
      motion.set(true)
      const el = await parallax()
      pointer(el, 'pointermove', 500, 300)
      frames.step(16)
      expect(el.offset).toEqual({ x: 0, y: 0 })
    })

    it('settles the layers at once when the setting turns on', async () => {
      const el = await parallax()
      pointer(el, 'pointermove', 500, 300)
      frames.step(16)
      expect(el.offset).toEqual({ x: 1, y: 1 })
      motion.set(true)
      expect(el.offset).toEqual({ x: 0, y: 0 })
    })

    it('has a stylesheet branch that holds the layers still', () => {
      const css = pointerParallaxStyles.cssText
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('translate: none')
    })
  })
})
