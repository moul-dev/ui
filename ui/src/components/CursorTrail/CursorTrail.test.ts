import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import {
  normalizeTrailVariant,
  springStep,
  stampPhase,
  stampsAlong,
} from './cursor-trail-motion'
import './CursorTrail'
import type { MoulCursorTrail } from './CursorTrail'
import { cursorTrailStyles } from './CursorTrail.styles'

const css = cursorTrailStyles.map((sheet) => String(sheet)).join('\n')

interface Internals {
  glyphCount: number
  stamps: unknown[]
  dots: Array<{ x: number; y: number }>
  dotVisibility: number
}
const internals = (el: MoulCursorTrail) => el as unknown as Internals
const canvasOf = (el: MoulCursorTrail) =>
  el.shadowRoot!.querySelector('canvas')!

function fakeContext() {
  const calls: string[] = []
  const state: Record<string, unknown> = { fillStyle: '', globalAlpha: 1 }
  const context = new Proxy(state, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'getImageData') {
        return () => ({ data: new Uint8ClampedArray(4) })
      }
      return () => {
        calls.push(key)
      }
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    },
  })
  return { context, calls }
}

function run(frames: ManualFrames, count: number, start = 1000): number {
  let time = start
  for (let i = 0; i < count; i++) {
    time += 50
    frames.step(time)
  }
  return time
}

function move(el: Element, x: number, y: number, type = 'pointermove') {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerType: 'mouse',
    }),
  )
}

describe('cursor trail motion', () => {
  it('stamps evenly along a segment and carries the rest over', () => {
    const first = stampsAlong({ x: 0, y: 0 }, { x: 25, y: 0 }, 10, 0)
    expect(first.points).toEqual([
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ])
    expect(first.carried).toBeCloseTo(5)
    const next = stampsAlong(
      { x: 25, y: 0 },
      { x: 31, y: 0 },
      10,
      first.carried,
    )
    expect(next.points).toEqual([{ x: 30, y: 0 }])
    // A long flick is capped, and carries nothing over.
    const flick = stampsAlong({ x: 0, y: 0 }, { x: 1000, y: 0 }, 10, 0, 4)
    expect(flick.points).toHaveLength(4)
    expect(flick.carried).toBe(0)
  })

  it('pulls a spring toward its target and settles there', () => {
    const state = { x: 0, y: 0, vx: 0, vy: 0 }
    for (let i = 0; i < 60; i++) springStep(state, { x: 100, y: 50 }, 1 / 60)
    expect(state.x).toBeCloseTo(100, 0)
    expect(state.y).toBeCloseTo(50, 0)
  })

  it('pops a stamp up, holds it, then lets it fall and fade', () => {
    expect(stampPhase(0, 1.4, 0.3).scale).toBe(0)
    const held = stampPhase(0.2, 1.4, 0.3)
    expect(held.scale).toBeCloseTo(1)
    expect(held.isFalling).toBe(false)
    expect(held.alpha).toBe(1)
    const late = stampPhase(1.3, 1.4, 0.3)
    expect(late.isFalling).toBe(true)
    expect(late.alpha).toBeLessThan(0.2)
    expect(normalizeTrailVariant('nope')).toBe('glyphs')
    expect(normalizeTrailVariant('images')).toBe('images')
  })
})

