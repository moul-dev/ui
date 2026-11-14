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
  cellAt,
  dotInfluence,
  gridLayout,
  normalizeGridVariant,
  RIPPLE_SPEED,
  rippleLifetime,
  rippleStrength,
  splitColors,
  tileMask,
} from './interactive-grid-geometry'
import './InteractiveGrid'
import type { MoulInteractiveGrid } from './InteractiveGrid'
import { interactiveGridStyles } from './InteractiveGrid.styles'

const css = interactiveGridStyles.map((sheet) => String(sheet)).join('\n')

interface Internals {
  intensity: Float32Array
  active: number[]
  ripples: unknown[]
  layout: { columns: number; rows: number; cell: number }
}
const internals = (el: MoulInteractiveGrid) => el as unknown as Internals
const canvasOf = (el: MoulInteractiveGrid) =>
  el.shadowRoot!.querySelector('canvas')!

function fakeContext() {
  const calls: Array<{ name: string; fillStyle: unknown }> = []
  const state: Record<string, unknown> = { fillStyle: '', globalAlpha: 1 }
  const context = new Proxy(state, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'getImageData') {
        return () => ({ data: new Uint8ClampedArray(4) })
      }
      return () => {
        calls.push({ name: key, fillStyle: target.fillStyle })
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

function pointer(el: Element, type: string, x: number, y: number) {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerType: 'mouse',
      button: 0,
    }),
  )
}

