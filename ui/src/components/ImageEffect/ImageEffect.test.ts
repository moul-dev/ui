import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ImageEffect'
import type { MoulImageEffect } from './ImageEffect'
import {
  ASCII_RAMP,
  BAYER_8,
  bayerThreshold,
  effectScale,
  glyphIndex,
  IMAGE_EFFECTS,
  inkCoverage,
  normalizeEffect,
  packRgba,
  spotlight,
  stretchLevels,
  waveOffset,
} from './image-effect-math'

interface EffectInternals {
  image: unknown
  needsLoop: () => boolean
  prepare: (
    image: unknown,
    width: number,
    height: number,
    pixelRatio: number,
  ) => void
  unreadable: boolean
}

const FAKE_IMAGE = {
  naturalWidth: 1600,
  naturalHeight: 1000,
  src: 'temple.jpg',
}

function internals(el: MoulImageEffect): EffectInternals {
  return el as unknown as EffectInternals
}

describe('<moul-image-effect>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulImageEffect>(
      html`<moul-image-effect alt="Temple"></moul-image-effect>`,
    )
    expect(customElements.get('moul-image-effect')).toBeDefined()
    const canvas = el.shadowRoot?.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  it('falls back to pixelate for an unknown effect, and reflects it', async () => {
    const el = await fixture<MoulImageEffect>(
      html`<moul-image-effect alt="Temple" effect="sepia"></moul-image-effect>`,
    )
    await el.updateComplete
    expect(el.effect).toBe('pixelate')
    expect(el.getAttribute('effect')).toBe('pixelate')
    expect(normalizeEffect('ascii')).toBe('ascii')
  })

  describe('effect arithmetic', () => {
    it('grows each effect with intensity, within its range', () => {
      for (const effect of IMAGE_EFFECTS) {
        expect(effectScale(effect, 1)).toBeGreaterThan(effectScale(effect, 0))
        expect(effectScale(effect, 0)).toBeGreaterThan(0)
        expect(effectScale(effect, 9)).toBe(effectScale(effect, 1))
      }
      expect(effectScale('pixelate', 0.5)).toBe(18)
      expect(effectScale('dither', Number.NaN)).toBe(effectScale('dither', 0.5))
    })

    it('uses all 64 Bayer thresholds, evenly between 0 and 1', () => {
      expect(new Set(BAYER_8).size).toBe(64)
      const mean = BAYER_8.reduce((sum, value) => sum + value, 0) / 64
      expect(mean).toBeCloseTo(0.5)
      expect(Math.min(...BAYER_8)).toBeGreaterThan(0)
      expect(Math.max(...BAYER_8)).toBeLessThan(1)
      expect(bayerThreshold(8, 8)).toBe(bayerThreshold(0, 0))
    })

    it('picks no character for no ink and the densest for full ink', () => {
      expect(glyphIndex(0)).toBe(0)
      expect(glyphIndex(1)).toBe(ASCII_RAMP.length - 1)
      expect(glyphIndex(-3)).toBe(0)
      expect(glyphIndex(0.5)).toBe(Math.round((ASCII_RAMP.length - 1) / 2))
    })

    it('inks the dark parts on light paper and the light parts on dark paper', () => {
      expect(inkCoverage(0.1, false)).toBeCloseTo(0.9)
      expect(inkCoverage(0.1, true)).toBeCloseTo(0.1)
    })

    it('stretches a flat picture to the whole range', () => {
      const values = stretchLevels(new Float32Array([0.4, 0.5, 0.6]))
      expect([...values].map((v) => Number(v.toFixed(3)))).toEqual([0, 0.5, 1])
      const flat = stretchLevels(new Float32Array([0.3, 0.3]))
      expect(flat[0]).toBeCloseTo(0.3)
    })

    it('fades the spotlight from its centre to its edge', () => {
      expect(spotlight(0, 100)).toBe(1)
      expect(spotlight(50, 100)).toBeCloseTo(0.5)
      expect(spotlight(100, 100)).toBe(0)
    })

    it('keeps the wave within its height and moves it with time', () => {
      for (let y = 0; y < 300; y += 7) {
        expect(Math.abs(waveOffset(y, 1234, 10, 80, 60))).toBeLessThanOrEqual(
          10,
        )
      }
      expect(waveOffset(20, 0, 10, 80, 60)).not.toBeCloseTo(
        waveOffset(20, 500, 10, 80, 60),
      )
      expect(waveOffset(20, 0, 10, 0, 60)).toBe(0)
    })

    it('packs colours in the byte order ImageData uses', () => {
      const pixel = new Uint32Array([packRgba(1, 0.5, 0, 1)])
      const bytes = new Uint8Array(pixel.buffer)
      expect([...bytes]).toEqual([255, 128, 0, 255])
    })
  })

  describe('pixels it cannot read', () => {
    it('shows the plain image and says why, once, when the canvas cannot be read', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const el = await fixture<MoulImageEffect>(
        html`<moul-image-effect alt="Temple" effect="dither"></moul-image-effect>`,
      )
      const effect = internals(el)
      effect.image = FAKE_IMAGE
      // happy-dom has no 2D context, like a browser refusing a tainted canvas.
      effect.prepare(FAKE_IMAGE, 300, 200, 1)
      expect(effect.unreadable).toBe(true)
      effect.prepare(FAKE_IMAGE, 320, 200, 1)
      const cors = warn.mock.calls.filter(([message]) =>
        String(message).includes('CORS'),
      )
      expect(cors).toHaveLength(1)
      el.effect = 'particles'
      await el.updateComplete
      effect.prepare(FAKE_IMAGE, 300, 200, 1)
      expect(effect.needsLoop()).toBe(false)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is one image named by alt, outside the tab order', async () => {
      const el = await fixture<MoulImageEffect>(
        html`<moul-image-effect alt="A temple at sunrise" interactive></moul-image-effect>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.getAttribute('role')).toBe('img')
      expect(base?.getAttribute('aria-label')).toBe('A temple at sunrise')
      expect(el.tabIndex).toBe(-1)
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('hides a decorative image (alt="") from screen readers', async () => {
      const el = await fixture<MoulImageEffect>(
        html`<moul-image-effect alt=""></moul-image-effect>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.hasAttribute('role')).toBe(false)
      expect(base?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('reduced motion', () => {
    it('animates the moving effects, but only while motion is allowed', async () => {
      const el = await fixture<MoulImageEffect>(
        html`<moul-image-effect alt="Temple" effect="wave"></moul-image-effect>`,
      )
      const effect = internals(el)
      effect.image = FAKE_IMAGE
      expect(effect.needsLoop()).toBe(true)
      el.effect = 'chromatic'
      await el.updateComplete
      expect(effect.needsLoop()).toBe(true)
      el.effect = 'dither'
      await el.updateComplete
      expect(effect.needsLoop()).toBe(false)

      motion = mockReducedMotion(true)
      for (const name of ['wave', 'chromatic', 'particles'] as const) {
        el.effect = name
        el.interactive = true
        await el.updateComplete
        expect(effect.needsLoop(), name).toBe(false)
      }
    })
  })
})
