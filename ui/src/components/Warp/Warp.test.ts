import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './Warp'
import {
  BOOST_FACTOR,
  easeToward,
  MAX_STREAKS,
  type MoulWarp,
  parseBoost,
  project,
  streakCount,
} from './Warp'

interface Internals {
  pace: number
  streaks: Array<{ x: number; y: number; z: number }>
  beams: Array<{ z: number }>
}

const internals = (el: MoulWarp) => el as unknown as Internals

const canvasOf = (el: MoulWarp): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

function fakeContext() {
  const calls = { stroke: 0, strokeRect: 0, drawImage: 0, lineTo: 0 }
  const gradient = { addColorStop: vi.fn() }
  const context = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    globalCompositeOperation: 'source-over',
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(() => {
      calls.lineTo++
    }),
    stroke: vi.fn(() => {
      calls.stroke++
    }),
    strokeRect: vi.fn(() => {
      calls.strokeRect++
    }),
    drawImage: vi.fn(() => {
      calls.drawImage++
    }),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    getImageData: vi.fn(() => ({ data: [0, 0, 0, 255] })),
  }
  return { context, calls }
}

function show(el: MoulWarp, width = 800, height = 400): void {
  triggerResize(el, { width, height })
  triggerResize(canvasOf(el), { width, height })
}

function run(frames: ManualFrames, count: number, start = 1000): number {
  let time = start
  for (let i = 0; i < count; i++) {
    time += 16
    frames.step(time)
  }
  return time
}

const pointer = (type: string, x = 400, y = 200) =>
  new PointerEvent(type, {
    clientX: x,
    clientY: y,
    pointerType: 'mouse',
    bubbles: true,
  })

describe('<moul-warp>', () => {
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

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulWarp>(html`<moul-warp></moul-warp>`)
    expect(customElements.get('moul-warp')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(el.variant).toBe('streaks')
    expect(el.boost).toBe('none')
  })

  it('falls back to streaks for an unknown variant, and to no boost', async () => {
    const el = await fixture<MoulWarp>(
      html`<moul-warp variant="tube"></moul-warp>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('streaks')
    expect(parseBoost('hover')).toBe('hover')
    expect(parseBoost('press')).toBe('press')
    expect(parseBoost('always')).toBe('none')
  })

  it('projects nearer points further from the vanishing point', () => {
    const far = project(0.2, 0.1, 1, 400, 200, 400)
    const near = project(0.2, 0.1, 0.25, 400, 200, 400)
    expect(far).toEqual({ x: 480, y: 240 })
    expect(near.x - 400).toBeCloseTo((far.x - 400) * 4)
    expect(near.y - 200).toBeCloseTo((far.y - 200) * 4)
  })

  it('fills the field by area, up to a cap', () => {
    expect(streakCount(800, 400, 9)).toBe(288)
    expect(streakCount(4000, 4000, 9)).toBe(MAX_STREAKS)
    expect(streakCount(800, 0, 9)).toBe(0)
  })

  it('eases toward a new speed rather than jumping', () => {
    const step = easeToward(1, BOOST_FACTOR, 16)
    expect(step).toBeGreaterThan(1)
    expect(step).toBeLessThan(1.5)
    expect(easeToward(1, BOOST_FACTOR, 2000)).toBeCloseTo(BOOST_FACTOR, 1)
    expect(easeToward(3, 3, 16)).toBe(3)
    expect(easeToward(2, 5, 0)).toBe(2)
  })

  it('flies streaks toward the viewer in four strokes a frame', async () => {
    const el = await fixture<MoulWarp>(html`<moul-warp></moul-warp>`)
    show(el)
    expect(el.streakTotal).toBe(288)
    const depths = internals(el).streaks.map((s) => s.z)
    run(frames, 3)
    expect(internals(el).streaks[0].z).toBeLessThan(depths[0])
    fake.calls.stroke = 0
    frames.step(2000)
    expect(fake.calls.stroke).toBeLessThanOrEqual(4)
    expect(fake.calls.lineTo).toBeGreaterThanOrEqual(288)
  })

  it('draws a tunnel of rails, rings and beams in the grid', async () => {
    const el = await fixture<MoulWarp>(
      html`<moul-warp variant="grid"></moul-warp>`,
    )
    show(el)
    run(frames, 3)
    expect(el.streakTotal).toBe(0)
    expect(fake.calls.strokeRect).toBeGreaterThan(5)
    expect(fake.calls.drawImage).toBeGreaterThan(0)
    const beam = internals(el).beams[0]
    const z = beam.z
    run(frames, 3, 2000)
    expect(internals(el).beams[0] === beam ? beam.z : 0).toBeLessThan(z)
  })

  it('speeds up while the pointer is over it with boost="hover", and eases back after', async () => {
    const el = await fixture<MoulWarp>(
      html`<moul-warp boost="hover"></moul-warp>`,
    )
    show(el)
    expect(el.isBoosted).toBe(false)
    el.dispatchEvent(pointer('pointermove'))
    expect(el.isBoosted).toBe(true)
    let time = run(frames, 40)
    expect(internals(el).pace).toBeGreaterThan(BOOST_FACTOR * 0.8)
    el.dispatchEvent(pointer('pointerleave'))
    expect(el.isBoosted).toBe(false)
    time = run(frames, 5, time)
    expect(internals(el).pace).toBeGreaterThan(1.5)
    run(frames, 60, time)
    expect(internals(el).pace).toBeLessThan(1.1)
  })

  it('speeds up only while pressed with boost="press"', async () => {
    const el = await fixture<MoulWarp>(
      html`<moul-warp boost="press"></moul-warp>`,
    )
    show(el)
    el.dispatchEvent(pointer('pointermove'))
    expect(el.isBoosted).toBe(false)
    el.dispatchEvent(pointer('pointerdown'))
    expect(el.isBoosted).toBe(true)
    window.dispatchEvent(pointer('pointerup'))
    expect(el.isBoosted).toBe(false)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves wrapped content readable and focusable', async () => {
      const el = await fixture<MoulWarp>(
        html`<moul-warp boost="hover"><button>Deploy</button></moul-warp>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      const button = el.querySelector('button')!
      button.focus()
      expect(document.activeElement).toBe(button)
      const slot = el.shadowRoot!.querySelector('slot')!
      expect(slot.assignedElements()[0]).toBe(button)
    })
  })

  describe('reduced motion', () => {
    it('draws one still frame of short streaks and does not loop', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulWarp>(html`<moul-warp></moul-warp>`)
      show(el)
      expect(frames.pending).toBe(0)
      expect(fake.calls.stroke).toBeGreaterThan(0)
      const depths = internals(el).streaks.map((s) => s.z)
      run(frames, 5)
      expect(internals(el).streaks.map((s) => s.z)).toEqual(depths)
    })

    it('does not boost', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulWarp>(
        html`<moul-warp boost="hover" variant="grid"></moul-warp>`,
      )
      show(el)
      el.dispatchEvent(pointer('pointermove'))
      run(frames, 20)
      expect(internals(el).pace).toBe(1)
      expect(frames.pending).toBe(0)
    })
  })
})
