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
  emptyParticle,
  launchParticle,
  PRESS_FADE,
  particleAlpha,
  particleGrowth,
  splitColorList,
  splitGlyphs,
  stepParticle,
} from './press-particles-physics'
import './PressParticles'
import type { MoulPressParticles } from './PressParticles'

interface Internals {
  pool: Array<{ x: number; y: number; alive: boolean; glyph: number }>
  aliveCount: number
}

const internals = (el: MoulPressParticles) => el as unknown as Internals
const alive = (el: MoulPressParticles) =>
  internals(el).pool.filter((particle) => particle.alive)
const canvasOf = (el: MoulPressParticles) =>
  el.shadowRoot!.querySelector('canvas')!

/** A 2D context that records every call, since happy-dom draws nothing. */
function fakeContext() {
  const calls: Array<{ name: string; args: unknown[]; fillStyle: unknown }> = []
  const state: Record<string, unknown> = { fillStyle: '', globalAlpha: 1 }
  const context = new Proxy(state, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'getImageData') {
        return () => ({ data: new Uint8ClampedArray(4) })
      }
      return (...args: unknown[]) => {
        calls.push({ name: key, args, fillStyle: target.fillStyle })
      }
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    },
  })
  return { context, calls }
}

/** Runs `count` frames 50 ms apart. */
function run(frames: ManualFrames, count: number, start = 1000): number {
  let time = start
  for (let i = 0; i < count; i++) {
    time += 50
    frames.step(time)
  }
  return time
}

