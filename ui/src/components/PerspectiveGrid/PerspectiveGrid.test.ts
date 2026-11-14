import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './PerspectiveGrid'
import type { MoulPerspectiveGrid } from './PerspectiveGrid'
import { perspectiveGridStyles } from './PerspectiveGrid.styles'

const css = perspectiveGridStyles.cssText

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string | undefined {
  const start = css.indexOf(`@media ${query}`)
  if (start < 0) return undefined
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
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

const layer = (el: MoulPerspectiveGrid) =>
  el.shadowRoot?.querySelector('[part="background"]') as HTMLElement

const stage = (el: MoulPerspectiveGrid) =>
  el.shadowRoot?.querySelector('.stage') as HTMLElement

const planes = (el: MoulPerspectiveGrid) => [
  ...(el.shadowRoot?.querySelectorAll<HTMLElement>('.plane') ?? []),
]

describe('<moul-perspective-grid>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('lays a floor behind its content by default, tilted 65 degrees', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid><h2>Build in the open</h2></moul-perspective-grid>`,
    )
    expect(el.variant).toBe('floor')
    expect(el.getAttribute('variant')).toBe('floor')
    expect(el.angle).toBe(65)
    expect(planes(el).map((plane) => plane.className)).toEqual(['plane floor'])
    expect(planes(el)[0]?.querySelector('.lines')).not.toBeNull()
    expect(stage(el).style.getPropertyValue('--_perspective-grid-angle')).toBe(
      '65deg',
    )
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(el.querySelector('h2')?.textContent).toBe('Build in the open')
  })

  it('puts the decorative layer behind the slot', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid>Content</moul-perspective-grid>`,
    )
    const children = [...(el.shadowRoot?.children ?? [])].filter(
      (child) => child.tagName !== 'STYLE',
    )
    expect(children[0]?.getAttribute('part')).toBe('background')
    expect(children[1]?.tagName).toBe('SLOT')
    expect(css).toMatch(
      /\[part='background'\] \{[^}]*position: absolute;[^}]*inset: 0;[^}]*z-index: -1;[^}]*overflow: hidden;[^}]*border-radius: inherit;[^}]*pointer-events: none;/,
    )
    expect(css).toMatch(
      /:host \{[^}]*display: block;[^}]*position: relative;[^}]*isolation: isolate;/,
    )
    expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
  })

  it('builds a tunnel of four walls, and falls back to the floor for anything else', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid variant="tunnel"></moul-perspective-grid>`,
    )
    expect(el.variant).toBe('tunnel')
    expect(planes(el).map((plane) => plane.className)).toEqual([
      'plane wall wall-top',
      'plane wall wall-bottom',
      'plane wall wall-left',
      'plane wall wall-right',
    ])
    for (const plane of planes(el)) {
      expect(plane.querySelector('.lines')).not.toBeNull()
    }
    el.setAttribute('variant', 'sphere')
    await el.updateComplete
    expect(el.variant).toBe('floor')
    expect(el.getAttribute('variant')).toBe('floor')
    expect(planes(el)).toHaveLength(1)
  })

  it('clamps the angle between 0 and 85 degrees, and falls back to 65', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid angle="40"></moul-perspective-grid>`,
    )
    expect(el.angle).toBe(40)
    expect(stage(el).style.getPropertyValue('--_perspective-grid-angle')).toBe(
      '40deg',
    )
    el.angle = 120
    await el.updateComplete
    expect(el.angle).toBe(85)
    el.angle = -10
    await el.updateComplete
    expect(el.angle).toBe(0)
    el.angle = Number.NaN
    await el.updateComplete
    expect(el.angle).toBe(65)
  })

  it('places the fade by the horizon, which the angle sets', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid angle="45"></moul-perspective-grid>`,
    )
    const reach = () =>
      Number(stage(el).style.getPropertyValue('--_perspective-grid-reach'))
    // Seen from 1.5 heights back, at 45 degrees the horizon is half a height above the top edge.
    expect(reach()).toBeCloseTo(1.5, 3)
    // At 65 degrees it is about 30% of the way down.
    el.angle = 65
    await el.updateComplete
    expect(reach()).toBeCloseTo(1.5 / Math.tan((65 * Math.PI) / 180), 3)
    expect(1 - reach()).toBeCloseTo(0.3, 2)
    // Lying flat, the horizon is infinitely far: the reach stays finite.
    el.angle = 0
    await el.updateComplete
    expect(reach()).toBe(100)
    expect(css).toMatch(
      /mask-image: linear-gradient\(\s*to bottom,\s*transparent calc\(100% - var\(--_perspective-grid-reach\) \* 75%\),\s*black calc\(100% - var\(--_perspective-grid-reach\) \* 45%\)/,
    )
    expect(css).toContain(
      'transform: rotateX(calc(var(--_perspective-grid-angle) - 180deg))',
    )
    // The stage's viewing distance is the one the reach assumes.
    expect(css).toMatch(
      /\.stage \{[^}]*perspective: 150cqh;[^}]*perspective-origin: 50% 100%;/,
    )
  })

  it('takes its colour, cell size, line width and speed from tokens and its CSS properties', () => {
    expect(css).toContain(
      '--_perspective-grid-size: var(--perspective-grid-size, 60px)',
    )
    expect(css).toMatch(
      /--_perspective-grid-color: var\(\s*--perspective-grid-color,\s*color-mix\(in oklab, var\(--color-fg\) 22%, transparent\)/,
    )
    expect(css).toContain(
      '--_perspective-grid-line-width: var(--perspective-grid-line-width, 1px)',
    )
    expect(css).toContain(
      '--_perspective-grid-duration: var(--perspective-grid-duration, 1s)',
    )
  })

  it('flows the lines one cell toward the viewer per loop', () => {
    expect(css).toMatch(
      /animation: moul-perspective-grid-flow var\(--_perspective-grid-duration\)\s+linear infinite/,
    )
    expect(css).toMatch(
      /@keyframes moul-perspective-grid-flow \{\s*to \{\s*translate: 0 calc\(var\(--_perspective-grid-size\) \* -1\);/,
    )
    // The lines reach one cell past the far end, so the loop never uncovers it.
    expect(css).toContain('inset: 0 0 calc(var(--_perspective-grid-size) * -1)')
  })

  it('fades the tunnel round its vanishing point in the centre', () => {
    expect(css).toMatch(
      /:host\(\[variant='tunnel'\]\) \.stage \{[^}]*perspective-origin: 50% 50%;[^}]*mask-image: radial-gradient\(closest-side, transparent 22%, black 75%\);/,
    )
  })

  it('pauses the flowing lines while off screen and resumes them on return', async () => {
    const el = await fixture<MoulPerspectiveGrid>(
      html`<moul-perspective-grid></moul-perspective-grid>`,
    )
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the grid is hidden from screen readers', async () => {
      const el = await fixture<MoulPerspectiveGrid>(
        html`<moul-perspective-grid variant="tunnel"
          ><a href="#start">Get started</a></moul-perspective-grid
        >`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(layer(el).getAttribute('aria-hidden')).toBe('true')
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
      expect(layer(el).querySelector('slot')).toBeNull()
      expect(el.querySelector('a')?.getAttribute('href')).toBe('#start')
    })

    it('does not draw the grid where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part='background'\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('holds the grid still', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.lines \{\s*animation: none !important;/)
    })
  })
})