describe('interactive grid geometry', () => {
  it('covers the box with whole cells and finds the cell under a point', () => {
    const layout = gridLayout(100, 50, 40)
    expect(layout).toEqual({ columns: 3, rows: 2, cell: 40 })
    expect(cellAt(layout, 0, 0)).toBe(0)
    expect(cellAt(layout, 85, 45)).toBe(5)
    expect(cellAt(layout, -1, 10)).toBe(-1)
    expect(cellAt(layout, 130, 10)).toBe(-1)
  })

  it('lights a ring travelling outward that fades as it spreads', () => {
    const lifetime = 2
    const age = 0.5
    const front = age * RIPPLE_SPEED
    expect(rippleStrength(front, age, 40, lifetime)).toBeCloseTo(0.75)
    expect(rippleStrength(front + 200, age, 40, lifetime)).toBe(0)
    expect(rippleStrength(front, 1.5, 40, lifetime)).toBeLessThan(0.75)
    expect(rippleStrength(front, 3, 40, lifetime)).toBe(0)
    // Long enough to cross the far corner.
    expect(rippleLifetime(0, 0, 560, 0, 40) * RIPPLE_SPEED).toBeGreaterThan(560)
  })

  it('pulls dots smoothly within the radius', () => {
    expect(dotInfluence(0, 100)).toBe(1)
    expect(dotInfluence(50, 100)).toBeCloseTo(0.5)
    expect(dotInfluence(100, 100)).toBe(0)
    expect(dotInfluence(10, 0)).toBe(0)
  })

  it('builds a rounded tile mask and reads colour lists', () => {
    const mask = tileMask(40, 6)
    expect(mask.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(decodeURIComponent(mask)).toContain("width='34'")
    expect(decodeURIComponent(mask)).not.toMatch(/fill=/)
    expect(splitColors('rgb(1, 2, 3), red')).toEqual(['rgb(1, 2, 3)', 'red'])
    expect(normalizeGridVariant('nope')).toBe('highlight')
    expect(normalizeGridVariant('dots')).toBe('dots')
  })
})

describe('<moul-interactive-grid>', () => {
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
    markup = html`<moul-interactive-grid><h2>Hello</h2></moul-interactive-grid>`,
  ) {
    const el = await fixture<MoulInteractiveGrid>(markup)
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

  it('is registered with a CSS pattern and a canvas, both hidden from screen readers', async () => {
    const el = await make()
    expect(customElements.get('moul-interactive-grid')).toBeDefined()
    const grid = el.shadowRoot!.querySelector('.grid')!
    expect(grid.getAttribute('aria-hidden')).toBe('true')
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    const pattern = el.shadowRoot!.querySelector<HTMLElement>('.pattern')!
    expect(pattern.style.getPropertyValue('--_cell')).toBe('40px')
    expect(internals(el).layout).toEqual({ columns: 10, rows: 5, cell: 40 })
    expect(frames.pending).toBe(0)
  })

  it('turns lines into tiles with a gap, and uses smaller cells for dots', async () => {
    const tiles = await make(
      html`<moul-interactive-grid gap="6" cell-size="48"></moul-interactive-grid>`,
    )
    const pattern = tiles.shadowRoot!.querySelector<HTMLElement>('.pattern')!
    expect(pattern.classList.contains('tiles')).toBe(true)
    expect(pattern.style.getPropertyValue('--_tile-mask')).toContain('svg')
    const dots = await make(
      html`<moul-interactive-grid variant="dots"></moul-interactive-grid>`,
    )
    expect(
      dots
        .shadowRoot!.querySelector<HTMLElement>('.pattern')!
        .style.getPropertyValue('--_cell'),
    ).toBe('20px')
    expect(css).toContain(":host([fade='radial']) .grid")
  })

  it('lights the cell under the pointer and fades it after the pointer leaves', async () => {
    const el = await make(
      html`<moul-interactive-grid colors="red"></moul-interactive-grid>`,
    )
    pointer(el, 'pointermove', 50, 50)
    let time = run(frames, 1)
    const cell = 1 * 10 + 1
    expect(internals(el).intensity[cell]).toBe(1)
    expect(fake.calls.some((call) => call.name === 'fillRect')).toBe(true)
    // Resting on one cell draws no more frames.
    time = run(frames, 2, time)
    expect(frames.pending).toBe(0)
    el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    time = run(frames, 2, time)
    expect(internals(el).intensity[cell]).toBeLessThan(1)
    expect(internals(el).intensity[cell]).toBeGreaterThan(0)
    run(frames, 30, time)
    expect(internals(el).active).toHaveLength(0)
    expect(frames.pending).toBe(0)
  })

  it('sends a ripple through the cells from a press', async () => {
    const el = await make(
      html`<moul-interactive-grid variant="ripple"></moul-interactive-grid>`,
    )
    pointer(el, 'pointerdown', 20, 20)
    expect(internals(el).ripples).toHaveLength(1)
    let time = run(frames, 4)
    const lit = internals(el).active.length
    expect(lit).toBeGreaterThan(3)
    time = run(frames, 40, time)
    expect(internals(el).ripples).toHaveLength(0)
    expect(internals(el).active).toHaveLength(0)
    expect(frames.pending).toBe(0)
  })

  it('swells the dots near the pointer, most under it', async () => {
    const el = await make(
      html`<moul-interactive-grid variant="dots" radius="80"></moul-interactive-grid>`,
    )
    pointer(el, 'pointermove', 110, 110)
    run(frames, 20)
    const { intensity, layout } = internals(el)
    const under = 5 * layout.columns + 5
    const near = 5 * layout.columns + 7
    const far = 0
    expect(intensity[under]).toBeGreaterThan(intensity[near])
    expect(intensity[near]).toBeGreaterThan(0)
    expect(intensity[far]).toBe(0)
    expect(fake.calls.some((call) => call.name === 'arc')).toBe(true)
  })

  describe('keyboard and screen readers', () => {
    it('stays out of the tab order and keeps its content in front', async () => {
      const el = await make(
        html`<moul-interactive-grid><a href="#start">Start</a></moul-interactive-grid>`,
      )
      expect(el.tabIndex).toBe(-1)
      expect(el.hasAttribute('role')).toBe(false)
      const link = el.querySelector('a')!
      link.focus()
      expect(document.activeElement).toBe(link)
      expect(css).toMatch(/\.grid\s*{[^}]*z-index: -1/)
      expect(css).toMatch(/\.grid\s*{[^}]*pointer-events: none/)
    })
  })

  describe('reduced motion', () => {
    it('keeps the grid still: nothing lights up or ripples', async () => {
      motion = mockReducedMotion(true)
      const el = await make(
        html`<moul-interactive-grid variant="ripple"></moul-interactive-grid>`,
      )
      pointer(el, 'pointermove', 50, 50)
      pointer(el, 'pointerdown', 50, 50)
      expect(internals(el).ripples).toHaveLength(0)
      expect(frames.pending).toBe(0)
      expect(internals(el).active).toHaveLength(0)
    })

    it('clears lit cells when the setting is turned on', async () => {
      motion = mockReducedMotion(false)
      const el = await make()
      pointer(el, 'pointermove', 50, 50)
      run(frames, 1)
      expect(internals(el).active.length).toBeGreaterThan(0)
      motion.set(true)
      expect(internals(el).active).toHaveLength(0)
      expect(frames.pending).toBe(0)
    })
  })
})