function pointer(
  type: string,
  target: Element,
  init: PointerEventInit = {},
): PointerEvent {
  const event = new PointerEvent(type, {
    bubbles: true,
    composed: true,
    pointerType: 'mouse',
    button: 0,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}

describe('press particles physics', () => {
  it('throws a particle inside the cone, up for angle 90', () => {
    const particle = emptyParticle()
    const settings = {
      count: 1,
      angle: 90,
      spread: 0,
      velocity: 400,
      size: 8,
      colorCount: 3,
      glyphCount: 0,
    }
    launchParticle(particle, 10, 20, settings, () => 0.5, 4)
    expect(particle).toMatchObject({ x: 10, y: 20, alive: true, color: 1 })
    expect(Math.abs(particle.vx)).toBeLessThan(1e-6)
    expect(particle.vy).toBeLessThan(0)
  })

  it('falls under gravity, fades at the end of its life and pops in at the start', () => {
    const particle = emptyParticle()
    launchParticle(
      particle,
      0,
      0,
      {
        count: 1,
        angle: 90,
        spread: 0,
        velocity: 300,
        size: 8,
        colorCount: 1,
        glyphCount: 0,
      },
      () => 0.5,
      0,
    )
    expect(particleGrowth(particle)).toBe(0)
    const vy = particle.vy
    expect(stepParticle(particle, 0.05, 1200, 1000)).toBe(true)
    expect(particle.vy).toBeGreaterThan(vy)
    expect(particleGrowth(particle)).toBeGreaterThan(0)
    particle.age = particle.life - PRESS_FADE / 2
    expect(particleAlpha(particle)).toBeCloseTo(0.5)
    particle.age = particle.life
    expect(stepParticle(particle, 0.01, 1200, 1000)).toBe(false)
  })

  it('splits glyphs by space or by character, keeping emoji whole', () => {
    expect(splitGlyphs('💖 ✨ 🎉')).toEqual(['💖', '✨', '🎉'])
    expect(splitGlyphs('🎉✨')).toEqual(['🎉', '✨'])
    expect(splitGlyphs('👨‍👩‍👧')).toHaveLength(1)
    expect(splitGlyphs('  ')).toEqual([])
  })

  it('splits a colour list on top-level commas, or reads a JSON array', () => {
    expect(splitColorList('rgb(1, 2, 3), var(--color-accent)')).toEqual([
      'rgb(1, 2, 3)',
      'var(--color-accent)',
    ])
    expect(splitColorList('["red", "blue"]')).toEqual(['red', 'blue'])
    expect(splitColorList('')).toEqual([])
  })
})

describe('<moul-press-particles>', () => {
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
    markup = html`<moul-press-particles><button>Like</button></moul-press-particles>`,
  ) {
    const el = await fixture<MoulPressParticles>(markup)
    const button = el.querySelector('button')!
    button.getBoundingClientRect = () =>
      ({ left: 100, top: 200, width: 80, height: 40 }) as DOMRect
    return { el, button }
  }

  it('is registered with a hidden canvas that waits in a manual popover', async () => {
    const { el } = await make()
    expect(customElements.get('moul-press-particles')).toBeDefined()
    const canvas = canvasOf(el)
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.getAttribute('popover')).toBe('manual')
    expect(el.hasAttribute('data-active')).toBe(false)
    expect(el.count).toBe(14)
    expect(frames.pending).toBe(0)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and leaves the wrapped button its own role', async () => {
      const { el, button } = await make()
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('bursts from the centre of the button on a keyboard press', async () => {
      const { el, button } = await make()
      button.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 0 }),
      )
      await Promise.resolve()
      expect(alive(el)).toHaveLength(14)
      expect(alive(el)[0]).toMatchObject({ x: 140, y: 220 })
      expect(el.hasAttribute('data-active')).toBe(true)
    })

    it('throws nothing from a disabled control', async () => {
      const { el, button } = await make(
        html`<moul-press-particles><button aria-disabled="true">Like</button></moul-press-particles>`,
      )
      pointer('pointerdown', button, { clientX: 5, clientY: 5 })
      button.dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, detail: 0 }),
      )
      await Promise.resolve()
      expect(alive(el)).toHaveLength(0)
    })
  })

  it('bursts from the press point as the pointer goes down, and never blocks the press', async () => {
    const { el, button } = await make(
      html`<moul-press-particles count="6"><button>Like</button></moul-press-particles>`,
    )
    let clicks = 0
    button.addEventListener('click', () => {
      clicks += 1
    })
    const down = pointer('pointerdown', button, { clientX: 30, clientY: 40 })
    expect(down.defaultPrevented).toBe(false)
    await Promise.resolve()
    expect(alive(el)).toHaveLength(6)
    expect(alive(el)[0]).toMatchObject({ x: 30, y: 40 })
    // The pointer's own click (detail 1) does not burst a second time.
    button.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    )
    await Promise.resolve()
    expect(alive(el)).toHaveLength(6)
    expect(clicks).toBe(1)
    // A right click throws nothing.
    pointer('pointerdown', button, { clientX: 30, clientY: 40, button: 2 })
    await Promise.resolve()
    expect(alive(el)).toHaveLength(6)
  })

  it('draws the burst in its colours, then resolves and hides the canvas', async () => {
    const { el } = await make(
      html`<moul-press-particles count="10" colors="red, blue"><button>Like</button></moul-press-particles>`,
    )
    let settled = false
    const done = el.burst({ x: 300, y: 300 }).then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(canvasOf(el).matches(':popover-open')).toBe(true)
    triggerResize(canvasOf(el), { width: 800, height: 600 })
    let time = run(frames, 3)
    expect(fake.calls.some((call) => call.name === 'arc')).toBe(true)
    expect(settled).toBe(false)
    time = run(frames, 60, time)
    await done
    expect(internals(el).aliveCount).toBe(0)
    expect(el.hasAttribute('data-active')).toBe(false)
    expect(canvasOf(el).matches(':popover-open')).toBe(false)
    expect(frames.pending).toBe(0)
  })

  it('draws glyphs from sprites, and stars as paths', async () => {
    const { el } = await make(
      html`<moul-press-particles glyphs="🎉 ✨" count="4"><button>Like</button></moul-press-particles>`,
    )
    void el.burst({ x: 50, y: 50 })
    await Promise.resolve()
    triggerResize(canvasOf(el), { width: 400, height: 300 })
    run(frames, 2)
    expect(fake.calls.some((call) => call.name === 'fillText')).toBe(true)
    expect(fake.calls.some((call) => call.name === 'drawImage')).toBe(true)
    expect(alive(el).every((p) => p.glyph === 0 || p.glyph === 1)).toBe(true)
  })

  it('caps a burst at 120 particles', async () => {
    const { el } = await make(
      html`<moul-press-particles count="5000"><button>Like</button></moul-press-particles>`,
    )
    void el.burst()
    await Promise.resolve()
    expect(alive(el)).toHaveLength(120)
  })

  describe('reduced motion', () => {
    it('throws nothing, and burst() resolves at once', async () => {
      motion = mockReducedMotion(true)
      const { el, button } = await make()
      pointer('pointerdown', button, { clientX: 30, clientY: 40 })
      await el.burst()
      expect(alive(el)).toHaveLength(0)
      expect(el.hasAttribute('data-active')).toBe(false)
    })

    it('clears particles in flight when the setting is turned on', async () => {
      motion = mockReducedMotion(false)
      const { el } = await make()
      const done = el.burst({ x: 10, y: 10 })
      await Promise.resolve()
      expect(alive(el).length).toBeGreaterThan(0)
      motion.set(true)
      await done
      expect(alive(el)).toHaveLength(0)
      expect(el.hasAttribute('data-active')).toBe(false)
    })
  })
})
