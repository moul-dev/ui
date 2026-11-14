import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './Ripple'
import type { MoulRipple } from './Ripple'
import { rippleStyles } from './Ripple.styles'

const css = rippleStyles.cssText

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

const layer = (el: MoulRipple) =>
  el.shadowRoot?.querySelector('[part="background"]') as HTMLElement

const rings = (el: MoulRipple) => [
  ...(el.shadowRoot?.querySelectorAll<HTMLElement>('.ring') ?? []),
]

describe('<moul-ripple>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('draws six rings behind its content by default, numbered from the inside out', async () => {
    const el = await fixture<MoulRipple>(
      html`<moul-ripple><button>Join the call</button></moul-ripple>`,
    )
    expect(el.count).toBe(6)
    expect(rings(el)).toHaveLength(6)
    expect(
      rings(el).map((ring) => ring.style.getPropertyValue('--_ripple-index')),
    ).toEqual(['0', '1', '2', '3', '4', '5'])
    expect(layer(el).style.getPropertyValue('--_ripple-count')).toBe('6')
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(el.querySelector('button')?.textContent).toBe('Join the call')
  })

  it('puts the decorative layer behind the slot and centres the content', async () => {
    const el = await fixture<MoulRipple>(html`<moul-ripple>Live</moul-ripple>`)
    const children = [...(el.shadowRoot?.children ?? [])].filter(
      (child) => child.tagName !== 'STYLE',
    )
    expect(children[0]?.getAttribute('part')).toBe('background')
    expect(children[1]?.tagName).toBe('SLOT')
    expect(css).toMatch(
      /\[part='background'\] \{[^}]*position: absolute;[^}]*inset: 0;[^}]*z-index: -1;[^}]*overflow: hidden;[^}]*border-radius: inherit;[^}]*pointer-events: none;/,
    )
    expect(css).toMatch(
      /:host \{[^}]*display: grid;[^}]*place-content: center;[^}]*justify-items: center;[^}]*position: relative;[^}]*isolation: isolate;/,
    )
    expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
  })

  it('clamps count between 1 and 12, and falls back to 6', async () => {
    const el = await fixture<MoulRipple>(
      html`<moul-ripple count="0"></moul-ripple>`,
    )
    expect(el.count).toBe(1)
    expect(rings(el)).toHaveLength(1)
    el.count = 40
    await el.updateComplete
    expect(el.count).toBe(12)
    expect(rings(el)).toHaveLength(12)
    expect(layer(el).style.getPropertyValue('--_ripple-count')).toBe('12')
    el.count = Number.NaN
    await el.updateComplete
    expect(el.count).toBe(6)
    expect(rings(el)).toHaveLength(6)
  })

  it('grows each ring by a fixed step and makes it fainter outward', () => {
    expect(css).toContain(
      'width: calc(var(--_ripple-size) + var(--_ripple-gap) * var(--_ripple-index))',
    )
    expect(css).toContain(
      '--_ripple-strength: calc(1 - var(--_ripple-index) / var(--_ripple-count, 6))',
    )
    expect(css).toMatch(
      /background-color: color-mix\(\s*in oklab,\s*var\(--_ripple-color\) calc\(var\(--_ripple-strength\) \* 3\.5%\),\s*transparent\s*\)/,
    )
    expect(css).toContain('--_ripple-size: var(--ripple-size, 10rem)')
    expect(css).toContain('--_ripple-gap: var(--ripple-gap, 4.5rem)')
    expect(css).toContain(
      '--_ripple-color: var(--ripple-color, var(--color-fg))',
    )
    expect(css).toContain('--_ripple-duration: var(--ripple-duration, 2s)')
  })

  it('fades the outer rings with a mask, so the effect has no hard edge', () => {
    expect(css).toMatch(
      /--_ripple-reach: calc\(\s*\(var\(--_ripple-size\) \+ var\(--_ripple-gap\) \* var\(--_ripple-count, 6\)\) \/ 2\s*\)/,
    )
    expect(css).toMatch(
      /mask-image: radial-gradient\(\s*circle var\(--_ripple-reach\) at 50% 50%,\s*black 30%,\s*transparent\s*\)/,
    )
  })

  it('pulses the rings in sequence, outward, timed by --ripple-duration', () => {
    expect(css).toContain('@keyframes moul-ripple-pulse')
    expect(css).toMatch(
      /animation: moul-ripple-pulse var\(--_ripple-duration\) ease-in-out\s+calc\(var\(--_ripple-duration\) \* var\(--_ripple-index\) \* 0\.04\) infinite/,
    )
  })

  it('pauses the pulse while off screen and resumes it on return', async () => {
    const el = await fixture<MoulRipple>(html`<moul-ripple></moul-ripple>`)
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the rings are hidden from screen readers', async () => {
      const el = await fixture<MoulRipple>(
        html`<moul-ripple><a href="#call">Join the call</a></moul-ripple>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(layer(el).getAttribute('aria-hidden')).toBe('true')
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
      expect(layer(el).querySelector('slot')).toBeNull()
      expect(el.querySelector('a')?.getAttribute('href')).toBe('#call')
    })

    it('does not draw the rings where the system forces its colours', () => {
      const block = mediaBlock('(forced-colors: active)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\[part='background'\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('holds the rings still at their resting size', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toMatch(/\.ring \{\s*animation: none !important;/)
      // At rest every ring is at full size: the pulse only shrinks them mid-way.
      expect(css).toMatch(/0%,\s*100% \{\s*scale: 1;/)
    })
  })
})
