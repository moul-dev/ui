import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  triggerResize,
} from '../../test-setup'
import './Pattern'
import type { MoulPattern } from './Pattern'
import { patternStyles } from './Pattern.styles'

const css = patternStyles.cssText

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

const layer = (el: MoulPattern) =>
  el.shadowRoot?.querySelector('[part="background"]') as HTMLElement

const cells = (el: MoulPattern) => [
  ...(el.shadowRoot?.querySelectorAll<HTMLElement>('.cell') ?? []),
]

const position = (cell: HTMLElement) => ({
  x: Number(cell.style.getPropertyValue('--_pattern-x')),
  y: Number(cell.style.getPropertyValue('--_pattern-y')),
})

/** Lays the host out at `width` by `height`, with cells of `size` pixels, as a browser would report it. */
async function layOut(
  el: MoulPattern,
  width: number,
  height: number,
  size: number,
) {
  const probe = el.shadowRoot?.querySelector('.probe') as HTMLElement
  probe.getBoundingClientRect = () =>
    ({ width: size, height: 0 }) as unknown as DOMRect
  triggerResize(el, { width, height })
  await el.updateComplete
}

describe('<moul-pattern>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    vi.restoreAllMocks()
  })

  it('draws dots behind its content by default, with no fade and nothing lit', async () => {
    const el = await fixture<MoulPattern>(
      html`<moul-pattern><h2>Ship faster</h2></moul-pattern>`,
    )
    expect(el.variant).toBe('dots')
    expect(el.getAttribute('variant')).toBe('dots')
    expect(el.fade).toBe('none')
    expect(el.getAttribute('fade')).toBe('none')
    expect(el.isAnimated).toBe(false)
    expect(el.hasAttribute('is-animated')).toBe(false)
    expect(el.count).toBe(12)
    expect(layer(el).querySelector('.pattern')).not.toBeNull()
    expect(cells(el)).toHaveLength(0)
    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement
    expect(slot).not.toBeNull()
    expect(el.querySelector('h2')?.textContent).toBe('Ship faster')
  })

  it('puts the decorative layer behind the slot', async () => {
    const el = await fixture<MoulPattern>(
      html`<moul-pattern>Content</moul-pattern>`,
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

  it('takes every variant and fade, and falls back for anything else', async () => {
    const el = await fixture<MoulPattern>(
      html`<moul-pattern variant="hexagons" fade="radial"></moul-pattern>`,
    )
    expect(el.variant).toBe('hexagons')
    expect(el.fade).toBe('radial')
    for (const variant of ['grid', 'stripes', 'lines', 'dots'] as const) {
      el.variant = variant
      await el.updateComplete
      expect(el.getAttribute('variant')).toBe(variant)
    }
    for (const fade of ['top', 'bottom', 'edges', 'none'] as const) {
      el.fade = fade
      await el.updateComplete
      expect(el.getAttribute('fade')).toBe(fade)
    }
    el.setAttribute('variant', 'zigzag')
    el.setAttribute('fade', 'left')
    await el.updateComplete
    expect(el.variant).toBe('dots')
    expect(el.getAttribute('variant')).toBe('dots')
    expect(el.fade).toBe('none')
    expect(el.getAttribute('fade')).toBe('none')
  })

  it('draws each variant from its private colour and size, from tokens', () => {
    expect(css).toMatch(
      /--_pattern-color: var\(\s*--pattern-color,\s*color-mix\(in oklab, var\(--color-fg\) 15%, transparent\)/,
    )
    expect(css).toMatch(
      /--_pattern-highlight: var\(\s*--pattern-highlight,\s*color-mix\(in oklab, var\(--color-accent\) 30%, transparent\)/,
    )
    expect(css).toContain('--_pattern-size: var(--pattern-size, 24px)')
    expect(css).toContain('--_pattern-size: var(--pattern-size, 40px)')
    expect(css).toContain('--_pattern-size: var(--pattern-size, 10px)')
    expect(css).toContain(
      '--_pattern-line-width: var(--pattern-line-width, 1px)',
    )
    expect(css).toContain('--_pattern-dot-size: var(--pattern-dot-size, 2px)')
    expect(css).toContain('--_pattern-duration: var(--pattern-duration, 4s)')
    expect(css).toContain(
      'background-size: var(--_pattern-size) var(--_pattern-size)',
    )
    // Hexagons are a mask over a token colour.
    expect(css).toMatch(
      /:host\(\[variant='hexagons'\]\) \.pattern \{[^}]*background-color: var\(--_pattern-color\);[^}]*mask-image: url\("data:image\/svg\+xml,/,
    )
  })

  it('fades with a mask on the layer for each fade', () => {
    for (const fade of ['radial', 'top', 'bottom', 'edges']) {
      expect(css).toMatch(
        new RegExp(
          `:host\\(\\[fade='${fade}'\\]\\) \\[part='background'\\] \\{[^}]*mask-image:`,
        ),
      )
    }
    expect(css).toContain('mask-composite: intersect')
  })

  describe('lit cells', () => {
    it('lights `count` cells on an animated grid, and none when not animated', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated></moul-pattern>`,
      )
      expect(el.hasAttribute('is-animated')).toBe(true)
      expect(cells(el)).toHaveLength(12)
      el.count = 5
      await el.updateComplete
      expect(cells(el)).toHaveLength(5)
      el.isAnimated = false
      await el.updateComplete
      expect(cells(el)).toHaveLength(0)
    })

    it('lights dots too, but drifts the other variants instead', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern is-animated count="3"></moul-pattern>`,
      )
      expect(cells(el)).toHaveLength(3)
      for (const variant of ['stripes', 'lines', 'hexagons'] as const) {
        el.variant = variant
        await el.updateComplete
        expect(cells(el)).toHaveLength(0)
        expect(css).toMatch(
          new RegExp(
            `:host\\(\\[is-animated\\]\\[variant='${variant}'\\]\\) \\.pattern`,
          ),
        )
      }
      expect(css).toMatch(
        /animation: moul-pattern-drift var\(--_pattern-duration\) linear infinite/,
      )
    })

    it('clamps count between 1 and 64, and falls back to 12', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated count="0"></moul-pattern>`,
      )
      expect(el.count).toBe(1)
      expect(cells(el)).toHaveLength(1)
      el.count = 500
      await el.updateComplete
      expect(el.count).toBe(64)
      expect(cells(el)).toHaveLength(64)
      el.count = Number.NaN
      await el.updateComplete
      expect(el.count).toBe(12)
      expect(cells(el)).toHaveLength(12)
    })

    it('places every cell inside the whole cells that fit, by column and row', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated count="20"></moul-pattern>`,
      )
      await layOut(el, 400, 200, 40)
      const placed = cells(el).map(position)
      expect(placed).toHaveLength(20)
      for (const { x, y } of placed) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThan(10)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThan(5)
      }
      // Ten by five has room for twenty cells apart.
      expect(new Set(placed.map(({ x, y }) => `${x},${y}`)).size).toBe(20)
      // The stylesheet places them in units of the same cell size the pattern tiles by.
      expect(css).toContain(
        'left: calc(var(--_pattern-x) * var(--_pattern-size))',
      )
      expect(css).toContain(
        'top: calc(var(--_pattern-y) * var(--_pattern-size))',
      )
    })

    it('moves only the cells a resize leaves outside', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated count="30"></moul-pattern>`,
      )
      await layOut(el, 400, 400, 40)
      const before = cells(el).map(position)
      await layOut(el, 200, 120, 40)
      const after = cells(el).map(position)
      for (const [index, cell] of after.entries()) {
        expect(cell.x).toBeLessThan(5)
        expect(cell.y).toBeLessThan(3)
        const old = before[index]
        if (old && old.x < 5 && old.y < 3) expect(cell).toEqual(old)
      }
    })

    it('measures the cell size, so a larger cell fits fewer columns', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern is-animated count="40"></moul-pattern>`,
      )
      await layOut(el, 240, 48, 48)
      for (const { x, y } of cells(el).map(position)) {
        expect(x).toBeLessThan(5)
        expect(y).toBe(0)
      }
    })

    it('lights a cell somewhere new each time its cycle ends', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated count="2"></moul-pattern>`,
      )
      // Always guessing the first cell, the second cell walks on to the next free one.
      const random = vi.spyOn(Math, 'random').mockReturnValue(0)
      await layOut(el, 400, 400, 40)
      expect(cells(el).map(position)).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ])
      random.mockReturnValue(0.95)
      const [first, second] = cells(el)
      const untouched = position(second as HTMLElement)
      first?.dispatchEvent(
        new AnimationEvent('animationiteration', {
          animationName: 'moul-pattern-flicker',
          bubbles: true,
        }),
      )
      await el.updateComplete
      expect(random).toHaveBeenCalled()
      expect(position(cells(el)[0] as HTMLElement)).toEqual({ x: 9, y: 9 })
      expect(position(cells(el)[1] as HTMLElement)).toEqual(untouched)
    })

    it('spreads the cells across one cycle, and times them by --pattern-duration', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated count="4"></moul-pattern>`,
      )
      expect(
        cells(el).map((cell) =>
          cell.style.getPropertyValue('--_pattern-phase'),
        ),
      ).toEqual(['0', '0.25', '0.5', '0.75'])
      expect(css).toMatch(
        /animation: moul-pattern-flicker var\(--_pattern-duration\) ease-in-out\s+calc\(var\(--_pattern-duration\) \* var\(--_pattern-phase\) \* -1\) infinite/,
      )
      expect(css).toContain('@keyframes moul-pattern-flicker')
    })
  })

  it('drifts toward the inline end, so the other way in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \[part='background'\] \{\s*--_pattern-drift-sign: -1;/,
    )
    expect(css).toContain(
      'translate: calc(var(--_pattern-tile-x) * var(--_pattern-drift-sign)) 0',
    )
  })

  it('pauses its animations while off screen and resumes them on return', async () => {
    const el = await fixture<MoulPattern>(
      html`<moul-pattern variant="grid" is-animated></moul-pattern>`,
    )
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching sizes when removed', async () => {
    const el = await fixture<MoulPattern>(
      html`<moul-pattern variant="grid" is-animated count="3"></moul-pattern>`,
    )
    await layOut(el, 400, 400, 40)
    const before = cells(el).map(position)
    el.remove()
    triggerResize(el, { width: 40, height: 40 })
    await el.updateComplete
    expect(cells(el).map(position)).toEqual(before)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the pattern is hidden from screen readers', async () => {
      const el = await fixture<MoulPattern>(
        html`<moul-pattern variant="grid" is-animated
          ><a href="#start">Get started</a></moul-pattern
        >`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(layer(el).getAttribute('aria-hidden')).toBe('true')
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
      // The content stays reachable: the slot sits outside the hidden layer.
      expect(layer(el).querySelector('slot')).toBeNull()
      expect(el.querySelector('a')?.getAttribute('href')).toBe('#start')
    })

    it('does not draw the pattern where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part='background'\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('stops the drift and the flicker, and holds the lit cells still at different strengths', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.pattern \{\s*animation: none !important;/)
      expect(block).toMatch(
        /\.cell \{\s*animation: none !important;\s*opacity: calc\(0\.35 \+ var\(--_pattern-phase\) \* 0\.5\);/,
      )
    })
  })
})
