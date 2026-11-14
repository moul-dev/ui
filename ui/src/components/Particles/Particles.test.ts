import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './Particles'
import {
  MAX_PARTICLES,
  type MoulParticles,
  POINTER_RADIUS,
  particleCount,
  pointerPush,
  seedParticles,
} from './Particles'

interface Internals {
  particles: Array<{
    x: number
    y: number
    pushX: number
    pushY: number
    age: number
    life: number
  }>
}

const particlesOf = (el: MoulParticles) =>
  (el as unknown as Internals).particles

const canvasOf = (el: MoulParticles): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

/** A 2D context that counts what was drawn, since happy-dom draws nothing. */
function fakeContext() {
  const calls = { drawImage: 0, stroke: 0, lineTo: 0 }
  const gradient = { addColorStop: vi.fn() }
  const context = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(() => {
      calls.lineTo++
    }),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(() => {
      calls.stroke++
    }),
    drawImage: vi.fn(() => {
      calls.drawImage++
    }),
    createRadialGradient: vi.fn(() => gradient),
    getImageData: vi.fn(() => ({ data: [0, 0, 0, 255] })),
  }
  return { context, calls }
}

/** Gives the field a size, as the browser does once it is laid out. */
function show(el: MoulParticles, width = 800, height = 400): void {
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

function pointerAt(el: MoulParticles, x: number, y: number): void {
  el.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX: x,
      clientY: y,
      pointerType: 'mouse',
      bubbles: true,
    }),
  )
}

