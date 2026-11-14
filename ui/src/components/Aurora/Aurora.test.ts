import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './Aurora'
import type { MoulAurora } from './Aurora'
import { auroraStyles } from './Aurora.styles'

const css = auroraStyles.cssText

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

const layerOf = (el: MoulAurora) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="background"]')

describe('<moul-aurora>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('draws two bands of colour behind its content by default', async () => {
    const el = await fixture<MoulAurora>(
      html`<moul-aurora><h2>Ship faster</h2></moul-aurora>`,
    )
    expect(el.variant).toBe('aurora')
    expect(el.getAttribute('variant')).toBe('aurora')
    expect(layerOf(el)?.querySelectorAll('.band')).toHaveLength(2)
    expect(layerOf(el)?.querySelectorAll('.blob')).toHaveLength(0)
    // The layer comes first and the content after it, so the content paints on top.
    const children = [...el.shadowRoot!.children]
    expect(children.map((child) => child.localName)).toEqual(['div', 'slot'])
    expect(el.querySelector('h2')?.textContent).toBe('Ship faster')
  })

  it('draws four blobs for blobs, and falls back to aurora for anything else', async () => {
    const el = await fixture<MoulAurora>(
      html`<moul-aurora variant="blobs"></moul-aurora>`,
    )
    expect(el.variant).toBe('blobs')
    expect(layerOf(el)?.querySelectorAll('.blob')).toHaveLength(4)
    expect(layerOf(el)?.querySelectorAll('.band')).toHaveLength(0)

    el.setAttribute('variant', 'plasma')
    await el.updateComplete
    expect(el.variant).toBe('aurora')
    expect(el.getAttribute('variant')).toBe('aurora')
    expect(layerOf(el)?.querySelectorAll('.band')).toHaveLength(2)
  })

  it('sits the layer behind the content, clipped to the element and its corners', () => {
    expect(css).toMatch(
      /:host \{\s*display: block;\s*position: relative;[^}]*isolation: isolate;/,
    )
    expect(css).toMatch(
      /\[part="background"\] \{[^}]*position: absolute;\s*inset: 0;\s*z-index: -1;\s*overflow: hidden;\s*border-radius: inherit;\s*pointer-events: none;/,
    )
    expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
  })

  it('takes its default colours from tokens, paler on a light page', () => {
    expect(css).toContain(
      '--_aurora-color-1: var(--aurora-color-1, var(--color-accent))',
    )
    expect(css).toContain(
      '--_aurora-color-2: var(--aurora-color-2, var(--color-chart-4))',
    )
    expect(css).toContain(
      '--_aurora-color-3: var(--aurora-color-3, var(--color-chart-5))',
    )
    expect(css).toMatch(
      /--_aurora-1: light-dark\(\s*color-mix\(in oklab, var\(--_aurora-color-1\) 70%, transparent\),\s*var\(--_aurora-color-1\)\s*\)/,
    )
    expect(css).toContain('opacity: var(--aurora-opacity, 0.6)')
  })

  it('blurs and times the colour from its custom properties, with softer blobs', () => {
    expect(css).toContain('--_aurora-blur: var(--aurora-blur, 48px)')
    expect(css).toMatch(
      /:host\(\[variant="blobs"\]\) \[part="background"\] \{\s*--_aurora-blur: var\(--aurora-blur, 64px\);/,
    )
    expect(css).toContain('filter: blur(var(--_aurora-blur))')
    expect(css).toContain('--_aurora-duration: var(--aurora-duration, 20s)')
    for (const name of ['drift', 'drift-back', 'blob-drift', 'blob-morph']) {
      expect(css).toContain(`@keyframes moul-aurora-${name} `)
    }
  })

  it('mirrors the colour in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \[part="background"\] \{\s*transform: scaleX\(-1\);/,
    )
  })

  it('pauses its animations while off screen and resumes them on return', async () => {
    const el = await fixture<MoulAurora>(html`<moul-aurora></moul-aurora>`)
    const animation = fakeAnimation()
    el.shadowRoot!.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching the viewport when removed', async () => {
    const el = await fixture<MoulAurora>(html`<moul-aurora></moul-aurora>`)
    expect(io.targets).toContain(el)
    el.remove()
    expect(io.targets).not.toContain(el)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides only the colour layer', async () => {
      const el = await fixture<MoulAurora>(
        html`<moul-aurora><a href="#start">Get started</a></moul-aurora>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(layerOf(el)?.getAttribute('aria-hidden')).toBe('true')
      expect(
        el.shadowRoot?.querySelector('slot')?.closest('[aria-hidden]'),
      ).toBeNull()
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('drops the colour layer where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part="background"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('holds the bands and blobs still, as a still colour field', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.band,\s*\.blob \{\s*animation: none !important;/)
    })
  })
})
