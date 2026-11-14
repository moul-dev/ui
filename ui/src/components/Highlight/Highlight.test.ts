import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  triggerResize,
} from '../../test-setup'
import './Highlight'
import type { MoulHighlight } from './Highlight'
import { highlightStyles } from './Highlight.styles'

const css = highlightStyles.cssText

const svgOf = (el: MoulHighlight) =>
  el.shadowRoot!.querySelector<SVGSVGElement>('svg')

const pathOf = (el: MoulHighlight) =>
  el.shadowRoot!.querySelector<SVGPathElement>('path')

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

describe('<moul-highlight>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('renders the words as a yellow marker by default, not yet drawn', async () => {
    const el = await fixture<MoulHighlight>(
      html`<moul-highlight>the phrase that matters</moul-highlight>`,
    )
    expect(el.effect).toBe('marker')
    expect(el.tone).toBe('warning')
    expect(el.getAttribute('effect')).toBe('marker')
    expect(el.getAttribute('tone')).toBe('warning')
    expect(el.isDrawn).toBe(false)
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(svgOf(el)).toBeNull()
  })

  it('draws once, the first time it enters the viewport', async () => {
    const el = await fixture<MoulHighlight>(
      html`<moul-highlight>words</moul-highlight>`,
    )
    io.enter(el)
    await el.updateComplete
    expect(el.isDrawn).toBe(true)
    expect(el.hasAttribute('is-drawn')).toBe(true)

    // Once: the observer lets go after the first entry.
    expect(io.targets).not.toContain(el)
    io.leave(el)
    await el.updateComplete
    expect(el.isDrawn).toBe(true)
  })

  it('redraws with play(): erased for a moment, then drawn', async () => {
    const el = await fixture<MoulHighlight>(
      html`<moul-highlight>words</moul-highlight>`,
    )
    io.enter(el)
    await el.updateComplete
    // Each record holds the value before the change: '' while drawn, null while erased.
    const before: Array<string | null> = []
    const observer = new MutationObserver((records) => {
      for (const record of records) before.push(record.oldValue)
    })
    observer.observe(el, {
      attributeFilter: ['is-drawn'],
      attributeOldValue: true,
    })
    await el.play()
    await new Promise((resolve) => setTimeout(resolve))
    observer.disconnect()
    expect(before).toEqual(['', null])
    expect(el.isDrawn).toBe(true)
  })

  it('draws at once where IntersectionObserver is missing', async () => {
    io.restore()
    const original = globalThis.IntersectionObserver
    // @ts-expect-error: simulating a runtime without the API
    delete globalThis.IntersectionObserver
    try {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight>words</moul-highlight>`,
      )
      await el.updateComplete
      expect(el.isDrawn).toBe(true)
    } finally {
      globalThis.IntersectionObserver = original
    }
  })

  it('writes its timing as CSS variables', async () => {
    const el = await fixture<MoulHighlight>(
      html`<moul-highlight delay="200" duration="900">words</moul-highlight>`,
    )
    expect(el.style.getPropertyValue('--_delay')).toBe('200ms')
    expect(el.style.getPropertyValue('--_duration')).toBe('900ms')
  })

  it('falls back to marker and warning for unknown values', async () => {
    const el = await fixture<MoulHighlight>(
      html`<moul-highlight effect="zigzag" tone="purple">words</moul-highlight>`,
    )
    await el.updateComplete
    expect(el.effect).toBe('marker')
    expect(el.tone).toBe('warning')
    el.tone = 'success'
    await el.updateComplete
    expect(el.getAttribute('tone')).toBe('success')
  })

  it('takes the mark colour from the tone, or from --highlight-color', () => {
    expect(css).toContain('--_highlight-tone: var(--color-warning)')
    for (const [tone, token] of [
      ['primary', '--color-accent'],
      ['accent', '--color-primary-500'],
      ['success', '--color-success'],
      ['error', '--color-danger'],
    ]) {
      expect(css).toContain(
        `:host([tone="${tone}"]) {\n    --_highlight-tone: var(${token});`,
      )
    }
    expect(css).toContain(
      '--_highlight-color: var(--highlight-color, var(--_highlight-tone))',
    )
    // The marker is translucent; the strokes are solid.
    expect(css).toContain(
      'color-mix(in oklab, var(--_highlight-color) 40%, transparent)',
    )
    expect(css).toContain('stroke: var(--_highlight-color)')
  })

  it('grows marker and underline from the inline start, line after line', () => {
    expect(css).toMatch(/:host\(:dir\(rtl\)\) \{\s*--_highlight-x: 100%;/)
    expect(css).toContain('background-position: var(--_highlight-x) 100%')
    expect(css).toContain('background-size: 0% 100%')
    expect(css).toMatch(
      /:host\(\[effect="marker"\]\[is-drawn\]\) \{\s*background-size: 100% 100%;/,
    )
    // The default slice decoration is what draws one line after another.
    expect(css).not.toContain('box-decoration-break: clone')
  })

  describe('box and circle', () => {
    it('draws a hand-drawn path, one unit long, in an SVG sized to the words', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="box">words</moul-highlight>`,
      )
      const svg = svgOf(el)!
      expect(svg).not.toBeNull()
      expect(pathOf(el)?.getAttribute('pathLength')).toBe('1')
      // Nothing to draw until the SVG has a size.
      expect(pathOf(el)?.hasAttribute('d')).toBe(false)

      triggerResize(svg, { width: 120, height: 40 })
      await el.updateComplete
      expect(svg.getAttribute('viewBox')).toBe('0 0 120 40')
      const box = pathOf(el)?.getAttribute('d') ?? ''
      expect(box).toMatch(/^M[\d. ]+Q/)

      triggerResize(svg, { width: 200, height: 40 })
      await el.updateComplete
      expect(svg.getAttribute('viewBox')).toBe('0 0 200 40')
      expect(pathOf(el)?.getAttribute('d')).not.toBe(box)
    })

    it('draws an ellipse for circle that stays inside its box', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="circle">words</moul-highlight>`,
      )
      triggerResize(svgOf(el)!, { width: 160, height: 60 })
      await el.updateComplete
      const d = pathOf(el)?.getAttribute('d') ?? ''
      const numbers = d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number)
      expect(numbers.length).toBeGreaterThan(100)
      for (let i = 0; i < numbers.length; i += 2) {
        expect(numbers[i]).toBeGreaterThanOrEqual(0)
        expect(numbers[i]).toBeLessThanOrEqual(160)
        expect(numbers[i + 1]).toBeGreaterThanOrEqual(0)
        expect(numbers[i + 1]).toBeLessThanOrEqual(60)
      }
    })

    it('keeps the words on one line and mirrors the shape in right-to-left text', () => {
      expect(css).toMatch(
        /:host\(\[effect="box"\]\),\s*:host\(\[effect="circle"\]\) \{\s*display: inline-block;\s*position: relative;\s*white-space: nowrap;/,
      )
      expect(css).toMatch(
        /:host\(:dir\(rtl\)\) svg \{\s*transform: scaleX\(-1\);/,
      )
    })

    it('draws the stroke with a dash offset, erasing instantly for a replay', () => {
      expect(css).toContain('stroke-dasharray: 1 2')
      expect(css).toContain('stroke-dashoffset: 1.05')
      expect(css).toMatch(
        /:host\(\[is-drawn\]\) path \{\s*stroke-dashoffset: 0;/,
      )
      // The transition is only on the drawn state.
      expect(css).toMatch(
        /:host\(\[is-drawn\]\),\s*:host\(\[is-drawn\]\) path \{\s*transition-property: background-size, stroke-dashoffset;/,
      )
    })

    it('drops the SVG when switching back to marker', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="circle">words</moul-highlight>`,
      )
      el.effect = 'underline'
      await el.updateComplete
      expect(svgOf(el)).toBeNull()
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and reads the words as they are', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="circle"><mark>the phrase</mark></moul-highlight>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(el.textContent).toBe('the phrase')
      expect(
        el.shadowRoot?.querySelector('slot')?.closest('[aria-hidden]'),
      ).toBeNull()
    })

    it('hides the drawn mark from screen readers', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="box">words</moul-highlight>`,
      )
      expect(svgOf(el)?.getAttribute('aria-hidden')).toBe('true')
    })

    it('lets a slotted <mark> keep its meaning without the browser’s yellow', () => {
      expect(css).toMatch(
        /::slotted\(mark\) \{\s*background: none;\s*color: inherit;/,
      )
    })
  })

  describe('reduced motion', () => {
    it('shows the mark drawn from the start, with no transition', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce), print')
      expect(block).toBeDefined()
      expect(block).toContain('transition: none !important')
      expect(block).toContain('background-size: 100% 100% !important')
      expect(block).toContain(
        'background-size: 100% var(--_highlight-thickness) !important',
      )
      expect(block).toContain('stroke-dashoffset: 0 !important')
    })
  })

  describe('cleanup', () => {
    it('stops watching the viewport and the shape size when removed', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="box">words</moul-highlight>`,
      )
      const svg = svgOf(el)!
      triggerResize(svg, { width: 100, height: 30 })
      await el.updateComplete
      expect(io.targets).toContain(el)

      el.remove()
      expect(io.targets).not.toContain(el)
      triggerResize(svg, { width: 300, height: 30 })
      await el.updateComplete
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 30')
    })

    it('measures again when put back on the page', async () => {
      const el = await fixture<MoulHighlight>(
        html`<moul-highlight effect="box">words</moul-highlight>`,
      )
      const parent = el.parentElement!
      el.remove()
      parent.append(el)
      triggerResize(svgOf(el)!, { width: 80, height: 24 })
      await el.updateComplete
      expect(svgOf(el)?.getAttribute('viewBox')).toBe('0 0 80 24')
    })
  })
})