describe('<moul-particles>', () => {
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
    const el = await fixture<MoulParticles>(
      html`<moul-particles></moul-particles>`,
    )
    expect(customElements.get('moul-particles')).toBeDefined()
    const canvas = canvasOf(el)
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.getAttribute('part')).toBe('canvas')
    expect(el.variant).toBe('particles')
    expect(el.pointer).toBe('repel')
  })

  it('falls back to the defaults for an unknown variant or pointer', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles variant="snow" pointer="grab"></moul-particles>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('particles')
    expect(el.getAttribute('variant')).toBe('particles')
    expect(el.pointer).toBe('repel')
  })

  it('fills the field by area, up to a cap', () => {
    expect(particleCount(800, 400, 3, 360)).toBe(96)
    expect(particleCount(1600, 400, 3, 360)).toBe(192)
    expect(particleCount(4000, 3000, 3, 360)).toBe(360)
    expect(particleCount(0, 400, 3, 360)).toBe(0)
    expect(particleCount(800, 400, Number.NaN, 360)).toBe(0)
  })

  it('pushes away near the pointer and not beyond its reach', () => {
    expect(pointerPush(0, 120, 'repel')).toBeCloseTo(1)
    expect(pointerPush(60, 120, 'repel')).toBeCloseTo(0.25)
    expect(pointerPush(120, 120, 'repel')).toBe(0)
    expect(pointerPush(10, 120, 'none')).toBe(0)
    // Attract pulls from afar but holds a ring clear around the pointer.
    expect(pointerPush(80, 120, 'attract')).toBeLessThan(0)
    expect(pointerPush(10, 120, 'attract')).toBeGreaterThan(0)
  })

  it('lays out the same field for the same seed', () => {
    const a = seedParticles(20, 800, 400, 3)
    const b = seedParticles(20, 800, 400, 3)
    const c = seedParticles(20, 800, 400, 4)
    expect(a.map((p) => [p.x, p.y])).toEqual(b.map((p) => [p.x, p.y]))
    expect(a.map((p) => p.x)).not.toEqual(c.map((p) => p.x))
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(800)
      expect(p.y).toBeLessThan(400)
    }
  })

  it('draws as many particles as its size and density call for, and follows a resize', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles></moul-particles>`,
    )
    show(el)
    expect(el.particleTotal).toBe(96)
    run(frames, 2)
    expect(fake.calls.drawImage).toBeGreaterThanOrEqual(96)
    show(el, 400, 400)
    expect(el.particleTotal).toBe(48)
    el.density = 1
    await el.updateComplete
    expect(el.particleTotal).toBe(16)
  })

  it('caps the count however large the field', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles variant="links" density="50"></moul-particles>`,
    )
    show(el, 2000, 1200)
    expect(el.particleTotal).toBe(MAX_PARTICLES.links)
  })

  it('pushes particles away from the pointer, or draws them in', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles speed="0"></moul-particles>`,
    )
    show(el)
    const [particle] = particlesOf(el)
    particle.x = 420
    particle.y = 200
    pointerAt(el, 400, 200)
    run(frames, 10)
    expect(particle.x).toBeGreaterThan(425)

    el.pointer = 'attract'
    await el.updateComplete
    particle.x = 400 + POINTER_RADIUS * 0.8
    particle.y = 200
    particle.pushX = 0
    particle.pushY = 0
    const start = particle.x
    run(frames, 10, 2000)
    expect(particle.x).toBeLessThan(start)
  })

  it('lets the pointer be with pointer="none"', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles speed="0" pointer="none"></moul-particles>`,
    )
    show(el)
    const [particle] = particlesOf(el)
    particle.x = 420
    particle.y = 200
    pointerAt(el, 400, 200)
    run(frames, 10)
    expect(particle.x).toBe(420)
  })

  it('joins near dots with lines in links', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles variant="links" density="6"></moul-particles>`,
    )
    show(el)
    run(frames, 2)
    expect(fake.calls.stroke).toBeGreaterThan(0)
    expect(fake.calls.lineTo).toBeGreaterThan(0)
  })

  it('lets each sparkle fade out and shine again somewhere else', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles variant="sparkles"></moul-particles>`,
    )
    show(el)
    const [sparkle] = particlesOf(el)
    sparkle.age = sparkle.life - 1
    const before = { x: sparkle.x, y: sparkle.y }
    run(frames, 2)
    expect(sparkle.age).toBeLessThan(100)
    expect([sparkle.x, sparkle.y]).not.toEqual([before.x, before.y])
  })

  it('stops drawing when it leaves the page', async () => {
    const el = await fixture<MoulParticles>(
      html`<moul-particles></moul-particles>`,
    )
    show(el)
    expect(frames.pending).toBeGreaterThan(0)
    el.remove()
    expect(frames.pending).toBe(0)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves wrapped content readable and focusable', async () => {
      const el = await fixture<MoulParticles>(
        html`<moul-particles><a href="#start">Get started</a></moul-particles>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      const slot = el.shadowRoot!.querySelector('slot')!
      const link = slot.assignedElements()[0] as HTMLAnchorElement
      expect(link.tagName).toBe('A')
      link.focus()
      expect(document.activeElement).toBe(link)
    })
  })

  describe('reduced motion', () => {
    it('draws one still frame from the seed and does not loop', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulParticles>(
        html`<moul-particles></moul-particles>`,
      )
      show(el)
      expect(frames.pending).toBe(0)
      expect(fake.calls.drawImage).toBeGreaterThan(0)
      const positions = particlesOf(el).map((p) => [p.x, p.y])
      expect(positions).toEqual(
        seedParticles(96, 800, 400, 1).map((p) => [p.x, p.y]),
      )
    })

    it('no longer moves for the pointer', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulParticles>(
        html`<moul-particles></moul-particles>`,
      )
      show(el)
      const [particle] = particlesOf(el)
      const before = particle.x
      pointerAt(el, particle.x - 5, particle.y)
      run(frames, 5)
      expect(particle.x).toBe(before)
    })

    it('swaps the moving field for the still one when turned on mid-way', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulParticles>(
        html`<moul-particles></moul-particles>`,
      )
      show(el)
      expect(frames.pending).toBeGreaterThan(0)
      motion.set(true)
      expect(frames.pending).toBe(0)
    })
  })
})
