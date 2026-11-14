import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './LightRays'
import type { MoulLightRays } from './LightRays'
import { lightRaysStyles } from './LightRays.styles'

const css = lightRaysStyles.cssText

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string | undefined {
  const start = css.indexOf(`@media ${query}`)
  if (start < 0) return undefined
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return undefined
}

/** A running animation that records being paused and resumed, since happy-dom runs no CSS animations. */
function fakeAnimation() {
  return {
    playState: 'running' as AnimationPlayState,
    pause() {
      this.playState = 'paused'
    },
    play() {
      this.playState = 'running'
    },
  }
}

const raysOf = (el: MoulLightRays) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('.ray'),
]

/** A ray's own custom property, as a number. */
const read = (ray: HTMLElement, name: string) =>
  Number.parseFloat(ray.style.getPropertyValue(`--_light-rays-${name}`))

describe('<moul-light-rays>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('shines seven rays behind its content by default', async () => {
    const el = await fixture<MoulLightRays>(
      html`<moul-light-rays><h2>Ship faster</h2></moul-light-rays>`,
    )
    expect(el.count).toBe(7)
    expect(raysOf(el)).toHaveLength(7)
    const layer = el.shadowRoot!.querySelector('[part="background"]')
    expect(layer?.contains(raysOf(el)[0])).toBe(true)
    // The layer comes first and the content after it, so the content paints on top.
    const children = [...el.shadowRoot!.children]
    expect(children.map((child) => child.localName)).toEqual(['div', 'slot'])
    expect(el.querySelector('h2')?.textContent).toBe('Ship faster')
  })

  it('gives each ray its own place, tilt, width, length, pace and brightness', async () => {
    const el = await fixture<MoulLightRays>(
      html`<moul-light-rays></moul-light-rays>`,
    )
    const rays = raysOf(el)
    for (const ray of rays) {
      expect(ray.style.getPropertyValue('--_light-rays-x')).toMatch(/%$/)
      expect(ray.style.getPropertyValue('--_light-rays-angle')).toMatch(/deg$/)
      expect(ray.style.getPropertyValue('--_light-rays-width')).toMatch(/%$/)
      expect(read(ray, 'x')).toBeGreaterThanOrEqual(8)
      expect(read(ray, 'x')).toBeLessThanOrEqual(92)
      expect(read(ray, 'reach')).toBeGreaterThanOrEqual(0.75)
      expect(read(ray, 'reach')).toBeLessThanOrEqual(1.2)
      expect(read(ray, 'pace')).toBeGreaterThanOrEqual(0.75)
      expect(read(ray, 'pace')).toBeLessThanOrEqual(1.35)
      expect(read(ray, 'peak')).toBeGreaterThanOrEqual(0.55)
      expect(read(ray, 'peak')).toBeLessThanOrEqual(1)
      expect(read(ray, 'delay')).toBeGreaterThanOrEqual(0)
      expect(read(ray, 'delay')).toBeLessThan(1)
    }
    // No two alike, and they run left to right across the top.
    const widths = new Set(rays.map((ray) => read(ray, 'width')))
    expect(widths.size).toBe(rays.length)
    const xs = rays.map((ray) => read(ray, 'x'))
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    // They fan out: the leftmost leans left (positive), the rightmost right (negative).
    expect(read(rays[0], 'angle')).toBeGreaterThan(0)
    expect(read(rays[rays.length - 1], 'angle')).toBeLessThan(0)
  })

  it('lays the rays out the same way every time', async () => {
    const first = await fixture<MoulLightRays>(
      html`<moul-light-rays count="5"></moul-light-rays>`,
    )
    const second = await fixture<MoulLightRays>(
      html`<moul-light-rays count="5"></moul-light-rays>`,
    )
    const names = ['x', 'angle', 'width', 'reach', 'delay', 'pace', 'swing']
    const styles = (el: MoulLightRays) =>
      raysOf(el).map((ray) =>
        names.map((name) =>
          ray.style.getPropertyValue(`--_light-rays-${name}`).trim(),
        ),
      )
    expect(styles(first)).toEqual(styles(second))
    const before = styles(first)
    first.requestUpdate()
    await first.updateComplete
    expect(styles(first)).toEqual(before)
  })

  it('clamps count to 1 to 16, rounds it, and falls back to 7 for a non-number', async () => {
    const el = await fixture<MoulLightRays>(
      html`<moul-light-rays count="40"></moul-light-rays>`,
    )
    expect(raysOf(el)).toHaveLength(16)
    el.count = 0
    await el.updateComplete
    expect(raysOf(el)).toHaveLength(1)
    // A single ray comes in near the middle.
    expect(Math.abs(read(raysOf(el)[0], 'x') - 50)).toBeLessThan(4)
    el.count = 3.6
    await el.updateComplete
    expect(raysOf(el)).toHaveLength(4)
    el.setAttribute('count', 'many')
    await el.updateComplete
    expect(raysOf(el)).toHaveLength(7)
  })

  it('sits the layer behind the content, clipped to the element and its corners', () => {
    expect(css).toMatch(
      /:host \{\s*display: block;\s*position: relative;[^}]*isolation: isolate;/,
    )
    expect(css).toMatch(
      /position: absolute;\s*inset: 0;\s*z-index: -1;\s*overflow: hidden;\s*border-radius: inherit;\s*pointer-events: none;/,
    )
    expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
  })

  it('takes its light from the accent, tinted for each theme, and its timing from custom properties', () => {
    expect(css).toMatch(
      /--_light-rays-light: var\(\s*--light-rays-color,\s*light-dark\(\s*color-mix\(in oklab, var\(--color-accent\) 70%, var\(--color-white\)\),\s*color-mix\(in oklab, var\(--color-accent\) 20%, var\(--color-white\)\)/,
    )
    expect(css).toContain('--_light-rays-blur: var(--light-rays-blur, 12px)')
    expect(css).toContain('--_light-rays-length: var(--light-rays-length, 70%)')
    expect(css).toContain(
      '--_light-rays-duration: var(--light-rays-duration, 12s)',
    )
    expect(css).toContain('filter: blur(var(--_light-rays-blur))')
    expect(css).toContain('@keyframes moul-light-rays-sway')
    expect(css).toContain('@keyframes moul-light-rays-breathe')
  })

  it('mirrors the rays in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \[part="background"\] \{\s*transform: scaleX\(-1\);/,
    )
  })

  it('pauses its animations while off screen and resumes them on return', async () => {
    const el = await fixture<MoulLightRays>(
      html`<moul-light-rays></moul-light-rays>`,
    )
    const animation = fakeAnimation()
    el.shadowRoot!.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching the viewport when removed', async () => {
    const el = await fixture<MoulLightRays>(
      html`<moul-light-rays></moul-light-rays>`,
    )
    expect(io.targets).toContain(el)
    el.remove()
    expect(io.targets).not.toContain(el)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides only the rays', async () => {
      const el = await fixture<MoulLightRays>(
        html`<moul-light-rays><a href="#start">Get started</a></moul-light-rays>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(
        el.shadowRoot
          ?.querySelector('[part="background"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(
        el.shadowRoot?.querySelector('slot')?.closest('[aria-hidden]'),
      ).toBeNull()
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('drops the rays where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part="background"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('holds each ray still at its own angle and a medium brightness', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.ray \{\s*animation: none !important;/)
      // The resting state the rays fall back to.
      expect(css).toMatch(
        /\.ray \{[^}]*rotate: var\(--_light-rays-angle\);[^}]*opacity: calc\(var\(--_light-rays-peak\) \* 0\.6\);/,
      )
    })
  })
})
