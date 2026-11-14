import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './ShineBorder'
import type { MoulShineBorder } from './ShineBorder'
import { shineBorderStyles } from './ShineBorder.styles'

/** The stylesheet without its comments. */
const css = shineBorderStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of the first block (`@media`, `@keyframes`) whose prelude starts with `prelude`. */
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

const ring = (el: MoulShineBorder) =>
  el.shadowRoot?.querySelector('[part="border"]') as HTMLElement

describe('<moul-shine-border>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('renders its content through a slot, with the ring after it', async () => {
    const el = await fixture<MoulShineBorder>(
      html`<moul-shine-border><p>Team plan</p></moul-shine-border>`,
    )
    const slot = el.shadowRoot?.querySelector('slot')
    expect(slot?.assignedElements().map((node) => node.textContent)).toEqual([
      'Team plan',
    ])
    expect(ring(el)).not.toBeNull()
    expect(slot?.compareDocumentPosition(ring(el))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  describe('the border model', () => {
    it('is a positioned block with the card radius', () => {
      const host = rule(':host')
      expect(host).toContain('display: block')
      expect(host).toContain('position: relative')
      expect(host).toContain('border-radius: var(--radius-surface, 1.5rem)')
      expect(host).not.toMatch(/\b(padding|overflow):/)
      expect(css).toMatch(/:host\(\[hidden\]\) \{\s*display: none;/)
    })

    it('draws a masked ring over the content edge that never takes the pointer', () => {
      const border = rule('[part="border"]')
      expect(border).toContain('position: absolute')
      expect(border).toContain('inset: 0')
      expect(border).toContain('border-radius: inherit')
      expect(border).toContain('pointer-events: none')
      expect(border).toContain('padding: var(--_shine-border-width)')
      expect(border).toContain(
        '-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
      )
      expect(border).toContain('mask-composite: exclude')
    })

    it('lets the pointer through when left empty as an overlay', () => {
      expect(css).toMatch(/:host\(:empty\) \{\s*pointer-events: none;/)
      expect(rule('slot')).toContain('border-radius: inherit')
    })
  })

  describe('the shine', () => {
    it('takes its colours, width and duration from custom properties with token defaults', () => {
      const host = rule(':host')
      expect(host).toMatch(
        /--_shine-border-colors: var\(\s*--shine-border-colors,\s*var\(--color-accent\),\s*var\(--color-chart-4\),\s*var\(--color-chart-3\),\s*var\(--color-chart-2\)\s*\)/,
      )
      expect(host).toContain(
        '--_shine-border-width: var(--shine-border-width, 1px)',
      )
      expect(host).toContain(
        '--_shine-border-duration: var(--shine-border-duration, 14s)',
      )
    })

    it('slides a large radial band of the colours through the ring', () => {
      const border = rule('[part="border"]')
      expect(border).toMatch(
        /radial-gradient\(\s*transparent,\s*transparent,\s*var\(--_shine-border-colors\),\s*transparent,\s*transparent\s*\)/,
      )
      expect(border).toContain('background-size: 300% 300%')
      expect(border).toMatch(
        /animation: moul-shine-border-drift var\(--_shine-border-duration\)\s+ease-in-out infinite/,
      )
      const drift = block('@keyframes moul-shine-border-drift')
      expect(drift).toMatch(
        /0%,\s*100% \{\s*background-position: var\(--_shine-border-from\);/,
      )
      expect(drift).toMatch(
        /50% \{\s*background-position: var\(--_shine-border-to\);/,
      )
    })

    it('drifts from the top-right corner in right-to-left text', () => {
      expect(rule(':host')).toContain('--_shine-border-from: 0% 0%')
      const rtl = rule(':host(:dir(rtl))')
      expect(rtl).toContain('--_shine-border-from: 100% 0%')
      expect(rtl).toContain('--_shine-border-to: 0% 100%')
      expect(rtl).toContain('--_shine-border-still: to bottom left')
    })
  })

  it('pauses the drift while off screen and resumes it on return', async () => {
    const el = await fixture<MoulShineBorder>(
      html`<moul-shine-border><p>Team plan</p></moul-shine-border>`,
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
      const el = await fixture<MoulShineBorder>(
        html`<moul-shine-border><p>Team plan</p></moul-shine-border>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(ring(el).getAttribute('aria-hidden')).toBe('true')
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('leaves the wrapped content reachable with Tab', async () => {
      const el = await fixture<MoulShineBorder>(
        html`<moul-shine-border><a href="#team">Choose Team</a></moul-shine-border>`,
      )
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    it('draws no ring where the system forces its colours, or on paper', () => {
      const forced = block('@media (forced-colors: active), print')
      expect(forced).toMatch(/\[part="border"\] \{\s*display: none;/)
    })
  })

  describe('reduced motion', () => {
    it('stands the colours still, spread once round the whole ring', () => {
      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toBeDefined()
      expect(reduced).toContain('animation: none !important')
      expect(reduced).toMatch(
        /linear-gradient\(\s*var\(--_shine-border-still\),\s*var\(--_shine-border-colors\),\s*var\(--_shine-border-colors\)\s*\)/,
      )
      expect(reduced).toContain('background-size: 200% 200%')
      expect(rule(':host')).toContain('--_shine-border-still: to bottom right')
    })
  })
})
