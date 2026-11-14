import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './Noise'
import type { MoulNoise } from './Noise'
import { noiseStyles } from './Noise.styles'

const css = noiseStyles.cssText

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

const grainOf = (el: MoulNoise) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="grain"]')

/** The SVG inside the grain's data URI. */
function tileOf(el: MoulNoise): string {
  const image = grainOf(el)?.style.getPropertyValue('--_noise-image') ?? ''
  const match = /^url\("data:image\/svg\+xml,(.*)"\)$/.exec(image.trim())
  return match ? decodeURIComponent(match[1]) : ''
}

describe('<moul-noise>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('lays a still grain over its content by default', async () => {
    const el = await fixture<MoulNoise>(
      html`<moul-noise><h2>Ship faster</h2></moul-noise>`,
    )
    expect(el.frequency).toBe(0.8)
    expect(el.isAnimated).toBe(false)
    expect(el.hasAttribute('is-animated')).toBe(false)
    expect(el.querySelector('h2')?.textContent).toBe('Ship faster')
    // The slot first and the grain after it, so the grain paints over the content.
    const children = [...el.shadowRoot!.children]
    expect(children.map((child) => child.localName)).toEqual(['slot', 'div'])
    expect(children[1]).toBe(grainOf(el))
  })

  it('draws the grain from a stitched SVG noise tile at the given frequency', async () => {
    const el = await fixture<MoulNoise>(html`<moul-noise></moul-noise>`)
    const tile = tileOf(el)
    expect(tile).toContain('<feTurbulence type="fractalNoise"')
    expect(tile).toContain('baseFrequency="0.8"')
    expect(tile).toContain('stitchTiles="stitch"')
    expect(tile).toContain('width="200" height="200"')
  })

  it('redraws the tile when frequency changes', async () => {
    const el = await fixture<MoulNoise>(
      html`<moul-noise frequency="1.5"></moul-noise>`,
    )
    expect(el.frequency).toBe(1.5)
    expect(tileOf(el)).toContain('baseFrequency="1.5"')
    el.frequency = 0.45
    await el.updateComplete
    expect(tileOf(el)).toContain('baseFrequency="0.45"')
  })

  it('clamps frequency to 0.2 to 2, and falls back to 0.8 for a non-number', async () => {
    const el = await fixture<MoulNoise>(
      html`<moul-noise frequency="5"></moul-noise>`,
    )
    expect(tileOf(el)).toContain('baseFrequency="2"')
    el.frequency = 0.01
    await el.updateComplete
    expect(tileOf(el)).toContain('baseFrequency="0.2"')
    el.setAttribute('frequency', 'fine')
    await el.updateComplete
    expect(tileOf(el)).toContain('baseFrequency="0.8"')
  })

  it('reflects is-animated, which jitters the grain in steps', async () => {
    const el = await fixture<MoulNoise>(
      html`<moul-noise is-animated></moul-noise>`,
    )
    expect(el.isAnimated).toBe(true)
    el.isAnimated = false
    await el.updateComplete
    expect(el.hasAttribute('is-animated')).toBe(false)
    expect(css).toMatch(
      /:host\(\[is-animated\]\) \[part="grain"\] \{\s*animation: moul-noise-jitter 1s steps\(1, end\) infinite;/,
    )
    expect(css).toContain('@keyframes moul-noise-jitter')
  })

  it('paints the grain over the content in a token colour, through a mask', () => {
    expect(css).toMatch(
      /:host \{\s*display: block;\s*position: relative;[^}]*isolation: isolate;/,
    )
    expect(css).toMatch(
      /\[part="grain"\] \{\s*position: absolute;\s*inset: 0;[^}]*z-index: 1;\s*border-radius: inherit;\s*pointer-events: none;/,
    )
    expect(css).toContain(
      'background-color: var(--noise-color, var(--color-fg))',
    )
    expect(css).toContain('opacity: var(--noise-opacity, 0.12)')
    expect(css).toContain('mask-image: var(--_noise-image)')
    expect(css).toContain('mask-size: var(--noise-size, 200px)')
    expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
  })

  it('stops the jitter while off screen and starts it again on return', async () => {
    const el = await fixture<MoulNoise>(
      html`<moul-noise is-animated></moul-noise>`,
    )
    const animation = fakeAnimation()
    el.shadowRoot!.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching the viewport when removed', async () => {
    const el = await fixture<MoulNoise>(html`<moul-noise></moul-noise>`)
    expect(io.targets).toContain(el)
    el.remove()
    expect(io.targets).not.toContain(el)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides only the grain', async () => {
      const el = await fixture<MoulNoise>(
        html`<moul-noise><button>Start</button></moul-noise>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(grainOf(el)?.getAttribute('aria-hidden')).toBe('true')
      expect(
        el.shadowRoot?.querySelector('slot')?.closest('[aria-hidden]'),
      ).toBeNull()
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('drops the grain where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part="grain"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('holds the grain still, even when animated', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part="grain"\] \{\s*animation: none !important;/)
    })
  })
})
