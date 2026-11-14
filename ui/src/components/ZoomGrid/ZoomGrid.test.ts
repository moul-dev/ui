import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ZoomGrid'
import {
  layoutTracks,
  type MoulZoomGrid,
  trackTargets,
  zoomFalloff,
} from './ZoomGrid'

/** A 2D context that records every call, for checking what would be drawn. */
function recordingContext(): {
  context: CanvasRenderingContext2D
  calls: Array<[string, unknown[]]>
} {
  const calls: Array<[string, unknown[]]> = []
  const state: Record<string | symbol, unknown> = {}
  const context = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      return (...args: unknown[]) => {
        calls.push([String(key), args])
      }
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  })
  return { context: context as unknown as CanvasRenderingContext2D, calls }
}

/** The width of each box drawn into the recorded context, in drawing order. */
function boxWidths(calls: Array<[string, unknown[]]>): number[] {
  return calls
    .filter(([name]) => name === 'drawImage')
    .map(([, args]) => Number(args[7]))
}

/** Paints one frame with a fake loaded image and the pointer over the top-left box. */
function paintWithPointer(el: MoulZoomGrid): Array<[string, unknown[]]> {
  const grid = el as unknown as {
    image: unknown
    pointer: { state: Record<string, unknown> }
    paint: (frame: unknown) => void
  }
  grid.image = { naturalWidth: 1600, naturalHeight: 1200, src: 'kep.jpg' }
  Object.assign(grid.pointer.state, {
    isInside: true,
    isDown: false,
    pointerType: 'mouse',
    x: 50,
    y: 50,
  })
  const { context, calls } = recordingContext()
  grid.paint({
    context,
    canvas: null,
    width: 400,
    height: 300,
    pixelRatio: 1,
    time: 0,
    delta: 5000,
    frame: 0,
  })
  return calls
}

describe('<moul-zoom-grid>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulZoomGrid>(
      html`<moul-zoom-grid alt="Kep"></moul-zoom-grid>`,
    )
    expect(customElements.get('moul-zoom-grid')).toBeDefined()
    const canvas = el.shadowRoot?.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reserves the image shape from width and height before it loads', async () => {
    const el = await fixture<MoulZoomGrid>(
      html`<moul-zoom-grid alt="Kep" width="1600" height="900"></moul-zoom-grid>`,
    )
    expect(el.style.getPropertyValue('--_ratio')).toBe('1600 / 900')
  })

  describe('layout', () => {
    it('swells along a cosine from the pointer to the radius', () => {
      expect(zoomFalloff(0, 100)).toBe(1)
      expect(zoomFalloff(50, 100)).toBeCloseTo(0.5)
      expect(zoomFalloff(100, 100)).toBe(0)
      expect(zoomFalloff(250, 100)).toBe(0)
      expect(zoomFalloff(10, 0)).toBe(0)
    })

    it('wants every track at rest without a pointer, and the one under it largest', () => {
      const out = new Float32Array(5)
      expect([...trackTargets(5, 500, null, 150, 3, out)]).toEqual([
        1, 1, 1, 1, 1,
      ])
      trackTargets(5, 500, 250, 150, 3, out)
      expect(out[2]).toBe(3)
      expect(out[1]).toBeCloseTo(out[3])
      expect(out[0]).toBeLessThan(out[1])
    })

    it('fills the size exactly, the swollen track taking room from the rest', () => {
      const weights = new Float32Array([1, 3, 1, 1])
      const starts = new Float32Array(4)
      const lengths = new Float32Array(4)
      layoutTracks(weights, 4, 400, 4, starts, lengths)
      const end = starts[3] + lengths[3]
      expect(end).toBeCloseTo(400)
      expect(lengths[1]).toBeCloseTo(lengths[0] * 3)
      expect(starts[1]).toBeCloseTo(lengths[0] + 4)
    })

    it('draws one box per cell, larger near the pointer', async () => {
      const el = await fixture<MoulZoomGrid>(
        html`<moul-zoom-grid alt="Kep" columns="4" rows="3" gap="0"></moul-zoom-grid>`,
      )
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () => recordingContext().context as never,
      )
      const widths = boxWidths(paintWithPointer(el))
      expect(widths).toHaveLength(12)
      expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths) * 1.5)
      expect(widths[0]).toBe(Math.max(...widths))
    })
  })

  describe('keyboard and screen readers', () => {
    it('is one image named by alt, outside the tab order', async () => {
      const el = await fixture<MoulZoomGrid>(
        html`<moul-zoom-grid alt="A palm over a sandy shore"></moul-zoom-grid>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.getAttribute('role')).toBe('img')
      expect(base?.getAttribute('aria-label')).toBe('A palm over a sandy shore')
      expect(el.tabIndex).toBe(-1)
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('hides a decorative image (alt="") from screen readers', async () => {
      const el = await fixture<MoulZoomGrid>(
        html`<moul-zoom-grid alt=""></moul-zoom-grid>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.hasAttribute('role')).toBe(false)
      expect(base?.getAttribute('aria-hidden')).toBe('true')
    })

    it('warns once when an image has no alt text', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = await fixture<MoulZoomGrid>(
        html`<moul-zoom-grid src="/kep.jpg"></moul-zoom-grid>`,
      )
      el.columns = 6
      await el.updateComplete
      const calls = warn.mock.calls.filter(([message]) =>
        String(message).includes('no alt text'),
      )
      expect(calls).toHaveLength(1)
    })
  })

  describe('reduced motion', () => {
    it('draws the plain grid, every box the same size, wherever the pointer is', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulZoomGrid>(
        html`<moul-zoom-grid alt="Kep" columns="4" rows="3" gap="0"></moul-zoom-grid>`,
      )
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () => recordingContext().context as never,
      )
      const widths = boxWidths(paintWithPointer(el))
      expect(widths).toHaveLength(12)
      for (const width of widths) expect(width).toBeCloseTo(100)
    })
  })
})
