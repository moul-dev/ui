import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './index'
import { findScrollRoot } from '../../utils/scroll-root'
import type { MoulStickyStack } from './StickyStack'
import { stickyStackStyles } from './StickyStack.styles'
import { stackRanges } from './sticky-stack-layout'

const settle = () => new Promise((resolve) => setTimeout(resolve))

const stackEl = (el: MoulStickyStack) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="stack"]') as HTMLElement
const cards = (el: MoulStickyStack) => [...el.children] as HTMLElement[]
const prop = (child: Element, name: string) =>
  (child as HTMLElement).style.getPropertyValue(name)

function rect(top: number, height: number): DOMRect {
  return {
    top,
    left: 0,
    width: 400,
    height,
    right: 400,
    bottom: top + height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

/** Three 200px cards, 32px apart, sticking at 16px, 32px and 48px; the host top at `hostTop` on screen. */
function layOut(el: MoulStickyStack, hostTop: number): void {
  for (const [index, card] of cards(el).entries()) {
    Object.defineProperty(card, 'offsetHeight', {
      configurable: true,
      get: () => 200,
    })
    card.style.top = `${16 + index * 16}px`
  }
  stackEl(el).style.rowGap = '32px'
  Object.defineProperty(el, 'offsetHeight', {
    configurable: true,
    get: () => 664,
  })
  el.getBoundingClientRect = () => rect(hostTop, 664)
  stackEl(el).getBoundingClientRect = () => rect(hostTop, 664)
}

async function stack() {
  const el = await fixture<MoulStickyStack>(
    html`<moul-sticky-stack>
      <article>Angkor</article>
      <article>Kampot</article>
      <article><button>Kep</button></article>
    </moul-sticky-stack>`,
  )
  await settle()
  return el
}

describe('stackRanges', () => {
  // Three 200px cards, 32px apart, sticking 16px lower each: tops at 0, 232 and 464.
  const children = [
    { top: 0, height: 200, stuck: 16 },
    { top: 232, height: 200, stuck: 32 },
    { top: 464, height: 200, stuck: 48 },
  ]

  it('sticks each child once its top reaches its sticky offset', () => {
    const ranges = stackRanges(children, 800, 664)
    expect(ranges.map((range) => range.stick)).toEqual([-16, 200, 416])
  })

  it('starts a shrink when the next child meets the bottom of this one', () => {
    const ranges = stackRanges(children, 800, 664)
    // Card 1's top (232 - offset) meets card 0's bottom (16 + 200) at offset 16.
    expect(ranges[0].start).toBe(16)
    expect(ranges[1].start).toBe(232 + 232 - 200 - 32)
  })

  it('maps the shrink to view-timeline progress, ending as the last child sticks', () => {
    const [first] = stackRanges(children, 800, 664)
    const toProgress = (offset: number) => (offset + 800) / (800 + 664)
    expect(first.from).toBeCloseTo(toProgress(16), 3)
    expect(1 / first.span).toBeCloseTo(toProgress(416) - toProgress(16), 3)
  })

  it('shrinks the bottom card most and leaves the top card alone', () => {
    const ranges = stackRanges(children, 800, 664)
    expect(ranges.map((range) => range.depth)).toEqual([1, 0.5, 0])
    expect(ranges[2].span).toBe(0)
  })

  it('jumps rather than divides by zero when a shrink has no length', () => {
    const ranges = stackRanges(
      // A step taller than the card: the next one sticks before it can cover this one.
      [
        { top: 0, height: 10, stuck: 0 },
        { top: 10, height: 10, stuck: 50 },
      ],
      800,
      20,
    )
    expect(Number.isFinite(ranges[0].span)).toBe(true)
    expect(ranges[0].span).toBeGreaterThan(1000)
  })

  it('handles an empty stack', () => {
    expect(stackRanges([], 800, 0)).toEqual([])
  })
})

describe('findScrollRoot', () => {
  afterEach(() => fixtureCleanup())

  it('finds the nearest box that scrolls, across slots', async () => {
    const box = await fixture<HTMLDivElement>(
      html`<div style="overflow-y: auto; height: 200px">
        <moul-sticky-stack><article>One</article></moul-sticky-stack>
      </div>`,
    )
    const el = box.querySelector('moul-sticky-stack') as MoulStickyStack
    expect(findScrollRoot(el)).toBe(box)
    expect(findScrollRoot(el.querySelector('article') as Element)).toBe(box)
  })

  it('returns null for the page', async () => {
    const el = await fixture<MoulStickyStack>(
      html`<moul-sticky-stack><article>One</article></moul-sticky-stack>`,
    )
    expect(findScrollRoot(el)).toBeNull()
  })
})

describe('<moul-sticky-stack>', () => {
  let frames: ManualFrames
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    fixtureCleanup()
    frames.restore()
    motion.restore()
    vi.restoreAllMocks()
  })

  it('renders its children in a stack part and adds no role', async () => {
    const el = await stack()
    expect(customElements.get('moul-sticky-stack')).toBeDefined()
    expect(stackEl(el).querySelector('slot')).not.toBeNull()
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('tabindex')).toBe(false)
  })

  it('numbers the children so each sticks one step lower', async () => {
    const el = await stack()
    expect(
      cards(el).map((card) => prop(card, '--_sticky-stack-index')),
    ).toEqual(['0', '1', '2'])
  })

  it('renumbers when children change, and cleans up a removed child', async () => {
    const el = await stack()
    const [first] = cards(el)
    first.remove()
    await settle()
    expect(prop(first, '--_sticky-stack-index')).toBe('')
    expect(
      cards(el).map((card) => prop(card, '--_sticky-stack-index')),
    ).toEqual(['0', '1'])
  })

  it('writes each child its shrink range once laid out, deepest first', async () => {
    const el = await stack()
    layOut(el, 0)
    frames.step(16)
    // A slotchange or resize schedules the measure on the next frame.
    el.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('resize'))
    frames.step(32)
    expect(
      cards(el).map((card) => prop(card, '--_sticky-stack-depth')),
    ).toEqual(['1', '0.5', '0'])
    expect(Number(prop(cards(el)[0], '--_sticky-stack-span'))).toBeGreaterThan(
      0,
    )
    expect(prop(cards(el)[2], '--_sticky-stack-span')).toBe('0')
  })

  it('clamps min-scale between 0.5 and 1 and hands it to the styles', async () => {
    const el = await stack()
    expect(el.style.getPropertyValue('--_sticky-stack-min-scale')).toBe('0.9')
    el.minScale = 0.2
    await el.updateComplete
    expect(el.minScale).toBe(0.5)
    el.minScale = Number.NaN
    await el.updateComplete
    expect(el.minScale).toBe(0.9)
    el.setAttribute('min-scale', '0.95')
    await el.updateComplete
    expect(el.style.getPropertyValue('--_sticky-stack-min-scale')).toBe('0.95')
  })

  it('removes its variables from the children when it disconnects', async () => {
    const el = await stack()
    const children = cards(el)
    el.remove()
    for (const card of children) {
      expect(prop(card, '--_sticky-stack-index')).toBe('')
      expect(prop(card, '--_sticky-stack-from')).toBe('')
    }
  })

  it('numbers the children again when it is moved', async () => {
    const el = await stack()
    const parent = el.parentElement as HTMLElement
    el.remove()
    parent.append(el)
    expect(
      cards(el).map((card) => prop(card, '--_sticky-stack-index')),
    ).toEqual(['0', '1', '2'])
  })

  it('follows its view timeline with the script fallback where there is no native one', async () => {
    const el = await stack()
    el.getBoundingClientRect = () => rect(-300, 664)
    window.dispatchEvent(new Event('scroll'))
    frames.step(16)
    const progress = Number(
      el.style.getPropertyValue('--_sticky-stack-progress'),
    )
    expect(progress).toBeCloseTo(
      (window.innerHeight + 300) / (window.innerHeight + 664),
      3,
    )
  })

  it('gives the cards layers only while the stack is near the screen', async () => {
    const io = mockIntersectionObserver()
    try {
      const el = await stack()
      expect(stackEl(el).classList.contains('near')).toBe(false)
      io.enter(el)
      await el.updateComplete
      expect(stackEl(el).classList.contains('near')).toBe(true)
    } finally {
      io.restore()
    }
  })

  describe('keyboard and screen readers', () => {
    it('scrolls back to a covered card when keyboard focus moves into it', async () => {
      const el = await stack()
      layOut(el, -500)
      window.dispatchEvent(new Event('resize'))
      frames.step(16)
      const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
      const button = el.querySelector('button') as HTMLButtonElement
      // Focus inside the top card: it is never covered.
      button.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, composed: true }),
      )
      expect(scrollBy).not.toHaveBeenCalled()

      const first = cards(el)[0]
      const link = document.createElement('a')
      link.href = '#angkor'
      link.textContent = 'Angkor'
      first.append(link)
      link.matches = ((selector: string) =>
        selector === ':focus-visible') as typeof link.matches
      link.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, composed: true }),
      )
      expect(scrollBy).toHaveBeenCalledTimes(1)
      const options = scrollBy.mock.calls[0][0] as ScrollToOptions
      // The host is 500px above the top; the first card sticks at offset -16.
      expect(options.top).toBe(-16 - 500)
      expect(options.behavior).toBe('smooth')
    })

    it('leaves the scroll alone when focus comes from a pointer', async () => {
      const el = await stack()
      layOut(el, -500)
      window.dispatchEvent(new Event('resize'))
      frames.step(16)
      const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
      const first = cards(el)[0]
      first.tabIndex = 0
      first.matches = (() => false) as typeof first.matches
      first.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, composed: true }),
      )
      expect(scrollBy).not.toHaveBeenCalled()
    })
  })

  describe('reduced motion', () => {
    it('keeps the cards sticking but stops them shrinking and dimming', () => {
      const text = stickyStackStyles.cssText
      const start = text.indexOf('@media (prefers-reduced-motion')
      const block = text.slice(start, text.indexOf('@media print'))
      expect(block).toMatch(/scale:\s*none/)
      expect(block).toMatch(/filter:\s*none/)
      expect(block).not.toMatch(/position:\s*static/)
    })

    it('jumps instead of gliding back to a covered card', async () => {
      motion.set(true)
      const el = await stack()
      layOut(el, -500)
      window.dispatchEvent(new Event('resize'))
      frames.step(16)
      const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
      const first = cards(el)[0]
      first.tabIndex = 0
      first.matches = ((selector: string) =>
        selector === ':focus-visible') as typeof first.matches
      first.dispatchEvent(
        new FocusEvent('focusin', { bubbles: true, composed: true }),
      )
      expect((scrollBy.mock.calls[0][0] as ScrollToOptions).behavior).toBe(
        'auto',
      )
    })
  })
})
