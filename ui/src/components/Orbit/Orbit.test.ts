import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Orbit'
import type { MoulOrbit } from './Orbit'
import { orbitStyles } from './Orbit.styles'

const css = orbitStyles.cssText

/** Lets slotchange events and the render they cause run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

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

const shadow = (el: MoulOrbit) => el.shadowRoot as ShadowRoot
const part = (el: MoulOrbit, name: string) =>
  shadow(el).querySelector<HTMLElement>(`[part="${name}"]`)
const indexOf = (item: Element) =>
  (item as HTMLElement).style.getPropertyValue('--moul-orbit-index')

describe('<moul-orbit>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('carries its items on a ring, with the centre slot beneath', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit>
        <span>A</span><span>B</span>
        <strong slot="center">Hub</strong>
      </moul-orbit>`,
    )
    expect(part(el, 'orbit')).not.toBeNull()
    expect(part(el, 'ring')?.querySelector('slot:not([name])')).not.toBeNull()
    expect(
      part(el, 'center')?.querySelector('slot[name="center"]'),
    ).not.toBeNull()
    const order = [...(part(el, 'orbit')?.children ?? [])].map((child) =>
      child.getAttribute('part'),
    )
    expect(order).toEqual(['center', 'ring'])
  })

  it('applies its defaults', async () => {
    const el = await fixture<MoulOrbit>(html`<moul-orbit></moul-orbit>`)
    expect(el.radius).toBe(120)
    expect(el.duration).toBe(20)
    expect(el.isReverse).toBe(false)
    expect(el.showPath).toBe(false)
    expect(el.pauseOnHover).toBe(false)
    const orbit = part(el, 'orbit') as HTMLElement
    expect(orbit.style.getPropertyValue('--_orbit-radius')).toBe('120px')
    expect(orbit.style.getPropertyValue('--_orbit-duration')).toBe('20s')
  })

  it('sets the radius and duration on its own shadow square, never on the host', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit radius="80" duration="12"></moul-orbit>`,
    )
    const orbit = part(el, 'orbit') as HTMLElement
    expect(orbit.style.getPropertyValue('--_orbit-radius')).toBe('80px')
    expect(orbit.style.getPropertyValue('--_orbit-duration')).toBe('12s')
    expect(el.style.getPropertyValue('--_orbit-radius')).toBe('')
    expect(el.style.length).toBe(0)
  })

  it('falls back to the defaults for a radius or duration that is not positive', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit radius="-4" duration="0"></moul-orbit>`,
    )
    const orbit = part(el, 'orbit') as HTMLElement
    expect(orbit.style.getPropertyValue('--_orbit-radius')).toBe('120px')
    expect(orbit.style.getPropertyValue('--_orbit-duration')).toBe('20s')
  })

  it('numbers each item and counts them on the ring, leaving the centre out', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit>
        <span>A</span><span>B</span><span>C</span>
        <strong slot="center">Hub</strong>
      </moul-orbit>`,
    )
    const [a, b, c, hub] = [...el.children]
    expect([indexOf(a), indexOf(b), indexOf(c)]).toEqual(['0', '1', '2'])
    expect(indexOf(hub)).toBe('')
    expect(part(el, 'ring')?.style.getPropertyValue('--_orbit-count')).toBe('3')
  })

  it('re-spaces the items when one is added or removed, and clears the one that left', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit><span>A</span><span>B</span></moul-orbit>`,
    )
    const added = document.createElement('span')
    el.prepend(added)
    await settle()
    await el.updateComplete
    expect([...el.children].map(indexOf)).toEqual(['0', '1', '2'])
    expect(part(el, 'ring')?.style.getPropertyValue('--_orbit-count')).toBe('3')

    const [, first] = [...el.children]
    first.remove()
    await settle()
    await el.updateComplete
    expect(indexOf(first)).toBe('')
    expect([...el.children].map(indexOf)).toEqual(['0', '1'])
    expect(part(el, 'ring')?.style.getPropertyValue('--_orbit-count')).toBe('2')
  })

  it('clears an item that moves to the centre slot', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit><span>A</span><span>B</span></moul-orbit>`,
    )
    const [a, b] = [...el.children]
    a.setAttribute('slot', 'center')
    await settle()
    await el.updateComplete
    expect(indexOf(a)).toBe('')
    expect(indexOf(b)).toBe('0')
  })

  it('takes its numbers back when removed, and gives them again when reconnected', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit><span>A</span><span>B</span></moul-orbit>`,
    )
    const parent = el.parentElement as HTMLElement
    const items = [...el.children]
    el.remove()
    expect(items.map(indexOf)).toEqual(['', ''])
    parent.append(el)
    expect(items.map(indexOf)).toEqual(['0', '1'])
  })

  it('lets a nested orbit in the centre number its own items', async () => {
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit radius="140">
        <span>Outer 1</span><span>Outer 2</span><span>Outer 3</span>
        <moul-orbit slot="center" radius="70" is-reverse>
          <span>Inner 1</span><span>Inner 2</span>
        </moul-orbit>
      </moul-orbit>`,
    )
    const inner = el.querySelector('moul-orbit') as MoulOrbit
    await inner.updateComplete
    expect(indexOf(inner)).toBe('')
    expect([...inner.children].map(indexOf)).toEqual(['0', '1'])
    expect(part(inner, 'ring')?.style.getPropertyValue('--_orbit-count')).toBe(
      '2',
    )
    expect(
      part(inner, 'orbit')?.style.getPropertyValue('--_orbit-radius'),
    ).toBe('70px')
    expect(inner.getAttribute('is-reverse')).toBe('')
  })

  it('runs no animation on the items, so they never depend on a shadow root’s keyframes', () => {
    const slotted = /\.ring > slot::slotted\(\*\) \{([^}]*)\}/.exec(css)?.[1]
    expect(slotted).toBeDefined()
    expect(slotted).not.toMatch(/animation/)
  })

  it('draws the path only with show-path, hidden from screen readers', async () => {
    const el = await fixture<MoulOrbit>(html`<moul-orbit></moul-orbit>`)
    expect(part(el, 'path')).toBeNull()
    el.showPath = true
    await el.updateComplete
    expect(el.hasAttribute('show-path')).toBe(true)
    expect(part(el, 'path')?.getAttribute('aria-hidden')).toBe('true')
    expect(css).toContain(
      'border: 1px solid var(--orbit-path-color, var(--color-border))',
    )
  })

  it('sizes itself as twice the radius plus one item', () => {
    expect(css).toContain('--_orbit-item-size: var(--orbit-item-size, 2.5rem)')
    expect(css).toMatch(
      /--_orbit-side: calc\(\s*2 \* var\(--_orbit-radius, 120px\) \+ var\(--_orbit-item-size\)\s*\)/,
    )
  })

  it('places each item on the ring with cos() and sin(), and turns it back to stay upright', () => {
    expect(css).toMatch(
      /--_orbit-angle: calc\(\s*var\(--moul-orbit-index, 0\) \/ var\(--_orbit-count, 1\) \* 1turn - 0\.25turn\s*\)/,
    )
    expect(css).toMatch(
      /cos\(var\(--_orbit-angle\)\) \* var\(--_orbit-radius\)/,
    )
    expect(css).toMatch(
      /sin\(var\(--_orbit-angle\)\) \* var\(--_orbit-radius\)/,
    )
    // The ring animates one inherited angle; it turns by it and each item turns back by it.
    expect(css).toMatch(
      /@keyframes moul-orbit-turn \{[^@]*--moul-orbit-turn: 1turn;/,
    )
    expect(css).toMatch(
      /\.ring \{[^}]*rotate: var\(--moul-orbit-turn, 0turn\);[^}]*animation: moul-orbit-turn var\(--_orbit-duration, 20s\) linear infinite;/,
    )
    expect(css).toMatch(
      /\.ring > slot::slotted\(\*\) \{[^}]*rotate: calc\(var\(--moul-orbit-turn, 0turn\) \* -1\);/,
    )
  })

  it('turns the other way with is-reverse, and mirrors in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(\[is-reverse\]\) \.orbit \{[^}]*--_orbit-direction: reverse;/,
    )
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \.orbit \{[^}]*--_orbit-sign: -1;[^}]*--_orbit-direction: reverse;/,
    )
    expect(css).toMatch(
      /:host\(\[is-reverse\]:dir\(rtl\)\) \.orbit \{[^}]*--_orbit-direction: normal;/,
    )
  })

  it('pauses on hover only with pause-on-hover, and always while off screen', async () => {
    expect(css).toContain(':host([pause-on-hover]:hover) .ring')
    expect(css).toMatch(
      /\.is-offscreen \.ring \{\s*animation-play-state: paused;/,
    )
    const el = await fixture<MoulOrbit>(
      html`<moul-orbit pause-on-hover><span>A</span></moul-orbit>`,
    )
    expect(el.pauseOnHover).toBe(true)
    io.enter(el)
    await el.updateComplete
    expect(part(el, 'orbit')?.classList.contains('is-offscreen')).toBe(false)
    io.leave(el)
    await el.updateComplete
    expect(part(el, 'orbit')?.classList.contains('is-offscreen')).toBe(true)
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; items keep their own', async () => {
      const el = await fixture<MoulOrbit>(
        html`<moul-orbit>
          <a href="#docs">Docs</a>
          <img alt="Lit" src="data:," />
        </moul-orbit>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(shadow(el).querySelector('[tabindex]')).toBeNull()
      expect(shadow(el).querySelector('[role]')).toBeNull()
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
      expect(link.hasAttribute('aria-hidden')).toBe(false)
    })

    it('holds still while focus is inside', () => {
      expect(css).toMatch(
        /:host\(:focus-within\) \.ring,[^{]*\{\s*animation-play-state: paused;/,
      )
    })

    it('keeps the centre and the items clickable under the turning layer', () => {
      expect(css).toMatch(/\.ring \{[^}]*pointer-events: none;/)
      expect(css).toMatch(
        /\.ring > slot::slotted\(\*\) \{[^}]*pointer-events: auto;/,
      )
      expect(css).toMatch(
        /\.center > slot::slotted\(\*\) \{[^}]*pointer-events: auto;/,
      )
    })

    it('drops the path where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toMatch(/\.path \{[^}]*display: none;/)
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock | null = null

    afterEach(() => {
      motion?.restore()
      motion = null
    })

    it('stops the ring and every item, which rest upright at their places', async () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.ring \{\s*animation: none !important;/)
      motion = mockReducedMotion(true)
      const el = await fixture<MoulOrbit>(
        html`<moul-orbit><span>A</span><span>B</span></moul-orbit>`,
      )
      // The places come from the index alone, so a still orbit still spaces its items.
      expect([...el.children].map(indexOf)).toEqual(['0', '1'])
    })
  })
})
