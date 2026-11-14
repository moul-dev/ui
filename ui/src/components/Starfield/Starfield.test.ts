import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './Starfield'
import {
  DEFAULT_METEORS,
  DEFAULT_SHOOTING_STARS,
  MAX_METEORS,
  MAX_STARS,
  type MoulStarfield,
  meteorDirection,
  meteorsConverter,
  seedStars,
  shootingStarsConverter,
  starCount,
} from './Starfield'

interface Internals {
  stars: Array<{ x: number; y: number; layer: number }>
  meteorList: Array<{ x: number; y: number; dx: number; dy: number }>
}

const internals = (el: MoulStarfield) => el as unknown as Internals

const canvasOf = (el: MoulStarfield): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

function fakeContext() {
  const calls = { drawImage: 0 }
  const gradient = { addColorStop: vi.fn() }
  const context = {
    fillStyle: '',
    globalAlpha: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(() => {
      calls.drawImage++
    }),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    getImageData: vi.fn(() => ({ data: [0, 0, 0, 255] })),
  }
  return { context, calls }
}

function show(el: MoulStarfield, width = 800, height = 400): void {
  triggerResize(canvasOf(el), { width, height })
}

function run(frames: ManualFrames, count: number, step = 16, start = 1000) {
  let time = start
  for (let i = 0; i < count; i++) {
    time += step
    frames.step(time)
  }
  return time
}

describe('<moul-starfield>', () => {
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
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield></moul-starfield>`,
    )
    expect(customElements.get('moul-starfield')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(el.shootingStars).toBe(0)
    expect(el.meteors).toBe(0)
    expect(el.angle).toBe(240)
  })

  it('turns shooting stars and meteors on when written alone, and reads a number', async () => {
    expect(shootingStarsConverter.fromAttribute('')).toBe(
      DEFAULT_SHOOTING_STARS,
    )
    expect(shootingStarsConverter.fromAttribute('12')).toBe(12)
    expect(shootingStarsConverter.fromAttribute(null)).toBe(0)
    expect(meteorsConverter.fromAttribute('')).toBe(DEFAULT_METEORS)
    expect(meteorsConverter.fromAttribute('-3')).toBe(0)
    expect(meteorsConverter.fromAttribute('lots')).toBe(0)
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield shooting-stars meteors="4"></moul-starfield>`,
    )
    expect(el.shootingStars).toBe(DEFAULT_SHOOTING_STARS)
    expect(el.meteors).toBe(4)
  })

  it('fills the sky by area, up to a cap', () => {
    expect(starCount(800, 400, 3.5)).toBe(112)
    expect(starCount(10000, 10000, 3.5)).toBe(MAX_STARS)
    expect(starCount(0, 400, 3.5)).toBe(0)
  })

  it('sends meteors the way the angle points, y down', () => {
    const down = meteorDirection(270)
    expect(down.x).toBeCloseTo(0)
    expect(down.y).toBeCloseTo(1)
    const downLeft = meteorDirection(240)
    expect(downLeft.x).toBeLessThan(0)
    expect(downLeft.y).toBeGreaterThan(0)
    expect(meteorDirection(300).x).toBeGreaterThan(0)
  })

  it('puts most stars far away and a few near', () => {
    const stars = seedStars(1000, 800, 400, 1)
    const near = stars.filter((s) => s.layer === 2).length
    const far = stars.filter((s) => s.layer === 0).length
    expect(far).toBeGreaterThan(500)
    expect(near).toBeGreaterThan(50)
    expect(near).toBeLessThan(160)
    expect(seedStars(10, 800, 400, 1)).toEqual(seedStars(10, 800, 400, 1))
  })

  it('draws its stars and moves them on each frame', async () => {
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield></moul-starfield>`,
    )
    show(el)
    expect(el.counts.stars).toBe(112)
    const first = internals(el).stars[0]
    const x = first.x
    run(frames, 30)
    expect(fake.calls.drawImage).toBeGreaterThan(112)
    expect(first.x).not.toBe(x)
  })

  it('keeps the meteor count, starting each again once it has fallen out of the sky', async () => {
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield meteors="6" angle="270"></moul-starfield>`,
    )
    show(el)
    expect(el.counts.meteors).toBe(6)
    const before = internals(el).meteorList.map((m) => m.y)
    run(frames, 10)
    const after = internals(el).meteorList.map((m) => m.y)
    // Falling straight down.
    expect(after[0]).toBeGreaterThan(before[0])
    expect(internals(el).meteorList[0].dx).toBeCloseTo(0)
    run(frames, 400, 50, 2000)
    expect(el.counts.meteors).toBe(6)
    for (const meteor of internals(el).meteorList) {
      expect(meteor.y).toBeLessThan(400 + 400)
    }
  })

  it('holds the meteors to the cap', async () => {
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield meteors="500"></moul-starfield>`,
    )
    show(el)
    expect(el.counts.meteors).toBe(MAX_METEORS)
  })

  it('sends shooting stars across now and then, a few at a time', async () => {
    const el = await fixture<MoulStarfield>(
      html`<moul-starfield shooting-stars="600"></moul-starfield>`,
    )
    show(el)
    let seen = 0
    let time = 1000
    for (let i = 0; i < 200; i++) {
      time = run(frames, 1, 50, time)
      seen = Math.max(seen, el.counts.shooting)
      expect(el.counts.shooting).toBeLessThanOrEqual(3)
    }
    expect(seen).toBeGreaterThan(0)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves wrapped content readable', async () => {
      const el = await fixture<MoulStarfield>(
        html`<moul-starfield><h2>Ship after dark</h2></moul-starfield>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      const slot = el.shadowRoot!.querySelector('slot')!
      expect(slot.assignedElements()[0]?.textContent).toBe('Ship after dark')
    })
  })

  describe('reduced motion', () => {
    it('draws the sky once, with meteors held in place and no shooting stars', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulStarfield>(
        html`<moul-starfield meteors shooting-stars="600"></moul-starfield>`,
      )
      show(el)
      expect(frames.pending).toBe(0)
      expect(fake.calls.drawImage).toBeGreaterThan(112)
      expect(el.counts.meteors).toBe(DEFAULT_METEORS)
      expect(el.counts.shooting).toBe(0)
      const stars = internals(el).stars.map((s) => [s.x, s.y])
      expect(stars).toEqual(seedStars(112, 800, 400, 1).map((s) => [s.x, s.y]))
    })
  })
})
