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
import './GlowBorder'
import { glowAngle, type MoulGlowBorder } from './GlowBorder'
import { glowBorderStyles } from './GlowBorder.styles'

/** The stylesheet without its comments. */
const css = glowBorderStyles.cssText.replace(/\/\*[\s\S]*?\*\//g, '')

/** The body of the first block (`@media`, `@supports`) whose prelude starts with `prelude`. */
function block(prelude: string): string {
  const start = css.indexOf(prelude)
  if (start < 0) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

const RECT = { left: 100, top: 100, width: 200, height: 100 }

/** Puts the box at RECT on screen, for the pointer controller and the size it reads. */
function place(el: MoulGlowBorder): void {
  el.getBoundingClientRect = () =>
    ({
      ...RECT,
      x: RECT.left,
      y: RECT.top,
      right: RECT.left + RECT.width,
      bottom: RECT.top + RECT.height,
      toJSON: () => ({}),
    }) as DOMRect
  Object.defineProperty(el, 'offsetWidth', {
    configurable: true,
    get: () => RECT.width,
  })
  Object.defineProperty(el, 'offsetHeight', {
    configurable: true,
    get: () => RECT.height,
  })
}

function move(clientX: number, clientY: number, pointerType = 'mouse'): void {
  window.dispatchEvent(
    new PointerEvent('pointermove', { clientX, clientY, pointerType }),
  )
}

const glow = (el: MoulGlowBorder) =>
  el.shadowRoot?.querySelector('.glow') as HTMLElement
const angleOf = (el: MoulGlowBorder) =>
  Number.parseFloat(glow(el).style.getPropertyValue('--moul-glow-border-angle'))
const intensityOf = (el: MoulGlowBorder) =>
  Number(glow(el).style.getPropertyValue('--_glow-border-intensity') || 0)

describe('glowAngle', () => {
  it('measures clockwise from the top', () => {
    expect(glowAngle(0, -10)).toBe(0)
    expect(glowAngle(10, 0)).toBe(90)
    expect(glowAngle(0, 10)).toBe(180)
    expect(glowAngle(-10, 0)).toBe(270)
  })

  it('takes the short way round from the previous angle', () => {
    // From just left of the top to just right of it: 20 degrees on, not 340 back.
    expect(glowAngle(10, -100, 354)).toBeCloseTo(365.71, 1)
    expect(glowAngle(-10, -100, 5)).toBeCloseTo(-5.71, 1)
    expect(glowAngle(0, 10, 720)).toBe(540)
  })
})

describe('<moul-glow-border>', () => {
  let io: IntersectionMock
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
    frames = manualAnimationFrames()
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
    frames.restore()
    io.restore()
  })

  async function mount(
    markup = html`<moul-glow-border><p>Pro plan</p></moul-glow-border>`,
  ) {
    const el = await fixture<MoulGlowBorder>(markup)
    place(el)
    return el
  }

  it('renders its content through a slot, with a hidden ring after it', async () => {
    const el = await mount()
    const slot = el.shadowRoot?.querySelector('slot')
    expect(slot?.assignedElements().map((node) => node.textContent)).toEqual([
      'Pro plan',
    ])
    const ring = el.shadowRoot?.querySelector('[part="border"]') as HTMLElement
    expect(ring).not.toBeNull()
    expect(glow(el).getAttribute('aria-hidden')).toBe('true')
    // The ring comes after the content, so it paints over the content's edge.
    expect(slot?.compareDocumentPosition(ring)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(el.shadowRoot?.querySelector('[part="halo"]')).toBeNull()
  })

  it('has the documented defaults and writes the spread and blur on the light', async () => {
    const el = await mount()
    expect(el.proximity).toBe(64)
    expect(el.spread).toBe(80)
    expect(el.glowBlur).toBe(0)
    expect(glow(el).style.getPropertyValue('--_glow-border-spread')).toBe(
      '80deg',
    )
    el.spread = 120
    el.setAttribute('blur', '12')
    await el.updateComplete
    expect(el.glowBlur).toBe(12)
    expect(glow(el).style.getPropertyValue('--_glow-border-spread')).toBe(
      '120deg',
    )
    expect(glow(el).style.getPropertyValue('--_glow-border-blur')).toBe('12px')
    expect(el.shadowRoot?.querySelector('[part="halo"]')).not.toBeNull()
    el.spread = -5
    await el.updateComplete
    expect(glow(el).style.getPropertyValue('--_glow-border-spread')).toBe(
      '80deg',
    )
  })

  it('follows the pointer only once the box is on screen', async () => {
    const el = await mount()
    move(320, 150)
    expect(frames.pending).toBe(0)

    io.enter(el)
    move(320, 150)
    expect(frames.pending).toBe(1)
    frames.step(16)
    // To the right of the box: the arc sits on the right edge.
    expect(angleOf(el)).toBe(90)
    expect(intensityOf(el)).toBeGreaterThan(0)
  })

  it('lights fully over the box and fades out over the proximity distance', async () => {
    const el = await mount()
    io.enter(el)

    move(150, 110)
    frames.step(16)
    expect(intensityOf(el)).toBe(1)

    // 32px above the box, half of the 64px proximity.
    move(200, 68)
    frames.step(32)
    expect(intensityOf(el)).toBe(0.5)
    expect(angleOf(el) % 360).toBe(0)

    move(200, 20)
    frames.step(48)
    expect(intensityOf(el)).toBe(0)
    // Fading out never swings the arc round.
    expect(angleOf(el) % 360).toBe(0)

    el.proximity = 0
    move(200, 90)
    frames.step(64)
    expect(intensityOf(el)).toBe(0)
  })

  it('turns the short way round as the pointer crosses the top', async () => {
    const el = await mount()
    io.enter(el)
    move(150, 90)
    frames.step(16)
    const before = angleOf(el)
    expect(before).toBeGreaterThan(270)
    move(250, 90)
    frames.step(32)
    expect(angleOf(el)).toBeGreaterThan(360)
    expect(angleOf(el) - before).toBeLessThan(180)
  })

  it('ignores touch, and fades when the box leaves the screen or the pointer leaves the page', async () => {
    const el = await mount()
    io.enter(el)
    move(150, 110, 'touch')
    expect(frames.pending).toBe(0)

    move(150, 110)
    frames.step(16)
    expect(intensityOf(el)).toBe(1)
    window.dispatchEvent(
      new PointerEvent('pointerout', { relatedTarget: null }),
    )
    expect(intensityOf(el)).toBe(0)

    move(150, 110)
    frames.step(32)
    expect(intensityOf(el)).toBe(1)
    io.leave(el)
    expect(intensityOf(el)).toBe(0)
    move(160, 110)
    expect(frames.pending).toBe(0)
  })

  it('stays out of the way of assistive technology and the pointer', async () => {
    const el = await mount()
    expect(el.hasAttribute('tabindex')).toBe(false)
    expect(el.hasAttribute('role')).toBe(false)
    expect(css).toMatch(/\.glow\s*\{[^}]*pointer-events:\s*none/)
    expect(css).toMatch(/:host\(:empty\)\s*\{[^}]*pointer-events:\s*none/)
    expect(block('@media (forced-colors: active), print')).toMatch(
      /display:\s*none/,
    )
  })

  describe('keyboard and screen readers', () => {
    it('leaves the wrapped content in the tab order and the reading order', async () => {
      const el = await fixture<MoulGlowBorder>(
        html`<moul-glow-border><a href="#plan">Choose Pro</a></moul-glow-border>`,
      )
      const link = el.querySelector('a') as HTMLAnchorElement
      link.focus()
      expect(document.activeElement).toBe(link)
      // The only shadow content besides the slot is hidden from assistive technology.
      const exposed = [...(el.shadowRoot?.children ?? [])].filter(
        (child) =>
          child.localName !== 'style' &&
          child.localName !== 'slot' &&
          child.getAttribute('aria-hidden') !== 'true',
      )
      expect(exposed).toEqual([])
    })
  })

  describe('reduced motion', () => {
    it('does not follow the pointer, and lights the whole ring evenly on hover', async () => {
      motion.set(true)
      const el = await mount()
      io.enter(el)
      move(320, 150)
      frames.step(16)
      expect(glow(el).style.getPropertyValue('--moul-glow-border-angle')).toBe(
        '',
      )
      expect(intensityOf(el)).toBe(0)
      const reduced = block('@media (prefers-reduced-motion: reduce)')
      expect(reduced).toMatch(/transition:\s*none/)
      expect(reduced).toMatch(/:host\(:hover\) \.glow\s*\{\s*opacity:\s*1/)
      expect(reduced).toMatch(/linear-gradient\(/)
    })

    it('goes dark at once when the setting turns on mid-way', async () => {
      const el = await mount()
      io.enter(el)
      move(150, 110)
      frames.step(16)
      expect(intensityOf(el)).toBe(1)
      motion.set(true)
      expect(intensityOf(el)).toBe(0)
      move(160, 110)
      frames.step(32)
      expect(intensityOf(el)).toBe(0)
      motion.set(false)
      move(170, 110)
      frames.step(48)
      expect(intensityOf(el)).toBe(1)
    })
  })
})
