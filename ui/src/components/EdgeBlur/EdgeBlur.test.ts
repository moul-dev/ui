import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './EdgeBlur'
import type { MoulEdgeBlur } from './EdgeBlur'
import { edgeBlurStyles } from './EdgeBlur.styles'

const css = edgeBlurStyles.cssText

/** The body of the first block (`@media`, `@supports`) whose prelude starts with `prelude`. */
function block(prelude: string): string | undefined {
  const start = css.indexOf(prelude)
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

const shadow = (el: MoulEdgeBlur) => el.shadowRoot as ShadowRoot
const edges = (el: MoulEdgeBlur) => [
  ...shadow(el).querySelectorAll<HTMLElement>('[part~="edge"]'),
]

describe('<moul-edge-blur>', () => {
  it('wraps its content in a content part between a start and an end band', async () => {
    const el = await fixture<MoulEdgeBlur>(
      html`<moul-edge-blur><p>Release notes</p></moul-edge-blur>`,
    )
    const parts = [...shadow(el).children].map((child) =>
      child.getAttribute('part'),
    )
    expect(parts).toEqual(['edge edge-start', 'content', 'edge edge-end'])
    const content = shadow(el).querySelector('[part="content"]')
    expect(content?.querySelector('slot:not([name])')).not.toBeNull()
    expect(el.textContent).toContain('Release notes')
  })

  it('defaults to vertical with both edges, reflected', async () => {
    const el = await fixture<MoulEdgeBlur>(
      html`<moul-edge-blur>Content</moul-edge-blur>`,
    )
    expect(el.orientation).toBe('vertical')
    expect(el.edges).toBe('both')
    expect(el.getAttribute('orientation')).toBe('vertical')
    expect(el.getAttribute('edges')).toBe('both')
  })

  it('stacks four blur layers of rising strength and a tint in each band', async () => {
    const el = await fixture<MoulEdgeBlur>(
      html`<moul-edge-blur>Content</moul-edge-blur>`,
    )
    for (const edge of edges(el)) {
      const layers = [...edge.querySelectorAll('.layer')].map(
        (layer) => layer.className,
      )
      expect(layers).toEqual([
        'layer blur layer-1',
        'layer blur layer-2',
        'layer blur layer-3',
        'layer blur layer-4',
        'layer tint',
      ])
    }
    expect(css).toContain(
      'backdrop-filter: blur(calc(var(--_edge-blur-strength) / 8))',
    )
    expect(css).toContain(
      'backdrop-filter: blur(calc(var(--_edge-blur-strength) / 4))',
    )
    expect(css).toContain(
      'backdrop-filter: blur(calc(var(--_edge-blur-strength) / 2))',
    )
    expect(css).toContain('backdrop-filter: blur(var(--_edge-blur-strength))')
    // Each layer is masked to its own stretch of the band, toward the edge.
    expect(
      css.match(/mask-image: linear-gradient\(var\(--_edge-blur-toward\)/g)
        ?.length,
    ).toBe(8)
  })

  it('renders only the start or the end band when asked, and falls back to both', async () => {
    const el = await fixture<MoulEdgeBlur>(
      html`<moul-edge-blur edges="start">Content</moul-edge-blur>`,
    )
    expect(edges(el).map((edge) => edge.getAttribute('part'))).toEqual([
      'edge edge-start',
    ])
    el.edges = 'end'
    await el.updateComplete
    expect(edges(el).map((edge) => edge.getAttribute('part'))).toEqual([
      'edge edge-end',
    ])
    el.setAttribute('edges', 'top')
    await el.updateComplete
    expect(el.edges).toBe('both')
    expect(edges(el)).toHaveLength(2)
  })

  it('takes a horizontal orientation and falls back to vertical for anything else', async () => {
    const el = await fixture<MoulEdgeBlur>(
      html`<moul-edge-blur orientation="horizontal">Content</moul-edge-blur>`,
    )
    expect(el.orientation).toBe('horizontal')
    el.setAttribute('orientation', 'diagonal')
    await el.updateComplete
    expect(el.orientation).toBe('vertical')
    expect(el.getAttribute('orientation')).toBe('vertical')
  })

  it('is the scroller, with sticky bands that take no space', () => {
    expect(css).toMatch(/:host \{[^}]*overflow: hidden auto;/)
    expect(css).toMatch(
      /:host\(\[orientation="horizontal"\]\) \{[^}]*overflow: auto hidden;/,
    )
    expect(css).toMatch(/\.edge \{[^}]*position: sticky;/)
    expect(css).toMatch(
      /\.edge\.start \{[^}]*inset-block-start: 0;[^}]*margin-block-end: calc\(-1 \* var\(--_edge-blur-size\)\);/,
    )
    expect(css).toMatch(
      /\.edge\.end \{[^}]*inset-block-end: 0;[^}]*margin-block-start: calc\(-1 \* var\(--_edge-blur-size\)\);/,
    )
  })

  it('takes its band length, strength and fade colour from CSS properties', () => {
    expect(css).toContain('--_edge-blur-size: var(--edge-blur-size, 4rem)')
    expect(css).toContain(
      '--_edge-blur-strength: var(--edge-blur-strength, 8px)',
    )
    expect(css).toContain(
      '--_edge-blur-fade-color: var(--edge-blur-fade-color, transparent)',
    )
    expect(css).toContain('gap: var(--edge-blur-gap, var(--spacing-4, 1rem))')
  })

  it('mirrors the horizontal bands in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(\[orientation="horizontal"\]\) \.edge\.start \{[^}]*inset-inline-start: 0;[^}]*--_edge-blur-toward: to left;/,
    )
    expect(css).toMatch(
      /:host\(\[orientation="horizontal"\]:dir\(rtl\)\) \.edge\.start \{[^}]*--_edge-blur-toward: to right;/,
    )
    expect(css).toMatch(
      /:host\(\[orientation="horizontal"\]:dir\(rtl\)\) \.edge\.end \{[^}]*--_edge-blur-toward: to left;/,
    )
  })

  it('fades each band with the scroll position where scroll timelines exist', () => {
    const supported = block('@supports (animation-timeline: scroll())')
    expect(supported).toBeDefined()
    expect(supported).toContain('animation-timeline: scroll(nearest block)')
    expect(supported).toContain('animation-timeline: scroll(nearest inline)')
    expect(supported).toMatch(
      /\.start \.layer \{[^}]*animation-name: moul-edge-blur-show;[^}]*animation-range: 0px var\(--_edge-blur-size\);/,
    )
    expect(supported).toMatch(
      /\.end \.layer \{[^}]*animation-name: moul-edge-blur-hide;[^}]*animation-range: calc\(100% - var\(--_edge-blur-size\)\) 100%;/,
    )
    // With nothing to scroll the timeline is inactive and the bands stay hidden.
    expect(supported).toMatch(/\.layer \{[^}]*opacity: 0;/)
  })

  it('pads the content clear of the bands where scroll timelines are missing', () => {
    const fallback = block('@supports not (animation-timeline: scroll())')
    expect(fallback).toBeDefined()
    expect(fallback).toContain(
      'padding-block: var(--_edge-blur-start) var(--_edge-blur-end)',
    )
    expect(fallback).toContain(
      'padding-inline: var(--_edge-blur-start) var(--_edge-blur-end)',
    )
    expect(css).toMatch(
      /:host\(\[edges="start"\]\) \{[^}]*--_edge-blur-end: 0px;/,
    )
    expect(css).toMatch(
      /:host\(\[edges="end"\]\) \{[^}]*--_edge-blur-start: 0px;/,
    )
  })

  describe('keyboard and screen readers', () => {
    it('joins the tab order so the keyboard can scroll it, with a focus ring', async () => {
      const el = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur>Content</moul-edge-blur>`,
      )
      expect(el.getAttribute('tabindex')).toBe('0')
      el.focus()
      expect(document.activeElement).toBe(el)
      expect(css).toMatch(
        /:host\(:focus-visible\) \{[^}]*outline: 2px solid var\(--color-focus/,
      )
    })

    it('keeps a tabindex the author set', async () => {
      const el = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur tabindex="-1">Content</moul-edge-blur>`,
      )
      expect(el.getAttribute('tabindex')).toBe('-1')
    })

    it('becomes a region only once it has a name', async () => {
      const el = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur>Content</moul-edge-blur>`,
      )
      expect(el.hasAttribute('role')).toBe(false)

      el.setAttribute('aria-label', 'Release notes')
      expect(el.getAttribute('role')).toBe('region')

      el.removeAttribute('aria-label')
      expect(el.hasAttribute('role')).toBe(false)

      el.setAttribute('aria-labelledby', 'notes-heading')
      expect(el.getAttribute('role')).toBe('region')
    })

    it('takes a region role from a label set in markup, and keeps a role the author set', async () => {
      const labelled = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur aria-label="Changelog">Content</moul-edge-blur>`,
      )
      expect(labelled.getAttribute('role')).toBe('region')

      const own = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur role="log" aria-label="Build log"
          >Content</moul-edge-blur
        >`,
      )
      expect(own.getAttribute('role')).toBe('log')
      own.removeAttribute('aria-label')
      expect(own.getAttribute('role')).toBe('log')
    })

    it('hides the bands from screen readers and from the pointer', async () => {
      const el = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur>Content</moul-edge-blur>`,
      )
      for (const edge of edges(el)) {
        expect(edge.getAttribute('aria-hidden')).toBe('true')
      }
      expect(css).toMatch(/\.edge \{[^}]*pointer-events: none;/)
      expect(css).toMatch(/\.edge \{[^}]*user-select: none;/)
    })

    it('keeps focused content clear of the blurred bands', () => {
      expect(css).toContain(
        'scroll-padding-block: var(--_edge-blur-start) var(--_edge-blur-end)',
      )
      expect(css).toContain(
        'scroll-padding-inline: var(--_edge-blur-start) var(--_edge-blur-end)',
      )
    })

    it('drops the blur where colours are forced, and on paper', () => {
      const forced = block('@media (forced-colors: active), print')
      expect(forced).toBeDefined()
      expect(forced).toMatch(/\.edge \{[^}]*display: none;/)
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock | null = null

    afterEach(() => {
      motion?.restore()
      motion = null
    })

    it('runs nothing on a timer, and keeps the scroll-linked fade, which only follows the reader', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulEdgeBlur>(
        html`<moul-edge-blur>Content</moul-edge-blur>`,
      )
      expect(edges(el)).toHaveLength(2)
      // Every animation is tied to the scroll position; none runs on time.
      const supported = block('@supports (animation-timeline: scroll())') ?? ''
      expect(supported).toContain('animation-duration: auto')
      expect(css).not.toMatch(/animation:\s*[\w-]+\s+\d/)
      expect(css).not.toContain('transition')
      expect(block('@media (prefers-reduced-motion')).toBeUndefined()
    })
  })
})
