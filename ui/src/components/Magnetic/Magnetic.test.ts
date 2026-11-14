import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Magnetic'
import { type MoulMagnetic, magneticOffset } from './Magnetic'
import { magneticStyles } from './Magnetic.styles'

const body = (el: MoulMagnetic) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="body"]') as HTMLElement
const drift = (el: MoulMagnetic) => [
  body(el).style.getPropertyValue('--magnetic-x'),
  body(el).style.getPropertyValue('--magnetic-y'),
]

/** A 100 × 40 button whose top-left corner is at (200, 200). */
function place(el: HTMLElement): void {
  el.getBoundingClientRect = () =>
    ({
      left: 200,
      top: 200,
      width: 100,
      height: 40,
      right: 300,
      bottom: 240,
      x: 200,
      y: 200,
      toJSON: () => ({}),
    }) as DOMRect
}

/** Moves the pointer anywhere on the page. */
function move(clientX: number, clientY: number, pointerType = 'mouse'): void {
  window.dispatchEvent(
    new PointerEvent('pointermove', { clientX, clientY, pointerType }),
  )
}

describe('magneticOffset', () => {
  it('pulls fully over the box, by strength of the distance from its centre', () => {
    const offset = magneticOffset(80, 30, 100, 40, 0.5, 40)
    expect(offset.pull).toBe(1)
    expect(offset.x).toBe(15)
    expect(offset.y).toBe(5)
  })

  it('fades the pull out smoothly over the reach, with no jump at either edge', () => {
    const atEdge = magneticOffset(100, 20, 100, 40, 0.3, 40)
    const halfway = magneticOffset(120, 20, 100, 40, 0.3, 40)
    const almostOut = magneticOffset(139, 20, 100, 40, 0.3, 40)
    const out = magneticOffset(141, 20, 100, 40, 0.3, 40)
    expect(atEdge.pull).toBe(1)
    expect(halfway.pull).toBeCloseTo(0.5)
    expect(almostOut.pull).toBeLessThan(0.01)
    expect(out).toEqual({ x: 0, y: 0, pull: 0 })
  })

  it('measures the reach from the nearest point of the box, corners included', () => {
    // 30px right and 40px below the bottom-right corner: 50px away.
    expect(magneticOffset(130, 80, 100, 40, 0.3, 40).pull).toBe(0)
    expect(magneticOffset(118, 64, 100, 40, 0.3, 40).pull).toBeGreaterThan(0)
  })

  it('pulls only over the box when reach is 0', () => {
    expect(magneticOffset(101, 20, 100, 40, 0.3, 0).pull).toBe(0)
    expect(magneticOffset(99, 20, 100, 40, 0.3, 0).pull).toBe(1)
  })
})

describe('<moul-magnetic>', () => {
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

  async function magnetic(
    markup = html`<moul-magnetic><button>Start</button></moul-magnetic>`,
  ) {
    const el = await fixture<MoulMagnetic>(markup)
    place(el)
    return el
  }

  it('wraps the control in a body, with sensible defaults', async () => {
    const el = await magnetic()
    expect(customElements.get('moul-magnetic')).toBeDefined()
    expect(body(el).querySelector('slot')).not.toBeNull()
    expect(el.strength).toBe(0.3)
    expect(el.reach).toBe(40)
  })

  it('drifts toward a pointer over the control, once per frame', async () => {
    const el = await magnetic()
    move(290, 210)
    move(290, 230)
    expect(frames.pending).toBe(1)
    frames.step(16)
    expect(el.isPulled).toBe(true)
    // 40px right of centre and 10px below it, times 0.3.
    expect(drift(el)).toEqual(['12px', '3px'])
  })

  it('pulls from within reach of the edge, and springs back out of reach', async () => {
    const el = await magnetic()
    move(320, 220)
    frames.step(16)
    expect(el.isPulled).toBe(true)
    expect(Number.parseFloat(drift(el)[0])).toBeGreaterThan(0)
    move(500, 220)
    frames.step(32)
    expect(el.isPulled).toBe(false)
    expect(drift(el)).toEqual(['0px', '0px'])
  })

  it('lets go when the pointer leaves the window', async () => {
    const el = await magnetic()
    move(290, 210)
    frames.step(16)
    expect(el.isPulled).toBe(true)
    document.dispatchEvent(
      new PointerEvent('pointerout', { relatedTarget: null }),
    )
    expect(el.isPulled).toBe(false)
    expect(drift(el)).toEqual(['0px', '0px'])
  })

  it('uses strength and reach, and clamps them', async () => {
    const el = await magnetic(
      html`<moul-magnetic strength="2" reach="-4"><a href="#">Go</a></moul-magnetic>`,
    )
    expect(el.strength).toBe(1)
    expect(el.reach).toBe(40)
    move(300, 240)
    frames.step(16)
    expect(drift(el)).toEqual(['50px', '20px'])
  })

  it('ignores touch', async () => {
    const el = await magnetic()
    move(290, 210, 'touch')
    expect(frames.pending).toBe(0)
    expect(el.isPulled).toBe(false)
  })

  it('writes nothing again while the pointer stays out of reach', async () => {
    const el = await magnetic()
    move(900, 900)
    frames.step(16)
    const before = body(el).getAttribute('style')
    move(950, 900)
    frames.step(32)
    expect(body(el).getAttribute('style')).toBe(before)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; focus goes to the control and nothing moves', async () => {
      const el = await magnetic()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(document.activeElement).toBe(button)
      button.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
      expect(frames.pending).toBe(0)
      expect(el.isPulled).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('stays in place when the user asks for reduced motion', async () => {
      motion.set(true)
      const el = await magnetic()
      move(290, 210)
      frames.step(16)
      expect(el.isPulled).toBe(false)
      expect(drift(el)[0]).not.toBe('12px')
    })

    it('lets go at once when the setting turns on mid-pull', async () => {
      const el = await magnetic()
      move(290, 210)
      frames.step(16)
      expect(el.isPulled).toBe(true)
      motion.set(true)
      expect(el.isPulled).toBe(false)
      expect(drift(el)).toEqual(['0px', '0px'])
    })

    it('has a stylesheet branch that holds the body still', () => {
      const css = magneticStyles.cssText
      const block = css.slice(css.indexOf('@media (prefers-reduced-motion'))
      expect(block).toContain('translate: none')
      expect(block).toContain('transition: none')
    })
  })
})
