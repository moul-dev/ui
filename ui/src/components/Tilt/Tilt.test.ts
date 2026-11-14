import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Tilt'
import type { MoulTilt } from './Tilt'
import { tiltStyles } from './Tilt.styles'

const surface = (el: MoulTilt) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="surface"]') as HTMLElement

/** Puts the host at a fixed 200 × 100 box, 100px in from the top left. */
function place(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      right: 300,
      bottom: 200,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }) as DOMRect
}

function pointer(
  el: HTMLElement,
  type: 'pointermove' | 'pointerleave',
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      clientX,
      clientY,
      pointerType,
      bubbles: type === 'pointermove',
      composed: true,
    }),
  )
}

describe('<moul-tilt>', () => {
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

  async function tilt(markup = html`<moul-tilt><div>Card</div></moul-tilt>`) {
    const el = await fixture<MoulTilt>(markup)
    place(el)
    return el
  }

  it('renders the content inside a surface, with sensible defaults', async () => {
    const el = await tilt()
    expect(customElements.get('moul-tilt')).toBeDefined()
    expect(surface(el).querySelector('slot')).not.toBeNull()
    expect(el.maxTilt).toBe(10)
    expect(el.perspective).toBe(1000)
    expect(el.hoverScale).toBe(1.03)
    expect(el.isReversed).toBe(false)
    expect(el.glare).toBe(false)
    expect(el.shadowRoot?.querySelector('[part="glare"]')).toBeNull()
    expect(surface(el).style.getPropertyValue('--_tilt-max')).toBe('10')
    expect(surface(el).style.getPropertyValue('--_tilt-direction')).toBe('1')
  })

  it('tilts toward a mouse and writes its position on the surface, once per frame', async () => {
    const el = await tilt()
    pointer(el, 'pointermove', 250, 125)
    pointer(el, 'pointermove', 270, 125)
    expect(frames.pending).toBe(1)
    frames.step(16)
    expect(el.isTilted).toBe(true)
    expect(surface(el).classList.contains('is-active')).toBe(true)
    expect(surface(el).style.getPropertyValue('--_tilt-pointer-ratio-x')).toBe(
      '0.85',
    )
    expect(surface(el).style.getPropertyValue('--_tilt-pointer-ratio-y')).toBe(
      '0.25',
    )
    // The host carries none of it, so nothing outside the surface restyles.
    expect(el.style.getPropertyValue('--_tilt-pointer-ratio-x')).toBe('')
  })

  it('springs back flat when the pointer leaves', async () => {
    const el = await tilt()
    pointer(el, 'pointermove', 250, 125)
    frames.step(16)
    expect(el.isTilted).toBe(true)
    pointer(el, 'pointerleave', 320, 125)
    frames.step(32)
    expect(el.isTilted).toBe(false)
  })

  it('ignores touch, so a box under a finger stays flat', async () => {
    const el = await tilt()
    pointer(el, 'pointermove', 250, 125, 'touch')
    expect(frames.pending).toBe(0)
    expect(el.isTilted).toBe(false)
  })

  it('follows a pen as well as a mouse', async () => {
    const el = await tilt()
    pointer(el, 'pointermove', 150, 150, 'pen')
    frames.step(16)
    expect(el.isTilted).toBe(true)
  })

  it('passes max-tilt, perspective, hover-scale and is-reversed to the surface', async () => {
    const el = await tilt(
      html`<moul-tilt max-tilt="20" perspective="600" hover-scale="1.1" is-reversed></moul-tilt>`,
    )
    const style = surface(el).style
    expect(style.getPropertyValue('--_tilt-max')).toBe('20')
    expect(style.getPropertyValue('--_tilt-perspective')).toBe('600px')
    expect(style.getPropertyValue('--_tilt-scale')).toBe('1.1')
    expect(style.getPropertyValue('--_tilt-direction')).toBe('-1')
  })

  it('keeps max-tilt within 0 to 45 degrees and falls back on bad numbers', async () => {
    const el = await tilt(
      html`<moul-tilt max-tilt="90" perspective="-5" hover-scale="nope"></moul-tilt>`,
    )
    expect(el.maxTilt).toBe(45)
    expect(el.perspective).toBe(1000)
    expect(el.hoverScale).toBe(1.03)
    el.maxTilt = Number.NaN
    await el.updateComplete
    expect(el.maxTilt).toBe(10)
  })

  it('renders a glare layer with glare, hidden from assistive technology', async () => {
    const el = await tilt(html`<moul-tilt glare></moul-tilt>`)
    const glare = el.shadowRoot?.querySelector('[part="glare"]')
    expect(glare).not.toBeNull()
    expect(glare?.getAttribute('aria-hidden')).toBe('true')
    const css = tiltStyles.cssText
    // The glare inherits the pointer position explicitly; nothing else does.
    expect(css).toContain('--_tilt-pointer-ratio-x: inherit')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role, so the content is reached as usual', async () => {
      const el = await tilt(
        html`<moul-tilt><a href="#card">Open the card</a></moul-tilt>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
      // Focus alone does not tilt it.
      expect(frames.pending).toBe(0)
      expect(el.isTilted).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('stays flat when the user asks for reduced motion', async () => {
      motion.set(true)
      const el = await tilt()
      pointer(el, 'pointermove', 250, 125)
      frames.step(16)
      expect(el.isTilted).toBe(false)
    })

    it('flattens at once when the setting turns on mid-hover', async () => {
      const el = await tilt()
      pointer(el, 'pointermove', 250, 125)
      frames.step(16)
      expect(el.isTilted).toBe(true)
      motion.set(true)
      expect(el.isTilted).toBe(false)
    })

    it('has a stylesheet branch that drops the transform and the glare', () => {
      const css = tiltStyles.cssText
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('transform: none')
      expect(block).toContain('display: none')
    })
  })
})