describe('<moul-cursor-trail>', () => {
  let frames: ManualFrames
  let fake: ReturnType<typeof fakeContext>
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    frames = manualAnimationFrames()
    fake = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fake.context as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    frames.restore()
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  async function make(
    markup = html`<moul-cursor-trail><button>Read more</button></moul-cursor-trail>`,
  ) {
    const el = await fixture<MoulCursorTrail>(markup)
    el.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 400,
        height: 200,
        right: 400,
        bottom: 200,
      }) as DOMRect
    triggerResize(canvasOf(el), { width: 400, height: 200 })
    return el
  }

  it('is registered with a canvas over the content that lets clicks through', async () => {
    const el = await make()
    expect(customElements.get('moul-cursor-trail')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(css).toMatch(/canvas\s*{[^}]*pointer-events: none/)
    expect(css).toContain('touch-action: pan-y pinch-zoom')
    expect(el.variant).toBe('glyphs')
    expect(frames.pending).toBe(0)
  })

  it('drops glyphs along the path, draws them, and stops once they have fallen away', async () => {
    const el = await make()
    move(el, 10, 100)
    move(el, 110, 100)
    expect(internals(el).glyphCount).toBeGreaterThan(4)
    expect(frames.pending).toBe(1)
    let time = run(frames, 2)
    expect(fake.calls).toContain('drawImage')
    expect(fake.calls).toContain('fillText')
    time = run(frames, 40, time)
    expect(internals(el).glyphCount).toBe(0)
    expect(frames.pending).toBe(0)
  })

  it('follows the pointer with a chain of dots that fades out on leave', async () => {
    const el = await make(
      html`<moul-cursor-trail variant="dots" count="6"></moul-cursor-trail>`,
    )
    move(el, 50, 50)
    let time = run(frames, 2)
    move(el, 300, 120)
    time = run(frames, 20, time)
    const dots = internals(el).dots
    expect(dots).toHaveLength(6)
    expect(dots[0].x).toBeCloseTo(300, 0)
    expect(internals(el).dotVisibility).toBeGreaterThan(0.9)
    expect(fake.calls).toContain('arc')
    // At rest the loop stops; the next move wakes the chain again.
    time = run(frames, 40, time)
    expect(frames.pending).toBe(0)
    move(el, 100, 40)
    time = run(frames, 20, time)
    expect(internals(el).dots[0].x).toBeCloseTo(100, 0)
    el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    time = run(frames, 40, time)
    expect(internals(el).dotVisibility).toBe(0)
    expect(frames.pending).toBe(0)
  })

  it('stamps the slotted images along the path and keeps them out of the page', async () => {
    const el = await make(html`
      <moul-cursor-trail variant="images" size="40">
        <img slot="image" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
        <p>Places</p>
      </moul-cursor-trail>
    `)
    const image = el.querySelector('img')!
    Object.defineProperty(image, 'complete', { value: true })
    Object.defineProperty(image, 'naturalWidth', { value: 400 })
    Object.defineProperty(image, 'naturalHeight', { value: 300 })
    el.shadowRoot!.querySelector('slot[name="image"]')!.dispatchEvent(
      new Event('slotchange'),
    )
    expect(css).toMatch(/slot\[name='image'\]\s*{\s*display: none/)
    move(el, 0, 100)
    move(el, 200, 100)
    expect(internals(el).stamps.length).toBeGreaterThan(2)
    run(frames, 2)
    expect(fake.calls).toContain('clip')
    expect(fake.calls).toContain('drawImage')
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves the content reachable', async () => {
      const el = await make()
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      const button = el.querySelector('button')!
      button.focus()
      expect(document.activeElement).toBe(button)
      expect(
        el.shadowRoot!.querySelector('.content slot:not([name])'),
      ).not.toBeNull()
    })
  })

  describe('reduced motion', () => {
    it('draws no trail at all', async () => {
      motion = mockReducedMotion(true)
      const el = await make()
      move(el, 10, 100)
      move(el, 200, 100)
      expect(internals(el).glyphCount).toBe(0)
      expect(frames.pending).toBe(0)
    })

    it('clears the trail when the setting is turned on', async () => {
      motion = mockReducedMotion(false)
      const el = await make()
      move(el, 10, 100)
      move(el, 200, 100)
      expect(internals(el).glyphCount).toBeGreaterThan(0)
      motion.set(true)
      expect(internals(el).glyphCount).toBe(0)
      expect(frames.pending).toBe(0)
    })
  })
})
