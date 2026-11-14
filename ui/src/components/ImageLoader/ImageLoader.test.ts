import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ImageLoader'
import {
  bandBlockSize,
  easeInOut,
  type ImageLoaderRevealDetail,
  type MoulImageLoader,
  scanPosition,
} from './ImageLoader'

interface LoaderInternals {
  image: unknown
  maybeReveal: () => void
}

/** Pretends the image has loaded, as happy-dom never loads one. */
function arrive(el: MoulImageLoader): void {
  const loader = el as unknown as LoaderInternals
  loader.image = { naturalWidth: 1600, naturalHeight: 900, src: 'dawn.jpg' }
  loader.maybeReveal()
}

describe('<moul-image-loader>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.restoreAllMocks()
  })

  it('is registered with an open shadow root and a canvas hidden from screen readers', async () => {
    const el = await fixture<MoulImageLoader>(
      html`<moul-image-loader alt="Dawn"></moul-image-loader>`,
    )
    expect(customElements.get('moul-image-loader')).toBeDefined()
    const canvas = el.shadowRoot?.querySelector('canvas')
    expect(canvas?.getAttribute('aria-hidden')).toBe('true')
  })

  describe('reveal timing', () => {
    it('eases from 0 to 1 through the middle', () => {
      expect(easeInOut(0)).toBe(0)
      expect(easeInOut(0.5)).toBeCloseTo(0.5)
      expect(easeInOut(1)).toBe(1)
      expect(easeInOut(2)).toBe(1)
      expect(easeInOut(0.25)).toBeLessThan(0.25)
    })

    it('moves the scan line down and past the bottom by the depth of its bands', () => {
      expect(scanPosition(0, 1000, 400)).toBe(0)
      const half = scanPosition(500, 1000, 400)
      expect(half).toBeGreaterThan(0)
      expect(scanPosition(1000, 1000, 400)).toBeGreaterThan(400)
      expect(scanPosition(400, 1000, 400)).toBeLessThan(half)
    })

    it('starts behind the line with blocks twice the grid size, then finer', () => {
      expect(bandBlockSize(0, 12)).toBe(24)
      expect(bandBlockSize(1, 12)).toBe(12)
      expect(bandBlockSize(2, 12)).toBe(6)
      expect(bandBlockSize(3, 12)).toBe(3)
      expect(bandBlockSize(9, 2)).toBe(1)
    })
  })

  describe('phases', () => {
    it('waits for the image, then reveals it', async () => {
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt="Dawn"></moul-image-loader>`,
      )
      expect(el.phase).toBe('waiting')
      arrive(el)
      expect(el.phase).toBe('revealing')
    })

    it('keeps waiting while is-loading is set, and reveals once it is cleared', async () => {
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt="Dawn" is-loading></moul-image-loader>`,
      )
      arrive(el)
      expect(el.phase).toBe('waiting')
      el.isLoading = false
      await el.updateComplete
      expect(el.phase).toBe('revealing')
    })
  })

  describe('keyboard and screen readers', () => {
    it('is one image named by alt, busy until revealed, outside the tab order', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt="Hills at dawn"></moul-image-loader>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.getAttribute('role')).toBe('img')
      expect(base?.getAttribute('aria-label')).toBe('Hills at dawn')
      expect(base?.getAttribute('aria-busy')).toBe('true')
      expect(el.tabIndex).toBe(-1)
      arrive(el)
      await el.updateComplete
      expect(base?.hasAttribute('aria-busy')).toBe(false)
    })

    it('hides a decorative image (alt="") from screen readers', async () => {
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt=""></moul-image-loader>`,
      )
      const base = el.shadowRoot?.querySelector('[part="base"]')
      expect(base?.hasAttribute('role')).toBe(false)
      expect(base?.hasAttribute('aria-busy')).toBe(false)
      expect(base?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('reduced motion', () => {
    it('shows the image at once, without the scan, and still announces the reveal', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt="Dawn" src=""></moul-image-loader>`,
      )
      const onReveal = vi.fn()
      el.addEventListener('reveal', (event) =>
        onReveal((event as CustomEvent<ImageLoaderRevealDetail>).detail),
      )
      arrive(el)
      expect(el.phase).toBe('revealed')
      expect(onReveal).toHaveBeenCalledWith({ src: '' })
    })

    it('replays at once and resolves', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulImageLoader>(
        html`<moul-image-loader alt="Dawn"></moul-image-loader>`,
      )
      arrive(el)
      await expect(el.replay()).resolves.toBeUndefined()
      expect(el.phase).toBe('revealed')
    })
  })
})
