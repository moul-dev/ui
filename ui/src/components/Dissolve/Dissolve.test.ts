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
  type ItemColors,
  particleColor,
  sampleItemColors,
} from './dissolve-colors'
import {
  bandPoint,
  MAX_DISSOLVE_PARTICLES,
  maskDirection,
  normalizeDirection,
  particleBudget,
  sweepProgress,
  sweepVector,
  uncoveredBand,
} from './dissolve-sweep'
import './Dissolve'
import type { MoulDissolve } from './Dissolve'
import { dissolveStyles } from './Dissolve.styles'

const css = dissolveStyles.map((sheet) => String(sheet)).join('\n')

interface Internals {
  run: { particles: { count: number } } | null
}

const canvasOf = (el: MoulDissolve) => el.shadowRoot!.querySelector('canvas')!

function fakeContext() {
  const calls: string[] = []
  const state: Record<string, unknown> = { fillStyle: '', globalAlpha: 1 }
  const context = new Proxy(state, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'getImageData') {
        return () => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) })
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

describe('dissolve geometry', () => {
  it('eases the sweep from 0 to 1 over the duration', () => {
    expect(sweepProgress(0, 900)).toBe(0)
    expect(sweepProgress(450, 900)).toBeCloseTo(0.5)
    expect(sweepProgress(900, 900)).toBe(1)
    expect(sweepProgress(5000, 900)).toBe(1)
    expect(sweepProgress(10, 0)).toBe(1)
    expect(sweepProgress(100, 900)).toBeLessThan(100 / 900)
  })

  it('finds the strip the edge uncovered between two frames', () => {
    const [start, end] = uncoveredBand(0.4, 0.5)
    expect(start).toBeCloseTo(0.4 * 1.2 - 0.1)
    expect(end).toBeCloseTo(0.5 * 1.2 - 0.1)
    expect(uncoveredBand(0, 0)).toEqual([0, 0])
    expect(uncoveredBand(0, 1)).toEqual([0, 1])
  })

  it('sheds particles by area, up to a cap', () => {
    expect(particleBudget(100, 26)).toBe(100)
    expect(particleBudget(4000, 4000)).toBe(MAX_DISSOLVE_PARTICLES)
    expect(particleBudget(0, 50)).toBe(0)
  })

  it('maps the sweep to the box and the mask for each direction', () => {
    expect(bandPoint('right', 0.25, 0.5, 200, 100)).toEqual({ x: 50, y: 50 })
    expect(bandPoint('left', 0.25, 0.5, 200, 100)).toEqual({ x: 150, y: 50 })
    expect(bandPoint('up', 0.25, 0.5, 200, 100)).toEqual({ x: 100, y: 75 })
    expect(bandPoint('down', 0.25, 0.5, 200, 100)).toEqual({ x: 100, y: 25 })
    expect(sweepVector('up')).toEqual({ x: 0, y: -1 })
    expect(maskDirection('left')).toBe('to left')
    expect(normalizeDirection('sideways')).toBe('right')
    expect(normalizeDirection('down')).toBe('down')
  })

  it('picks mostly the background a grain leaves from, sometimes the text', () => {
    const sample: ItemColors = {
      colors: ['bg', 'ink'],
      columns: 2,
      rows: 1,
      backgrounds: new Int16Array([0, -1]),
      texts: new Int16Array([1, 1]),
    }
    expect(particleColor(sample, 10, 5, 100, 10, 0.1)).toBe(0)
    expect(particleColor(sample, 10, 5, 100, 10, 0.9)).toBe(1)
    // No background on the right half: the text colour.
    expect(particleColor(sample, 90, 5, 100, 10, 0.1)).toBe(1)
  })

  it('falls back to the first child when a point cannot be read', () => {
    const host = document.createElement('div')
    const child = document.createElement('p')
    child.style.color = 'red'
    host.append(child)
    document.body.append(host)
    const sample = sampleItemColors(host, {
      left: -500,
      top: -500,
      width: 100,
      height: 40,
    } as DOMRect)
    expect(sample.columns).toBe(5)
    expect(sample.rows).toBe(2)
    expect(sample.texts.every((index) => index === 0)).toBe(true)
    host.remove()
  })
})

