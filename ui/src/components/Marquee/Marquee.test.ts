import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
  mockReducedMotion,
  triggerResize,
} from '../../test-setup'
import './Marquee'
import type { MoulMarquee } from './Marquee'
import { marqueeStyles } from './Marquee.styles'

/** Lets queued microtasks (the copy rebuild) and the following render run. */
const settle = () => new Promise((resolve) => setTimeout(resolve))

const copiesOf = (el: Element) =>
  [...el.children].filter((child) => child.hasAttribute('data-marquee-copy'))

const originalsOf = (el: Element) =>
  [...el.children].filter((child) => !child.hasAttribute('data-marquee-copy'))

const shadow = (el: MoulMarquee) => el.shadowRoot as ShadowRoot

const track = (el: MoulMarquee) =>
  shadow(el).querySelector('[part="track"]') as HTMLElement

const firstGroup = (el: MoulMarquee) =>
  shadow(el).querySelector('[part="group"]') as HTMLElement

const css = marqueeStyles.cssText

/** The body of the first `@media` block whose query contains `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media (${query})`)
  if (start < 0) return ''
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index++) {
    if (css[index] === '{') depth++
    else if (css[index] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, index)
    }
  }
  return ''
}

describe('<moul-marquee>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
    vi.restoreAllMocks()
  })

  it('renders the items in a group inside a track', async () => {
    const el = await fixture<MoulMarquee>(
      html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
    )
    expect(track(el)).not.toBeNull()
    const slot = firstGroup(el).querySelector('slot:not([name])')
    expect(slot).not.toBeNull()
    expect(originalsOf(el).map((item) => item.textContent)).toEqual([
      'Ash',
      'Birch',
    ])
    expect(el.direction).toBe('start')
    expect(el.speed).toBe(40)
  })

  describe('copies', () => {
    it('makes one set of light-DOM copies before it has measured, each hidden and inert', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee
          ><span>Ash</span><a href="#birch">Birch</a></moul-marquee
        >`,
      )
      const copies = copiesOf(el)
      expect(copies.map((copy) => copy.textContent)).toEqual(['Ash', 'Birch'])
      for (const copy of copies) {
        expect(copy.getAttribute('slot')).toBe('copy-1')
        expect(copy.getAttribute('aria-hidden')).toBe('true')
        expect(copy.hasAttribute('inert')).toBe(true)
      }
      const groups = shadow(el).querySelectorAll('[part="group"]')
      expect(groups).toHaveLength(2)
      expect(groups[1].querySelector('slot')?.getAttribute('name')).toBe(
        'copy-1',
      )
    })

    it('makes enough sets to cover the host once more', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
      )
      triggerResize(firstGroup(el), { width: 300, height: 40 })
      triggerResize(el, { width: 1000, height: 40 })
      await settle()
      // ceil(1000 / 300) = 4 sets of two items.
      expect(copiesOf(el)).toHaveLength(8)
      const names = [...shadow(el).querySelectorAll('slot[name]')].map((slot) =>
        slot.getAttribute('name'),
      )
      expect(names).toEqual(['copy-1', 'copy-2', 'copy-3', 'copy-4'])
      expect(
        copiesOf(el)
          .filter((copy) => copy.getAttribute('slot') === 'copy-4')
          .map((copy) => copy.textContent),
      ).toEqual(['Ash', 'Birch'])

      // A wide group needs only the minimum of one set.
      triggerResize(firstGroup(el), { width: 2400, height: 40 })
      await settle()
      expect(copiesOf(el)).toHaveLength(2)
    })

    it('starts every group afresh, together, when the number of sets changes', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const before = firstGroup(el)
      triggerResize(before, { width: 300, height: 40 })
      triggerResize(el, { width: 1000, height: 40 })
      await settle()
      const after = firstGroup(el)
      // New group elements start their animations at the same moment.
      expect(after).not.toBe(before)
      expect(after.querySelector('slot:not([name])')).not.toBeNull()

      // The new first group is the one measured now.
      triggerResize(after, { width: 500, height: 40 })
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '12500ms',
      )
      await settle()
      // ceil(1000 / 500) = 2 sets.
      expect(copiesOf(el)).toHaveLength(2)
    })

    it('rebuilds the copies when the items change', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const added = document.createElement('span')
      added.textContent = 'Cedar'
      el.append(added)
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual([
        'Ash',
        'Cedar',
      ])

      // Text changing inside an item counts too.
      ;(originalsOf(el)[0] as HTMLElement).textContent = 'Alder'
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual([
        'Alder',
        'Cedar',
      ])

      originalsOf(el)[1].remove()
      await settle()
      expect(copiesOf(el).map((copy) => copy.textContent)).toEqual(['Alder'])
    })

    it('leaves the copies alone when only the host or a copy changes', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span></moul-marquee>`,
      )
      const before = copiesOf(el)[0]
      el.isPaused = true
      el.fadeEdges = true
      await settle()
      expect(copiesOf(el)[0]).toBe(before)
      before.setAttribute('title', 'changed')
      await settle()
      expect(copiesOf(el)[0]).toBe(before)
    })

    it('strips ids from the copies so they never clash with the originals', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee
          ><div id="logo-a"><svg><g id="mark"></g></svg></div></moul-marquee
        >`,
      )
      const [copy] = copiesOf(el)
      expect(copy.hasAttribute('id')).toBe(false)
      expect(copy.querySelector('[id]')).toBeNull()
      expect(el.querySelectorAll('#logo-a')).toHaveLength(1)
    })

    it('copies only elements, and makes none for an empty marquee', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee>Just text</moul-marquee>`,
      )
      expect(copiesOf(el)).toHaveLength(0)
      expect(shadow(el).querySelectorAll('[part="group"]')).toHaveLength(1)
    })

    it('removes every copy on disconnect and makes them again on reconnect', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>Ash</span><span>Birch</span></moul-marquee>`,
      )
      const parent = el.parentElement as HTMLElement
      el.remove()
      expect(copiesOf(el)).toHaveLength(0)
      expect(originalsOf(el)).toHaveLength(2)

      parent.append(el)
      await settle()
      expect(copiesOf(el)).toHaveLength(2)
    })
  })

  describe('direction and speed', () => {
    it('reflects direction and falls back to start for an unknown value', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee direction="up"><span>A</span></moul-marquee>`,
      )
      expect(el.getAttribute('direction')).toBe('up')
      el.setAttribute('direction', 'sideways')
      await el.updateComplete
      expect(el.direction).toBe('start')
      expect(el.getAttribute('direction')).toBe('start')
    })

    it('moves toward the inline start, swaps sides in RTL, and reverses for end and down', () => {
      expect(css).toMatch(/:host\(:dir\(rtl\)\)\s*\{[^}]*--_marquee-sign: 1/)
      expect(css).toMatch(
        /translate: calc\(var\(--_marquee-sign\) \* \(100% \+ var\(--_marquee-gap\)\)\) 0/,
      )
      expect(css).toMatch(
        /:host\(\[direction="end"\]\) \.group,\s*:host\(\[direction="down"\]\) \.group\s*\{\s*animation-direction: reverse/,
      )
      expect(css).toMatch(/translate: 0 calc\(-100% - var\(--_marquee-gap\)\)/)
      expect(css).toContain('animation-name: moul-marquee-column')
      expect(css).toContain('--marquee-gap, var(--spacing-8, 2rem)')
    })

    it('sets the duration from the group length, the gap and the speed', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      // A default duration holds until the first measurement.
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe('')
      expect(css).toContain('var(--_marquee-duration, 20s)')

      triggerResize(firstGroup(el), { width: 300, height: 40 })
      // (300 px + 0 px gap) / 40 px per second
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '7500ms',
      )

      el.speed = 100
      await el.updateComplete
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '3000ms',
      )

      el.speed = -5
      await el.updateComplete
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '7500ms',
      )
    })

    it('counts the gap in the distance of one loop', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      const real = window.getComputedStyle
      vi.spyOn(window, 'getComputedStyle').mockImplementation(
        (target: Element) =>
          target === track(el)
            ? ({ columnGap: '32px', rowGap: '32px' } as CSSStyleDeclaration)
            : real(target),
      )
      triggerResize(firstGroup(el), { width: 288, height: 40 })
      // (288 + 32) / 40 = 8 seconds
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '8000ms',
      )
    })

    it('never takes its length from its content, so copies cannot lengthen it', () => {
      expect(css).toMatch(
        /:host\s*\{[^}]*inline-size: 100%;[^}]*contain: inline-size/,
      )
      expect(css).toMatch(
        /:host\(\[direction="up"\]\),\s*:host\(\[direction="down"\]\)\s*\{\s*contain: size/,
      )
    })

    it('measures heights in a column', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee direction="up" speed="20"
          ><span>A</span></moul-marquee
        >`,
      )
      triggerResize(firstGroup(el), { width: 300, height: 100 })
      expect(track(el).style.getPropertyValue('--_marquee-duration')).toBe(
        '5000ms',
      )
      triggerResize(el, { width: 300, height: 450 })
      await settle()
      // ceil(450 / 100) = 5 sets.
      expect(copiesOf(el)).toHaveLength(5)
    })
  })

  describe('pausing', () => {
    it('pauses while off screen and runs while on screen', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      io.enter(el)
      await el.updateComplete
      expect(track(el).classList.contains('is-offscreen')).toBe(false)
      io.leave(el)
      await el.updateComplete
      expect(track(el).classList.contains('is-offscreen')).toBe(true)
      expect(css).toMatch(
        /\.is-offscreen \.group\s*\{\s*animation-play-state: paused/,
      )
    })

    it('pauses with is-paused, on hover with pause-on-hover, and whenever focus is inside', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><span>A</span></moul-marquee>`,
      )
      el.isPaused = true
      el.pauseOnHover = true
      await el.updateComplete
      expect(el.hasAttribute('is-paused')).toBe(true)
      expect(el.hasAttribute('pause-on-hover')).toBe(true)
      const rule =
        /:host\(\[is-paused\]\) \.group,\s*:host\(\[pause-on-hover\]:hover\) \.group,\s*:host\(:focus-within\) \.group,\s*\.is-offscreen \.group\s*\{\s*animation-play-state: paused/
      expect(css).toMatch(rule)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role; the copies are hidden and inert', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><a href="#a">Alpha</a></moul-marquee>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      const [original] = originalsOf(el)
      expect(original.hasAttribute('aria-hidden')).toBe(false)
      expect(original.hasAttribute('inert')).toBe(false)
      const [copy] = copiesOf(el) as HTMLElement[]
      expect(copy.inert).toBe(true)
      expect(copy.getAttribute('aria-hidden')).toBe('true')
    })

    it('stops at its start and scrolls the focused item into view on keyboard focus', async () => {
      const el = await fixture<MoulMarquee>(
        html`<div>
          <moul-marquee
            ><a href="#a">Alpha</a><a href="#b">Beta</a></moul-marquee
          >
          <button>After</button>
        </div>`,
      ).then((wrapper) => wrapper.querySelector('moul-marquee') as MoulMarquee)
      const [, beta] = originalsOf(el) as HTMLElement[]
      triggerResize(track(el), { width: 400, height: 40 })
      triggerResize(beta, { width: 80, height: 40, left: 450 })
      const scrollBy = vi.fn()
      track(el).scrollBy = scrollBy as unknown as HTMLElement['scrollBy']

      beta.focus()
      await el.updateComplete
      await settle()
      expect(track(el).classList.contains('is-browsing')).toBe(true)
      // The item ends at 530, the track at 400.
      expect(scrollBy).toHaveBeenCalledWith({ left: 130 })

      const after = el.parentElement?.querySelector('button') as HTMLElement
      after.focus()
      await el.updateComplete
      expect(track(el).classList.contains('is-browsing')).toBe(false)
    })

    it('only pauses, without jumping, when a pointer puts focus inside', async () => {
      const el = await fixture<MoulMarquee>(
        html`<moul-marquee><a href="#a">Alpha</a></moul-marquee>`,
      )
      const [alpha] = originalsOf(el) as HTMLElement[]
      // A mouse click focuses without :focus-visible.
      const matches = alpha.matches.bind(alpha)
      vi.spyOn(alpha, 'matches').mockImplementation((selector: string) =>
        selector === ':focus-visible' ? false : matches(selector),
      )
      alpha.focus()
      await el.updateComplete
      expect(track(el).classList.contains('is-browsing')).toBe(false)
    })

    it('lets the browsing row scroll with no animation and no fade', () => {
      const block = mediaBlock('prefers-reduced-motion: no-preference')
      expect(block).toMatch(/\.track\.is-browsing\s*\{\s*overflow: auto hidden/)
      expect(block).toMatch(
        /\.track\.is-browsing \.group\s*\{\s*animation: none/,
      )
      expect(block).toMatch(
        /\.track\.is-browsing\s*\{\s*-webkit-mask-image: none/,
      )
    })
  })

  describe('fade edges', () => {
    it('masks both ends along the direction of travel', () => {
      expect(css).toMatch(
        /:host\(\[fade-edges\]\) \.track\s*\{[^}]*mask-image: linear-gradient\(\s*to right/,
      )
      expect(css).toMatch(
        /:host\(\[fade-edges\]\[direction="up"\]\) \.track,[^{]*\{[^}]*mask-image: linear-gradient\(\s*to bottom/,
      )
    })
  })

  describe('reduced motion', () => {
    it('makes no copies, and makes them once motion is allowed again', async () => {
      const motion = mockReducedMotion(true)
      try {
        const el = await fixture<MoulMarquee>(
          html`<moul-marquee><span>A</span><span>B</span></moul-marquee>`,
        )
        expect(copiesOf(el)).toHaveLength(0)
        expect(shadow(el).querySelectorAll('[part="group"]')).toHaveLength(1)

        motion.set(false)
        await settle()
        expect(copiesOf(el)).toHaveLength(2)

        motion.set(true)
        await settle()
        expect(copiesOf(el)).toHaveLength(0)

        el.remove()
        expect(motion.listenerCount()).toBe(0)
      } finally {
        motion.restore()
      }
    })

    it('stops the movement, hides the copies and lets the row scroll by hand', () => {
      const block = mediaBlock('prefers-reduced-motion: reduce')
      expect(block).toContain('animation: none !important')
      expect(block).toMatch(/\.group\.copy\s*\{\s*display: none/)
      expect(block).toMatch(/\.track\s*\{\s*overflow: auto hidden/)
      expect(block).toMatch(/\.track\s*\{\s*overflow: hidden auto/)
      expect(block).toContain('mask-image: none')
    })
  })
})
