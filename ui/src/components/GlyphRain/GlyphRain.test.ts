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
  DEFAULT_GLYPHS,
  type MoulGlyphRain,
  shiftBrightness,
  splitGlyphs,
  trailAlpha,
} from './GlyphRain'

interface Internals {
  heads: Float32Array
  grid: Uint16Array
  columns: number
  rows: number
  glow: number
}

const internals = (el: MoulGlyphRain) => el as unknown as Internals

const canvasOf = (el: MoulGlyphRain): HTMLCanvasElement =>
  el.shadowRoot!.querySelector('canvas')!

/** A 2D context that counts what was drawn, since happy-dom draws nothing. */
function fakeContext() {
  const context = {
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  }
  return context
}

/** Gives the canvas a size, as the browser does once it is laid out. */
function show(el: MoulGlyphRain, width = 320, height = 160): void {
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

describe('<moul-glyph-rain>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock | null = null
  let context: ReturnType<typeof fakeContext>

  beforeEach(() => {
    frames = manualAnimationFrames()
    context = fakeContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => context as unknown as CanvasRenderingContext2D,
    )
  })

  afterEach(() => {
    frames.restore()
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulGlyphRain>(
      html`<moul-glyph-rain></moul-glyph-rain>`,
    )
    expect(customElements.get('moul-glyph-rain')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(canvasOf(el).getAttribute('part')).toBe('canvas')
    expect(el.variant).toBe('rain')
    expect(el.fontSize).toBe(16)
    expect(el.density).toBe(0.7)
    expect(el.speed).toBe(1)
  })

  it('falls back to rain for an unknown variant', async () => {
    const el = await fixture<MoulGlyphRain>(
      html`<moul-glyph-rain variant="storm"></moul-glyph-rain>`,
    )
    await el.updateComplete
    expect(el.variant).toBe('rain')
    expect(el.getAttribute('variant')).toBe('rain')
  })

  describe('glyphs', () => {
    it('keeps each character whole, Khmer clusters and emoji included', () => {
      expect(splitGlyphs('ក្កា01')).toEqual(['ក្កា', '0', '1'])
      expect(splitGlyphs('👍🏽A')).toEqual(['👍🏽', 'A'])
    })

    it('drops repeats and spaces, and falls back to the default set', () => {
      expect(splitGlyphs('a a b')).toEqual(['a', 'b'])
      expect(splitGlyphs('   ')).toEqual(splitGlyphs(DEFAULT_GLYPHS))
      expect(splitGlyphs(null).length).toBeGreaterThan(30)
    })

    it('keeps at most 256 glyphs', () => {
      const many = Array.from({ length: 400 }, (_, i) =>
        String.fromCodePoint(0x4e00 + i),
      ).join('')
      expect(splitGlyphs(many)).toHaveLength(256)
    })
  })

  describe('trail and band', () => {
    it('is brightest at the head and gone past the end of the trail', () => {
      expect(trailAlpha(0, 10)).toBe(1)
      expect(trailAlpha(10, 10)).toBe(0)
      expect(trailAlpha(11, 10)).toBe(0)
      expect(trailAlpha(-1, 10)).toBe(0)
      let previous = 1
      for (let d = 1; d <= 10; d++) {
        const alpha = trailAlpha(d, 10)
        expect(alpha).toBeLessThan(previous)
        previous = alpha
      }
    })

    it('keeps shift brightness between a dim base and full', () => {
      let low = 1
      let high = 0
      for (let x = 0; x < 60; x++) {
        const b = shiftBrightness(x, 4, 0, 0.5)
        low = Math.min(low, b)
        high = Math.max(high, b)
        expect(b).toBeGreaterThan(0)
        expect(b).toBeLessThanOrEqual(1)
      }
      expect(low).toBeLessThan(0.2)
      expect(high).toBeGreaterThan(0.85)
    })
  })

  describe('drawing', () => {
    it('lays out a grid for its size and draws glyphs from an atlas', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain font-size="20"></moul-glyph-rain>`,
      )
      show(el, 320, 160)
      const state = internals(el)
      expect(state.columns).toBe(16)
      expect(state.rows).toBe(8)
      // Every glyph is set once per colour onto the atlas, then copied.
      expect(context.fillText).toHaveBeenCalledTimes(
        splitGlyphs(DEFAULT_GLYPHS).length * 2,
      )
      run(frames, 3)
      expect(context.drawImage).toHaveBeenCalled()
      expect(context.fillText).toHaveBeenCalledTimes(
        splitGlyphs(DEFAULT_GLYPHS).length * 2,
      )
    })

    it('lets the heads fall as frames pass', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain></moul-glyph-rain>`,
      )
      show(el)
      const before = Array.from(internals(el).heads)
      run(frames, 10)
      const after = Array.from(internals(el).heads)
      const fell = after.filter((head, i) => head > before[i]).length
      expect(fell).toBeGreaterThan(after.length / 2)
    })

    it('leaves blank cells in a shift grid by density', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain variant="shift" density="0.3"></moul-glyph-rain>`,
      )
      show(el, 640, 320)
      const cells = Array.from(internals(el).grid)
      const blank = cells.filter((cell) => cell === 0xffff).length
      expect(blank / cells.length).toBeGreaterThan(0.55)
      expect(blank / cells.length).toBeLessThan(0.85)
      context.drawImage.mockClear()
      run(frames, 1)
      expect(context.drawImage.mock.calls.length).toBe(cells.length - blank)
    })

    it('rebuilds the atlas when the glyphs change', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain></moul-glyph-rain>`,
      )
      show(el)
      context.fillText.mockClear()
      el.glyphs = '01'
      await el.updateComplete
      run(frames, 1)
      expect(context.fillText).toHaveBeenCalledTimes(4)
    })
  })

  describe('pointer glow', () => {
    it('lights up under a mouse when pointer-glow is set, and not for touch', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain pointer-glow></moul-glyph-rain>`,
      )
      el.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 320, height: 160 }) as DOMRect
      show(el)
      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 100,
          clientY: 60,
          pointerType: 'touch',
        }),
      )
      run(frames, 20)
      expect(internals(el).glow).toBe(0)
      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 100,
          clientY: 60,
          pointerType: 'mouse',
        }),
      )
      run(frames, 20, 2000)
      expect(internals(el).glow).toBeGreaterThan(0.5)
    })
  })

  describe('keyboard and screen readers', () => {
    it('takes no focus and keeps slotted content readable and in the tab order', async () => {
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain
          ><h2>Logs</h2>
          <button>Open</button></moul-glyph-rain
        >`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.getAttribute('role')).toBeNull()
      const slot = el.shadowRoot!.querySelector('slot')!
      expect(slot.assignedElements().map((node) => node.localName)).toEqual([
        'h2',
        'button',
      ])
      const button = el.querySelector('button')!
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('reduced motion', () => {
    it('draws one still frame and schedules no more', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain pointer-glow></moul-glyph-rain>`,
      )
      show(el)
      expect(context.drawImage).toHaveBeenCalled()
      expect(frames.pending).toBe(0)
      const heads = Array.from(internals(el).heads)
      run(frames, 10)
      expect(Array.from(internals(el).heads)).toEqual(heads)
    })

    it('draws the same still frame every time', async () => {
      motion = mockReducedMotion(true)
      const first = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain></moul-glyph-rain>`,
      )
      show(first)
      const second = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain></moul-glyph-rain>`,
      )
      show(second)
      expect(Array.from(internals(second).heads)).toEqual(
        Array.from(internals(first).heads),
      )
    })

    it('starts falling when the setting is turned off', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulGlyphRain>(
        html`<moul-glyph-rain></moul-glyph-rain>`,
      )
      show(el)
      expect(frames.pending).toBe(0)
      motion.set(false)
      expect(frames.pending).toBe(1)
    })
  })
})
