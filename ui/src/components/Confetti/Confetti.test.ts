import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import { fireConfetti, type MoulConfetti } from './Confetti'

interface Internals {
  particles: Array<{ x: number; y: number; color: string; rocket?: unknown }>
}

const particles = (el: MoulConfetti) => (el as unknown as Internals).particles

const canvasOf = (el: MoulConfetti): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

/** A 2D context that records what was filled, since happy-dom draws nothing. */
function fakeContext() {
  const fills: string[] = []
  const context = {
    fillStyle: '',
    globalAlpha: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(function (this: { fillStyle: string }) {
      fills.push(this.fillStyle)
    }),
    fillRect: vi.fn(function (this: { fillStyle: string }) {
      fills.push(this.fillStyle)
    }),
  }
  return { context, fills }
}

/** Gives the canvas the viewport's size, as the browser does once it is shown. */
function showCanvas(el: MoulConfetti): void {
  triggerResize(canvasOf(el), { width: 800, height: 600 })
}

/** Runs `count` frames 100 ms apart, the longest step the loop takes. */
function run(frames: ManualFrames, count: number, start = 1000): number {
  let time = start
  for (let i = 0; i < count; i++) {
    time += 100
    frames.step(time)
  }
  return time
}

describe('<moul-confetti>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock | null = null
  let fake: ReturnType<typeof fakeContext>

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

  it('is registered with a hidden, inert canvas and no work while idle', async () => {
    const el = await fixture<MoulConfetti>(
      html`<moul-confetti></moul-confetti>`,
    )
    expect(customElements.get('moul-confetti')).toBeDefined()
    const canvas = canvasOf(el)
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.getAttribute('popover')).toBe('manual')
    expect(canvas.tabIndex).toBe(-1)
    expect(el.hasAttribute('data-active')).toBe(false)
    expect(el.variant).toBe('burst')
    showCanvas(el)
    expect(frames.pending).toBe(0)
  })

  it('throws a burst from an element, and resolves once it has fallen away', async () => {
    const el = await fixture<MoulConfetti>(
      html`<moul-confetti><button>Pay</button></moul-confetti>`,
    )
    const button = el.querySelector('button')!
    button.getBoundingClientRect = () =>
      ({ left: 100, top: 400, width: 80, height: 40 }) as DOMRect

    let settled = false
    const done = el
      .fire({ origin: button, count: 30, colors: ['red', 'blue'] })
      .then(() => {
        settled = true
      })
    await el.updateComplete
    await Promise.resolve()
    expect(el.hasAttribute('data-active')).toBe(true)
    expect(canvasOf(el).matches(':popover-open')).toBe(true)
    expect(particles(el)).toHaveLength(30)
    expect(particles(el)[0]).toMatchObject({ x: 140, y: 420 })

    showCanvas(el)
    let time = run(frames, 3)
    // Thrown upward from the button, in the colours given.
    expect(Math.min(...particles(el).map((p) => p.y))).toBeLessThan(420)
    expect(new Set(fake.fills)).toEqual(new Set(['red', 'blue']))
    expect(settled).toBe(false)

    time = run(frames, 50, time)
    await done
    expect(particles(el)).toHaveLength(0)
    expect(el.hasAttribute('data-active')).toBe(false)
    expect(canvasOf(el).matches(':popover-open')).toBe(false)
    // The loop stopped with the last piece.
    expect(frames.pending).toBe(0)
  })

  it('launches a rocket that bursts at the top of its flight', async () => {
    const el = await fixture<MoulConfetti>(
      html`<moul-confetti variant="rocket"></moul-confetti>`,
    )
    const done = el.fire({ origin: { x: 400, y: 500 }, count: 20 })
    await el.updateComplete
    await Promise.resolve()
    showCanvas(el)
    expect(particles(el)).toHaveLength(1)
    expect(particles(el)[0].rocket).toBeDefined()

    let time = run(frames, 3)
    const rocket = particles(el)[0]
    expect(rocket.y).toBeLessThan(500)

    time = run(frames, 6, time)
    expect(particles(el)).toHaveLength(20)
    expect(particles(el).every((p) => p.rocket === undefined)).toBe(true)

    run(frames, 50, time)
    await done
    expect(el.hasAttribute('data-active')).toBe(false)
  })

  it('fireConfetti() creates one shared element and reuses it', async () => {
    const first = fireConfetti({ count: 5, origin: { x: 10, y: 10 } })
    const second = fireConfetti({ count: 5, origin: { x: 10, y: 10 } })
    const all = document.body.querySelectorAll('moul-confetti')
    expect(all).toHaveLength(1)
    const el = all[0] as MoulConfetti
    await el.updateComplete
    await Promise.resolve()
    showCanvas(el)
    run(frames, 60)
    await Promise.all([first, second])
    el.remove()
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves wrapped content alone', async () => {
      const el = await fixture<MoulConfetti>(
        html`<moul-confetti><button>Pay</button></moul-confetti>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      const slot = el.shadowRoot!.querySelector('slot')!
      expect(slot.assignedElements()[0]?.tagName).toBe('BUTTON')
    })
  })

  describe('reduced motion', () => {
    it('draws nothing and resolves at once', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulConfetti>(
        html`<moul-confetti></moul-confetti>`,
      )
      await el.fire({ count: 40 })
      expect(particles(el)).toHaveLength(0)
      expect(el.hasAttribute('data-active')).toBe(false)
      expect(fake.fills).toHaveLength(0)
    })

    it('clears confetti in flight when reduced motion is turned on', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulConfetti>(
        html`<moul-confetti></moul-confetti>`,
      )
      const done = el.fire({ count: 40, origin: { x: 100, y: 100 } })
      await el.updateComplete
      await Promise.resolve()
      showCanvas(el)
      run(frames, 2)
      expect(particles(el)).toHaveLength(40)

      motion.set(true)
      await done
      expect(particles(el)).toHaveLength(0)
      expect(el.hasAttribute('data-active')).toBe(false)
    })
  })
})
