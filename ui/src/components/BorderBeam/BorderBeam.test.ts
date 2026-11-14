import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './BorderBeam'
import type { MoulBorderBeam } from './BorderBeam'
import { borderBeamStyles } from './BorderBeam.styles'

/** The stylesheet without its comments. */
const css = borderBeamStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

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

/** The declarations of the first rule whose whole selector list is `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match?.[1] ?? ''
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

const ring = (el: MoulBorderBeam) =>
  el.shadowRoot?.querySelector('[part="border"]') as HTMLElement

describe('<moul-border-beam>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('renders its content through a slot, with a ring and a beam after it', async () => {
    const el = await fixture<MoulBorderBeam>(
      html`<moul-border-beam><p>Pro plan</p></moul-border-beam>`,
    )
    const slot = el.shadowRoot?.querySelector('slot')
    expect(slot).not.toBeNull()
    expect(slot?.assignedElements().map((node) => node.textContent)).toEqual([
      'Pro plan',
    ])
    expect(ring(el)).not.toBeNull()
    expect(ring(el).querySelector('.beam')).not.toBeNull()
    // The ring comes after the content, so it paints over the content's edge.
    expect(slot?.compareDocumentPosition(ring(el))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('travels forwards by default and reflects is-reverse', async () => {
    const el = await fixture<MoulBorderBeam>(
      html`<moul-border-beam></moul-border-beam>`,
    )
    expect(el.isReverse).toBe(false)
    expect(el.hasAttribute('is-reverse')).toBe(false)
    el.isReverse = true
    await el.updateComplete
    expect(el.getAttribute('is-reverse')).toBe('')
    el.removeAttribute('is-reverse')
    await el.updateComplete
    expect(el.isReverse).toBe(false)
  })

  describe('the border model', () => {
    it('is a positioned block with the card radius', () => {
      const host = rule(':host')
      expect(host).toContain('display: block')
      expect(host).toContain('position: relative')
      expect(host).toContain('border-radius: var(--radius-surface, 1.5rem)')
      expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
    })

    it('draws a ring over the content edge that never takes the pointer', () => {
      const border = rule('[part="border"]')
      expect(border).toContain('position: absolute')
      expect(border).toContain('inset: 0')
      expect(border).toContain('border-radius: inherit')
      expect(border).toContain('pointer-events: none')
      expect(border).toContain('padding: var(--_border-beam-width)')
      expect(border).toContain(
        '-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
      )
      expect(border).toContain('mask-composite: exclude')
      // It never pads or clips the content: only the ring has padding.
      expect(rule(':host')).not.toMatch(/\b(padding|overflow):/)
    })

    it('lets the pointer through when left empty as an overlay', () => {
      expect(css).toMatch(/:host\(:empty\) \{\s*pointer-events: none;/)
    })

    it('passes its radius to the slot, for content that inherits it', () => {
      expect(rule('slot')).toContain('border-radius: inherit')
    })
  })

  describe('the beam', () => {
    it('takes its sizes, timing and colours from custom properties with defaults', () => {
      const host = rule(':host')
      expect(host).toContain(
        '--_border-beam-size: var(--border-beam-size, 80px)',
      )
      expect(host).toContain(
        '--_border-beam-width: var(--border-beam-width, 1.5px)',
      )
      expect(host).toContain(
        '--_border-beam-duration: var(--border-beam-duration, 6s)',
      )
      expect(host).toContain(
        '--_border-beam-delay: var(--border-beam-delay, 0s)',
      )
      expect(host).toContain(
        '--_border-beam-from: var(--border-beam-color-from, var(--color-accent))',
      )
      expect(host).toContain(
        '--_border-beam-to: var(--border-beam-color-to, var(--color-chart-4))',
      )
    })

    it('moves round the ring’s own rounded edge, facing the way it goes', () => {
      const beam = rule('.beam')
      expect(beam).toContain('offset-path: border-box')
      expect(beam).toContain('offset-rotate: var(--_border-beam-rotate)')
      expect(beam).toContain('width: var(--_border-beam-size)')
      expect(beam).toContain('aspect-ratio: 1')
      expect(beam).toMatch(
        /linear-gradient\(\s*to left,\s*var\(--_border-beam-from\),\s*var\(--_border-beam-to\),\s*transparent\s*\)/,
      )
      expect(css).toMatch(
        /@keyframes moul-border-beam-travel \{\s*from \{\s*offset-distance: 0%;\s*\}\s*to \{\s*offset-distance: 100%;/,
      )
    })

    it('starts --border-beam-delay into its trip rather than waiting', () => {
      expect(rule('.beam')).toMatch(
        /animation: moul-border-beam-travel var\(--_border-beam-duration\) linear\s+calc\(var\(--_border-beam-delay\) \* -1\) infinite\s+var\(--_border-beam-direction\)/,
      )
    })

    it('runs backwards and turns round when reversed, and mirrors in right-to-left text', () => {
      expect(rule(':host')).toContain('--_border-beam-direction: normal')
      const reversed =
        /:host\(\[is-reverse\]\),\s*:host\(:dir\(rtl\)\) \{([^}]*)\}/.exec(
          css,
        )?.[1]
      expect(reversed).toContain('--_border-beam-direction: reverse')
      expect(reversed).toContain('--_border-beam-rotate: reverse')
      // Reversed in right-to-left text, it goes clockwise again.
      const both = rule(':host([is-reverse]:dir(rtl))')
      expect(both).toContain('--_border-beam-direction: normal')
      expect(both).toContain('--_border-beam-rotate: auto')
    })

    it('falls back to a turning conic ring where offset-path cannot take a box', () => {
      const fallback = block('@supports not (offset-path: border-box)')
      expect(fallback).toBeDefined()
      expect(fallback).toMatch(/\.beam \{\s*display: none;/)
      expect(fallback).toMatch(
        /conic-gradient\(\s*from var\(--moul-border-beam-angle, 0deg\),\s*var\(--_border-beam-stops\)\s*\)/,
      )
      expect(fallback).toContain('animation: moul-border-beam-turn')
      expect(css).toMatch(
        /@keyframes moul-border-beam-turn \{\s*to \{\s*--moul-border-beam-angle: 1turn;/,
      )
    })
  })

  it('pauses the beam while off screen and resumes it on return', async () => {
    const el = await fixture<MoulBorderBeam>(
      html`<moul-border-beam><p>Pro plan</p></moul-border-beam>`,
    )
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable, adds no role, and hides the ring', async () => {
      const el = await fixture<MoulBorderBeam>(
        html`<moul-border-beam><p>Pro plan</p></moul-border-beam>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(ring(el).getAttribute('aria-hidden')).toBe('true')
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('leaves the wrapped content reachable with Tab', async () => {
      const el = await fixture<MoulBorderBeam>(
        html`<moul-border-beam><button>Choose Pro</button></moul-border-beam>`,
      )
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('draws no ring where the system forces its colours, or on paper', () => {
      const forced = block('@media (forced-colors: active), print')
      expect(forced).toBeDefined()
      expect(forced).toMatch(/\[part="border"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('stops the beam and leaves a still highlight on its starting corner', () => {
      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toBeDefined()
      expect(reduced).toMatch(/\.beam \{\s*display: none;/)
      expect(reduced).toContain('animation: none !important')
      expect(reduced).toMatch(
        /radial-gradient\(\s*circle var\(--_border-beam-size\) at var\(--_border-beam-corner\)/,
      )
      expect(rule(':host')).toContain('--_border-beam-corner: 0 0')
      expect(rule(':host(:dir(rtl))')).toContain(
        '--_border-beam-corner: 100% 0',
      )
    })
  })
})
