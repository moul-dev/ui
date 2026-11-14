import { fixture, html } from '@open-wc/testing-helpers'
import { describe, expect, it } from 'vitest'
import { triggerResize } from '../../test-setup'
import './Backlight'
import type { MoulBacklight } from './Backlight'
import { backlightStyles } from './Backlight.styles'

const css = backlightStyles.cssText

const base = (el: MoulBacklight) =>
  el.shadowRoot?.querySelector('[part="base"]') as HTMLElement
const filter = (el: MoulBacklight) =>
  el.shadowRoot?.querySelector('filter') as SVGFilterElement
const primitive = (el: MoulBacklight, tag: string) =>
  filter(el).querySelector(tag) as Element

async function backlight(): Promise<MoulBacklight> {
  const el = await fixture<MoulBacklight>(
    html`<div>
      <moul-backlight>
        <img src="poster.png" alt="A night market lit in red and gold" />
      </moul-backlight>
    </div>`,
  )
  const host = el.querySelector('moul-backlight') as MoulBacklight
  await host.updateComplete
  return host
}

describe('<moul-backlight>', () => {
  it('draws the media through an SVG filter that lives in its own shadow root', async () => {
    const el = await fixture<MoulBacklight>(
      html`<moul-backlight><img alt="Poster" /></moul-backlight>`,
    )
    const id = filter(el).id
    expect(id).toMatch(/^moul-backlight-\d+$/)
    expect(base(el).getAttribute('style')).toBe(`filter: url(#${id})`)
    expect(base(el).querySelector('slot')).not.toBeNull()

    const blur = primitive(el, 'feGaussianBlur')
    expect(blur.getAttribute('in')).toBe('SourceGraphic')
    expect(blur.getAttribute('stdDeviation')).toBe('20')
    // WebKit draws no glow with edgeMode="duplicate", so the default edge mode is kept.
    expect(blur.hasAttribute('edgeMode')).toBe(false)
    const saturate = primitive(el, 'feColorMatrix')
    expect(saturate.getAttribute('type')).toBe('saturate')
    expect(saturate.getAttribute('values')).toBe('2')
    const composite = primitive(el, 'feComposite')
    expect(composite.getAttribute('in')).toBe('SourceGraphic')
    expect(composite.getAttribute('in2')).toBe('glow')
    expect(composite.getAttribute('operator')).toBe('over')
  })

  it('gives each instance its own filter id', async () => {
    const wrapper = await fixture<HTMLElement>(
      html`<div>
        <moul-backlight></moul-backlight>
        <moul-backlight></moul-backlight>
      </div>`,
    )
    const [a, b] = [
      ...wrapper.querySelectorAll('moul-backlight'),
    ] as MoulBacklight[]
    await Promise.all([a.updateComplete, b.updateComplete])
    expect(filter(a).id).not.toBe(filter(b).id)
  })

  it('reads the blur attribute into glowBlur, leaving the blur() method alone', async () => {
    const el = await backlight()
    el.setAttribute('blur', '12')
    await el.updateComplete
    expect(el.glowBlur).toBe(12)
    expect(typeof el.blur).toBe('function')
    expect(primitive(el, 'feGaussianBlur').getAttribute('stdDeviation')).toBe(
      '12',
    )
  })

  it('renders blur and saturation into the filter, clamped to their ranges', async () => {
    const el = await backlight()
    el.glowBlur = 36
    el.saturation = 3.5
    await el.updateComplete
    expect(el.getAttribute('blur')).toBe('36')
    expect(primitive(el, 'feGaussianBlur').getAttribute('stdDeviation')).toBe(
      '36',
    )
    expect(primitive(el, 'feColorMatrix').getAttribute('values')).toBe('3.5')

    el.glowBlur = 500
    el.saturation = -1
    await el.updateComplete
    expect(el.glowBlur).toBe(80)
    expect(el.saturation).toBe(0)

    el.glowBlur = Number.NaN
    el.saturation = Number.NaN
    await el.updateComplete
    expect(el.glowBlur).toBe(20)
    expect(el.saturation).toBe(2)
  })

  it('sizes the filter region so the glow fades out before its edge', async () => {
    const el = await backlight()
    // Before the size is known: half the size past each edge.
    expect(filter(el).getAttribute('x')).toBe('-50%')
    expect(filter(el).getAttribute('width')).toBe('200%')

    // 400 × 200 at blur 20: three deviations (60px) past each edge.
    triggerResize(base(el), { width: 400, height: 200 })
    await el.updateComplete
    expect(filter(el).getAttribute('x')).toBe('-0.15')
    expect(filter(el).getAttribute('y')).toBe('-0.3')
    expect(filter(el).getAttribute('width')).toBe('1.3')
    expect(filter(el).getAttribute('height')).toBe('1.6')

    el.glowBlur = 0
    await el.updateComplete
    expect(filter(el).getAttribute('x')).toBe('0')
    expect(filter(el).getAttribute('width')).toBe('1')

    // It lets go of the wrapper when it leaves the page.
    el.remove()
    triggerResize(base(el), { width: 800, height: 400 })
    expect(filter(el).getAttribute('width')).toBe('1')
  })

  it('holds the filter in an SVG that takes no room', () => {
    expect(css).toMatch(
      /\.defs\s*\{\s*position: absolute;\s*inline-size: 0;\s*block-size: 0;/,
    )
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and leaves the media its alt text', async () => {
      const el = await backlight()
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      const svg = el.shadowRoot?.querySelector('svg') as SVGElement
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('focusable')).toBe('false')
      expect(el.querySelector('img')?.getAttribute('alt')).toBe(
        'A night market lit in red and gold',
      )
    })

    it('drops the glow where the system forces its own colours', () => {
      expect(css).toMatch(
        /@media \(forced-colors: active\)\s*\{\s*\[part="base"\]\s*\{\s*filter: none !important/,
      )
    })
  })

  describe('reduced motion', () => {
    it('has nothing to animate', () => {
      expect(css).not.toMatch(/transition|animation|@keyframes/)
    })
  })
})
