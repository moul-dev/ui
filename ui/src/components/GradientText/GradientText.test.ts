import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './GradientText'
import type { MoulGradientText } from './GradientText'
import { gradientTextStyles } from './GradientText.styles'

const css = gradientTextStyles.cssText

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

describe('<moul-gradient-text>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('renders its text through a slot, with the gradient effect by default', async () => {
    const el = await fixture<MoulGradientText>(
      html`<moul-gradient-text>Ship faster</moul-gradient-text>`,
    )
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull()
    expect(el.textContent).toBe('Ship faster')
    expect(el.effect).toBe('gradient')
    expect(el.getAttribute('effect')).toBe('gradient')
  })

  it('takes the shine and aurora effects, and falls back to gradient for anything else', async () => {
    const el = await fixture<MoulGradientText>(
      html`<moul-gradient-text effect="shine">New</moul-gradient-text>`,
    )
    expect(el.effect).toBe('shine')
    el.effect = 'aurora'
    await el.updateComplete
    expect(el.getAttribute('effect')).toBe('aurora')
    el.setAttribute('effect', 'rainbow')
    await el.updateComplete
    expect(el.effect).toBe('gradient')
    expect(el.getAttribute('effect')).toBe('gradient')
  })

  it('paints the text with a clipped background that holds across line wraps', () => {
    expect(css).toContain('color: transparent')
    expect(css).toContain('-webkit-background-clip: text')
    expect(css).toContain('background-clip: text')
    expect(css).toContain('-webkit-box-decoration-break: clone')
    expect(css).toContain('box-decoration-break: clone')
    expect(css).toMatch(
      /@supports \(background-clip: text\) or \(-webkit-background-clip: text\)/,
    )
  })

  it('takes its default colours from tokens, first and last the same', () => {
    expect(css).toMatch(
      /--gradient-text-colors,\s*var\(--color-accent\),\s*var\(--color-chart-3\),\s*var\(--color-chart-5\),\s*var\(--color-accent\)/,
    )
    expect(css).toContain(
      'linear-gradient(var(--_gradient-direction), var(--_gradient-colors))',
    )
    expect(css).toMatch(
      /--gradient-text-shine-base,\s*color-mix\(in oklab, var\(--color-fg\)/,
    )
    expect(css).toContain(
      '--_gradient-shine-color: var(--gradient-text-shine-color, var(--color-fg))',
    )
  })

  it('has an animation for each effect, timed by --gradient-text-duration', () => {
    for (const effect of ['flow', 'shine', 'aurora']) {
      expect(css).toContain(`@keyframes moul-gradient-text-${effect}`)
      expect(css).toMatch(
        new RegExp(
          `animation: moul-gradient-text-${effect} var\\(--gradient-text-duration, \\d+s\\)`,
        ),
      )
    }
  })

  it('flows and sweeps the other way in right-to-left text', () => {
    expect(css).toMatch(
      /:host\(:dir\(rtl\)\) \{[^}]*--_gradient-direction: to left;[^}]*--_gradient-shine-from: 200% 0;/,
    )
  })

  it('pauses its animation while off screen and resumes it on return', async () => {
    const el = await fixture<MoulGradientText>(
      html`<moul-gradient-text>Ship faster</moul-gradient-text>`,
    )
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]

    io.leave(el)
    expect(animation.playState).toBe('paused')
    io.enter(el)
    expect(animation.playState).toBe('running')
  })

  it('stops watching the viewport when removed, leaving nothing paused', async () => {
    const el = await fixture<MoulGradientText>(
      html`<moul-gradient-text>Ship faster</moul-gradient-text>`,
    )
    const animation = fakeAnimation()
    el.getAnimations = () => [animation as unknown as Animation]
    io.leave(el)
    expect(animation.playState).toBe('paused')

    el.remove()
    expect(io.targets).not.toContain(el)
    expect(animation.playState).toBe('running')
  })

  describe('keyboard and screen readers', () => {
    it('is ordinary text: not focusable, no role, nothing hidden', async () => {
      const el = await fixture<MoulGradientText>(
        html`<moul-gradient-text>Ship faster</moul-gradient-text>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(el.shadowRoot?.querySelector('[aria-hidden]')).toBeNull()
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
    })

    it('shows plain text where the system forces its colours, and on paper', () => {
      const block = mediaBlock('(forced-colors: active), print')
      expect(block).toBeDefined()
      expect(block).toContain('color: inherit !important')
      expect(block).toContain('background: none !important')
      expect(block).toContain('background-clip: border-box !important')
      expect(block).toContain('animation: none !important')
    })
  })

  describe('reduced motion', () => {
    it('stops every animation, leaving a still gradient', () => {
      const block = mediaBlock('(prefers-reduced-motion: reduce)')
      expect(block).toBeDefined()
      expect(block).toContain('animation: none !important')
    })

    it('rests the shine band out of sight, so a still shine shows no band', () => {
      expect(css).toMatch(
        /:host\(\[effect="shine"\]\) \{[^}]*background-position:\s*var\(--_gradient-shine-from\),\s*0 0;/,
      )
      expect(css).toMatch(/:host \{[^}]*--_gradient-shine-from: -100% 0;/)
    })
  })
})