describe('<moul-dissolve>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock | null = null

  beforeEach(() => {
    frames = manualAnimationFrames()
    const fake = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => fake.context as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    frames.restore()
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  async function make(
    markup = html`<moul-dissolve><div class="row">Row</div></moul-dissolve>`,
  ) {
    const el = await fixture<MoulDissolve>(markup)
    el.getBoundingClientRect = () =>
      ({ left: 20, top: 30, width: 260, height: 52 }) as DOMRect
    return el
  }

  /** Lets `dissolve()` reach its first frame, with a canvas the size of the viewport. */
  async function started(el: MoulDissolve): Promise<void> {
    await el.updateComplete
    await Promise.resolve()
    await Promise.resolve()
    triggerResize(canvasOf(el), { width: 800, height: 600 })
  }

  it('is registered with its content in a masked wrapper and a hidden canvas', async () => {
    const el = await make()
    expect(customElements.get('moul-dissolve')).toBeDefined()
    expect(el.shadowRoot!.querySelector('[part="content"] slot')).not.toBeNull()
    const canvas = canvasOf(el)
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.getAttribute('popover')).toBe('manual')
    expect(el.direction).toBe('right')
    expect(el.isDissolved).toBe(false)
  })

  it('normalises an unknown direction and masks toward the one set', async () => {
    const el = await make(
      html`<moul-dissolve direction="sideways"><div>Row</div></moul-dissolve>`,
    )
    await el.updateComplete
    expect(el.direction).toBe('right')
    expect(css).toContain(":host([direction='up'])")
    expect(css).toContain('--_dissolve-to: to top')
  })

  it('wipes the item away, sheds dust, then resolves, fires dissolveend and stays gone', async () => {
    const el = await make()
    const ended = vi.fn()
    el.addEventListener('dissolveend', ended)
    let settled = false
    const done = el.dissolve().then(() => {
      settled = true
    })
    expect(el.dissolve()).toBe(el.dissolve())
    await started(el)
    expect(el.inert).toBe(true)
    expect(el.hasAttribute('data-dissolving')).toBe(true)
    expect(canvasOf(el).matches(':popover-open')).toBe(true)

    let time = run(frames, 8)
    const content = el.shadowRoot!.querySelector<HTMLElement>('.content')!
    const progress = Number(content.style.getPropertyValue('--_dissolve'))
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(1)
    expect(
      (el as unknown as Internals).run?.particles.count ?? 0,
    ).toBeGreaterThan(0)
    expect(settled).toBe(false)

    time = run(frames, 60, time)
    await done
    expect(ended).toHaveBeenCalledTimes(1)
    expect(el.isDissolved).toBe(true)
    expect(el.hasAttribute('data-dissolving')).toBe(false)
    expect(canvasOf(el).matches(':popover-open')).toBe(false)
    expect(frames.pending).toBe(0)
    // Calling it again on a dissolved item resolves at once.
    await el.dissolve()
    expect(ended).toHaveBeenCalledTimes(1)
  })

  it('brings the item back with reset(), restoring its inert state', async () => {
    const el = await make()
    const done = el.dissolve()
    await started(el)
    run(frames, 70)
    await done
    expect(el.inert).toBe(true)
    el.reset()
    expect(el.isDissolved).toBe(false)
    expect(el.inert).toBe(false)
    const content = el.shadowRoot!.querySelector<HTMLElement>('.content')!
    expect(content.style.getPropertyValue('--_dissolve')).toBe('')
  })

  it('stops part way on reset(), without firing dissolveend', async () => {
    const el = await make()
    const ended = vi.fn()
    el.addEventListener('dissolveend', ended)
    const done = el.dissolve()
    await started(el)
    run(frames, 4)
    el.reset()
    await done
    expect(ended).not.toHaveBeenCalled()
    expect(el.isDissolved).toBe(false)
    expect(el.inert).toBe(false)
  })

  it('removes itself after dissolveend with remove-on-end, and collapses with collapse', async () => {
    const el = await make(
      html`<moul-dissolve remove-on-end collapse><div>Row</div></moul-dissolve>`,
    )
    const parent = el.parentElement!
    const seen = vi.fn()
    parent.addEventListener('dissolveend', seen)
    const done = el.dissolve()
    await started(el)
    run(frames, 70)
    await done
    expect(seen).toHaveBeenCalledTimes(1)
    expect(el.isConnected).toBe(false)
    expect(css).toContain(':host([is-dissolved][collapse])')
  })

  it('finishes even if no frame ever comes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await make(
      html`<moul-dissolve duration="100"><div>Row</div></moul-dissolve>`,
    )
    const ended = vi.fn()
    el.addEventListener('dissolveend', ended)
    const done = el.dissolve()
    await el.updateComplete
    await Promise.resolve()
    await Promise.resolve()
    vi.advanceTimersByTime(4000)
    await done
    expect(ended).toHaveBeenCalledTimes(1)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and turns the item inert while it goes', async () => {
      const el = await make(
        html`<moul-dissolve><button>Delete</button></moul-dissolve>`,
      )
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      const button = el.querySelector('button')!
      button.focus()
      expect(document.activeElement).toBe(button)
      void el.dissolve()
      await started(el)
      expect(el.inert).toBe(true)
    })
  })

  describe('reduced motion', () => {
    it('fades out with no dust, then resolves and fires dissolveend', async () => {
      motion = mockReducedMotion(true)
      const el = await make()
      const ended = vi.fn()
      el.addEventListener('dissolveend', ended)
      await el.dissolve()
      expect(ended).toHaveBeenCalledTimes(1)
      expect(el.isDissolved).toBe(true)
      expect(el.hasAttribute('data-dissolving')).toBe(false)
      expect(canvasOf(el).matches(':popover-open')).toBe(false)
      expect(frames.pending).toBe(0)
    })

    it('skips to the end when the setting is turned on mid-way', async () => {
      motion = mockReducedMotion(false)
      const el = await make()
      const ended = vi.fn()
      el.addEventListener('dissolveend', ended)
      const done = el.dissolve()
      await started(el)
      run(frames, 3)
      motion.set(true)
      await done
      expect(ended).toHaveBeenCalledTimes(1)
      expect(el.isDissolved).toBe(true)
    })
  })
})
