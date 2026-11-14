import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './Spotlight'
import type { MoulSpotlight } from './Spotlight'
import { spotlightStyles } from './Spotlight.styles'

const css = spotlightStyles.cssText

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

const layerOf = (el: MoulSpotlight) =>
  el.shadowRoot!.querySelector<HTMLElement>('[part="background"]')

const classesIn = (el: MoulSpotlight) =>
  [...(layerOf(el)?.children ?? [])].map((child) => child.className)

describe('<moul-spotlight>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('draws a cone from the start corner behind its content, not yet lit', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight><h2>Ship faster</h2></moul-spotlight>`,
    )
    expect(el.variant).toBe('cone')
    expect(el.placement).toBe('start')
    expect(el.getAttribute('variant')).toBe('cone')
    expect(el.getAttribute('placement')).toBe('start')
    expect(el.isLit).toBe(false)
    expect(el.hasAttribute('is-lit')).toBe(false)
    expect(classesIn(el)).toEqual(['cone'])
    // The layer comes first and the content after it, so the content paints on top.
    const children = [...el.shadowRoot!.children]
    expect(children.map((child) => child.localName)).toEqual(['div', 'slot'])
    expect(el.querySelector('h2')?.textContent).toBe('Ship faster')
  })

  it('draws a line, a glow and a cone for lamp, and two beams for sway', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight variant="lamp"></moul-spotlight>`,
    )
    expect(classesIn(el)).toEqual(['lamp-cone', 'lamp-glow', 'lamp-line'])
    el.variant = 'sway'
    await el.updateComplete
    expect(el.getAttribute('variant')).toBe('sway')
    expect(classesIn(el)).toEqual(['sway sway-start', 'sway sway-end'])
  })

  it('falls back to cone and start for unknown values', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight variant="laser" placement="left"></moul-spotlight>`,
    )
    expect(el.variant).toBe('cone')
    expect(el.placement).toBe('start')
    el.placement = 'end'
    await el.updateComplete
    expect(el.getAttribute('placement')).toBe('end')
  })

  it('lights up once, the first time it enters the viewport', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight></moul-spotlight>`,
    )
    io.enter(el)
    await el.updateComplete
    expect(el.isLit).toBe(true)
    expect(el.hasAttribute('is-lit')).toBe(true)

    io.leave(el)
    await el.updateComplete
    expect(el.isLit).toBe(true)
    io.enter(el)
    await el.updateComplete
    expect(el.isLit).toBe(true)
  })

  it('runs the entrance again with play(): out for a moment, then lit', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight variant="lamp"></moul-spotlight>`,
    )
    io.enter(el)
    await el.updateComplete
    // Each record holds the value before the change: '' while lit, null while out.
    const before: Array<string | null> = []
    const observer = new MutationObserver((records) => {
      for (const record of records) before.push(record.oldValue)
    })
    observer.observe(el, {
      attributeFilter: ['is-lit'],
      attributeOldValue: true,
    })
    await el.play()
    await new Promise((resolve) => setTimeout(resolve))
    observer.disconnect()
    expect(before).toEqual(['', null])
    expect(el.isLit).toBe(true)
  })

  it('lights at once where IntersectionObserver is missing', async () => {
    io.restore()
    const original = globalThis.IntersectionObserver
    // @ts-expect-error: simulating a runtime without the API
    delete globalThis.IntersectionObserver
    try {
      const el = await fixture<MoulSpotlight>(
        html`<moul-spotlight></moul-spotlight>`,
      )
      await el.updateComplete
      expect(el.isLit).toBe(true)
    } finally {
      globalThis.IntersectionObserver = original
    }
  })

  it('pauses the sway while off screen and resumes it on return', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight variant="sway"></moul-spotlight>`,
    )
    const animation = fakeAnimation()
    el.shadowRoot!.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching the viewport when removed', async () => {
    const el = await fixture<MoulSpotlight>(
      html`<moul-spotlight variant="sway"></moul-spotlight>`,
    )
    expect(io.targets).toContain(el)
    el.remove()
    expect(io.targets).not.toContain(el)
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

  it('takes its light from the accent, tinted for each theme', () => {
    expect(css).toMatch(
      /--_spotlight-light: var\(\s*--spotlight-color,\s*light-dark\(\s*var\(--color-accent\),\s*color-mix\(in oklab, var\(--color-accent\) 12%, var\(--color-white\)\)/,
    )
    expect(css).toContain(
      '--_spotlight-duration: var(--spotlight-duration, 2s)',
    )
    expect(css).toMatch(
      /:host\(\[variant="sway"\]\) \[part="background"\] \{\s*--_spotlight-duration: var\(--spotlight-duration, 8s\);/,
    )
  })

  it('places the cone by corner, and mirrors the light in right-to-left text', () => {
    expect(css).toMatch(/\.cone \{\s*--_spotlight-x: 20%;/)
    expect(css).toMatch(
      /:host\(\[placement="center"\]\) \.cone \{\s*--_spotlight-x: 50%;[^}]*--_spotlight-angle: 90deg;/,
    )
    expect(css).toMatch(
      /:host\(\[placement="end"\]\) \.cone \{\s*--_spotlight-x: 80%;\s*--_spotlight-angle: -30deg;/,
    )
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \[part="background"\] \{\s*transform: scaleX\(-1\);/,
    )
  })

  it('animates only the lighting up, so putting the light out for a replay is instant', () => {
    expect(css).toMatch(
      /:host\(\[is-lit\]\) \.cone,\s*:host\(\[is-lit\]\) \.lamp-line,\s*:host\(\[is-lit\]\) \.lamp-glow,\s*:host\(\[is-lit\]\) \.lamp-cone,\s*:host\(\[is-lit\]\) \.sway \{\s*transition-property: opacity, scale, translate;/,
    )
    expect(css).not.toMatch(/\.cone \{[^}]*transition/)
    expect(css).toMatch(
      /:host\(\[is-lit\]\) \.cone \{\s*opacity: 1;\s*scale: 1;\s*translate: -50% -50%;/,
    )
    expect(css).toContain('@keyframes moul-spotlight-sway')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides only the light', async () => {
      const el = await fixture<MoulSpotlight>(
        html`<moul-spotlight><a href="#start">Get started</a></moul-spotlight>`,
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

    it('drops the light where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part="background"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('shows cone and lamp in place from the start, and holds the sway still', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(
        /\.cone,\s*\.lamp-line,\s*\.lamp-glow,\s*\.lamp-cone,\s*\.sway \{\s*transition: none !important;\s*animation: none !important;\s*opacity: 1 !important;\s*scale: none !important;/,
      )
      expect(block).toMatch(/\.cone \{\s*translate: -50% -50% !important;/)
      // At rest, each sway beam leans in from its corner.
      expect(css).toContain('rotate: calc(var(--_spotlight-tilt) * 32deg)')
    })
  })
})
