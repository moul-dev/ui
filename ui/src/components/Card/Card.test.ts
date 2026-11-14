import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import { parseCardEffects } from '../../utils/card-effects'
import './Card'
import type { MoulCard } from './Card'
import { cardStyles } from './Card.styles'

const css = cardStyles
  .map((sheet) => ('cssText' in sheet ? sheet.cssText : String(sheet)))
  .join('\n')

/** The effect styles alone: the last sheet of the card. */
const effectCss = String(cardStyles.at(-1))

/** The body of the first block whose whole prelude starts with `prelude`. */
function block(text: string, prelude: string): string {
  const escaped = prelude.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // After a closing brace or a comment, so `a, b {` is not found for `b {`.
  const match = new RegExp(`(?:^|[}/])\\s*${escaped}`).exec(text)
  if (!match) return ''
  const start = match.index
  const open = text.indexOf('{', start)
  let depth = 0
  for (let index = open; index < text.length; index++) {
    if (text[index] === '{') depth++
    else if (text[index] === '}' && --depth === 0) {
      return text.slice(open + 1, index)
    }
  }
  return ''
}

const layer = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector<HTMLElement>(`.card-${name}`) ?? null

function placeAt(
  el: Element,
  rect: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      x: rect.left,
      y: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    }) as DOMRect
}

function move(
  target: EventTarget,
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent('pointermove', {
      clientX,
      clientY,
      pointerType,
      bubbles: true,
      composed: true,
    }),
  )
}

function leave(target: EventTarget, pointerType = 'mouse'): void {
  target.dispatchEvent(new PointerEvent('pointerleave', { pointerType }))
}

describe('<moul-card> effect', () => {
  it('reads a space-separated list and ignores unknown names', () => {
    expect([...parseCardEffects('glow  spotlight sparkle glow')]).toEqual([
      'glow',
      'spotlight',
    ])
    expect(parseCardEffects('').size).toBe(0)
    expect(parseCardEffects(undefined).size).toBe(0)
  })

  it('renders no layers without an effect', async () => {
    const el = await fixture<MoulCard>(html`<moul-card>Plain</moul-card>`)
    expect(el.effect).toBeUndefined()
    expect(el.shadowRoot?.querySelector('[class^="card-"]')).toBeNull()
  })

  it('renders one hidden, empty layer per known effect, and reflects the attribute', async () => {
    const el = await fixture<MoulCard>(
      html`<moul-card effect="spotlight glow sparkle">Lit</moul-card>`,
    )
    expect(layer(el, 'spotlight')).not.toBeNull()
    expect(layer(el, 'glow')).not.toBeNull()
    expect(layer(el, 'glare')).toBeNull()

    el.effect = 'glare'
    await el.updateComplete
    expect(el.getAttribute('effect')).toBe('glare')
    expect(layer(el, 'spotlight')).toBeNull()
    expect(layer(el, 'glow')).toBeNull()
    expect(layer(el, 'glare')).not.toBeNull()
  })

  it('paints the spotlight under the content and the glare over it', async () => {
    const el = await fixture<MoulCard>(
      html`<moul-card effect="spotlight glare glow">Layers</moul-card>`,
    )
    const order = [...(el.shadowRoot?.children ?? [])]
      .map((child) => child.className || child.getAttribute('name') || 'slot')
      .filter((name) => name !== 'style')
    expect(order[0]).toBe('card-spotlight')
    expect(order.at(-1)).toBe('card-glare')
    // The light is behind the content, inside the card's own stacking context.
    expect(css).toMatch(/:host\(\[effect\]\)\s*\{\s*isolation: isolate/)
    expect(block(css, '.card-spotlight {')).toContain('z-index: -1')
    expect(block(css, '.card-glare {')).toContain('z-index: 2')
    expect(css).toMatch(
      /\.card-spotlight,\s*\.card-glare,\s*\.card-glow\s*\{[^}]*border-radius: inherit;[^}]*pointer-events: none/,
    )
  })

  describe('spotlight', () => {
    let frames: ManualFrames

    beforeEach(() => {
      frames = manualAnimationFrames()
    })

    afterEach(() => {
      frames.restore()
    })

    it('follows a mouse once per frame and writes the position on the light, not the host', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card effect="spotlight">Follow</moul-card>`,
      )
      const light = layer(el, 'spotlight') as HTMLElement
      placeAt(light, { left: 100, top: 50, width: 200, height: 100 })

      move(el, 120, 60)
      move(el, 130, 90)
      expect(frames.pending).toBe(1)
      frames.step(16)

      expect(light.hasAttribute('data-on')).toBe(true)
      expect(light.style.getPropertyValue('--_card-spotlight-x')).toBe('30px')
      expect(light.style.getPropertyValue('--_card-spotlight-y')).toBe('40px')
      expect(el.style.getPropertyValue('--_card-spotlight-x')).toBe('')

      // Leaving hides it where it was, so it fades out in place.
      leave(el)
      expect(light.hasAttribute('data-on')).toBe(false)
      expect(light.style.getPropertyValue('--_card-spotlight-x')).toBe('30px')
    })

    it('follows a pen but not a finger', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card effect="spotlight">Touch</moul-card>`,
      )
      const light = layer(el, 'spotlight') as HTMLElement
      placeAt(light, { left: 0, top: 0, width: 200, height: 100 })

      move(el, 10, 10, 'touch')
      expect(frames.pending).toBe(0)

      move(el, 10, 10, 'pen')
      frames.step(16)
      expect(light.hasAttribute('data-on')).toBe(true)
    })

    it('listens only while spotlight is in the list', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card effect="glow">No light</moul-card>`,
      )
      move(el, 10, 10)
      expect(frames.pending).toBe(0)

      el.effect = 'glow spotlight'
      await el.updateComplete
      move(el, 10, 10)
      expect(frames.pending).toBe(1)
      frames.step(16)

      el.effect = 'glow'
      await el.updateComplete
      move(el, 20, 20)
      expect(frames.pending).toBe(0)
    })

    it('stops listening when the card disconnects', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card effect="spotlight">Gone</moul-card>`,
      )
      move(el, 10, 10)
      el.remove()
      // The waiting frame is cancelled, and no new one is asked for.
      expect(frames.pending).toBe(0)
      move(el, 20, 20)
      expect(frames.pending).toBe(0)
    })
  })

  describe('glow', () => {
    let io: IntersectionMock

    beforeEach(() => {
      io = mockIntersectionObserver()
    })

    afterEach(() => {
      io.restore()
    })

    it('turns a gradient ring and an outer glow with a registered angle', () => {
      const glow = block(css, '.card-glow {')
      expect(glow).toContain(
        '--_card-glow-angle: var(--moul-card-glow-angle, 0deg)',
      )
      expect(glow).toMatch(
        /box-shadow:\s*calc\(cos\(var\(--_card-glow-angle\)\)/,
      )
      expect(glow).toContain(
        'animation: moul-card-glow-turn var(--card-glow-duration, 6s) linear',
      )
      const ring = block(css, '.card-glow::before {')
      expect(ring).toContain('padding: var(--card-glow-width, 1.5px)')
      expect(ring).toContain('conic-gradient(')
      expect(ring).toContain('mask-composite: exclude')
      expect(block(css, '@keyframes moul-card-glow-turn')).toContain(
        '--moul-card-glow-angle: 1turn',
      )
    })

    it('pauses while the card is off screen', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card effect="glow">Glow</moul-card>`,
      )
      const glow = layer(el, 'glow') as HTMLElement
      expect(io.targets).toContain(el)
      io.leave(el)
      expect(glow.hasAttribute('data-paused')).toBe(true)
      io.enter(el)
      expect(glow.hasAttribute('data-paused')).toBe(false)
      expect(css).toMatch(
        /\.card-glow\[data-paused\]\s*\{\s*animation-play-state: paused/,
      )

      el.effect = 'spotlight'
      await el.updateComplete
      expect(io.targets).not.toContain(el)
    })
  })

  describe('glare', () => {
    it('sweeps once under a fine pointer, and jumps back unseen', () => {
      const hover = block(
        css,
        '@media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
      )
      expect(hover).toMatch(
        /:host\(:hover\) \.card-glare::before\s*\{\s*translate: var\(--_card-glare-to\) 0;\s*transition: translate var\(--card-glare-duration, 700ms\)/,
      )
      // Only the hovered state has a transition, so the way back is instant.
      expect(block(css, '.card-glare::before {')).not.toContain('transition')
    })

    it('runs the other way on a right-to-left page', () => {
      const rtl = block(css, ':host(:dir(rtl)) .card-glare {')
      expect(rtl).toContain('--_card-glare-from: 100%')
      expect(rtl).toContain('--_card-glare-to: -100%')
    })
  })

  describe('keyboard and screen readers', () => {
    it('keeps the role, focusability and name of an interactive card', async () => {
      const el = await fixture<MoulCard>(
        html`<moul-card is-interactive effect="spotlight glare glow"
          >Open the report</moul-card
        >`,
      )
      expect(el.getAttribute('role')).toBe('button')
      expect(el.getAttribute('tabindex')).toBe('0')
      const layers = el.shadowRoot?.querySelectorAll('[class^="card-"]') ?? []
      expect(layers.length).toBe(3)
      for (const node of layers) {
        expect(node.getAttribute('aria-hidden')).toBe('true')
        expect(node.textContent).toBe('')
      }
      expect(el.textContent?.trim()).toBe('Open the report')
      el.focus()
      expect(document.activeElement).toBe(el)
    })

    it('shows the spotlight at the centre and sweeps the glare on keyboard focus', () => {
      const focus = block(
        css,
        ':host(:focus-visible) .card-spotlight:not([data-on])',
      )
      expect(focus).toContain('--_card-spotlight-at: 50% 50%')
      expect(focus).toContain('opacity: 1')
      expect(
        block(css, '@media (prefers-reduced-motion: no-preference) {'),
      ).toContain(':host(:focus-visible) .card-glare::before')
    })
  })

  describe('reduced motion', () => {
    let frames: ManualFrames
    let motion: ReducedMotionMock

    beforeEach(() => {
      frames = manualAnimationFrames()
    })

    afterEach(() => {
      frames.restore()
      motion?.restore()
    })

    it('shows the spotlight at the centre instead of following the pointer', async () => {
      motion = mockReducedMotion(true)
      const el = await fixture<MoulCard>(
        html`<moul-card effect="spotlight">Still</moul-card>`,
      )
      const light = layer(el, 'spotlight') as HTMLElement
      placeAt(light, { left: 0, top: 0, width: 200, height: 100 })
      move(el, 30, 40)
      frames.step(16)
      expect(light.hasAttribute('data-on')).toBe(true)
      expect(light.style.getPropertyValue('--_card-spotlight-x')).toBe('')
    })

    it('parks the spotlight at the centre when the setting turns on mid-way', async () => {
      motion = mockReducedMotion(false)
      const el = await fixture<MoulCard>(
        html`<moul-card effect="spotlight">Switch</moul-card>`,
      )
      const light = layer(el, 'spotlight') as HTMLElement
      placeAt(light, { left: 0, top: 0, width: 200, height: 100 })
      move(el, 30, 40)
      frames.step(16)
      expect(light.style.getPropertyValue('--_card-spotlight-x')).toBe('30px')
      motion.set(true)
      expect(light.style.getPropertyValue('--_card-spotlight-x')).toBe('')
      expect(light.hasAttribute('data-on')).toBe(true)
      el.remove()
      expect(motion.listenerCount()).toBe(0)
    })

    it('holds the glow still, shows the glare as a still sheen, and drops the fade', () => {
      const reduce = block(
        effectCss,
        '@media (prefers-reduced-motion: reduce) {',
      )
      expect(reduce).toMatch(/\.card-spotlight\s*\{\s*transition: none/)
      expect(reduce).toMatch(/\.card-glow\s*\{\s*animation: none/)
      expect(reduce).toMatch(
        /\.card-glare::before\s*\{\s*translate: none;\s*opacity: 0/,
      )
      expect(reduce).toMatch(
        /:host\(:focus-visible\) \.card-glare::before\s*\{\s*opacity: 1/,
      )
    })
  })

  it('hides every layer where colours are forced, and on paper', () => {
    const forced = block(css, '@media (forced-colors: active), print')
    expect(forced).toMatch(
      /\.card-spotlight,\s*\.card-glare,\s*\.card-glow\s*\{\s*display: none/,
    )
  })

  it('keeps the effects-entry controllers out of the main bundle', () => {
    for (const file of [
      resolve(__dirname, 'Card.ts'),
      resolve(__dirname, '../../utils/card-effects.ts'),
      resolve(__dirname, '../../styles/card-effects.styles.ts'),
    ]) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toMatch(
        /from '[^']*(?:pointer|in-view|scroll|drag|canvas-loop|text-split)\.controller'/,
      )
      expect(source).not.toMatch(/from '[^']*\/effects'/)
    }
  })
})
